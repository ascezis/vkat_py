/**
 * вкат.py — Модуль подсветки синтаксиса Python (тема VS Code Dark+)
 */

(function (window) {
  'use strict';

  // Ключевые слова Python
  const CONTROL_KEYWORDS = new Set([
    'if', 'elif', 'else', 'for', 'while', 'return', 'break', 'continue', 'pass', 'try', 'except', 'finally', 'yield'
  ]);

  const OTHER_KEYWORDS = new Set([
    'def', 'class', 'import', 'from', 'as', 'in', 'is', 'not', 'and', 'or', 'lambda', 'global', 'nonlocal', 'assert'
  ]);

  const BUILTIN_FUNCS = new Set([
    'print', 'range', 'len', 'int', 'str', 'float', 'bool', 'list', 'dict', 'set', 'tuple',
    'input', 'append', 'upper', 'lower', 'replace', 'strip', 'split', 'join', 'sum', 'min', 'max', 'abs', 'round'
  ]);

  const CONSTANTS = new Set([
    'True', 'False', 'None'
  ]);

  function escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * Токенизатор Python с точными регулярными выражениями
   */
  function highlightPython(code) {
    if (!code) return '';

    // Регулярное выражение токенов Python:
    // 1: Комментарии: #...
    // 2: Тройные строки: """...""" или '''...'''
    // 3: Обычные строки: "..." или '...' (с поддержкой f-строк)
    // 4: Числа: 123, 3.14
    // 5: Идентификаторы: слова
    // 6: Операторы и пунктуация
    const tokenRegex = /(#.*$)|("""[\s\S]*?"""|'''[\s\S]*?''')|(f?"(?:\\.|[^"\\])*"|f?'(?:\\.|[^'\\])*')|(\b\d+(?:\.\d+)?\b)|(\b[a-zA-Z_]\w*\b)|([^\s\w#"'`]+)/gm;

    let html = '';
    let lastIndex = 0;
    let match;

    while ((match = tokenRegex.exec(code)) !== null) {
      // Текст между токенами (пробелы, переносы строк)
      if (match.index > lastIndex) {
        html += escapeHtml(code.substring(lastIndex, match.index));
      }

      const [full, comment, tripleStr, singleStr, num, ident, punct] = match;

      if (comment) {
        html += `<span class="hl-comment">${escapeHtml(comment)}</span>`;
      } else if (tripleStr || singleStr) {
        const strVal = tripleStr || singleStr;
        if (strVal.startsWith('f"') || strVal.startsWith("f'")) {
          html += `<span class="hl-fstring-prefix">f</span><span class="hl-string">${escapeHtml(strVal.slice(1))}</span>`;
        } else {
          html += `<span class="hl-string">${escapeHtml(strVal)}</span>`;
        }
      } else if (num) {
        html += `<span class="hl-number">${escapeHtml(num)}</span>`;
      } else if (ident) {
        if (CONTROL_KEYWORDS.has(ident)) {
          html += `<span class="hl-keyword-control">${escapeHtml(ident)}</span>`;
        } else if (OTHER_KEYWORDS.has(ident)) {
          html += `<span class="hl-keyword">${escapeHtml(ident)}</span>`;
        } else if (CONSTANTS.has(ident)) {
          html += `<span class="hl-constant">${escapeHtml(ident)}</span>`;
        } else if (BUILTIN_FUNCS.has(ident)) {
          html += `<span class="hl-builtin">${escapeHtml(ident)}</span>`;
        } else {
          // Проверяем, не вызов ли это функции (следующий непробельный символ — '(')
          const rest = code.substring(tokenRegex.lastIndex);
          if (/^\s*\(/.test(rest)) {
            html += `<span class="hl-func-call">${escapeHtml(ident)}</span>`;
          } else {
            html += `<span class="hl-variable">${escapeHtml(ident)}</span>`;
          }
        }
      } else if (punct) {
        html += `<span class="hl-punct">${escapeHtml(punct)}</span>`;
      }

      lastIndex = tokenRegex.lastIndex;
    }

    if (lastIndex < code.length) {
      html += escapeHtml(code.substring(lastIndex));
    }

    // Если код заканчивается на перевод строки, добавляем невидимый символ для совпадения высоты
    if (code.endsWith('\n')) {
      html += '<br>';
    }

    return html;
  }

  class PythonHighlighter {
    constructor(textarea, highlightEl) {
      this.textarea = textarea;
      this.highlightEl = highlightEl;

      this.init();
    }

    init() {
      const update = () => this.update();
      this.textarea.addEventListener('input', update);
      this.textarea.addEventListener('scroll', () => this.syncScroll());

      // Первичная подсветка
      this.update();
    }

    update() {
      this.highlightEl.innerHTML = highlightPython(this.textarea.value);
      this.syncScroll();
    }

    syncScroll() {
      this.highlightEl.scrollTop = this.textarea.scrollTop;
      this.highlightEl.scrollLeft = this.textarea.scrollLeft;
      // Синхронизация номеров строк
      const lineNumEl = document.getElementById('line-numbers');
      if (lineNumEl) {
        lineNumEl.scrollTop = this.textarea.scrollTop;
      }
    }
  }

  window.PythonHighlighter = PythonHighlighter;
  window.PythonHighlighter.highlightCode = highlightPython;

})(window);
