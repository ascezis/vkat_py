/**
 * вкат.py — Движок встроенного справочника (Cheatsheet Drawer)
 *
 * Инкапсулирует правую выезжающую шторку, живой поиск без регулярных выражений,
 * контекстное открытие по F1 / текущей теме курса и копирование сниппетов.
 */
(function (window) {
  'use strict';

  // Состояние модуля
  let isInitialized = false;
  let activeSectionId = 'all';     // 'all' или ID раздела ('basics', 'strings' и т.д.)
  let activeTopicFilter = null;    // ID темы курса ('l1_dicts' и т.д.) или null
  let searchQuery = '';

  // Ссылки на DOM
  const dom = {};

  function init() {
    if (isInitialized) return;

    dom.drawer = document.getElementById('cheatsheet-drawer');
    dom.backdrop = document.getElementById('cheatsheet-backdrop');
    dom.searchInput = document.getElementById('cheatsheet-search-input');
    dom.searchClear = document.getElementById('cheatsheet-search-clear');
    dom.tabsContainer = document.getElementById('cheatsheet-tabs');
    dom.topicBadge = document.getElementById('cheatsheet-topic-badge');
    dom.topicBadgeText = document.getElementById('cheatsheet-topic-badge-text');
    dom.topicBadgeReset = document.getElementById('cheatsheet-topic-badge-reset');
    dom.cardsContainer = document.getElementById('cheatsheet-cards');
    dom.cardsCount = document.getElementById('cheatsheet-cards-count');
    dom.btnClose = document.getElementById('btn-cheatsheet-close');
    dom.btnToggle = document.getElementById('btn-cheatsheet-toggle');
    dom.btnToggleStart = document.getElementById('btn-cheatsheet-start');

    if (!dom.drawer) return;

    // Кнопки открытия/закрытия
    if (dom.btnToggle) {
      dom.btnToggle.addEventListener('click', toggle);
    }
    if (dom.btnToggleStart) {
      dom.btnToggleStart.addEventListener('click', toggle);
    }
    if (dom.btnClose) {
      dom.btnClose.addEventListener('click', close);
    }
    if (dom.backdrop) {
      dom.backdrop.addEventListener('click', close);
    }

    // Поиск
    if (dom.searchInput) {
      dom.searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim().toLowerCase();
        if (dom.searchClear) {
          dom.searchClear.style.display = searchQuery ? 'block' : 'none';
        }
        renderCards();
      });
    }

    if (dom.searchClear) {
      dom.searchClear.addEventListener('click', () => {
        if (dom.searchInput) {
          dom.searchInput.value = '';
          dom.searchInput.focus();
        }
        searchQuery = '';
        dom.searchClear.style.display = 'none';
        renderCards();
      });
    }

    // Сброс контекстного фильтра темы
    if (dom.topicBadgeReset) {
      dom.topicBadgeReset.addEventListener('click', () => {
        activeTopicFilter = null;
        renderTopicBadge();
        renderCards();
      });
    }

    // Горячие клавиши: F1 и Ctrl+/ для вызова справочника
    window.addEventListener('keydown', (e) => {
      // F1: перехватываем стандартную справку браузера
      if (e.key === 'F1') {
        e.preventDefault();
        toggle();
        return;
      }

      // Ctrl+/ или Cmd+/
      if ((e.ctrlKey || e.metaKey) && (e.key === '/' || e.key === '?' || e.code === 'Slash')) {
        e.preventDefault();
        toggle();
        return;
      }

      // Esc закрывает открытый справочник
      if (e.key === 'Escape' && isOpen()) {
        e.preventDefault();
        close();
      }
    });

    isInitialized = true;
    renderTabs();
  }

  function isOpen() {
    return dom.drawer && dom.drawer.classList.contains('open');
  }

  function open(options = {}) {
    if (!isInitialized) init();
    if (!dom.drawer) return;

    if (options.topicId) {
      activeTopicFilter = options.topicId;
    }

    renderTopicBadge();
    renderTabs();
    renderCards();

    dom.drawer.classList.add('open');
    if (dom.backdrop) dom.backdrop.classList.add('open');

    // Автофокус на поле поиска
    setTimeout(() => {
      if (dom.searchInput) {
        dom.searchInput.focus();
        if (dom.searchInput.value) dom.searchInput.select();
      }
    }, 60);
  }

  function openForTopic(topicId) {
    open({ topicId: topicId || null });
  }

  function close() {
    if (!dom.drawer) return;
    dom.drawer.classList.remove('open');
    if (dom.backdrop) dom.backdrop.classList.remove('open');

    // Возврат фокуса в редактор, если мы на экране урока
    const editor = document.getElementById('editor-textarea');
    if (editor && editor.offsetParent !== null) {
      setTimeout(() => editor.focus(), 50);
    }
  }

  function toggle() {
    if (isOpen()) {
      close();
    } else {
      const currentTopic = window.state && window.state.currentTopicId ? window.state.currentTopicId : null;
      openForTopic(currentTopic);
    }
  }

  function renderTopicBadge() {
    if (!dom.topicBadge) return;
    if (!activeTopicFilter) {
      dom.topicBadge.style.display = 'none';
      return;
    }

    dom.topicBadge.style.display = 'flex';
    if (dom.topicBadgeText) {
      dom.topicBadgeText.textContent = 'По теме: ' + activeTopicFilter;
    }
  }

  function renderTabs() {
    if (!dom.tabsContainer) return;
    const sections = window.CHEATSHEET_SECTIONS || [];

    let html = `<button type="button" class="cheatsheet-tab ${activeSectionId === 'all' ? 'active' : ''}" data-section="all">Все</button>`;

    sections.forEach((sec) => {
      const isActive = activeSectionId === sec.id;
      html += `<button type="button" class="cheatsheet-tab ${isActive ? 'active' : ''}" data-section="${escapeHtml(sec.id)}">${escapeHtml(sec.title)}</button>`;
    });

    dom.tabsContainer.innerHTML = html;

    // Навешиваем клики на табы
    const tabs = dom.tabsContainer.querySelectorAll('.cheatsheet-tab');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        activeSectionId = tab.dataset.section;
        renderCards();
      });
    });
  }

  function getMatchingItems() {
    const sections = window.CHEATSHEET_SECTIONS || [];
    const q = searchQuery;
    const items = [];

    sections.forEach((sec) => {
      if (activeSectionId !== 'all' && sec.id !== activeSectionId) {
        return;
      }

      sec.items.forEach((item) => {
        // Фильтр по контекстной теме
        if (activeTopicFilter && Array.isArray(item.topics) && item.topics.length > 0) {
          if (!item.topics.includes(activeTopicFilter)) {
            return;
          }
        }

        // Поиск по запросу (без регулярных выражений, строго includes)
        if (q) {
          const inTitle = item.title && item.title.toLowerCase().includes(q);
          const inSyntax = item.syntax && item.syntax.toLowerCase().includes(q);
          const inDesc = item.desc && item.desc.toLowerCase().includes(q);
          const inCode = item.code && item.code.toLowerCase().includes(q);
          const inPitfall = item.pitfall && item.pitfall.toLowerCase().includes(q);
          const inStyle = item.style && item.style.toLowerCase().includes(q);
          const inTags = Array.isArray(item.tags) && item.tags.some((t) => t.toLowerCase().includes(q));

          if (!inTitle && !inSyntax && !inDesc && !inCode && !inPitfall && !inStyle && !inTags) {
            return;
          }
        }

        items.push({ item, section: sec });
      });
    });

    return items;
  }

  function renderCards() {
    if (!dom.cardsContainer) return;
    const matches = getMatchingItems();

    if (dom.cardsCount) {
      dom.cardsCount.textContent = matches.length + ' записей';
    }

    if (matches.length === 0) {
      dom.cardsContainer.innerHTML = `
        <div class="cheatsheet-empty">
          <div class="cheatsheet-empty-title">Ничего не найдено</div>
          <div class="cheatsheet-empty-desc">Попробуй изменить запрос или сбросить фильтры.</div>
        </div>
      `;
      return;
    }

    let html = '';
    matches.forEach(({ item, section }, idx) => {
      html += `
        <article class="cheatsheet-card" id="cs-card-${escapeHtml(item.id)}">
          <div class="cheatsheet-card-head">
            <span class="cheatsheet-kicker">${escapeHtml(section.title)}</span>
            <span class="cheatsheet-card-id">${escapeHtml(item.id)}</span>
          </div>

          <div class="cheatsheet-card-title">${escapeHtml(item.title)}</div>

          <div class="cheatsheet-syntax">
            <code>${escapeHtml(item.syntax)}</code>
          </div>

          <p class="cheatsheet-desc">${escapeHtml(item.desc)}</p>

          <div class="cheatsheet-code-wrap">
            <div class="cheatsheet-code-header">
              <span class="cheatsheet-code-label">пример</span>
              <button type="button" class="cheatsheet-copy-btn" data-code-idx="${idx}" title="Скопировать пример">копировать</button>
            </div>
            <pre class="cheatsheet-code"><code>${escapeHtml(item.code)}</code></pre>
          </div>

          ${item.pitfall ? `
            <div class="cheatsheet-box cheatsheet-box-pitfall">
              <div class="cheatsheet-box-label">[ловушка]</div>
              <div class="cheatsheet-box-text">${escapeHtml(item.pitfall)}</div>
            </div>
          ` : ''}

          ${item.style ? `
            <div class="cheatsheet-box cheatsheet-box-style">
              <div class="cheatsheet-box-label">[pep 8]</div>
              <div class="cheatsheet-box-text">${escapeHtml(item.style)}</div>
            </div>
          ` : ''}

          ${Array.isArray(item.tags) && item.tags.length > 0 ? `
            <div class="cheatsheet-tags">
              ${item.tags.slice(0, 6).map((t) => `<span class="cheatsheet-tag">${escapeHtml(t)}</span>`).join('')}
            </div>
          ` : ''}
        </article>
      `;
    });

    dom.cardsContainer.innerHTML = html;

    // Навешиваем обработчики копирования кода
    const copyBtns = dom.cardsContainer.querySelectorAll('.cheatsheet-copy-btn');
    copyBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.codeIdx, 10);
        if (matches[idx] && matches[idx].item.code) {
          copyCode(matches[idx].item.code, btn);
        }
      });
    });
  }

  function copyCode(text, buttonEl) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(onSuccess).catch(fallback);
    } else {
      fallback();
    }

    function fallback() {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        onSuccess();
      } catch (err) {
        console.error('Не удалось скопировать код:', err);
      }
    }

    function onSuccess() {
      if (!buttonEl) return;
      const originalText = buttonEl.textContent;
      buttonEl.textContent = 'скопировано!';
      buttonEl.classList.add('copied');
      setTimeout(() => {
        buttonEl.textContent = originalText;
        buttonEl.classList.remove('copied');
      }, 1500);
    }
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Экспорт в глобальное пространство
  window.Cheatsheet = {
    init,
    open,
    openForTopic,
    close,
    toggle,
    isOpen,
    copyCode
  };

  // Автоинициализация при загрузке DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof window !== 'undefined' ? window : global);
