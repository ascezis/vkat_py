/**
 * ТЕРАРИУМ: рендерер пет-проекта «Тамагочи» (PET_MODULE, экран #screen-pet).
 * По образцу app/life-renderer.js, но без canvas/rAF: сцена питомца —
 * арт-компонент PetArt (app/pet-art.js, контракт классов pet-state-*).
 *
 * Модель питомца живёт в JS (S.petModel) внутри сессии; Python (Pyodide через
 * CodeChecker) выполняет функции ученика на каждом действии/тике и возвращает
 * обновлённый словарь через stdout (pet_state_json). Между сессиями питомец
 * «спит в капсуле»: модель пересоздаётся дефолтной — статы не умирают офлайн.
 */
(function (window, document) {
  'use strict';

  const S = {
    module: null,
    dom: {},
    active: false,
    isChecking: false,
    currentStepIndex: 0,
    worldMode: 'egg',
    petModel: null,          // {'имя','сытость','настроение','энергия'} — только внутри сессии
    hour: 14,
    eggCracks: 0,            // трещинки яйца в текущей сессии (0..3)
    revealedHints: {},
    introActive: false,
    introSlide: 1,
    poseTimer: 0,            // отложенный возврат позы (hatch/eat/play такт)
    autoTimer: 0,            // автодень (шаг 4)
    autoOn: false,
    highlighter: null
  };

  // ─── Модель ↔ арт ────────────────────────────────────────────────────────────

  const STAT_KEYS = ['сытость', 'настроение', 'энергия'];

  // Реплики Байта: пул фраз на случай/состояние (кроме дефолтов арта).
  // petSay не повторяет фразу дважды подряд.
  const PHRASES = {
    egg: ['тук…', 'тук-тук…', 'кто там?', 'скорлупа не вечна', 'уже скоро?'],
    hatch: ['я здесь!', 'привет, создатель!', 'первый вдох!'],
    idle: ['мррр', 'тут тепло и уютно', 'слежу за курсором', 'пиши-пиши', 'хвостик доволен', 'а что дальше?'],
    stroke: ['мррр-мррр!', 'ещё!', 'ты лучший хозяин', '+1 в копилку дружбы', '…и это бесплатно'],
    eat: ['ням-ням', 'хрум!', 'ещё ложечку', 'м-м-м, корм с душой'],
    full: ['ур-р…', 'сыт и доволен', 'доеду до сотни'],
    play: ['лови искру!', 'прыг-скок', 'ещё раунд!', 'йо-хо-хо!'],
    sleep: ['тише…', 'zzz-дзин', 'вижу сон про print', 'подзарядка…'],
    hungry: ['где моя миска?', 'кормить! кормить!', 'сытость тает на глазах'],
    sad: ['посиди со мной…', 'настроение ниже плинтуса', 'питомцу нужны объятия'],
    'happy-full': ['мррр!', 'жизнь удалась', 'всё по максимуму!', 'лучший день!']
  };
  let lastPhrase = '';
  function petSay(pool) {
    const arr = PHRASES[pool];
    if (!arr || !arr.length) return '';
    let s = arr[Math.floor(Math.random() * arr.length)];
    if (arr.length > 1) {
      while (s === lastPhrase) s = arr[Math.floor(Math.random() * arr.length)];
    }
    lastPhrase = s;
    return s;
  }

  function defaultModel() {
    return { 'имя': 'Байт', 'сытость': 50, 'настроение': 50, 'энергия': 50 };
  }

  function modelToArt(model) {
    return { food: model['сытость'], mood: model['настроение'], energy: model['энергия'] };
  }

  // ─── Прогресс (паттерн life-renderer) ────────────────────────────────────────

  function completedStepsCount() {
    const completed = (window.VkatApp && window.VkatApp.state.completedTasks) || new Set();
    let n = 0;
    for (const step of S.module.steps) {
      if (completed.has(step.id)) n++;
      else break;
    }
    return n;
  }

  function modeForProgress(n) {
    if (n >= 4) return 'autonomous';
    if (n >= 2) return 'playful';
    if (n >= 1) return 'born';
    return 'egg';
  }

  function loadProgress() {
    const drafts = (window.VkatApp && window.VkatApp.state.codeDrafts) || {};
    const n = completedStepsCount();
    S.currentStepIndex = Math.min(n, S.module.steps.length - 1);
    S.worldMode = modeForProgress(n);
    return drafts;
  }

  // ─── DOM ─────────────────────────────────────────────────────────────────────

  function cacheDom() {
    const d = id => document.getElementById(id);
    S.dom = {
      screen: d('screen-pet'),
      stagePanel: d('pet-stage-panel'),
      editorPanel: d('pet-editor-panel'),
      stageHost: d('pet-stage-host'),
      stage: null,          // #pet-stage — создаётся PetArt.render()
      clock: d('pet-clock'),
      btnHour: d('btn-pet-hour'),
      btnAuto: d('btn-pet-auto'),
      stepIndicator: d('pet-step-indicator'),
      stepDots: d('pet-step-dots'),
      taskTitle: d('pet-task-title'),
      glyphSlot: d('pet-glyph-slot'),
      taskDesc: d('pet-task-desc'),
      editor: d('pet-code-editor'),
      editorHighlight: d('pet-editor-highlight'),
      lineNumbers: d('pet-line-numbers'),
      autocompletePopup: d('pet-autocomplete-popup'),
      editorStatus: d('pet-editor-status'),
      feedback: d('pet-feedback'),
      hintContent: d('pet-hint-content'),
      btnBack: d('btn-pet-back'),
      btnHint: d('btn-pet-hint'),
      btnSubmit: d('btn-pet-submit'),
      btnRun: d('btn-pet-run'),
      stdinInput: d('pet-stdin-input'),
      introView: d('pet-intro-view'),
      introTabs: d('pet-intro-tabs'),
      introSlides: d('pet-intro-slides'),
      btnOpenIntro: d('btn-pet-open-intro'),
      btnSkipIntro: d('btn-pet-skip-intro'),
      btnEnterLab: d('btn-pet-enter-lab')
    };
  }

  // ─── Сцена (PetArt) ──────────────────────────────────────────────────────────

  function buildStage() {
    if (!window.PetArt) return;
    S.dom.stageHost.innerHTML = window.PetArt.render();
    S.dom.stage = S.dom.stageHost.querySelector('#pet-stage');
  }

  function pose(name, message) {
    if (!window.PetArt || !S.dom.stage) return;
    cancelPoseTimer();
    window.PetArt.pose(S.dom.stage, name, message);
    // Арт после каждой позы возвращает кнопкам доступность (кроме egg/hatch):
    // режимная блокировка (шаги 2/3/4) должна перевешивать — применяем её заново.
    updateControlsForMode();
  }

  function cancelPoseTimer() {
    if (S.poseTimer) {
      clearTimeout(S.poseTimer);
      S.poseTimer = 0;
    }
  }

  // Отложенный возврат позы после такта (контракт PetArt: hatch 1600, eat 1450, play 1000)
  function schedulePose(delayMs) {
    cancelPoseTimer();
    S.poseTimer = setTimeout(() => {
      S.poseTimer = 0;
      applyExpressionPose();
    }, delayMs);
  }

  function applyExpressionPose() {
    if (!S.petModel) return;
    const expr = window.PetArt.expression(modelToArt(S.petModel));
    pose(expr, petSay(expr));
  }

  function renderStats() {
    if (window.PetArt && S.dom.stage) {
      window.PetArt.setStats(S.dom.stage, S.petModel ? modelToArt(S.petModel) : { food: 0, mood: 0, energy: 0 });
    }
  }

  function renderSceneForProgress() {
    if (!window.PetArt || !S.dom.stage) return;
    const n = completedStepsCount();
    S.worldMode = modeForProgress(n);
    if (n >= 1 && !S.petModel) S.petModel = defaultModel();
    if (n === 0) {
      S.petModel = null;
      pose('egg', petSay('egg'));
      window.PetArt.cracks(S.dom.stage, S.eggCracks);
    } else {
      applyExpressionPose();
    }
    renderStats();
    updateControlsForMode();
  }

  function updateControlsForMode() {
    const n = completedStepsCount();
    const buttons = S.dom.stage ? Array.from(S.dom.stage.querySelectorAll('[data-pet-action]')) : [];
    // Арт-контракт: в фазах egg/hatch все кнопки сцены недоступны (идёт вылупление)
    const hatching = S.dom.stage && (S.dom.stage.classList.contains('pet-egg') || S.dom.stage.classList.contains('pet-state-hatch'));
    const titles = {
      eat: n >= 2 ? 'Кормить Байта (feed)' : 'Оживёт после шага 2: feed(pet)',
      play: n >= 3 ? 'Играть с Байтом (play)' : 'Оживёт после шага 3: play(pet)',
      sleep: n >= 1 ? 'Уложить Байта поспать' : 'Питомец ещё в яйце'
    };
    for (const btn of buttons) {
      const kind = btn.getAttribute('data-pet-action');
      const modeEnabled = kind === 'eat' ? n >= 2 : kind === 'play' ? n >= 3 : n >= 1;
      btn.disabled = hatching || !modeEnabled;
      btn.title = hatching ? 'Байт вылупляется…' : (titles[kind] || '');
    }
    const autonomous = n >= 4;
    S.dom.btnHour.disabled = !autonomous;
    S.dom.btnAuto.disabled = !autonomous;
    S.dom.btnHour.title = autonomous ? 'Прокрутить час жизни питомца (tick)' : 'Часы откроются после сдачи шага 4';
    S.dom.btnAuto.title = autonomous ? 'Время пойдёт само' : 'Часы откроются после сдачи шага 4';
    updateClock();
  }

  function updateClock() {
    S.dom.clock.textContent = String(S.hour).padStart(2, '0') + ':00';
  }

  // ─── Панель шага (паттерн life-renderer) ─────────────────────────────────────

  function renderStepPanel() {
    const step = S.module.steps[S.currentStepIndex];
    const n = S.currentStepIndex + 1;

    S.dom.stepIndicator.textContent = 'шаг ' + n + ' из ' + S.module.steps.length;
    S.dom.taskTitle.textContent = step.title;
    if (window.Glyphs && step.glyph) {
      S.dom.glyphSlot.innerHTML = window.Glyphs.draw ? window.Glyphs.draw(step.glyph) : (window.Glyphs.render(step.glyph) || '');
    } else {
      S.dom.glyphSlot.innerHTML = '';
    }
    S.dom.taskDesc.innerHTML =
      '<p class="life-narrative">' + escapeHtml(step.narrative) + '</p>' + step.taskHtml;

    const drafts = (window.VkatApp && window.VkatApp.state.codeDrafts) || {};
    S.dom.editor.value = drafts[step.id] || step.initialCode;
    const done = (window.VkatApp.state.completedTasks.has(step.id));
    S.dom.editorStatus.textContent = done ? 'Сдано ✓' : 'Не проверено';
    S.dom.editorStatus.className = 'editor-status' + (done ? ' ok' : '');

    updateLineNumbers();
    if (S.highlighter) S.highlighter.update();

    S.dom.feedback.className = 'life-feedback-msg';
    S.dom.feedback.innerHTML = '';
    S.dom.hintContent.innerHTML = '';
    S.dom.hintContent.style.display = 'none';
    if (S.dom.editorPanel) S.dom.editorPanel.scrollTop = 0;
    S.revealedHints[step.id] = 0;
    updateHintButton();

    renderStepDots();
  }

  function renderStepDots() {
    const dots = [];
    const completed = (window.VkatApp && window.VkatApp.state.completedTasks) || new Set();
    S.module.steps.forEach((step, i) => {
      const cls = [
        'life-dot',
        i === S.currentStepIndex ? 'current' : '',
        completed.has(step.id) ? 'done' : ''
      ].filter(Boolean).join(' ');
      dots.push('<button type="button" class="' + cls + '" data-step="' + i + '" title="' +
        escapeHtml(step.title) + '">' + (i + 1) + '</button>');
    });
    S.dom.stepDots.innerHTML = dots.join('');
    Array.from(S.dom.stepDots.children).forEach(btn => {
      btn.addEventListener('click', () => setStep(parseInt(btn.getAttribute('data-step'), 10)));
    });
  }

  function setStep(i) {
    if (i < 0 || i >= S.module.steps.length) return;
    const n = completedStepsCount();
    if (i > n) return;
    S.currentStepIndex = i;
    renderStepPanel();
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // ─── Подсказки (паттерн life-renderer) ───────────────────────────────────────

  function updateHintButton() {
    const step = S.module.steps[S.currentStepIndex];
    if (!step) return;
    const hints = (step.hints || []).map(h => typeof h === 'string' ? { text: h } : h);
    const revealed = S.revealedHints[step.id] || 0;

    if (hints.length === 0) {
      S.dom.btnHint.style.display = 'none';
      return;
    }
    S.dom.btnHint.style.display = 'inline-block';
    if (revealed === 0) {
      S.dom.btnHint.textContent = `Показать подсказку (1 из ${hints.length})`;
    } else if (revealed < hints.length) {
      const isSolution = (revealed + 1 === hints.length);
      S.dom.btnHint.textContent = isSolution
        ? `Показать решение (${revealed + 1} из ${hints.length})`
        : `Следующая подсказка (${revealed + 1} из ${hints.length})`;
    } else {
      const isVis = S.dom.hintContent.style.display !== 'none';
      S.dom.btnHint.textContent = isVis ? 'Скрыть подсказки' : 'Показать подсказки';
    }
  }

  function revealHint() {
    const step = S.module.steps[S.currentStepIndex];
    if (!step) return;
    const hints = (step.hints || []).map(h => typeof h === 'string' ? { text: h } : h);
    const revealed = S.revealedHints[step.id] || 0;

    if (revealed < hints.length) {
      S.revealedHints[step.id] = revealed + 1;
      renderHintsList(hints, S.revealedHints[step.id]);
      S.dom.hintContent.style.display = 'flex';
    } else {
      const isVis = S.dom.hintContent.style.display !== 'none';
      S.dom.hintContent.style.display = isVis ? 'none' : 'flex';
    }
    updateHintButton();
  }

  function renderHintsList(hints, count) {
    let html = '';
    for (let i = 0; i < count; i++) {
      const h = hints[i];
      const isLast = (i + 1 === hints.length);
      const label = isLast ? `подсказка ${i + 1} из ${hints.length} (решение)` : `подсказка ${i + 1} из ${hints.length}`;
      html += '<div class="life-hint-item">';
      html += `<div class="life-hint-meta">${label}</div>`;
      if (h.text) {
        html += `<p class="life-hint-text">${escapeHtml(h.text)}</p>`;
      }
      if (h.code) {
        const highlighted = window.PythonHighlighter ? window.PythonHighlighter.highlightCode(h.code) : escapeHtml(h.code);
        html += `<pre class="life-hint-code"><code>${highlighted}</code></pre>`;
      }
      html += '</div>';
    }
    S.dom.hintContent.innerHTML = html;
  }

  // ─── Проверка решения (паттерн life-renderer) ────────────────────────────────

  function buildCheckTask(step) {
    /** @type {TaskItem} */
    const task = {
      id: step.id,
      type: 'code',
      title: step.title,
      tests: step.tests,
      astRequirements: {},
      improveTip: step.improveTip,
      successMessage: step.successMessage
    };
    return task;
  }

  async function submitStep() {
    const step = S.module.steps[S.currentStepIndex];
    if (!step || S.isChecking) return;

    S.isChecking = true;
    S.dom.btnSubmit.disabled = true;
    S.dom.btnSubmit.textContent = 'Проверяем...';

    try {
      const accepted = acceptedCodeBefore(S.currentStepIndex);
      const code = accepted ? accepted + '\n\n' + S.dom.editor.value : S.dom.editor.value;
      const result = await window.CodeChecker.checkSolution(code, buildCheckTask(step));

      if (result.passed) {
        onStepPassed(step, code, result);
      } else {
        S.dom.editorStatus.textContent = 'Есть ошибки';
        S.dom.editorStatus.className = 'editor-status err';
        renderFailFeedback(result);
        onStepFailedEgg();
      }
    } catch (err) {
      renderFailFeedback({
        title: 'Ошибка среды выполнения Python',
        sub: (err && err.message) || String(err),
        stdout: '',
        friendlyExplain: null,
        improveTips: []
      });
    } finally {
      S.isChecking = false;
      S.dom.btnSubmit.disabled = false;
      S.dom.btnSubmit.textContent = 'Проверить';
    }
  }

  // Яйцо трескается от КАЖДОЙ проверки (даже неудачной) — прогресс к вылуплению
  function onStepFailedEgg() {
    if (completedStepsCount() > 0 || !window.PetArt || !S.dom.stage) return;
    S.eggCracks = Math.min(3, S.eggCracks + 1);
    window.PetArt.cracks(S.dom.stage, S.eggCracks);
    pose('egg', S.eggCracks >= 3 ? 'тук! тук! тук!' : petSay('egg'));
  }

  function renderFailFeedback(result) {
    const fb = S.dom.feedback;
    fb.className = 'life-feedback-msg err';
    let html = '<div class="life-fb-row"><span class="life-fb-mark err">×</span>' +
      '<div><div class="life-fb-title">' + escapeHtml(result.title || 'Решение не прошло проверку') + '</div>' +
      '<div class="life-fb-sub">' + escapeHtml(result.sub || '') + '</div></div></div>';
    if (result.friendlyExplain) {
      html += '<div class="life-fb-explain">' + escapeHtml(result.friendlyExplain) + '</div>';
    }
    if (result.stdout && result.stdout.trim()) {
      html += '<pre class="life-fb-console">' + escapeHtml(result.stdout) + '</pre>';
    }
    fb.innerHTML = html;
    showFeedback();
  }

  function showFeedback() {
    if (S.dom.editorPanel) {
      S.dom.editorPanel.scrollTop = S.dom.editorPanel.scrollHeight;
      setTimeout(() => {
        if (S.dom.editorPanel) S.dom.editorPanel.scrollTop = S.dom.editorPanel.scrollHeight;
      }, 400);
    }
  }

  function onStepPassed(step, code, result) {
    const appState = window.VkatApp.state;

    appState.codeDrafts[step.id + '::accepted'] = code;
    if (window.VkatStorage) window.VkatStorage.saveDraftDebounced(step.id + '::accepted', code);

    const wasMode = S.worldMode;
    appState.completedTasks.add(step.id);
    window.VkatApp.saveStorage();

    S.dom.editorStatus.textContent = 'Сдано ✓';
    S.dom.editorStatus.className = 'editor-status ok';

    const fb = S.dom.feedback;
    fb.className = 'life-feedback-msg ok';
    let html = '<div class="life-fb-row"><span class="life-fb-mark ok">✓</span>' +
      '<div><div class="life-fb-title">' + escapeHtml(result.title || 'Решение принято') + '</div>' +
      '<div class="life-fb-sub">' + escapeHtml(step.successMessage || result.sub || '') + '</div></div></div>';
    if (result.improveTips && result.improveTips.length > 0) {
      html += '<div class="life-fb-explain">' + result.improveTips.map(t => escapeHtml(t)).join('<br>') + '</div>';
    }
    const isLast = S.currentStepIndex + 1 >= S.module.steps.length;
    if (!isLast) {
      html += '<button type="button" class="life-btn life-btn-sm" id="btn-pet-next-step">Следующий шаг →</button>';
    } else {
      html += '<div class="life-fb-explain">Пет-проект пройден полностью! Байт живёт по твоим часам — загляни на сцену.</div>';
    }
    fb.innerHTML = html;
    showFeedback();
    const nextBtn = document.getElementById('btn-pet-next-step');
    if (nextBtn) nextBtn.addEventListener('click', () => setStep(S.currentStepIndex + 1));

    renderSceneForProgress();
    renderStepDots();
    // Кульминация: первый сданный шаг — вылупление (яйцо → такт hatch → idle)
    if (wasMode === 'egg' && S.worldMode !== 'egg' && window.PetArt && S.dom.stage) {
      S.eggCracks = 3;
      window.PetArt.cracks(S.dom.stage, 3);
      pose('hatch', petSay('hatch'));
      schedulePose(1600);
    }
  }

  // ─── Действия сцены (eat/play/sleep) и суточный тик ──────────────────────────

  function acceptedCodeBefore(stepIndex) {
    const drafts = (window.VkatApp && window.VkatApp.state.codeDrafts) || {};
    const parts = [];
    for (let i = 0; i < stepIndex && i < S.module.steps.length; i++) {
      const code = drafts[S.module.steps[i].id + '::accepted'];
      if (code) parts.push(code);
    }
    return parts.join('\n\n');
  }

  function buildActionScript(funcCall) {
    // Скаффолд (json-импорт и pet_state_json) + принятый код ученика + драйвер действия.
    // Модель питомца сериализуется в PET_JSON, Python обновляет её функцией ученика,
    // результат возвращается через stdout (pet_state_json).
    const scaffoldEl = document.getElementById('vkat-pet-scaffold');
    const scaffold = scaffoldEl ? scaffoldEl.textContent : '';
    const student = acceptedCodeBefore(S.module.steps.length);
    const petJson = JSON.stringify(S.petModel || defaultModel());
    return scaffold.replace('__STUDENT_CODE__', student) +
      '\n\nPET_JSON = """' + petJson + '"""\n' +
      'pet = json.loads(PET_JSON)\n' +
      funcCall + '\n' +
      'print(pet_state_json(pet))\n';
  }

  function parseStateJson(stdout) {
    const lines = String(stdout || '').split('\n');
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (line.startsWith('{') && line.indexOf('сытость') !== -1) {
        try {
          const parsed = JSON.parse(line);
          if (parsed && typeof parsed['сытость'] === 'number') return parsed;
        } catch (_) { /* не наша строка — идём дальше к началу */ }
      }
    }
    return null;
  }

  async function runAction(kind) {
    if (!window.CodeChecker || S.isChecking) return;
    const n = completedStepsCount();
    if (n < 1) return;

    if (kind === 'sleep') {
      // Движковое действие (без кода ученика): капсула сна — энергия +30, настроение +5
      const m = S.petModel || defaultModel();
      m['энергия'] = Math.min(100, m['энергия'] + 30);
      m['настроение'] = Math.min(100, m['настроение'] + 5);
      S.petModel = m;
      pose('sleep', petSay('sleep'));
      renderStats();
      schedulePose(1600);
      return;
    }

    const funcName = kind === 'eat' ? 'feed' : 'play';
    S.isChecking = true;
    try {
      const result = await window.CodeChecker.runCode(buildActionScript(funcName + '(pet)'));
      if (result.error) {
        renderFailFeedback({
          title: 'Ошибка Python в действии «' + (kind === 'eat' ? 'Кормить' : 'Играть') + '»',
          sub: result.error,
          stdout: result.stdout || '',
          friendlyExplain: null,
          improveTips: []
        });
        return;
      }
      const state = parseStateJson(result.stdout);
      if (!state) {
        renderFailFeedback({
          title: 'Питомец не ответил',
          sub: 'Функция ' + funcName + '() вернула не словарь питомца.',
          stdout: result.stdout || '',
          friendlyExplain: null,
          improveTips: []
        });
        return;
      }
      S.petModel = state;
      renderStats();
      pose(kind, petSay(kind));
      // Контракт PetArt: eat → 1450 мс → full → выражение по статам; play → 1000 мс
      schedulePose(kind === 'eat' ? 1450 : 1000);
    } catch (err) {
      renderFailFeedback({
        title: 'Ошибка среды выполнения Python',
        sub: (err && err.message) || String(err),
        stdout: '',
        friendlyExplain: null,
        improveTips: []
      });
    } finally {
      S.isChecking = false;
    }
  }

  async function runHourTick() {
    if (!window.CodeChecker || S.isChecking || completedStepsCount() < 4) return;
    S.isChecking = true;
    try {
      const result = await window.CodeChecker.runCode(buildActionScript('pet = tick(pet, ' + S.hour + ')'));
      if (!result.error) {
        const state = parseStateJson(result.stdout);
        if (state) {
          S.petModel = state;
          renderStats();
          applyExpressionPose();
        }
      } else {
        stopAutoDay();
        renderFailFeedback({
          title: 'Ошибка Python в суточном такте',
          sub: result.error,
          stdout: result.stdout || '',
          friendlyExplain: null,
          improveTips: []
        });
        return;
      }
    } finally {
      S.isChecking = false;
    }
    S.hour = (S.hour + 1) % 24;
    updateClock();
  }

  function toggleAutoDay() {
    if (S.autoOn) {
      stopAutoDay();
    } else {
      S.autoOn = true;
      S.dom.btnAuto.textContent = 'Автодень: вкл';
      S.dom.btnHour.disabled = true;
      S.autoTimer = setInterval(() => {
        if (!S.active) { stopAutoDay(); return; }
        runHourTick();
      }, 2200);
    }
  }

  function stopAutoDay() {
    if (S.autoTimer) {
      clearInterval(S.autoTimer);
      S.autoTimer = 0;
    }
    S.autoOn = false;
    if (S.dom.btnAuto) S.dom.btnAuto.textContent = 'Автодень: выкл';
    if (S.dom.btnHour && completedStepsCount() >= 4) S.dom.btnHour.disabled = false;
  }

  // ─── Свободный запуск (Угадайка: input() + строки ввода) ─────────────────────

  async function runFree() {
    if (!window.CodeChecker || S.isChecking) return;
    S.isChecking = true;
    S.dom.btnRun.disabled = true;
    try {
      const scaffoldEl = document.getElementById('vkat-pet-scaffold');
      const scaffold = scaffoldEl ? scaffoldEl.textContent : '';
      const accepted = acceptedCodeBefore(S.module.steps.length);
      const draft = S.dom.editor.value;
      const prefix = (accepted ? accepted + '\n\n' : '') + 'PET_SECRET = ' + (1 + Math.floor(Math.random() * 10)) + '\n\n';
      // Песочница: код ученика получает ЖИВОЙ словарь питомца; после выполнения
      // финальное состояние печатается и применяется к сцене — правки кода
      // («Запустить») реально меняют Байта. Черновик исполняется РОВНО ОДИН раз —
      // после инжекции pet (иначе NameError на первой строке).
      const born = completedStepsCount() >= 1;
      let code = scaffold.replace('__STUDENT_CODE__', prefix);
      if (born && S.petModel) {
        code += '\nPET_JSON = """' + JSON.stringify(S.petModel) + '"""\n' +
          'pet = json.loads(PET_JSON)\n' + draft + '\n' +
          'print(pet_state_json(pet))\n';
      }
      const stdinLines = S.dom.stdinInput.value.split('\n').filter((line, i, arr) => !(line === '' && i === arr.length - 1));
      const result = await window.CodeChecker.runCode(code, 7000, stdinLines);
      const fb = S.dom.feedback;
      if (result.error) {
        fb.className = 'life-feedback-msg err';
        fb.innerHTML = '<div class="life-fb-row"><span class="life-fb-mark err">×</span>' +
          '<div><div class="life-fb-title">Ошибка в свободном запуске</div>' +
          '<div class="life-fb-sub">' + escapeHtml(result.error) + '</div></div></div>' +
          (result.stdout ? '<pre class="life-fb-console">' + escapeHtml(result.stdout) + '</pre>' : '');
      } else {
        // Применяем итоговое состояние питомца, если код его вернул
        const state = born ? parseStateJson(result.stdout) : null;
        if (state) {
          S.petModel = state;
          renderStats();
          applyExpressionPose();
        }
        fb.className = 'life-feedback-msg ok';
        const secretHint = (completedStepsCount() >= 3)
          ? 'Угадайка: Байт загадал число от 1 до 10. PET_SECRET запечатан — угадай циклом!'
          : 'Свободный запуск: печатай и пробуй. Испытание «Угадайка» откроется после шага 3.';
        const sandboxHint = (born && state)
          ? ' Сцена обновлена: словарь pet из твоего кода применён к Байту.'
          : (born ? ' Управляй Байтом кодом: feed(pet) — покормить, play(pet) — поиграть, или меняй словарь pet руками.' : '');
        fb.innerHTML = '<div class="life-fb-row"><span class="life-fb-mark ok">▶</span>' +
          '<div><div class="life-fb-title">Запуск завершён</div>' +
          '<div class="life-fb-sub">' + escapeHtml(secretHint + sandboxHint) + '</div></div></div>' +
          '<pre class="life-fb-console">' + escapeHtml(result.stdout || '(пустой вывод)') + '</pre>';
      }
      showFeedback();
    } finally {
      S.isChecking = false;
      S.dom.btnRun.disabled = false;
    }
  }

  // ─── Редактор (паттерн life-renderer) ────────────────────────────────────────

  function updateLineNumbers() {
    if (!S.dom.lineNumbers || !S.dom.editor) return;
    const lines = (S.dom.editor.value || '').split('\n').length;
    let html = '';
    for (let i = 1; i <= lines; i++) {
      html += i + '\n';
    }
    S.dom.lineNumbers.textContent = html;
  }

  function onEditorChange() {
    const step = S.module.steps[S.currentStepIndex];
    if (!step) return;
    const appState = (window.VkatApp && window.VkatApp.state) || { codeDrafts: {} };
    appState.codeDrafts[step.id] = S.dom.editor.value;
    updateLineNumbers();
    if (S.highlighter) S.highlighter.update();
    if (window.VkatStorage) window.VkatStorage.saveDraftDebounced(step.id, S.dom.editor.value);
  }

  // ─── Вводный брифинг (2 слайда) ──────────────────────────────────────────────

  function showIntroView(slideNum) {
    S.introActive = true;
    S.introSlide = Math.max(1, Math.min(2, typeof slideNum === 'number' ? slideNum : 1));
    if (S.dom.introView) S.dom.introView.style.display = 'block';
    // Workbench скрывается на время брифинга (как в Alife)
    const body = document.getElementById('pet-body');
    if (body) body.style.display = 'none';
    if (S.dom.btnOpenIntro) S.dom.btnOpenIntro.style.display = 'none';
    if (S.dom.btnSkipIntro) S.dom.btnSkipIntro.style.display = 'inline-flex';

    if (S.dom.introTabs) {
      const tabs = S.dom.introTabs.querySelectorAll('.intro-tab-btn');
      tabs.forEach(tab => {
        const s = parseInt(tab.dataset.slide, 10);
        tab.classList.toggle('active', s === S.introSlide);
      });
    }
    if (S.dom.introSlides) {
      const slides = S.dom.introSlides.querySelectorAll('.intro-slide');
      slides.forEach(slide => {
        const s = parseInt(slide.dataset.slide, 10);
        slide.style.display = (s === S.introSlide) ? 'block' : 'none';
      });
    }
  }

  function showWorkbenchView() {
    S.introActive = false;
    const body = document.getElementById('pet-body');
    if (body) body.style.display = '';
    if (S.dom.introView) S.dom.introView.style.display = 'none';
    if (S.dom.btnOpenIntro) S.dom.btnOpenIntro.style.display = 'inline-flex';
    if (S.dom.btnSkipIntro) S.dom.btnSkipIntro.style.display = 'none';
    if (window.VkatStorage) {
      window.VkatStorage.setSetting('pet_intro_completed', true);
    }
    if (S.dom.editorPanel) S.dom.editorPanel.scrollTop = 0;
    if (S.dom.editor) {
      S.dom.editor.focus({ preventScroll: true });
    }
  }

  // ─── Вход/выход и карточка на витрине ────────────────────────────────────────

  function enter() {
    if (!S.module) return;
    S.active = true;
    S.eggCracks = 0;
    S.hour = 14;
    S.petModel = null;
    stopAutoDay();
    loadProgress();
    renderSceneForProgress();
    renderStepPanel();

    const introDone = window.VkatStorage ? window.VkatStorage.getSetting('pet_intro_completed', false) : false;
    if (!introDone && completedStepsCount() === 0) {
      showIntroView(1);
    } else {
      showWorkbenchView();
    }
  }

  function leave() {
    S.active = false;
    cancelPoseTimer();
    stopAutoDay();
    if (window.VkatStorage) window.VkatStorage.flushSync();
  }

  function renderCard() {
    const host = document.getElementById('pet-start-card');
    if (!host || !S.module) return;

    const n = completedStepsCount();
    const total = S.module.steps.length;
    const done = n >= total;
    const btnText = n === 0 ? 'Начать' : (done ? 'Повторить' : 'Продолжить');
    const percent = total > 0 ? Math.round((n / total) * 100) : 0;

    host.className = 'stage-card project-hero';
    host.innerHTML =
      '<div class="project-hero-art project-hero-art-pet" aria-hidden="true">' +
        '<svg viewBox="0 0 320 180" focusable="false"><path class="project-art-ground" d="M28 151h264m-247 5h26m7 0h118"/>' +
        '<path class="project-art-body" d="M103 119q0-25 17-43 12-12 31-14 7-2 11-17 2-6 6 2 3 7 0 13 12-4 19-12 4-4 4 3l-4 14q21 7 29 30 4 13 11 25 7 14-5 20-7 3-15 1-8 9-20 6-11 5-25 1-12 4-24 0-13 4-23-4-13 3-19-6-5-7 7-19z"/>' +
        '<ellipse class="project-art-eye" cx="140" cy="104" rx="9" ry="13"/><ellipse class="project-art-eye" cx="179" cy="104" rx="9" ry="13"/>' +
        '<circle class="project-art-glint" cx="138" cy="99" r="3"/><circle class="project-art-glint" cx="177" cy="99" r="3"/>' +
        '<path class="project-art-mouth" d="M153 117q6 7 12 0"/><ellipse class="project-art-cheek" cx="119" cy="116" rx="6" ry="3"/><ellipse class="project-art-cheek" cx="199" cy="116" rx="6" ry="3"/></svg>' +
      '</div>' +
      '<div class="stage-card-header">' +
        '<div class="stage-card-title">Тамагочи</div>' +
        '<div class="stage-card-progress-label">' + (done ? '✓ пройдено' : n + ' из ' + total) + '</div>' +
      '</div>' +
      '<p class="stage-card-desc">' + escapeHtml(S.module.description) + '</p>' +
      '<div class="stage-card-meta">' +
        '<span>1 тема</span>' +
        '<span>' + total + ' задания</span>' +
      '</div>' +
      '<div class="stage-card-note">Живой питомец Байт: словарь, функции и суточный цикл без единой матрицы.</div>' +
      '<div class="stage-card-actions">' +
        '<button type="button" class="stage-card-btn" id="btn-pet-open">' + btnText + '</button>' +
        '<span style="font-family: var(--font-mono); font-size: 12px; color: var(--text-dim);">' + percent + '%</span>' +
      '</div>';

    const btn = document.getElementById('btn-pet-open');
    if (btn) {
      btn.addEventListener('click', () => {
        window.VkatApp.showScreen('pet');
      });
    }
  }

  // ─── Инициализация ───────────────────────────────────────────────────────────

  function setupEvents() {
    S.dom.btnBack.addEventListener('click', () => window.VkatApp.showScreen('projects'));
    if (S.dom.btnOpenIntro) S.dom.btnOpenIntro.addEventListener('click', () => showIntroView(1));
    if (S.dom.btnSkipIntro) S.dom.btnSkipIntro.addEventListener('click', showWorkbenchView);
    if (S.dom.btnEnterLab) S.dom.btnEnterLab.addEventListener('click', showWorkbenchView);

    if (S.dom.introTabs) {
      S.dom.introTabs.addEventListener('click', e => {
        const btn = e.target.closest('.intro-tab-btn');
        if (!btn || !btn.dataset.slide) return;
        showIntroView(parseInt(btn.dataset.slide, 10));
      });
    }

    S.dom.btnSubmit.addEventListener('click', submitStep);
    S.dom.btnRun.addEventListener('click', runFree);
    S.dom.btnHint.addEventListener('click', revealHint);
    S.dom.btnHour.addEventListener('click', runHourTick);
    S.dom.btnAuto.addEventListener('click', toggleAutoDay);

    // Действия сцены: делегированный клик по кнопкам-намерениям арта
    if (S.dom.stageHost) {
      S.dom.stageHost.addEventListener('click', e => {
        const actionBtn = e.target.closest('[data-pet-action]');
        if (actionBtn && !actionBtn.disabled) {
          runAction(actionBtn.getAttribute('data-pet-action'));
          return;
        }
        // Клик по сцене вне кнопок = погладить (без Python: +1 настроение)
        const stage = e.target.closest('#pet-stage');
        if (stage && S.petModel && !e.target.closest('[data-pet-action]')) {
          S.petModel['настроение'] = Math.min(100, S.petModel['настроение'] + 1);
          renderStats();
          pose('idle', petSay('stroke'));
          schedulePose(1200);
        }
      });
    }

    // Подсветка синтаксиса и автодополнение в редакторе (как в основном курсе)
    if (window.PythonHighlighter && S.dom.editor && S.dom.editorHighlight) {
      S.highlighter = new window.PythonHighlighter(S.dom.editor, S.dom.editorHighlight);
    }
    if (window.CodeIntelliSense && S.dom.editor && S.dom.autocompletePopup) {
      new window.CodeIntelliSense(S.dom.editor, S.dom.autocompletePopup);
    }

    S.dom.editor.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        submitStep();
        return;
      }
      if (S.dom.autocompletePopup && S.dom.autocompletePopup.style.display === 'block') {
        if (e.key === 'Tab' || e.key === 'Enter' || e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Escape') {
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

  function init() {
    S.module = window.PET_MODULE;
    if (!S.module || !S.module.steps || S.module.steps.length === 0) {
      console.warn('PET_MODULE не найден — терариум отключён');
      return;
    }
    cacheDom();
    buildStage();
    renderStats();
    updateControlsForMode();
    // Глифы вводных слайдов (слоты .intro-visual[data-glyph])
    if (window.Glyphs && S.dom.introView) {
      S.dom.introView.querySelectorAll('.intro-visual').forEach(box => {
        const key = box.getAttribute('data-glyph');
        if (key && window.Glyphs.draw) box.innerHTML = window.Glyphs.draw(key);
      });
    }
    setupEvents();
  }

  // _state — отладочный хук (dev-консоль/E2E): S не является публичным контрактом
  window.VkatPet = { init, enter, leave, renderCard, showIntroView, showWorkbenchView, _state: S };
})(window, document);
