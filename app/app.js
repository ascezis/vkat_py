/**
 * вкат.py — Оркестратор приложения
 *
 * Этот файл — точка сборки. Он:
 *   1. Хранит глобальное состояние (state) и кэш DOM (dom).
 *   2. Строит структуру курса из window.COURSE_STAGES + window.COURSE_TOPICS.
 *   3. Управляет навигацией: showScreen / startOrContinueStage / nextTask / selectTask.
 *   4. Управляет хранилищем: loadStorage / saveStorage.
 *   5. Инициализирует редактор кода и глобальные события.
 *   6. Запускает приложение (startApp).
 *
 * Модули, подключаемые до этого файла (в index.html):
 *   app/storage.js     → window.VkatStorage
 *   app/checker.js     → window.CodeChecker
 *   app/errors.js      → window.FriendlyErrors
 *   app/highlighter.js → window.PythonHighlighter
 *   app/autocomplete.js → window.CodeIntelliSense
 *   app/glyphs.js      → window.Glyphs
 *   app/profiles.js    → window.VkatProfiles
 *   app/renderers.js   → window.VkatRenderers
 *   app/checkers.js    → window.VkatCheckers
 *
 * Экспортирует window.VkatApp — объект с публичным API для дочерних модулей.
 */

(function (window) {
  'use strict';

  // ─── Состояние ───────────────────────────────────────────────────────────────

  const state = {
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

  // ─── Кэш DOM-элементов ───────────────────────────────────────────────────────

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

    // Профили
    dom.screenProfiles = document.getElementById('screen-profiles');
    dom.profilesViewList = document.getElementById('profiles-view-list');
    dom.profilesViewCreate = document.getElementById('profiles-view-create');
    dom.profilesGrid = document.getElementById('profiles-grid');
    dom.inputImportFile = document.getElementById('input-import-file');
    dom.createProfileHeading = document.getElementById('create-profile-heading');
    dom.formCreateProfile = document.getElementById('form-create-profile');
    dom.inputProfileName = document.getElementById('input-profile-name');
    dom.inputProfilePin = document.getElementById('input-profile-pin');
    dom.legacyMigrationBox = document.getElementById('legacy-migration-box');
    dom.checkMigrateLegacy = document.getElementById('check-migrate-legacy');
    dom.btnSubmitCreateProfile = document.getElementById('btn-submit-create-profile');
    dom.btnCancelCreateProfile = document.getElementById('btn-cancel-create-profile');
    dom.btnQuickStartList = document.getElementById('btn-quick-start-list');
    dom.btnQuickStartCreate = document.getElementById('btn-quick-start-create');

    // PIN Modal
    dom.pinModal = document.getElementById('pin-modal');
    dom.pinModalTitle = document.getElementById('pin-modal-title');
    dom.pinDots = document.getElementById('pin-dots');
    dom.inputModalPin = document.getElementById('input-modal-pin');
    dom.pinErrorAlert = document.getElementById('pin-error-alert');
    dom.btnModalPinSubmit = document.getElementById('btn-modal-pin-submit');
    dom.btnModalPinCancel = document.getElementById('btn-modal-pin-cancel');
    dom.btnModalPinCloseX = document.getElementById('btn-modal-pin-close-x');

    // Справка о системе профилей
    dom.modalProfileHelp = document.getElementById('modal-profile-help');
    dom.btnShowProfileHelpList = document.getElementById('btn-show-profile-help-list');
    dom.btnShowProfileHelpCreate = document.getElementById('btn-show-profile-help-create');
    dom.btnCloseProfileHelpX = document.getElementById('btn-close-profile-help-x');
    dom.btnCloseProfileHelpOk = document.getElementById('btn-close-profile-help-ok');

    // Пользователь в топбаре
    dom.appUserBadge = document.getElementById('app-user-badge');
    dom.appUserName = document.getElementById('app-user-name');
    dom.btnAppSwitchProfile = document.getElementById('btn-app-switch-profile');
    dom.startUserBadge = document.getElementById('start-user-badge');
    dom.startUserName = document.getElementById('start-user-name');
    dom.btnStartSwitchProfile = document.getElementById('btn-start-switch-profile');
    dom.versionResetLabel = document.getElementById('version-reset-label');
    if (dom.versionResetLabel && window.VKAT_VERSION) {
      dom.versionResetLabel.textContent = `v${window.VKAT_VERSION}`;
      dom.versionResetLabel.title = `Версия ${window.VKAT_VERSION}. Удерживай 4 секунды для сброса всех профилей`;
    }
  }

  // ─── Структура курса ──────────────────────────────────────────────────────────

  /**
   * Строит плоский массив тем с привязкой к этапам.
   * Предупреждает в консоли о темах без этапа и об этапах с отсутствующими темами.
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

    rawTopics.forEach(t => {
      if (!usedTopicIds.has(t.id)) {
        console.warn(`Тема "${t.id}" зарегистрирована в COURSE_TOPICS, но не включена ни в один этап`);
      }
    });

    state.topics = flatTopics;
  }

  // ─── Хранилище ───────────────────────────────────────────────────────────────

  async function loadStorage() {
    try {
      const data = await window.VkatStorage.load();
      if (data && Array.isArray(data.completed)) {
        state.completedTasks = new Set(data.completed);
      } else {
        state.completedTasks = new Set();
      }

      state.codeDrafts = (data && data.drafts) || {};

      const pos = (data && data.position) || {};
      let topicIdx = 0;
      let taskIdx = 0;

      if (pos.topicId) {
        const tIdx = state.topics.findIndex(t => t.id === pos.topicId);
        if (tIdx !== -1) {
          topicIdx = tIdx;
          const items = state.topics[tIdx].items || state.topics[tIdx].tasks || [];
          if (pos.itemId) {
            const iIdx = items.findIndex(it => it.id === pos.itemId);
            if (iIdx !== -1) taskIdx = iIdx;
          }
        }
      }

      state.currentTopicIndex = topicIdx;
      state.currentTaskIndex = taskIdx;
    } catch (e) {
      console.warn('Не удалось загрузить данные профиля:', e);
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
    const currentTopic = state.topics[state.currentTopicIndex];
    const currentItem = currentTopic ? (currentTopic.items || currentTopic.tasks || [])[state.currentTaskIndex] : null;

    window.VkatStorage.save({
      completed: Array.from(state.completedTasks),
      drafts: state.codeDrafts,
      position: {
        topicId: currentTopic ? currentTopic.id : '',
        itemId: currentItem ? currentItem.id : ''
      }
    });
  }

  // ─── Утилиты прогресса ────────────────────────────────────────────────────────

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

  function updateCourseProgress() {
    const topic = state.topics[state.currentTopicIndex];
    if (!topic) return;
    const progress = getStageProgress(topic.stageId);
    dom.progressFill.style.width = progress.percent + '%';
  }

  // ─── Профиль: бейдж и смена ──────────────────────────────────────────────────

  function updateProfileBadges() {
    const profile = window.VkatStorage ? window.VkatStorage.getActiveProfileSync() : null;
    const name = profile ? profile.name : '';
    if (dom.appUserName) dom.appUserName.textContent = name;
    if (dom.startUserName) dom.startUserName.textContent = name;
    if (dom.appUserBadge) dom.appUserBadge.style.display = profile ? 'inline-flex' : 'none';
    if (dom.startUserBadge) dom.startUserBadge.style.display = profile ? 'inline-flex' : 'none';
  }

  function switchProfile() {
    if (window.VkatStorage) {
      window.VkatStorage.flushSync();
      window.VkatStorage.clearActiveProfile();
    }
    window.location.reload();
  }

  // ─── Навигация экранов ────────────────────────────────────────────────────────

  function showScreen(screen) {
    if (dom.screenProfiles) dom.screenProfiles.classList.remove('active');
    dom.screenStart.classList.remove('active');
    dom.screenLesson.classList.remove('active');
    dom.screenFinish.classList.remove('active');

    updateProfileBadges();

    if (screen === 'profiles') {
      if (dom.screenProfiles) dom.screenProfiles.classList.add('active');
      dom.topbar.style.display = 'none';
      window.VkatProfiles.renderProfilesScreen();
    } else if (screen === 'start') {
      dom.screenStart.classList.add('active');
      dom.topbar.style.display = 'none';
      window.VkatRenderers.renderStartCards();
    } else if (screen === 'lesson') {
      dom.screenLesson.classList.add('active');
      dom.topbar.style.display = 'flex';
    } else if (screen === 'finish') {
      dom.screenFinish.classList.add('active');
      dom.topbar.style.display = 'flex';
      updateCourseProgress();
    }
  }

  // ─── Навигация по заданиям ────────────────────────────────────────────────────

  function getCurrentTask() {
    const topic = state.topics[state.currentTopicIndex];
    if (!topic || !topic.items) return null;
    return topic.items[state.currentTaskIndex] || null;
  }

  function renderTask() {
    const topic = state.topics[state.currentTopicIndex];
    if (!topic) return;
    const task = topic.items[state.currentTaskIndex];
    if (!task) return;

    const stage = state.stages.find(s => s.id === topic.stageId) || { title: 'Этап' };
    const type = task.type || 'code';

    dom.breadcrumb.innerHTML = `${stage.title.toLowerCase()} <b>·</b> ${topic.title.toLowerCase()} <b>·</b> шаг ${state.currentTaskIndex + 1} из ${topic.items.length}`;
    dom.lessonTopic.textContent = `${stage.title.toLowerCase()} · ${topic.title.toLowerCase()}`;
    dom.stepLabel.textContent = `шаг ${state.currentTaskIndex + 1} / ${topic.items.length}`;

    if (type === 'theory') {
      window.VkatRenderers.renderTheoryView(task);
    } else if (type === 'predict') {
      window.VkatRenderers.renderPredictView(task);
    } else if (type === 'quiz') {
      window.VkatRenderers.renderQuizView(task);
    } else {
      window.VkatRenderers.renderCodeView(task);
    }

    window.VkatRenderers.renderVisual(topic);
    requestAnimationFrame(window.VkatRenderers.fitVisual);
    window.VkatRenderers.renderStepDots(topic);

    updateCourseProgress();
    saveStorage();
  }

  function nextTask() {
    const currentTopic = state.topics[state.currentTopicIndex];
    if (state.currentTaskIndex + 1 < currentTopic.items.length) {
      state.currentTaskIndex++;
      renderTask();
    } else {
      if (state.currentTopicIndex + 1 < state.topics.length) {
        const nextTopic = state.topics[state.currentTopicIndex + 1];
        if (nextTopic.stageId === currentTopic.stageId) {
          state.currentTopicIndex++;
          state.currentTaskIndex = 0;
          renderTask();
          return;
        }
      }
      showFinishScreenForStage(currentTopic.stageId);
    }
  }

  function selectTask(topicIdx, taskIdx) {
    state.currentTopicIndex = topicIdx;
    state.currentTaskIndex = taskIdx;
    showScreen('lesson');
    renderTask();
    closeTreeDrawer();
  }

  function startOrContinueStage(stageId) {
    const stageTopics = state.topics
      .map((t, idx) => ({ topic: t, index: idx }))
      .filter(item => item.topic.stageId === stageId);

    if (stageTopics.length === 0) return;

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

  // ─── Финальный экран ─────────────────────────────────────────────────────────

  function showFinishScreenForStage(stageId) {
    const stage = state.stages.find(s => s.id === stageId) || { title: 'Этап' };
    const finish = stage.finish || { title: 'Этап завершён!', text: 'Ты прошёл все темы этого этапа.' };

    dom.finishTitle.textContent = finish.title;
    dom.finishSub.textContent = finish.text;
    dom.finishStageLabel.textContent = `${stage.title.toLowerCase()} · этап`;

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

    dom.btnRestart.onclick = () => {
      if (confirm(`Повторить этап «${stage.title}»? Прогресс и черновики тем этого этапа будут очищены.`)) {
        restartStage(stageId);
      }
    };

    showScreen('finish');
  }

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

  // ─── Дерево курса ─────────────────────────────────────────────────────────────

  function openTreeDrawer() {
    window.VkatRenderers.renderCourseTree();
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

  // ─── Редактор кода ────────────────────────────────────────────────────────────

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
        window.VkatCheckers.runCheck();
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
      if (window.VkatStorage) {
        window.VkatStorage.saveDraftDebounced(task.id, dom.editor.value);
      }
    }
    window.VkatRenderers.updateLineNumbers();
  }

  // ─── Глобальные события ──────────────────────────────────────────────────────

  function setupEvents() {
    dom.mark.addEventListener('click', () => {
      showScreen('start');
    });

    if (dom.btnTreeToggle) dom.btnTreeToggle.addEventListener('click', openTreeDrawer);
    if (dom.btnTreeStart) dom.btnTreeStart.addEventListener('click', openTreeDrawer);
    if (dom.btnTreeClose) dom.btnTreeClose.addEventListener('click', closeTreeDrawer);
    if (dom.treeBackdrop) dom.treeBackdrop.addEventListener('click', closeTreeDrawer);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (dom.modalProfileHelp && dom.modalProfileHelp.style.display !== 'none') {
          window.VkatProfiles.closeProfileHelp();
          return;
        }
        if (dom.pinModal && dom.pinModal.style.display !== 'none') {
          window.VkatProfiles.closePinModal();
          return;
        }
        if (dom.treeDrawer && dom.treeDrawer.classList.contains('open')) {
          closeTreeDrawer();
        }
      }
    });

    // Кнопки смены профиля
    if (dom.btnAppSwitchProfile) dom.btnAppSwitchProfile.addEventListener('click', switchProfile);
    if (dom.btnStartSwitchProfile) dom.btnStartSwitchProfile.addEventListener('click', switchProfile);

    // Профили — события вынесены в profiles.js
    window.VkatProfiles.setupProfileEvents();

    // Защищённый сброс всех данных (удержание 4 секунды)
    if (dom.versionResetLabel) {
      let resetTimer = null;
      const startReset = () => {
        resetTimer = setTimeout(async () => {
          if (confirm('Внимание: Выполнить полный сброс ВСЕХ профилей и данных тренажера на этом компьютере?')) {
            await window.VkatStorage.resetAll();
            window.location.reload();
          }
        }, 4000);
      };
      const cancelReset = () => {
        if (resetTimer) { clearTimeout(resetTimer); resetTimer = null; }
      };
      dom.versionResetLabel.addEventListener('mousedown', startReset);
      dom.versionResetLabel.addEventListener('mouseup', cancelReset);
      dom.versionResetLabel.addEventListener('mouseleave', cancelReset);
      dom.versionResetLabel.addEventListener('touchstart', startReset);
      dom.versionResetLabel.addEventListener('touchend', cancelReset);
    }

    // Сброс буфера перед уходом со страницы
    window.addEventListener('beforeunload', () => {
      if (window.VkatStorage) window.VkatStorage.flushSync();
    });

    // Межвкладочная синхронизация прогресса
    window.addEventListener('storage', (e) => {
      if (!window.VkatStorage) return;
      const active = window.VkatStorage.getActiveProfileSync();
      if (active && e.key === (window.VkatStorage.KEYS.PROFILE_PREFIX + active.id)) {
        loadStorage().then(() => {
          updateCourseProgress();
          const cur = getCurrentTask();
          if (cur) window.VkatRenderers.renderStepDots(state.topics[state.currentTopicIndex]);
        });
      }
    });

    // Кнопки урока
    dom.btnRun.addEventListener('click', window.VkatCheckers.runCheck);
    dom.btnNext.addEventListener('click', nextTask);
    dom.btnSkip.addEventListener('click', nextTask);

    // Теория
    dom.btnTheoryNext.addEventListener('click', () => {
      const task = getCurrentTask();
      if (task) {
        state.completedTasks.add(task.id);
        saveStorage();
      }
      nextTask();
    });

    // Predict
    dom.btnPredictCheck.addEventListener('click', window.VkatCheckers.runPredictCheck);
    dom.btnPredictNext.addEventListener('click', nextTask);
    dom.predictInput.addEventListener('keydown', (e) => {
      if (e.isComposing) return;
      if ((e.key === 'Enter' && !e.shiftKey) || ((e.ctrlKey || e.metaKey) && e.key === 'Enter')) {
        e.preventDefault();
        window.VkatCheckers.runPredictCheck();
      }
    });
    dom.predictInput.addEventListener('input', () => {
      const task = getCurrentTask();
      if (task) {
        state.codeDrafts[task.id] = dom.predictInput.value;
        if (window.VkatStorage) {
          window.VkatStorage.saveDraftDebounced(task.id, dom.predictInput.value);
        }
      }
    });

    // Quiz
    dom.btnQuizCheck.addEventListener('click', window.VkatCheckers.runQuizCheck);
    dom.btnQuizNext.addEventListener('click', nextTask);
  }

  // ─── Запуск приложения ────────────────────────────────────────────────────────

  async function startApp() {
    initDom();
    buildCourseStructure();
    setupEditor();
    setupEvents();

    const activeProfile = window.VkatStorage ? window.VkatStorage.getActiveProfileSync() : null;

    if (activeProfile) {
      await loadStorage();
      showScreen('start');
    } else {
      showScreen('profiles');
    }

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
  }

  // ─── Публичный API для дочерних модулей ──────────────────────────────────────

  window.VkatApp = {
    // Состояние (read/write для модулей)
    get state() { return state; },
    get dom() { return dom; },

    // Хранилище
    loadStorage,
    saveStorage,

    // Навигация
    showScreen,
    getCurrentTask,
    renderTask,
    nextTask,
    selectTask,
    startOrContinueStage,

    // Прогресс
    getStageProgress,
    updateCourseProgress,
    isRequired,
    isOptional,
    isGradable
  };

  window.addEventListener('DOMContentLoaded', startApp);

})(window);
