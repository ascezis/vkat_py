# ИНСТРУКЦИЯ ДЛЯ CLAUDE: РЕАЛИЗАЦИЯ МОДУЛЯ «СПРАВОЧНИК» (CHEAT SHEET)

## 1. Роль и контекст
Ты выступаешь в роли ведущего разработчика и контент-архитектора образовательного веб-тренажёра **vkat.py**.
Задача: реализовать **Блок А дорожной карты (модуль «Справочник по Python»)** в строгом соответствии со спецификацией [`CHEATSHEET-SPEC.md`](CHEATSHEET-SPEC.md) и [Issue #3](https://github.com/ascezis/vkat_py/issues/3).

Архитектурный закон: **файлы учебных тем (`content/start/*.js`, `content/core/*.js`) НЕ изменяются.** Вся привязка идёт через массив `topics: [...]` внутри карточек справочника.

---

## 2. Что требуется создать (Scope)

### Часть 1. Контентная база (`content/cheatsheet.js`)
Создать файл `content/cheatsheet.js`, экспортирующий `window.CHEATSHEET_SECTIONS` со всеми **7 обязательными разделами** из спецификации:
1. `basics` (Базовый синтаксис и типы: `int/float/str/bool`, `print()`, `input()`, `//`, `%`, f-строки. Связь: `topics: ['variables']`).
2. `control` (Условия и циклы: `if/elif/else`, `and/or/not`, `for in range()`, `while`, `break/continue`. Связь: `topics: ['conditions', 'loops', 'l1_loops_adv']`).
3. `strings` (Строки и срезы: срезы `s[a:b:c]`, `.split()`, `.join()`, `.strip()`, `.replace()`, `.find()`, регистр, неизменяемость. Связь: `topics: ['strings', 'l1_strings']`).
4. `lists_tuples` (Списки и кортежи: `.append()`, `.pop()`, `.sort()` vs `sorted()`, `len()`, срезы, распаковка `a, b = tup`, неизменяемость кортежей. Связь: `topics: ['lists-dicts', 'l1_lists', 'l1_tuples']`).
5. `dicts_sets` (Словари и множества: доступ `d[k]`, безопасный `.get(k, default)`, `.items()`, `.keys()`, `.values()`, проверка `k in d`, `set().add()`, вложенные словари. Связь: `topics: ['lists-dicts', 'l1_dicts', 'l1_nested_structures']`).
6. `functions` (Функции: `def f(x, y=0):`, `return` vs `print`, значения по умолчанию, область видимости, встроенные `len()`, `sum()`, `min()`, `max()`. Связь: `topics: ['functions', 'l1_functions']`).
7. `errors` (Скорая помощь при ошибках: `SyntaxError`, `IndentationError`, `NameError`, `IndexError`, `KeyError`, `TypeError`, `ZeroDivisionError`. Связь: `topics: []`).

**Требования к каждой карточке (`item`):**
- Уникальный `id` (snake_case).
- Понятный `syntax` и ёмкое описание `desc` (1–2 фразы простым языком).
- Мини-пример `code` с комментариями `# результат`.
- Обязательно поле `pitfall` (пограничный случай, частая ошибка учеников, почему падает программа).
- Обязательно поле `style` (рекомендация по PEP 8 и чистоте кода).
- Массив `topics` с точными ID тем курса.
- Массив `tags` для живого поиска.

---

### Часть 2. Движок интерфейса (`app/cheatsheet.js`)
Создать модуль `app/cheatsheet.js`, экспортирующий `window.Cheatsheet`:
- `init()`: биндинг кнопки в топбаре (`#btn-cheatsheet-toggle`), оверлея, кликов по табам, поиска, хоткеев `F1`, `Ctrl+/`, закрытия по `Esc`.
- `open(options)`: открытие правой шторки, автофокус на строку поиска.
- `openForTopic(topicId)`: контекстное открытие с фильтрацией по текущей теме занятия.
- `close()`: закрытие шторки и **возврат фокуса в `#editor-textarea`**.
- `toggle()`: открыть / закрыть.
- `filter(query, sectionId)`: мгновенный поиск без регулярных выражений (по `title`, `syntax`, `desc`, `code`, `pitfall`, `tags`).
- `copyCode(text, btn)`: копирование фрагмента кода с временной индикацией кнопки («скопировано»).

---

### Часть 3. Разметка (`index.html`)
1. В `#app-topbar` добавить кнопку открытия справочника рядом с кнопкой смены профиля:
   ```html
   <button id="btn-cheatsheet-toggle" class="btn-cheatsheet-toggle" title="Справочник по синтаксису (F1 или Ctrl+/)">
     ? справочник
   </button>
   ```
2. В конце `body` добавить оверлей и шторку:
   ```html
   <div id="cheatsheet-overlay" class="cheatsheet-overlay"></div>
   <div id="cheatsheet-drawer" class="cheatsheet-drawer" aria-label="Справочник по Python">
     ... шапка, строка поиска, табы категорий, список карточек ...
   </div>
   ```
3. Подключить `<script src="content/cheatsheet.js"></script>` и `<script src="app/cheatsheet.js"></script>`.

---

### Часть 4. Стили (`app/styles.css`)
- Позиционирование `.cheatsheet-drawer` справа: `position: fixed; top: 0; right: -480px; width: 460px; max-width: 92vw; height: 100vh; height: 100dvh; background: var(--bg-panel); border-left: 1px solid var(--border-strong); z-index: 2000; transition: right 0.28s cubic-bezier(0.16, 1, 0.3, 1); display: flex; flex-direction: column;`.
- Класс открытого состояния: `.cheatsheet-drawer.open { right: 0; }`.
- Монохромный дизайн-код: 0px border-radius, границы `1px solid var(--border)` / `var(--border-strong)`, 6px скроллбар, плашки инлайн-кода `code`, подсветка блоков кода в стиле редактора.

---

## 3. СТРОГИЙ ФОРМАТ ВЫВОДА (CRITICAL)

1. Твой ответ должен представлять собой **unified diff патч** (`git diff` / `patch`).
2. Пути файлов в патче должны быть строго относительно корня репозитория:
   * `--- /dev/null`
   * `+++ b/content/cheatsheet.js`
   * `--- /dev/null`
   * `+++ b/app/cheatsheet.js`
   * `--- a/index.html`
   * `+++ b/index.html`
   * `--- a/app/styles.css`
   * `+++ b/app/styles.css`
3. Патч должен чисто применяться командой `git apply`.
4. Содержимое `content/cheatsheet.js` должно быть полным (не обрывай код многоточиями `// ... rest of code`), с качественным русским текстом.
