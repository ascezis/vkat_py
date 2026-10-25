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
loadScript('content/core/08-exceptions.js');
loadScript('content/core/11-code-style.js');
loadScript('content/cheatsheet.js');
loadScript('app/code-hints.js');
loadScript('app/version.js');
loadScript('app/storage.js');
loadScript('app/errors.js');
loadScript('dev/selftest/l1-functions.js');
loadScript('dev/selftest/l1-dicts.js');

const stages = context.window.COURSE_STAGES;
const topics = context.window.COURSE_TOPICS;
const errors = context.window.FriendlyErrors;
const selftest = context.window.COURSE_SELFTEST;
const cheatsheet = context.window.CHEATSHEET_SECTIONS;
const codeHints = context.window.CodeHints;

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

console.log('\n=== Валидация элементов темы l1_lists ===');
const l1list = topicMap.get('l1_lists');
check('Тема l1_lists содержит items[]', l1list && Array.isArray(l1list.items));
check('Тема l1_lists содержит ровно 24 элемента', l1list && l1list.items.length === 24);

const expectedListOrder = [
  'l1_list_t1', 'l1_list_t2', 'l1_list_p1', 'l1_list_t3', 'l1_list_t4',
  'l1_list_t5', 'l1_list_t6', 'l1_list_p2', 'l1_list_p3', 'l1_list_p4',
  'l1_list_p5', 'l1_list_p6', 'l1_list_c1', 'l1_list_c2', 'l1_list_c3',
  'l1_list_c4', 'l1_list_c5', 'l1_list_c6', 'l1_list_c7', 'l1_list_c8',
  'l1_list_c9', 'l1_list_f1', 'l1_list_c10', 'l1_list_c11'
];
expectedListOrder.forEach((id, idx) => {
  check(`[l1_lists] Элемент #${idx + 1} равен ${id}`, l1list && l1list.items[idx] && l1list.items[idx].id === id);
});

let reqCountList = 0, optCountList = 0, theoryCountList = 0;
if (l1list) {
  l1list.items.forEach(it => {
    const type = it.type || 'code';
    if (type === 'theory') theoryCountList++;
    else if (it.optional || it.tier === 'star') optCountList++;
    else reqCountList++;
  });
}
check('[l1_lists] Обязательных проверяемых элементов 16', reqCountList === 16);
check('[l1_lists] Необязательных (★) элементов 2', optCountList === 2);
check('[l1_lists] Элементов теории 6', theoryCountList === 6);

console.log('\n=== Валидация элементов темы l1_tuples ===');
const l1tup = topicMap.get('l1_tuples');
check('Тема l1_tuples содержит items[]', l1tup && Array.isArray(l1tup.items));
check('Тема l1_tuples содержит ровно 20 элементов', l1tup && l1tup.items.length === 20);

const expectedTupOrder = [
  'l1_tup_t1', 'l1_tup_q1', 'l1_tup_p1', 'l1_tup_t2', 'l1_tup_q2',
  'l1_tup_p2', 'l1_tup_f1', 'l1_tup_t3', 'l1_tup_q3', 'l1_tup_p3',
  'l1_tup_p4', 'l1_tup_c1', 'l1_tup_c2', 'l1_tup_c3', 'l1_tup_c4',
  'l1_tup_t4', 'l1_tup_q4', 'l1_tup_c5', 'l1_tup_c6', 'l1_tup_t5'
];
expectedTupOrder.forEach((id, idx) => {
  check(`[l1_tuples] Элемент #${idx + 1} равен ${id}`, l1tup && l1tup.items[idx] && l1tup.items[idx].id === id);
});

let reqCountTup = 0, optCountTup = 0, theoryCountTup = 0;
if (l1tup) {
  l1tup.items.forEach(it => {
    const type = it.type || 'code';
    if (type === 'theory') theoryCountTup++;
    else if (it.optional || it.tier === 'star') optCountTup++;
    else reqCountTup++;
  });
}
check('[l1_tuples] Обязательных проверяемых элементов 14', reqCountTup === 14);
check('[l1_tuples] Необязательных (★) элементов 1', optCountTup === 1);
check('[l1_tuples] Элементов теории 5', theoryCountTup === 5);

