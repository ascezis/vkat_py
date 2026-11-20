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
  setInterval: setInterval,
  clearInterval: clearInterval,
  localStorage: localStorageMock,
  sessionStorage: sessionStorageMock,
  crypto: globalThis.crypto,
  CustomEvent: CustomEvent
};
context.window = context;
context.globalThis = context;

// Простейшая шина событий: нужно для проверки dispatchEvent('vkat-storage-quota')
const eventBus = new Map();
context.addEventListener = (type, fn) => {
  if (!eventBus.has(type)) eventBus.set(type, []);
  eventBus.get(type).push(fn);
};
context.removeEventListener = (type, fn) => {
  const arr = eventBus.get(type);
  if (arr) eventBus.set(type, arr.filter(f => f !== fn));
};
context.dispatchEvent = (ev) => {
  const arr = eventBus.get(ev && ev.type);
  if (arr) arr.slice().forEach(fn => { try { fn(ev); } catch (e) {} });
  return true;
};

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
loadScript('content/practice/l2-algorithms.js');
loadScript('content/practice/l2-io-input.js');
loadScript('content/cheatsheet.js');
loadScript('app/code-hints.js');
loadScript('app/version.js');
loadScript('app/storage.js');
loadScript('app/errors.js');
loadScript('app/checkers.js');
// Телеметрия CONNECT (секция 17 валидации)
loadScript('app/connect.js');
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
check('COURSE_STAGES объявлен и содержит 3 этапа', Array.isArray(stages) && stages.length === 3);
check('Этап start содержит 6 тем', stages[0].id === 'start' && stages[0].topics.length === 6);
check('Этап core содержит l1_functions и l1_dicts', stages[1].id === 'core' && stages[1].topics.includes('l1_functions') && stages[1].topics.includes('l1_dicts'));
check('Этап practice содержит l2_algorithms', stages[2].id === 'practice' && stages[2].topics.includes('l2_algorithms'));

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

console.log('\n=== Валидация элементов темы l2_algorithms (Практикум) ===');
const l2alg = topicMap.get('l2_algorithms');
check('Тема l2_algorithms содержит items[]', l2alg && Array.isArray(l2alg.items));
check('Тема l2_algorithms содержит 21 элемент', l2alg && l2alg.items.length === 21);

const expectedAlgOrder = [
  'l2_alg_t1', 'l2_alg_q1', 'l2_alg_p1', 'l2_alg_p2', 'l2_alg_c1',
  'l2_alg_c2', 'l2_alg_q2', 'l2_alg_p3', 'l2_alg_c3', 'l2_alg_c4',
  'l2_alg_p4', 'l2_alg_c5', 'l2_alg_c6', 'l2_alg_f1', 'l2_alg_f2',
  'l2_alg_t2', 'l2_alg_c7', 'l2_alg_c8', 'l2_alg_c9', 'l2_alg_c10',
  'l2_alg_t3'
];
expectedAlgOrder.forEach((id, idx) => {
  check(`[l2_algorithms] Элемент #${idx + 1} равен ${id}`, l2alg && l2alg.items[idx] && l2alg.items[idx].id === id);
});

let reqCountAlg = 0, optCountAlg = 0, theoryCountAlg = 0;
if (l2alg) {
  l2alg.items.forEach(it => {
    const type = it.type || 'code';
    if (type === 'theory') theoryCountAlg++;
    else if (it.optional || it.tier === 'star') optCountAlg++;
    else reqCountAlg++;
  });
}
check('[l2_algorithms] Обязательных проверяемых элементов 16', reqCountAlg === 16);
check('[l2_algorithms] Необязательных (★) элементов 2', optCountAlg === 2);
check('[l2_algorithms] Элементов теории 3', theoryCountAlg === 3);

console.log('\n=== Валидация элементов темы l2_io_input (Практикум) ===');
const l2io = topicMap.get('l2_io_input');
check('Тема l2_io_input содержит items[]', l2io && Array.isArray(l2io.items));
check('Тема l2_io_input содержит 10 элементов', l2io && l2io.items.length === 10);

const expectedIoOrder = [
  'l2_io_t1', 'l2_io_q1', 'l2_io_p1', 'l2_io_c1',
  'l2_io_t2', 'l2_io_q2', 'l2_io_p2', 'l2_io_c2',
  'l2_io_c3', 'l2_io_c4'
];
expectedIoOrder.forEach((id, idx) => {
  check(`[l2_io_input] Элемент #${idx + 1} равен ${id}`, l2io && l2io.items[idx] && l2io.items[idx].id === id);
});

