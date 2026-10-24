/**
 * Схемы-иллюстрации к темам: 1px линии, только токены палитры (см. styles.css, блок «ВИЗУАЛЫ»).
 * Рисунки декоративно-поясняющие: подпись (caption) дублирует смысл текстом.
 *
 * Использование: window.Glyphs.render(topicId) -> HTML-строка <figure> или '' (если схемы нет).
 *
 * Классы внутри SVG:
 *   .gl  тонкая тусклая линия      .gm  основная линия
 *   .gf  залитый (инверсия)        .gt  приглушённый текст
 *   .gT  основной текст            .gi  текст на инверсной заливке
 *   .d   рисуется при появлении    .f   плавно проявляется
 */
(function () {
  'use strict';

  // Счётчик для задержки появления (--i). Сбрасывается на каждую схему.
  let n = 0;
  const d = () => `class="d" pathLength="1" style="--i:${n++}"`;
  const dc = (c) => `class="${c} d" pathLength="1" style="--i:${n++}"`;
  const tx = (x, y, s, cls, extra) =>
    `<text class="${cls} f" x="${x}" y="${y}" style="--i:${n++}"${extra || ''}>${s}</text>`;
  const mid = ' text-anchor="middle"';
  const end = ' text-anchor="end"';
  const rect = (x, y, w, h, cls) => `<rect ${dc(cls)} x="${x}" y="${y}" width="${w}" height="${h}"/>`;
  const path = (dd, cls) => `<path ${dc(cls)} d="${dd}"/>`;

  const svg = (inner, h) =>
    `<svg class="glyph" viewBox="0 0 360 ${h || 220}" xmlns="http://www.w3.org/2000/svg" focusable="false">${inner}</svg>`;

  // ---------- Схемы ----------

  function variables() {
    n = 0;
    return svg(
      // score = 100
      rect(40, 36, 96, 24, 'gl') + tx(88, 53, 'score', 'gt', mid) +
      path('M88 60 V72', 'gl') +
      rect(40, 72, 96, 80, 'gm') + tx(88, 122, '100', 'gT big', mid) +
      // name = "Аня"
      rect(216, 36, 104, 24, 'gl') + tx(268, 53, 'name', 'gt', mid) +
      path('M268 60 V72', 'gl') +
      rect(216, 72, 104, 80, 'gm') + tx(268, 122, '"Аня"', 'gT big', mid) +
      // «пол»
      path('M24 164 H336', 'gl dash') +
      tx(88, 190, 'score = 100', 'gt', mid) + tx(268, 190, 'name = "Аня"', 'gt', mid)
    );
  }

  function conditions() {
    n = 0;
    return svg(
      `<circle class="gf f" cx="28" cy="110" r="4" style="--i:${n++}"/>` +
      path('M32 110 H96', 'gm') +
      path('M96 110 L130 76 L164 110 L130 144 Z', 'gm') +
      tx(130, 116, '?', 'gT big', mid) +
      // ветка True (выбрана)
      path('M164 110 H190 V58 H236', 'gm') +
      `<rect class="gf f" x="236" y="40" width="88" height="36" style="--i:${n++}"/>` +
      tx(280, 63, 'True', 'gi', mid) +
      tx(196, 50, 'if', 'gt') +
      // ветка False (не выбрана)
      path('M164 110 H190 V162 H236', 'gl dash') +
      rect(236, 144, 88, 36, 'gl') + tx(280, 167, 'False', 'gt', mid) +
      tx(196, 180, 'else', 'gt')
    );
  }

  function loops() {
    n = 0;
    const cells = [0, 1, 2, 3, 4].map(i =>
      rect(168 + i * 36, 90, 36, 36, 'gm') + tx(186 + i * 36, 113, String(i), 'gT', mid)
    ).join('');
    return svg(
      `<circle ${dc('gl')} cx="88" cy="110" r="54"/>` +
      path('M88 56 A54 54 0 1 1 34 110', 'gm') +
      path('M28 118 L34 106 L40 118', 'gm') +
      tx(88, 115, 'for', 'gT', mid) +
      cells +
      // «курсор» перебирает элементы (CSS-анимация .hop)
      `<g class="hop"><path d="M186 136 l7 10 h-14 z" class="gf"/></g>` +
      tx(168, 176, 'for i in range(5):', 'gt') +
      tx(184, 196, 'print(i)', 'gt')
    );
  }

  function functions() {
    n = 0;
    return svg(
      path('M20 110 H102', 'gm') + path('M96 104 L104 110 L96 116', 'gm') +
      rect(108, 62, 144, 96, 'gm') +
      tx(180, 106, 'f(x)', 'gT big', mid) +
      tx(180, 132, 'тело функции', 'gt', mid) +
      path('M252 110 H334', 'gm') + path('M328 104 L336 110 L328 116', 'gm') +
      tx(20, 96, 'аргумент', 'gt') + tx(340, 96, 'результат', 'gt', end) +
      tx(20, 140, '3', 'gT big') + tx(340, 140, '9', 'gT big', end) +
      path('M24 184 H336', 'gl dash') +
      tx(180, 206, 'f(3)  →  9', 'gt', mid)
    );
  }

  function listsDicts() {
    n = 0;
    const vals = [7, 3, 9, 1, 4];
    const cells = vals.map((v, i) =>
      rect(24 + i * 44, 38, 44, 36, i === 2 ? 'gf' : 'gm') +
      tx(46 + i * 44, 61, String(v), i === 2 ? 'gi' : 'gT', mid) +
      tx(46 + i * 44, 92, String(i), 'gt small', mid)
    ).join('');
    const rows = [['"имя"', '"Аня"'], ['"возраст"', '14'], ['"ok"', 'True']].map((r, i) =>
      rect(24, 136 + i * 28, 110, 28, 'gm') + rect(134, 136 + i * 28, 110, 28, 'gm') +
      tx(34, 155 + i * 28, r[0], 'gt') + tx(144, 155 + i * 28, r[1], 'gT')
    ).join('');
    return svg(
      tx(24, 26, 'list', 'gt small') + cells +
      tx(24, 124, 'dict', 'gt small') + rows +
      tx(262, 61, 'a[2] → 9', 'gT') +
      tx(262, 155, 'd["имя"]', 'gT') + tx(262, 175, '→ "Аня"', 'gt'),
      224
    );
  }

  function dicts() {
    n = 0;
    const data = [['"имя"', '"Аня"'], ['"возраст"', '14'], ['"город"', '"Омск"'], ['"ok"', 'True']];
    const rows = data.map((r, i) => {
      const hot = i === 1;
      return rect(24, 44 + i * 34, 128, 34, hot ? 'gf' : 'gm') + rect(152, 44 + i * 34, 128, 34, hot ? 'gf' : 'gm') +
        tx(36, 66 + i * 34, r[0], hot ? 'gi' : 'gt') + tx(164, 66 + i * 34, r[1], hot ? 'gi' : 'gT');
    }).join('');
    return svg(
      tx(36, 32, 'ключ', 'gt small') + tx(164, 32, 'значение', 'gt small') + rows +
      path('M280 112 H320', 'gm') + path('M314 106 L322 112 L314 118', 'gm') +
      tx(24, 214, 'd["возраст"]  →  14', 'gT')
    );
  }

  function strings() {
    n = 0;
    const chars = ['в', 'к', 'а', 'т', '.', 'p', 'y'];
    const cells = chars.map((c, i) => {
      const hot = i < 4;
      return rect(40 + i * 40, 70, 40, 44, hot ? 'gf' : 'gm') +
        tx(60 + i * 40, 99, c, hot ? 'gi big' : 'gT big', mid) +
        tx(60 + i * 40, 58, String(i), 'gt small', mid) +
        tx(60 + i * 40, 134, String(i - 7), 'gt small', mid);
    }).join('');
    return svg(
      cells +
      path('M40 152 V160 H200 V152', 'gm') +
      tx(120, 182, 's[0:4]  →  "вкат"', 'gT', mid) +
      tx(320, 206, 'len(s) = 7', 'gt', end)
    );
  }

  function lists() {
    n = 0;
    const vals = [10, 20, 30, 40, 50];
    const cells = vals.map((v, i) => {
      const active = i === 1 || i === 2;
      return rect(35 + i * 58, 70, 58, 44, active ? 'gf' : 'gm') +
        tx(64 + i * 58, 99, String(v), active ? 'gi big' : 'gT big', mid) +
        tx(64 + i * 58, 56, String(i), 'gt small', mid) +
        tx(64 + i * 58, 136, String(i - 5), 'gt small', mid);
    }).join('');
    return svg(
      cells +
      path('M93 152 V160 H209 V152', 'gm') +
      tx(151, 184, 'a[1:3]  →  [20, 30]', 'gT', mid) +
      tx(325, 206, 'len(a) = 5', 'gt', end)
    );
  }

  function tuples() {
    n = 0;
    const row = (y, vals) => vals.map((v, i) =>
      rect(24 + i * 64, y, 64, 36, 'gm') + tx(56 + i * 64, y + 23, String(v), 'gT', mid)
    ).join('');
    return svg(
      // список: менять можно
      tx(24, 24, 'list', 'gt small') +
      row(32, [10, 5, 30]) +
      tx(278, 52, 'a[1] = 5', 'gT') + tx(278, 70, '→ можно', 'gt') +
      // кортеж: двойная рамка и замок
      tx(24, 120, 'tuple', 'gt small') +
      rect(20, 126, 200, 44, 'gm') +
      row(130, [10, 20, 30]) +
      path('M242 144 V136 H262 V144', 'gm') +
      rect(236, 144, 32, 24, 'gf') +
      tx(278, 152, 't[1] = 5', 'gT') + tx(278, 170, '→ ошибка', 'gt'),
      200
    );
  }

  function whileLoop() {
    n = 0;
    return svg(
      // вход -> условие
      path('M20 100 H52 M46 94 L52 100 L46 106', 'gm') +
      path('M52 100 L100 68 L148 100 L100 132 Z', 'gm') +
      tx(100, 105, 'while', 'gT', mid) +
      // True: тело цикла
      path('M148 100 H196 M190 94 L196 100 L190 106', 'gm') +
      tx(152, 92, 'True', 'gt small') +
      rect(196, 80, 112, 40, 'gf') + tx(252, 105, 'тело', 'gi', mid) +
      // конец тела / continue: назад к проверке
      path('M252 120 V156 H100 V132 M94 140 L100 132 L106 140', 'gm') +
      tx(176, 176, 'конец круга или continue', 'gt small', mid) +
      // False и break: выход
      path('M100 68 V44 M94 52 L100 44 L106 52', 'gm') +
      tx(108, 62, 'False', 'gt small') +
      rect(60, 16, 80, 28, 'gm') + tx(100, 35, 'выход', 'gT', mid) +
      path('M252 80 V30 H140 M148 24 L140 30 L148 36', 'gm') +
      tx(260, 60, 'break', 'gT') +
      tx(24, 208, 'условие проверяется перед каждым кругом', 'gt small'),
      224
    );
  }

  function nested() {
    n = 0;
    const cells = [0, 1, 2].map(i =>
      tx(54 + i * 60, 42, String(i), 'gt small', mid) +
      rect(24 + i * 60, 48, 60, 32, 'gm') + tx(54 + i * 60, 69, '{ }', 'gT', mid)
    ).join('');
    return svg(
      tx(24, 24, 'data', 'gt small') + cells +
      // шаг 1: data[0]
      path('M54 80 V100 M48 94 L54 100 L60 94', 'gm') +
      tx(68, 96, 'data[0]', 'gT') +
      // шаг 2: ключ внутри словаря
      rect(24, 104, 96, 28, 'gm') + rect(120, 104, 112, 28, 'gf') +
      tx(34, 123, '"имя"', 'gt') + tx(130, 123, '"Аня"', 'gi') +
      rect(24, 132, 96, 28, 'gm') + rect(120, 132, 112, 28, 'gm') +
      tx(34, 151, '"баллы"', 'gt') + tx(130, 151, '[7, 9]', 'gT') +
      tx(244, 123, '["имя"]', 'gT') +
      tx(24, 198, 'data[0]["имя"]  →  "Аня"', 'gT'),
      216
    );
  }

  function stringsMethods() {
    n = 0;
    const words = ['один', 'два', 'три'];
    const cells = words.map((w, i) =>
      rect(24 + i * 56, 116, 56, 36, i === 1 ? 'gf' : 'gm') +
      tx(52 + i * 56, 139, '"' + w + '"', i === 1 ? 'gi small' : 'gT small', mid)
    ).join('');
    return svg(
      // строка с «швами» на месте пробелов
      tx(204, 60, 'str', 'gt small') +
      rect(24, 36, 168, 36, 'gm') +
      path('M80 36 V72 M136 36 V72', 'gl dash') +
      tx(52, 59, 'один', 'gT', mid) + tx(108, 59, 'два', 'gT', mid) + tx(164, 59, 'три', 'gT', mid) +
      // split вниз, join вверх
      path('M60 76 V112 M54 106 L60 112 L66 106', 'gm') + tx(68, 98, 'split()', 'gT') +
      path('M156 112 V76 M150 82 L156 76 L162 82', 'gm') + tx(164, 98, 'join()', 'gT') +
      // список слов
      tx(204, 140, 'list', 'gt small') + cells +
      tx(24, 188, 'join: разделитель стоит между словами', 'gt small'),
      200
    );
  }

  // ---------- Реестр ----------

  const REGISTRY = {
    'variables':   { draw: variables,  cap: 'переменная — подписанная коробка со значением' },
    'conditions':  { draw: conditions, cap: 'if выбирает ветку — выполняется только одна' },
    'loops':       { draw: loops,      cap: 'цикл повторяет блок для каждого элемента' },
    'functions':   { draw: functions,  cap: 'функция: на входе аргументы, на выходе результат' },
    'l1_functions':{ draw: functions,  cap: 'функция: на входе аргументы, на выходе результат' },
    'lists-dicts': { draw: listsDicts, cap: 'список — по номеру, словарь — по ключу' },
    'l1_lists':    { draw: lists,      cap: 'список — упорядоченный ряд элементов с прямыми и обратными индексами' },
    'l1_dicts':    { draw: dicts,      cap: 'словарь: по ключу находим значение' },
    'strings':     { draw: strings,    cap: 'строка — ряд символов с индексами' },
    'l1_tuples':   { draw: tuples,     cap: 'кортеж — запечатанный ряд: значения менять нельзя' },
    'l1_strings':  { draw: stringsMethods, cap: 'split режет строку в список, join склеивает обратно' },
    'l1_loops_adv':{ draw: whileLoop,  cap: 'while: условие перед кругом; break — выход, continue — дальше' },
    'l1_nested_structures': { draw: nested, cap: 'вложенность: к значению идём по шагам — индекс, затем ключ' }
  };

  function render(topicId) {
    const g = REGISTRY[topicId];
    if (!g) return '';
    return `<div class="visual-canvas">${g.draw()}</div>` +
           `<figcaption class="visual-cap"><span>схема</span>${g.cap}</figcaption>`;
  }

  function caption(topicId) {
    return REGISTRY[topicId] ? REGISTRY[topicId].cap : '';
  }

  window.Glyphs = { render, caption };
})();
