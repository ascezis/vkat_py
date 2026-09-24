/**
 * вкат.py — Модуль интеллектуального редактора (IntelliSense)
 * 1. Автодополнение (Autocomplete) для ключевых слов, функций Python и переменных
 * 2. Автозакрытие парных скобок (), [], {} и кавычек "", ''
 * 3. Умный Backspace для удаления 4 пробелов (unindent) и парных скобок
 */

(function (window) {
  'use strict';

  const BUILTIN_SUGGESTIONS = [
    { text: "print", insert: "print()", cursorOffset: -1, desc: "вывод в консоль", type: "fn" },
    { text: "range", insert: "range()", cursorOffset: -1, desc: "диапазон чисел", type: "fn" },
    { text: "len", insert: "len()", cursorOffset: -1, desc: "длина коллекции", type: "fn" },
    { text: "int", insert: "int()", cursorOffset: -1, desc: "в целое число", type: "fn" },
    { text: "str", insert: "str()", cursorOffset: -1, desc: "в строку", type: "fn" },
    { text: "input", insert: "input()", cursorOffset: -1, desc: "ввод данных", type: "fn" },
    { text: "append", insert: "append()", cursorOffset: -1, desc: "добавить в список", type: "fn" },
    { text: "upper", insert: "upper()", cursorOffset: 0, desc: "в верхний регистр", type: "fn" },
    { text: "lower", insert: "lower()", cursorOffset: 0, desc: "в нижний регистр", type: "fn" },
    { text: "replace", insert: "replace()", cursorOffset: -1, desc: "замена в строке", type: "fn" },
    { text: "def", insert: "def", cursorOffset: 0, desc: "объявление функции", type: "kw" },
    { text: "return", insert: "return", cursorOffset: 0, desc: "возврат значения", type: "kw" },
    { text: "for", insert: "for", cursorOffset: 0, desc: "цикл со счётчиком", type: "kw" },
    { text: "while", insert: "while", cursorOffset: 0, desc: "цикл по условию", type: "kw" },
    { text: "if", insert: "if", cursorOffset: 0, desc: "условие", type: "kw" },
    { text: "elif", insert: "elif", cursorOffset: 0, desc: "иначе-если", type: "kw" },
    { text: "else", insert: "else:", cursorOffset: 0, desc: "ветка иначе", type: "kw" },
    { text: "in", insert: "in", cursorOffset: 0, desc: "оператор вхождения", type: "kw" },
    { text: "and", insert: "and", cursorOffset: 0, desc: "логическое И", type: "kw" },
    { text: "or", insert: "or", cursorOffset: 0, desc: "логическое ИЛИ", type: "kw" },
    { text: "not", insert: "not", cursorOffset: 0, desc: "логическое НЕ", type: "kw" },
    { text: "True", insert: "True", cursorOffset: 0, desc: "булево истина", type: "val" },
    { text: "False", insert: "False", cursorOffset: 0, desc: "булево ложь", type: "val" },
    { text: "None", insert: "None", cursorOffset: 0, desc: "пустое значение", type: "val" },
    { text: "enumerate", insert: "enumerate()", cursorOffset: -1, desc: "индекс + элемент", type: "fn" },
    { text: "zip", insert: "zip()", cursorOffset: -1, desc: "объединение списков", type: "fn" },
    { text: "sorted", insert: "sorted()", cursorOffset: -1, desc: "отсортировать", type: "fn" },
    { text: "type", insert: "type()", cursorOffset: -1, desc: "тип объекта", type: "fn" },
    { text: "map", insert: "map()", cursorOffset: -1, desc: "применить функцию", type: "fn" },
    { text: "filter", insert: "filter()", cursorOffset: -1, desc: "фильтрация", type: "fn" },
    { text: "isinstance", insert: "isinstance()", cursorOffset: -1, desc: "проверка типа", type: "fn" },
    { text: "abs", insert: "abs()", cursorOffset: -1, desc: "модуль числа", type: "fn" },
    { text: "round", insert: "round()", cursorOffset: -1, desc: "округление", type: "fn" },
    { text: "break", insert: "break", cursorOffset: 0, desc: "выход из цикла", type: "kw" },
    { text: "continue", insert: "continue", cursorOffset: 0, desc: "следующая итерация", type: "kw" },
    { text: "pass", insert: "pass", cursorOffset: 0, desc: "пустой оператор", type: "kw" }
  ];

  class CodeIntelliSense {
    constructor(textarea, popupEl) {
      this.textarea = textarea;
      this.popup = popupEl;
      this.isOpen = false;
      this.selectedIndex = 0;
      this.currentSuggestions = [];
      this.currentWord = "";
      this.wordStartPos = 0;

      this.init();
    }

    init() {
      this.textarea.addEventListener('keydown', (e) => this.handleKeyDown(e));
      this.textarea.addEventListener('input', () => this.handleInput());
      this.textarea.addEventListener('click', () => this.close());
      document.addEventListener('click', (e) => {
        if (!this.popup.contains(e.target) && e.target !== this.textarea) {
          this.close();
        }
      });
    }

    /**
     * Сбор локальных переменных из кода ученика
     */
    extractUserIdentifiers() {
      const code = this.textarea.value;
      const matches = code.match(/\b[a-zA-Z_]\w*\b/g) || [];
      const set = new Set();
      for (const m of matches) {
        if (m.length >= 2 && !BUILTIN_SUGGESTIONS.some(b => b.text === m)) {
          set.add(m);
        }
      }
      return Array.from(set).map(id => ({
        text: id,
        insert: id,
        cursorOffset: 0,
        desc: "переменная",
        type: "var"
      }));
    }

    /**
     * Обработка парных символов и навигации по подсказкам
     */
    handleKeyDown(e) {
      const start = this.textarea.selectionStart;
      const end = this.textarea.selectionEnd;
      const val = this.textarea.value;

      // 1. Навигация в открытом меню подсказок
      if (this.isOpen) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          this.selectedIndex = (this.selectedIndex + 1) % this.currentSuggestions.length;
          this.renderPopup();
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          this.selectedIndex = (this.selectedIndex - 1 + this.currentSuggestions.length) % this.currentSuggestions.length;
          this.renderPopup();
          return;
        }
        if (e.key === 'Enter' || e.key === 'Tab') {
          e.preventDefault();
          e.stopImmediatePropagation();
          this.acceptSuggestion(this.currentSuggestions[this.selectedIndex]);
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          this.close();
          return;
        }
      }

      // 2. Автозакрытие парных скобок и кавычек
      const pairs = {
        '(': ')',
        '[': ']',
        '{': '}',
        '"': '"',
        "'": "'"
      };

      // Пропуск закрывающего символа, если он уже стоит перед курсором
      const nextChar = val.charAt(start);
      if ((e.key === ')' || e.key === ']' || e.key === '}' || e.key === '"' || e.key === "'") && nextChar === e.key && start === end) {
        e.preventDefault();
        this.textarea.selectionStart = this.textarea.selectionEnd = start + 1;
        return;
      }

      // Оборачивание выделения или вставка пары
      if (pairs[e.key]) {
        e.preventDefault();
        const closeChar = pairs[e.key];
        const selectedText = val.substring(start, end);

        this.textarea.value = val.substring(0, start) + e.key + selectedText + closeChar + val.substring(end);
        if (selectedText.length > 0) {
          this.textarea.selectionStart = start + 1;
          this.textarea.selectionEnd = end + 1;
        } else {
          this.textarea.selectionStart = this.textarea.selectionEnd = start + 1;
        }
        this.triggerEditorChange();
        return;
      }

      // 3. Умный Backspace (удаление парных пустых скобок и unindent на 4 пробела)
      if (e.key === 'Backspace' && start === end && start > 0) {
        const prevChar = val.charAt(start - 1);
        const followingChar = val.charAt(start);

        // Удаление парных скобок () [] {} "" ''
        if (
          (prevChar === '(' && followingChar === ')') ||
          (prevChar === '[' && followingChar === ']') ||
          (prevChar === '{' && followingChar === '}') ||
          (prevChar === '"' && followingChar === '"') ||
          (prevChar === "'" && followingChar === "'")
        ) {
          e.preventDefault();
          this.textarea.value = val.substring(0, start - 1) + val.substring(start + 1);
          this.textarea.selectionStart = this.textarea.selectionEnd = start - 1;
          this.triggerEditorChange();
          return;
        }

        // Unindent: удаление сразу 4 пробелов, если перед курсором только отступ
        const lineStart = val.lastIndexOf('\n', start - 1) + 1;
        const beforeCursor = val.substring(lineStart, start);
        if (beforeCursor.length >= 4 && /^ +$/.test(beforeCursor) && beforeCursor.length % 4 === 0) {
          e.preventDefault();
          this.textarea.value = val.substring(0, start - 4) + val.substring(start);
          this.textarea.selectionStart = this.textarea.selectionEnd = start - 4;
          this.triggerEditorChange();
          return;
        }
      }
    }

    /**
     * Поиск текущего слова при вводе
     */
    handleInput() {
      const pos = this.textarea.selectionStart;
      const val = this.textarea.value;

      // Ищем начало текущего слова
      let start = pos - 1;
      while (start >= 0 && /[a-zA-Z0-9_]/.test(val.charAt(start))) {
        start--;
      }
      start++;

      const word = val.substring(start, pos);
      this.currentWord = word;
      this.wordStartPos = start;

      // Подсказываем, если введено хотя бы 2 буквы (или 1 буква для частых 'p', 'f', 'd', 'r', 'i')
      if (word.length >= 2 || (word.length === 1 && /^[pfdrwi]/.test(word))) {
        this.searchSuggestions(word);
      } else {
        this.close();
      }
    }

    searchSuggestions(prefix) {
      const p = prefix.toLowerCase();
      const userVars = this.extractUserIdentifiers();
      const all = [...BUILTIN_SUGGESTIONS, ...userVars];

      const matches = all.filter(item => item.text.toLowerCase().startsWith(p) && item.text.toLowerCase() !== p);

      if (matches.length > 0) {
        this.currentSuggestions = matches.slice(0, 6);
        this.selectedIndex = 0;
        this.positionPopup();
        this.renderPopup();
        this.isOpen = true;
      } else {
        this.close();
      }
    }

    acceptSuggestion(item) {
      if (!item) return;
      const val = this.textarea.value;
      const pos = this.textarea.selectionStart;

      const before = val.substring(0, this.wordStartPos);
      const after = val.substring(pos);

      this.textarea.value = before + item.insert + after;
      const newCursorPos = before.length + item.insert.length + (item.cursorOffset || 0);
      this.textarea.selectionStart = this.textarea.selectionEnd = newCursorPos;

      this.close();
      this.textarea.focus();
      this.triggerEditorChange();
    }

    positionPopup() {
      const val = this.textarea.value;
      const pos = this.textarea.selectionStart;

      // Считаем номер строки
      const lines = val.substring(0, pos).split('\n');
      const lineIndex = lines.length - 1;
      const colIndex = lines[lines.length - 1].length;

      // 14px шрифт + 1.75 line-height = ~24.5px на строку + 20px padding
      const top = Math.min(220, 20 + (lineIndex + 1) * 24.5);
      const left = Math.min(300, 22 + colIndex * 8.4);

      this.popup.style.top = top + 'px';
      this.popup.style.left = left + 'px';
    }

    renderPopup() {
      this.popup.innerHTML = '';
      this.currentSuggestions.forEach((item, idx) => {
        const el = document.createElement('div');
        el.className = 'autocomplete-item' + (idx === this.selectedIndex ? ' selected' : '');

        const badge = document.createElement('span');
        badge.className = 'autocomplete-badge badge-' + item.type;
        badge.textContent = item.type;

        const name = document.createElement('span');
        name.className = 'autocomplete-name';
        name.textContent = item.text;

        const desc = document.createElement('span');
        desc.className = 'autocomplete-desc';
        desc.textContent = item.desc;

        el.appendChild(badge);
        el.appendChild(name);
        el.appendChild(desc);

        el.addEventListener('mousedown', (e) => {
          e.preventDefault();
          this.acceptSuggestion(item);
        });

        this.popup.appendChild(el);
      });
      this.popup.style.display = 'block';
    }

    close() {
      this.isOpen = false;
      this.popup.style.display = 'none';
      this.popup.innerHTML = '';
    }

    triggerEditorChange() {
      this.textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  window.CodeIntelliSense = CodeIntelliSense;

})(window);
