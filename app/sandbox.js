/**
 * вкат.py — Модуль «Песочница Python» (app/sandbox.js)
 *
 * Свободная среда для экспериментов, тестирования алгоритмов и бенчмарков.
 * Исполнение через PyodideWorkerBridge (Web Worker, изоляция от UI, антифриз).
 *
 * Архитектурные принципы:
 *   1. Zero-Build, Vanilla JS (ES2020), без внешних runtime-зависимостей.
 *   2. Изоляция хранилища: автосохранение драфта только через VkatStorage.
 *   3. Полная защита от зависаний: таймаут 15 секунд + ручная остановка worker.terminate().
 *   4. Никаких эмодзи в интерфейсе (только символы Unicode: ▶, ⏹, •, ✓, ✕, →, ←).
 */

(function (window) {
  'use strict';

  const document = window.document || (typeof globalThis !== 'undefined' && globalThis.document) || null;

  const SANDBOX_DRAFT_KEY = '__sandbox__';

  // ─── Заготовки кода (Пресеты) ────────────────────────────────────────────────

  const PRESETS = {
    empty: {
      title: 'Чистый скрипт',
      code:
`# Песочница Python 3.12 (Pyodide Worker)
# Пиши любой код, тестируй идеи и алгоритмы

def main():
    names = ["Аня", "Борис", "Влад", "Даша"]
    for i, name in enumerate(names, 1):
        print(f"{i}. Привет, {name}!")

if __name__ == "__main__":
    main()
`
    },
    benchmark: {
      title: 'Замер скорости (Benchmark)',
      code:
`# Сравнение производительности: цикл for vs list comprehension
import time

N = 500_000

# 1. Обычный цикл с .append()
t0 = time.perf_counter()
res1 = []
for x in range(N):
    res1.append(x * 2)
t_loop = (time.perf_counter() - t0) * 1000

# 2. List comprehension
t0 = time.perf_counter()
res2 = [x * 2 for x in range(N)]
t_comp = (time.perf_counter() - t0) * 1000

print(f"Обработано элементов: {N:,}")
print(f"1. Цикл for + append:   {t_loop:.2f} мс")
print(f"2. List comprehension:  {t_comp:.2f} мс")
if t_comp > 0:
    print(f"Ускорение:              {t_loop / t_comp:.2f}x")
`
    },
    binary_search: {
      title: 'Алгоритм: Бинарный поиск O(log N)',
      code:
`# Классический бинарный поиск в отсортированном массиве

def binary_search(arr, target):
    left = 0
    right = len(arr) - 1
    steps = 0
    
    while left <= right:
        steps += 1
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid, steps
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
            
    return -1, steps

# Тест на массиве из 1 000 000 элементов
data = list(range(0, 2_000_000, 2))  # только чётные числа
target = 1_234_568

idx, steps = binary_search(data, target)
print(f"Размер массива: {len(data):,} элементов")
print(f"Ищем число: {target}")
print(f"Индекс элемента: {idx} (значение: {data[idx]})")
print(f"Потребовалось сравнений: {steps} (из максимум ~20)")
`
    },
    freq_dict: {
      title: 'Алгоритм: Частотный словарь',
      code:
`# Частотный анализ слов в тексте

text = """
Python — высокоуровневый язык программирования общего назначения
с акцентом на читаемость кода и простой синтаксис.
Python поддерживает структурное, объектно-ориентированное и функциональное программирование.
"""

# Очистка от пунктуации и подсчёт
words = [w.strip(".,—;:!?\\n").lower() for w in text.split() if w.strip(".,—;:!?\\n")]
freq = {}
for w in words:
    freq[w] = freq.get(w, 0) + 1

# Сортировка по убыванию частоты
sorted_words = sorted(freq.items(), key=lambda pair: pair[1], reverse=True)

print(f"Всего слов: {len(words)}, уникальных: {len(freq)}\\n")
print(f"{'Слово':<18} | {'Частота':<8}")
print("-" * 30)
for word, count in sorted_words[:10]:
    print(f"{word:<18} | {count:<8}")
`
    },
    comprehensions: {
      title: 'Продвинутые списки и срезы',
      code:
`# Продвинутые приёмы работы с коллекциями в Python

matrix = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
]

# 1. Транспонирование матрицы в одну строку
transposed = [[row[i] for row in matrix] for i in range(3)]
print("Исходная матрица:")
for r in matrix:
    print(r)

print("\\nТранспонированная матрица:")
for r in transposed:
    print(r)

# 2. Словарь квадратов чётных чисел
even_squares = {x: x**2 for x in range(12) if x % 2 == 0}
print("\\nКвадраты чётных чисел:", even_squares)

# 3. Срез: проверка палиндрома
phrase = "А роза упала на лапу Азора"
clean = phrase.replace(" ", "").lower()
print(f"\\nФраза: '{phrase}'")
print("Палиндром?", clean == clean[::-1])
`
    },
    oop_stack: {
      title: 'Структура данных: Стек (Stack)',
      code:
`# Реализация структуры данных LIFO (Стек) с валидацией скобок

class Stack:
    def __init__(self):
        self._items = []

    def push(self, item):
        self._items.append(item)

    def pop(self):
        if self.is_empty():
            raise IndexError("pop from empty stack")
        return self._items.pop()

    def peek(self):
        return self._items[-1] if not self.is_empty() else None

    def is_empty(self):
        return len(self._items) == 0

    def __len__(self):
        return len(self._items)


def is_balanced(expr):
    stack = Stack()
    brackets = {')': '(', ']': '[', '}': '{'}
    for ch in expr:
        if ch in brackets.values():
            stack.push(ch)
        elif ch in brackets.keys():
            if stack.is_empty() or stack.pop() != brackets[ch]:
                return False
    return stack.is_empty()


tests = ["({[]})", "([)]", "{[()]}()", "((("]
print("Проверка парности скобок через Стек:\\n")
for t in tests:
    res = "Сбалансировано" if is_balanced(t) else "Нарушено"
    print(f"  {t:<14} -> {res}")
`
    }
  };

  // ─── Состояние ───────────────────────────────────────────────────────────────

  const S = {
    active: false,
    previousScreen: 'start',
    isRunning: false,
    runSeq: 0,
    dom: {},
    highlighter: null,
    intellisense: null
  };

  // ─── Кэширование DOM ─────────────────────────────────────────────────────────

  function cacheDom() {
    const d = id => document.getElementById(id);
    S.dom = {
      screen: d('screen-sandbox'),
      btnBack: d('btn-sandbox-back'),
      btnRun: d('btn-sandbox-run'),
      btnStop: d('btn-sandbox-stop'),
      btnClearOut: d('btn-sandbox-clear-out'),
      btnReset: d('btn-sandbox-reset'),
      btnCopy: d('btn-sandbox-copy'),
      btnDownload: d('btn-sandbox-download'),
      presetSelect: d('sandbox-preset-select'),
      editor: d('sandbox-code-editor'),
      editorHighlight: d('sandbox-editor-highlight'),
      lineNumbers: d('sandbox-line-numbers'),
      autocompletePopup: d('sandbox-autocomplete-popup'),
      saveStatus: d('sandbox-save-status'),
      btnUndo: d('btn-sandbox-undo'),
      termDot: d('sandbox-term-dot'),
      termStatus: d('sandbox-term-status'),
      termTime: d('sandbox-term-time'),
      termLines: d('sandbox-term-lines'),
      termWelcome: d('sandbox-terminal-welcome'),
      termOutput: d('sandbox-terminal-output'),
      termContainer: d('sandbox-terminal-body')
    };
  }

  // ─── Редактор и подсветка ────────────────────────────────────────────────────

  function updateLineNumbers() {
    if (!S.dom.editor || !S.dom.lineNumbers) return;
    const lines = S.dom.editor.value.split('\n').length;
    let html = '';
    for (let i = 1; i <= lines; i++) {
      html += i + '\n';
    }
    S.dom.lineNumbers.textContent = html;
  }

  function onEditorChange() {
    updateLineNumbers();
    if (S.highlighter) S.highlighter.update();
    const code = S.dom.editor ? S.dom.editor.value : '';
    if (!S.suppressUndoHide) hideUndo();
    if (window.VkatStorage) {
      // Черновик хранится в данных активного профиля, а не в общих настройках
      window.VkatStorage.saveDraftDebounced(SANDBOX_DRAFT_KEY, code);
      if (S.dom.saveStatus) {
        S.dom.saveStatus.textContent = 'сохранено локально';
      }
    }
  }

  // ─── «Вернуть прежний код» после замены шаблоном ─────────────────────────────

  function showUndo(prevCode) {
    S.undoCode = prevCode;
    if (S.undoTimer) clearTimeout(S.undoTimer);
    S.undoTimer = setTimeout(hideUndo, 20000);
    if (S.dom.btnUndo) S.dom.btnUndo.hidden = false;
  }

  function hideUndo() {
    S.undoCode = null;
    if (S.undoTimer) { clearTimeout(S.undoTimer); S.undoTimer = null; }
    if (S.dom.btnUndo) S.dom.btnUndo.hidden = true;
  }

  function undoReplace() {
    if (S.undoCode == null || !S.dom.editor) return;
    const code = S.undoCode;
    S.dom.editor.value = code;
    hideUndo();
    onEditorChange();
    S.dom.editor.focus();
  }

  // ─── Запуск и исполнение кода ────────────────────────────────────────────────

  async function runCode() {
    if (S.isRunning) return;
    const code = S.dom.editor ? S.dom.editor.value : '';
    if (!code.trim()) {
      setOutput('// В редакторе нет кода для запуска.', 'muted');
      return;
    }

    S.isRunning = true;
    S.runSeq += 1;
    const seq = S.runSeq;
    updateRunButtons();
    setTerminalStatus('running', 'Выполняется...');

    const t0 = performance.now();
    let res = null;

    try {
      if (window.CodeChecker && typeof window.CodeChecker.runCode === 'function') {
        // Запуск через изолированный воркер с таймаутом 15 секунд
        res = await window.CodeChecker.runCode(code, 15000);
      } else {
        res = { stdout: '', error: 'CodeChecker не инициализирован.' };
      }
    } catch (err) {
      res = { stdout: '', error: String(err && err.message ? err.message : err) };
    } finally {
      // Запуск отменён пользователем (стоп-кнопка) — игнорируем результат,
      // чтобы таймаут-сообщение не перезаписало «Прервано пользователем».
      if (seq !== S.runSeq) return;
      const dt = Math.round(performance.now() - t0);
      S.isRunning = false;
      updateRunButtons();

      if (S.dom.termTime) {
        S.dom.termTime.textContent = 'Время: ' + dt + ' мс';
      }

      if (res && res.error) {
        setTerminalStatus('error', 'Ошибка выполнения');
        let fullErr = '';
        if (res.stdout) fullErr += res.stdout + '\n';
        fullErr += res.error;
        setOutput(fullErr, 'error');
      } else {
        setTerminalStatus('ok', 'Выполнено успешно');
        const out = (res && res.stdout) ? res.stdout : '// [Программа завершилась без вывода (код 0)]';
        setOutput(out, 'stdout');
      }
    }
  }

  function stopExecution() {
    if (!S.isRunning) return;
    S.runSeq += 1; // инвалидируем результат текущего запуска
    if (window.CodeChecker && typeof window.CodeChecker.getBridge === 'function') {
      const bridge = window.CodeChecker.getBridge();
      if (bridge && typeof bridge.terminateAndRespawn === 'function') {
        bridge.terminateAndRespawn();
      }
    }
    S.isRunning = false;
    updateRunButtons();
    setTerminalStatus('error', 'Прервано пользователем');
    setOutput('// Выполнение скрипта прервано пользователем.', 'error');
  }

  function updateRunButtons() {
    if (S.dom.btnRun) S.dom.btnRun.style.display = S.isRunning ? 'none' : 'inline-flex';
    if (S.dom.btnStop) S.dom.btnStop.style.display = S.isRunning ? 'inline-flex' : 'none';
  }

  function setTerminalStatus(type, text) {
    if (S.dom.termDot) {
      S.dom.termDot.className = 'terminal-dot ' + type;
    }
    if (S.dom.termStatus) {
      S.dom.termStatus.textContent = text;
    }
  }

  function setOutput(content, type) {
    if (S.dom.termWelcome) S.dom.termWelcome.style.display = 'none';
    if (S.dom.termOutput) {
      S.dom.termOutput.style.display = 'block';
      S.dom.termOutput.className = 'terminal-output ' + (type || '');
      S.dom.termOutput.textContent = content;
      // Подсчёт строк вывода
      const lines = content ? content.replace(/\n$/, '').split('\n').length : 0;
      if (S.dom.termLines) {
        S.dom.termLines.textContent = 'Строк: ' + lines;
      }
    }
    if (S.dom.termContainer) {
      S.dom.termContainer.scrollTop = S.dom.termContainer.scrollHeight;
    }
  }

  function clearOutput() {
    if (S.dom.termOutput) {
      S.dom.termOutput.textContent = '';
      S.dom.termOutput.style.display = 'none';
    }
    if (S.dom.termWelcome) S.dom.termWelcome.style.display = 'block';
    setTerminalStatus('ready', 'Готов к запуску');
    if (S.dom.termTime) S.dom.termTime.textContent = 'Время: —';
    if (S.dom.termLines) S.dom.termLines.textContent = 'Строк: 0';
  }

  // ─── Пресеты и действия ──────────────────────────────────────────────────────

  // ─── Меню шаблонов (замена нативного select; select остаётся источником значения) ───

  function initPresetMenu() {
    const sel = S.dom.presetSelect;
    const btn = document.getElementById('sandbox-preset-btn');
    const list = document.getElementById('sandbox-preset-list');
    const cur = document.getElementById('sandbox-preset-current');
    if (!sel || !btn || !list || !cur) return;

    let activeIdx = -1;
    const opts = Array.from(sel.options);

    list.innerHTML = '';
    opts.forEach((o, i) => {
      const li = document.createElement('li');
      li.className = 'sandbox-menu-item';
      li.setAttribute('role', 'option');
      li.dataset.value = o.value;
      const name = document.createElement('span');
      name.textContent = o.textContent;
      li.appendChild(name);
      if (o.dataset.tag) {
        const tag = document.createElement('span');
        tag.className = 'sandbox-menu-tag';
        tag.textContent = o.dataset.tag;
        li.appendChild(tag);
      }
      li.addEventListener('mousedown', e => e.preventDefault());
      li.addEventListener('click', () => choose(i));
      li.addEventListener('mousemove', () => setActive(i));
      list.appendChild(li);
    });

    function items() { return Array.from(list.children); }

    function sync() {
      const idx = Math.max(0, sel.selectedIndex);
      cur.textContent = opts[idx] ? opts[idx].textContent : '';
      items().forEach((li, i) => li.setAttribute('aria-selected', String(i === idx)));
    }

    function setActive(i) {
      activeIdx = i;
      items().forEach((li, k) => li.classList.toggle('is-active', k === i));
      const li = items()[i];
      if (li && li.scrollIntoView) li.scrollIntoView({ block: 'nearest' });
    }

    function isOpen() { return !list.hidden; }

    function open() {
      list.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
      setActive(Math.max(0, sel.selectedIndex));
    }

    function close() {
      list.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
    }

    function choose(i) {
      close();
      btn.focus();
      if (i === sel.selectedIndex) return;
      sel.selectedIndex = i;
      sync();
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }

    btn.addEventListener('click', () => (isOpen() ? close() : open()));

    btn.addEventListener('keydown', e => {
      const n = opts.length;
      if (e.key === 'Escape' && isOpen()) {
        e.preventDefault(); e.stopPropagation(); close();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault(); e.stopPropagation();
        if (!isOpen()) { open(); return; }
        setActive((activeIdx + (e.key === 'ArrowDown' ? 1 : -1) + n) % n);
      } else if ((e.key === 'Enter' || e.key === ' ') && isOpen()) {
        e.preventDefault(); e.stopPropagation(); choose(activeIdx);
      } else if (e.key === 'Home' && isOpen()) {
        e.preventDefault(); setActive(0);
      } else if (e.key === 'End' && isOpen()) {
        e.preventDefault(); setActive(n - 1);
      } else if (e.key === 'Tab' && isOpen()) {
        close();
      }
    });

    document.addEventListener('mousedown', e => {
      if (isOpen() && !e.target.closest('#sandbox-preset-menu')) close();
    });

    S.syncPresetMenu = sync;
    sync();
  }

  function selectPreset(presetKey, opts) {
    const silent = !!(opts && opts.silent);
    const p = PRESETS[presetKey] || PRESETS.empty;
    if (S.dom.editor) {
      const prev = S.dom.editor.value;
      S.dom.editor.value = p.code;
      S.suppressUndoHide = true;
      onEditorChange();
      S.suppressUndoHide = false;
      if (!silent && prev.trim() && prev !== p.code) showUndo(prev);
      else hideUndo();
    }
    clearOutput();
    if (S.dom.editor) {
      S.dom.editor.focus();
    }
  }

  function resetCode() {
    const key = S.dom.presetSelect ? S.dom.presetSelect.value : 'empty';
    selectPreset(key);
  }

  function copyCode() {
    if (!S.dom.editor) return;
    const text = S.dom.editor.value;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showCopyFeedback('Скопировано!');
      }).catch(() => {
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    try {
      S.dom.editor.select();
      document.execCommand('copy');
      showCopyFeedback('Скопировано!');
    } catch (_) {
      showCopyFeedback('Не удалось');
    }
  }

  function showCopyFeedback(msg) {
    if (!S.dom.btnCopy) return;
    const orig = S.dom.btnCopy.textContent;
    S.dom.btnCopy.textContent = msg;
    setTimeout(() => {
      if (S.dom.btnCopy) S.dom.btnCopy.textContent = orig;
    }, 1500);
  }

  function downloadCode() {
    if (!S.dom.editor) return;
    const code = S.dom.editor.value;
    const blob = new Blob([code], { type: 'text/x-python;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sandbox.py';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ─── События ─────────────────────────────────────────────────────────────────

  function setupEvents() {
    if (S.dom.btnBack) {
      S.dom.btnBack.addEventListener('click', () => {
        const dest = (S.previousScreen && S.previousScreen !== 'sandbox') ? S.previousScreen : 'start';
        if (window.VkatApp && typeof window.VkatApp.showScreen === 'function') {
          window.VkatApp.showScreen(dest);
        }
      });
    }

    if (S.dom.btnRun) S.dom.btnRun.addEventListener('click', runCode);
    if (S.dom.btnStop) S.dom.btnStop.addEventListener('click', stopExecution);
    if (S.dom.btnClearOut) S.dom.btnClearOut.addEventListener('click', clearOutput);
    if (S.dom.btnReset) S.dom.btnReset.addEventListener('click', resetCode);
    if (S.dom.btnUndo) S.dom.btnUndo.addEventListener('click', undoReplace);
    if (S.dom.btnCopy) S.dom.btnCopy.addEventListener('click', copyCode);
    if (S.dom.btnDownload) S.dom.btnDownload.addEventListener('click', downloadCode);

    if (S.dom.presetSelect) {
      S.dom.presetSelect.addEventListener('change', e => {
        selectPreset(e.target.value);
      });
      initPresetMenu();
    }

    // Подсветка синтаксиса и автодополнение в редакторе песочницы
    if (window.PythonHighlighter && S.dom.editor && S.dom.editorHighlight) {
      S.highlighter = new window.PythonHighlighter(S.dom.editor, S.dom.editorHighlight);
    }
    if (window.CodeIntelliSense && S.dom.editor && S.dom.autocompletePopup) {
      S.intellisense = new window.CodeIntelliSense(S.dom.editor, S.dom.autocompletePopup);
    }

    // Горячие клавиши: Ctrl+Enter для запуска, Tab для 4 пробелов
    if (S.dom.editor) {
      S.dom.editor.addEventListener('keydown', e => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          runCode();
          return;
        }
        if (S.dom.autocompletePopup && S.dom.autocompletePopup.style.display === 'block') {
          if (['Tab', 'Enter', 'ArrowUp', 'ArrowDown', 'Escape'].includes(e.key)) {
            return;
          }
        }
        if (e.key === 'Tab') {
          e.preventDefault();
          const ed = S.dom.editor;
          const start = ed.selectionStart;
          const end = ed.selectionEnd;
          let inserted = false;
          try {
            inserted = Boolean(document.execCommand && document.execCommand('insertText', false, '    '));
          } catch (_) {}
          if (!inserted) {
            ed.value = ed.value.substring(0, start) + '    ' + ed.value.substring(end);
            ed.selectionStart = ed.selectionEnd = start + 4;
          }
          onEditorChange();
        }
      });

      S.dom.editor.addEventListener('input', onEditorChange);
      S.dom.editor.addEventListener('scroll', () => {
        if (S.dom.lineNumbers) S.dom.lineNumbers.scrollTop = S.dom.editor.scrollTop;
        if (S.dom.editorHighlight) {
          S.dom.editorHighlight.scrollTop = S.dom.editor.scrollTop;
          S.dom.editorHighlight.scrollLeft = S.dom.editor.scrollLeft;
        }
      });
    }
  }

  // ─── Вход и выход с экрана ───────────────────────────────────────────────────

  function enter(prevScreen) {
    S.active = true;
    if (prevScreen && prevScreen !== 'sandbox') {
      S.previousScreen = prevScreen;
    }

    // Редактор мог остаться от другого профиля на этом компьютере — очищаем,
    // затем подгружаем черновик активного профиля (или шаблон по умолчанию).
    hideUndo();
    if (S.dom.editor) S.dom.editor.value = '';
    const applyDraft = (saved) => {
      if (!S.active) return;
      if (typeof saved === 'string' && saved.trim()) {
        if (S.dom.editor) S.dom.editor.value = saved;
      } else {
        if (S.dom.presetSelect) S.dom.presetSelect.value = 'empty';
        if (S.syncPresetMenu) S.syncPresetMenu();
        selectPreset('empty', { silent: true });
      }
      updateLineNumbers();
      if (S.highlighter) S.highlighter.update();
    };
    if (window.VkatStorage) {
      window.VkatStorage.flushSync();
      window.VkatStorage.load()
        .then(data => applyDraft(data && data.drafts ? data.drafts[SANDBOX_DRAFT_KEY] : null))
        .catch(() => applyDraft(null));
    } else {
      applyDraft(null);
    }

    updateLineNumbers();
    if (S.highlighter) S.highlighter.update();
    if (S.dom.editor) {
      setTimeout(() => S.dom.editor.focus(), 50);
    }
  }

  function leave() {
    S.active = false;
    hideUndo();
    if (S.isRunning) {
      stopExecution();
    }
    if (window.VkatStorage) {
      window.VkatStorage.flushSync();
    }
  }

  function init() {
    cacheDom();
    setupEvents();
  }

  window.VkatSandbox = {
    init,
    enter,
    leave,
    runCode,
    stopExecution,
    clearOutput,
    selectPreset,
    _presets: PRESETS,
    _state: S
  };
})(window);