console.log('\n=== Валидация элементов темы l1_strings ===');
const l1str = topicMap.get('l1_strings');
check('Тема l1_strings содержит items[]', l1str && Array.isArray(l1str.items));
check('Тема l1_strings содержит ровно 25 элементов', l1str && l1str.items.length === 25);

const expectedStrOrder = [
  'l1_str_t1', 'l1_str_q1', 'l1_str_q2', 'l1_str_p1', 'l1_str_t2',
  'l1_str_p2', 'l1_str_t3', 'l1_str_q3', 'l1_str_p3', 'l1_str_c1',
  'l1_str_c2', 'l1_str_c3', 'l1_str_t4', 'l1_str_q4', 'l1_str_p4',
  'l1_str_c4', 'l1_str_c5', 'l1_str_t5', 'l1_str_q5', 'l1_str_p5',
  'l1_str_c6', 'l1_str_f1', 'l1_str_c7', 'l1_str_c8', 'l1_str_t6'
];
expectedStrOrder.forEach((id, idx) => {
  check(`[l1_strings] Элемент #${idx + 1} равен ${id}`, l1str && l1str.items[idx] && l1str.items[idx].id === id);
});

let reqCountStr = 0, optCountStr = 0, theoryCountStr = 0;
if (l1str) {
  l1str.items.forEach(it => {
    const type = it.type || 'code';
    if (type === 'theory') theoryCountStr++;
    else if (it.optional || it.tier === 'star') optCountStr++;
    else reqCountStr++;
  });
}
check('[l1_strings] Обязательных проверяемых элементов 17', reqCountStr === 17);
check('[l1_strings] Необязательных (★) элементов 2', optCountStr === 2);
check('[l1_strings] Элементов теории 6', theoryCountStr === 6);

console.log('\n=== Валидация элементов темы l1_loops_adv ===');
const l1loop = topicMap.get('l1_loops_adv');
check('Тема l1_loops_adv содержит items[]', l1loop && Array.isArray(l1loop.items));
check('Тема l1_loops_adv содержит ровно 20 элементов', l1loop && l1loop.items.length === 20);

const expectedLoopOrder = [
  'l1_loop_t1', 'l1_loop_t2', 'l1_loop_t3', 'l1_loop_t4', 'l1_loop_t5',
  'l1_loop_q1', 'l1_loop_q2', 'l1_loop_q3', 'l1_loop_p1', 'l1_loop_p2',
  'l1_loop_p3', 'l1_loop_f1', 'l1_loop_c1', 'l1_loop_c2', 'l1_loop_c3',
  'l1_loop_c4', 'l1_loop_c5', 'l1_loop_f2', 'l1_loop_c6', 'l1_loop_c7'
];
expectedLoopOrder.forEach((id, idx) => {
  check(`[l1_loops_adv] Элемент #${idx + 1} равен ${id}`, l1loop && l1loop.items[idx] && l1loop.items[idx].id === id);
});

let reqCountLoop = 0, optCountLoop = 0, theoryCountLoop = 0;
if (l1loop) {
  l1loop.items.forEach(it => {
    const type = it.type || 'code';
    if (type === 'theory') theoryCountLoop++;
    else if (it.optional || it.tier === 'star') optCountLoop++;
    else reqCountLoop++;
  });
}
check('[l1_loops_adv] Обязательных проверяемых элементов 13', reqCountLoop === 13);
check('[l1_loops_adv] Необязательных (★) элементов 2', optCountLoop === 2);
check('[l1_loops_adv] Элементов теории 5', theoryCountLoop === 5);

