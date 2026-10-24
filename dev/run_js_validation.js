/**
 * Автономная валидация структуры курса и FriendlyErrors через Node.js
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const localStorageStore = new Map();
const sessionStorageStore = new Map();

const localStorageMock = {
  getItem: (k) => localStorageStore.has(k) ? localStorageStore.get(k) : null,
  setItem: (k, v) => localStorageStore.set(k, String(v)),
  removeItem: (k) => localStorageStore.delete(k),
  clear: () => localStorageStore.clear()
};

const sessionStorageMock = {
  getItem: (k) => sessionStorageStore.has(k) ? sessionStorageStore.get(k) : null,
  setItem: (k, v) => sessionStorageStore.set(k, String(v)),
  removeItem: (k) => sessionStorageStore.delete(k),
  clear: () => sessionStorageStore.clear()
};

const context = {
  console: console,
  TextEncoder: TextEncoder,
  Uint8Array: Uint8Array,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  localStorage: localStorageMock,
  sessionStorage: sessionStorageMock,
  crypto: globalThis.crypto
};
context.window = context;
context.globalThis = context;

function loadScript(relPath) {
  const fullPath = path.join(__dirname, '..', relPath);
  const code = fs.readFileSync(fullPath, 'utf8');
  vm.runInNewContext(code, context, { filename: relPath });
}

console.log('=== Загрузка JS скриптов ===');
loadScript('content/stages.js');
loadScript('content/start/01-variables.js');
loadScript('content/start/02-conditions.js');
loadScript('content/start/03-loops.js');
loadScript('content/start/04-functions.js');
loadScript('content/start/05-lists-dicts.js');
loadScript('content/start/06-strings.js');
loadScript('content/core/01-functions.js');
loadScript('content/core/02-dicts.js');
loadScript('content/core/03-lists.js');
loadScript('content/core/04-tuples.js');
loadScript('content/core/05-strings-adv.js');
loadScript('content/core/06-loops-adv.js');
loadScript('content/core/07-nested-structures.js');
loadScript('app/version.js');
loadScript('app/storage.js');
loadScript('app/errors.js');
loadScript('dev/selftest/l1-functions.js');
loadScript('dev/selftest/l1-dicts.js');

const stages = context.window.COURSE_STAGES;
const topics = context.window.COURSE_TOPICS;
const errors = context.window.FriendlyErrors;
const selftest = context.window.COURSE_SELFTEST;

let passed = 0;
let failed = 0;

function check(desc, condition) {
  if (condition) {
    console.log(`  ✓ ${desc}`);
    passed++;
  } else {
    console.error(`  × FAIL: ${desc}`);
    failed++;
  }
}

console.log('\n=== Валидация этапов и тем ===');
check('COURSE_STAGES объявлен и содержит 2 этапа', Array.isArray(stages) && stages.length === 2);
check('Этап start содержит 6 тем', stages[0].id === 'start' && stages[0].topics.length === 6);
check('Этап core содержит l1_functions и l1_dicts', stages[1].id === 'core' && stages[1].topics.includes('l1_functions') && stages[1].topics.includes('l1_dicts'));

const topicMap = new Map(topics.map(t => [t.id, t]));
stages.forEach(st => {
  st.topics.forEach(topId => {
    check(`Тема ${topId} из этапа ${st.id} существует`, topicMap.has(topId));
  });
});

console.log('\n=== Валидация элементов темы l1_functions ===');
const l1 = topicMap.get('l1_functions');
check('Тема l1_functions содержит items[]', l1 && Array.isArray(l1.items));
check('Тема l1_functions содержит ровно 20 элементов', l1.items.length === 20);

const expectedOrder = [
  'l1_fn_t1', 'l1_fn_q1', 'l1_fn_t2', 'l1_fn_q2', 'l1_fn_t3',
  'l1_fn_p1', 'l1_fn_p2', 'l1_fn_c1', 'l1_fn_f1', 'l1_fn_c2',
  'l1_fn_c3', 'l1_fn_c4', 'l1_fn_t4', 'l1_fn_q3', 'l1_fn_c5',
  'l1_fn_c6', 'l1_fn_q4', 'l1_fn_c7', 'l1_fn_c8', 'l1_fn_t5'
];

expectedOrder.forEach((id, idx) => {
  check(`[l1_functions] Элемент #${idx + 1} равен ${id}`, l1.items[idx].id === id);
});

// Проверка подсчёта обязательных и необязательных элементов
let reqCount = 0;
let optCount = 0;
let theoryCount = 0;
l1.items.forEach(it => {
  const type = it.type || 'code';
  if (type === 'theory') theoryCount++;
  else if (it.optional || it.tier === 'star') optCount++;
  else reqCount++;
});
check('[l1_functions] Обязательных проверяемых элементов 13', reqCount === 13);
check('[l1_functions] Необязательных (★) элементов 2', optCount === 2);
check('[l1_functions] Элементов теории 5', theoryCount === 5);

console.log('\n=== Валидация элементов темы l1_dicts ===');
const l1d = topicMap.get('l1_dicts');
check('Тема l1_dicts содержит items[]', l1d && Array.isArray(l1d.items));
check('Тема l1_dicts содержит ровно 19 элементов', l1d && l1d.items.length === 19);

const expectedDictOrder = [
  'l1_dict_t1', 'l1_dict_q1', 'l1_dict_t2', 'l1_dict_p1', 'l1_dict_t3',
  'l1_dict_q2', 'l1_dict_p2', 'l1_dict_c1', 'l1_dict_t4', 'l1_dict_q3',
  'l1_dict_p3', 'l1_dict_f1', 'l1_dict_t5', 'l1_dict_q4', 'l1_dict_q5',
  'l1_dict_c2', 'l1_dict_c3', 'l1_dict_c4', 'l1_dict_t6'
];

expectedDictOrder.forEach((id, idx) => {
  check(`[l1_dicts] Элемент #${idx + 1} равен ${id}`, l1d && l1d.items[idx] && l1d.items[idx].id === id);
});

let reqCountD = 0;
let optCountD = 0;
let theoryCountD = 0;
if (l1d) {
  l1d.items.forEach(it => {
    const type = it.type || 'code';
    if (type === 'theory') theoryCountD++;
    else if (it.optional || it.tier === 'star') optCountD++;
    else reqCountD++;
  });
}
check('[l1_dicts] Обязательных проверяемых элементов 12', reqCountD === 12);
check('[l1_dicts] Необязательных (★) элементов 1', optCountD === 1);
check('[l1_dicts] Элементов теории 6', theoryCountD === 6);

console.log('\n=== Валидация уникальности ID во всём курсе ===');
const allIds = new Set();
let hasDuplicates = false;
topics.forEach(t => {
  const items = t.items || t.tasks || [];
  items.forEach(it => {
    if (allIds.has(it.id)) {
      hasDuplicates = true;
      console.error(`Дубликат ID: ${it.id}`);
    }
    allIds.add(it.id);
  });
});
check(`Все ID элементов курса уникальны (${allIds.size} элементов)`, !hasDuplicates && allIds.size >= 65);


console.log('\n=== Валидация дружелюбных ошибок (FriendlyErrors) ===');
check('IndentationError распознаётся', typeof errors.explain('IndentationError: expected an indented block after function definition') === 'string');
check('SyntaxError : распознаётся со словом SyntaxError', typeof errors.explain('SyntaxError: expected \':\'') === 'string');
check('Синтаксис : распознаётся БЕЗ слова SyntaxError (реальный str(e))', typeof errors.explain("expected ':' (<unknown>, line 1)") === 'string');
check('Незакрытая скобка распознаётся БЕЗ слова SyntaxError', typeof errors.explain("'(' was never closed (<unknown>, line 1)") === 'string');
check('Лишняя скобка (unmatched) распознаётся', typeof errors.explain("unmatched ')' (<unknown>, line 1)") === 'string');
check('Незакрытая фигурная скобка { распознаётся', typeof errors.explain("'{' was never closed (<unknown>, line 1)") === 'string');
check('NameError распознаётся и содержит имя переменной', errors.explain("NameError: name 'total' is not defined").includes('total'));
check('TypeError NoneType распознаётся', errors.explain("TypeError: unsupported operand type(s) for +: 'NoneType' and 'int'").includes('return'));
check('ZeroDivisionError распознаётся', errors.explain('ZeroDivisionError: division by zero').includes('Деление на ноль'));
check('IndexError распознаётся', errors.explain('IndexError: list index out of range').includes('Индексы начинаются с 0'));

console.log('\n=== Валидация выбора первого элемента этапа (не пропускает теорию) ===');
function isOptional(item) {
  return Boolean(item.optional || item.tier === 'star');
}
function findFirstUncompleted(stageId, completedSet) {
  const stage = stages.find(s => s.id === stageId);
  for (const topId of stage.topics) {
    const t = topicMap.get(topId);
    for (let k = 0; k < t.items.length; k++) {
      const it = t.items[k];
      if (!isOptional(it) && !completedSet.has(it.id)) {
        return it;
      }
    }
  }
  return null;
}

const emptyCompleted = new Set();
const firstCoreItem = findFirstUncompleted('core', emptyCompleted);
check('На пустом прогрессе этап core начинает с первого элемента (теория l1_fn_t1)', firstCoreItem && firstCoreItem.id === 'l1_fn_t1' && firstCoreItem.type === 'theory');

const theoryDone = new Set(['l1_fn_t1']);
const secondCoreItem = findFirstUncompleted('core', theoryDone);
check('После прочтения теории core переходит к квизу (l1_fn_q1)', secondCoreItem && secondCoreItem.id === 'l1_fn_q1');

async function runStorageValidation() {
  console.log('\n=== Валидация системы профилей и VkatStorage ===');
  check('VKAT_VERSION экспортирован в формате SemVer', typeof context.window.VKAT_VERSION === 'string' && /^\d+\.\d+\.\d+$/.test(context.window.VKAT_VERSION));
  const storage = context.window.VkatStorage;
  check('VkatStorage экспортирован', Boolean(storage && typeof storage.listProfiles === 'function'));

  // 1. Пустое состояние
  const initialProfiles = await storage.listProfiles();
  check('На пустом хранилище список профилей пуст', Array.isArray(initialProfiles) && initialProfiles.length === 0);

  // 2. Создание профиля без PIN
  const p1 = await storage.createProfile('Артём');
  check('Профиль Артём создан с 8-значным ID', p1 && p1.name === 'Артём' && p1.id && p1.id.length === 8);
  check('У профиля без PIN нет pinHash', p1.pinHash === undefined);
  const profilesAfterP1 = await storage.listProfiles();
  check('listProfiles содержит 1 профиль', profilesAfterP1.length === 1 && profilesAfterP1[0].name === 'Артём');

  // 3. Создание профиля с PIN
  const p2 = await storage.createProfile('Даша', '1234');
  check('Профиль Даша создан с pinHash', p2 && p2.pinHash && typeof p2.pinHash === 'string');

  // 4. Проверка PIN-кода
  let wrongPinCaught = false;
  try {
    await storage.selectProfile(p2.id, '9999');
  } catch (e) {
    wrongPinCaught = true;
  }
  check('Неверный PIN-код отклоняется', wrongPinCaught);

  await storage.selectProfile(p2.id, '1234');
  check('Верный PIN позволяет авторизоваться', storage.getActiveProfileSync() && storage.getActiveProfileSync().id === p2.id);

  // 5. Изоляция сессии вкладки
  check('sessionStorage содержит активный профиль', sessionStorageMock.getItem('vkat_active_profile') === p2.id);
  check('localStorage содержит подсказку последнего входа', localStorageMock.getItem('vkat_last_profile') === p2.id);

  // 6. Сохранение и загрузка данных с семантической позицией
  await storage.save({
    completed: ['l1_fn_c1'],
    drafts: { 'l1_fn_c1': 'def double(x): return x * 2' },
    position: { topicId: 'l1_functions', itemId: 'l1_fn_c1' }
  });
  const dataP2 = await storage.load();
  check('Данные профиля Даша сохранены и загружены', dataP2.completed.includes('l1_fn_c1'));
  check('Семантическая позиция { topicId, itemId } сохранена', dataP2.position.topicId === 'l1_functions' && dataP2.position.itemId === 'l1_fn_c1');
  check('Снимок данных профиля сохранён в ключе vkat_p:<id>', Boolean(localStorageMock.getItem('vkat_p:' + p2.id)));
  check('getProgressCount возвращает количество завершенных шагов (1)', storage.getProgressCount(p2.id) === 1);
  check('getProgressCount для пустого профиля возвращает 0', storage.getProgressCount(p1.id) === 0);

  // 7. Debounced черновики и flushSync
  storage.saveDraftDebounced('l1_fn_c2', 'print("test")');
  storage.flushSync();
  const dataAfterFlush = await storage.load();
  check('flushSync немедленно синхронизирует отложенные черновики в хранилище', dataAfterFlush.drafts['l1_fn_c2'] === 'print("test")');

  // 8. Переключение на профиль Артёма — изоляция данных
  await storage.selectProfile(p1.id);
  const dataP1 = await storage.load();
  check('Данные Артёма изолированы от Даши (прогресс пуст)', dataP1.completed.length === 0 && !dataP1.drafts['l1_fn_c1']);

  // 9. Миграция устаревших данных (Legacy)
  localStorageStore.clear();
  sessionStorageStore.clear();
  storage.clearActiveProfile();

  localStorageMock.setItem('vkat_completed_tasks', JSON.stringify(['variables_task1']));
  localStorageMock.setItem('vkat_code_drafts', JSON.stringify({ 'variables_task1': 'a = 5' }));
  localStorageMock.setItem('vkat_current_position', JSON.stringify({ topicIndex: 0, taskIndex: 0 }));
  localStorageMock.setItem('vkat_schema', '2');

  check('checkLegacyData обнаруживает устаревшие данные при отсутствии профилей', storage.checkLegacyData() === true);

  localStorageMock.setItem('vkat_profiles', '[]');
  check('checkLegacyData корректно возвращает true при vkat_profiles: "[]"', storage.checkLegacyData() === true);
  localStorageMock.removeItem('vkat_profiles');

  const pMigrate = await storage.createProfile('Миша');
  await storage.migrateLegacyToProfile(pMigrate.id, stages, topics);

  const pMigrateRaw = localStorageMock.getItem('vkat_p:' + pMigrate.id);
  const pMigrateData = pMigrateRaw ? JSON.parse(pMigrateRaw) : null;
  check('Миграция перенесла completed задания', pMigrateData && pMigrateData.completed.includes('variables_task1'));
  check('Миграция перенесла черновики кода', pMigrateData && pMigrateData.drafts['variables_task1'] === 'a = 5');
  check('Миграция преобразовала позицию в семантическую', pMigrateData && pMigrateData.position.topicId === 'variables');
  check('Миграция создала резервную копию vkat_legacy_backup', Boolean(localStorageMock.getItem('vkat_legacy_backup')));
  check('Старые плоские ключи удалены после миграции', localStorageMock.getItem('vkat_completed_tasks') === null);

  // 10. Экспорт и импорт
  const exportBundle = await storage.exportProfile(pMigrate.id);
  check('exportProfile формирует бандл версии 1 с vkat_app_version', exportBundle && exportBundle.vkat_export_version === 1 && exportBundle.vkat_app_version === context.window.VKAT_VERSION && exportBundle.profile.name === 'Миша');

  const importedMeta = await storage.importProfile(JSON.stringify(exportBundle));
  check('importProfile создаёт новый профиль с постфиксом (импорт)', importedMeta && importedMeta.name === 'Миша (импорт)' && importedMeta.id !== pMigrate.id);

  const importedRaw = localStorageMock.getItem('vkat_p:' + importedMeta.id);
  const importedData = importedRaw ? JSON.parse(importedRaw) : null;
  check('Данные импортированного профиля восстановлены полностью', importedData && importedData.completed.includes('variables_task1'));

  // 11. Удаление профиля
  await storage.deleteProfile(importedMeta.id);
  check('deleteProfile удаляет метаданные профиля', !(await storage.listProfiles()).some(p => p.id === importedMeta.id));
  check('deleteProfile удаляет снимок данных vkat_p:<id>', localStorageMock.getItem('vkat_p:' + importedMeta.id) === null);

  // 12. resetAll
  await storage.resetAll();
  check('resetAll полностью очищает все профили', (await storage.listProfiles()).length === 0);
  check('resetAll очищает активный профиль сессии', storage.getActiveProfileSync() === null);

  // 13. Валидация изоляции VkatStorage (отсутствие прямого localStorage/sessionStorage в app/*.js)
  const appDir = path.join(__dirname, '..', 'app');
  const appFiles = fs.readdirSync(appDir).filter(f => f.endsWith('.js') && f !== 'storage.js');
  let directStorageLeaks = [];
  for (const file of appFiles) {
    const content = fs.readFileSync(path.join(appDir, file), 'utf8');
    const matches = content.match(/\b(localStorage|sessionStorage)\b/g);
    if (matches && matches.length > 0) {
      directStorageLeaks.push(`${file} (${matches.join(', ')})`);
    }
  }
  check('Изоляция VkatStorage: нет прямого localStorage/sessionStorage в app/*.js кроме storage.js', directStorageLeaks.length === 0, directStorageLeaks.join('; '));

  // 14. Валидация экранирования строк Python внутри template literal в app/checker.js
  const checkerFile = fs.readFileSync(path.join(appDir, 'checker.js'), 'utf8');
  const startMarker = 'await pyodide.runPythonAsync(`';
  const endMarker = '`);';
  const sIdx = checkerFile.indexOf(startMarker);
  let bootstrapSyntaxOk = false;
  if (sIdx !== -1) {
    const eIdx = checkerFile.indexOf(endMarker, sIdx);
    const lit = checkerFile.substring(sIdx + startMarker.length - 1, eIdx + 1);
    const evaluated = eval(lit);
    const pyLines = evaluated.split('\n');
    const brokenLine = pyLines.find(l => {
      const trimmed = l.trim();
      return (trimmed.startsWith("return '") && trimmed.length === 8) ||
             (trimmed.includes("[line + '") && !trimmed.includes("' for line"));
    });
    bootstrapSyntaxOk = !brokenLine;
  }
  check('Python bootstrap в checker.js не содержит незакрытых строковых литералов (экранирование \\n)', bootstrapSyntaxOk);

  // 15. Проверка логики быстрого гостевого входа при наличии профиля Гость с PIN
  const pGuestWithPin = await storage.createProfile('Гость', '4321');
  const allProfs = await storage.listProfiles();
  const safeGuest = allProfs.find(p => p.name.toLowerCase() === 'гость' && !p.pinHash);
  check('Быстрый старт: профиль Гость с PIN игнорируется при поиске гостевого профиля', safeGuest === undefined);
  await storage.deleteProfile(pGuestWithPin.id);

  // === Валидация модуля Справочника (Cheat Sheet) ===
  console.log('\n=== Валидация модуля Справочника (Cheat Sheet) ===');
  const csCtx = { window: {}, document: { readyState: 'loading', addEventListener: () => {} }, navigator: {} };
  vm.createContext(csCtx);
  const csContentFile = path.join(__dirname, '..', 'content', 'cheatsheet.js');
  const csEngineFile = path.join(__dirname, '..', 'app', 'cheatsheet.js');

  check('Файл content/cheatsheet.js существует', fs.existsSync(csContentFile));
  check('Файл app/cheatsheet.js существует', fs.existsSync(csEngineFile));

  vm.runInContext(fs.readFileSync(csContentFile, 'utf8'), csCtx);
  vm.runInContext(fs.readFileSync(csEngineFile, 'utf8'), csCtx);

  const csSections = csCtx.window.CHEATSHEET_SECTIONS;
  check('window.CHEATSHEET_SECTIONS экспортирован и является массивом', Array.isArray(csSections));
  check('window.CHEATSHEET_SECTIONS содержит ровно 7 разделов', csSections && csSections.length === 7);

  const requiredSectionIds = ['basics', 'control', 'strings', 'lists_tuples', 'dicts_sets', 'functions', 'errors'];
  const actualSectionIds = csSections ? csSections.map(s => s.id) : [];
  check('Все 7 обязательных разделов присутствуют с правильными ID', requiredSectionIds.every(id => actualSectionIds.includes(id)));

  const validCourseTopics = new Set(['variables', 'conditions', 'loops', 'functions', 'lists-dicts', 'strings', 'l1_functions', 'l1_dicts', 'l1_lists', 'l1_tuples', 'l1_strings', 'l1_loops_adv', 'l1_nested_structures']);
  const cardIds = new Set();
  let duplicateCardIds = [];
  let missingCardFields = [];
  let invalidTopics = [];
  let totalCards = 0;

  if (csSections) {
    csSections.forEach(sec => {
      if (Array.isArray(sec.items)) {
        sec.items.forEach(card => {
          totalCards++;
          if (cardIds.has(card.id)) duplicateCardIds.push(card.id);
          cardIds.add(card.id);

          ['id', 'title', 'syntax', 'desc', 'code'].forEach(field => {
            if (!card[field] || typeof card[field] !== 'string') missingCardFields.push(`${card.id}.${field}`);
          });
          if (!Array.isArray(card.tags) || card.tags.length === 0) missingCardFields.push(`${card.id}.tags`);

          if (Array.isArray(card.topics)) {
            card.topics.forEach(t => {
              if (!validCourseTopics.has(t)) invalidTopics.push(`${card.id}->${t}`);
            });
          }
        });
      }
    });
  }

  check(`Все карточки справочника имеют уникальные ID (${totalCards} карточек)`, duplicateCardIds.length === 0, duplicateCardIds.join(', '));
  check('Все карточки содержат обязательные поля (title, syntax, desc, code, tags)', missingCardFields.length === 0, missingCardFields.join(', '));
  check('Все темы карточек topics соответствуют реальным ID тем курса', invalidTopics.length === 0, invalidTopics.join(', '));

  const csEngine = csCtx.window.Cheatsheet;
  check('window.Cheatsheet экспортирован', csEngine && typeof csEngine === 'object');
  check('window.Cheatsheet содержит методы init, open, openForTopic, close, toggle, isOpen, copyCode',
    csEngine &&
    typeof csEngine.init === 'function' &&
    typeof csEngine.open === 'function' &&
    typeof csEngine.openForTopic === 'function' &&
    typeof csEngine.close === 'function' &&
    typeof csEngine.toggle === 'function' &&
    typeof csEngine.isOpen === 'function' &&
    typeof csEngine.copyCode === 'function'
  );

  console.log(`\nИТОГ: ${passed} пройдено, ${failed} ошибок.`);
  if (failed > 0) process.exit(1);
}

runStorageValidation().catch(err => {
  console.error('Непредвиденная ошибка в валидации хранилища:', err);
  process.exit(1);
});
