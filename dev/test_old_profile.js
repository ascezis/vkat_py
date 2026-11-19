/**
 * Тест обратной совместимости старого профиля.
 * Проверяет:
 * 1. Сохранение завершения базы (100% / isCompleted === true)
 * 2. Сохранение текущего шага и позиции
 * 3. Сохранение пройденных ID
 * 4. Сохранение черновиков
 * 5. Прямой вход в практикум для прошедших базу
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sessionStorageStore = new Map();
const localStorageStore = new Map();

const context = {
  console: console,
  TextEncoder: TextEncoder,
  Uint8Array: Uint8Array,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  localStorage: {
    getItem: (k) => localStorageStore.get(k) || null,
    setItem: (k, v) => localStorageStore.set(k, String(v)),
    removeItem: (k) => localStorageStore.delete(k),
    clear: () => localStorageStore.clear()
  },
  sessionStorage: {
    getItem: (k) => sessionStorageStore.get(k) || null,
    setItem: (k, v) => sessionStorageStore.set(k, String(v)),
    removeItem: (k) => sessionStorageStore.delete(k),
    clear: () => sessionStorageStore.clear()
  },
  crypto: globalThis.crypto,
  CustomEvent: CustomEvent
};
context.window = context;
context.globalThis = context;
context.document = {
  getElementById: () => null,
  addEventListener: () => {}
};

function load(rel) {
  const code = fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
  vm.runInNewContext(code, context, { filename: rel });
}

load('content/stages.js');
load('content/start/01-variables.js');
load('content/start/02-conditions.js');
load('content/start/03-loops.js');
load('content/start/04-functions.js');
load('content/start/05-lists-dicts.js');
load('content/start/06-strings.js');
load('content/core/01-functions.js');
load('content/core/02-dicts.js');
load('content/core/03-lists.js');
load('content/core/04-tuples.js');
load('content/core/05-strings-adv.js');
load('content/core/06-loops-adv.js');
load('content/core/07-nested-structures.js');
load('content/core/08-exceptions.js');
load('content/core/11-code-style.js');
load('content/practice/l2-algorithms.js');
load('content/practice/l2-io-input.js');
load('app/storage.js');

// Симулируем старый профиль ученика, который прошёл базу (start) ДО появления var_5 и l2_io_input
const startTopics = context.window.COURSE_STAGES.find(s => s.id === 'start').topics;
const allStartTopics = context.window.COURSE_TOPICS.filter(t => startTopics.includes(t.id));

// Собираем все старые ID базы (без var_5)
const oldCompletedIds = [];
allStartTopics.forEach(t => {
  const items = t.tasks || t.items || [];
  items.forEach(it => {
    if (it.id !== 'var_5') {
      oldCompletedIds.push(it.id);
    }
  });
});

const oldProfileData = {
  schema: 2,
  completed: oldCompletedIds,
  drafts: {
    'var_1': 'print("вкат в python")',
    'var_4': 'price_str = "120"\nprice = int(price_str) + 30\nprint(price)',
    'cond_1': '# мой черновик условий'
  },
  position: {
    topicId: 'strings',
    itemId: 'str_4'
  },
  updated: 1700000000000
};

// Записываем старый профиль в хранилище
const profileId = 'prof_old_student';
context.localStorage.setItem('vkat_profiles', JSON.stringify([
  { id: profileId, name: 'Старый Ученик', created: 1690000000000, lastActive: 1700000000000 }
]));
context.localStorage.setItem('vkat_p:' + profileId, JSON.stringify(oldProfileData));
context.sessionStorage.setItem('vkat_active_profile', profileId);

// Проверяем загрузку через VkatStorage
async function run() {
  const loaded = await context.window.VkatStorage.load();

  console.log('=== Проверка обратной совместимости старого профиля ===');

  // 1. Пройденные ID сохранены
  let idsOk = oldCompletedIds.every(id => loaded.completed.includes(id));
  console.log(idsOk ? '  ✓ Все старые пройденные ID сохранены' : '  × ОШИБКА: часть ID потеряна');

  // 2. Черновики сохранены
  let draftsOk = loaded.drafts['var_1'] === 'print("вкат в python")' &&
                 loaded.drafts['var_4'].includes('int(price_str)') &&
                 loaded.drafts['cond_1'] === '# мой черновик условий';
  console.log(draftsOk ? '  ✓ Все черновики задач сохранены без изменений' : '  × ОШИБКА: черновики повреждены');

  // 3. Текущий шаг сохранён
  let posOk = loaded.position.topicId === 'strings' && loaded.position.itemId === 'str_4';
  console.log(posOk ? '  ✓ Текущая позиция и шаг профиля сохранены' : '  × ОШИБКА: позиция сброшена');

  // 4. Проверка вычисления прогресса этапа start
  // Эмулируем логику app.js
  const completedSet = new Set(loaded.completed);

  function isGradable(item) {
    const type = item.type || 'code';
    return type === 'code' || type === 'predict' || type === 'quiz';
  }
  function isRequired(item) {
    return isGradable(item) && !item.optional && item.tier !== 'star';
  }

  let totalRequired = 0;
  let completedRequired = 0;

  allStartTopics.forEach(t => {
    const items = t.tasks || t.items || [];
    items.forEach(item => {
      if (isRequired(item)) {
        totalRequired++;
        if (completedSet.has(item.id)) {
          completedRequired++;
        }
      }
    });
  });

  const percent = totalRequired > 0 ? Math.round((completedRequired / totalRequired) * 100) : 0;
  const isBaseCompleted = totalRequired > 0 && completedRequired === totalRequired;

  console.log(`  Прогресс базы (start): ${completedRequired} из ${totalRequired} (${percent}%)`);
  console.log(isBaseCompleted ? '  ✓ Базовый этап остаётся 100% ЗАВЕРШЁННЫМ (isCompleted === true)' : '  × ОШИБКА: база потеряла статус завершённой');

  // 5. Прямой вход в Практикум
  const practiceTopics = context.window.COURSE_STAGES.find(s => s.id === 'practice').topics;
  console.log(`  Темы практикума: ${practiceTopics.join(', ')}`);
  const hasDirectPractice = practiceTopics.includes('l2_algorithms') && practiceTopics.includes('l2_io_input');
  console.log(hasDirectPractice ? '  ✓ Практикум доступен для прямого входа с новыми темами' : '  × ОШИБКА: практикум не готов');

  if (idsOk && draftsOk && posOk && isBaseCompleted && hasDirectPractice) {
    console.log('\nУСПЕХ: Все 5 критериев обратной совместимости старого профиля соблюдены!');
  } else {
    console.error('\nОШИБКА обратной совместимости!');
    process.exit(1);
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