console.log('\n=== Валидация элементов темы l1_nested_structures ===');
const l1nest = topicMap.get('l1_nested_structures');
check('Тема l1_nested_structures содержит items[]', l1nest && Array.isArray(l1nest.items));
check('Тема l1_nested_structures содержит ровно 20 элементов', l1nest && l1nest.items.length === 20);

const expectedNestOrder = [
  'l1_nest_t1', 'l1_nest_t2', 'l1_nest_t3', 'l1_nest_t4', 'l1_nest_t5',
  'l1_nest_q1', 'l1_nest_q2', 'l1_nest_q3', 'l1_nest_p1', 'l1_nest_p2',
  'l1_nest_p3', 'l1_nest_f1', 'l1_nest_c1', 'l1_nest_c2', 'l1_nest_c3',
  'l1_nest_c4', 'l1_nest_c5', 'l1_nest_f2', 'l1_nest_c6', 'l1_nest_c7'
];
expectedNestOrder.forEach((id, idx) => {
  check(`[l1_nested_structures] Элемент #${idx + 1} равен ${id}`, l1nest && l1nest.items[idx] && l1nest.items[idx].id === id);
});

let reqCountNest = 0, optCountNest = 0, theoryCountNest = 0;
if (l1nest) {
  l1nest.items.forEach(it => {
    const type = it.type || 'code';
    if (type === 'theory') theoryCountNest++;
    else if (it.optional || it.tier === 'star') optCountNest++;
    else reqCountNest++;
  });
}
check('[l1_nested_structures] Обязательных проверяемых элементов 13', reqCountNest === 13);
check('[l1_nested_structures] Необязательных (★) элементов 2', optCountNest === 2);
check('[l1_nested_structures] Элементов теории 5', theoryCountNest === 5);

console.log('\n=== Валидация элементов темы l1_exceptions ===');
const l1exc = topicMap.get('l1_exceptions');
check('Тема l1_exceptions содержит items[]', l1exc && Array.isArray(l1exc.items));
check('Тема l1_exceptions содержит ровно 20 элементов', l1exc && l1exc.items.length === 20);

const expectedExcOrder = [
  'l1_exc_t1', 'l1_exc_q1', 'l1_exc_t2', 'l1_exc_q2', 'l1_exc_p1',
  'l1_exc_f1', 'l1_exc_c1', 'l1_exc_c2', 'l1_exc_c3', 'l1_exc_t3',
  'l1_exc_q3', 'l1_exc_p2', 'l1_exc_p3', 'l1_exc_c4', 'l1_exc_t4',
  'l1_exc_c5', 'l1_exc_f2', 'l1_exc_t5', 'l1_exc_c6', 'l1_exc_c7'
];

expectedExcOrder.forEach((id, idx) => {
  check(`[l1_exceptions] Элемент #${idx + 1} равен ${id}`, l1exc && l1exc.items[idx] && l1exc.items[idx].id === id);
});

let reqCountExc = 0;
let optCountExc = 0;
let theoryCountExc = 0;
if (l1exc) {
  l1exc.items.forEach(it => {
    const type = it.type || 'code';
    if (type === 'theory') theoryCountExc++;
    else if (it.optional || it.tier === 'star') optCountExc++;
    else reqCountExc++;
  });
}
check('[l1_exceptions] Обязательных проверяемых элементов 13', reqCountExc === 13);
check('[l1_exceptions] Необязательных (★) элементов 2', optCountExc === 2);
check('[l1_exceptions] Элементов теории 5', theoryCountExc === 5);

console.log('\n=== Валидация элементов темы l1_code_style ===');
const l1sty = topicMap.get('l1_code_style');
check('Тема l1_code_style содержит items[]', l1sty && Array.isArray(l1sty.items));
check('Тема l1_code_style содержит ровно 17 элементов', l1sty && l1sty.items.length === 17);

