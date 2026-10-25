/**
 * вкат.py — Подсказки по конструкциям Python в теории (Code Hints)
 *
 * Предоставляет всплывающие мини-карточки при наведении или клике на токены
 * Python в блоках кода теории (.theory-block-code).
 *
 * Публичный API:
 *   window.CodeHints = {
 *     register(sections),        // строит индекс trigger -> карточка
 *     attach(rootEl, options),   // размечает токены внутри code блоков
 *     find(code),                // чистая функция: код -> [{start, end, token, cardId}]
 *     close()                    // закрыть всплывающую карточку
 *   };
 */

(function (window) {
  'use strict';

  // Индексы
  const cardsById = new Map();
  const dotTriggers = new Map();   // e.g. '.get' -> card
  const bareTriggers = new Map();  // e.g. 'range' -> card

  // Состояние всплывающего окна
  let popoverEl = null;
  let activeTokenEl = null;
  let openTimer = null;
  let closeTimer = null;
  let isListeningGlobal = false;

  /**
   * Регистрация секций справочника и построение индексов триггеров
   */
  function register(sections) {
    cardsById.clear();
    dotTriggers.clear();
    bareTriggers.clear();

    if (!Array.isArray(sections)) return;

    sections.forEach((sec) => {
      (sec.items || []).forEach((card) => {
        if (!card || !card.id) return;
        cardsById.set(card.id, card);

        if (Array.isArray(card.triggers)) {
          card.triggers.forEach((tr) => {
            if (typeof tr === 'string') {
              const t = tr.trim();
              if (t.startsWith('.')) {
                dotTriggers.set(t, card);
              } else if (t.length > 0) {
                bareTriggers.set(t, card);
              }
            }
          });
        }
      });
    });
  }

  /**
   * Единое правило сопоставления токена с карточкой.
   * Используется и в find() (текст), и в attach() (DOM), чтобы они не расходились.
   *
   * @param {string} name       имя без точки: "get", "range", "KeyError"
   * @param {boolean} afterDot  токен стоит после точки (метод/атрибут)
   * @returns {Object|null}     карточка или null
   */
  function lookup(name, afterDot) {
    if (!name) return null;
    return (afterDot ? dotTriggers.get('.' + name) : bareTriggers.get(name)) || null;
  }

  /**
   * Чистый лексический поиск токенов в коде (для тестов и статического анализа).
   * Не размечает токены внутри строк, комментариев и чисел.
   *
   * @param {string} code
   * @returns {Array<{start: number, end: number, token: string, cardId: string}>}
   */
  function find(code) {
    if (!code || typeof code !== 'string') return [];

    const results = [];
    // 1: Комментарии: #...
    // 2: Тройные строки: """...""" или '''...'''
    // 3: Обычные строки: "..." или '...' (включая f-строки)
    // 4: Числа: 123, 3.14, .5
    // 5: Идентификатор с точкой: \.([a-zA-Z_]\w*)
    // 6: Одиночный идентификатор: \b([a-zA-Z_]\w*)\b
    const tokenRegex = /(#.*$)|("""[\s\S]*?(?:"""|$)|'''[\s\S]*?(?:'''|$))|(f?"(?:\\.|[^"\n\\])*(?:"|$)|f?'(?:\\.|[^'\n\\])*(?:'|$))|(\b\d+\.\d+\b|\b\d+\b|\.\d+\b)|(\.([a-zA-Z_]\w*))|(\b([a-zA-Z_]\w*)\b)/gm;

    let match;
    while ((match = tokenRegex.exec(code)) !== null) {
      const comment = match[1];
      const tripleStr = match[2];
      const singleStr = match[3];
      const num = match[4];
      const dottedIdent = match[6];
      const bareIdent = match[8];

      // Пропускаем комментарии, строки и числа
      if (comment || tripleStr || singleStr || num) {
        continue;
      }

      if (dottedIdent) {
        const token = '.' + dottedIdent;
        const card = lookup(dottedIdent, true);
        if (card) {
          results.push({
            start: match.index,
            end: match.index + match[0].length,
            token: token,
            cardId: card.id
          });
        }
      } else if (bareIdent) {
        const token = bareIdent;
        const card = lookup(bareIdent, false);
        if (card) {
          results.push({
            start: match.index,
            end: match.index + match[0].length,
            token: token,
            cardId: card.id
          });
        }
      }
    }

    return results;
  }

  /**
   * Проверка, открыт ли сейчас поповер
   */
  function isVisible() {
    return popoverEl && popoverEl.classList.contains('visible');
  }

  /**
   * Закрытие всплывающей подсказки
   */
  function close() {
    if (openTimer) {
      clearTimeout(openTimer);
      openTimer = null;
    }
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }

    if (popoverEl) {
      popoverEl.classList.remove('visible');
      popoverEl.style.display = 'none';
      popoverEl.setAttribute('aria-hidden', 'true');
    }

    if (activeTokenEl) {
      activeTokenEl.removeAttribute('aria-expanded');
      activeTokenEl.removeAttribute('aria-describedby');
      activeTokenEl = null;
    }
  }

  /**
   * Компактный пример для карточки: без пустых строк, максимум MAX_EXAMPLE_LINES строк,
   * выравнивающие пробелы перед комментарием схлопнуты. Полный пример остаётся в данных.
   */
  const MAX_EXAMPLE_LINES = 5;
  function compactExample(code) {
    const lines = String(code || '')
      .split('\n')
      .filter((l) => l.trim() !== '')
      .map((l) => l.replace(/\s{2,}#/, '  #'));
    if (lines.length <= MAX_EXAMPLE_LINES) return lines.join('\n');
    return lines.slice(0, MAX_EXAMPLE_LINES).join('\n') + '\n…';
  }

  /**
   * Позиционирование карточки. Приоритет: справа от блока кода (не закрывая код),
   * затем под блоком, затем над блоком, и только потом рядом с токеном.
   */
  function place(tokenEl) {
    const pad = 12;
    const gap = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    popoverEl.style.visibility = 'hidden';
    popoverEl.style.display = 'block';
    const popW = popoverEl.offsetWidth || 340;
    const popH = popoverEl.offsetHeight || 180;

    const tr = tokenEl.getBoundingClientRect();
    const block = tokenEl.closest ? tokenEl.closest('.theory-block-code') : null;
    const br = block ? block.getBoundingClientRect() : tr;

    const clampTop = (t) => Math.max(pad, Math.min(t, vh - pad - popH));
    let left;
    let top;

    if (block && br.right + gap + popW <= vw - pad) {
      // 1. Справа от блока, по высоте выровнено с токеном
      left = br.right + gap;
      top = clampTop(tr.top - 8);
    } else if (block && br.bottom + gap + popH <= vh - pad) {
      // 2. Под блоком
      left = Math.max(pad, Math.min(br.left, vw - pad - popW));
      top = br.bottom + gap;
    } else if (block && br.top - gap - popH >= pad) {
      // 3. Над блоком
      left = Math.max(pad, Math.min(br.left, vw - pad - popW));
      top = br.top - gap - popH;
    } else {
      // 4. Запасной вариант: рядом с токеном (снизу, при нехватке места сверху)
      left = Math.max(pad, Math.min(tr.left, vw - pad - popW));
      top = tr.bottom + gap;
      if (top + popH > vh - pad) top = clampTop(tr.top - gap - popH);
    }

    popoverEl.style.left = Math.round(left) + 'px';
    popoverEl.style.top = Math.round(top) + 'px';
    popoverEl.style.visibility = 'visible';
  }

  /**
   * Создание и инициализация единственного DOM-элемента карточки
   */
  function ensurePopoverEl() {
    if (typeof document === 'undefined') return null;
    if (popoverEl) return popoverEl;

    popoverEl = document.getElementById('hint-popover');
    if (popoverEl) return popoverEl;

    popoverEl = document.createElement('div');
    popoverEl.id = 'hint-popover';
    popoverEl.className = 'hint-popover';
    popoverEl.setAttribute('role', 'tooltip');
    popoverEl.setAttribute('aria-hidden', 'true');
    popoverEl.style.display = 'none';

    popoverEl.innerHTML = `
      <div class="hint-popover-header">
        <div class="hint-popover-title" id="hint-popover-title"></div>
        <button type="button" class="hint-popover-close" id="hint-popover-close" aria-label="Закрыть подсказку">✕</button>
      </div>
      <div class="hint-popover-syntax"><code id="hint-popover-syntax"></code></div>
      <div class="hint-popover-desc" id="hint-popover-desc"></div>
      <div class="hint-popover-code"><pre><code id="hint-popover-code"></code></pre></div>
      <div class="hint-popover-pitfall-wrap" id="hint-popover-pitfall" style="display: none;">
        <button type="button" class="hint-popover-pitfall-toggle" id="hint-popover-pitfall-toggle" aria-expanded="false">ловушка</button>
        <div class="hint-popover-pitfall" id="hint-popover-pitfall-text" hidden></div>
      </div>
      <!-- Скрытое место под будущую ссылку «Подробнее» -->
      <div class="hint-popover-more" id="hint-popover-more" style="display: none;">
        <span class="hint-popover-more-link">подробнее</span>
      </div>
    `;

    document.body.appendChild(popoverEl);

    const toggleBtn = popoverEl.querySelector('#hint-popover-pitfall-toggle');
    const pitfallText = popoverEl.querySelector('#hint-popover-pitfall-text');
    toggleBtn.addEventListener('click', () => {
      const show = pitfallText.hidden;
      pitfallText.hidden = !show;
      toggleBtn.setAttribute('aria-expanded', show ? 'true' : 'false');
      toggleBtn.textContent = show ? 'скрыть ловушку' : 'ловушка';
      // Высота изменилась: перепозиционируем, чтобы карточка не вылезла за экран
      if (activeTokenEl) place(activeTokenEl);
    });

    popoverEl.querySelector('#hint-popover-close').addEventListener('click', close);

    // Курсор на самом поповере сохраняет его открытым
    popoverEl.addEventListener('pointerenter', () => {
      if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = null;
      }
    });

    popoverEl.addEventListener('pointerleave', () => {
      closeTimer = setTimeout(close, 200);
    });

    initGlobalListeners();
    return popoverEl;
  }

  /**
   * Глобальные слушатели для закрытия (Esc, клик вне, скролл)
   */
  function initGlobalListeners() {
    if (isListeningGlobal || typeof window === 'undefined') return;
    isListeningGlobal = true;

    // Esc закрывает ТОЛЬКО если подсказка открыта (не перехватывает Esc для дерева тем и PIN-модалки)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isVisible()) {
        e.preventDefault();
        e.stopPropagation();
        close();
      }
    }, true);

    // Клик вне подсказки и вне токена
    document.addEventListener('pointerdown', (e) => {
      if (!isVisible()) return;
      if (popoverEl && popoverEl.contains(e.target)) return;
      if (e.target && e.target.closest && e.target.closest('.hint-token')) return;
      close();
    });

    // Скролл страницы закрывает подсказку. Скролл ВНУТРИ самой карточки её не закрывает.
    document.addEventListener('scroll', (e) => {
      if (!isVisible()) return;
      if (popoverEl && e.target instanceof Node && popoverEl.contains(e.target)) return;
      close();
    }, { passive: true, capture: true });
  }

  /**
   * Открытие карточки для конкретного токена
   */
  function open(tokenEl, card) {
    if (!tokenEl || !card) return;
    ensurePopoverEl();
    if (!popoverEl) return;

    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }

    activeTokenEl = tokenEl;
    tokenEl.setAttribute('aria-expanded', 'true');
    tokenEl.setAttribute('aria-describedby', 'hint-popover');

    // Заполнение данными
    const elTitle = document.getElementById('hint-popover-title');
    const elSyntax = document.getElementById('hint-popover-syntax');
    const elDesc = document.getElementById('hint-popover-desc');
    const elCode = document.getElementById('hint-popover-code');
    const elPitfall = document.getElementById('hint-popover-pitfall');
    const elPitfallText = document.getElementById('hint-popover-pitfall-text');
    const elPitfallToggle = document.getElementById('hint-popover-pitfall-toggle');

    if (elTitle) elTitle.textContent = card.title || '';
    if (elSyntax) elSyntax.textContent = card.syntax || '';
    if (elDesc) elDesc.textContent = card.desc || '';
    if (elCode) elCode.textContent = compactExample(card.code);

    // Ловушка свёрнута по умолчанию: раскрывается кликом по «ловушка»
    if (elPitfall && elPitfallText && elPitfallToggle) {
      if (card.pitfall) {
        elPitfallText.textContent = card.pitfall;
        elPitfallText.hidden = true;
        elPitfallToggle.textContent = 'ловушка';
        elPitfallToggle.setAttribute('aria-expanded', 'false');
        elPitfall.style.display = 'block';
      } else {
        elPitfall.style.display = 'none';
      }
    }

    place(tokenEl);
    popoverEl.classList.add('visible');
    popoverEl.setAttribute('aria-hidden', 'false');
  }

  /**
   * Навешивание обработчиков событий на токен
   */
  function bindTokenEvents(tokenEl, card) {
    // Наведение с задержкой ~250мс
    tokenEl.addEventListener('pointerenter', () => {
      if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = null;
      }
      openTimer = setTimeout(() => {
        open(tokenEl, card);
      }, 250);
    });

    tokenEl.addEventListener('pointerleave', () => {
      if (openTimer) {
        clearTimeout(openTimer);
        openTimer = null;
      }
      if (isVisible() && activeTokenEl === tokenEl) {
        closeTimer = setTimeout(close, 300);
      }
    });

    // Клик / тап
    tokenEl.addEventListener('click', (e) => {
      e.stopPropagation();
      if (isVisible() && activeTokenEl === tokenEl) {
        close();
      } else {
        open(tokenEl, card);
      }
    });

    // Доступность с клавиатуры: Enter или Space
    tokenEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        if (isVisible() && activeTokenEl === tokenEl) {
          close();
        } else {
          open(tokenEl, card);
        }
      }
    });
  }

  /**
   * Разметка токенов внутри блоков кода DOM-дерева rootEl.
   *
   * Не ломает подсветку синтаксиса, обходит существующие span-элементы.
   * Не размечает внутри .hl-comment, .hl-string и .out.
   *
   * @param {HTMLElement} rootEl
   * @param {Object} [options]
   */
  function attach(rootEl, options) {
    if (!rootEl || typeof document === 'undefined') return;

    // Убеждаемся, что база зарегистрирована
    if (cardsById.size === 0 && window.CHEATSHEET_SECTIONS) {
      register(window.CHEATSHEET_SECTIONS);
    }

    const selector = (options && options.selector) || '.theory-block-code';
    // По умолчанию размечаем только первое вхождение каждой карточки на странице:
    // иначе print/for/if подчёркнуты в каждом примере и код превращается в «ёлку».
    const firstOnly = !(options && options.firstOnly === false);
    const seenCards = new Set();
    const blocks = [];

    if (rootEl.matches && rootEl.matches(selector)) {
      blocks.push(rootEl);
    }
    if (rootEl.querySelectorAll) {
      rootEl.querySelectorAll(selector).forEach((el) => blocks.push(el));
    }

    blocks.forEach((block) => {
      if (block.dataset && block.dataset.hintsAttached === 'true') {
        return;
      }
      if (block.dataset) {
        block.dataset.hintsAttached = 'true';
      }

      // Собираем прямые дочерние узлы в массив (так как будем модифицировать DOM)
      const childNodes = Array.from(block.childNodes);

      for (let i = 0; i < childNodes.length; i++) {
        const node = childNodes[i];

        // Пропускаем текстовые узлы
        if (node.nodeType !== 1) continue;

        // Игнорируем вывод программы и уже размеченные токены
        if (node.classList.contains('out') || node.classList.contains('hint-token')) {
          continue;
        }

        // Игнорируем комментарии и строки
        if (node.classList.contains('hl-comment') || node.classList.contains('hl-string')) {
          continue;
        }

        const text = (node.textContent || '').trim();
        if (!text) continue;

        // Проверяем, предшествует ли этому узлу точка (метод или атрибут)
        let isPrecededByDot = false;
        let prevDotNode = null;

        // Ищем предшествующий непустой узел
        let prev = node.previousSibling;
        while (prev && prev.nodeType === 3 && !prev.textContent.trim()) {
          prev = prev.previousSibling;
        }

        if (prev) {
          if (prev.nodeType === 1 && prev.textContent.trim() === '.') {
            isPrecededByDot = true;
            prevDotNode = prev;
          } else if (prev.nodeType === 3 && prev.textContent.trim().endsWith('.')) {
            // Если точка в текстовом узле
            isPrecededByDot = true;
          }
        }

        if (isPrecededByDot) {
          const card = lookup(text, true);
          if (card && !(firstOnly && seenCards.has(card.id))) {
            seenCards.add(card.id);
            const wrapper = document.createElement('span');
            wrapper.className = 'hint-token';
            wrapper.setAttribute('data-hint', card.id);
            wrapper.setAttribute('tabindex', '0');
            wrapper.setAttribute('role', 'button');

            if (prevDotNode && prevDotNode.parentNode === block) {
              // Оборачиваем вместе с предшествующей точкой: <span class="hint-token">.get</span>
              block.insertBefore(wrapper, prevDotNode);
              wrapper.appendChild(prevDotNode);
              wrapper.appendChild(node);
            } else {
              block.insertBefore(wrapper, node);
              wrapper.appendChild(node);
            }

            bindTokenEvents(wrapper, card);
            continue;
          }
        } else {
          // Одиночный токен (ключевое слово, встроенная функция, исключение) НЕ после точки
          const card = lookup(text, false);
          if (card && !(firstOnly && seenCards.has(card.id))) {
            seenCards.add(card.id);
            const wrapper = document.createElement('span');
            wrapper.className = 'hint-token';
            wrapper.setAttribute('data-hint', card.id);
            wrapper.setAttribute('tabindex', '0');
            wrapper.setAttribute('role', 'button');

            block.insertBefore(wrapper, node);
            wrapper.appendChild(node);

            bindTokenEvents(wrapper, card);
            continue;
          }
        }
      }
    });
  }

  // Публичный API
  window.CodeHints = {
    register,
    attach,
    find,
    close,
    lookup
  };

  // Автоматическая регистрация при загрузке, если база уже доступна
  if (typeof window !== 'undefined' && window.CHEATSHEET_SECTIONS) {
    register(window.CHEATSHEET_SECTIONS);
  }

})(typeof window !== 'undefined' ? window : global);
