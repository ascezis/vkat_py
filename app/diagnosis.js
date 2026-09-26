/**
 * вкат.py — Диагностика профиля пользователя
 * Опциональный экран перед стартом. Сохраняет профиль в localStorage.
 * Влияет на: стартовую позицию, видимость подсказок, финальный экран.
 */

(function (window) {
  'use strict';

  const PROFILE_KEY = 'vkat_user_profile';

  // Вопросы диагностики
  const STEPS = [
    {
      id: 'level',
      prompt: '> опыт с программированием?',
      options: [
        { label: '— пишу иногда, есть базовый опыт', value: 'experienced' },
        { label: '— слышал(а), но почти не пробовал(а)', value: 'familiar' },
        { label: '— полный ноль, первый раз', value: 'zero' }
      ]
    },
    {
      id: 'goal',
      prompt: '> зачем тебе Python?',
      options: [
        { label: '— хочу делать игры и проекты', value: 'games' },
        { label: '— для учёбы / подготовки к экзамену', value: 'study' },
        { label: '— автоматизировать задачи', value: 'automation' },
        { label: '— просто интересно разобраться', value: 'curious' }
      ]
    },
    {
      id: 'code1',
      prompt: '> что выведет этот код?',
      code: 'score = 10\nscore = score + 5\nprint(score)',
      options: [
        { label: '10', value: 'wrong1' },
        { label: '5', value: 'wrong2' },
        { label: '15', value: 'correct' },
        { label: 'ошибку', value: 'wrong3' }
      ],
      correct: 'correct'
    },
    {
      id: 'code2',
      prompt: '> что выведет этот код?',
      code: 'x = 8\nif x > 5:\n    print("да")\nelse:\n    print("нет")',
      options: [
        { label: 'да', value: 'correct' },
        { label: 'нет', value: 'wrong1' },
        { label: 'да\nнет', value: 'wrong2' },
        { label: 'ошибку', value: 'wrong3' }
      ],
      correct: 'correct'
    }
  ];

  const GOAL_LABELS = {
    games: 'игры и проекты',
    study: 'учёба / экзамен',
    automation: 'автоматизация',
    curious: 'интерес'
  };

  const LEVEL_LABELS = {
    experienced: 'знакомый',
    familiar: 'начинающий',
    zero: 'с нуля'
  };

  // Состояние диагностики
  let diagState = {
    currentStep: 0,
    answers: {},
    codeScore: 0
  };

  let onCompleteCb = null;
  let container = null;

  /**
   * Запуск диагностики
   * @param {HTMLElement} el - контейнер экрана
   * @param {Function} onComplete - коллбек по завершении
   */
  function start(el, onComplete) {
    container = el;
    onCompleteCb = onComplete;
    diagState = { currentStep: 0, answers: {}, codeScore: 0 };
    renderStep();
  }

  function renderStep() {
    if (diagState.currentStep >= STEPS.length) {
      renderSummary();
      return;
    }

    const step = STEPS[diagState.currentStep];
    const stepNum = diagState.currentStep + 1;
    const total = STEPS.length;

    let codeBlock = '';
    if (step.code) {
      const escaped = step.code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      codeBlock = `<pre class="diag-code">${escaped}</pre>`;
    }

    const optionsHTML = step.options.map((opt, idx) => `
      <button class="diag-option" data-value="${opt.value}" id="diag-opt-${idx}">
        ${opt.label}
      </button>
    `).join('');

    container.innerHTML = `
      <div class="diag-inner pane-fade">
        <div class="diag-step-counter">${stepNum} / ${total}</div>
        <div class="diag-prompt">${step.prompt}</div>
        ${codeBlock}
        <div class="diag-options">${optionsHTML}</div>
        <div class="diag-feedback" id="diag-feedback"></div>
      </div>
    `;

    // Вешаем обработчики на кнопки
    container.querySelectorAll('.diag-option').forEach(btn => {
      btn.addEventListener('click', () => handleAnswer(btn.dataset.value, step));
    });
  }

  function handleAnswer(value, step) {
    // Блокируем повторный клик
    container.querySelectorAll('.diag-option').forEach(btn => {
      btn.disabled = true;
    });

    // Для вопросов с кодом — показываем правильный/неправильный
    if (step.correct) {
      const isCorrect = value === step.correct;
      if (isCorrect) diagState.codeScore++;

      const feedback = container.querySelector('#diag-feedback');
      if (feedback) {
        feedback.textContent = isCorrect ? '✓ ответ принят' : '✓ ответ принят';
        feedback.className = 'diag-feedback diag-feedback--visible';
      }

      // Подсвечиваем выбранный вариант
      container.querySelectorAll('.diag-option').forEach(btn => {
        if (btn.dataset.value === value) btn.classList.add('diag-option--selected');
        if (btn.dataset.value === step.correct && !isCorrect) btn.classList.add('diag-option--correct');
      });
    } else {
      const feedback = container.querySelector('#diag-feedback');
      if (feedback) {
        feedback.textContent = '✓ ответ принят';
        feedback.className = 'diag-feedback diag-feedback--visible';
      }
      container.querySelectorAll('.diag-option').forEach(btn => {
        if (btn.dataset.value === value) btn.classList.add('diag-option--selected');
      });
    }

    diagState.answers[step.id] = value;

    setTimeout(() => {
      diagState.currentStep++;
      renderStep();
    }, 700);
  }

  function renderSummary() {
    const profile = buildProfile();
    saveProfile(profile);

    const levelLabel = LEVEL_LABELS[profile.level] || profile.level;
    const goalLabel = GOAL_LABELS[profile.goal] || profile.goal;
    const codeLabel = profile.codeScore === 2
      ? 'отличный результат'
      : profile.codeScore === 1
        ? 'базовое понимание'
        : 'начинаем с основ';

    const canSkip = profile.level === 'experienced';
    const skipHint = canSkip
      ? `<div class="diag-skip-hint">→ тема «переменные и вывод» покажется тебе лёгкой. Предложим пропустить её при старте.</div>`
      : '';

    container.innerHTML = `
      <div class="diag-inner pane-fade">
        <div class="diag-prompt">> профиль инициализирован.</div>
        <div class="diag-summary">
          <div class="diag-summary-row">
            <span class="diag-summary-key">трек</span>
            <span class="diag-summary-val">python / base</span>
          </div>
          <div class="diag-summary-row">
            <span class="diag-summary-key">уровень</span>
            <span class="diag-summary-val">${levelLabel}</span>
          </div>
          <div class="diag-summary-row">
            <span class="diag-summary-key">цель</span>
            <span class="diag-summary-val">${goalLabel}</span>
          </div>
          <div class="diag-summary-row">
            <span class="diag-summary-key">код-вопросы</span>
            <span class="diag-summary-val">${profile.codeScore} / 2 — ${codeLabel}</span>
          </div>
        </div>
        ${skipHint}
        <button class="btn-start diag-btn-start" id="diag-btn-start">начать курс</button>
      </div>
    `;

    document.getElementById('diag-btn-start').addEventListener('click', () => {
      if (onCompleteCb) onCompleteCb(profile);
    });
  }

  function buildProfile() {
    const raw = diagState.answers;

    // Уточняем level: если код-вопросы оба правильные и level != zero → experienced
    let level = raw.level || 'zero';
    if (level === 'experienced' && diagState.codeScore === 0) {
      level = 'familiar'; // пересмотр: говорит что писал, но не смог ответить
    }

    return {
      level,
      goal: raw.goal || 'curious',
      codeScore: diagState.codeScore,
      completedAt: Date.now()
    };
  }

  function saveProfile(profile) {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    } catch (e) {
      console.warn('Не удалось сохранить профиль:', e);
    }
  }

  function loadProfile() {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function clearProfile() {
    try {
      localStorage.removeItem(PROFILE_KEY);
    } catch (e) { /* ignore */ }
  }

  // Публичный API
  window.Diagnosis = { start, loadProfile, saveProfile, clearProfile, PROFILE_KEY };

})(window);
