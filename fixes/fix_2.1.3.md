# FIX_2.1.3.md — Устранение сбоя инициализации Pyodide и зависания ввода в predict

Основание: обращение пользователя по заданию «Срез строки» (раздел «Списки», задание 3, ID: `l1_list_p1`). Симптом: «При вводе ничего не происходит».

---

## 1. Описание инцидента и стектрейс ошибки

При попытке проверки ответа в задании консоль браузера возвращала ошибку:

```text
Ошибка в predict: PythonError: Traceback (most recent call last):
  File "/lib/python312.zip/_pyodide/_base.py", line 597, in eval_code_async
    await CodeRunner(
          ^^^^^^^^^^^
  File "/lib/python312.zip/_pyodide/_base.py", line 285, in __init__
    self.ast = next(self._gen)
               ^^^^^^^^^^^^^^^
  File "/lib/python312.zip/_pyodide/_base.py", line 149, in _parse_and_compile_gen
    mod = compile(source, filename, mode, flags | ast.PyCF_ONLY_AST)
          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "<exec>", line 143
    return '
           ^
SyntaxError: unterminated string literal (detected at line 143)
    initPromise @ app/checker.js:104
    initPyodide @ app/checker.js:405
    runCode @ app/checker.js:477
    runPredictCheck @ app/app.js:1057
```

---

## 2. Корневые причины (Root Cause Analysis)

1. **Неэкранированный перенос строки внутри шаблонного литерала JavaScript (`app/checker.js`):**
   Код вспомогательных функций Python передаётся в `await pyodide.runPythonAsync(...)` внутри обратных кавычек `` ` ``.
   На строках 257 и 282 находились выражения:
   ```javascript
   return '\n'.join(cleaned) if cleaned else tb
   [line + '\n' for line in code_str.splitlines()]
   ```
   Движок JavaScript в браузере при разборе шаблонного литерала преобразовывал `\n` в физический символ перевода строки (ASCII LF).
   В результате компилятор Python получал некорректный синтаксис:
   ```python
   return '
   '.join(cleaned) if cleaned else tb
   ```
   Это приводило к `SyntaxError: unterminated string literal`, краху `initPyodide` и полной неработоспособности среды выполнения Python.

2. **Слабая устойчивость режима Predict к состоянию Pyodide (`app/app.js`):**
   Функция `runPredictCheck` вызывала `CodeChecker.runCode(task.code)` для вычисления вывода, несмотря на то, что у каждого predict-задания в контенте уже зашит эталонный вывод `expectedOutput`. Сбой Pyodide приводил к падению в блок `catch`, где ошибка выводилась в `console.error`, а в интерфейсе кнопка молча сбрасывалась обратно на «Проверить».

3. **Отсутствие обработки клавиши Enter:**
   В поле `#predict-input` обработчик событий ловил только сочетание `Ctrl+Enter` / `Meta+Enter`. При нажатии обычного `Enter` ответ не отправлялся на проверку, а в поле лишь вставлялся невидимый перенос строки.

---

## 3. Внесённые исправления

1. **Экранирование спецсимволов в `app/checker.js`:**
   Заменены `\n` на `\\n`:
   ```javascript
   return '\\n'.join(cleaned) if cleaned else tb
   [line + '\\n' for line in code_str.splitlines()]
   ```
   Теперь при разборе шаблонной строки JavaScript в Python передаётся корректная последовательность `\n`.

2. **Оптимизация и отказоустойчивость `runPredictCheck` в `app/app.js`:**
   - Если в описании задачи задан `task.expectedOutput` (как во всех 11 задачах `predict`), результат нормализуется и проверяется мгновенно без ожидания компиляции WebAssembly.
   - Если происходит непредвиденное исключение, оно явно выводится в плашку результата (`predictResultBox`), а не прячется в консоль.
   - Добавлена дружелюбная подсказка, если ученик вводит строковый ответ в кавычках (например, `"nohtyp"` вместо `nohtyp`).

3. **Поддержка клавиши Enter в `app/app.js` и `index.html`:**
   - По нажатию обычного `Enter` (без Shift) ответ сразу отправляется на проверку (`Shift+Enter` остаётся для многострочного ввода, `Ctrl+Enter` сохраняет работоспособность).
   - В футер режима predict добавлен визуальный хинт: `Enter — проверить, Shift+Enter — новая строка`.

---

## 4. Меры предотвращения повторения (Preventative Automation)

1. **Тест компиляции Python bootstrap в `dev/run_tests.py`:**
   Добавлен тест `[regression_bootstrap_ast]`: перед выполнением проверок Node.js извлекает шаблонную строку из `app/checker.js`, вычисляет её (имитируя браузерный рантайм) и передаёт в Python-модуль `ast.parse()`. При наличии синтаксических ошибок в шаблонной строке CI немедленно останавливает сборку.

2. **Тест экранирования в `dev/run_js_validation.js`:**
   Добавлена проверка шага 14, верифицирующая отсутствие разорванных кавычек в `checker.js`.

3. **Расширение набора тестов `predict`:**
   Задача `l1_list_p1` (`print("python"[::-1])`) добавлена в обязательный список регрессионного прогона тестов `dev/run_tests.py`.
