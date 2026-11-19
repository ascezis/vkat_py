/**
 * вкат.py — Фоновый Web Worker для безопасного исполнения Python (Pyodide)
 * («Антифриз» — Sandbox Worker)
 *
 * Исполняет код ученика в изолированном потоке Web Worker, исключая зависание
 * пользовательского интерфейса (UI) при бесконечных циклах и тяжелых вычислениях.
 */

'use strict';

let pyodideInstance = null;
let isInitializing = false;
let initPromise = null;

// Загрузка библиотеки Pyodide в контексте Web Worker
try {
  importScripts('../assets/pyodide/pyodide.js');
} catch (e) {
  try {
    importScripts('assets/pyodide/pyodide.js');
  } catch (_) {}
}

// Перехват fetch: отдаём пустой pyodide-lock.json, чтобы Pyodide не пытался
// резолвить внешние пакеты. Встроенные base64-бинарники (wasm_binary.js /
// stdlib_binary.js) в воркер не загружаются: они присваивают window.PYODIDE_*,
// которого в воркере нет, а на file:// создание Worker блокируется браузером
// ещё до этого — поэтому воркер всегда грузит бинарники нативным fetch по http.
if (typeof self.fetch === 'function') {
  const nativeFetch = self.fetch;
  /**
   * @param {any} input
   * @param {RequestInit} [init]
   */
  self.fetch = async function (input, init) {
    const url = typeof input === 'string' ? input : (input && input.url ? input.url : String(input));

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

    return nativeFetch(input, init);
  };
}

/**
 * Инициализация Pyodide в Web Worker
 */
async function initPyodide(indexURL, bootstrapSource) {
  if (pyodideInstance) {
    return pyodideInstance;
  }
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      if (typeof loadPyodide !== 'function') {
        throw new Error('Функция loadPyodide не найдена в Web Worker. Проверьте assets/pyodide/pyodide.js');
      }

      const pyodideConfig = {
        indexURL: indexURL || '../assets/pyodide/',
        checkAPIVersion: false
      };

      const loadPromise = loadPyodide(pyodideConfig);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Превышено время ожидания загрузки среды Python в воркере (60 сек).'));
        }, 60000);
      });

      const pyodide = await Promise.race([loadPromise, timeoutPromise]);

      if (!bootstrapSource) {
        throw new Error('Python-бутстрап чекера не получен от главного потока (INIT payload)');
      }
      await pyodide.runPythonAsync(bootstrapSource);

      pyodideInstance = pyodide;
      return pyodide;
    } catch (err) {
      initPromise = null;
      console.error('Ошибка инициализации Pyodide в воркере:', err);
      throw err;
    }
  })();

  return initPromise;
}

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
   * Резервное гибкое сопоставление вывода на JS (если рантайм Python недоступен)
   */
  function fuzzyMatchOutputJS(actual, expected) {
    if (actual === expected) return { match: true, tip: null };

    const actStr = (actual || '').replace(/\r\n/g, '\n').trim();
    const expStr = (expected || '').replace(/\r\n/g, '\n').trim();

    if (actStr === expStr) return { match: true, tip: null };

    const actLines = actStr.split('\n').map(l => l.trimEnd()).filter(Boolean);
    const expLines = expStr.split('\n').map(l => l.trimEnd()).filter(Boolean);

    if (actLines.join('\n') === expLines.join('\n')) return { match: true, tip: null };

    const normYo = s => s.replace(/ё/g, 'е').replace(/Ё/g, 'Е');
    const collapse = s => s.replace(/[ \t]+/g, ' ').trim();

    const actCollapsed = actLines.map(collapse).join('\n');
    const expCollapsed = expLines.map(collapse).join('\n');

    if (actCollapsed === expCollapsed || normYo(actCollapsed) === normYo(expCollapsed)) {
      return { match: true, tip: null };
    }

    const stripPunct = s => s.replace(/[.!?]+$/, '').trim();
    const actNoPunct = actLines.map(l => normYo(stripPunct(collapse(l)))).join('\n');
    const expNoPunct = expLines.map(l => normYo(stripPunct(collapse(l)))).join('\n');
    if (actNoPunct === expNoPunct) {
      return { match: true, tip: 'Зачтено! Совет: точку или знак препинания в конце вывода ставить не обязательно.' };
    }

    if (actLines.length === expLines.length && actLines.length === 1) {
      const m = actLines[0].trim().match(/^(?:[a-zA-Zа-яА-ЯёЁ_ ]+[:=]\s*)(.+)$/);
      if (m) {
        const subRes = fuzzyMatchOutputJS(m[1].trim(), expLines[0].trim());
        if (subRes.match) {
          return {
            match: true,
            tip: `Зачтено! Твой код вывел "${actLines[0]}". Совет: в заданиях достаточно выводить только значение.`
          };
        }
      }
    }

    if (actNoPunct.toLowerCase() === expNoPunct.toLowerCase()) {
      return { match: true, tip: 'Зачтено! Обрати внимание на регистр букв.' };
    }

    return { match: false, tip: null };
  }

  /**
   * Публичный запуск кода с перехватом stdout и защитой от бесконечных циклов
   */

