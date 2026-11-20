/** Словарные опыты Байта. Независимы от четырёх шагов основного проекта. */
(function (window, document) {
  'use strict';

  const exercises = [
    {
      id: 'pet_dict_read',
      title: '1. Прочитай значение',
      description: 'Напиши get_stat(pet, key). Верни значение ключа. Если ключа нет, верни 0 через .get().',
      code: 'def get_stat(pet, key):\n    return pet.get(key, ...)\n',
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
    code: 'pet["настроение"] = min(100, pet["настроение"] + 10)\n'
  };

  let api;
  let dom;
  let current = exercises[0];
  let snapshot = null;
  let busy = false;

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
    dom.code.value = drafts()[task.id] ?? task.code;
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
      code: d('pet-dictionary-code'), run: d('pet-dictionary-run'),
      reset: d('pet-dictionary-reset'), feedback: d('pet-dictionary-feedback')
    };
    for (const task of [...exercises, free]) {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.id = task.id;
      button.addEventListener('click', () => select(task));
      dom.options.append(button);
    }
    dom.lessonTab.addEventListener('click', () => show(false));
    dom.labTab.addEventListener('click', () => show(true));
    dom.code.addEventListener('input', saveDraft);
    dom.run.addEventListener('click', run);
    dom.reset.addEventListener('click', () => {
      if (snapshot) api.applyModel(structuredClone(snapshot), 'Словарь восстановлен');
      message('Байт вернулся к состоянию до опыта.');
    });
    select(exercises[0]);
    refresh();
  }
  window.PetDictionaryLab = { init, refresh, exercises };
})(window, document);