const expectedStyOrder = [
  'l1_sty_t1', 'l1_sty_q1', 'l1_sty_t2', 'l1_sty_q2', 'l1_sty_p1',
  'l1_sty_f1', 'l1_sty_t3', 'l1_sty_c1', 'l1_sty_c2', 'l1_sty_t4',
  'l1_sty_p2', 'l1_sty_p3', 'l1_sty_c3', 'l1_sty_f2', 'l1_sty_t5',
  'l1_sty_q3', 'l1_sty_c4'
];

expectedStyOrder.forEach((id, idx) => {
  check(`[l1_code_style] Элемент #${idx + 1} равен ${id}`, l1sty && l1sty.items[idx] && l1sty.items[idx].id === id);
});

let reqCountSty = 0;
let optCountSty = 0;
let theoryCountSty = 0;
if (l1sty) {
  l1sty.items.forEach(it => {
    const type = it.type || 'code';
    if (type === 'theory') theoryCountSty++;
    else if (it.optional || it.tier === 'star') optCountSty++;
    else reqCountSty++;
  });
}
check('[l1_code_style] Обязательных проверяемых элементов 11', reqCountSty === 11);
check('[l1_code_style] Необязательных (★) элементов 1', optCountSty === 1);
check('[l1_code_style] Элементов теории 5', theoryCountSty === 5);

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

console.log('\n=== Валидация базы конструкций и CodeHints ===');
check('CHEATSHEET_SECTIONS объявлен как массив', Array.isArray(cheatsheet));

const allCardIds = new Set();
let allCardsValid = true;
let invalidCardReason = '';
const triggerMap = new Map();
let triggersValid = true;
let invalidTriggerReason = '';

(cheatsheet || []).forEach(sec => {
  (sec.items || []).forEach(item => {
    if (!item.id || allCardIds.has(item.id)) {
      allCardsValid = false;
      invalidCardReason = `Дубликат или пустой ID: ${item.id}`;
    }
    allCardIds.add(item.id);

    const hasFields = item.title && typeof item.title === 'string' &&
      item.syntax && typeof item.syntax === 'string' &&
      item.desc && typeof item.desc === 'string' &&
      item.code && typeof item.code === 'string' &&
      Array.isArray(item.tags) && item.tags.length > 0;

    if (!hasFields) {
      allCardsValid = false;
      invalidCardReason = `Карточка ${item.id} содержит пустые обязательные поля`;
    }

    if (Array.isArray(item.triggers)) {
      item.triggers.forEach(tr => {
        const isValidFmt = /^\.[a-zA-Z_]\w*$/.test(tr) || /^[a-zA-Z_]\w*$/.test(tr);
        if (!isValidFmt) {
          triggersValid = false;
          invalidTriggerReason = `Неверный формат триггера '${tr}' в карточке ${item.id}`;
        }
        if (triggerMap.has(tr)) {
          triggersValid = false;
          invalidTriggerReason = `Коллизия триггера '${tr}' между ${triggerMap.get(tr)} и ${item.id}`;
        }
        triggerMap.set(tr, item.id);
      });
    }
  });
});

check('Все карточки имеют уникальные ID и обязательные поля (title, syntax, desc, code, tags)', allCardsValid, invalidCardReason);
check('Все триггеры имеют валидный формат (.method или bare token) и ведут строго на одну карточку', triggersValid, invalidTriggerReason);

check('CodeHints экспортирован и содержит методы register, attach, find, close',
  Boolean(
    codeHints &&
    typeof codeHints.register === 'function' &&
    typeof codeHints.attach === 'function' &&
    typeof codeHints.find === 'function' &&
    typeof codeHints.close === 'function'
  )
);

// Тесты CodeHints.find()
const resDot = codeHints.find('d.get("a")');
check('CodeHints.find: d.get("a") находит токен .get', Array.isArray(resDot) && resDot.length === 1 && resDot[0].token === '.get' && resDot[0].cardId === 'dict_get');

const resBareAssign = codeHints.find('get = 1');
check('CodeHints.find: get = 1 не находит .get', Array.isArray(resBareAssign) && resBareAssign.length === 0);