async function runCode(code, stdin = null) {
    if (!pyodideInstance) {
      await initPyodide();
    }
    const pyodide = pyodideInstance;
    let stdout = '';
    let error = null;

    const stdinJson = JSON.stringify(stdin !== undefined && stdin !== null ? stdin : null);
    try {
      await pyodide.runPythonAsync(
        `_exec_user_code_proxy(${JSON.stringify(code)}, save_user_ns=False, stdin_json=${JSON.stringify(stdinJson)})`
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
      const friendly = self.FriendlyErrors ? self.FriendlyErrors.explain(astResult.syntax_error) : null;
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
    let initialStdin = null;
    if (task && task.stdin !== undefined) {
      initialStdin = task.stdin;
    } else if (task && Array.isArray(task.tests) && task.tests.length > 0 && task.tests[0].stdin !== undefined) {
      initialStdin = task.tests[0].stdin;
    }

    const stdinJson = JSON.stringify(initialStdin !== undefined && initialStdin !== null ? initialStdin : null);
    let stdout = '';
    let runtimeError = null;

    try {
      await pyodide.runPythonAsync(
        `_exec_user_code_proxy(${JSON.stringify(userCode)}, save_user_ns=True, stdin_json=${JSON.stringify(stdinJson)})`
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

      const friendly = self.FriendlyErrors ? self.FriendlyErrors.explain(cleanErr || runtimeError) : null;

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
    let outputTip = null;
    if (task.expectedOutput !== undefined) {
      let isMatch = false;
      try {
        const matchResJson = await pyodide.runPythonAsync(
          `_match_output_proxy(${JSON.stringify(stdout)}, ${JSON.stringify(task.expectedOutput)})`
        );
        const [matched, tip] = JSON.parse(matchResJson);
        isMatch = matched;
        outputTip = tip;
      } catch (e) {
        const jsRes = fuzzyMatchOutputJS(stdout, task.expectedOutput);
        isMatch = jsRes.match;
        outputTip = jsRes.tip;
      }

      if (!isMatch) {
        if (task.lenientOutput && normalizeOutput(stdout)) {
          // Мягкий режим (первое задание): любой непустой вывод зачитывается,
          // красную ошибку не показываем — вместо неё даём наводку на целевую фразу.
          if (!outputTip) {
            outputTip = 'Зачтено! print() работает — ты вывел свой текст. ' +
              'В этом задании просили вывести: "' + normalizeOutput(task.expectedOutput || '') + '". Попробуй и этот вариант.';
          }
        } else {
          const normActual = normalizeOutput(stdout);
          const normExpected = normalizeOutput(task.expectedOutput || '');
          return {
            passed: false,
            title: 'Вывод не совпадает с ожидаемым',
            sub: `Ожидалось: "${normExpected.replace(/\n/g, '↵')}", получено: "${normActual.replace(/\n/g, '↵')}"`,
            stdout: stdout,
            improveTips: []
          };
        }
      }
    }

    // Проверка тестов tests[] (новый формат)
    if (Array.isArray(task.tests) && task.tests.length > 0) {
      const testsJson = JSON.stringify(task.tests);
      const testResultJson = await pyodide.runPythonAsync(
        `_run_task_tests_proxy(${JSON.stringify(testsJson)}, user_code=${JSON.stringify(userCode)})`
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
          titleMsg = 'Ошибка при выполнении теста';
          const cleanCallErr = (testResult.error || '')
            .split('\n')
            .filter(l => !l.includes('pyodide') && !l.includes('_run_task_tests'))
            .join('\n')
            .trim();
          friendlyExplain = self.FriendlyErrors ? self.FriendlyErrors.explain(cleanCallErr) : null;
          const errLines = cleanCallErr.split('\n').filter(Boolean);
          const lastLine = errLines[errLines.length - 1] || 'Ошибка выполнения';
          const inputNote = testResult.stdin !== undefined ? ` при вводе "${testResult.stdin.replace(/\n/g, '↵')}"` : '';
          const callNote = testResult.call ? `вызове \`${testResult.call}\`` : 'выполнении';
          subMsg = `При ${callNote}${inputNote} произошла ошибка: ${lastLine}`;
        } else if (testResult.type === 'returns_mismatch') {
          let expVal = testResult.expected;
          if (expVal === true) expVal = 'True';
          else if (expVal === false) expVal = 'False';
          else if (expVal === null) expVal = 'None';
          else if (typeof expVal === 'string') expVal = `"${expVal}"`;

          subMsg = `Вызов \`${testResult.call}\` вернул ${testResult.actual}, ожидалось ${expVal}`;
        } else if (testResult.type === 'stdout_mismatch') {
          const inputNote = testResult.stdin !== undefined ? ` при вводе "${testResult.stdin.replace(/\n/g, '↵')}"` : '';
          const callNote = testResult.call ? `Вызов \`${testResult.call}\`` : 'Код программы';
          subMsg = `${callNote}${inputNote} вывел "${(testResult.actual || '').replace(/\n/g, '\\n')}", ожидалось "${(testResult.expected || '').replace(/\n/g, '\\n')}"`;
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
# Для testCode используем полные встроенные функции _builtins_mod,
# так как авторские тесты используют sys/io для перехвата вывода.
_trusted['__builtins__'] = _builtins_mod
_trusted['_user_ns'] = dict(_trusted)  # доверенная копия для testCode, если он её использует
_trusted['sys'] = _sys
_trusted['io'] = _io
exec(compile(${JSON.stringify(task.testCode)}, '<testcode>', 'exec'), _trusted)
`);
      } catch (testErr) {
        let testMsg = testErr.message || String(testErr);
        const assertMatch = testMsg.match(/AssertionError:?\s*(.+)/i) || testMsg.match(/AssertionError/i);
        const cleanMsg = task.testErrorMessage || (assertMatch ? assertMatch[1] || 'Функция вернула неверный результат на скрытых тестах' : testMsg);
        const friendly = self.FriendlyErrors ? self.FriendlyErrors.explain(testMsg) : null;
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
    if (outputTip) {
      improveTips.unshift(outputTip);
    }

    return {
      passed: true,
      title: 'Задание засчитано',
      sub: task.successMessage || 'Вывод совпадает, код написан верно',
      stdout: stdout,
      improveTips: improveTips
    };
  }

// ─── Обработка сообщений от основного потока ───────────────────────────────
self.onmessage = async function (e) {
  const data = e.data;
  if (!data) return;
  const { type, id, payload } = data;

  if (type === 'INIT') {
    try {
      await initPyodide(payload && payload.indexURL, payload && payload.bootstrap);
      self.postMessage({ type: 'INIT_OK', id });
    } catch (err) {
      self.postMessage({ type: 'INIT_ERROR', id, error: String(err && err.message ? err.message : err) });
    }
  } else if (type === 'CHECK') {
    try {
      const result = await checkSolution(payload.code, payload.task);
      self.postMessage({ type: 'CHECK_RESULT', id, result });
    } catch (err) {
      self.postMessage({ type: 'CHECK_ERROR', id, error: String(err && err.message ? err.message : err) });
    }
  } else if (type === 'RUN') {
    try {
      const result = await runCode(payload.code, payload.stdin);
      self.postMessage({ type: 'RUN_RESULT', id, result });
    } catch (err) {
      self.postMessage({ type: 'RUN_ERROR', id, error: String(err && err.message ? err.message : err) });
    }
  } else if (type === 'PING') {
    self.postMessage({ type: 'PONG', id });
  }
};
