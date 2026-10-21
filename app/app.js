/**
 * вкат.py — Логика приложения, навигация, состояние, редактор, типы элементов и хранилище
 */

(function (window) {
  'use strict';

  // Ключи LocalStorage
  const STORAGE_KEYS = {
    COMPLETED: 'vkat_completed_tasks',
    DRAFTS: 'vkat_code_drafts',
    POSITION: 'vkat_current_position',
    SCHEMA: 'vkat_schema'
  };

  // Состояние
  let state = {
    stages: [],
    topics: [],
    currentTopicIndex: 0,
    currentTaskIndex: 0,
    completedTasks: new Set(),
    codeDrafts: {},
    isChecking: false,
    pyodideReady: false,
    revealedHintsCount: 0,
    selectedQuizOption: null
  };

  // Элементы DOM
  const dom = {};

  function initDom() {
    dom.screenStart = document.getElementById('screen-start');
    dom.screenLesson = document.getElementById('screen-lesson');
    dom.screenFinish = document.getElementById('screen-finish');

    dom.topbar = document.getElementById('app-topbar');
    dom.mark = document.getElementById('app-mark');
    dom.breadcrumb = document.getElementById('app-breadcrumb');
    dom.progressFill = document.getElementById('progress-fill');

    dom.stageCards = document.getElementById('stage-cards');
    dom.startStatus = document.getElementById('start-status');

    // Экран урока — панели
    dom.paneTheory = document.getElementById('pane-theory');
    dom.theoryTitle = document.getElementById('theory-title');
    dom.theoryContent = document.getElementById('theory-content');
    dom.btnTheoryNext = document.getElementById('btn-theory-next');

    dom.mainPanes = document.getElementById('main-panes');
    dom.explainLabel = document.getElementById('explain-label');
    dom.explainTitle = document.getElementById('explain-title');
    dom.taskBadge = document.getElementById('task-badge');
    dom.explainContent = document.getElementById('explain-content');
    dom.exampleBox = document.getElementById('example-box');
    dom.taskBox = document.getElementById('task-box');
    dom.taskContent = document.getElementById('task-content');

    // Редактор кода
    dom.paneCode = document.getElementById('pane-code');
    dom.editor = document.getElementById('code-editor');
    dom.editorHighlight = document.getElementById('editor-highlight');
    dom.lineNumbers = document.getElementById('line-numbers');
    dom.hintToggle = document.getElementById('hint-toggle');
    dom.hintContent = document.getElementById('hint-content');
    dom.btnSkip = document.getElementById('btn-skip');
    dom.btnRun = document.getElementById('btn-run');
    dom.btnNext = document.getElementById('btn-next');

    // Результат кода
    dom.resultBox = document.getElementById('result-box');
    dom.resultMark = document.getElementById('result-mark');
    dom.resultTitle = document.getElementById('result-title');
    dom.resultSub = document.getElementById('result-sub');
    dom.errorExplain = document.getElementById('error-explain');
    dom.errorExplainText = document.getElementById('error-explain-text');
    dom.consoleOut = document.getElementById('console-out');
    dom.improveBox = document.getElementById('improve-box');
    dom.improveContent = document.getElementById('improve-content');

    // Predict
    dom.panePredict = document.getElementById('pane-predict');
    dom.predictCodeView = document.getElementById('predict-code-view');
    dom.predictInput = document.getElementById('predict-input');
    dom.btnPredictCheck = document.getElementById('btn-predict-check');
    dom.btnPredictNext = document.getElementById('btn-predict-next');
    dom.predictResultBox = document.getElementById('predict-result-box');
    dom.predictResultMark = document.getElementById('predict-result-mark');
    dom.predictResultTitle = document.getElementById('predict-result-title');
    dom.predictResultSub = document.getElementById('predict-result-sub');
    dom.predictExplainContent = document.getElementById('predict-explain-content');

    // Quiz
    dom.paneQuiz = document.getElementById('pane-quiz');
    dom.quizQuestion = document.getElementById('quiz-question');
    dom.quizCodeView = document.getElementById('quiz-code-view');
    dom.quizOptions = document.getElementById('quiz-options');
    dom.btnQuizCheck = document.getElementById('btn-quiz-check');
    dom.btnQuizNext = document.getElementById('btn-quiz-next');
    dom.quizResultBox = document.getElementById('quiz-result-box');
    dom.quizResultMark = document.getElementById('quiz-result-mark');
    dom.quizResultTitle = document.getElementById('quiz-result-title');
    dom.quizResultSub = document.getElementById('quiz-result-sub');
    dom.quizExplainContent = document.getElementById('quiz-explain-content');

    // Боттомбар
    dom.lessonTopic = document.getElementById('lesson-topic');
    dom.stepDots = document.getElementById('step-dots');
    dom.stepLabel = document.getElementById('step-label');

    // Финал
    dom.finishTitle = document.getElementById('finish-title');
    dom.finishSub = document.getElementById('finish-sub');
    dom.btnFinishNextStage = document.getElementById('btn-finish-next-stage');
    dom.btnRestart = document.getElementById('btn-restart');
    dom.finishStageLabel = document.getElementById('finish-stage-label');

    // Дерево оглавления курса
    dom.treeDrawer = document.getElementById('tree-drawer');
    dom.treeBackdrop = document.getElementById('tree-backdrop');
    dom.treeBody = document.getElementById('tree-body');
    dom.treeProgressSummary = document.getElementById('tree-progress-summary');
    dom.btnTreeToggle = document.getElementById('btn-tree-toggle');
    dom.btnTreeStart = document.getElementById('btn-tree-start');
    dom.btnTreeClose = document.getElementById('btn-tree-close');
  }

  /**
   * Построение плоского списка тем с привязкой к этапам
   */
  function buildCourseStructure() {
    state.stages = window.COURSE_STAGES || [];
    const rawTopics = window.COURSE_TOPICS || [];
    const topicMap = new Map(rawTopics.map(t => [t.id, t]));

    const flatTopics = [];
    const usedTopicIds = new Set();

    state.stages.forEach(stage => {
      stage.topics.forEach(topId => {
        const topic = topicMap.get(topId);
        if (topic) {
          topic.stageId = stage.id;
          topic.items = topic.items || topic.tasks || [];
          flatTopics.push(topic);
          usedTopicIds.add(topId);
        } else {
          console.warn(`Тема "${topId}" заявлена в этапе "${stage.id}", но не найдена в COURSE_TOPICS`);
        }
      });
    });

    // Проверка наличия тем, не вошедших ни в один этап
    rawTopics.forEach(t => {
      if (!usedTopicIds.has(t.id)) {
        console.warn(`Тема "${t.id}" зарегистрирована в COURSE_TOPICS, но не включена ни в один этап`);
      }
    });

    state.topics = flatTopics;
  }

  /**
   * Загрузка сохраненного прогресса
   */
  function loadStorage() {
    try {
      const savedCompleted = localStorage.getItem(STORAGE_KEYS.COMPLETED);
      if (savedCompleted) {
        state.completedTasks = new Set(JSON.parse(savedCompleted));
      }

      const savedDrafts = localStorage.getItem(STORAGE_KEYS.DRAFTS);
      if (savedDrafts) {
        state.codeDrafts = JSON.parse(savedDrafts);
      }

      const savedPos = localStorage.getItem(STORAGE_KEYS.POSITION);
      if (savedPos) {
        const pos = JSON.parse(savedPos);
        state.currentTopicIndex = pos.topicIndex || 0;
        state.currentTaskIndex = pos.taskIndex || 0;
      }
    } catch (e) {
      console.warn('Не удалось загрузить данные из localStorage:', e);
    }

    // Защита от выхода за границы
    if (state.currentTopicIndex >= state.topics.length || state.currentTopicIndex < 0) {
      state.currentTopicIndex = 0;
      state.currentTaskIndex = 0;
    }
    const topic = state.topics[state.currentTopicIndex];
    if (topic && (state.currentTaskIndex >= topic.items.length || state.currentTaskIndex < 0)) {
      state.currentTaskIndex = 0;
    }
  }

  function saveStorage() {
    try {
      localStorage.setItem(STORAGE_KEYS.COMPLETED, JSON.stringify(Array.from(state.completedTasks)));
      localStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(state.codeDrafts));
      localStorage.setItem(STORAGE_KEYS.POSITION, JSON.stringify({
        topicIndex: state.currentTopicIndex,
        taskIndex: state.currentTaskIndex
      }));
      localStorage.setItem(STORAGE_KEYS.SCHEMA, '2');
    } catch (e) {
      console.warn('Не удалось сохранить в localStorage:', e);
    }
  }

  /**
   * Определение, является ли элемент проверяемым и обязательным
   */
  function isGradable(item) {
    const type = item.type || 'code';
    return type === 'code' || type === 'predict' || type === 'quiz';
  }

  function isRequired(item) {
    return isGradable(item) && !item.optional && item.tier !== 'star';
  }

  function isOptional(item) {
    return Boolean(item.optional || item.tier === 'star');
  }

  /**
   * Подсчёт прогресса по этапу
   */
  function getStageProgress(stageId) {
    let totalRequired = 0;
    let completedRequired = 0;

    state.topics
      .filter(t => t.stageId === stageId)
      .forEach(t => {
        t.items.forEach(item => {
          if (isRequired(item)) {
            totalRequired++;
            if (state.completedTasks.has(item.id)) {
              completedRequired++;
            }
          }
        });
      });

    const percent = totalRequired > 0 ? Math.round((completedRequired / totalRequired) * 100) : 0;
    return { completed: completedRequired, total: totalRequired, percent };
  }

  /**
   * Обновление верхнего прогресс-бара по текущему этапу
   */
  function updateCourseProgress() {
    const topic = state.topics[state.currentTopicIndex];
    if (!topic) return;
    const progress = getStageProgress(topic.stageId);
    dom.progressFill.style.width = progress.percent + '%';
  }

  /**
   * Переключение экранов
   */
  function showScreen(screen) {
    dom.screenStart.classList.remove('active');
    dom.screenLesson.classList.remove('active');
    dom.screenFinish.classList.remove('active');

    if (screen === 'start') {
      dom.screenStart.classList.add('active');
      dom.topbar.style.display = 'none';
      renderStartCards();
    } else if (screen === 'lesson') {
      dom.screenLesson.classList.add('active');
      dom.topbar.style.display = 'flex';
    } else if (screen === 'finish') {
      dom.screenFinish.classList.add('active');
      dom.topbar.style.display = 'flex';
      updateCourseProgress();
    }
  }

  /**
   * Рендер карточек этапов на стартовом экране
   */
  function renderStartCards() {
    if (!dom.stageCards) return;
    dom.stageCards.innerHTML = '';

    state.stages.forEach(stage => {
      const stageTopics = state.topics.filter(t => t.stageId === stage.id);
      const topicsCount = stageTopics.length;
      const progress = getStageProgress(stage.id);

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
        startOrContinueStage(stage.id);
      });

      dom.stageCards.appendChild(card);
    });
  }

  function pluralize(n, one, two, five) {
    n = Math.abs(n) % 100;
    const n1 = n % 10;
    if (n > 10 && n < 20) return five;
    if (n1 > 1 && n1 < 5) return two;
    if (n1 === 1) return one;
    return five;
  }

  function startOrContinueStage(stageId) {
    const stageTopics = state.topics
      .map((t, idx) => ({ topic: t, index: idx }))
      .filter(item => item.topic.stageId === stageId);

    if (stageTopics.length === 0) return;

    // Ищем первый непройденный элемент любого типа (кроме необязательных)
    for (const st of stageTopics) {
      for (let k = 0; k < st.topic.items.length; k++) {
        const item = st.topic.items[k];
        if (!isOptional(item) && !state.completedTasks.has(item.id)) {
          state.currentTopicIndex = st.index;
          state.currentTaskIndex = k;
          showScreen('lesson');
          renderTask();
          return;
        }
      }
    }

    // Если все пройдены — на первый элемент этапа
    state.currentTopicIndex = stageTopics[0].index;
    state.currentTaskIndex = 0;
    showScreen('lesson');
    renderTask();
  }

  /**
   * Получение текущего элемента
   */
  function getCurrentTask() {
    const topic = state.topics[state.currentTopicIndex];
    if (!topic || !topic.items) return null;
    return topic.items[state.currentTaskIndex] || null;
  }

  /**
   * Рендер текущего элемента урока
   */
  function renderTask() {
    const topic = state.topics[state.currentTopicIndex];
    if (!topic) return;
    const task = topic.items[state.currentTaskIndex];
    if (!task) return;

    const stage = state.stages.find(s => s.id === topic.stageId) || { title: 'Этап' };
    const type = task.type || 'code';

    // Breadcrumbs
    dom.breadcrumb.innerHTML = `${stage.title.toLowerCase()} <b>·</b> ${topic.title.toLowerCase()} <b>·</b> шаг ${state.currentTaskIndex + 1} из ${topic.items.length}`;
    dom.lessonTopic.textContent = `${stage.title.toLowerCase()} · ${topic.title.toLowerCase()}`;
    dom.stepLabel.textContent = `шаг ${state.currentTaskIndex + 1} / ${topic.items.length}`;

    // Переключение режимов отображения панелей
    if (type === 'theory') {
      renderTheoryView(task);
    } else if (type === 'predict') {
      renderPredictView(task);
    } else if (type === 'quiz') {
      renderQuizView(task);
    } else {
      renderCodeView(task);
    }

    // Точки шагов
    renderStepDots(topic);

    // Прогресс и сохранение
    updateCourseProgress();
    saveStorage();
  }

  /**
   * Рендер режима: Теория
   */
  function renderTheoryView(task) {
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
  }

  /**
   * Рендер режима: Predict (предсказание вывода)
   */
  function renderPredictView(task) {
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

  /**
   * Рендер режима: Quiz (вопрос с вариантами)
   */
  function renderQuizView(task) {
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

  /**
   * Рендер режима: Code (редактор кода)
   */
  function renderCodeView(task) {
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
    updateLineNumbers();

    // Лестница подсказок hints[]
    setupHints(task);

    // Зона результата
    dom.resultBox.classList.remove('visible');
    dom.improveBox.classList.remove('visible');
    dom.errorExplain.style.display = 'none';
    dom.btnNext.style.display = 'none';

    requestAnimationFrame(() => dom.editor.focus());
  }

  /**
   * Настройка ступенчатых подсказок hints[]
   */
  function setupHints(task) {
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

  /**
   * Точки шагов темы в боттомбаре
   */
  function renderStepDots(topic) {
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
        selectTask(state.currentTopicIndex, idx);
      });

      dom.stepDots.appendChild(dot);
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function normalize(str) {
    if (!str) return '';
    return str
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map(line => line.trimEnd())
      .join('\n')
      .trim();
  }

  /**
   * Проверка задания типа Predict
   */
  async function runPredictCheck() {
    const task = getCurrentTask();
    if (!task) return;

    dom.btnPredictCheck.disabled = true;
    dom.btnPredictCheck.textContent = 'Запускаем...';

    try {
      const runRes = await window.CodeChecker.runCode(task.code);
      const userVal = normalize(dom.predictInput.value);
      const actualVal = normalize(runRes.stdout);

      // Сохраняем черновик ответа
      state.codeDrafts[task.id] = dom.predictInput.value;

      // Элемент считается пройденным после первой отправки (не блокирует!)
      state.completedTasks.add(task.id);
      saveStorage();
      updateCourseProgress();
      renderStepDots(state.topics[state.currentTopicIndex]);

      dom.predictResultBox.classList.add('visible');

      const isMatch = userVal === actualVal;
      if (isMatch) {
        dom.predictResultMark.className = 'result-mark ok';
        dom.predictResultMark.textContent = '✓';
        dom.predictResultTitle.className = 'result-title';
        dom.predictResultTitle.textContent = 'Ответ совпал';
        dom.predictResultSub.textContent = `Фактический вывод:\n${actualVal || '(пустая строка)'}`;
      } else {
        dom.predictResultMark.className = 'result-mark err';
        dom.predictResultMark.textContent = '×';
        dom.predictResultTitle.className = 'result-title err';
        dom.predictResultTitle.textContent = 'Ответ отличается от фактического вывода';

        let diffMsg = `Твой ответ:\n${userVal || '(пусто)'}\n\nФактический вывод программы:\n${actualVal || '(пусто)'}`;
        if (actualVal.includes('\n') && !userVal.includes('\n')) {
          diffMsg += '\n\nПодсказка: каждый вызов print() выводит значение с новой строки.';
        }
        dom.predictResultSub.textContent = diffMsg;
      }

      dom.predictExplainContent.textContent = task.explain || '';
      dom.btnPredictNext.style.display = 'inline-block';
      dom.btnPredictNext.focus();
    } catch (err) {
      console.error('Ошибка в predict:', err);
    } finally {
      dom.btnPredictCheck.disabled = false;
      dom.btnPredictCheck.textContent = 'Проверить';
    }
  }

  /**
   * Проверка задания типа Quiz
   */
  function runQuizCheck() {
    const task = getCurrentTask();
    if (!task) return;

    if (state.selectedQuizOption === null) {
      alert('Пожалуйста, выбери вариант ответа.');
      return;
    }

    const isCorrect = state.selectedQuizOption === task.correct;

    dom.quizResultBox.classList.add('visible');

    if (isCorrect) {
      dom.quizResultMark.className = 'result-mark ok';
      dom.quizResultMark.textContent = '✓';
      dom.quizResultTitle.className = 'result-title';
      dom.quizResultTitle.textContent = 'Верно!';
      dom.quizResultSub.textContent = 'Правильный вариант выбран.';
      dom.quizExplainContent.textContent = task.explain || '';

      state.completedTasks.add(task.id);
      saveStorage();
      updateCourseProgress();
      renderStepDots(state.topics[state.currentTopicIndex]);

      dom.btnQuizNext.style.display = 'inline-block';
      dom.btnQuizNext.focus();
    } else {
      dom.quizResultMark.className = 'result-mark err';
      dom.quizResultMark.textContent = '×';
      dom.quizResultTitle.className = 'result-title err';
      dom.quizResultTitle.textContent = 'Неверно';
      dom.quizResultSub.textContent = 'Подумай ещё и выбери другой вариант ответа.';
      dom.quizExplainContent.textContent = '';
      dom.btnQuizNext.style.display = 'none';
    }
  }

  /**
   * Запуск проверки кода (Code)
   */
  async function runCheck() {
    const task = getCurrentTask();
    if (!task || state.isChecking) return;

    state.isChecking = true;
    dom.btnRun.disabled = true;
    dom.btnRun.textContent = 'Проверяем...';

    try {
      const code = dom.editor.value;
      const result = await window.CodeChecker.checkSolution(code, task);

      dom.resultBox.classList.add('visible');

      if (result.passed) {
        // Успех
        dom.resultMark.className = 'result-mark ok';
        dom.resultMark.textContent = '✓';
        dom.resultTitle.className = 'result-title';
        dom.resultTitle.textContent = result.title;
        dom.resultSub.textContent = result.sub;
        dom.errorExplain.style.display = 'none';

        // Отмечаем задачу выполненной
        state.completedTasks.add(task.id);
        saveStorage();
        updateCourseProgress();
        renderStepDots(state.topics[state.currentTopicIndex]);

        // Консоль
        if (result.stdout && result.stdout.trim().length > 0) {
          dom.consoleOut.style.display = 'block';
          dom.consoleOut.className = 'console';
          dom.consoleOut.textContent = result.stdout;
        } else {
          dom.consoleOut.style.display = 'none';
        }

        // Блок "Как сделать лучше"
        if (result.improveTips && result.improveTips.length > 0) {
          dom.improveBox.classList.add('visible');
          dom.improveContent.innerHTML = result.improveTips.map(tip => `<p>${tip}</p>`).join('');
        } else {
          dom.improveBox.classList.remove('visible');
        }

        // Кнопка перехода к следующему заданию
        dom.btnNext.style.display = 'inline-block';
        dom.btnNext.focus();
      } else {
        // Ошибка
        dom.resultMark.className = 'result-mark err';
        dom.resultMark.textContent = '×';
        dom.resultTitle.className = 'result-title err';
        dom.resultTitle.textContent = result.title;
        dom.resultSub.textContent = result.sub;

        // Понятное объяснение ошибки, если есть
        if (result.friendlyExplain) {
          dom.errorExplain.style.display = 'block';
          dom.errorExplainText.textContent = result.friendlyExplain;
        } else {
          dom.errorExplain.style.display = 'none';
        }

        // Консоль с трассировкой ошибки
        if (result.stdout && result.stdout.trim().length > 0) {
          dom.consoleOut.style.display = 'block';
          dom.consoleOut.className = 'console err';
          dom.consoleOut.textContent = result.stdout;
        } else {
          dom.consoleOut.style.display = 'none';
        }

        dom.improveBox.classList.remove('visible');
        dom.btnNext.style.display = 'none';
      }
    } catch (err) {
      console.error('Ошибка проверки:', err);
      dom.resultBox.classList.add('visible');
      dom.resultMark.className = 'result-mark err';
      dom.resultMark.textContent = '×';
      dom.resultTitle.className = 'result-title err';
      dom.resultTitle.textContent = 'Ошибка среды выполнения Python';
      dom.resultSub.textContent = err.message || String(err);
      dom.errorExplain.style.display = 'none';
      dom.consoleOut.style.display = 'none';
      dom.improveBox.classList.remove('visible');
      dom.btnNext.style.display = 'none';
    } finally {
      state.isChecking = false;
      dom.btnRun.disabled = false;
      dom.btnRun.textContent = 'Проверить';
    }
  }

  /**
   * Переход к следующему элементу
   */
  function nextTask() {
    const currentTopic = state.topics[state.currentTopicIndex];
    if (state.currentTaskIndex + 1 < currentTopic.items.length) {
      state.currentTaskIndex++;
      renderTask();
    } else {
      // Последний шаг в теме: проверяем следующую тему того же этапа
      if (state.currentTopicIndex + 1 < state.topics.length) {
        const nextTopic = state.topics[state.currentTopicIndex + 1];
        if (nextTopic.stageId === currentTopic.stageId) {
          state.currentTopicIndex++;
          state.currentTaskIndex = 0;
          renderTask();
          return;
        }
      }

      // Все темы текущего этапа завершены!
      showFinishScreenForStage(currentTopic.stageId);
    }
  }

  /**
   * Показ финального экрана для конкретного этапа
   */
  function showFinishScreenForStage(stageId) {
    const stage = state.stages.find(s => s.id === stageId) || { title: 'Этап' };
    const finish = stage.finish || { title: 'Этап завершён!', text: 'Ты прошёл все темы этого этапа.' };

    dom.finishTitle.textContent = finish.title;
    dom.finishSub.textContent = finish.text;
    dom.finishStageLabel.textContent = `${stage.title.toLowerCase()} · этап`;

    // Кнопка перехода к следующему этапу (если есть)
    const stageIdx = state.stages.findIndex(s => s.id === stageId);
    if (stageIdx >= 0 && stageIdx + 1 < state.stages.length) {
      const nextStage = state.stages[stageIdx + 1];
      dom.btnFinishNextStage.style.display = 'inline-block';
      dom.btnFinishNextStage.textContent = `Дальше: ${nextStage.title}`;
      dom.btnFinishNextStage.onclick = () => {
        startOrContinueStage(nextStage.id);
      };
    } else {
      dom.btnFinishNextStage.style.display = 'none';
    }

    // Сброс только этого этапа
    dom.btnRestart.onclick = () => {
      if (confirm(`Повторить этап «${stage.title}»? Прогресс и черновики тем этого этапа будут очищены.`)) {
        restartStage(stageId);
      }
    };

    showScreen('finish');
  }

  /**
   * Сброс прогресса и черновиков только указанного этапа
   */
  function restartStage(stageId) {
    const stageTopics = state.topics.filter(t => t.stageId === stageId);
    stageTopics.forEach(topic => {
      topic.items.forEach(item => {
        state.completedTasks.delete(item.id);
        delete state.codeDrafts[item.id];
      });
    });

    const firstTopicIdx = state.topics.findIndex(t => t.stageId === stageId);
    state.currentTopicIndex = firstTopicIdx >= 0 ? firstTopicIdx : 0;
    state.currentTaskIndex = 0;

    saveStorage();
    showScreen('lesson');
    renderTask();
  }

  /**
   * Управление выдвижным деревом курса
   */
  function openTreeDrawer() {
    renderCourseTree();
    dom.treeDrawer.classList.add('open');
    dom.treeBackdrop.classList.add('open');
    setTimeout(() => {
      const activeNode = dom.treeBody.querySelector('.tree-task-node.current');
      if (activeNode) {
        activeNode.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }, 100);
  }

  function closeTreeDrawer() {
    dom.treeDrawer.classList.remove('open');
    dom.treeBackdrop.classList.remove('open');
  }

  function selectTask(topicIdx, taskIdx) {
    state.currentTopicIndex = topicIdx;
    state.currentTaskIndex = taskIdx;
    showScreen('lesson');
    renderTask();
    closeTreeDrawer();
  }

  function renderCourseTree() {
    if (!dom.treeBody) return;

    // Общий подсчет обязательных элементов курса
    let allRequiredTotal = 0;
    let allRequiredDone = 0;
    state.topics.forEach(t => {
      t.items.forEach(it => {
        if (isRequired(it)) {
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

    // Рендер по этапам
    state.stages.forEach(stage => {
      const stageTopics = state.topics
        .map((t, idx) => ({ topic: t, globalIdx: idx }))
        .filter(item => item.topic.stageId === stage.id);

      if (stageTopics.length === 0) return;

      const progress = getStageProgress(stage.id);

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
            selectTask(globalIdx, kIdx);
          });

          tasksContainer.appendChild(taskNode);
        });

        topicEl.appendChild(row);
        topicEl.appendChild(tasksContainer);
        dom.treeBody.appendChild(topicEl);
      });
    });
  }

  /**
   * Настройка редактора кода
   */
  function setupEditor() {
    const popupEl = document.getElementById('autocomplete-popup');
    if (window.CodeIntelliSense && popupEl) {
      new window.CodeIntelliSense(dom.editor, popupEl);
    }

    if (window.PythonHighlighter && dom.editorHighlight) {
      dom.highlighter = new window.PythonHighlighter(dom.editor, dom.editorHighlight);
    }

    dom.editor.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        runCheck();
        return;
      }

      if (popupEl && popupEl.style.display === 'block') {
        if (e.key === 'Tab' || e.key === 'Enter' || e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Escape') {
          return;
        }
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        const start = this.selectionStart;
        const end = this.selectionEnd;
        const val = this.value;

        this.value = val.substring(0, start) + '    ' + val.substring(end);
        this.selectionStart = this.selectionEnd = start + 4;
        onEditorChange();
      } else if (e.key === 'Enter') {
        const pos = this.selectionStart;
        const val = this.value;
        const lineStart = val.lastIndexOf('\n', pos - 1) + 1;
        const currentLine = val.substring(lineStart, pos);
        const match = currentLine.match(/^(\s*)/);
        let indent = match ? match[1] : '';

        if (currentLine.trimEnd().endsWith(':')) {
          indent += '    ';
        }

        if (indent.length > 0) {
          e.preventDefault();
          this.value = val.substring(0, pos) + '\n' + indent + val.substring(pos);
          this.selectionStart = this.selectionEnd = pos + 1 + indent.length;
          onEditorChange();
        }
      }
    });

    dom.editor.addEventListener('input', onEditorChange);
  }

  function onEditorChange() {
    const task = getCurrentTask();
    if (task) {
      state.codeDrafts[task.id] = dom.editor.value;
      saveStorage();
    }
    updateLineNumbers();
  }

  function updateLineNumbers() {
    if (!dom.lineNumbers) return;
    const lines = (dom.editor.value || '').split('\n').length;
    let html = '';
    for (let i = 1; i <= lines; i++) {
      html += i + '\n';
    }
    dom.lineNumbers.textContent = html;
  }

  /**
   * Настройка событий интерфейса
   */
  function setupEvents() {
    dom.mark.addEventListener('click', () => {
      showScreen('start');
    });

    if (dom.btnTreeToggle) dom.btnTreeToggle.addEventListener('click', openTreeDrawer);
    if (dom.btnTreeStart) dom.btnTreeStart.addEventListener('click', openTreeDrawer);
    if (dom.btnTreeClose) dom.btnTreeClose.addEventListener('click', closeTreeDrawer);
    if (dom.treeBackdrop) dom.treeBackdrop.addEventListener('click', closeTreeDrawer);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && dom.treeDrawer && dom.treeDrawer.classList.contains('open')) {
        closeTreeDrawer();
      }
    });

    // Кнопки урока
    dom.btnRun.addEventListener('click', runCheck);
    dom.btnNext.addEventListener('click', nextTask);

    // Кнопка пропустить (для star / optional)
    dom.btnSkip.addEventListener('click', nextTask);

    // Кнопка теории
    dom.btnTheoryNext.addEventListener('click', () => {
      const task = getCurrentTask();
      if (task) {
        state.completedTasks.add(task.id);
        saveStorage();
      }
      nextTask();
    });

    // Predict
    dom.btnPredictCheck.addEventListener('click', runPredictCheck);
    dom.btnPredictNext.addEventListener('click', nextTask);
    dom.predictInput.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        runPredictCheck();
      }
    });

    // Quiz
    dom.btnQuizCheck.addEventListener('click', runQuizCheck);
    dom.btnQuizNext.addEventListener('click', nextTask);
  }

  /**
   * Запуск приложения
   */
  async function startApp() {
    initDom();
    buildCourseStructure();
    setupEditor();
    setupEvents();
    loadStorage();

    // Фоновая подготовка Pyodide
    if (dom.startStatus) dom.startStatus.textContent = 'Подготовка среды Python...';
    try {
      await window.CodeChecker.initPyodide();
      state.pyodideReady = true;
      if (dom.startStatus) dom.startStatus.textContent = 'Python готов к работе';
    } catch (e) {
      if (dom.startStatus) {
        dom.startStatus.textContent = 'Внимание: локальный запуск требует run.bat при строгих политиках браузера';
      }
    }

    showScreen('start');
  }

  window.addEventListener('DOMContentLoaded', startApp);

})(window);
