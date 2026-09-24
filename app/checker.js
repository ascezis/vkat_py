/**
 * вкат.py — Движок трёхслойной проверки кода ученика
 * Слой 1: Выполнение в Pyodide и проверка вывода / значений
 * Слой 2: AST-анализ (проверка требуемых конструкций: циклы, функции, условия)
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

        // Инициализируем Python-хелперы для перехвата вывода и AST проверки
        await pyodide.runPythonAsync(`
import sys
import io
import ast
import json

def analyze_ast(code_str, requirements_json):
    reqs = json.loads(requirements_json)
    try:
        tree = ast.parse(code_str)
    except SyntaxError as e:
        return json.dumps({"syntax_error": str(e), "lineno": e.lineno, "offset": e.offset})

    errors = []
    
    # Сбор всех типов узлов
    nodes = list(ast.walk(tree))
    node_types = {type(n) for n in nodes}

    # Проверка требований AST
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
        return code_str  # AST-ошибку поймает analyze_ast

    counter_id = 0
    class LoopGuardInjector(ast.NodeTransformer):
        def _inject(self, node):
            nonlocal counter_id
            counter_id += 1
            var = f"_lc{counter_id}"
            # _lcN = 0
            init = ast.Assign(
                targets=[ast.Name(id=var, ctx=ast.Store())],
                value=ast.Constant(value=0),
                lineno=node.lineno, col_offset=0
            )
            # _lcN += 1; if _lcN > max_iters: raise RuntimeError(...)
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
      return {
        passed: false,
        title: 'Ошибка синтаксиса',
        sub: `Python не смог разобрать код (строка ${astResult.lineno || 1})`,
        stdout: astResult.syntax_error,
        isSyntaxError: true,
        improveTips: []
      };
    }

    // Если нарушены обязательные структуры (циклы, функции и т.д.)
    if (astResult.errors && astResult.errors.length > 0) {
      return {
        passed: false,
        title: 'Структура кода не соответствует заданию',
        sub: astResult.errors[0],
        stdout: '',
        improveTips: []
      };
    }

    // Слой 1: Выполнение кода и сравнение вывода/состояния
    let stdout = '';
    let runtimeError = null;

    try {
      // Внедряем защиту от бесконечных циклов через AST-препроцессинг
      const guardedCodeJson = await pyodide.runPythonAsync(
        `_inject_loop_guard(${JSON.stringify(userCode)})`
      );
      const guardedCode = guardedCodeJson || userCode;

      // Изолированный запуск с перехватом stdout
      const runnerCode = `
import sys
import io

_stdout_buffer = io.StringIO()
_old_stdout = sys.stdout
sys.stdout = _stdout_buffer

_runtime_err = None
try:
    # Очищаем скоуп пользователя от предыдущих запусков
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
      // Очистим технические строки стека pyodide
      const cleanErr = runtimeError
        .split('\n')
        .filter(l => !l.includes('pyodide') && !l.includes('_captured_output'))
        .join('\n')
        .trim();

      return {
        passed: false,
        title: 'Ошибка во время выполнения',
        sub: 'Программа завершилась с ошибкой в консоли',
        stdout: cleanErr || runtimeError,
        isRuntimeError: true,
        improveTips: []
      };
    }

    // Проверка логического соответствия (ожидаемый вывод)
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

    // Если у задания есть дополнительный кастомный тест (например проверка функции)
    if (task.testCode) {
      try {
        // _user_ns нужно переиспользовать из exec — он уже в глобалах Pyodide
        await pyodide.runPythonAsync(`
# Тестирование функции/переменных в _user_ns
${task.testCode}
`);
      } catch (testErr) {
        // Очищаем техническое из traceback для дружелюбного сообщения
        let testMsg = testErr.message || String(testErr);
        const assertMatch = testMsg.match(/AssertionError:?\s*(.+)/i) || testMsg.match(/AssertionError/i);
        return {
          passed: false,
          title: 'Тест не пройден',
          sub: task.testErrorMessage || (assertMatch ? assertMatch[1] || 'Функция вернула неверный результат на скрытых тестах' : testMsg),
          stdout: stdout,
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
    checkSolution
  };

})(window);