let reqCountIo = 0, optCountIo = 0, theoryCountIo = 0;
if (l2io) {
  l2io.items.forEach(it => {
    const type = it.type || 'code';
    if (type === 'theory') theoryCountIo++;
    else if (it.optional || it.tier === 'star') optCountIo++;
    else reqCountIo++;
  });
}
check('[l2_io_input] Обязательных проверяемых элементов 7', reqCountIo === 7);
check('[l2_io_input] Необязательных (★) элементов 1', optCountIo === 1);
check('[l2_io_input] Элементов теории 2', theoryCountIo === 2);

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
const coreTopics = (context.window.COURSE_TOPICS || []).filter(t => t.id.startsWith('l1_') || t.id.startsWith('l2_'));
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
check(`COURSE_SELFTEST покрывает 100% практических задач Core и Practice (${totalCoreCodeTasks} задач)`, missingSelftest.length === 0, missingSelftest.join(', '));
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

  // 7.1 Переполнение квоты: приложение не падает, предупреждение ровно одно (TECH-DEBT P1)
  {
    const origSetItem = localStorageMock.setItem;
    const quotaError = new Error('The quota has been exceeded');
    quotaError.name = 'QuotaExceededError';
    let quotaEvents = 0;
    let lastDetail = null;
    const onQuota = (e) => { quotaEvents++; lastDetail = e && e.detail; };
    context.addEventListener('vkat-storage-quota', onQuota);
    localStorageMock.setItem = () => { throw quotaError; };
    let survived = true;
    try {
      await storage.save({ drafts: { 'l1_fn_c1': 'x = 1' } });
      // Повторная запись при той же переполненной квоте: второе событие не должно слаться
      await storage.save({ drafts: { 'l1_fn_c1': 'x = 2' } });
    } catch (e) {
      survived = false;
    }
    localStorageMock.setItem = origSetItem;
    context.removeEventListener('vkat-storage-quota', onQuota);
    check('QuotaExceededError: storage.save не роняет приложение', survived);
    check('QuotaExceededError: событие vkat-storage-quota шлётся ровно один раз с подсказкой', quotaEvents === 1 && Boolean(lastDetail && lastDetail.message));
  }

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

  // 14. Единый Python-бутстрап чекера (Sprint 3):
  //     index.html (script#vkat-checker-python) → воркер + in-thread fallback + run_tests.py
  const checkerFile = fs.readFileSync(path.join(appDir, 'checker.js'), 'utf8');
  const workerFile = fs.readFileSync(path.join(appDir, 'checker-worker.js'), 'utf8');
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const pyBlockMatch = indexHtml.match(/<script type="text\/x-python" id="vkat-checker-python">([\s\S]*?)<\/script>/);
  check('Единый бутстрап: index.html содержит script#vkat-checker-python', Boolean(pyBlockMatch));
  const pySrc = pyBlockMatch ? pyBlockMatch[1] : '';
  check('Единый бутстрап: определяет analyze_ast/_exec_user_code/_run_task_tests/_match_output',
    pySrc.includes('def analyze_ast') && pySrc.includes('def _exec_user_code') &&
    pySrc.includes('def _run_task_tests') && pySrc.includes('def _match_output'));
  check('Единый бутстрап: inline-копий Python в checker.js и checker-worker.js больше нет',
    !checkerFile.includes('def analyze_ast') && !checkerFile.includes('def _match_output') &&
    !workerFile.includes('def analyze_ast') && !workerFile.includes('def _match_output'));
  check('Единый бутстрап: checker.js читает index.html и передаёт бутстрап воркеру через INIT',
    checkerFile.includes('getCheckerPythonSource') &&
    checkerFile.includes('runPythonAsync(bootstrapSource)') &&
    checkerFile.includes('payload: { bootstrap: getCheckerPythonSource() }'));
  // Регрессия: в template literal браузер «съедал» одиночные \s и \( — регекс
  // ветки «функция не найдена» был невалидным (re.error в рантайме Pyodide).
  check('Единый бутстрап: регекс func-not-found содержит \\s*\\( (не съеден экранированием)',
    pySrc.includes('\\s*\\('));

  // 15. Проверка логики быстрого гостевого входа при наличии профиля Гость с PIN
  const pGuestWithPin = await storage.createProfile('Гость', '4321');
  const allProfs = await storage.listProfiles();
  const safeGuest = allProfs.find(p => p.name.toLowerCase() === 'гость' && !p.pinHash);
  check('Быстрый старт: профиль Гость с PIN игнорируется при поиске гостевого профиля', safeGuest === undefined);
  await storage.deleteProfile(pGuestWithPin.id);

  // 16. Проверка гибкой валидации ответов в predict (fuzzyPredictMatch)
  const predictFuzzy = context.window.VkatCheckers && context.window.VkatCheckers.fuzzyPredictMatch;
  check('VkatCheckers.fuzzyPredictMatch экспортирован', typeof predictFuzzy === 'function');
  if (typeof predictFuzzy === 'function') {
    check('fuzzyPredictMatch: снятие двойных кавычек вокруг строк ("nohtyp" -> nohtyp)', predictFuzzy('"nohtyp"', 'nohtyp').match === true);
    check('fuzzyPredictMatch: снятие одинарных кавычек вокруг строк (\'hello\' -> hello)', predictFuzzy("'hello, python'", 'hello, python').match === true);
    check('fuzzyPredictMatch: концевая точка игнорируется (hello, python. -> hello, python)', predictFuzzy('hello, python.', 'hello, python').match === true);
    check('fuzzyPredictMatch: запятая вместо пробела (10, 3 -> 10 3)', predictFuzzy('10, 3', '10 3').match === true);
    check('fuzzyPredictMatch: запятая без пробела (10,3 -> 10 3)', predictFuzzy('10,3', '10 3').match === true);
    check('fuzzyPredictMatch: регистр ключевых слов (true false none 0 -> True False None 0)', predictFuzzy('true false none 0', 'True False\nNone\n0').match === true);
    check('fuzzyPredictMatch: десятичная запятая при наличии float (3,33 -> 3.33)', predictFuzzy('3,33\n3 и 1', '3.33\n3 и 1').match === true);
    check('fuzzyPredictMatch: пробелы в списках ([20,30,40] -> [20, 30, 40])', predictFuzzy('[20,30,40] 40 [10,30,50]', '[20, 30, 40] 40 [10, 30, 50]').match === true);
    check('fuzzyPredictMatch: неверный ответ отклоняется', predictFuzzy('wrong_val', 'hello, python').match === false);
    check('fuzzyPredictMatch: пустой ввод отклоняется', predictFuzzy('', 'hello, python').match === false);
  }

  // 17. Валидация телеметрии CONNECT (VkatConnect: endpoint, события, outbox, снапшот)
  const connect = context.window.VkatConnect;
  check('VkatConnect экспортирован (sessionStart/trackCheck/trackStageComplete)',
        Boolean(connect) && typeof connect.sessionStart === 'function' &&
        typeof connect.trackCheck === 'function' && typeof connect.trackStageComplete === 'function');

  if (connect) {
    const fetchLog = [];
    let fetchMode = 'ok';
    context.fetch = (url, opts) => {
      fetchLog.push({ url, opts });
      if (fetchMode === 'fail') return Promise.reject(new Error('network down'));
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) });
    };

    // 17.1 Автономный no-op: без endpoint'а сессия не создаётся
    connect.sessionStart('prof0001', 'Тест');
    check('CONNECT: без endpoint и без /app/ пути — no-op (офлайн-режим)', connect.isEnabled() === false);

    // 17.2 Явный endpoint из VKAT_CONNECT_ENDPOINT
    context.VKAT_CONNECT_ENDPOINT = 'http://teacher-lan:8087';
    connect.sessionStart('prof0001', 'Тест');
    check('CONNECT: sessionStart с явным endpoint включает телеметрию', connect.isEnabled() === true);
    check('CONNECT: resolveEndpoint нормализует базу (без /report)',
          connect.resolveEndpoint() === 'http://teacher-lan:8087');
    const hb = fetchLog.find(f => f.url === 'http://teacher-lan:8087/event');
    check('CONNECT: стартовый пульс ушёл на /event', Boolean(hb));
    const hbBody = hb ? JSON.parse(hb.opts.body) : {};
    check('CONNECT: пульс несёт kind/profileId/name/ts/timeSpentSeconds',
          hbBody.kind === 'heartbeat' && hbBody.profileId === 'prof0001' &&
          hbBody.name === 'Тест' && typeof hbBody.ts === 'number' &&
          typeof hbBody.timeSpentSeconds === 'number');

    // 17.3 Попытка code-задания: attempt-событие с классом ошибки и кодом
    const taskCode = { id: 'l1_fn_c1', type: 'code', title: 'Привет, функция' };
    connect.trackCheck(taskCode, {
      passed: false,
      errorText: 'Traceback (most recent call last):\nNameError: name \'x\' is not defined',
      code: 'print(x)'
    });
    const attempt1 = fetchLog.filter(f => f.url.endsWith('/event'))
      .map(f => JSON.parse(f.opts.body)).find(b => b.kind === 'attempt');
    check('CONNECT: attempt содержит passed=false, errorClass=NameError, finalCode, completed=false',
          Boolean(attempt1) && attempt1.passed === false && attempt1.errorClass === 'NameError' &&
          attempt1.finalCode === 'print(x)' && attempt1.completed === false);

    // 17.4 Успешная попытка: completed=true
    connect.trackCheck(taskCode, { passed: true, errorText: '', code: 'print("hi")' });
    const attempt2 = fetchLog.filter(f => f.url.endsWith('/event'))
      .map(f => JSON.parse(f.opts.body)).filter(b => b.kind === 'attempt')[1];
    check('CONNECT: успешная попытка помечает completed', attempt2 && attempt2.passed === true && attempt2.completed === true);

    // 17.5 Сбой сети уводит событие в outbox (через VkatStorage)
    fetchMode = 'fail';
    connect.trackCheck(taskCode, { passed: false, errorText: 'TypeError: bad', code: 'print(1)' });
    await new Promise(r => setTimeout(r, 30)); // enqueue — микрозадача, даём ей отработать
    const outboxAfterFail = context.window.VkatStorage.getOutbox();
    check('CONNECT: сбой сети кладёт событие в outbox', outboxAfterFail.length === 1 &&
          outboxAfterFail[0].data.kind === 'attempt');

    // 17.6 Восстановление сети: снапшот уходит на /report, outbox досылается
    fetchMode = 'ok';
    connect.trackStageComplete('core');
    const snap = fetchLog.find(f => f.url === 'http://teacher-lan:8087/report');
    check('CONNECT: trackStageComplete отправляет снапшот на /report', Boolean(snap));
    const snapBody = snap ? JSON.parse(snap.opts.body) : {};
    check('CONNECT: снапшот по схеме спеки (protocol/student/session/solutions)',
          snapBody.protocol === 'vkat-connect/v1' && snapBody.student.profileId === 'prof0001' &&
          snapBody.session.stageId === 'core' && Array.isArray(snapBody.solutions) &&
          snapBody.solutions.some(s => s.itemId === 'l1_fn_c1' && s.attempts === 3 &&
          Array.isArray(s.errorsEncountered) && s.errorsEncountered.includes('NameError')));
    await new Promise(r => setTimeout(r, 60));
    check('CONNECT: outbox дослан после восстановления сети',
          context.window.VkatStorage.getOutbox().length === 0);

    // 17.7 Авто-детект консоли: страница отдана под /app/ → same-origin endpoint
    connect.sessionEnd();
    delete context.VKAT_CONNECT_ENDPOINT;
    context.location = { pathname: '/app/', origin: 'http://192.168.1.50:8087' };
    connect.sessionStart('prof0002', 'Вася');
    check('CONNECT: авто-детект консоли по пути /app/ (same-origin)',
          connect.isEnabled() === true && fetchLog.some(f => f.url === 'http://192.168.1.50:8087/event'));
    connect.sessionEnd();

    // 17.8 Настройка connect_endpoint через VkatStorage (низший приоритет)
    delete context.location;
    check('CONNECT: после sessionEnd телеметрия выключена', connect.isEnabled() === false);
    context.window.VkatStorage.setSetting('connect_endpoint', 'http://fallback:8090/');
    check('CONNECT: resolveEndpoint читает настройку VkatStorage и нормализует слэш',
          connect.resolveEndpoint() === 'http://fallback:8090');
    context.window.VkatStorage.setSetting('connect_endpoint', '');

    // 18. Валидация фикса Issue #14 (синхронизация подсветки и переноса строки в редакторе)
    const appFile = fs.readFileSync(path.join(appDir, 'app.js'), 'utf8');
    const onEditorChangeHasHighlighter = /function onEditorChange\(\)\s*\{[\s\S]*?dom\.highlighter\.update\(\)/.test(appFile);
    check('Issue #14: onEditorChange() синхронизирует dom.highlighter', onEditorChangeHasHighlighter);

    const enterDispatchesInput = /e\.key === 'Enter'[\s\S]*?dispatchEvent\(new Event\('input'/.test(appFile);
    check('Issue #14: перенос строки (Enter) генерирует событие input и обновляет подсветку', enterDispatchesInput);

    // 19. Валидация Web Worker Sandbox ("Антифриз", Issue #2)
    // workerFile и pySrc объявлены в секции 14 (единый бутстрап)
    check('Issue #2 Web Worker: файл app/checker-worker.js существует', workerFile.length > 0);

    const workerHandlers = workerFile.includes("'INIT'") && workerFile.includes("'CHECK'") && workerFile.includes("'RUN'");
    check('Issue #2 Web Worker: checker-worker.js обрабатывает сообщения INIT, CHECK, RUN', workerHandlers);

    const hasWorkerBridge = /class PyodideWorkerBridge/.test(checkerFile);
    check('Issue #2 Web Worker: checker.js реализует класс PyodideWorkerBridge', hasWorkerBridge);

    const hasWatchdogTimeout = /DEFAULT_TIMEOUT_MS\s*=\s*7000/.test(checkerFile) || /timeoutMs\s*=\s*7000/.test(checkerFile);
    check('Issue #2 Web Worker: сторожевой таймер (watchdog timeout) настроен на 7000 мс', hasWatchdogTimeout);

    const hasWorkerFallback = typeof checkerFile === 'string' &&
      checkerFile.includes('fallbackCheckSolution') &&
      checkerFile.includes('fallbackRunCode') &&
      checkerFile.includes('fallbackInitPyodideInThread');
    check('Issue #2 Web Worker: checker.js содержит in-thread fallback для окружений без Worker', hasWorkerFallback);

    // 19.1 Харднинг «Антифриза» (P1/P2 фиксы)
    check('Антифриз: краш воркера не отключает песочницу навсегда (счётчик крашей + respawn)',
      checkerFile.includes('MAX_CONSECUTIVE_CRASHES') && checkerFile.includes('this._crashCount'));

    check('Антифриз: сбой воркера после взятия payload НЕ перезапускает код в главном потоке',
      checkerFile.includes('sandboxFailureResult') &&
      checkerFile.includes('return sandboxFailureResult(err);') &&
      checkerFile.includes('res = sandboxFailureResult(err);'));

    check('Антифриз: ensureReady ограничен JS-таймаутом INIT (90с)',
      checkerFile.includes('INIT_TIMEOUT_MS = 90000'));

    check('Антифриз: класс моста без ES2022 static-поля (совместимость со старыми браузерами)',
      !/static\s+DEFAULT_TIMEOUT_MS/.test(checkerFile) &&
      checkerFile.includes('this.DEFAULT_TIMEOUT_MS = 7000'));

    check('Антифриз: loop-guard 1M итераций срабатывает раньше 7s watchdog',
      pySrc.includes('max_iters=1000000') && !pySrc.includes('max_iters=5000000'));

    const baseExceptionCount = (pySrc.match(/except BaseException/g) || []).length;
    check('Антифриз: SystemExit ловится как BaseException (боевой бутстрап)',
      baseExceptionCount >= 2);

    check('Антифриз: breakpoint и help убраны из _SAFE_BUILTINS',
      !pySrc.includes("'breakpoint'") && !pySrc.includes("'help'"));
  }

  // 20. Контракты схем для IDE (jsconfig.json + docs/types.d.ts, TECH-DEBT P2)
  {
    const fsRoot = path.join(__dirname, '..');
    const jsconfigPath = path.join(fsRoot, 'jsconfig.json');
    const typesPath = path.join(fsRoot, 'docs', 'types.d.ts');
    let jsconfigOk = false;
    let typesOk = false;
    try {
      const cfg = JSON.parse(fs.readFileSync(jsconfigPath, 'utf8'));
      jsconfigOk = cfg.compilerOptions && cfg.compilerOptions.noEmit === true;
    } catch (e) {}
    try {
      const types = fs.readFileSync(typesPath, 'utf8');
      typesOk = types.includes('interface AstRequirements') &&
                types.includes('interface TaskItem') &&
                types.includes('interface TaskTest') &&
                types.includes('interface ProfileData');
    } catch (e) {}
    check('jsconfig.json существует и noEmit (zero-build)', jsconfigOk);
    check('docs/types.d.ts объявляет контракты AstRequirements/TaskItem/TaskTest/ProfileData', typesOk);
  }

  // 20.1 Мягкий режим первого задания (onboarding)
  {
    const startTopic = topicMap.get('variables');
    // Стартовые темы хранят элементы в legacy-ключе tasks, а не items
    const var1 = startTopic && (startTopic.items || startTopic.tasks || []).find(it => it.id === 'var_1');
    check('Первое задание var_1 имеет lenientOutput: true (не наказывает за неверную фразу)',
      Boolean(var1 && var1.lenientOutput === true));
  }

  await runBridgeValidation();

  // ── 22. Модуль пет-проекта «Игра «Жизнь» (Game of Life) ────────────────────
  console.log('\n=== Валидация модуля пет-проекта Life ===');

  const lifePath = path.join(__dirname, '..', 'content', 'projects', 'life', 'tasks.js');
  check('Life: файл content/projects/life/tasks.js существует на диске', fs.existsSync(lifePath));

  let LM = null;
  if (fs.existsSync(lifePath)) {
    try {
      loadScript('content/projects/life/tasks.js');
      LM = context.LIFE_MODULE;
    } catch (e) {
      console.error('  Life: tasks.js выбросил исключение при загрузке:', e.message);
    }
  }
  check('Life: window.LIFE_MODULE успешно экспортирован', Boolean(LM) && typeof LM === 'object');

  const lifeSteps = LM && Array.isArray(LM.steps) ? LM.steps : [];
  check('Life: корректный ID, экран и заголовок модуля', Boolean(LM && LM.id === 'life' && LM.title && LM.description && LM.screen === 'life'));
  check('Life: модуль содержит ровно 4 шага', lifeSteps.length === 4);

  const lifeStepShape = lifeSteps.every(s =>
    s.id && s.title && s.narrative && s.taskHtml && s.glyph && s.worldMode &&
    s.initialCode && Array.isArray(s.tests) && s.tests.length > 0
  );
  check('Life: каждый шаг содержит id/title/narrative/taskHtml/glyph/worldMode/initialCode и непустой tests', lifeStepShape);

  check('Life: id шагов уникальны', new Set(lifeSteps.map(s => s.id)).size === lifeSteps.length);

  const worldModesOk = lifeSteps.length === 4 &&
    lifeSteps[0].worldMode === 'frozen' && lifeSteps[1].worldMode === 'chaos' &&
    lifeSteps[2].worldMode === 'chaos' && lifeSteps[3].worldMode === 'sandbox';
  check('Life: worldMode шагов образуют прогрессию «Сломанного мира» (frozen→chaos→chaos→sandbox)', worldModesOk);

  const testsTaskTestFormat = lifeSteps.every(s => s.tests.every(t =>
    typeof t.call === 'string' && t.call.length > 0 && 'returns' in t && !/assert/.test(t.call)
  ));
  check('Life: все тесты в контракте TaskTest (call + returns, без assert-кода)', testsTaskTestFormat);

  // Поведенческая проверка содержимого: эталонное решение должно проходить
  // ВСЕ тесты всех шагов (ловит опечатки в ожидаемых значениях контента).
  // call-выражения в проде исполняются в Python, поэтому шимим Python-литералы.
  if (testsTaskTestFormat) {
    try {
      vm.runInContext(`
        var True = true; var False = false;
        function is_alive(grid, x, y) {
          if (x < 0 || y < 0 || y >= grid.length || x >= grid[0].length) return false;
          return grid[y][x] === 1;
        }
        function count_neighbors(grid, x, y) {
          var n = 0;
          for (var dy = -1; dy <= 1; dy++) {
            for (var dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              var nx = x + dx, ny = y + dy;
              if (ny >= 0 && ny < grid.length && nx >= 0 && nx < grid[0].length && grid[ny][nx] === 1) n++;
            }
          }
          return n;
        }
        function should_live(alive, n) { return n === 3 || (Boolean(alive) && n === 2); }
        function step_rules(alive, n, birth, survival) {
          return (!alive && birth.indexOf(n) !== -1) || (Boolean(alive) && survival.indexOf(n) !== -1);
        }
      `, context);

      let lifeBehaviorOk = true;
      let lifeBehaviorDetail = '';
      let lifeTestCount = 0;
      for (const s of lifeSteps) {
        for (const t of s.tests) {
          lifeTestCount++;
          try {
            const actual = vm.runInContext('(' + t.call + ')', context);
            if (actual !== t.returns) {
              lifeBehaviorOk = false;
              lifeBehaviorDetail = s.id + ': ' + t.call + ' → ' + actual + ' (ожидалось ' + t.returns + ')';
            }
          } catch (e) {
            lifeBehaviorOk = false;
            lifeBehaviorDetail = s.id + ': ' + t.call + ' → ' + e.message;
          }
        }
      }
      check(`Life: эталонное решение проходит все ${lifeTestCount} тестов шагов (поведение = ожиданиям)`, lifeBehaviorOk, lifeBehaviorDetail);
    } catch (e) {
      check('Life: поведенческая проверка эталона выполнима', false, e.message);
    }
  }

  const lifeIndexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  check('Life: index.html содержит контейнер <div id="screen-life">', lifeIndexHtml.includes('id="screen-life"'));
  check('Life: index.html содержит холст <canvas id="life-main-canvas">', lifeIndexHtml.includes('id="life-main-canvas"'));
  check('Life: index.html содержит карточку пет-проекта life-start-card', lifeIndexHtml.includes('id="life-start-card"'));
  check('Life: index.html содержит Python-скаффолд <script id="vkat-life-scaffold">', lifeIndexHtml.includes('id="vkat-life-scaffold"'));
  check('Life: index.html подключает tasks.js и life-renderer.js',
    lifeIndexHtml.includes('content/projects/life/tasks.js') && lifeIndexHtml.includes('app/life-renderer.js'));
  check('Life: скаффолд содержит __STUDENT_CODE__, simulate_step и get_grid_json',
    lifeIndexHtml.includes('__STUDENT_CODE__') && lifeIndexHtml.includes('def simulate_step(grid)') && lifeIndexHtml.includes('def get_grid_json(grid)'));

  // Витрина пет-проектов: карусель на старте + hero-карточка на своём экране
  const projectsAppJs = fs.readFileSync(path.join(__dirname, '..', 'app', 'app.js'), 'utf8');
  check('Projects: index.html содержит витрину <div id="screen-projects">', lifeIndexHtml.includes('id="screen-projects"'));
  check('Projects: стартовая карусель содержит стрелки btn-modules-prev/next',
    lifeIndexHtml.includes('id="btn-modules-prev"') && lifeIndexHtml.includes('id="btn-modules-next"'));
  check('Projects: hero-карточки life-start-card и pet-start-card живут на витрине между start и life',
    lifeIndexHtml.indexOf('id="screen-start"') < lifeIndexHtml.indexOf('id="pet-start-card"') &&
    lifeIndexHtml.indexOf('id="pet-start-card"') < lifeIndexHtml.indexOf('id="life-start-card"') &&
    lifeIndexHtml.indexOf('id="life-start-card"') < lifeIndexHtml.indexOf('id="screen-life"'));
  check('Projects: экраны витрины и терариума в allowlist deep-link app.js',
    /'start', 'lesson', 'projects', 'pet', 'life'/.test(projectsAppJs));

  const lifeStylesCss = fs.readFileSync(path.join(__dirname, '..', 'app', 'styles.css'), 'utf8');
  check('Life: styles.css содержит селекторы .life-canvas-container и .life-hud',
    lifeStylesCss.includes('.life-canvas-container') && lifeStylesCss.includes('.life-hud'));

  const lifeGlyphsCode = fs.readFileSync(path.join(__dirname, '..', 'app', 'glyphs.js'), 'utf8');
  check('Life: glyphs.js содержит регистрацию схем lifeNeighbors, lifeRules, lifePatterns',
    lifeGlyphsCode.includes('lifeNeighbors') && lifeGlyphsCode.includes('lifeRules') && lifeGlyphsCode.includes('lifePatterns'));

  const lifeRendererPath = path.join(__dirname, '..', 'app', 'life-renderer.js');
  check('Life: файл app/life-renderer.js существует на диске', fs.existsSync(lifeRendererPath));

  const lifeRendererCode = fs.existsSync(lifeRendererPath) ? fs.readFileSync(lifeRendererPath, 'utf8') : '';
  check('Life: life-renderer.js не содержит запрещённых npm/require импортов',
    !lifeRendererCode.includes('require(') && !lifeRendererCode.includes('import '));
  check('Life: модуль Life не обращается к localStorage/sessionStorage напрямую',
    !lifeRendererCode.includes('localStorage') && !lifeRendererCode.includes('sessionStorage'));

  // ── 23. Модуль пет-проекта «Тамагочи» (терариум Байта) ──────────────────────
  console.log('\n=== Валидация модуля пет-проекта Pet ===');

  const petPath = path.join(__dirname, '..', 'content', 'projects', 'pet', 'tasks.js');
  check('Pet: файл content/projects/pet/tasks.js существует на диске', fs.existsSync(petPath));

  let PM = null;
  if (fs.existsSync(petPath)) {
    try {
      loadScript('content/projects/pet/tasks.js');
      PM = context.PET_MODULE;
    } catch (e) {
      console.error('  Pet: tasks.js выбросил исключение при загрузке:', e.message);
    }
  }
  check('Pet: window.PET_MODULE успешно экспортирован', Boolean(PM) && typeof PM === 'object');

  const petSteps = PM && Array.isArray(PM.steps) ? PM.steps : [];
  check('Pet: корректный ID, экран и заголовок модуля', Boolean(PM && PM.id === 'pet' && PM.title && PM.description && PM.screen === 'pet'));
  check('Pet: модуль содержит ровно 4 шага', petSteps.length === 4);

  const petStepShape = petSteps.every(s =>
    s.id && s.title && s.narrative && s.taskHtml && s.glyph && s.worldMode &&
    s.initialCode && Array.isArray(s.tests) && s.tests.length > 0
  );
  check('Pet: каждый шаг содержит id/title/narrative/taskHtml/glyph/worldMode/initialCode и непустой tests', petStepShape);

  check('Pet: id шагов уникальны', new Set(petSteps.map(s => s.id)).size === petSteps.length);

  const petWorldModesOk = petSteps.length === 4 &&
    petSteps[0].worldMode === 'egg' && petSteps[1].worldMode === 'born' &&
    petSteps[2].worldMode === 'playful' && petSteps[3].worldMode === 'autonomous';
  check('Pet: worldMode шагов образуют прогрессию терариума (egg→born→playful→autonomous)', petWorldModesOk);

  const petTestsFormat = petSteps.every(s => s.tests.every(t =>
    typeof t.call === 'string' && t.call.length > 0 && 'returns' in t && !/assert/.test(t.call)
  ));
  check('Pet: все тесты в контракте TaskTest (call + returns, без assert-кода)', petTestsFormat);

  if (petTestsFormat) {
    try {
      vm.runInContext(`
        var True = true; var False = false;
        function len(x) { return (x && x.length !== undefined) ? x.length : Object.keys(x).length; }
        function new_pet(name) {
          return {'имя': name, 'сытость': 50, 'настроение': 50, 'энергия': 50};
        }
        function feed(p) {
          p['сытость'] = Math.min(p['сытость'] + 25, 100);
          return p['сытость'];
        }
        function play(p) {
          if (p['энергия'] < 15) return false;
          p['настроение'] = Math.min(p['настроение'] + 20, 100);
          p['энергия'] = Math.max(p['энергия'] - 15, 0);
          return true;
        }
        function tick(p, hour) {
          if (hour < 7 || hour >= 23) {
            p['энергия'] = Math.min(p['энергия'] + 15, 100);
            return 'ночь';
          } else {
            p['сытость'] = Math.max(p['сытость'] - 5, 0);
            return 'день';
          }
        }
      `, context);

      let petBehaviorOk = true;
      let petBehaviorDetail = '';
      let petTestCount = 0;
      for (const s of petSteps) {
        for (const t of s.tests) {
          petTestCount++;
          try {
            // Python-only lambda checks the return value and the mutated dictionary.
            const mutationCall = t.call.match(/^\(lambda pet: \[(\w+)\(pet(?:, (\d+))?\), pet\]\)\((\{.*\})\)$/);
            const jsCall = mutationCall
              ? `((pet) => [${mutationCall[1]}(pet${mutationCall[2] ? ', ' + mutationCall[2] : ''}), pet])(${mutationCall[3]})`
              : '(' + t.call + ')';
            const actual = vm.runInContext(jsCall, context);
            const matches = Array.isArray(t.returns)
              ? JSON.stringify(actual) === JSON.stringify(t.returns)
              : actual === t.returns;
            if (!matches) {
              petBehaviorOk = false;
              petBehaviorDetail = s.id + ': ' + t.call + ' → ' + actual + ' (ожидалось ' + t.returns + ')';
            }
          } catch (e) {
            petBehaviorOk = false;
            petBehaviorDetail = s.id + ': ' + t.call + ' → ' + e.message;
          }
        }
      }
      check(`Pet: эталонное решение проходит все ${petTestCount} тестов шагов (поведение = ожиданиям)`, petBehaviorOk, petBehaviorDetail);
    } catch (e) {
      check('Pet: поведенческая проверка эталона выполнима', false, e.message);
    }
  }

  check('Pet: index.html содержит контейнер <div id="screen-pet">', lifeIndexHtml.includes('id="screen-pet"'));
  check('Pet: index.html содержит карточку пет-проекта pet-start-card', lifeIndexHtml.includes('id="pet-start-card"'));
  check('Pet: index.html содержит Python-скаффолд <script id="vkat-pet-scaffold">',
    lifeIndexHtml.includes('id="vkat-pet-scaffold"'));
  check('Pet: скаффолд содержит __STUDENT_CODE__ и pet_state_json',
    lifeIndexHtml.includes('def pet_state_json(pet)') &&
    lifeIndexHtml.indexOf('__STUDENT_CODE__', lifeIndexHtml.indexOf('id="vkat-pet-scaffold"')) !== -1);
  check('Pet: index.html подключает tasks.js, pet-art.css/js и pet-renderer.js',
    lifeIndexHtml.includes('content/projects/pet/tasks.js') &&
    lifeIndexHtml.includes('app/pet-art.css') &&
    lifeIndexHtml.includes('app/pet-art.js') &&
    lifeIndexHtml.includes('app/pet-renderer.js'));
  check('Pet: в index.html есть редактор терариума и строки ввода (pet-code-editor, pet-stdin-input)',
    lifeIndexHtml.includes('id="pet-code-editor"') && lifeIndexHtml.includes('id="pet-stdin-input"'));
  check('Pet: в app.js есть ветка showScreen(pet) и проводка VkatPet',
    projectsAppJs.includes("screen === 'pet'") && projectsAppJs.includes('window.VkatPet'));

  const petStylesCss = fs.readFileSync(path.join(__dirname, '..', 'app', 'styles.css'), 'utf8');
  check('Pet: styles.css содержит селекторы .pet-stage-host и .pet-stdin-input',
    petStylesCss.includes('.pet-stage-host') && petStylesCss.includes('.pet-stdin-input'));

  const petGlyphsCode = fs.readFileSync(path.join(__dirname, '..', 'app', 'glyphs.js'), 'utf8');
  check('Pet: glyphs.js содержит регистрацию схем petHatch, petCare, petDay',
    petGlyphsCode.includes('petHatch') && petGlyphsCode.includes('petCare') && petGlyphsCode.includes('petDay'));

  const petArtPath = path.join(__dirname, '..', 'app', 'pet-art.js');
  check('Pet: файл app/pet-art.js существует на диске', fs.existsSync(petArtPath));
  const petArtCode = fs.existsSync(petArtPath) ? fs.readFileSync(petArtPath, 'utf8') : '';
  check('Pet: pet-art.js экспортирует PetArt (render/pose/cracks/setStats/expression)',
    petArtCode.includes('window.PetArt') && petArtCode.includes('pose') &&
    petArtCode.includes('cracks') && petArtCode.includes('setStats') && petArtCode.includes('expression'));
  check('Pet: pet-art.js не содержит запрещённых npm/require импортов и localStorage',
    !petArtCode.includes('require(') && !petArtCode.includes('import ') &&
    !petArtCode.includes('localStorage') && !petArtCode.includes('sessionStorage'));

  const petRendererPath = path.join(__dirname, '..', 'app', 'pet-renderer.js');
  check('Pet: файл app/pet-renderer.js существует на диске', fs.existsSync(petRendererPath));
  const petRendererCode = fs.existsSync(petRendererPath) ? fs.readFileSync(petRendererPath, 'utf8') : '';
  check('Pet: pet-renderer.js экспортирует VkatPet (init/enter/leave/renderCard)',
    petRendererCode.includes('window.VkatPet') && petRendererCode.includes('renderCard'));
  check('Pet: pet-renderer.js не содержит запрещённых npm/require импортов и localStorage',
    !petRendererCode.includes('require(') && !petRendererCode.includes('import ') &&
    !petRendererCode.includes('localStorage') && !petRendererCode.includes('sessionStorage'));

  console.log(`\nИТОГ: ${passed} пройдено, ${failed} ошибок.`);
  if (failed > 0) process.exit(1);
}

// ── 21. Поведенческие тесты моста «Антифриз» (PyodideWorkerBridge) ──────────
// checker.js загружается в изолированный vm-контекст с MockWorker: проверяем
// РЕАЛЬНОЕ поведение моста (INIT/CHECK, CHECK_ERROR, краши, таймауты),
// а не только наличие строк в файле.
async function runBridgeValidation() {
  console.log('\n=== Поведенческие тесты моста «Антифриз» (MockWorker) ===');

  class MockWorker {
    constructor(url) {
      this.url = url;
      this.onmessage = null;
      this.onerror = null;
      this.terminated = false;
      this.received = [];
      MockWorker.instances.push(this);
    }
    postMessage(msg) {
      this.received.push(msg);
      const respond = MockWorker.respond;
      if (respond) Promise.resolve().then(() => respond(msg, this));
    }
    terminate() { this.terminated = true; }
    emitFromWorker(data) { if (this.onmessage) this.onmessage({ data }); }
    crash(err) { if (this.onerror) this.onerror(err); }
  }
  MockWorker.instances = [];
  MockWorker.respond = null;

  const sandbox = {
    console: console,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout
  };
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  sandbox.document = { currentScript: null, querySelector: () => null };
  sandbox.Worker = MockWorker;
  vm.createContext(sandbox);

  const checkerSrc = fs.readFileSync(path.join(__dirname, '..', 'app', 'checker.js'), 'utf8');
  vm.runInContext(checkerSrc, sandbox, { filename: 'app/checker.js' });

  const CC = sandbox.window.CodeChecker;
  check('bridge: checker.js загружается в изолированном контексте с MockWorker',
    Boolean(CC && typeof CC.getBridge === 'function'));
  if (!CC) return;

  const answerInit = (msg, w) => w.emitFromWorker({ type: 'INIT_OK', id: msg.id });

  // 21.1 Happy path
  MockWorker.instances = [];
  MockWorker.respond = (msg, w) => {
    if (msg.type === 'INIT') answerInit(msg, w);
    else if (msg.type === 'CHECK') w.emitFromWorker({ type: 'CHECK_RESULT', id: msg.id, result: { passed: true, title: 'ok', sub: '', stdout: '', improveTips: [] } });
  };
  const r1 = await CC.checkSolution('print(1)', {});
  check('bridge: INIT → CHECK_RESULT доходит до вызывающего кода', Boolean(r1) && r1.passed === true);

  // 21.2 CHECK_ERROR: sandboxFailureResult, БЕЗ повторного исполнения payload
  let checkCount = 0;
  MockWorker.instances = [];
  MockWorker.respond = (msg, w) => {
    if (msg.type === 'INIT') answerInit(msg, w);
    else if (msg.type === 'CHECK') { checkCount++; w.emitFromWorker({ type: 'CHECK_ERROR', id: msg.id, error: 'boom' }); }
  };
  const r2 = await CC.checkSolution('while True: pass', {});
  check('bridge: CHECK_ERROR конвертируется в sandboxFailureResult', Boolean(r2) && r2.isSandboxError === true);
  check('bridge: payload не перезапускается (ровно 1 CHECK, fallback не включён)',
    checkCount === 1 && CC.getBridge().useFallback === false);

  // 21.3 Краш воркера после взятия payload: respawn, без inline-повтора
  const before3 = MockWorker.instances.length;
  const w3 = CC.getBridge().worker;
  MockWorker.respond = (msg, w) => {
    if (msg.type === 'INIT') answerInit(msg, w);
    else if (msg.type === 'CHECK') w.crash(new Error('wasm OOM'));
  };
  const r3 = await CC.checkSolution('x = 1', {});
  check('bridge: краш воркера → sandboxFailureResult', Boolean(r3) && r3.isSandboxError === true);
  check('bridge: после краша песочница пересоздана (воркер терминирован, инстанс +1)',
    w3.terminated === true && MockWorker.instances.length === before3 + 1);
  check('bridge: одиночный краш не даёт перманентного fallback', CC.getBridge().useFallback === false);

  // 21.4 Таймаут CHECK: friendly-ошибка + respawn (respond молчит по CHECK)
  const before4 = MockWorker.instances.length;
  const w4 = CC.getBridge().worker;
  MockWorker.respond = (msg, w) => { if (msg.type === 'INIT') answerInit(msg, w); };
  const r4 = await CC.checkSolution('while True: pass', {}, 40);
  check('bridge: таймаут CHECK возвращает friendly-ошибку таймаута',
    Boolean(r4) && r4.isRuntimeError === true && /Превышено время/.test(r4.title));
  check('bridge: после таймаута воркер терминирован и пересоздан',
    w4.terminated === true && MockWorker.instances.length === before4 + 1);

  // 21.5 Серия из 3 крашей подряд → перманентный fallback.
  // Белый ящик: сбрасываем счётчик крашей — изолируем тест от краша из 21.3.
  MockWorker.instances = [];
  CC.getBridge()._crashCount = 0;
  MockWorker.respond = (msg, w) => {
    if (msg.type === 'INIT') answerInit(msg, w);
    else if (msg.type === 'CHECK') w.crash(new Error('OOM again'));
  };
  let allSandbox = true;
  for (let i = 0; i < 3; i++) {
    const r = await CC.checkSolution('x = 1', {});
    if (!r || !r.isSandboxError) allSandbox = false;
  }
  check('bridge: 3 краша подряд → перманентный fallback',
    allSandbox && CC.getBridge().useFallback === true);
  const workersBeforePoison = MockWorker.instances.length;
  let settled5 = false;
  try {
    await CC.checkSolution('x = 1', {});
    settled5 = true;
  } catch (_) {
    settled5 = true; // в vm fallback-путь без Pyodide кидает исключение — это тоже «завершился»
  }
  check('bridge: после перманентного fallback новые воркеры не создаются',
    settled5 && MockWorker.instances.length === workersBeforePoison);

  // 21.6 Зависший воркер: INIT без ответа → JS-таймаут → fallback.
  // Белый ящик: снимаем перманентный fallback, поставленный в 21.5.
  const b6 = CC.getBridge();
  b6.useFallback = false;
  b6.terminateAndRespawn();
  b6.INIT_TIMEOUT_MS = 50;
  MockWorker.respond = () => {}; // тишина: воркер не отвечает на INIT
  const ok6 = await b6.ensureReady();
  check('bridge: INIT без ответа → ensureReady=false и перманентный fallback',
    ok6 === false && b6.useFallback === true);

  // 21.7 Итоговая деградация: вызов не зависает и завершается (результатом
  // или ошибкой — в vm-песочнице in-thread Pyodide недоступен, поэтому там
  // ожидаем исключение; в браузере это будет обычный результат fallback).
  let settled7 = false;
  try {
    await CC.checkSolution('x = 1', {});
    settled7 = true;
  } catch (_) {
    settled7 = true;
  }
  check('bridge: отравленный мост деградирует без зависания (вызов завершается)', settled7);

  // ── 22. Модуль «Песочница Python» (Sandbox) ──────────────────────────────────
  console.log('\n=== Валидация модуля Песочница (Sandbox) ===');

  const sandboxPath = path.join(__dirname, '..', 'app', 'sandbox.js');
  check('Sandbox: файл app/sandbox.js существует на диске', fs.existsSync(sandboxPath));

  const sandboxCode = fs.existsSync(sandboxPath) ? fs.readFileSync(sandboxPath, 'utf8') : '';
  check('Sandbox: app/sandbox.js не содержит запрещённых npm/require импортов',
    !sandboxCode.includes('require(') && !/import\s+.*from\s+['"]/.test(sandboxCode));
  check('Sandbox: модуль не обращается к localStorage/sessionStorage напрямую',
    !sandboxCode.includes('localStorage') && !sandboxCode.includes('sessionStorage'));

  if (fs.existsSync(sandboxPath)) {
    try {
      loadScript('app/sandbox.js');
    } catch (e) {
      console.error('  Sandbox: app/sandbox.js выбросил исключение при загрузке:', e.message);
    }
  }

  const SB = context.VkatSandbox;
  check('Sandbox: window.VkatSandbox успешно экспортирован', Boolean(SB) && typeof SB === 'object');
  check('Sandbox: методы init, enter, leave, runCode, stopExecution, selectPreset объявлены',
    Boolean(SB && typeof SB.init === 'function' && typeof SB.enter === 'function' &&
            typeof SB.leave === 'function' && typeof SB.runCode === 'function' &&
            typeof SB.stopExecution === 'function' && typeof SB.selectPreset === 'function'));
  check('Sandbox: содержит встроенные пресеты empty, benchmark, binary_search, freq_dict, comprehensions, oop_stack',
    Boolean(SB && SB._presets && SB._presets.empty && SB._presets.benchmark &&
            SB._presets.binary_search && SB._presets.freq_dict &&
            SB._presets.comprehensions && SB._presets.oop_stack));

  const currentHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const currentCss = fs.readFileSync(path.join(__dirname, '..', 'app', 'styles.css'), 'utf8');
  check('Sandbox: index.html содержит контейнер <div id="screen-sandbox">', currentHtml.includes('id="screen-sandbox"'));
  check('Sandbox: index.html подключает app/sandbox.js', currentHtml.includes('app/sandbox.js'));
  check('Sandbox: styles.css содержит селекторы #screen-sandbox и .sandbox-header',
    currentCss.includes('#screen-sandbox') && currentCss.includes('.sandbox-header'));
}

runStorageValidation().catch(err => {
  console.error('Непредвиденная ошибка в валидации хранилища:', err);
  process.exit(1);
});
