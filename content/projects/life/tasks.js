/**
 * вкат.py — Пет-проект «Alife-System» (модуль life)
 *
 * Отдельный модуль контента (вне COURSE_TOPICS/COURSE_STAGES): собственный
 * экран #screen-life, канвас-симуляция и 4-шаговая прогрессия «Сломанный мир».
 *
 * ПЕДАГОГИЧЕСКАЯ КРИВАЯ ОБУЧЕНИЯ (от простого к сложному):
 *   Шаг 1: should_live(alive, neighbors) — чистая логика if/else без матриц!
 *   Шаг 2: is_alive(grid, x, y)          — безопасный сенсор границ (купол от IndexError)
 *   Шаг 3: count_neighbors(grid, x, y)   — био-радар 8 направлений Мура через is_alive
 *   Шаг 4: step_rules(...)               — универсальная матрица миров (песочница)
 *
 * worldMode — режим JS-зеркала симуляции (app/life-renderer.js):
 *   'frozen'  — мир застыл: колония есть, законов нет (шаг 1);
 *   'chaos'   — случайный шум: клетки мерцают без связей (шаги 2-3);
 *   'conway'  — канонический B3/S23 (после сдачи шага 3, летит Глайдер);
 *   'sandbox' — выбор вселенной правил + библиотека пресетов (шаг 4).
 */

