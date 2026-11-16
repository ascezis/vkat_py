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
    /**
     * @param {any} input
     * @param {RequestInit} [init]
     */
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
  /**
   * Единый источник Python-бутстрапа чекера: блок <script type="text/x-python"
   * id="vkat-checker-python"> в index.html. Тот же код исполняет воркер
   * (получает его через INIT-сообщение) и dev/run_tests.py (парсит index.html).
   * Работает и на file:// — содержимое inline-тега читается без fetch.
   */
  const CHECKER_PYTHON_ID = 'vkat-checker-python';
  function getCheckerPythonSource() {
    try {
      const el = document.getElementById(CHECKER_PYTHON_ID);
      if (el && el.textContent) return el.textContent;
    } catch (_) {}
    return null;
  }

  async function initPyodideInThread(onProgress) {
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
        // Python-бутстрап чекера живёт в index.html (script#vkat-checker-python) —
      // единый источник для in-thread fallback, воркера и dev/run_tests.py.
      const bootstrapSource = getCheckerPythonSource();
      if (!bootstrapSource) {
        throw new Error('Python-бутстрап чекера не найден (index.html, script#vkat-checker-python)');
      }
      await pyodide.runPythonAsync(bootstrapSource);

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
  async function fallbackRunCode(code) {
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
  async function fallbackCheckSolution(userCode, task) {
    if (!pyodideInstance) {
      await initPyodideInThread();
    }
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


  // ─── Фоновый Web Worker («Антифриз» — Sandbox Worker) ─────────────────────

  /**
   * Результат «песочница не смогла исполнить payload». Код ученика при этом
   * НЕ исполняется повторно в главном потоке — повторный inline-запуск того же
   * кода может заморозить UI (то, от чего защищает issue #2).
   */
  function sandboxFailureResult(err) {
    const detail = err && err.message ? err.message : String(err || 'Worker failure');
    return {
      passed: false,
      title: 'Ошибка проверки',
      sub: 'Фоновая песочница не смогла выполнить проверку и была перезапущена. Попробуй нажать «Проверить» ещё раз.',
      stdout: 'SandboxError: ' + detail,
      isSandboxError: true,
      improveTips: []
    };
  }

  class PyodideWorkerBridge {

    constructor() {
      // Обычные свойства вместо static-полей: static class fields требуют ES2022,
      // и на старых браузерах всё объявление класса падает с SyntaxError,
      // лишая checker.js и in-thread fallback (см. TECH-DEBT: школьные ПК).
      this.DEFAULT_TIMEOUT_MS = 7000;
      this.INIT_TIMEOUT_MS = 90000;      // JS-таймаут на INIT воркера (в воркере свой, 60с)
      this.MAX_CONSECUTIVE_CRASHES = 3;  // после стольких крашей подряд — перманентный fallback
      this._crashCount = 0;
      /** @type {number | null} */
      this._initTimer = null;
      /** @type {((ok: boolean) => void) | null} */
      this._initResolve = null;
      /** @type {((err?: unknown) => void) | null} */
      this._initReject = null;
      this.worker = null;
      this.isReady = false;
      this.initPromise = null;
      this.reqId = 0;
      this.pending = new Map();
      this.workerSupported = (typeof window !== 'undefined' && typeof window.Worker === 'function');
      this.useFallback = !this.workerSupported;
      this.workerUrl = this.resolveWorkerUrl();
    }

    resolveWorkerUrl() {
      try {
        if (typeof document !== 'undefined') {
          const current = /** @type {HTMLScriptElement | null} */ (document.currentScript);
          if (current && current.src) {
            return new URL('checker-worker.js', current.src).href;
          }
          const scriptEl = /** @type {HTMLScriptElement | null} */ (document.querySelector('script[src*="checker.js"]'));
          if (scriptEl && scriptEl.src) {
            return new URL('checker-worker.js', scriptEl.src).href;
          }
        }
      } catch (_) {}
      return 'app/checker-worker.js';
    }

    spawnWorker() {
      if (this.worker) {
        try { this.worker.terminate(); } catch (_) {}
        this.worker = null;
      }
      this.isReady = false;
      this.initPromise = null;

      if (!this.workerSupported || this.useFallback) return;

      try {
        this.worker = new Worker(this.workerUrl);
        this.worker.onmessage = (e) => this.handleMessage(e.data);
        this.worker.onerror = (err) => {
          console.warn('[PyodideWorkerBridge] Ошибка в воркере, переключение на локальный рантайм:', err);
          this.handleWorkerCrash(err);
        };
      } catch (err) {
        console.warn('[PyodideWorkerBridge] Не удалось создать Worker, переключение на локальный рантайм:', err);
        this.useFallback = true;
        this.worker = null;
      }
    }

    handleWorkerCrash(err) {
      // Одиночный краш (OOM, wasm abort) не должен перманентно отключать «Антифриз»:
      // воркер пересоздаётся, а перманентный fallback включается только после серии
      // крашей подряд (например, код ученика стабильно роняет wasm).
      this._crashCount++;
      if (this._crashCount >= this.MAX_CONSECUTIVE_CRASHES) {
        console.warn('[PyodideWorkerBridge] Крашей подряд:', this._crashCount, '— перманентный fallback.');
        this.useFallback = true;
      }
      for (const [id, req] of this.pending.entries()) {
        clearTimeout(req.timer);
        req.reject(err || new Error('Worker crash'));
      }
      this.pending.clear();
      if (this.worker) {
        try { this.worker.terminate(); } catch (_) {}
        this.worker = null;
      }
      // Обязательный сброс готовности: без него isReady остаётся true при
      // мёртвом воркере, pre-warm не пересоздаёт песочницу, и следующая
      // проверка уходит в inline-fallback (поймано behavioral-тестом 21.3).
      this.isReady = false;
      this.initPromise = null;
      if (!this.useFallback) {
        // Прогреваем пересозданный воркер в фоне, чтобы следующая проверка была быстрой.
        this.ensureReady().catch(() => {});
      }
    }

    handleMessage(data) {
      if (!data) return;
      const { type, id, result, error } = data;

      if (type === 'INIT_OK') {
        this.isReady = true;
        if (this._initTimer) { clearTimeout(this._initTimer); this._initTimer = null; }
        if (this._initResolve) {
          this._initResolve(true);
          this._initResolve = null;
        }
      } else if (type === 'INIT_ERROR') {
        if (this._initTimer) { clearTimeout(this._initTimer); this._initTimer = null; }
        if (this._initReject) {
          this._initReject(new Error(error || 'Worker init failed'));
          this._initReject = null;
        }
      } else if (type === 'CHECK_RESULT' || type === 'RUN_RESULT') {
        const req = this.pending.get(id);
        if (req) {
          clearTimeout(req.timer);
          this.pending.delete(id);
          this._crashCount = 0; // успешное исполнение — серия крашей прервана
          req.resolve(result);
        }
      } else if (type === 'CHECK_ERROR' || type === 'RUN_ERROR') {
        const req = this.pending.get(id);
        if (req) {
          clearTimeout(req.timer);
          this.pending.delete(id);
          req.reject(new Error(error || 'Worker execution error'));
        }
      }
    }

    ensureReady() {
      if (this.useFallback) return Promise.resolve(false);
      if (this.isReady) return Promise.resolve(true);
      if (this.initPromise) return this.initPromise;

      if (!this.worker) {
        this.spawnWorker();
        if (this.useFallback) return Promise.resolve(false);
      }

      this.initPromise = new Promise((resolve) => {
        let settled = false;
        const finish = (ok) => {
          if (settled) return;
          settled = true;
          if (this._initTimer) { clearTimeout(this._initTimer); this._initTimer = null; }
          resolve(ok);
        };
        this._initResolve = () => finish(true);
        this._initReject = () => {
          this.useFallback = true;
          finish(false);
        };
        // Страховка: если воркер завис до установки обработчиков (например,
        // importScripts не отвечает), внутренний 60-сек таймер воркера не сработает.
        // Не даём главному потоку ждать вечно.
        this._initTimer = setTimeout(() => {
          console.warn('[PyodideWorkerBridge] INIT не ответил за', this.INIT_TIMEOUT_MS, 'мс — переключение на локальный рантайм.');
          this._initResolve = null;
          this._initReject = null;
          this.useFallback = true;
          if (this.worker) {
            try { this.worker.terminate(); } catch (_) {}
            this.worker = null;
          }
          finish(false);
        }, this.INIT_TIMEOUT_MS);
        try {
          this.worker.postMessage({
            type: 'INIT',
            payload: { bootstrap: getCheckerPythonSource() }
          });
        } catch (_) {
          this.useFallback = true;
          finish(false);
        }
      });

      return this.initPromise;
    }

    terminateAndRespawn() {
      if (this.worker) {
        try { this.worker.terminate(); } catch (_) {}
        this.worker = null;
      }
      this.isReady = false;
      this.initPromise = null;
      this.spawnWorker();
    }

    async checkSolution(code, task, timeoutMs = 7000) {
      const ready = await this.ensureReady();
      if (!ready || this.useFallback || !this.worker) {
        return fallbackCheckSolution(code, task);
      }

      const id = ++this.reqId;
      try {
        return await new Promise((resolve, reject) => {
          const timer = setTimeout(() => {
            this.pending.delete(id);
            this.terminateAndRespawn();
            this.ensureReady().catch(() => {});

            resolve({
              passed: false,
              title: 'Превышено время выполнения',
              sub: `Программа выполнялась дольше ${Math.round(timeoutMs / 1000)} секунд. Возможно, в коде бесконечный цикл (проверь while).`,
              stdout: `TimeoutError: Превышено время выполнения программы (${timeoutMs}мс). Код был принудительно остановлен фоновой песочницей («Антифриз»).`,
              isRuntimeError: true,
              friendlyExplain: 'Программа зависла в бесконечном цикле и была принудительно остановлена («Антифриз»). Проверь, изменяются ли переменные внутри цикла while.',
              improveTips: []
            });
          }, timeoutMs);

          this.pending.set(id, { timer, resolve, reject });
          try {
            this.worker.postMessage({
              type: 'CHECK',
              id,
              payload: { code, task }
            });
          } catch (err) {
            clearTimeout(timer);
            this.pending.delete(id);
            this.useFallback = true;
            resolve(fallbackCheckSolution(code, task));
          }
        });
      } catch (err) {
        // Воркер упал (краш/OOM или CHECK_ERROR) УЖЕ ПОСЛЕ того, как взял payload.
        // Повторный запуск того же кода в главном потоке может его заморозить —
        // ровно то, от чего защищает «Антифриз» (issue #2). Возвращаем ошибку
        // как результат, не исполняя код повторно.
        console.warn('[PyodideWorkerBridge] Ошибка исполнения в воркере:', err);
        return sandboxFailureResult(err);
      }
    }

    async runCode(code, timeoutMs = 7000) {
      const ready = await this.ensureReady();
      if (!ready || this.useFallback || !this.worker) {
        return fallbackRunCode(code);
      }

      const id = ++this.reqId;
      try {
        return await new Promise((resolve, reject) => {
          const timer = setTimeout(() => {
            this.pending.delete(id);
            this.terminateAndRespawn();
            this.ensureReady().catch(() => {});

            resolve({
              stdout: '',
              error: `TimeoutError: Превышено время выполнения (${timeoutMs}мс).`
            });
          }, timeoutMs);

          this.pending.set(id, { timer, resolve, reject });
          try {
            this.worker.postMessage({
              type: 'RUN',
              id,
              payload: { code }
            });
          } catch (err) {
            clearTimeout(timer);
            this.pending.delete(id);
            this.useFallback = true;
            resolve(fallbackRunCode(code));
          }
        });
      } catch (err) {
        console.warn('[PyodideWorkerBridge] Ошибка исполнения в воркере (runCode):', err);
        return { stdout: '', error: 'SandboxError: ' + (err && err.message ? err.message : String(err)) };
      }
    }
  }

  const bridge = new PyodideWorkerBridge();

  async function initPyodide(onProgress) {
    if (!bridge.useFallback && bridge.workerSupported) {
      if (onProgress) onProgress('Запуск песочницы Python...');
      const ok = await bridge.ensureReady();
      if (ok) {
        if (onProgress) onProgress('Python готов');
        return true;
      }
    }
    return initPyodideInThread(onProgress);
  }

  async function checkSolution(userCode, task, timeoutMs = 7000) {
    let res;
    if (!bridge.useFallback && bridge.workerSupported) {
      try {
        res = await bridge.checkSolution(userCode, task, timeoutMs);
      } catch (err) {
        // Дублирующая страховка: bridge.checkSolution сам конвертирует отказы
        // в результат. Если исключение всё же дошло сюда — НЕ исполняем код
        // повторно в главном потоке (риск заморозки UI, issue #2).
        console.warn('[CodeChecker] Сбой моста песочницы:', err);
        res = sandboxFailureResult(err);
      }
    } else {
      res = await fallbackCheckSolution(userCode, task);
    }

    if (res && (res.isRuntimeError || res.isSyntaxError) && !res.friendlyExplain && window.FriendlyErrors) {
      res.friendlyExplain = window.FriendlyErrors.explain(res.stdout);
    }
    return res;
  }

  async function runCode(code, timeoutMs = 7000) {
    if (!bridge.useFallback && bridge.workerSupported) {
      try {
        return await bridge.runCode(code, timeoutMs);
      } catch (err) {
        console.warn('[CodeChecker] Сбой моста песочницы (runCode):', err);
        return { stdout: '', error: 'SandboxError: ' + (err && err.message ? err.message : String(err)) };
      }
    }
    return fallbackRunCode(code);
  }

  const fallbackInitPyodideInThread = initPyodideInThread;

  window.CodeChecker = {
    getBridge: () => bridge,
    PyodideWorkerBridge,
    initPyodide,
    fallbackInitPyodideInThread,
    checkSolution,
    runCode,
    fuzzyMatchOutputJS
  };

})(window);
