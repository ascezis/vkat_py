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
        const card = dotTriggers.get(token);
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
        const card = bareTriggers.get(token);
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
      activeTokenEl = null;
    }
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
      </div>
      <div class="hint-popover-syntax"><code id="hint-popover-syntax"></code></div>
      <div class="hint-popover-desc" id="hint-popover-desc"></div>
      <div class="hint-popover-code"><pre><code id="hint-popover-code"></code></pre></div>
      <div class="hint-popover-pitfall" id="hint-popover-pitfall" style="display: none;">
        <span class="hint-popover-pitfall-label">ловушка:</span>
        <span class="hint-popover-pitfall-text" id="hint-popover-pitfall-text"></span>
      </div>
      <!-- Скрытое место под будущую ссылку «Подробнее» -->
      <div class="hint-popover-more" id="hint-popover-more" style="display: none;">
        <span class="hint-popover-more-link">подробнее</span>
      </div>
    `;

    document.body.appendChild(popoverEl);

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

    // Скролл в любом контейнере (включая theoryContent) закрывает подсказку
    document.addEventListener('scroll', () => {
      if (isVisible()) {
        close();
      }
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

    // Заполнение данными
    const elTitle = document.getElementById('hint-popover-title');
    const elSyntax = document.getElementById('hint-popover-syntax');
    const elDesc = document.getElementById('hint-popover-desc');
    const elCode = document.getElementById('hint-popover-code');
    const elPitfall = document.getElementById('hint-popover-pitfall');
    const elPitfallText = document.getElementById('hint-popover-pitfall-text');

    if (elTitle) elTitle.textContent = card.title || '';
    if (elSyntax) elSyntax.textContent = card.syntax || '';
    if (elDesc) elDesc.textContent = card.desc || '';
    if (elCode) elCode.textContent = card.code || '';

    if (card.pitfall && elPitfall && elPitfallText) {
      elPitfallText.textContent = card.pitfall;
      elPitfall.style.display = 'block';
    } else if (elPitfall) {
      elPitfall.style.display = 'none';
    }

    // Подготовка к позиционированию: делаем невидимым, но доступным для замера размеров
    popoverEl.style.display = 'block';
    popoverEl.style.visibility = 'hidden';

    const rect = tokenEl.getBoundingClientRect();
    const popW = popoverEl.offsetWidth || 340;
    const popH = popoverEl.offsetHeight || 180;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const pad = 12;
    const gap = 6;

    // Горизонтальное выравнивание с зажатием в границы окна
    let left = rect.left;
    if (left + popW > vw - pad) {
      left = vw - pad - popW;
    }
    if (left < pad) {
      left = pad;
    }

    // Вертикальное позиционирование: снизу, при нехватке места — сверху
    let top = rect.bottom + gap;
    if (top + popH > vh - pad) {
      const topAbove = rect.top - gap - popH;
      if (topAbove >= pad || topAbove > (vh - top - popH)) {
        top = Math.max(pad, topAbove);
      } else {
        top = Math.max(pad, Math.min(top, vh - pad - popH));
      }
    }

    popoverEl.style.left = Math.round(left) + 'px';
    popoverEl.style.top = Math.round(top) + 'px';
    popoverEl.style.visibility = 'visible';
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
        closeTimer = setTimeout(close, 200);
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
          const dotToken = '.' + text;
          const card = dotTriggers.get(dotToken);
          if (card) {
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
          const card = bareTriggers.get(text);
          if (card) {
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
    close
  };

  // Автоматическая регистрация при загрузке, если база уже доступна
  if (typeof window !== 'undefined' && window.CHEATSHEET_SECTIONS) {
    register(window.CHEATSHEET_SECTIONS);
  }

})(typeof window !== 'undefined' ? window : global);
