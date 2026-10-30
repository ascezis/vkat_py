/**
 * вкат.py — Движок трёхслойной проверки кода ученика
 * Слой 1: Выполнение в Pyodide и проверка вывода / значений (включая tests[])
 * Слой 2: AST-анализ (проверка требуемых конструкций: циклы, функции, условия, forbid/require)
 * Слой 3: PEP8-линтер (отступы, длина строк, snake_case) — не блокирует переход!
 */

(function (window) {
  'use strict';

  let pyodideInstance = null;
  let isInitializing = false;
  let initPromise = null;

  function base64ToUint8Array(base64) {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  // Перехват fetch для отдачи встроенных локальных бинарников без сетевых/CORS запросов
  if (typeof window.fetch === 'function') {
    const nativeFetch = window.fetch;
    window.fetch = async function (input, init) {
      const url = typeof input === 'string' ? input : (input && input.url ? input.url : String(input));

      if (url.includes('python_stdlib.zip') && window.PYODIDE_STDLIB_BASE64) {
        const bytes = base64ToUint8Array(window.PYODIDE_STDLIB_BASE64);
        return new Response(bytes, {
          status: 200,
          statusText: 'OK',
          headers: { 'Content-Type': 'application/zip' }
        });
      }

      if (url.includes('pyodide-lock.json')) {
        const lockJson = JSON.stringify({
          info: { arch: 'wasm32', platform: 'emscripten', version: '0.26.4' },
          packages: {}
        });
        return new Response(lockJson, {
          status: 200,
          statusText: 'OK',
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (url.includes('pyodide.asm.wasm') && window.PYODIDE_WASM_BASE64) {
        const bytes = base64ToUint8Array(window.PYODIDE_WASM_BASE64);
        return new Response(bytes, {
          status: 200,
          statusText: 'OK',
          headers: { 'Content-Type': 'application/wasm' }
        });
      }

      return nativeFetch(input, init);
    };
  }

  /**
   * Инициализация Pyodide с локального пути
   */
  async function initPyodide(onProgress) {
    if (pyodideInstance) {
      return pyodideInstance;
    }
    if (initPromise) {
      return initPromise;
    }

    initPromise = (async () => {
      try {
        if (typeof window.loadPyodide !== 'function') {
          throw new Error('Скрипт pyodide.js не найден. Проверьте assets/pyodide/pyodide.js');
        }

        if (onProgress) onProgress('Загрузка Python-рантайма...');

        const pyodideConfig = {
          indexURL: 'assets/pyodide/',
          checkAPIVersion: false
        };

        // Если бинарник WASM загружен локально в JS, компилируем напрямую из памяти
        if (window.PYODIDE_WASM_BASE64) {
          pyodideConfig.instantiateWasm = function (imports, successCallback) {
            const wasmBytes = base64ToUint8Array(window.PYODIDE_WASM_BASE64);
            WebAssembly.instantiate(wasmBytes, imports)
              .then(result => {
                successCallback(result.instance, result.module);
              })
              .catch(err => {
                console.error('Ошибка компиляции WebAssembly:', err);
              });
            return {};
          };
        }

        const loadPromise = window.loadPyodide(pyodideConfig);

        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('Превышено время ожидания загрузки среды Python (60 сек).'));
          }, 60000);
        });

        const pyodide = await Promise.race([loadPromise, timeoutPromise]);

        // ── Инициализируем Python-хелперы в изолированном приватном модуле ──
        // Все checker-функции живут в sys.modules['_vkat_checker'], а не в __main__,
        // поэтому студенческий код не может их перезаписать через sys.modules['__main__'].
        await pyodide.runPythonAsync(`
import sys as _sys
import io as _io
import ast as _ast
import json as _json
import traceback as _traceback
import re as _re
import types as _types
import builtins as _builtins_mod

# ── Создаём приватный модуль для хранения checker-логики ──────────────────
_checker_mod = _types.ModuleType('_vkat_checker')
_checker_mod.__package__ = '_vkat_checker'
_sys.modules['_vkat_checker'] = _checker_mod

# ── Список модулей, запрещённых для студенческого кода ────────────────────
_BLOCKED_IMPORTS = frozenset([
    'sys', 'js', 'importlib', 'importlib.util', 'importlib.machinery',
    'builtins', 'ctypes', 'gc', 'signal', 'subprocess', 'os',
    'posix', 'nt', 'sysconfig', '_thread', 'threading',
    'socket', 'ssl', 'http', 'urllib', 'ftplib',
    '_vkat_checker',
])

# ── Ограниченный __import__ для пространства имён студента ───────────────
def _student_import(name, globals=None, locals=None, fromlist=(), level=0):
    top = name.split('.')[0]
    if top in _BLOCKED_IMPORTS or name in _BLOCKED_IMPORTS:
        raise ImportError(
            f"Импорт '{name}' недоступен в учебном окружении."
        )
    return _builtins_mod.__import__(name, globals, locals, fromlist, level)

# ── Безопасный набор встроенных функций для студенческого кода ────────────
_SAFE_BUILTINS = {
    k: getattr(_builtins_mod, k) for k in (
        'abs', 'all', 'any', 'ascii', 'bin', 'bool', 'breakpoint',
        'bytearray', 'bytes', 'callable', 'chr', 'complex',
        'dict', 'dir', 'divmod', 'enumerate', 'filter',
        'float', 'format', 'frozenset', 'hasattr', 'hash',
        'help', 'hex', 'id', 'input', 'int', 'isinstance',
        'issubclass', 'iter', 'len', 'list', 'locals', 'map',
        'max', 'min', 'next', 'object', 'oct', 'ord', 'pow',
        'print', 'property', 'range', 'repr', 'reversed',
        'round', 'set', 'slice', 'sorted', 'staticmethod',
        'str', 'sum', 'super', 'tuple', 'type', 'zip',
        'ArithmeticError', 'AssertionError', 'AttributeError',
        'EOFError', 'Exception', 'FileNotFoundError', 'FloatingPointError',
        'GeneratorExit', 'IOError', 'ImportError', 'IndexError',
        'KeyError', 'KeyboardInterrupt', 'LookupError', 'MemoryError',
        'ModuleNotFoundError', 'NameError', 'NotImplementedError',
        'OSError', 'OverflowError', 'RecursionError', 'RuntimeError',
        'StopIteration', 'StopAsyncIteration', 'SyntaxError', 'SystemExit',
        'TypeError', 'UnboundLocalError', 'UnicodeDecodeError',
        'UnicodeEncodeError', 'UnicodeError', 'ValueError', 'ZeroDivisionError',
        'True', 'False', 'None',
        'NotImplemented', 'Ellipsis',
        'copyright', 'credits', 'license',
    ) if hasattr(_builtins_mod, k)
}
_SAFE_BUILTINS['__import__'] = _student_import
_SAFE_BUILTINS['__name__'] = '__student__'
_SAFE_BUILTINS['__doc__'] = None

# ── Функции анализа / проверки кода (размещаются в _checker_mod) ──────────

def _analyze_ast(code_str, requirements_json):
    reqs = _json.loads(requirements_json)
    try:
        tree = _ast.parse(code_str)
    except SyntaxError as e:
        err_type = type(e).__name__
        return _json.dumps({"syntax_error": f"{err_type}: {e}", "lineno": e.lineno, "offset": e.offset})

    errors = []
    nodes = list(_ast.walk(tree))
    node_types = {type(n) for n in nodes}

    if reqs.get("require_for") and _ast.For not in node_types:
        errors.append("В коде должен использоваться цикл for.")
    if reqs.get("require_while") and _ast.While not in node_types:
        errors.append("В коде должен использоваться цикл while.")
    if reqs.get("require_loop") and (_ast.For not in node_types and _ast.While not in node_types):
        errors.append("В решении обязательно должен использоваться цикл (for или while).")
    if reqs.get("require_def") and _ast.FunctionDef not in node_types:
        errors.append("Необходимо объявить функцию с помощью ключевого слова def.")
    if reqs.get("require_return"):
        if not any(isinstance(n, _ast.Return) for n in nodes):
            errors.append("Функция должна возвращать результат через ключевое слово return.")
    if reqs.get("require_if") and _ast.If not in node_types:
        errors.append("В коде должно использоваться ветвление с условием if.")
    if reqs.get("require_try") and _ast.Try not in node_types:
        errors.append("В коде должна использоваться конструкция try/except.")
    if reqs.get("require_raise") and _ast.Raise not in node_types:
        errors.append("В коде должен использоваться оператор raise.")

    forbid_calls = reqs.get("forbid_calls", [])
    if forbid_calls:
        for n in nodes:
            if isinstance(n, _ast.Call) and isinstance(n.func, _ast.Name):
                if n.func.id in forbid_calls:
                    errors.append(f"В этом задании нельзя использовать {n.func.id}().")
                    break

    forbid_methods = reqs.get("forbid_methods", [])
    if forbid_methods:
        for n in nodes:
            if isinstance(n, _ast.Call) and isinstance(n.func, _ast.Attribute):
                if n.func.attr in forbid_methods:
                    errors.append(f"В этом задании нельзя использовать метод {n.func.attr}().")
                    break

    require_calls = reqs.get("require_calls", [])
    if require_calls:
        for call_name in require_calls:
            called = any(
                isinstance(n, _ast.Call) and (
                    (isinstance(n.func, _ast.Name) and n.func.id == call_name) or
                    (isinstance(n.func, _ast.Attribute) and n.func.attr == call_name)
                )
                for n in nodes
            )
            if not called:
                errors.append(f"В решении нужно вызвать функцию {call_name}.")
                break

    names = [
        n.id for n in nodes
        if isinstance(n, _ast.Name) and isinstance(n.ctx, _ast.Store)
    ]
    return _json.dumps({"errors": errors, "variables": names})

_checker_mod.analyze_ast = _analyze_ast

def _inject_loop_guard_ast(tree, max_iters=5000000):
    counter_id = 0
    class LoopGuardInjector(_ast.NodeTransformer):
        def _inject(self, node):
            nonlocal counter_id
            counter_id += 1
            var = f"_lc{counter_id}"
            init = _ast.Assign(
                targets=[_ast.Name(id=var, ctx=_ast.Store())],
                value=_ast.Constant(value=0)
            )
            _ast.copy_location(init, node)
            inc = _ast.AugAssign(
                target=_ast.Name(id=var, ctx=_ast.Store()),
                op=_ast.Add(),
                value=_ast.Constant(value=1)
            )
            _ast.copy_location(inc, node)
            check = _ast.If(
                test=_ast.Compare(
                    left=_ast.Name(id=var, ctx=_ast.Load()),
                    ops=[_ast.Gt()],
                    comparators=[_ast.Constant(value=max_iters)]
                ),
                body=[_ast.Raise(
                    exc=_ast.Call(
                        func=_ast.Name(id='RuntimeError', ctx=_ast.Load()),
                        args=[_ast.Constant(value=f'Цикл выполнился больше {max_iters} раз — похоже на бесконечный. Проверь условие цикла.')],
                        keywords=[]
                    ),
                    cause=None
                )],
                orelse=[]
            )
            _ast.copy_location(check, node)
            node.body = [inc, check] + node.body
            self.generic_visit(node)
            return [init, node]
        def visit_For(self, node):
            return self._inject(node)
        def visit_While(self, node):
            return self._inject(node)
    tree = LoopGuardInjector().visit(tree)
    _ast.fix_missing_locations(tree)
    return tree

_checker_mod._inject_loop_guard_ast = _inject_loop_guard_ast

def _clean_tb(tb):
    lines = tb.splitlines()
    cleaned = []
    in_student = False
    for l in lines:
        if '<student>' in l:
            in_student = True
        if in_student or l.startswith('Traceback'):
            cleaned.append(l)
    return '\\n'.join(cleaned) if cleaned else tb

_checker_mod._clean_tb = _clean_tb

def _exec_user_code(code_str, save_user_ns=False, max_iters=5000000):
    """Выполняет код студента в изолированном пространстве имён."""
    import sys as _sys_
    import io as _io_
    import ast as _ast_
    import linecache as _lc_
    import traceback as _tb_

    buf = _io_.StringIO()
    old_out = _sys_.stdout
    _sys_.stdout = buf

    _checker_mod._runtime_err = None
    # Изолированный namespace — только безопасные builtins, без sys/js
    target_ns = {'__builtins__': dict(_SAFE_BUILTINS), '__name__': '__student__'}
    try:
        _lc_.cache['<student>'] = (
            len(code_str),
            None,
            [line + '\\n' for line in code_str.splitlines()],
            '<student>'
        )
        try:
            tree = _ast_.parse(code_str, filename='<student>')
            tree = _inject_loop_guard_ast(tree, max_iters=max_iters)
            code_obj = compile(tree, '<student>', 'exec')
        except SyntaxError:
            code_obj = compile(code_str, '<student>', 'exec')

        exec(code_obj, target_ns)
        if save_user_ns:
            _checker_mod._user_ns = target_ns
    except Exception:
        _checker_mod._runtime_err = _clean_tb(_tb_.format_exc())
    finally:
        _sys_.stdout = old_out
        _checker_mod._captured_output = buf.getvalue()

_checker_mod._exec_user_code = _exec_user_code

def _run_task_tests(tests_json):
    """Запускает тесты из JSON в namespace студента."""
    import sys as _sys_
    import io as _io_
    import traceback as _tb_
    import re as _re_

    tests = _json.loads(tests_json)
    # Доверенный namespace: только публичные имена (без _*).
    # Студент не может подменить _user_ns, _lc* и т.п. переменными заглушками.
    _raw = getattr(_checker_mod, '_user_ns', {})
    user_ns = {k: v for k, v in _raw.items() if not k.startswith('_')}
    user_ns['__builtins__'] = _SAFE_BUILTINS

    for t in tests:
        call_expr = t["call"]
        expected_ret = t.get("returns")
        has_expected_ret = "returns" in t
        expected_stdout = t.get("stdout")
        has_expected_stdout = "stdout" in t
        is_hidden = bool(t.get("hidden"))

        buf = _io_.StringIO()
        old_out = _sys_.stdout
        _sys_.stdout = buf
        call_err = None
        func_not_found = None
        ret_val = None

        try:
            ret_val = eval(call_expr, user_ns)
        except NameError as ne:
            m = _re_.match(r"^([a-zA-Z_][a-zA-Z0-9_]*)\s*\(", call_expr.strip())
            fn = m.group(1) if m else None
            if fn and f"name '{fn}' is not defined" in str(ne):
                func_not_found = fn
            else:
                call_err = _clean_tb(_tb_.format_exc())
        except Exception:
            call_err = _clean_tb(_tb_.format_exc())
        finally:
            _sys_.stdout = old_out
            captured_stdout = buf.getvalue()

        if func_not_found:
            return _json.dumps({"passed": False, "type": "not_found",
                                "func": func_not_found, "call": call_expr, "hidden": is_hidden})
        if call_err:
            return _json.dumps({"passed": False, "type": "error",
                                "call": call_expr, "error": call_err, "hidden": is_hidden})

        if has_expected_ret:
            ret_mismatch = False
            if isinstance(expected_ret, bool):
                if not (isinstance(ret_val, bool) and ret_val == expected_ret):
                    ret_mismatch = True
            elif expected_ret is None:
                if ret_val is not None:
                    ret_mismatch = True
            elif isinstance(expected_ret, str):
                if not (isinstance(ret_val, str) and ret_val == expected_ret):
                    ret_mismatch = True
            elif isinstance(expected_ret, (int, float)):
                if isinstance(ret_val, bool) or not isinstance(ret_val, (int, float)) or ret_val != expected_ret:
                    ret_mismatch = True
            else:
                if ret_val != expected_ret:
                    ret_mismatch = True

            if ret_mismatch:
                return _json.dumps({"passed": False, "type": "returns_mismatch",
                                    "call": call_expr, "expected": expected_ret,
                                    "actual": repr(ret_val), "hidden": is_hidden})

        if has_expected_stdout:
            norm_actual = "\\n".join([line.rstrip() for line in captured_stdout.replace("\\r\\n", "\\n").split("\\n")]).strip()
            norm_expected = "\\n".join([line.rstrip() for line in expected_stdout.replace("\\r\\n", "\\n").split("\\n")]).strip()
            if norm_actual != norm_expected:
                return _json.dumps({"passed": False, "type": "stdout_mismatch",
                                    "call": call_expr, "expected": norm_expected,
                                    "actual": norm_actual, "hidden": is_hidden})

    return _json.dumps({"passed": True})

_checker_mod._run_task_tests = _run_task_tests

# ── Публичные псевдонимы в __main__ (только для вызовов из JS) ─────────────
# Они указывают на функции в _checker_mod — студент не может их перезаписать,
# не имея доступа к _checker_mod.
def analyze_ast(code_str, requirements_json):
    return _checker_mod.analyze_ast(code_str, requirements_json)

def _exec_user_code_proxy(code_str, save_user_ns=False, max_iters=5000000):
    _checker_mod._exec_user_code(code_str, save_user_ns, max_iters)

def _run_task_tests_proxy(tests_json):
    return _checker_mod._run_task_tests(tests_json)
`);

        pyodideInstance = pyodide;
        if (onProgress) onProgress('Python готов');
        return pyodide;
      } catch (err) {
        initPromise = null;
        console.error('Ошибка инициализации Pyodide:', err);
        throw err;
      }
    })();

    return initPromise;
  }

  /**
   * Слой 3: Лёгкий PEP8 линтер (не блокирует)
   */
  function lintCode(code, astVars, customTip) {
    const tips = [];
    const lines = code.split('\n');

    // Проверка табов
    if (code.includes('\t')) {
      tips.push('Используй 4 пробела для отступов вместо клавиши Tab (стандарт PEP8).');
    }

    // Проверка отступов (кратность 4)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim().length === 0) continue;
      const leadingSpaces = line.search(/\S/);
      if (leadingSpaces > 0 && leadingSpaces % 4 !== 0) {
        tips.push(`В строке ${i + 1} размер отступа (${leadingSpaces} пробелов) не кратен 4.`);
        break;
      }
    }

    // Длина строки > 79 символов
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].length > 79) {
        tips.push(`Строка ${i + 1} длиннее 79 символов. Длинные строки лучше разбивать для удобства чтения.`);
        break;
      }
    }

    // Проверка CamelCase в переменных
    if (Array.isArray(astVars)) {
      for (const v of astVars) {
        if (/^[a-z]+[A-Z]/.test(v)) {
          tips.push(`Имя переменной \`${v}\` написано в camelCase. В Python для переменных принят snake_case (например: \`${v.replace(/([A-Z])/g, '_$1').toLowerCase()}\`).`);
          break;
        }
      }
    }

    // Добавляем авторский совет по стилю, если есть
    if (customTip && tips.length === 0) {
      tips.push(customTip);
    }

    return tips;
  }

  /**
   * Нормализация текстового вывода (убираем концевые пробелы и пустые строки)
   */
  function normalizeOutput(str) {
    if (!str) return '';
    return str
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map(line => line.trimEnd())
      .join('\n')
      .trim();
  }

  /**
   * Публичный запуск кода с перехватом stdout и защитой от бесконечных циклов
   */
  async function runCode(code) {
    if (!pyodideInstance) {
      await initPyodide();
    }
    const pyodide = pyodideInstance;
    let stdout = '';
    let error = null;

    try {
      await pyodide.runPythonAsync(
        `_exec_user_code_proxy(${JSON.stringify(code)}, save_user_ns=False)`
      );
      stdout = await pyodide.runPythonAsync(`getattr(_checker_mod, '_captured_output', '')`) || '';
      const rawErr = await pyodide.runPythonAsync(`getattr(_checker_mod, '_runtime_err', None)`);
      if (rawErr) {
        error = rawErr.split('\n')
          .filter(l => !l.includes('pyodide') && !l.includes('_captured_output') && !l.includes('_exec_user_code'))
          .join('\n')
          .trim() || rawErr;
      }
    } catch (e) {
      error = e.message || String(e);
    }

    return { stdout, error };
  }

  /**
   * Запуск трёхслойной проверки
   */
  async function checkSolution(userCode, task) {
    if (!pyodideInstance) {
      await initPyodide();
    }

    const pyodide = pyodideInstance;

    // Слой 2 (предварительный): AST-разбор на синтаксис и требуемые конструкции
    const reqs = task.astRequirements || {};
    const astResultJson = await pyodide.runPythonAsync(
      `analyze_ast(${JSON.stringify(userCode)}, ${JSON.stringify(JSON.stringify(reqs))})`
    );
    const astResult = JSON.parse(astResultJson);

    // Если есть синтаксическая ошибка Python:
    if (astResult.syntax_error) {
      const friendly = window.FriendlyErrors ? window.FriendlyErrors.explain(astResult.syntax_error) : null;
      return {
        passed: false,
        title: 'Ошибка синтаксиса',
        sub: `Python не смог разобрать код (строка ${astResult.lineno || 1})`,
        stdout: astResult.syntax_error,
        isSyntaxError: true,
        friendlyExplain: friendly,
        improveTips: []
      };
    }

    // Если нарушены обязательные структуры (циклы, функции, forbid_calls, require_calls и т.д.)
    if (astResult.errors && astResult.errors.length > 0) {
      return {
        passed: false,
        title: 'Структура кода не соответствует заданию',
        sub: astResult.errors[0],
        stdout: '',
        improveTips: []
      };
    }

    // Слой 1: Выполнение кода и сохранение пространства имён
    let stdout = '';
    let runtimeError = null;

    try {
      await pyodide.runPythonAsync(
        `_exec_user_code_proxy(${JSON.stringify(userCode)}, save_user_ns=True)`
      );
      stdout = await pyodide.runPythonAsync(`getattr(_checker_mod, '_captured_output', '')`) || '';
      runtimeError = await pyodide.runPythonAsync(`getattr(_checker_mod, '_runtime_err', None)`);
    } catch (e) {
      runtimeError = e.message || String(e);
    }

    // Если произошла ошибка времени выполнения
    if (runtimeError) {
      const cleanErr = runtimeError
        .split('\n')
        .filter(l => !l.includes('pyodide') && !l.includes('_captured_output') && !l.includes('_exec_user_code'))
        .join('\n')
        .trim();

      const friendly = window.FriendlyErrors ? window.FriendlyErrors.explain(cleanErr || runtimeError) : null;

      return {
        passed: false,
        title: 'Ошибка во время выполнения',
        sub: 'Программа завершилась с ошибкой в консоли',
        stdout: cleanErr || runtimeError,
        isRuntimeError: true,
        friendlyExplain: friendly,
        improveTips: []
      };
    }

    // Проверка логического соответствия (ожидаемый вывод, если задан)
    const normActual = normalizeOutput(stdout);
    const normExpected = normalizeOutput(task.expectedOutput || '');

    if (task.expectedOutput !== undefined && normActual !== normExpected) {
      return {
        passed: false,
        title: 'Вывод не совпадает с ожидаемым',
        sub: `Ожидалось: "${normExpected.replace(/\n/g, '↵')}", получено: "${normActual.replace(/\n/g, '↵')}"`,
        stdout: stdout,
        improveTips: []
      };
    }

    // Проверка тестов tests[] (новый формат)
    if (Array.isArray(task.tests) && task.tests.length > 0) {
      const testsJson = JSON.stringify(task.tests);
      const testResultJson = await pyodide.runPythonAsync(
        `_run_task_tests_proxy(${JSON.stringify(testsJson)})`
      );
      const testResult = JSON.parse(testResultJson);

      if (!testResult.passed) {
        let subMsg = '';
        let titleMsg = 'Тест не пройден';
        let friendlyExplain = null;

        if (testResult.hidden) {
          subMsg = task.hiddenTestHint || 'Не пройден дополнительный тест. Проверь граничные случаи: ноль, пустая строка, отрицательные числа.';
        } else if (testResult.type === 'not_found') {
          titleMsg = 'Функция не найдена';
          subMsg = `Функция \`${testResult.func}\` не найдена. Проверь, что она объявлена через def и имя совпадает с условием.`;
        } else if (testResult.type === 'error') {
          titleMsg = 'Ошибка при вызове функции';
          const cleanCallErr = (testResult.error || '')
            .split('\n')
            .filter(l => !l.includes('pyodide') && !l.includes('_run_task_tests'))
            .join('\n')
            .trim();
          friendlyExplain = window.FriendlyErrors ? window.FriendlyErrors.explain(cleanCallErr) : null;
          const errLines = cleanCallErr.split('\n').filter(Boolean);
          const lastLine = errLines[errLines.length - 1] || 'Ошибка выполнения';
          subMsg = `При вызове \`${testResult.call}\` произошла ошибка: ${lastLine}`;
        } else if (testResult.type === 'returns_mismatch') {
          let expVal = testResult.expected;
          if (expVal === true) expVal = 'True';
          else if (expVal === false) expVal = 'False';
          else if (expVal === null) expVal = 'None';
          else if (typeof expVal === 'string') expVal = `"${expVal}"`;

          subMsg = `Вызов \`${testResult.call}\` вернул ${testResult.actual}, ожидалось ${expVal}`;
        } else if (testResult.type === 'stdout_mismatch') {
          subMsg = `Вызов \`${testResult.call}\` вывел "${(testResult.actual || '').replace(/\n/g, '\\n')}", ожидалось "${(testResult.expected || '').replace(/\n/g, '\\n')}"`;
        }

        return {
          passed: false,
          title: titleMsg,
          sub: subMsg,
          stdout: testResult.error || '',
          friendlyExplain: friendlyExplain,
          failedTest: {
            call: testResult.call,
            expected: testResult.expected,
            actual: testResult.actual,
            type: testResult.type,
            hidden: testResult.hidden
          },
          improveTips: []
        };
      }
    }

    // Если у задания есть старый testCode (для заданий уровня 0)
    if (task.testCode) {
      try {
        await pyodide.runPythonAsync(`
# Формируем доверенный namespace: только публичные имена от студента.
# Ключи, начинающиеся с '_', отбрасываются — в т.ч. любой '_user_ns',
# который студент мог определить как заглушку.
_raw_ns = getattr(_checker_mod, '_user_ns', {})
_trusted = {k: v for k, v in _raw_ns.items() if not k.startswith('_')}
# Добавляем safe builtins и доверенный _user_ns (не от студента)
_trusted['__builtins__'] = _SAFE_BUILTINS
_trusted['_user_ns'] = dict(_trusted)  # доверенная копия для testCode, если он её использует
exec(compile(${JSON.stringify(task.testCode)}, '<testcode>', 'exec'), _trusted)
`);
      } catch (testErr) {
        let testMsg = testErr.message || String(testErr);
        const assertMatch = testMsg.match(/AssertionError:?\s*(.+)/i) || testMsg.match(/AssertionError/i);
        const cleanMsg = task.testErrorMessage || (assertMatch ? assertMatch[1] || 'Функция вернула неверный результат на скрытых тестах' : testMsg);
        const friendly = window.FriendlyErrors ? window.FriendlyErrors.explain(testMsg) : null;
        return {
          passed: false,
          title: 'Тест не пройден',
          sub: cleanMsg,
          stdout: stdout,
          friendlyExplain: friendly,
          improveTips: []
        };
      }
    }

    // Слой 3: PEP8 линтер (код успешен, формируем советы по улучшению)
    const improveTips = lintCode(userCode, astResult.variables, task.improveTip);

    return {
      passed: true,
      title: 'Задание засчитано',
      sub: task.successMessage || 'Вывод совпадает, код написан верно',
      stdout: stdout,
      improveTips: improveTips
    };
  }

  window.CodeChecker = {
    initPyodide,
    checkSolution,
    runCode
  };

})(window);