const resStr = codeHints.find('s = "range"');
check('CodeHints.find: слово "range" внутри строки не размечается', Array.isArray(resStr) && resStr.length === 0);

const resComment = codeHints.find('# for i in range(5):');
check('CodeHints.find: слово внутри комментария # range не размечается', Array.isArray(resComment) && resComment.length === 0);

const resForRange = codeHints.find('for i in range(5):');
const foundRange = Array.isArray(resForRange) && resForRange.some(x => x.token === 'range' && x.cardId === 'ctrl_range');
check('CodeHints.find: for i in range(5): находит токен range', foundRange);

let emptyNoCrash = true;
try {
  const rEmpty = codeHints.find('');
  const rNull = codeHints.find(null);
  const rUndef = codeHints.find(undefined);
  if (!Array.isArray(rEmpty) || !Array.isArray(rNull) || !Array.isArray(rUndef)) {
    emptyNoCrash = false;
  }
} catch (e) {
  emptyNoCrash = false;
}
check('CodeHints.find: пустой код и null/undefined не вызывают падения', emptyNoCrash);

// Общее правило сопоставления lookup() используется и в find() (текст), и в attach() (DOM)
check('CodeHints.lookup: ".get" после точки находит карточку, без точки не находит',
  codeHints.lookup('get', true) && codeHints.lookup('get', true).id === 'dict_get' && codeHints.lookup('get', false) === null);
check('CodeHints.lookup: ключевое слово/встроенная функция находится без точки, но не после точки',
  codeHints.lookup('range', false) !== null && codeHints.lookup('range', true) === null);
check('CodeHints.lookup: пустое и неизвестное имя возвращают null',
  codeHints.lookup('', false) === null && codeHints.lookup('no_such_name_xyz', false) === null);
{
  // find() и lookup() согласованы: каждый найденный токен действительно ведёт на свою карточку
  const code = 'd = {}\nx = d.get("a")\nfor i in range(3):\n    print(i)  # range\n';
  const found = codeHints.find(code);
  const consistent = found.length > 0 && found.every((r) => {
    const name = r.token.replace(/^\./, '');
    const c = codeHints.lookup(name, r.token.startsWith('.'));
    return c && c.id === r.cardId;
  });
  check('CodeHints.find согласован с lookup() на смешанном примере', consistent);
}

console.log('\n=== Валидация тестового покрытия COURSE_SELFTEST ===');
const selftestDir = path.join(__dirname, 'selftest');
const selftestFiles = fs.readdirSync(selftestDir).filter(f => f.endsWith('.js'));
context.window.COURSE_SELFTEST = {};
for (const file of selftestFiles) {
  const fileContent = fs.readFileSync(path.join(selftestDir, file), 'utf8');
  vm.runInContext(fileContent, context);
}
const selftestMap = context.window.COURSE_SELFTEST || {};
let missingSelftest = [];
const coreTopics = (context.window.COURSE_TOPICS || []).filter(t => t.id.startsWith('l1_'));
let totalCoreCodeTasks = 0;
for (const topic of coreTopics) {
  for (const item of (topic.items || [])) {
    if (item.type === 'code') {
      totalCoreCodeTasks++;
      const st = selftestMap[item.id];
      if (!st || !st.reference || !Array.isArray(st.wrong) || st.wrong.length === 0) {
        missingSelftest.push(item.id);
      }
    }
  }
}
check(`COURSE_SELFTEST покрывает 100% практических задач Core (${totalCoreCodeTasks} задач)`, missingSelftest.length === 0, missingSelftest.join(', '));
check(`Все эталоны COURSE_SELFTEST являются непустыми строками`, Object.values(selftestMap).every(st => typeof st.reference === 'string' && st.reference.trim().length > 0));

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

  console.log(`\nИТОГ: ${passed} пройдено, ${failed} ошибок.`);
  if (failed > 0) process.exit(1);
}

runStorageValidation().catch(err => {
  console.error('Непредвиденная ошибка в валидации хранилища:', err);
  process.exit(1);
});
