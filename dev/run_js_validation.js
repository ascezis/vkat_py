/**
 * Автономная валидация структуры курса и FriendlyErrors через Node.js
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const context = {
  window: {},
  console: console
};
context.window = context;

function loadScript(relPath) {
  const fullPath = path.join(__dirname, '..', relPath);
  const code = fs.readFileSync(fullPath, 'utf8');
  vm.runInNewContext(code, context, { filename: relPath });
}

console.log('=== Загрузка JS скриптов ===');
loadScript('content/stages.js');
loadScript('content/01-variables.js');
loadScript('content/02-conditions.js');
loadScript('content/03-loops.js');
loadScript('content/04-functions.js');
loadScript('content/05-lists-dicts.js');
loadScript('content/06-strings.js');
loadScript('content/l1-04-functions.js');
loadScript('content/l1-05-dicts.js');
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
check('Все ID элементов курса уникальны (65 элементов)', !hasDuplicates && allIds.size === 65);

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

console.log(`\nИТОГ: ${passed} пройдено, ${failed} ошибок.`);
if (failed > 0) process.exit(1);