(function (window) {
  'use strict';

  /** @type {LifeModule} */
  const LIFE_MODULE = {
    id: 'life',
    title: 'Пет-проект: Alife-System',
    kicker: 'клеточные автоматы',
    description: 'Оживи вселенную Alife-System за 4 шага: искра жизни B3/S23, сенсор границ, био-радар Мура и пульт Создателя. Каждое решение исцеляет сломанный мир на холсте. Шаги 2–4 используют вложенные списки. Лучше проходить после темы «Вложенные структуры».',
    screen: 'life',
    steps: [
      {
        id: 'life_step_1',
        title: 'Шаг 1: Искра Жизни (B3/S23)',
        glyph: 'lifeRules',
        worldMode: 'frozen',
        narrative: 'Вводный тур показал тебе магию: 0–1 сосед — смерть от одиночества, 2–3 соседа — жизнь, ровно 3 соседа — рождение новой клетки. Запрограммируй законы жизни и смерти для одной клетки! Никаких двумерных списков: только статус клетки alive (True/False) и число её соседей neighbors (от 0 до 8). Напиши эти правила — и мир сделает первый вдох.',
        taskHtml: '<p>Реализуй функцию <code>should_live(alive, neighbors)</code>:</p><ul><li><b>Рождение:</b> мёртвая клетка (<code>alive == False</code>) оживает, если у неё ровно <code>3</code> соседа;</li><li><b>Выживание:</b> живая клетка (<code>alive == True</code>) остаётся жить, если у неё <code>2</code> или <code>3</code> соседа;</li><li><b>Смерть:</b> во всех остальных случаях (одиночество &lt; 2 или перенаселение &gt; 3) — возвращай <code>False</code>.</li></ul><p>Это классический закон Конвея <b>B3/S23</b> (Born 3 / Survive 2, 3).</p>',
        initialCode: 'def should_live(alive, neighbors):\n    # Рождение при 3 соседях, выживание при 2 или 3\n    pass\n',
        tests: [
          { call: 'should_live(False, 3)', returns: true },
          { call: 'should_live(False, 2)', returns: false },
          { call: 'should_live(True, 2)', returns: true },
          { call: 'should_live(True, 3)', returns: true },
          { call: 'should_live(True, 1)', returns: false },
          { call: 'should_live(True, 4)', returns: false, hidden: true },
          { call: 'should_live(True, 8)', returns: false, hidden: true },
          { call: 'should_live(False, 0)', returns: false, hidden: true }
        ],
        hints: [
          'Раздели два случая. Если neighbors == 3 — клетка будет жить (True) независимо от того, была она жива или нет. Если alive и neighbors == 2 — тоже True. В остальных случаях — False.',
          { code: 'def should_live(alive, neighbors):\n    if neighbors == 3:\n        return True\n    if alive and neighbors == ___:\n        return True\n    return False' },
          { code: 'def should_live(alive, neighbors):\n    if neighbors == 3:\n        return True\n    if alive and neighbors == 2:\n        return True\n    return False' }
        ],
        improveTip: 'Правило B3/S23 можно записать одной строкой: return neighbors == 3 or (alive and neighbors == 2).',
        successMessage: 'Искра Жизни вспыхнула! Клетки знают свои законы — мир пробудился от ледяного сна.'
      },
      {
        id: 'life_step_2',
        title: 'Шаг 2: Сенсор границ мира',
        glyph: 'lifeNeighbors',
        worldMode: 'chaos',
        narrative: 'Мир задышал, но клетки не видят дальше своего носа. Чтобы клетка узнала свою судьбу, нужно сосчитать её соседей. Но мир замкнут в сетке 50x50. Если клетка стоит у края, попытка заглянуть за горизонт (отрицательные координаты или x/y за границей поля) роняет симулятор с ошибкой IndexError. Создай защитный сенсор — силовой купол периметра.',
        taskHtml: '<p>Напиши функцию <code>is_alive(grid, x, y)</code>, которая возвращает <code>True</code>, только если клетка лежит внутри поля и жива. Правила:</p><ul><li><code>grid</code> — матрица, доступ к ячейке: <code>grid[y][x]</code> (y — строка, x — столбец);</li><li>живая клетка — <code>1</code>;</li><li>если координаты выходят за пределы поля (x или y меньше 0 либо больше или равны размеру матрицы) — возвращай <code>False</code>, защищая от IndexError.</li></ul>',
        initialCode: 'def is_alive(grid, x, y):\n    # Верни True, если ячейка в пределах поля и жива,\n    # иначе False. За границей поля клеток нет.\n    pass\n',
        tests: [
          { call: 'is_alive([[0, 1], [0, 0]], 1, 0)', returns: true },
          { call: 'is_alive([[0, 1], [0, 0]], 0, 0)', returns: false },
          { call: 'is_alive([[0, 1], [0, 0]], 2, 0)', returns: false, hidden: true },
          { call: 'is_alive([[0, 1], [0, 0]], 0, 2)', returns: false, hidden: true },
          { call: 'is_alive([[1]], -1, 0)', returns: false },
          { call: 'is_alive([[1]], 0, -1)', returns: false, hidden: true }
        ],
        hints: [
          'Сначала проверь границы: 0 <= x < len(grid[0]) и 0 <= y < len(grid). Если хоть одно условие нарушено — сразу return False. И только потом читай grid[y][x].',
          { code: 'def is_alive(grid, x, y):\n    if x < 0 or y < 0 or y >= len(grid) or x >= len(grid[0]):\n        return ___\n    return grid[y][x] == ___' },
          { code: 'def is_alive(grid, x, y):\n    if x < 0 or y < 0 or y >= len(grid) or x >= len(grid[0]):\n        return False\n    return grid[y][x] == 1' }
        ],
        improveTip: 'Проверка границ через or короче и выполняется слева направо: если координата ушла в минус, Python не полезет в матрицу и не упадёт.',
        successMessage: 'Силовой периметр установлен: сенсор границ надёжно защищает симулятор от IndexError!'
      },
      {
        id: 'life_step_3',
        title: 'Шаг 3: Био-радар 8 направлений',
        glyph: 'lifeNeighbors',
        worldMode: 'chaos',
        narrative: 'Кульминация! У нас есть законы жизни should_live и защитный сенсор is_alive. Осталось дать колонии глаза: научи клетки опрашивать всех 8 соседей Мура вокруг себя (сверху, снизу, по бокам и диагоналям). Как только радар заработает, из хаоса родится гармония — и полетит легендарный Глайдер!',
        taskHtml: '<p>Напиши функцию <code>count_neighbors(grid, x, y)</code>, которая опрашивает все 8 направлений вокруг <code>(x, y)</code> через <code>is_alive()</code> и возвращает целое число живых соседей (от 0 до 8).</p><p>Окрестность Мура — это смещения <code>dx</code> и <code>dy</code> от −1 до 1, исключая пару <code>(0, 0)</code> (сама клетка не является своим соседом).</p>',
        initialCode: 'def count_neighbors(grid, x, y):\n    # Опроси 8 соседей через is_alive и верни сумму\n    pass\n',
        tests: [
          { call: 'count_neighbors([[0, 0, 0], [0, 1, 0], [0, 0, 0]], 1, 1)', returns: 0 },
          { call: 'count_neighbors([[1, 1, 1], [1, 0, 1], [1, 1, 1]], 1, 1)', returns: 8 },
          { call: 'count_neighbors([[1, 1], [1, 0]], 0, 0)', returns: 2 },
          { call: 'count_neighbors([[1, 0, 1], [0, 1, 0], [1, 0, 1]], 1, 1)', returns: 4, hidden: true },
          { call: 'count_neighbors([[0, 1], [1, 0]], 0, 0)', returns: 2, hidden: true }
        ],
        hints: [
          'Двойной цикл: for dy in range(-1, 2) и for dx in range(-1, 2). Пропусти пару (0, 0) — это сама клетка. Для каждого смещения вызови is_alive(grid, x + dx, y + dy) и прибавь результат к счётчику.',
          { code: 'def count_neighbors(grid, x, y):\n    count = 0\n    for dy in range(-1, 2):\n        for dx in range(-1, 2):\n            if dx == 0 and dy == 0:\n                continue\n            count += is_alive(grid, x + ___, y + ___)\n    return count' },
          { code: 'def count_neighbors(grid, x, y):\n    count = 0\n    for dy in range(-1, 2):\n        for dx in range(-1, 2):\n            if dx == 0 and dy == 0:\n                continue\n            count += is_alive(grid, x + dx, y + dy)\n    return count' }
        ],
        improveTip: 'Поскольку функция is_alive уже защищает от выхода за границы, в count_neighbors не нужно думать о краях карты — угловые клетки просто безопасно получат False.',
        successMessage: 'Био-радар активен: хаос отступил, и вселенная Конвея ожила!'
      },
      {
        id: 'life_step_4',
        title: 'Шаг 4: Хакер правил вселенной',
        glyph: 'lifePatterns',
        worldMode: 'sandbox',
        narrative: 'Ты оживил вселенную Alife-System, но B3/S23 — лишь одна из сотен возможных вселенных. Параметризуй законы через списки правил birth/survival — и открой песочницу с пресетами и альтернативными физиками.',
        taskHtml: '<p>Напиши универсальный валидатор <code>step_rules(alive, neighbors, birth, survival)</code>, где <code>birth</code> и <code>survival</code> — списки чисел соседей:</p><ul><li>мёртвая клетка оживает, если <code>neighbors</code> входит в <code>birth</code>;</li><li>живая клетка выживает, если <code>neighbors</code> входит в <code>survival</code>;</li><li>иначе — <code>False</code>.</li></ul><p>Проверь свой валидатор на альтернативных вселенных в тестах: HighLife (B36/S23) и Seeds (B2/S — выживания нет вовсе).</p>',
        initialCode: 'BIRTH = [3]\nSURVIVAL = [2, 3]\n\ndef step_rules(alive, neighbors, birth, survival):\n    # Мёртвая оживает при neighbors in birth,\n    # живая выживает при neighbors in survival\n    pass\n',
        tests: [
          { call: 'step_rules(False, 3, [3], [2, 3])', returns: true },
          { call: 'step_rules(True, 2, [3], [2, 3])', returns: true },
          { call: 'step_rules(True, 1, [3], [2, 3])', returns: false, hidden: true },
          { call: 'step_rules(False, 6, [3, 6], [2, 3])', returns: true },
          { call: 'step_rules(False, 2, [2], [])', returns: true },
          { call: 'step_rules(True, 2, [2], [])', returns: false },
          { call: 'step_rules(True, 3, [3, 6], [2, 3])', returns: true, hidden: true }
        ],
        hints: [
          'Оператор in проверяет вхождение в список: neighbors in birth. Сначала случай рождения (мертвая клетка), затем выживание (живая), иначе return False.',
          { code: 'def step_rules(alive, neighbors, birth, survival):\n    if not alive and neighbors in ___:\n        return True\n    if alive and neighbors in ___:\n        return True\n    return False' },
          { code: 'def step_rules(alive, neighbors, birth, survival):\n    if not alive and neighbors in birth:\n        return True\n    if alive and neighbors in survival:\n        return True\n    return False' }
        ],
        improveTip: 'Канон B3/S23, HighLife B36/S23 и Seeds B2/S — три вселенных, отличающихся только двумя списками. Один валидатор описывает их все.',
        successMessage: 'Вселенная параметризована: в песочнице открыты альтернативные физики!'
      }
    ]
  };

  window.LIFE_MODULE = LIFE_MODULE;
})(window);
