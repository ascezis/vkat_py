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

        // Инициализируем Python-хелперы для перехвата вывода, AST проверки и тестов
        await pyodide.runPythonAsync(`
import sys
import io
import ast
import json
import traceback
import re

def analyze_ast(code_str, requirements_json):
    reqs = json.loads(requirements_json)
    try:
        tree = ast.parse(code_str)
    except SyntaxError as e:
        err_type = type(e).__name__
        return json.dumps({"syntax_error": f"{err_type}: {e}", "lineno": e.lineno, "offset": e.offset})

    errors = []
    
    # Сбор всех узлов
    nodes = list(ast.walk(tree))
    node_types = {type(n) for n in nodes}

    # Базовые требования
    if reqs.get("require_for") and ast.For not in node_types:
        errors.append("В коде должен использоваться цикл for.")
    
    if reqs.get("require_while") and ast.While not in node_types:
        errors.append("В коде должен использоваться цикл while.")
        
    if reqs.get("require_loop") and (ast.For not in node_types and ast.While not in node_types):
        errors.append("В решении обязательно должен использоваться цикл (for или while).")
        
    if reqs.get("require_def") and ast.FunctionDef not in node_types:
        errors.append("Необходимо объявить функцию с помощью ключевого слова def.")
        
    if reqs.get("require_return"):
        has_return = any(isinstance(n, ast.Return) for n in nodes)
        if not has_return:
            errors.append("Функция должна возвращать результат через ключевое слово return.")
            
    if reqs.get("require_if") and ast.If not in node_types:
        errors.append("В коде должно использоваться ветвление с условием if.")

    # Новые флаги AST
    forbid_calls = reqs.get("forbid_calls", [])
    if forbid_calls:
        for n in nodes:
            if isinstance(n, ast.Call) and isinstance(n.func, ast.Name):
                if n.func.id in forbid_calls:
                    errors.append(f"В этом задании нельзя использовать {n.func.id}().")
                    break

    forbid_methods = reqs.get("forbid_methods", [])
    if forbid_methods:
        for n in nodes:
            if isinstance(n, ast.Call) and isinstance(n.func, ast.Attribute):
                if n.func.attr in forbid_methods:
                    errors.append(f"В этом задании нельзя использовать метод {n.func.attr}().")
                    break

    require_calls = reqs.get("require_calls", [])
    if require_calls:
        for call_name in require_calls:
            called = any(
                isinstance(n, ast.Call) and (
                    (isinstance(n.func, ast.Name) and n.func.id == call_name) or
                    (isinstance(n.func, ast.Attribute) and n.func.attr == call_name)
                )
                for n in nodes
            )
            if not called:
                errors.append(f"В решении нужно вызвать функцию {call_name}.")
                break

    # Проверка переменных на CamelCase для линтера
    names = []
    for n in nodes:
        if isinstance(n, ast.Name) and isinstance(n.ctx, ast.Store):
            names.append(n.id)

    return json.dumps({
        "errors": errors,
        "variables": names
    })

def _inject_loop_guard(code_str, max_iters=100000):
    """Внедряет счётчик итераций в каждый цикл for/while для защиты от бесконечных циклов."""
    try:
        tree = ast.parse(code_str)
    except SyntaxError:
        return code_str

    counter_id = 0
    class LoopGuardInjector(ast.NodeTransformer):
        def _inject(self, node):
            nonlocal counter_id
            counter_id += 1
            var = f"_lc{counter_id}"
            init = ast.Assign(
                targets=[ast.Name(id=var, ctx=ast.Store())],
                value=ast.Constant(value=0),
                lineno=node.lineno, col_offset=0
            )
            inc = ast.AugAssign(
                target=ast.Name(id=var, ctx=ast.Store()),
                op=ast.Add(),
                value=ast.Constant(value=1),
                lineno=node.lineno, col_offset=0
            )
            check = ast.If(
                test=ast.Compare(
                    left=ast.Name(id=var, ctx=ast.Load()),
                    ops=[ast.Gt()],
                    comparators=[ast.Constant(value=max_iters)]
                ),
                body=[ast.Raise(
                    exc=ast.Call(
                        func=ast.Name(id='RuntimeError', ctx=ast.Load()),
                        args=[ast.Constant(value=f'Цикл выполнился больше {max_iters} раз — похоже на бесконечный. Проверь условие цикла.')],
                        keywords=[]
                    ),
                    cause=None
                )],
                orelse=[],
                lineno=node.lineno, col_offset=0
            )
            node.body = [inc, check] + node.body
            self.generic_visit(node)
            return [init, node]

        def visit_For(self, node):
            return self._inject(node)
        def visit_While(self, node):
            return self._inject(node)

    tree = LoopGuardInjector().visit(tree)
    ast.fix_missing_locations(tree)
    return ast.unparse(tree)

def _run_task_tests(tests_json):
    tests = json.loads(tests_json)
    for t in tests:
        call_expr = t["call"]
        expected_ret = t.get("returns")
        has_expected_ret = "returns" in t
        expected_stdout = t.get("stdout")
        has_expected_stdout = "stdout" in t
        is_hidden = bool(t.get("hidden"))

        buf = io.StringIO()
        old_out = sys.stdout
        sys.stdout = buf
        call_err = None
        func_not_found = None
        ret_val = None

        try:
            ret_val = eval(call_expr, _user_ns)
        except NameError as ne:
            m = re.match(r"^([a-zA-Z_][a-zA-Z0-9_]*)\s*\(", call_expr.strip())
            fn = m.group(1) if m else None
            if fn and f"name '{fn}' is not defined" in str(ne):
                func_not_found = fn
            else:
                call_err = traceback.format_exc()
        except Exception:
            call_err = traceback.format_exc()
        finally:
            sys.stdout = old_out
            captured_stdout = buf.getvalue()

        if func_not_found:
            return json.dumps({
                "passed": False,
                "type": "not_found",
                "func": func_not_found,
                "call": call_expr,
                "hidden": is_hidden
            })

        if call_err:
            return json.dumps({
                "passed": False,
                "type": "error",
                "call": call_expr,
                "error": call_err,
                "hidden": is_hidden
            })

        # Сравнение returns
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
                return json.dumps({
                    "passed": False,
                    "type": "returns_mismatch",
                    "call": call_expr,
                    "expected": expected_ret,
                    "actual": repr(ret_val),
                    "hidden": is_hidden
                })

        # Сравнение stdout
        if has_expected_stdout:
            norm_actual = "\\n".join([line.rstrip() for line in captured_stdout.replace("\\r\\n", "\\n").split("\\n")]).strip()
            norm_expected = "\\n".join([line.rstrip() for line in expected_stdout.replace("\\r\\n", "\\n").split("\\n")]).strip()
            if norm_actual != norm_expected:
                return json.dumps({
                    "passed": False,
                    "type": "stdout_mismatch",
                    "call": call_expr,
                    "expected": norm_expected,
                    "actual": norm_actual,
                    "hidden": is_hidden
                })

    return json.dumps({"passed": True})
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
      const guardedCodeJson = await pyodide.runPythonAsync(
        `_inject_loop_guard(${JSON.stringify(code)})`
      );
      const guardedCode = guardedCodeJson || code;

      const runnerCode = `
import sys
import io

_stdout_buffer = io.StringIO()
_old_stdout = sys.stdout
sys.stdout = _stdout_buffer

_runtime_err = None
try:
    _run_ns = {}
    exec(${JSON.stringify(guardedCode)}, _run_ns)
except Exception as e:
    import traceback
    _runtime_err = traceback.format_exc()
finally:
    sys.stdout = _old_stdout

_captured_output = _stdout_buffer.getvalue()
`;
      await pyodide.runPythonAsync(runnerCode);
      stdout = pyodide.globals.get('_captured_output') || '';
      const rawErr = pyodide.globals.get('_runtime_err');
      if (rawErr) {
        error = rawErr.split('\n')
          .filter(l => !l.includes('pyodide') && !l.includes('_captured_output'))
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
      // Внедряем защиту от бесконечных циклов через AST-препроцессинг
      const guardedCodeJson = await pyodide.runPythonAsync(
        `_inject_loop_guard(${JSON.stringify(userCode)})`
      );
      const guardedCode = guardedCodeJson || userCode;

      // Изолированный запуск с перехватом stdout и сохранением _user_ns
      const runnerCode = `
import sys
import io

_stdout_buffer = io.StringIO()
_old_stdout = sys.stdout
sys.stdout = _stdout_buffer

_runtime_err = None
try:
    _user_ns = {}
    exec(${JSON.stringify(guardedCode)}, _user_ns)
except Exception as e:
    import traceback
    _runtime_err = traceback.format_exc()
finally:
    sys.stdout = _old_stdout

_captured_output = _stdout_buffer.getvalue()
`;
      await pyodide.runPythonAsync(runnerCode);
      stdout = pyodide.globals.get('_captured_output') || '';
      runtimeError = pyodide.globals.get('_runtime_err');
    } catch (e) {
      runtimeError = e.message || String(e);
    }

    // Если произошла ошибка времени выполнения
    if (runtimeError) {
      const cleanErr = runtimeError
        .split('\n')
        .filter(l => !l.includes('pyodide') && !l.includes('_captured_output'))
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
        `_run_task_tests(${JSON.stringify(testsJson)})`
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
# Тестирование функции/переменных в _user_ns
${task.testCode}
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
