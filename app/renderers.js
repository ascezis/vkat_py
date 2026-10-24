/**
 * вкат.py — Рендереры типов учебных элементов и UI курса
 *
 * Модуль содержит чистые функции отрисовки каждого типа шага,
 * а также вспомогательный рендер навигационных элементов:
 *
 *   renderTheoryView(task)   — теория (блоки p / code / list / table / note)
 *   renderCodeView(task)     — задание на написание кода с редактором
 *   renderPredictView(task)  — предсказание вывода программы
 *   renderQuizView(task)     — проверочный вопрос с вариантами ответа
 *
 *   renderStartCards()       — карточки этапов на стартовом экране
 *   renderStepDots(topic)    — точки шагов в боттомбаре
 *   renderCourseTree()       — выдвижное дерево тем/этапов
 *   renderVisual(topic)      — SVG-схема-иллюстрация темы
 *   fitVisual()              — подстройка размера схемы под контейнер
 *
 * Зависимости (глобальные):
 *   window.VkatApp.dom           — кэш DOM-элементов
 *   window.VkatApp.state         — состояние приложения
 *   window.PythonHighlighter     — подсветка синтаксиса (highlighter.js)
 *   window.Glyphs                — SVG-иллюстрации тем (glyphs.js)
 */

(function (window) {
  'use strict';

  // ─── Утилиты ──────────────────────────────────────────────────────────────────

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function pluralize(n, one, two, five) {
    n = Math.abs(n) % 100;
    const n1 = n % 10;
    if (n > 10 && n < 20) return five;
    if (n1 > 1 && n1 < 5) return two;
    if (n1 === 1) return one;
    return five;
  }

  // ─── Рендер: Теория ───────────────────────────────────────────────────────────

  /**
   * Рендерит страницу теории: заголовок + массив блоков.
   *
   * Поддерживаемые типы блоков (task.blocks[]):
   *   { type: 'p',     html }           — абзац с HTML-разметкой
   *   { type: 'code',  code, output? }  — блок кода с опциональным выводом
   *   { type: 'list',  items[] }        — маркированный список
   *   { type: 'table', head[], rows[] } — таблица
   *   { type: 'note',  html }           — плашка-предупреждение
   */
  function renderTheoryView(task) {
    if (window.CodeHints && typeof window.CodeHints.close === 'function') {
      window.CodeHints.close();
    }

    const dom = window.VkatApp.dom;
    dom.paneTheory.style.display = 'block';
    dom.mainPanes.style.display = 'none';

    dom.theoryTitle.textContent = task.title;

    let html = '';
    (task.blocks || []).forEach(block => {
      if (block.type === 'p') {
        html += `<p class="theory-block-p">${block.html}</p>`;
      } else if (block.type === 'code') {
        const highlighted = window.PythonHighlighter ? window.PythonHighlighter.highlightCode(block.code) : escapeHtml(block.code);
        html += `<div class="theory-block-code">${highlighted}${block.output !== undefined ? `<span class="out">${escapeHtml(block.output)}</span>` : ''}</div>`;
      } else if (block.type === 'list') {
        html += `<ul class="theory-block-list">${(block.items || []).map(li => `<li>${li}</li>`).join('')}</ul>`;
      } else if (block.type === 'table') {
        const headHtml = (block.head || []).map(h => `<th>${h}</th>`).join('');
        const rowsHtml = (block.rows || []).map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('');
        html += `<table class="theory-block-table"><thead><tr>${headHtml}</tr></thead><tbody>${rowsHtml}</tbody></table>`;
      } else if (block.type === 'note') {
        html += `<div class="theory-block-note">${block.html}</div>`;
      }
    });

    dom.theoryContent.innerHTML = html;

    if (window.CodeHints && typeof window.CodeHints.attach === 'function') {
      window.CodeHints.attach(dom.theoryContent);
    }
  }

  // ─── Рендер: Predict (предсказание вывода) ────────────────────────────────────

  /**
   * Рендерит задание типа predict.
   * Поля задания: title, explanation[], code, expectedOutput?
   */
  function renderPredictView(task) {
    if (window.CodeHints && typeof window.CodeHints.close === 'function') {
      window.CodeHints.close();
    }

    const dom = window.VkatApp.dom;
    const state = window.VkatApp.state;

    dom.paneTheory.style.display = 'none';
    dom.mainPanes.style.display = 'grid';
    dom.paneCode.style.display = 'none';
    dom.paneQuiz.style.display = 'none';
    dom.panePredict.style.display = 'block';

    // Левая колонка
    dom.explainLabel.textContent = 'предсказание вывода';
    dom.explainTitle.textContent = task.title;
    dom.taskBadge.style.display = 'none';

    if (Array.isArray(task.explanation) && task.explanation.length > 0) {
      dom.explainContent.innerHTML = task.explanation.map(p => `<p>${p}</p>`).join('');
    } else {
      dom.explainContent.innerHTML = '<p>Внимательно изучи код программы и определи точный текст, который будет выведен в консоль при запуске.</p>';
    }

    dom.exampleBox.style.display = 'none';
    dom.taskBox.style.display = 'none';

    // Правая колонка
    const highlighted = window.PythonHighlighter ? window.PythonHighlighter.highlightCode(task.code) : escapeHtml(task.code);
    dom.predictCodeView.innerHTML = highlighted;

    // Восстанавливаем сохраненный черновик ответа
    dom.predictInput.value = state.codeDrafts[task.id] || '';
    dom.predictResultBox.classList.remove('visible');
    dom.btnPredictNext.style.display = 'none';
    dom.btnPredictCheck.disabled = false;
    dom.btnPredictCheck.textContent = 'Проверить';

    requestAnimationFrame(() => dom.predictInput.focus());
  }

  // ─── Рендер: Quiz (проверочный вопрос) ───────────────────────────────────────

  /**
   * Рендерит задание типа quiz.
   * Поля задания: title, question, code?, options[], correct (0-indexed)
   */
  function renderQuizView(task) {
    if (window.CodeHints && typeof window.CodeHints.close === 'function') {
      window.CodeHints.close();
    }

    const dom = window.VkatApp.dom;
    const state = window.VkatApp.state;

    dom.paneTheory.style.display = 'none';
    dom.mainPanes.style.display = 'grid';
    dom.paneCode.style.display = 'none';
    dom.panePredict.style.display = 'none';
    dom.paneQuiz.style.display = 'block';

    // Левая колонка
    dom.explainLabel.textContent = 'проверочный вопрос';
    dom.explainTitle.textContent = task.title;
    dom.taskBadge.style.display = 'none';
    dom.explainContent.innerHTML = '<p>Выбери один верный вариант ответа из списка предложенных и нажми «Проверить».</p>';
    dom.exampleBox.style.display = 'none';
    dom.taskBox.style.display = 'none';

    // Правая колонка
    dom.quizQuestion.textContent = task.question;

    if (task.code) {
      dom.quizCodeView.style.display = 'block';
      dom.quizCodeView.innerHTML = window.PythonHighlighter ? window.PythonHighlighter.highlightCode(task.code) : escapeHtml(task.code);
    } else {
      dom.quizCodeView.style.display = 'none';
    }

    state.selectedQuizOption = null;
    dom.quizOptions.innerHTML = '';

    (task.options || []).forEach((opt, idx) => {
      const optEl = document.createElement('div');
      optEl.className = 'quiz-option';
      optEl.innerHTML = `
        <span class="quiz-option-radio"></span>
        <span>${escapeHtml(opt)}</span>
      `;
      optEl.addEventListener('click', () => {
        state.selectedQuizOption = idx;
        dom.quizOptions.querySelectorAll('.quiz-option').forEach((el, i) => {
          el.classList.toggle('selected', i === idx);
        });
      });
      dom.quizOptions.appendChild(optEl);
    });

    dom.quizResultBox.classList.remove('visible');
    dom.btnQuizNext.style.display = 'none';
    dom.btnQuizCheck.disabled = false;
    dom.btnQuizCheck.textContent = 'Проверить';
  }

  // ─── Рендер: Code (редактор кода) ────────────────────────────────────────────

  /**
   * Рендерит задание типа code.
   * Поля задания: title, tier?, kind?, explanation[], assignment,
   *               starterCode?, example?, hints[], optional?
   */
  function renderCodeView(task) {
    if (window.CodeHints && typeof window.CodeHints.close === 'function') {
      window.CodeHints.close();
    }

    const dom = window.VkatApp.dom;
    const state = window.VkatApp.state;

    dom.paneTheory.style.display = 'none';
    dom.mainPanes.style.display = 'grid';
    dom.panePredict.style.display = 'none';
    dom.paneQuiz.style.display = 'none';
    dom.paneCode.style.display = 'flex';

    // Левая панель
    dom.explainLabel.textContent = 'объяснение';
    dom.explainTitle.textContent = task.title;

    // Метки tier / fix
    let badgeHtml = '';
    const tier = task.tier || 'main';
    if (tier === 'warmup') {
      badgeHtml += '<span class="badge-tier">разминка</span>';
    } else if (tier === 'star') {
      badgeHtml += '<span class="badge-tier">★ задача</span>';
    }
    if (task.kind === 'fix') {
      badgeHtml += '<span class="badge-fix">найди ошибку</span>';
    }

    if (badgeHtml) {
      dom.taskBadge.style.display = 'inline-block';
      dom.taskBadge.outerHTML = `<span id="task-badge">${badgeHtml}</span>`;
      dom.taskBadge = document.getElementById('task-badge');
    } else {
      dom.taskBadge.style.display = 'none';
    }

    dom.explainContent.innerHTML = (task.explanation || []).map(p => `<p>${p}</p>`).join('');

    if (task.example) {
      dom.exampleBox.style.display = 'block';
      const highlightedCode = window.PythonHighlighter
        ? window.PythonHighlighter.highlightCode(task.example.code)
        : escapeHtml(task.example.code);
      dom.exampleBox.innerHTML = `${highlightedCode}<span class="out">${escapeHtml(task.example.output)}</span>`;
    } else {
      dom.exampleBox.style.display = 'none';
    }

    dom.taskBox.style.display = 'block';
    dom.taskContent.innerHTML = `<p>${task.assignment || ''}</p>`;

    // Кнопка "Пропустить" для необязательных заданий (star / optional)
    if (task.optional || task.tier === 'star') {
      dom.btnSkip.style.display = 'inline-block';
    } else {
      dom.btnSkip.style.display = 'none';
    }

    // Редактор: подстановка черновика или начального кода
    const savedCode = state.codeDrafts[task.id];
    dom.editor.value = savedCode !== undefined ? savedCode : (task.starterCode || '');
    if (dom.highlighter) {
      dom.highlighter.update();
    }
    window.VkatRenderers.updateLineNumbers();

    // Лестница подсказок hints[]
    setupHints(task);

    // Зона результата
    dom.resultBox.classList.remove('visible');
    dom.improveBox.classList.remove('visible');
    dom.errorExplain.style.display = 'none';
    dom.btnNext.style.display = 'none';

    requestAnimationFrame(() => dom.editor.focus());
  }

  // ─── Подсказки ────────────────────────────────────────────────────────────────

  /**
   * Настраивает лестницу подсказок.
   * hints[] может содержать строки или объекты { text?, code? }.
   */
  function setupHints(task) {
    const dom = window.VkatApp.dom;
    const state = window.VkatApp.state;
    const rawHints = task.hints || (task.hint ? [{ code: task.hint }] : []);
    const hints = rawHints.map(h => typeof h === 'string' ? { text: h } : h);

    state.revealedHintsCount = 0;
    dom.hintContent.innerHTML = '';
    dom.hintContent.classList.remove('visible');

    if (hints.length === 0) {
      dom.hintToggle.style.display = 'none';
      return;
    }

    dom.hintToggle.style.display = 'inline-block';
    dom.hintToggle.textContent = `показать подсказку (1 из ${hints.length})`;

    dom.hintToggle.onclick = () => {
      if (state.revealedHintsCount < hints.length) {
        state.revealedHintsCount++;
        renderHintsList(hints, state.revealedHintsCount);
        dom.hintContent.classList.add('visible');

        if (state.revealedHintsCount < hints.length) {
          dom.hintToggle.textContent = `следующая подсказка (${state.revealedHintsCount + 1} из ${hints.length})`;
        } else {
          dom.hintToggle.textContent = 'скрыть подсказки';
        }
      } else {
        const isVis = dom.hintContent.classList.toggle('visible');
        dom.hintToggle.textContent = isVis ? 'скрыть подсказки' : 'показать подсказки';
      }
    };
  }

  function renderHintsList(hints, count) {
    const dom = window.VkatApp.dom;
    let html = '';
    for (let i = 0; i < count; i++) {
      const h = hints[i];
      html += `<div style="margin-bottom: 12px; font-size: 13px; line-height: 1.6;">`;
      html += `<div style="font-family: var(--font-mono); font-size: 11px; color: var(--text-dim); margin-bottom: 4px;">подсказка ${i + 1} из ${hints.length}</div>`;
      if (h.text) {
        html += `<div>${h.text}</div>`;
      }
      if (h.code) {
        const highlighted = window.PythonHighlighter ? window.PythonHighlighter.highlightCode(h.code) : escapeHtml(h.code);
        html += `<pre class="hint-code">${highlighted}</pre>`;
      }
      html += `</div>`;
    }
    dom.hintContent.innerHTML = html;
  }

  // ─── Стартовый экран: карточки этапов ────────────────────────────────────────

  function renderStartCards() {
    const dom = window.VkatApp.dom;
    const state = window.VkatApp.state;
    if (!dom.stageCards) return;
    dom.stageCards.innerHTML = '';

    state.stages.forEach(stage => {
      const stageTopics = state.topics.filter(t => t.stageId === stage.id);
      const topicsCount = stageTopics.length;
      const progress = window.VkatApp.getStageProgress(stage.id);

      const hasAnyCompleted = stageTopics.some(t => t.items.some(it => state.completedTasks.has(it.id)));
      const isCompleted = progress.total > 0 && progress.completed === progress.total;
      const btnText = !hasAnyCompleted ? 'Начать' : (isCompleted ? 'Повторить' : 'Продолжить');

      const card = document.createElement('div');
      card.className = 'stage-card';

      card.innerHTML = `
        <div class="stage-card-header">
          <div class="stage-card-title">${stage.title}</div>
          <div class="stage-card-progress-label">${isCompleted ? '✓ пройдено' : `${progress.completed} из ${progress.total}`}</div>
        </div>
        <p class="stage-card-desc">${stage.description}</p>
        <div class="stage-card-meta">
          <span>${topicsCount} ${pluralize(topicsCount, 'тема', 'темы', 'тем')}</span>
          <span>${progress.total} ${pluralize(progress.total, 'задание', 'задания', 'заданий')}</span>
        </div>
        ${stage.note ? `<div class="stage-card-note">${stage.note}</div>` : ''}
        <div class="stage-card-actions">
          <button class="stage-card-btn" data-stage="${stage.id}">${btnText}</button>
          <span style="font-family: var(--font-mono); font-size: 12px; color: var(--text-dim);">${progress.percent}%</span>
        </div>
      `;

      const btn = card.querySelector('.stage-card-btn');
      btn.addEventListener('click', () => {
        window.VkatApp.startOrContinueStage(stage.id);
      });

      dom.stageCards.appendChild(card);
    });
  }

  // ─── Точки шагов в боттомбаре ────────────────────────────────────────────────

  function renderStepDots(topic) {
    const dom = window.VkatApp.dom;
    const state = window.VkatApp.state;
    dom.stepDots.innerHTML = '';
    (topic.items || []).forEach((item, idx) => {
      const dot = document.createElement('span');
      const isDone = state.completedTasks.has(item.id);
      const isCurrent = idx === state.currentTaskIndex;
      const type = item.type || 'code';

      if (isDone) dot.classList.add('done');
      if (isCurrent) dot.classList.add('current');

      if (type === 'theory') {
        dot.classList.add('theory-dot');
        dot.title = `Теория: ${item.title}`;
      } else if (item.tier === 'star') {
        dot.classList.add('star-dot');
        dot.title = `★ ${item.title}`;
      } else {
        dot.title = item.title;
      }

      dot.addEventListener('click', () => {
        window.VkatApp.selectTask(state.currentTopicIndex, idx);
      });

      dom.stepDots.appendChild(dot);
    });
  }

  // ─── Дерево курса (выдвижная панель) ─────────────────────────────────────────

  function renderCourseTree() {
    const dom = window.VkatApp.dom;
    const state = window.VkatApp.state;
    if (!dom.treeBody) return;

    // Общий подсчет обязательных элементов курса
    let allRequiredTotal = 0;
    let allRequiredDone = 0;
    state.topics.forEach(t => {
      t.items.forEach(it => {
        if (window.VkatApp.isRequired(it)) {
          allRequiredTotal++;
          if (state.completedTasks.has(it.id)) allRequiredDone++;
        }
      });
    });

    const allPercent = allRequiredTotal > 0 ? Math.round((allRequiredDone / allRequiredTotal) * 100) : 0;
    if (dom.treeProgressSummary) {
      dom.treeProgressSummary.textContent = `пройдено ${allRequiredDone} из ${allRequiredTotal} (${allPercent}%)`;
    }

    dom.treeBody.innerHTML = '<div class="tree-root-label">вкат-py/курс/</div>';

    state.stages.forEach(stage => {
      const stageTopics = state.topics
        .map((t, idx) => ({ topic: t, globalIdx: idx }))
        .filter(item => item.topic.stageId === stage.id);

      if (stageTopics.length === 0) return;

      const progress = window.VkatApp.getStageProgress(stage.id);

      const stageHeader = document.createElement('div');
      stageHeader.className = 'tree-stage-header';
      stageHeader.innerHTML = `
        <span>${stage.title}</span>
        <span class="tree-stage-progress">${progress.completed}/${progress.total}</span>
      `;
      dom.treeBody.appendChild(stageHeader);

      stageTopics.forEach(({ topic, globalIdx }, tIdx) => {
        const topicEl = document.createElement('div');
        topicEl.className = 'tree-topic';

        const topicDoneCount = topic.items.filter(it => state.completedTasks.has(it.id)).length;
        const isTopicAllDone = topicDoneCount === topic.items.length && topic.items.length > 0;
        const isLastTopic = tIdx === stageTopics.length - 1;

        const row = document.createElement('div');
        row.className = 'tree-topic-row';
        row.innerHTML = `
          <div class="tree-topic-left">
            <span style="color: var(--text-dim);">${isLastTopic ? '└──' : '├──'}</span>
            <span>${topic.title.toLowerCase()}</span>
          </div>
          <span class="tree-topic-badge ${isTopicAllDone ? 'completed' : ''}">${isTopicAllDone ? '✓ ' : ''}${topicDoneCount}/${topic.items.length}</span>
        `;

        const tasksContainer = document.createElement('div');
        tasksContainer.className = 'tree-tasks-container';

        topic.items.forEach((task, kIdx) => {
          const isDone = state.completedTasks.has(task.id);
          const isCurrent = globalIdx === state.currentTopicIndex && kIdx === state.currentTaskIndex;
          const isLastTask = kIdx === topic.items.length - 1;
          const type = task.type || 'code';

          let iconChar = isDone ? '✓' : (isCurrent ? '●' : '○');
          let typeTag = '';
          if (type === 'theory') {
            typeTag = '<span class="tree-item-type-tag">теория</span>';
          } else if (type === 'predict') {
            typeTag = '<span class="tree-item-type-tag">прогноз</span>';
          } else if (type === 'quiz') {
            typeTag = '<span class="tree-item-type-tag">тест</span>';
          } else if (task.tier === 'star') {
            typeTag = '<span class="tree-item-type-tag">★</span>';
          }

          const taskNode = document.createElement('div');
          taskNode.className = `tree-task-node ${isCurrent ? 'current' : ''} ${isDone ? 'completed' : ''}`;
          taskNode.innerHTML = `
            <span class="tree-task-branch">${isLastTask ? '└──' : '├──'}</span>
            <span class="tree-task-icon ${isDone ? 'done' : (isCurrent ? 'current' : 'pending')}">${iconChar}</span>
            <span class="tree-task-title">${kIdx + 1}. ${task.title}</span>
            ${typeTag}
          `;

          taskNode.addEventListener('click', () => {
            window.VkatApp.selectTask(globalIdx, kIdx);
          });

          tasksContainer.appendChild(taskNode);
        });

        topicEl.appendChild(row);
        topicEl.appendChild(tasksContainer);
        dom.treeBody.appendChild(topicEl);
      });
    });
  }

  // ─── SVG-схема темы ───────────────────────────────────────────────────────────

  /**
   * Перерисовываем только при смене темы, чтобы анимация появления не мигала на каждом шаге.
   */
  function renderVisual(topic) {
    const targets = [document.getElementById('visual'), document.getElementById('theory-visual')];
    const html = window.Glyphs ? window.Glyphs.render(topic.id) : '';
    const label = window.Glyphs ? window.Glyphs.caption(topic.id) : '';
    targets.forEach(el => {
      if (!el) return;
      if (!html) { el.hidden = true; el.innerHTML = ''; delete el.dataset.topic; return; }
      el.hidden = false;
      el.classList.remove('is-open');            // на каждом шаге начинаем со «свёрнуто, если не влезло»
      el.setAttribute('aria-label', 'Схема: ' + label);
      if (el.dataset.topic !== topic.id) {
        el.innerHTML = html;
        el.dataset.topic = topic.id;
      }
    });
  }

  /**
   * Схема в левой панели либо помещается целиком, либо сворачивается в одну строку
   * (подпись + «показать»). Никаких обрезанных наполовину фигур под сгибом панели.
   * Ученик может раскрыть её вручную — тогда панель просто прокручивается.
   */
  function visualFits(el, pane) {
    // нижняя граница схемы в координатах содержимого панели; допускаем заезд в нижний отступ панели
    const bottom = el.getBoundingClientRect().bottom - pane.getBoundingClientRect().top + pane.scrollTop;
    return bottom <= pane.clientHeight - 16;
  }

  function fitVisual() {
    const el = document.getElementById('visual');
    if (!el || el.hidden) return;
    const pane = el.parentElement;
    if (!pane || pane.offsetParent === null) return;   // панель сейчас не на экране
    if (el.classList.contains('is-open')) return;      // раскрыта вручную
    el.classList.remove('is-collapsed', 'is-fit-hidden');
    if (!visualFits(el, pane)) {
      el.classList.add('is-collapsed');                // целиком не влезла — одна строка
      if (!visualFits(el, pane)) el.classList.add('is-fit-hidden');   // и строка не влезла — прячем
    }
    syncVisualToggle(el);
  }

  function syncVisualToggle(el) {
    const cap = el.querySelector('.visual-cap');
    if (!cap) return;
    const toggleable = (el.classList.contains('is-collapsed') && !el.classList.contains('is-fit-hidden'))
      || el.classList.contains('is-open');
    if (toggleable) {
      cap.setAttribute('role', 'button');
      cap.setAttribute('tabindex', '0');
      cap.setAttribute('aria-expanded', el.classList.contains('is-open') ? 'true' : 'false');
    } else {
      cap.removeAttribute('role');
      cap.removeAttribute('tabindex');
      cap.removeAttribute('aria-expanded');
    }
  }

  function toggleVisual(el) {
    if (el.classList.contains('is-collapsed')) {
      el.classList.remove('is-collapsed');
      el.classList.add('is-open');
      const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      requestAnimationFrame(() => el.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' }));
    } else if (el.classList.contains('is-open')) {
      el.classList.remove('is-open');
      el.classList.add('is-collapsed');
    }
    syncVisualToggle(el);
  }

  (function bindVisualToggle() {
    const el = document.getElementById('visual');
    if (!el) return;
    el.addEventListener('click', (e) => { if (e.target.closest('.visual-cap')) toggleVisual(el); });
    el.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('.visual-cap')) {
        e.preventDefault();
        toggleVisual(el);
      }
    });
  })();

  function updateLineNumbers() {
    const dom = window.VkatApp.dom;
    if (!dom.lineNumbers) return;
    const lines = (dom.editor.value || '').split('\n').length;
    let html = '';
    for (let i = 1; i <= lines; i++) {
      html += i + '\n';
    }
    dom.lineNumbers.textContent = html;
  }

  // ─── Инициализация ResizeObserver и FontFace для fitVisual ───────────────────

  window.addEventListener('resize', fitVisual);
  if (window.ResizeObserver) {
    const paneEl = document.getElementById('visual') && document.getElementById('visual').parentElement;
    if (paneEl) new ResizeObserver(fitVisual).observe(paneEl);
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitVisual);

  // ─── Экспорт публичного API ───────────────────────────────────────────────────

  window.VkatRenderers = {
    renderTheoryView,
    renderCodeView,
    renderPredictView,
    renderQuizView,
    renderStartCards,
    renderStepDots,
    renderCourseTree,
    renderVisual,
    fitVisual,
    updateLineNumbers
  };

})(window);
