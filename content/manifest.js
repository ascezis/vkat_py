/**
 * вкат.py — Манифест загрузки скриптов (Zero-build Convention Loader, issue #12)
 *
 * Единственный источник истины о списке и порядке скриптов приложения.
 * index.html расширяет его через document.write (parser-вставленные теги —
 * синхронный порядок исполнения и совместимость с file://), dev-харнесс
 * (run_js_validation.js, selftest.html) грузит те же списки через loadScript.
 *
 * Конвенции:
 *   - content[] грузится до app[]: контент — чистые данные без зависимостей.
 *   - app/kernel.js — первым среди app-модулей (service locator).
 *   - app/app.js — последним (оркестратор, DOMContentLoaded → startApp).
 *   - НЕ входит: pyodide-ассеты (инфраструктура index.html),
 *     app/checker-worker.js (контекст Web Worker, грузится самим checker'ом).
 *   - Файлы-черновики именуются с "_" в начале (content/**\__*.js) и
 *     валидатором не требуют.
 *
 * Добавление новой темы = одна строка здесь + id в stages.js (см.
 * docs/ADDING-TOPICS.md). Валидатор сверяет манифест с файлами на диске.
 */

window.VKAT_MANIFEST = {
  // ─── Контент: этапы, темы, шпаргалка, пет-проекты ───────────────────────────
  content: [
    'content/stages.js',
    // Раздел 1 «Начало» (start)
    'content/start/01-variables.js',
    'content/start/02-conditions.js',
    'content/start/03-loops.js',
    'content/start/04-functions.js',
    'content/start/05-lists-dicts.js',
    'content/start/06-strings.js',
    // Раздел 2 «Основной курс» (core)
    'content/core/01-functions.js',
    'content/core/02-dicts.js',
    'content/core/03-lists.js',
    'content/core/04-tuples.js',
    'content/core/05-strings-adv.js',
    'content/core/06-loops-adv.js',
    'content/core/07-nested-structures.js',
    'content/guided/matrices.js',
    'content/core/08-exceptions.js',
    'content/core/11-code-style.js',
    // Раздел 3 «Практикум» (practice)
    'content/practice/l2-algorithms.js',
    'content/practice/l2-io-input.js',
    // База конструкций и подсказки по коду в теории
    'content/cheatsheet.js',
    // Витрина пет-проектов (вне COURSE_TOPICS/COURSE_STAGES)
    'content/projects/life/tasks.js',
    'content/projects/pet/tasks.js'
  ],

  // ─── Ядро и модули приложения ────────────────────────────────────────────────
  app: [
    'app/kernel.js',
    'app/version.js',
    'app/storage.js',
    'app/errors.js',
    'app/checker.js',
    'app/code-hints.js',
    'app/autocomplete.js',
    'app/glyphs.js',
    'app/highlighter.js',
    'app/profiles.js',
    'app/renderers.js',
    'app/checkers.js',
    'app/connect.js',
    'app/help.js',
    'app/grid-warp.js',
    'app/life-renderer.js',
    'app/pet-art.js',
    'app/pet-dictionary-lab.js',
    'app/pet-renderer.js',
    'app/sandbox.js',
    'app/app.js'
  ]
};
