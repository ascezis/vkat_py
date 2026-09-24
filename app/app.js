/**
 * вкат.py — Логика приложения, навигация, состояние, редактор и хранилище
 */

(function (window) {
  'use strict';

  // Ключи LocalStorage
  const STORAGE_KEYS = {
    COMPLETED: 'vkat_completed_tasks',
    DRAFTS: 'vkat_code_drafts',
    POSITION: 'vkat_current_position'
  };

  // Состояние
  let state = {
    topics: [],
    currentTopicIndex: 0,
    currentTaskIndex: 0,
    completedTasks: new Set(),
    codeDrafts: {},
    isChecking: false,
    pyodideReady: false
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

    dom.btnStart = document.getElementById('btn-start');
    dom.startStatus = document.getElementById('start-status');

    // Экран урока
    dom.paneExplain = document.querySelector('.pane-explain');
    dom.lessonTopic = document.getElementById('lesson-topic');
    dom.explainTitle = document.getElementById('explain-title');
    dom.explainContent = document.getElementById('explain-content');
    dom.exampleBox = document.getElementById('example-box');
    dom.taskContent = document.getElementById('task-content');

    dom.editor = document.getElementById('code-editor');
    dom.editorHighlight = document.getElementById('editor-highlight');
    dom.lineNumbers = document.getElementById('line-numbers');
    dom.hintToggle = document.getElementById('hint-toggle');
    dom.hintContent = document.getElementById('hint-content');
    dom.btnRun = document.getElementById('btn-run');
    dom.btnNext = document.getElementById('btn-next');

    dom.resultBox = document.getElementById('result-box');
    dom.resultMark = document.getElementById('result-mark');
    dom.resultTitle = document.getElementById('result-title');
    dom.resultSub = document.getElementById('result-sub');
    dom.consoleOut = document.getElementById('console-out');
    dom.improveBox = document.getElementById('improve-box');
    dom.improveContent = document.getElementById('improve-content');

    dom.bottomTrack = document.getElementById('bottom-track');
    dom.stepDots = document.getElementById('step-dots');
    dom.stepLabel = document.getElementById('step-label');

    // Финал
    dom.btnRestart = document.getElementById('btn-restart');

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
  }

  function saveStorage() {
    try {
      localStorage.setItem(STORAGE_KEYS.COMPLETED, JSON.stringify(Array.from(state.completedTasks)));
      localStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(state.codeDrafts));
      localStorage.setItem(STORAGE_KEYS.POSITION, JSON.stringify({
        topicIndex: state.currentTopicIndex,
        taskIndex: state.currentTaskIndex
      }));
    } catch (e) {
      console.warn('Не удалось сохранить в localStorage:', e);
    }
  }

  /**
   * Общий подсчет количества заданий
   */
  function getTotalTasksCount() {
    return state.topics.reduce((acc, t) => acc + (t.tasks ? t.tasks.length : 0), 0);
  }

  function getCompletedTasksCount() {
    return state.completedTasks.size;
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
   * Расчет и обновление прогресс-бара курса
   */
  function updateCourseProgress() {
    const total = getTotalTasksCount();
    if (total === 0) return;
    const completed = getCompletedTasksCount();
    const percent = Math.min(100, Math.round((completed / total) * 100));
    dom.progressFill.style.width = percent + '%';
  }

  /**
   * Получение текущего задания
   */
  function getCurrentTask() {
    const topic = state.topics[state.currentTopicIndex];
    if (!topic || !topic.tasks) return null;
    return topic.tasks[state.currentTaskIndex] || null;
  }

  /**
   * Рендер текущего задания
   */
  function renderTask() {
    const topic = state.topics[state.currentTopicIndex];
    if (!topic) return;
    const task = topic.tasks[state.currentTaskIndex];
    if (!task) return;

    // Breadcrumbs
    dom.breadcrumb.innerHTML = `${topic.title.toLowerCase()} <b>·</b> задание ${state.currentTaskIndex + 1} из ${topic.tasks.length}`;
    dom.lessonTopic.textContent = topic.title.toLowerCase();

    // Плавная анимация смены шага
    if (dom.paneExplain) {
      dom.paneExplain.classList.remove('pane-fade');
      void dom.paneExplain.offsetWidth; // перезапуск CSS анимации
      dom.paneExplain.classList.add('pane-fade');
    }

    // Теория и формулировка
    dom.explainTitle.textContent = task.title;
    dom.explainContent.innerHTML = task.explanation.map(p => `<p>${p}</p>`).join('');

    if (task.example) {
      dom.exampleBox.style.display = 'block';
      // Подсветка синтаксиса Python в примере
      const highlightedCode = window.PythonHighlighter
        ? window.PythonHighlighter.highlightCode(task.example.code)
        : escapeHtml(task.example.code);
      dom.exampleBox.innerHTML = `${highlightedCode}<span class="out">${escapeHtml(task.example.output)}</span>`;
    } else {
      dom.exampleBox.style.display = 'none';
    }

    dom.taskContent.innerHTML = `<p>${task.assignment}</p>`;

    // Редактор: подстановка черновика или начального кода
    const savedCode = state.codeDrafts[task.id];
    dom.editor.value = savedCode !== undefined ? savedCode : (task.starterCode || '');
    if (dom.highlighter) {
      dom.highlighter.update();
    }
    updateLineNumbers();

    // Подсказка
    if (task.hint) {
      dom.hintToggle.style.display = 'inline-block';
      dom.hintToggle.textContent = 'показать подсказку';
      // Подсветка синтаксиса Python в подсказке
      if (window.PythonHighlighter) {
        dom.hintContent.innerHTML = '<pre class="hint-code">' + window.PythonHighlighter.highlightCode(task.hint) + '</pre>';
      } else {
        dom.hintContent.textContent = task.hint;
      }
      dom.hintContent.classList.remove('visible');
    } else {
      dom.hintToggle.style.display = 'none';
      dom.hintContent.classList.remove('visible');
    }

    // Зона результата: скрываем при переходе к новому заданию
    dom.resultBox.classList.remove('visible');
    dom.improveBox.classList.remove('visible');
    dom.btnNext.style.display = 'none';

    // Точки шагов внизу
    renderStepDots(topic);

    // Нижняя подпись
    dom.stepLabel.textContent = `шаг ${state.currentTaskIndex + 1} / ${topic.tasks.length}`;

    // Прогресс
    updateCourseProgress();
    saveStorage();

    // Автофокус на редактор кода
    requestAnimationFrame(() => dom.editor.focus());
  }

  function renderStepDots(topic) {
    dom.stepDots.innerHTML = '';
    topic.tasks.forEach((t, idx) => {
      const dot = document.createElement('span');
      if (state.completedTasks.has(t.id)) {
        dot.classList.add('done');
      }
      if (idx === state.currentTaskIndex) {
        dot.classList.add('current');
      }
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

  /**
   * Настройка горячих клавиш редактора: Tab и умный Enter
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
      // Ctrl+Enter — запуск проверки
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        runCheck();
        return;
      }

      // Если открыто окно автодополнения, Tab и Enter передаются в него
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
        // Умный отступ после перевода строки
        const pos = this.selectionStart;
        const val = this.value;
        const lineStart = val.lastIndexOf('\n', pos - 1) + 1;
        const currentLine = val.substring(lineStart, pos);
        const match = currentLine.match(/^(\s*)/);
        let indent = match ? match[1] : '';

        // Если строка заканчивается двоеточием, увеличиваем отступ на 4 пробела
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
   * Запуск проверки кода
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
        dom.resultTitle.className = 'result-title ok';
        dom.resultTitle.textContent = result.title;
        dom.resultSub.textContent = result.sub;

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
        // Ошибка (с использованием разрешённого токена ошибки)
        dom.resultMark.className = 'result-mark err';
        dom.resultMark.textContent = '×';
        dom.resultTitle.className = 'result-title err';
        dom.resultTitle.textContent = result.title;
        dom.resultSub.textContent = result.sub;

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
      dom.resultTitle.textContent = 'Ошибка загрузки Python-рантайма';
      
      const msg = err.message || String(err);
      if (window.location.protocol === 'file:' || msg.includes('dynamically imported') || msg.includes('CORS') || msg.includes('Failed to fetch')) {
        dom.resultSub.textContent = 'Браузер блокирует WebAssembly при прямом открытии через file://. Запусти тренажёр через запустить.bat в папке проекта.';
      } else {
        dom.resultSub.textContent = msg;
      }
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
   * Переход к следующему заданию
   */
  function nextTask() {
    const currentTopic = state.topics[state.currentTopicIndex];
    if (state.currentTaskIndex + 1 < currentTopic.tasks.length) {
      state.currentTaskIndex++;
      renderTask();
    } else {
      // Переход к следующей теме
      if (state.currentTopicIndex + 1 < state.topics.length) {
        state.currentTopicIndex++;
        state.currentTaskIndex = 0;
        renderTask();
      } else {
        // Курс пройден!
        showScreen('finish');
      }
    }
  }

  /**
   * Сброс прогресса для повторного прохождения
   */
  function restartCourse() {
    state.completedTasks.clear();
    state.codeDrafts = {};
    state.currentTopicIndex = 0;
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

    const total = getTotalTasksCount();
    const completed = getCompletedTasksCount();
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    if (dom.treeProgressSummary) {
      dom.treeProgressSummary.textContent = `пройдено ${completed} из ${total} заданий (${percent}%)`;
    }

    dom.treeBody.innerHTML = '<div class="tree-root-label">вкат-py/курс/</div>';

    state.topics.forEach((topic, tIdx) => {
      const topicEl = document.createElement('div');
      topicEl.className = 'tree-topic';

      // Считаем прогресс по теме
      const topicCompletedCount = topic.tasks.filter(t => state.completedTasks.has(t.id)).length;
      const isTopicAllDone = topicCompletedCount === topic.tasks.length && topic.tasks.length > 0;
      const isLastTopic = tIdx === state.topics.length - 1;

      const row = document.createElement('div');
      row.className = 'tree-topic-row';
      row.innerHTML = `
        <div class="tree-topic-left">
          <span style="color: var(--text-dim);">${isLastTopic ? '└──' : '├──'}</span>
          <span>${topic.title.toLowerCase()}</span>
        </div>
        <span class="tree-topic-badge ${isTopicAllDone ? 'completed' : ''}">${isTopicAllDone ? '✓ ' : ''}${topicCompletedCount}/${topic.tasks.length}</span>
      `;

      const tasksContainer = document.createElement('div');
      tasksContainer.className = 'tree-tasks-container';

      topic.tasks.forEach((task, kIdx) => {
        const isDone = state.completedTasks.has(task.id);
        const isCurrent = tIdx === state.currentTopicIndex && kIdx === state.currentTaskIndex;
        const isLastTask = kIdx === topic.tasks.length - 1;

        const taskNode = document.createElement('div');
        taskNode.className = `tree-task-node ${isCurrent ? 'current' : ''} ${isDone ? 'completed' : ''}`;
        taskNode.innerHTML = `
          <span class="tree-task-branch">${isLastTask ? '└──' : '├──'}</span>
          <span class="tree-task-icon ${isDone ? 'done' : (isCurrent ? 'current' : 'pending')}">${isDone ? '✓' : (isCurrent ? '●' : '○')}</span>
          <span class="tree-task-title">${kIdx + 1}. ${task.title}</span>
        `;

        taskNode.addEventListener('click', () => {
          selectTask(tIdx, kIdx);
        });

        tasksContainer.appendChild(taskNode);
      });

      topicEl.appendChild(row);
      topicEl.appendChild(tasksContainer);
      dom.treeBody.appendChild(topicEl);
    });
  }

  /**
   * Инициализация событий интерфейса
   */
  function setupEvents() {
    dom.mark.addEventListener('click', () => {
      showScreen('start');
    });

    if (dom.btnTreeToggle) {
      dom.btnTreeToggle.addEventListener('click', openTreeDrawer);
    }
    if (dom.btnTreeStart) {
      dom.btnTreeStart.addEventListener('click', openTreeDrawer);
    }
    if (dom.btnTreeClose) {
      dom.btnTreeClose.addEventListener('click', closeTreeDrawer);
    }
    if (dom.treeBackdrop) {
      dom.treeBackdrop.addEventListener('click', closeTreeDrawer);
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && dom.treeDrawer && dom.treeDrawer.classList.contains('open')) {
        closeTreeDrawer();
      }
    });

    dom.btnStart.addEventListener('click', () => {
      findFirstUnfinishedTask();
      showScreen('lesson');
      renderTask();
    });

    dom.hintToggle.addEventListener('click', () => {
      const isVis = dom.hintContent.classList.toggle('visible');
      dom.hintToggle.textContent = isVis ? 'скрыть подсказку' : 'показать подсказку';
    });

    dom.btnRun.addEventListener('click', runCheck);
    dom.btnNext.addEventListener('click', nextTask);
    dom.btnRestart.addEventListener('click', restartCourse);
  }

  function findFirstUnfinishedTask() {
    for (let t = 0; t < state.topics.length; t++) {
      const topic = state.topics[t];
      for (let k = 0; k < topic.tasks.length; k++) {
        if (!state.completedTasks.has(topic.tasks[k].id)) {
          state.currentTopicIndex = t;
          state.currentTaskIndex = k;
          return;
        }
      }
    }
    // Если всё пройдено
    state.currentTopicIndex = 0;
    state.currentTaskIndex = 0;
  }

  /**
   * Запуск приложения
   */
  async function startApp() {
    initDom();
    setupEditor();
    setupEvents();
    loadStorage();

    // Загружаем зарегистрированные темы
    state.topics = window.COURSE_TOPICS || [];

    if (state.topics.length === 0) {
      console.warn('Темы курса не найдены в window.COURSE_TOPICS');
    }

    // Фоновая инициализация Pyodide
    if (dom.startStatus) dom.startStatus.textContent = 'Подготовка среды Python...';
    try {
      await window.CodeChecker.initPyodide();
      state.pyodideReady = true;
      if (dom.startStatus) dom.startStatus.textContent = 'Python готов к работе';
    } catch (e) {
      if (dom.startStatus) {
        dom.startStatus.textContent = 'Внимание: локальный запуск требует запустить.bat при строгих политиках браузера';
      }
    }

    // Стартовый экран по умолчанию
    showScreen('start');
  }

  window.addEventListener('DOMContentLoaded', startApp);

})(window);
