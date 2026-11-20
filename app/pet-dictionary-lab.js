/** Словарные опыты Байта. Независимы от четырёх шагов основного проекта. */
(function (window, document) {
  'use strict';

  const exercises = [
    {
      id: 'pet_dict_read',
      title: '1. Прочитай значение',
      description: 'Напиши get_stat(pet, key). Верни значение ключа. Если ключа нет, верни 0 через .get().',
      code: 'def get_stat(pet, key):\n    return pet.get(key, ...)\n',
      hints: [
        { title: 'Найди ключ', text: 'Метод get ищет ключ в словаре и не вызывает ошибку, если ключа нет.' },
        { title: 'Значение по умолчанию', text: 'Второй аргумент get — то, что вернётся для отсутствующего ключа.', code: 'pet.get(key, 0)' },
        { title: 'Решение', code: 'def get_stat(pet, key):\n    return pet.get(key, 0)' }
      ],
      call: 'get_stat(pet, "настроение")',
      tests: [
        { call: 'get_stat({"настроение": 42}, "настроение")', returns: 42 },
        { call: 'get_stat({"сытость": 17}, "сытость")', returns: 17, hidden: true },
        { call: 'get_stat({"настроение": 42}, "любимая_еда")', returns: 0, hidden: true }
      ]
    },
    {
      id: 'pet_dict_update',
      title: '2. Измени значение',
      description: 'Напиши boost(pet, key, amount). Прибавь amount к выбранному стату, удержи его в пределах 0–100 и верни новое значение.',
      code: 'def boost(pet, key, amount):\n    pet[key] = ...\n    return pet[key]\n',
      hints: [
        { title: 'Выбери стат', text: 'Название стата приходит в key. Используй pet[key], а не фиксированный ключ вроде pet["настроение"].' },
        { title: 'Границы 0–100', text: 'Сначала прибавь amount, затем ограничь результат снизу и сверху.', code: 'max(0, min(100, pet[key] + amount))' },
        { title: 'Решение', code: 'def boost(pet, key, amount):\n    pet[key] = max(0, min(100, pet[key] + amount))\n    return pet[key]' }
      ],
      call: 'boost(pet, "настроение", 10)',
      tests: [
        { call: '(lambda pet: [boost(pet, "настроение", 10), pet["настроение"]])({"настроение": 40})', returns: [50, 50] },
        { call: '(lambda pet: [boost(pet, "энергия", 20), pet["энергия"]])({"энергия": 90})', returns: [100, 100], hidden: true },
        { call: '(lambda pet: [boost(pet, "сытость", -10), pet["сытость"]])({"сытость": 5})', returns: [0, 0], hidden: true }
      ]
    },
    {
      id: 'pet_dict_remember',
      title: '3. Добавь ключ',
      description: 'Напиши remember(pet, food). Добавь ключ "любимая_еда" со значением food и верни food.',
      code: 'def remember(pet, food):\n    pet["любимая_еда"] = ...\n    return food\n',
      hints: [
        { title: 'Новый ключ', text: 'Чтобы добавить запись в словарь, присвой значение по новому ключу: pet["ключ"] = значение.' },
        { title: 'Что сохранить', text: 'В food уже лежит название еды. Запиши его в pet["любимая_еда"], затем верни food.' },
        { title: 'Решение', code: 'def remember(pet, food):\n    pet["любимая_еда"] = food\n    return food' }
      ],
      call: 'remember(pet, "ягоды")',
      tests: [
        { call: '(lambda pet: [remember(pet, "ягоды"), pet.get("любимая_еда")])({"имя": "Байт"})', returns: ['ягоды', 'ягоды'] },
        { call: '(lambda pet: [remember(pet, "яблоко"), pet.get("любимая_еда")])({"имя": "Байт"})', returns: ['яблоко', 'яблоко'], hidden: true }
      ]
    }
  ];
  const free = {
    id: 'pet_dict_free', title: 'Свободный опыт',
    description: 'Здесь pet — живой словарь Байта. Меняй его ключи и значения, затем запускай код. Статы должны оставаться числами от 0 до 100.',
    code: 'pet["настроение"] = min(100, pet["настроение"] + 10)\n',
    hints: [
      { title: 'Попробуй новый ключ', text: 'К словарю можно добавить воспоминание, не меняя статы.', code: 'pet["любимая_еда"] = "ягоды"' },
      { title: 'Попробуй восстановить силы', text: 'Для энергии оставь верхнюю границу 100.', code: 'pet["энергия"] = min(100, pet["энергия"] + 15)' }
    ]
  };

  let api;
  let dom;
  let current = exercises[0];
  let snapshot = null;
  let busy = false;
  let highlighter = null;
  const revealedHints = {};
  let hintsVisible = true;

  function renderHints() {
    const hints = current.hints || [];
    const count = revealedHints[current.id] || 0;
    dom.hintArea.hidden = hints.length === 0;
    dom.hintList.replaceChildren();
    for (let i = 0; i < count; i++) {
      const hint = hints[i];
      const item = document.createElement('div');
      item.className = 'pet-dictionary-hint-item';
      const meta = document.createElement('div');
      meta.className = 'pet-dictionary-hint-meta';
      meta.textContent = String(i + 1).padStart(2, '0') + ' / ' + String(hints.length).padStart(2, '0') + '  ' + hint.title;
      item.append(meta);
      if (hint.text) {
        const paragraph = document.createElement('p');
        paragraph.textContent = hint.text;
        item.append(paragraph);
      }
      if (hint.code) {
        const code = document.createElement('pre');
        code.innerHTML = window.PythonHighlighter
          ? window.PythonHighlighter.highlightCode(hint.code)
          : hint.code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        item.append(code);
      }
      dom.hintList.append(item);
    }
    dom.hintList.hidden = count === 0 || !hintsVisible;
    dom.hintToggle.setAttribute('aria-expanded', String(!dom.hintList.hidden));
    dom.hintToggle.textContent = count === hints.length
      ? (hintsVisible ? 'Скрыть подсказки ↑' : 'Показать подсказки ↓')
      : 'Показать подсказку ' + (count + 1) + '/' + hints.length + ' →';
  }

  function revealHint() {
    const count = revealedHints[current.id] || 0;
    if (count < current.hints.length) {
      revealedHints[current.id] = count + 1;
      hintsVisible = true;
    } else {
      hintsVisible = !hintsVisible;
    }
    renderHints();
  }

  function updateEditor() {
    dom.lineNumbers.textContent = Array.from({ length: dom.code.value.split('\n').length }, (_, i) => (i + 1) + '\n').join('');
    if (highlighter) highlighter.update();
  }

  function drafts() { return window.VkatApp.state.codeDrafts; }
  function saveDraft() {
    drafts()[current.id] = dom.code.value;
    if (window.VkatStorage) window.VkatStorage.saveDraftDebounced(current.id, dom.code.value);
  }
  function message(value, error) {
    dom.feedback.textContent = value;
    dom.feedback.classList.toggle('error', Boolean(error));
  }
  function updateOptions() {
    for (const button of dom.options.querySelectorAll('button')) {
      const active = button.dataset.id === current.id;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
      const task = exercises.find(item => item.id === button.dataset.id);
      button.textContent = task && window.VkatApp.state.completedTasks.has(task.id)
        ? task.title + ' ✓' : (task ? task.title : free.title);
    }
    dom.progress.textContent = exercises.filter(item => window.VkatApp.state.completedTasks.has(item.id)).length + ' / 3 опыта';
  }
  function select(task) {
    if (current && !dom.view.hidden) saveDraft();
    current = task;
    dom.title.textContent = task.title;
    dom.description.textContent = task.description;
    hintsVisible = true;
    renderHints();
    dom.code.value = drafts()[task.id] ?? task.code;
    updateEditor();
    dom.run.textContent = task === free ? 'Запустить на Байта' : 'Проверить опыт';
    message('');
    updateOptions();
  }
  function show(dictionary) {
    if (dictionary && !api.isBorn()) return;
    dom.lesson.hidden = dictionary;
    dom.view.hidden = !dictionary;
    dom.lessonTab.classList.toggle('active', !dictionary);
    dom.labTab.classList.toggle('active', dictionary);
    dom.lessonTab.setAttribute('aria-selected', String(!dictionary));
    dom.labTab.setAttribute('aria-selected', String(dictionary));
    if (dictionary) {
      api.onOpen();
      snapshot = structuredClone(api.getModel());
      dom.reset.hidden = false;
      select(current);
    }
    dom.panel.scrollTop = 0;
  }
  function refresh() {
    const born = api.isBorn();
    dom.labTab.disabled = !born;
    if (!born && !dom.view.hidden) show(false);
    if (born && !dom.view.hidden) snapshot = structuredClone(api.getModel());
    updateOptions();
  }
  function validPet(pet) {
    if (!pet || typeof pet !== 'object' || Array.isArray(pet) || typeof pet['имя'] !== 'string') return false;
    return ['сытость', 'настроение', 'энергия'].every(key =>
      typeof pet[key] === 'number' && Number.isFinite(pet[key]) && pet[key] >= 0 && pet[key] <= 100
    );
  }
  async function run() {
    if (busy || !api.isBorn()) return;
    const source = dom.code.value.trim();
    if (!source || source.length > 3000) {
      message('Напиши код длиной до 3000 символов.', true);
      return;
    }
    busy = true;
    dom.run.disabled = true;
    saveDraft();
    try {
      if (current !== free) {
        const result = await window.CodeChecker.checkSolution(source, {
          id: current.id, type: 'code', title: current.title, tests: current.tests, astRequirements: {}
        });
        if (!result.passed) {
          message(result.sub || result.title || 'Проверь ключи и значения словаря.', true);
          return;
        }
      }
      const model = api.getModel();
      const scaffold = document.getElementById('vkat-pet-scaffold').textContent;
      const code = scaffold.replace('__STUDENT_CODE__', '') + '\n' +
        'pet = json.loads(' + JSON.stringify(JSON.stringify(model)) + ')\n' + source + '\n' +
        (current === free ? 'lab_result = None\n' : 'lab_result = ' + current.call + '\n') +
        'print("PET_LAB_RESULT:" + json.dumps({"result": lab_result, "pet": pet}, ensure_ascii=False))\n';
      const result = await window.CodeChecker.runCode(code, 7000);
      if (result.error) {
        message(result.error, true);
        return;
      }
      const line = String(result.stdout || '').split('\n').findLast(item => item.startsWith('PET_LAB_RESULT:'));
      if (!line) { message('Код завершился без состояния Байта.', true); return; }
      const output = JSON.parse(line.slice('PET_LAB_RESULT:'.length));
      if (!validPet(output.pet)) {
        message('Сохрани имя и три стата. Статы должны быть числами от 0 до 100.', true);
        return;
      }
      api.applyModel(output.pet, current === free ? 'Байт обновился' : 'Получилось: ' + String(output.result));
      if (current !== free) {
        window.VkatApp.state.completedTasks.add(current.id);
        window.VkatApp.saveStorage();
        updateOptions();
      }
      message(current === free ? 'Словарь применён к Байту.' : 'Опыт пройден. Байт отреагировал на код.');
    } catch (error) {
      message(error.message || String(error), true);
    } finally {
      busy = false;
      dom.run.disabled = false;
    }
  }
  function init(callbacks) {
    api = callbacks;
    const d = id => document.getElementById(id);
    dom = {
      panel: d('pet-editor-panel'), lesson: d('pet-lesson-view'), view: d('pet-dictionary-view'),
      lessonTab: d('pet-tab-lesson'), labTab: d('pet-tab-dictionary'),
      options: d('pet-dictionary-options'), progress: d('pet-dictionary-progress'),
      title: d('pet-dictionary-title'), description: d('pet-dictionary-description'),
      hintArea: d('pet-dictionary-hints'), hintToggle: d('pet-dictionary-hint-toggle'),
      hintList: d('pet-dictionary-hint-list'),
      code: d('pet-dictionary-code'), lineNumbers: d('pet-dictionary-line-numbers'),
      highlight: d('pet-dictionary-highlight'), autocomplete: d('pet-dictionary-autocomplete'),
      run: d('pet-dictionary-run'),
      reset: d('pet-dictionary-reset'), feedback: d('pet-dictionary-feedback')
    };
    if (window.PythonHighlighter) highlighter = new window.PythonHighlighter(dom.code, dom.highlight);
    if (window.CodeIntelliSense) new window.CodeIntelliSense(dom.code, dom.autocomplete);
    for (const task of [...exercises, free]) {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.id = task.id;
      button.addEventListener('click', () => select(task));
      dom.options.append(button);
    }
    dom.lessonTab.addEventListener('click', () => show(false));
    dom.labTab.addEventListener('click', () => show(true));
    dom.hintToggle.addEventListener('click', revealHint);
    dom.code.addEventListener('input', () => { saveDraft(); updateEditor(); });
    dom.code.addEventListener('keydown', event => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        run();
        return;
      }
      if (event.key !== 'Tab' || dom.autocomplete.style.display === 'block') return;
      event.preventDefault();
      const start = dom.code.selectionStart;
      dom.code.setRangeText('    ', start, dom.code.selectionEnd, 'end');
      dom.code.dispatchEvent(new Event('input', { bubbles: true }));
    });
    dom.run.addEventListener('click', run);
    dom.reset.addEventListener('click', () => {
      if (snapshot) api.applyModel(structuredClone(snapshot), 'Словарь восстановлен');
      message('Байт вернулся к состоянию до опыта.');
    });
    select(exercises[0]);
    refresh();
  }
  window.PetDictionaryLab = { init, refresh, open: () => show(true), exercises };
})(window, document);
