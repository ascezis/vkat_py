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

  // ---------- Схемы пет-проекта «Игра «Жизнь» ----------

  function lifeNeighbors() {
    n = 0;
    // Сетка 3x3: клетки 36px, центр в (102, 90)
    const cells = [
      [48, 36], [84, 36], [120, 36],
      [48, 72],           [120, 72],
      [48, 108], [84, 108], [120, 108]
    ];
    let inner = cells.map(([x, y]) => rect(x, y, 36, 36, 'gm')).join('');
    inner += rect(84, 72, 36, 36, 'gf') + tx(102, 95, 'x,y', 'gi small', mid);

    // 8 пунктирных стрелок от центра к соседям
    const targets = [
      [66, 54], [102, 54], [138, 54],
      [66, 90],           [138, 90],
      [66, 126], [102, 126], [138, 126]
    ];
    inner += targets.map(([cx, cy]) => {
      const dx = cx - 102, dy = cy - 90;
      const len = Math.sqrt(dx * dx + dy * dy);
      const ux = dx / len, uy = dy / len;
      const x1 = 102 + ux * 11, y1 = 90 + uy * 11;
      const x2 = cx - ux * 9, y2 = cy - uy * 9;
      const head = 'M' + (x2 - ux * 6 + uy * 4) + ' ' + (y2 - uy * 6 - ux * 4) +
        ' L' + x2 + ' ' + y2 +
        ' L' + (x2 - ux * 6 - uy * 4) + ' ' + (y2 - uy * 6 + ux * 4);
      return path('M' + x1 + ' ' + y1 + ' L' + x2 + ' ' + y2, 'gl dash') + path(head, 'gl');
    }).join('');

    // подписи смещений по диагоналям
    inner += tx(44, 44, '(-1,-1)', 'gt small', end) + tx(160, 44, '(1,-1)', 'gt small') +
      tx(44, 140, '(-1,1)', 'gt small', end) + tx(160, 140, '(1,1)', 'gt small') +
      // правый блок
      tx(210, 64, '8 соседей', 'gT') +
      tx(210, 88, 'dx: -1..1', 'gt') + tx(210, 108, 'dy: -1..1', 'gt') +
      tx(210, 132, 'кроме (0, 0)', 'gt') +
      tx(210, 172, 'сама клетка —', 'gt small') + tx(210, 186, 'не свой сосед', 'gt small');
    return svg(inner);
  }

  function lifeRules() {
    n = 0;
    // Две колонки: слева рождение (B3), справа выживание/гибель (S23).
    // Подписи центрированы ВНУТРИ своей колонки и не перелезают через разделитель
    // (в старой версии текст «ровно 3 соседа» уползал за x=180 в колонку S).
    let inner = tx(90, 40, 'B — рождение', 'gT', mid) + tx(270, 40, 'S — выживание', 'gT', mid) +
      path('M180 52 V170', 'gl dash');

    // B: три соседа -> рождение
    inner += rect(30, 72, 20, 20, 'gm') + rect(54, 72, 20, 20, 'gm') + rect(78, 72, 20, 20, 'gm') +
      path('M60 96 V114 M54 108 L60 114 L66 108', 'gm') +
      rect(50, 118, 20, 20, 'gf') +
      tx(90, 162, 'ровно 3 соседа', 'gt small', mid) +
      tx(90, 176, '→ рождение', 'gt small', mid);

    // S: выживание при 2-3 (клетка остаётся живой)
    inner += rect(212, 72, 20, 20, 'gf') +
      path('M238 82 H254 M248 76 L254 82 L248 88', 'gm') +
      rect(258, 72, 20, 20, 'gf') +
      tx(270, 112, '2 или 3 соседа', 'gt small', mid) +
      tx(270, 126, '→ выживает', 'gt small', mid) +
      // гибель при 1 или 4+ (клетка гаснет)
      rect(212, 138, 20, 20, 'gf') +
      path('M238 148 H254', 'gl') +
      tx(270, 178, '1 или 4+ соседей', 'gt small', mid) +
      tx(270, 192, '→ гибель', 'gt small', mid);

    inner += tx(180, 228, 'B3 / S23', 'gT big', mid);
    return svg(inner, 240);
  }

  function lifePatterns() {
    n = 0;
    // 1. Блок (натюрморт 2x2)
    let inner =
      rect(48, 72, 14, 14, 'gf') + rect(62, 72, 14, 14, 'gf') +
      rect(48, 86, 14, 14, 'gf') + rect(62, 86, 14, 14, 'gf') +
      tx(62, 158, 'Блок', 'gT', mid) + tx(62, 176, 'натюрморт', 'gt small', mid) +
      // 2. Мигалка (осциллятор, две фазы + цикл)
      rect(140, 62, 14, 14, 'gf') + rect(154, 62, 14, 14, 'gf') + rect(168, 62, 14, 14, 'gf') +
      rect(155, 82, 14, 14, 'gf') + rect(155, 96, 14, 14, 'gf') + rect(155, 110, 14, 14, 'gf') +
      path('M196 72 V118 M190 112 L196 118 L202 112', 'gl') +
      path('M116 118 V72 M110 78 L116 72 L122 78', 'gl') +
      tx(160, 158, 'Мигалка', 'gT', mid) + tx(160, 176, 'осциллятор P=2', 'gt small', mid) +
      // 3. Глайдер (корабль, v = c/4)
      rect(282, 60, 14, 14, 'gf') + rect(296, 74, 14, 14, 'gf') +
      rect(268, 88, 14, 14, 'gf') + rect(282, 88, 14, 14, 'gf') + rect(296, 88, 14, 14, 'gf') +
      path('M270 112 L314 134 M314 134 L304 132 M314 134 L310 124', 'gm') +
      tx(288, 151, 'v = c/4', 'gt small', mid) +
      tx(288, 176, 'Глайдер', 'gT', mid) + tx(288, 194, 'корабль', 'gt small', mid);
    return svg(inner);
  }

  // Практикум: три приёма темы «Алгоритмы» — поиск с ранним выходом,
  // слияние двумя указателями, максимум скользящего окна.
  function algorithms() {
    n = 0;
    const cell = (x, y, val, cls, tcls) => rect(x, y, 18, 18, cls) + tx(x + 9, y + 13, val, tcls, mid);
    return svg(
      // 1. Линейный поиск (слева, x: 8..114)
      path('M39 30 V42 M35 36 L39 42 L43 36', 'gm') +
      tx(39, 24, 'i', 'gt', mid) +
      cell(8, 48, '3', 'gm', 'gT') + cell(30, 48, '7', 'gf', 'gi') +
      cell(52, 48, '4', 'gm', 'gT') + cell(74, 48, '7', 'gm', 'gT') +
      cell(96, 48, '9', 'gm', 'gT') +
      [0, 1, 2, 3, 4].map(k => tx(17 + k * 22, 78, String(k), 'gt small', mid)).join('') +
      tx(61, 150, 'поиск', 'gT', mid) + tx(61, 168, 'ранний выход', 'gt small', mid) +

      // 2. Слияние двумя указателями (центр, x: 140..222)
      // Входные списки a и b
      tx(138, 38, 'a', 'gt', end) +
      rect(146, 24, 18, 18, 'gm') + tx(155, 37, '1', 'gT', mid) +
      rect(168, 24, 18, 18, 'gl') + tx(177, 37, '3', 'gt', mid) +
      tx(138, 62, 'b', 'gt', end) +
      rect(146, 48, 18, 18, 'gm') + tx(155, 61, '2', 'gT', mid) +
      rect(168, 48, 18, 18, 'gl') + tx(177, 61, '4', 'gt', mid) +
      // Стрелки перехода в объединённый список
      path('M155 72 V82 M151 77 L155 82 L159 77', 'gm') +
      path('M177 72 V82 M173 77 L177 82 L181 77', 'gm') +
      // Результат слияния
      rect(136, 90, 20, 20, 'gf') + tx(146, 103, '1', 'gi', mid) +
      rect(160, 90, 20, 20, 'gf') + tx(170, 103, '2', 'gi', mid) +
      rect(184, 90, 20, 20, 'gf') + tx(194, 103, '3', 'gi', mid) +
      rect(208, 90, 20, 20, 'gf') + tx(218, 103, '4', 'gi', mid) +
      tx(182, 150, 'слияние', 'gT', mid) + tx(182, 168, 'два указателя', 'gt small', mid) +

      // 3. Скользящее окно (справа, x: 242..352)
      path('M286 34 H348 M286 34 V42 M348 34 V42', 'gm') +
      tx(317, 26, 'k=3', 'gT small', mid) +
      cell(242, 48, '2', 'gl', 'gt') + cell(264, 48, '1', 'gl', 'gt') +
      cell(286, 48, '3', 'gm', 'gT') + cell(308, 48, '5', 'gf', 'gi') +
      cell(330, 48, '4', 'gm', 'gT') +
      tx(297, 150, 'окно', 'gT', mid) + tx(297, 168, 'максимум', 'gt small', mid)
    , 190);
  }

  // ============================================================================
  // Схемы для этапа «Практикум» (l2_algorithms)
  // ============================================================================

  // t1: Концепция прикладного алгоритма (аккумулятор, ранний выход, значение по умолчанию)
  function algT1() {
    n = 0;
    return svg(
      rect(24, 30, 96, 48, 'gm') + tx(72, 52, 'аккумулятор', 'gT small', mid) + tx(72, 68, 'total += x', 'gt small', mid) +
      rect(132, 30, 96, 48, 'gf') + tx(180, 52, 'ранний выход', 'gi small', mid) + tx(180, 68, 'return i', 'gi small', mid) +
      rect(240, 30, 96, 48, 'gm') + tx(288, 52, 'по умолчанию', 'gT small', mid) + tx(288, 68, 'return -1', 'gt small', mid) +
      path('M72 78 V106 M180 78 V106 M288 78 V106', 'gl') +
      path('M48 106 H312', 'gl dash') +
      tx(180, 134, 'каркас любого алгоритма обработки', 'gT', mid) +
      tx(180, 154, 'накопление • критерий остановки • дефолтный возврат', 'gt small', mid)
    , 180);
  }

  // c1: Линейный поиск первой ошибки со стрелкой i и ранним выходом
  function algC1() {
    n = 0;
    const codes = ['200', '200', '500', '404', '200'];
    const row = codes.map((c, i) => {
      const isErr = i === 2;
      const x = 30 + i * 62;
      return rect(x, 52, 52, 32, isErr ? 'gf' : 'gm') +
             tx(x + 26, 73, c, isErr ? 'gi' : 'gT', mid) +
             tx(x + 26, 102, String(i), 'gt small', mid);
    }).join('');
    return svg(
      tx(30, 36, 'лог сервера', 'gt small') +
      path('M180 20 V42 M174 36 L180 42 L186 36', 'gm') +
      tx(180, 14, 'i = 2 (первый сбой)', 'gT small', mid) +
      row +
      path('M220 34 H330', 'gl dash') +
      tx(275, 26, 'хвост не читаем', 'gt small', mid) +
      tx(180, 132, 'ранний выход return 2', 'gT', mid) +
      tx(180, 150, 'остановка на первом совпадении кода сбоя', 'gt small', mid)
    , 175);
  }

  // q1: Вопрос про инвариант поиска (до конца или выход)
  function algQ1() {
    n = 0;
    return svg(
      rect(30, 30, 140, 48, 'gf') +
      tx(100, 50, 'nums[i] == x', 'gi small', mid) +
      tx(100, 68, 'return i (ранний)', 'gi small', mid) +
      path('M170 54 H200 M194 48 L200 54 L194 60', 'gm') +
      rect(200, 30, 130, 48, 'gm') +
      tx(265, 50, 'хвост списка', 'gT small', mid) +
      tx(265, 68, 'НЕ сканируется', 'gt small', mid) +
      path('M30 96 H330', 'gl dash') +
      rect(95, 110, 170, 32, 'gm') +
      tx(180, 130, 'конец цикла -> return -1', 'gT small', mid)
    , 170);
  }

  // p1: Трассировка аккумулятора в цикле
  function algP1() {
    n = 0;
    const steps = [
      { n: '+4', tot: 'total = 4' },
      { n: '-1', tot: 'total = 3' },
      { n: '+5', tot: 'total = 8' }
    ];
    let row = '';
    steps.forEach((s, i) => {
      const x = 35 + i * 102;
      row += rect(x, 40, 88, 54, i === 2 ? 'gf' : 'gm') +
             tx(x + 44, 62, 'шаг: ' + s.n, i === 2 ? 'gi' : 'gt small', mid) +
             tx(x + 44, 82, s.tot, i === 2 ? 'gi' : 'gT', mid);
    });
    return svg(
      tx(35, 26, 'трассировка аккумулятора total += n', 'gt small') +
      row +
      path('M123 67 H137 M131 61 L137 67 L131 73', 'gl') +
      path('M225 67 H239 M233 61 L239 67 L233 73', 'gl') +
      tx(180, 126, 'вывод: 4, затем 3, затем 8', 'gT', mid) +
      tx(180, 144, 'значение обновляется на каждом шаге цикла', 'gt small', mid)
    , 168);
  }

  // p2: Ранний выход в действии (сравнение двух вызовов)
  function algP2() {
    n = 0;
    return svg(
      // вызов 1
      rect(30, 26, 300, 42, 'gm') +
      tx(42, 52, 'find([10, 20, 30, 40], 30)', 'gT small') +
      tx(310, 52, '-> 2', 'gT', end) +
      tx(210, 38, '(ранний выход на i=2)', 'gt small', mid) +
      // вызов 2
      rect(30, 80, 300, 42, 'gl') +
      tx(42, 106, 'find([10, 20], 99)', 'gt small') +
      tx(310, 106, '-> -1', 'gt', end) +
      tx(210, 92, '(полный обход списка)', 'gt small', mid) +
      tx(180, 144, 'ранний выход останавливает цикл, дефолт ждёт конца', 'gt small', mid)
    , 166);
  }

  // p4: Трассировка слияния двух списков по шагам
  function algP4() {
    n = 0;
    return svg(
      tx(35, 28, 'a = [1, 4]   b = [2, 3, 5]', 'gt small') +
      rect(35, 42, 60, 34, 'gm') + tx(65, 63, '1 < 2', 'gT small', mid) +
      rect(105, 42, 60, 34, 'gm') + tx(135, 63, '4 > 2', 'gT small', mid) +
      rect(175, 42, 60, 34, 'gm') + tx(205, 63, '4 > 3', 'gT small', mid) +
      rect(245, 42, 70, 34, 'gf') + tx(280, 63, 'хвост: 5', 'gi small', mid) +
      rect(35, 92, 280, 34, 'gf') +
      tx(175, 114, 'итог: [1, 2, 3, 4, 5]', 'gi', mid) +
      tx(180, 148, 'пошаговое сравнение указателей a[i] и b[j]', 'gt small', mid)
    , 168);
  }

  // t2: Логарифмическая скорость бинарного поиска
  function algT2() {
    n = 0;
    return svg(
      rect(35, 26, 290, 36, 'gm') +
      tx(50, 48, 'N = 1 000 000 записей', 'gT small') +
      rect(35, 74, 135, 32, 'gl') + tx(102, 94, '500 000 (шаг 1)', 'gt small', mid) +
      rect(190, 74, 68, 32, 'gl') + tx(224, 94, '...шаг 2', 'gt small', mid) +
      rect(270, 74, 55, 32, 'gf') + tx(297, 94, 'шаг 20', 'gi small', mid) +
      tx(180, 132, 'линейный поиск: до 1 000 000 проверок', 'gt small', mid) +
      tx(180, 150, 'бинарный поиск: ровно 20 проверок!', 'gT', mid)
    , 172);
  }

  // c2: Подсчёт всплесков CPU выше порога limit
  function algC2() {
    n = 0;
    const vals = [30, 45, 85, 20, 92, 40];
    const bars = vals.map((v, i) => {
      const isHigh = v > 60;
      const x = 36 + i * 50;
      const h = Math.round(v * 0.7);
      const y = 100 - h;
      return rect(x, y, 36, h, isHigh ? 'gf' : 'gm') +
             tx(x + 18, y - 6, v + '%', isHigh ? 'gT' : 'gt small', mid);
    }).join('');
    return svg(
      path('M20 58 H340', 'gl dash') +
      tx(334, 52, 'limit = 60%', 'gt small', end) +
      bars +
      path('M20 100 H340', 'gm') +
      tx(180, 128, 'count = 2 (замеры 85% и 92%)', 'gT', mid) +
      tx(180, 146, 'счётчик фиксирует только значения строго больше limit', 'gt small', mid)
    , 170);
  }

  // q2: Структура возврата по умолчанию
  function algQ2() {
    n = 0;
    return svg(
      rect(40, 24, 280, 40, 'gm') + tx(180, 48, 'for i in range(len(nums)):', 'gT', mid) +
      rect(70, 72, 220, 32, 'gl') + tx(180, 92, 'if nums[i] == x: return i  (ранний выход)', 'gt small', mid) +
      rect(40, 112, 280, 32, 'gf') + tx(180, 132, 'return -1  (значение по умолчанию строго ПОСЛЕ цикла)', 'gi small', mid)
    , 164);
  }

  // p3: Вложенные циклы — генератор матрицы
  function algP3() {
    n = 0;
    return svg(
      rect(40, 24, 40, 24, 'gm') + tx(60, 40, '[0]', 'gT', mid) +
      rect(40, 54, 80, 24, 'gm') + tx(80, 70, '[0, 1]', 'gT', mid) +
      rect(40, 84, 120, 24, 'gm') + tx(100, 100, '[0, 1, 2]', 'gT', mid) +
      path('M180 34 H300', 'gl') + tx(306, 38, 'i=0', 'gt small') +
      path('M180 64 H300', 'gl') + tx(306, 68, 'i=1', 'gt small') +
      path('M180 94 H300', 'gl') + tx(306, 98, 'i=2', 'gt small') +
      tx(180, 134, 'список списков: матрица 3 строки', 'gT', mid) +
      tx(180, 152, 'внутренний цикл формирует строку j в диапазоне 0..i', 'gt small', mid)
    , 174);
  }

  // c3 / p1: График баланса транзакций (running_total)
  function algC3() {
    n = 0;
    const txs = [
      { val: '+10', tot: 10, y: 88 },
      { val: '+20', tot: 30, y: 64 },
      { val: '-15', tot: 15, y: 82 },
      { val: '+25', tot: 40, y: 50 }
    ];
    let inner = path('M40 88 L120 64 L200 82 L280 50', 'gm');
    txs.forEach((t, i) => {
      const x = 40 + i * 80;
      inner += `<circle class="gf f" cx="${x}" cy="${t.y}" r="4" style="--i:${n++}"/>` +
               tx(x, t.y - 10, t.val, 'gt small', mid) +
               rect(x - 22, 104, 44, 24, 'gm') +
               tx(x, 120, String(t.tot), 'gT', mid);
    });
    inner += tx(180, 146, 'накопленный баланс транзакций', 'gT', mid) +
             tx(180, 164, '[10, 30, 15, 40] — итог после каждой операции', 'gt small', mid);
    return svg(inner, 184);
  }

  // c4 / p4: Слияние двух потоков сообщений (merge_sorted)
  function algC4() {
    n = 0;
    return svg(
      tx(40, 38, 'поток A (время)', 'gt small') +
      rect(130, 24, 34, 24, 'gm') + tx(147, 40, '10:01', 'gT small', mid) +
      rect(170, 24, 34, 24, 'gl') + tx(187, 40, '10:05', 'gt small', mid) +
      tx(40, 68, 'поток B (время)', 'gt small') +
      rect(130, 54, 34, 24, 'gm') + tx(147, 70, '10:03', 'gT small', mid) +
      rect(170, 54, 34, 24, 'gl') + tx(187, 70, '10:07', 'gt small', mid) +
      path('M147 82 V96 M143 90 L147 96 L151 90', 'gm') +
      rect(60, 102, 54, 24, 'gf') + tx(87, 118, '10:01', 'gi small', mid) +
      rect(120, 102, 54, 24, 'gf') + tx(147, 118, '10:03', 'gi small', mid) +
      rect(180, 102, 54, 24, 'gf') + tx(207, 118, '10:05', 'gi small', mid) +
      rect(240, 102, 54, 24, 'gf') + tx(267, 118, '10:07', 'gi small', mid) +
      tx(180, 146, 'единая хронологическая лента', 'gT', mid) +
      tx(180, 164, 'два указателя i и j: сравниваем и забираем меньший', 'gt small', mid)
    , 184);
  }

  // c5: Пагинация товаров (chunk)
  function algC5() {
    n = 0;
    return svg(
      tx(30, 32, 'каталог товаров (k = 2)', 'gt small') +
      // стр 1
      rect(30, 44, 46, 36, 'gm') + tx(53, 66, '#1', 'gT', mid) +
      rect(80, 44, 46, 36, 'gm') + tx(103, 66, '#2', 'gT', mid) +
      path('M30 86 H126', 'gl dash') + tx(78, 102, 'стр. 1', 'gt small', mid) +
      // стр 2
      rect(146, 44, 46, 36, 'gm') + tx(169, 66, '#3', 'gT', mid) +
      rect(196, 44, 46, 36, 'gm') + tx(219, 66, '#4', 'gT', mid) +
      path('M146 86 H242', 'gl dash') + tx(194, 102, 'стр. 2', 'gt small', mid) +
      // стр 3 (хвост)
      rect(262, 44, 46, 36, 'gf') + tx(285, 66, '#5', 'gi', mid) +
      path('M262 86 H308', 'gl dash') + tx(285, 102, 'хвост', 'gt small', mid) +
      tx(180, 134, 'нарезка батчами nums[i:i + k]', 'gT', mid) +
      tx(180, 152, 'безопасный срез не падает на коротком последнем блоке', 'gt small', mid)
    , 174);
  }

  // c6: Скользящее окно FPS (sliding_max)
  function algC6() {
    n = 0;
    const fps = [58, 62, 75, 45, 60];
    const cells = fps.map((f, i) => {
      const inWin = i >= 1 && i <= 3;
      const isMax = i === 2;
      const x = 32 + i * 60;
      return rect(x, 48, 50, 32, isMax ? 'gf' : (inWin ? 'gm' : 'gl')) +
             tx(x + 25, 69, f + '', isMax ? 'gi' : (inWin ? 'gT' : 'gt'), mid);
    }).join('');
    return svg(
      path('M92 38 H272 M92 38 V44 M272 38 V44', 'gm') +
      tx(182, 30, 'окно k = 3 сек', 'gT small', mid) +
      cells +
      tx(182, 104, 'максимум в окне = 75 FPS', 'gT small', mid) +
      tx(180, 134, 'скользящее окно замеряет пиковую нагрузку', 'gT', mid) +
      tx(180, 152, 'рамка движется от 0 до len(nums) - k', 'gt small', mid)
    , 174);
  }

  // f1: Починка диапазона range(len(nums))
  function algF1() {
    n = 0;
    return svg(
      rect(30, 34, 60, 30, 'gm') + tx(60, 54, '0', 'gT', mid) +
      rect(96, 34, 60, 30, 'gm') + tx(126, 54, '1', 'gT', mid) +
      rect(162, 34, 60, 30, 'gm') + tx(192, 54, 'len-1', 'gT', mid) +
      rect(238, 34, 80, 30, 'gl dash') + tx(278, 54, 'len (!)', 'gt', mid) +
      path('M278 72 V88 M274 78 L278 72 L282 78', 'gm') +
      tx(278, 104, 'IndexError!', 'gT small', mid) +
      tx(180, 134, 'диапазон range(len(nums)) безопасен', 'gT', mid) +
      tx(180, 152, 'range(len + 1) вылезает за пределы массива', 'gt small', mid)
    , 174);
  }

  // f2: Неизменяемость входных данных (immutability)
  function algF2() {
    n = 0;
    return svg(
      rect(40, 24, 280, 36, 'gl') + tx(180, 46, 'исходный nums: [3, -1, 2]  (НЕ МЕНЯТЬ)', 'gt small', mid) +
      path('M180 62 V78 M176 72 L180 78 L184 72', 'gm') +
      rect(40, 82, 280, 36, 'gf') + tx(180, 104, 'новый результат result: [3, 2]', 'gi small', mid) +
      tx(180, 138, 'чистая функция без мутации', 'gT', mid) +
      tx(180, 156, 'обходим один массив, чистый результат собираем в другой', 'gt small', mid)
    , 176);
  }

  // c7: Проверка отсортированности (is_sorted)
  function algC7() {
    n = 0;
    return svg(
      rect(30, 48, 52, 32, 'gm') + tx(56, 69, '10', 'gT', mid) +
      rect(92, 48, 52, 32, 'gm') + tx(118, 69, '20', 'gT', mid) +
      rect(154, 48, 52, 32, 'gm') + tx(180, 69, '30', 'gT', mid) +
      rect(216, 48, 52, 32, 'gf') + tx(242, 69, '15', 'gi', mid) +
      rect(278, 48, 52, 32, 'gl') + tx(304, 69, '40', 'gt', mid) +
      path('M196 42 Q211 26 226 42 M220 34 L226 42 L230 36', 'gm') +
      tx(211, 20, '30 > 15 (сбой порядка!)', 'gT small', mid) +
      tx(180, 126, 'валидатор пар соседей return False', 'gT', mid) +
      tx(180, 144, 'достаточно одного нарушения, чтобы признать ряд несортированным', 'gt small', mid)
    , 166);
  }

  // c8: Спам-фильтр (remove_all)
  function algC8() {
    n = 0;
    return svg(
      rect(30, 34, 48, 30, 'gm') + tx(54, 54, 'ok', 'gT', mid) +
      rect(88, 34, 48, 30, 'gl dash') + tx(112, 54, 'spam', 'gt', mid) +
      rect(146, 34, 48, 30, 'gm') + tx(170, 54, 'ok', 'gT', mid) +
      rect(204, 34, 48, 30, 'gl dash') + tx(228, 54, 'spam', 'gt', mid) +
      rect(262, 34, 48, 30, 'gm') + tx(286, 54, 'ok', 'gT', mid) +
      path('M180 70 V86 M176 80 L180 86 L184 80', 'gm') +
      rect(96, 92, 48, 30, 'gf') + tx(120, 112, 'ok', 'gi', mid) +
      rect(154, 92, 48, 30, 'gf') + tx(178, 112, 'ok', 'gi', mid) +
      rect(212, 92, 48, 30, 'gf') + tx(236, 112, 'ok', 'gi', mid) +
      tx(180, 146, 'очищенная лента сообщений', 'gT', mid) +
      tx(180, 164, 'фильтрация if n != spam без изменения оригинального списка', 'gt small', mid)
    , 184);
  }

  // c9 / t2: Бинарный поиск (binary_search)
  function algC9() {
    n = 0;
    return svg(
      tx(30, 30, 'отсортированный реестр (ищем x = 7)', 'gt small') +
      rect(30, 48, 40, 30, 'gl') + tx(50, 68, '1', 'gt', mid) +
      rect(75, 48, 40, 30, 'gl') + tx(95, 68, '3', 'gt', mid) +
      rect(120, 48, 40, 30, 'gm') + tx(140, 68, '5', 'gT', mid) +
      rect(165, 48, 40, 30, 'gf') + tx(185, 68, '7', 'gi', mid) +
      rect(210, 48, 40, 30, 'gm') + tx(230, 68, '9', 'gT', mid) +
      path('M50 84 V94', 'gm') + tx(50, 108, 'low', 'gt small', mid) +
      path('M140 84 V94', 'gm') + tx(140, 108, 'mid', 'gT small', mid) +
      path('M230 84 V94', 'gm') + tx(230, 108, 'high', 'gt small', mid) +
      tx(180, 138, 'бинарное деление: отсекаем 50% базы за шаг', 'gT', mid) +
      tx(180, 156, 'mid = (low + high) // 2  ->  сдвиг границы к центру', 'gt small', mid)
    , 176);
  }

  // c10: Подбор пары под купон скидки (pairs_with_sum)
  function algC10() {
    n = 0;
    return svg(
      tx(40, 30, 'корзина товаров, купон s = 10', 'gt small') +
      rect(40, 46, 50, 32, 'gm') + tx(65, 67, '2', 'gT', mid) +
      rect(100, 46, 50, 32, 'gf') + tx(125, 67, '4', 'gi', mid) +
      rect(160, 46, 50, 32, 'gm') + tx(185, 67, '5', 'gT', mid) +
      rect(220, 46, 50, 32, 'gf') + tx(245, 67, '6', 'gi', mid) +
      path('M125 42 Q185 18 245 42 M240 34 L245 42 L250 36', 'gm') +
      tx(185, 20, '4 + 6 = 10 (купон закрыт!)', 'gT small', mid) +
      tx(180, 120, 'перебор пар i и j (j > i)', 'gT', mid) +
      tx(180, 138, 'каждая пара проверяется ровно один раз без дублей', 'gt small', mid)
    , 160);
  }

  // t3: Инженерный аудит кода
  function algT3() {
    n = 0;
    return svg(
      rect(30, 24, 90, 42, 'gm') + tx(75, 42, '1. Пример', 'gT small', mid) + tx(75, 56, 'прогони в уме', 'gt small', mid) +
      rect(135, 24, 90, 42, 'gm') + tx(180, 42, '2. Границы', 'gT small', mid) + tx(180, 56, 'len - 1', 'gt small', mid) +
      rect(240, 24, 90, 42, 'gf') + tx(285, 42, '3. Крайности', 'gi small', mid) + tx(285, 56, '[], 1 элемент', 'gi small', mid) +
      path('M75 72 H285', 'gl dash') +
      tx(180, 108, 'чек-лист чтения и отладки чужого кода', 'gT', mid) +
      tx(180, 126, 'сначала пойми замысел, затем проверь границы и мутации', 'gt small', mid)
    , 150);
  }

  function lifeConway() {
    n = 0;
    let inner =
      // плечи и туловище
      path('M96 206 Q180 148 264 206', 'gm') +
      path('M156 168 L142 206 M204 168 L218 206', 'gl') +
      // голова
      `<circle ${dc('gm')} cx="180" cy="96" r="52"/>` +
      // волосы
      path('M136 62 Q180 26 224 62', 'gm') +
      // круглые очки
      `<circle ${dc('gm')} cx="157" cy="88" r="14"/>` +
      `<circle ${dc('gm')} cx="203" cy="88" r="14"/>` +
      path('M171 88 H189', 'gm') +
      path('M143 88 H129 M217 88 H231', 'gm') +
      // глаза
      `<circle class="gf f" cx="157" cy="88" r="2.5" style="--i:${n++}"/>` +
      `<circle class="gf f" cx="203" cy="88" r="2.5" style="--i:${n++}"/>` +
      // борода
      path('M150 122 Q180 152 210 122', 'gm') +
      path('M158 128 Q180 146 202 128', 'gl dash') +
      // глайдер летит рядом (подсмотрено у «Жизни»)
      rect(288, 46, 14, 14, 'gf') + rect(302, 60, 14, 14, 'gf') +
      rect(288, 74, 14, 14, 'gf') + rect(302, 74, 14, 14, 'gf') + rect(316, 74, 14, 14, 'gf') +
      path('M286 118 Q312 106 330 82 M326 88 L330 82 L322 80', 'gl dash') +
      // тусклые клетки-звёзды вокруг
      rect(24, 96, 12, 12, 'gl') + rect(44, 140, 12, 12, 'gl') + rect(316, 140, 12, 12, 'gl') +
      tx(180, 232, 'Джон Х. Конвей · 1937–2020', 'gT', mid) +
      tx(180, 246, '«Жизнь» — 1970, Кембридж', 'gt small', mid);
    return svg(inner, 256);
  }

  // petHatch: яйцо с трещиной -> питомец (группа центрирована: центры 96/264, середина 180)
  function petHatch() {
    n = 0;
    return svg(
      // яйцо
      `<ellipse ${dc('gm')} cx="96" cy="94" rx="36" ry="50"/>` +
      path('M90 110 l9 -11 7 7 9 -12 7 5', 'gm') +
      tx(96, 168, 'яйцо', 'gt small', mid) +
      // стрелка вылупления (симметричные зазоры: 14px к яйцу, 16px к питомцу)
      path('M146 94 H202 M196 88 L204 94 L196 100', 'gm') +
      // питомец: капля с глазами и улыбкой
      `<ellipse ${dc('gm')} cx="264" cy="96" rx="44" ry="40"/>` +
      path('M264 56 q6 -12 14 -14', 'gl') +
      `<circle class="gf f" cx="248" cy="90" r="4" style="--i:${n++}"/>` +
      `<circle class="gf f" cx="280" cy="90" r="4" style="--i:${n++}"/>` +
      path('M256 106 q8 9 16 0', 'gm') +
      tx(264, 168, 'питомец', 'gt small', mid) +
      tx(180, 200, 'словарь питомца: имя + три стата по 50', 'gT small', mid)
    , 218);
  }

  // petCare: статы 0..100 с капом (колонки центрированы: 89..271, середина 180)
  function petCare() {
    n = 0;
    return svg(
      tx(180, 24, 'статы питомца: 0..100', 'gt small', mid) +
      path('M77 60 H283', 'gl dash') +
      tx(180, 52, 'кап 100', 'gt small', mid) +
      // сытость
      rect(89, 60, 42, 110, 'gm') + rect(89, 106, 42, 64, 'gf') +
      tx(110, 190, 'сытость', 'gt small', mid) +
      // настроение
      rect(159, 60, 42, 110, 'gm') + rect(159, 92, 42, 78, 'gf') +
      tx(180, 190, 'настроение', 'gt small', mid) +
      // энергия
      rect(229, 60, 42, 110, 'gm') + rect(229, 122, 42, 48, 'gf') +
      tx(250, 190, 'энергия', 'gt small', mid) +
      tx(180, 214, 'кормление: +25 к сытости, но не выше 100', 'gT small', mid)
    , 232);
  }

  // petDay: суточный цикл — ночь и день с ценой каждого
  function petDay() {
    n = 0;
    return svg(
      // дуга цикла: ночь ⇄ день
      path('M124 54 Q180 26 236 54', 'gm') +
      path('M131 45 L121 55 L136 61', 'gm') +
      path('M229 52 L239 54 L230 61', 'gm') +
      // ночь: луна
      `<circle ${dc('gm')} cx="80" cy="70" r="20"/>` +
      tx(80, 77, 'z', 'gT', mid) +
      tx(80, 112, 'ночь', 'gT small', mid) +
      tx(80, 130, 'энергия +15', 'gT small', mid) +
      // день: солнце с лучами (зазор 5px от диска, лучи не касаются подписи)
      `<circle ${dc('gm')} cx="280" cy="70" r="16"/>` +
      path('M280 49 v-8 M280 91 v8 M259 70 h-8 M301 70 h8 M265 55 l-7 -7 M295 55 l7 -7 M265 85 l-7 7 M295 85 l7 7', 'gl') +
      tx(280, 112, 'день', 'gT small', mid) +
      tx(280, 130, 'сытость −5', 'gT small', mid) +
      path('M24 152 H336', 'gl dash') +
      tx(180, 172, 'голодная сытость (< 30) — настроение −3', 'gT small', mid)
    , 192);
  }

  // ---------- Реестр ----------

  function matrixCells(rows, x, y, selected) {
    return rows.map((row, i) => row.map((value, j) => {
      const active = selected(i, j);
      const left = x + j * 36, top = y + i * 32;
      return rect(left, top, 36, 32, active ? 'gf' : 'gm') +
        tx(left + 18, top + 21, value, active ? 'gi' : 'gT', mid);
    }).join('')).join('');
  }

  function matrixRead(mode) {
    n = 0;
    const rows = [[8, 3, 5], [4, 9, 2]];
    const column = mode === 'column', totals = mode === 'totals';
    const selected = (i, j) => column ? j === 1 : totals ? i === 0 : i === 1 && j === 2;
    return svg(
      [0, 1, 2].map(j => tx(98 + 36 * j, 50, 'j=' + j, 'gt', mid)).join('') +
      [0, 1].map(i => tx(70, 81 + 32 * i, 'i=' + i, 'gt', end)).join('') +
      matrixCells(rows, 80, 60, selected) +
      path('M194 92 H222 l-5 -4 M222 92 l-5 4', 'gm') +
      tx(277, 97, column ? '[3, 9]' : totals ? '8+3+5' : 'a[1][2]', 'gT', mid) +
      tx(180, 158, column ? 'j = 1' : totals ? 'sum(a[0]) = 16' : 'a[1] → [4, 9, 2]', 'gt', mid), 180);
  }

  function matrixAlias() {
    n = 0;
    return svg(tx(80, 50, 'panel[0]', 'gT', mid) + tx(80, 120, 'panel[1]', 'gT', mid) +
      path('M120 45 H140 L163 80 H180 M120 115 H140 L163 80', 'gm') +
      matrixCells([[0, 0, 1]], 185, 64, (_, j) => j === 2) +
      tx(180, 158, 'panel[0] is panel[1]', 'gt', mid), 180);
  }

  function matrixTranspose() {
    n = 0;
    return svg(tx(86, 36, '2 × 3', 'gt', mid) + tx(263, 36, '3 × 2', 'gt', mid) +
      matrixCells([[1, 2, 3], [4, 5, 6]], 32, 68, (_, j) => j === 1) +
      path('M154 100 H201 l-6 -5 M201 100 l-6 5', 'gm') +
      matrixCells([[1, 4], [2, 5], [3, 6]], 228, 52, i => i === 1) +
      tx(180, 174, 'a[i][j] → result[j][i]', 'gt', mid), 195);
  }

  const REGISTRY = {
    l1_matrices: { draw: () => matrixRead('cell'), cap: 'первый индекс выбирает строку, второй — ячейку' },
    l1_mat_predict: { draw: () => matrixRead('cell'), cap: 'читай индексы слева направо' },
    l1_mat_column: { draw: () => matrixRead('column'), cap: 'номер столбца постоянен при переходе между строками' },
    l1_mat_totals: { draw: () => matrixRead('totals'), cap: 'каждая строка даёт одну сумму' },
    l1_mat_grid: { draw: matrixAlias, cap: 'две ссылки ведут к одному ряду ламп' },
    l1_mat_transpose: { draw: matrixTranspose, cap: 'выделенный столбец становится строкой' },
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
    'l1_nested_structures': { draw: nested, cap: 'вложенность: к значению идём по шагам — индекс, затем ключ' },
    'l1_exceptions': { draw: exceptions, cap: 'try/except: ошибка перехватывается — вместо краша выполняется except' },
    'l1_code_style': { draw: codeStyle, cap: 'PEP 8: отступ 4 пробела, snake_case, пробелы вокруг операторов' },
    'petHatch': { draw: petHatch, cap: 'вылупление: словарь питомца разламывает скорлупу' },
    'petCare':  { draw: petCare,  cap: 'статы питомца 0..100: кормление с капом на сотне' },
    'petDay':   { draw: petDay,   cap: 'суточный такт: ночь копит энергию, день тратит сытость' },
    'l2_algorithms': { draw: algorithms, cap: 'практикум: ранний выход в поиске, слияние двумя указателями, максимум скользящего окна' },
    'l2_alg_t1':     { draw: algT1,      cap: 'аккумулятор, ранний выход и значение по умолчанию' },
    'l2_alg_q1':     { draw: algQ1,      cap: 'инвариант поиска: ранний выход против полного обхода' },
    'l2_alg_p1':     { draw: algP1,      cap: 'трассировка аккумулятора total += n на каждом шаге' },
    'l2_alg_p2':     { draw: algP2,      cap: 'ранний выход: остановка на первом совпадении' },
    'l2_alg_c1':     { draw: algC1,      cap: 'поиск первой ошибки: обход лога со стрелкой i и ранним выходом' },
    'l2_alg_c2':     { draw: algC2,      cap: 'датчик аномалий: подсчёт значений выше критического порога limit' },
    'l2_alg_q2':     { draw: algQ2,      cap: 'структура поиска: возврат по умолчанию строго после цикла' },
    'l2_alg_p3':     { draw: algP3,      cap: 'вложенные циклы: сборка строк двумерной сетки' },
    'l2_alg_c3':     { draw: algC3,      cap: 'префиксные суммы: график баланса транзакций шаг за шагом' },
    'l2_alg_c4':     { draw: algC4,      cap: 'слияние лент: два указателя i и j собирают единую хронологию' },
    'l2_alg_p4':     { draw: algP4,      cap: 'трассировка слияния: выбор меньшего элемента на каждом шаге' },
    'l2_alg_c5':     { draw: algC5,      cap: 'пагинация каталога: нарезка списка на страницы по k элементов' },
    'l2_alg_c6':     { draw: algC6,      cap: 'скользящее окно: пиковый FPS за интервал в k секунд' },
    'l2_alg_f1':     { draw: algF1,      cap: 'починка диапазона: индекс не должен выходить за len - 1' },
    'l2_alg_f2':     { draw: algF2,      cap: 'чистая фильтрация: собираем новый список, не меняя оригинал' },
    'l2_alg_t2':     { draw: algT2,      cap: 'логарифмическая скорость: бинарное деление диапазона пополам' },
    'l2_alg_c7':     { draw: algC7,      cap: 'валидатор хронологии: проверка порядка между парами соседей' },
    'l2_alg_c8':     { draw: algC8,      cap: 'спам-фильтр: удаление запрещённых ID без мутации базы' },
    'l2_alg_c9':     { draw: algC9,      cap: 'бинарный поиск: сдвиг границ low/high к среднему mid' },
    'l2_alg_c10':    { draw: algC10,     cap: 'подбор пары: два товара с суммой, равной купону s' },
    'l2_alg_t3':     { draw: algT3,      cap: 'инженерный аудит: проверка инвариантов и крайних случаев' },
    'lifeNeighbors': { draw: lifeNeighbors, cap: 'окрестность Мура: 8 направлений вокруг клетки (dx, dy)' },
    'lifeRules':     { draw: lifeRules,     cap: 'правило B3/S23: рождение ровно при 3, жизнь при 2 или 3' },
    'lifeConway':    { draw: lifeConway,    cap: 'Джон Х. Конвей (1937–2020): математик Кембриджа, придумал «Жизнь» в 1970 году' },
    'lifePatterns':  { draw: lifePatterns,  cap: 'архетипы Alife-System: натюрморты, осцилляторы и космические корабли' },
    'l2_io_input':   { draw: ioStream,      cap: 'потоковый ввод: передача строк через stdin в input() и вывод через print()' },
    'l2_io_t1':      { draw: ioStream,      cap: 'архитектура stdin: строки поступают из входного потока последовательно' },
    'l2_io_q1':      { draw: ioStream,      cap: 'тип данных input(): всегда возвращает строку str' },
    'l2_io_p1':      { draw: ioStream,      cap: 'последовательное чтение: первый вызов берёт строку 1, второй — строку 2' },
    'l2_io_c1':      { draw: ioStream,      cap: 'эхо-логгер: чтение stdin и добавление префикса к выводу' },
    'l2_io_t2':      { draw: ioStream,      cap: 'split(): разбиение одной строки ввода на список подстрок по разделителю' },
    'l2_io_q2':      { draw: ioStream,      cap: 'конкатенация vs сложение: str + str склеивает, int + int складывает' },
    'l2_io_p2':      { draw: ioStream,      cap: 'разбор параметров: считывание и преобразование списка элементов' },
    'l2_io_c2':      { draw: ioStream,      cap: 'многострочный ввод: считывание нескольких чисел из разных строк' },
    'l2_io_c3':      { draw: ioStream,      cap: 'парсер конфигурации: разделение по двоеточию через split(":")' },
    'l2_io_c4':      { draw: ioStream,      cap: 'обработка EOFError: чтение до завершения потока данных в цикле' }
  };

  // Схема потокового ввода (stdin -> input() -> программа -> stdout)
  function ioStream() {
    n = 0;
    return svg(
      rect(20, 40, 90, 48, 'gm') + tx(65, 62, 'stdin (ввод)', 'gT small', mid) + tx(65, 78, '"строка\\n"', 'gt small', mid) +
      path('M110 64 H145 M139 58 L145 64 L139 70', 'gm') +
      rect(145, 34, 100, 60, 'gf') + tx(195, 60, 'input()', 'gi small', mid) + tx(195, 76, '-> str', 'gi small', mid) +
      path('M245 64 H280 M274 58 L280 64 L274 70', 'gm') +
      rect(280, 40, 90, 48, 'gm') + tx(325, 62, 'stdout (вывод)', 'gT small', mid) + tx(325, 78, 'print(...)', 'gt small', mid) +
      tx(195, 125, 'поток stdin передаёт строки программе', 'gT', mid) +
      tx(195, 145, 'каждый вызов input() читает ровно одну строку до перевода строки', 'gt small', mid)
    , 165);
  }

  // try/except: ошибка перехватывается, программа не падает
  function exceptions() {
    n = 0;
    return svg(
      // try-блок: строка, которая падает
      rect(90, 22, 180, 44, 'gm') +
      tx(180, 40, 'try:', 'gT', mid) +
      tx(180, 58, 'n = int("abc")', 'gt small', mid) +
      // ошибка вылетает из try
      path('M180 66 V84 M174 78 L180 84 L186 78', 'gm') +
      tx(192, 80, 'ValueError', 'gT small') +
      // except-блок: точка перехвата (инверсия)
      rect(90, 90, 180, 44, 'gf') +
      tx(180, 108, 'except ValueError:', 'gi small', mid) +
      tx(180, 124, 'ловим и обрабатываем', 'gi small', mid) +
      // после перехвата выполнение идёт дальше
      path('M180 134 V150 M174 144 L180 150 L186 144', 'gm') +
      tx(180, 168, 'программа продолжается', 'gT', mid) +
      tx(180, 186, 'без try та же ошибка уронила бы программу', 'gt small', mid)
    , 200);
  }

  // Стиль кода (PEP 8): контраст «как не надо» / «как надо» + чипы правил
  function codeStyle() {
    n = 0;
    return svg(
      tx(24, 24, 'как не надо', 'gt small') +
      rect(24, 32, 150, 72, 'gl dash') +
      tx(34, 52, 'def G(k):', 'gt') +
      tx(44, 72, 'return k*2', 'gt') +
      tx(34, 92, 'G(3)', 'gt') +
      tx(99, 122, 'не проходит ревью', 'gt small', mid) +
      tx(186, 24, 'как надо (PEP 8)', 'gt small') +
      rect(186, 32, 150, 72, 'gm') +
      tx(196, 52, 'def double(k):', 'gT') +
      tx(216, 72, 'return k * 2', 'gT') +
      tx(196, 92, 'double(3)', 'gt small') +
      tx(261, 122, 'проходит ревью', 'gT small', mid) +
      // чипы-правила
      rect(24, 140, 96, 28, 'gm') + tx(72, 158, '4 пробела', 'gT small', mid) +
      rect(130, 140, 106, 28, 'gm') + tx(183, 158, 'snake_case', 'gT small', mid) +
      rect(246, 140, 90, 28, 'gm') + tx(291, 158, 'ясные имена', 'gT small', mid)
    , 188);
  }

  function draw(topicId) {
    const g = REGISTRY[topicId];
    return g ? g.draw() : '';
  }

  function render(topicId) {
    const g = REGISTRY[topicId];
    if (!g) return '';
    return `<div class="visual-canvas">${g.draw()}</div>` +
           `<figcaption class="visual-cap"><span>схема</span>${g.cap}</figcaption>`;
  }

  function caption(topicId) {
    return REGISTRY[topicId] ? REGISTRY[topicId].cap : '';
  }

  window.Glyphs = { render, draw, caption };

  window.Vkat.define('glyphs', window.Glyphs);
})();
