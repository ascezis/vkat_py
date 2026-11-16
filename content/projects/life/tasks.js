/**
 * вкат.py — Пет-проект «Игра «Жизнь» Конвея» (модуль life)
 *
 * Отдельный модуль контента (вне COURSE_TOPICS/COURSE_STAGES): собственный
 * экран #screen-life, канвас-симуляция и 4-шаговая прогрессия «Сломанный мир».
 *
 * Тесты шагов — в контракте TaskTest (docs/types.d.ts): { call, returns, hidden }.
 * Сетка передаётся инлайном в выражении вызова, поэтому каждый тест
 * самодостаточен и исполняется штатным бутстрапом чекера (#vkat-checker-python).
 * Ориентация: grid[y][x] — y номер строки, x номер столбца.
 *
 * worldMode — режим JS-зеркала симуляции (app/life-renderer.js):
 *   'frozen'  — мир застыл: колония есть, тик не происходит (шаг 1);
 *   'chaos'   — случайный шум: клетки мерцают без законов (шаги 2-3 до сдачи);
 *   'conway'  — канонический B3/S23 (после сдачи шага 3);
 *   'sandbox' — выбор вселенной правил + пресеты (шаг 4).
 * JS-зеркало НИКОГДА не исполняет код ученика — эквивалентность принятого
 * кода канону доказана тестами шага; настоящий Python доступен кнопкой
 * «Испытать на поле» через скаффолд #vkat-life-scaffold.
 */

(function (window) {
  'use strict';

  const LIFE_MODULE = {
    id: 'life',
    title: 'Пет-проект: Игра «Жизнь»',
    kicker: 'клеточные автоматы',
    description: 'Оживи вселенную Конвея за 4 шага: границы, окрестность Мура, законы B3/S23 и альтернативные миры. Каждое решение исцеляет сломанный мир на холсте.',
    screen: 'life',
    steps: [
      {
        id: 'life_step_1',
        title: 'Шаг 1: Сенсор границ мира',
        glyph: 'lifeNeighbors',
        worldMode: 'frozen',
        narrative: 'Вселенная Конвея замкнута в сетке 50x50. Сейчас мир застыл: колония на холсте не умирает и не рождается, потому что любая попытка заглянуть за горизонт (отрицательные координаты или координата за краем поля) роняет симулятор с IndexError. Напиши безопасный сенсор — и мир начнёт дышать.',
        taskHtml: '<p>Напиши функцию <code>is_alive(grid, x, y)</code>, которая возвращает <code>True</code>, только если ячейка жива. Правила:</p><ul><li><code>grid</code> — матрица, доступ к ячейке: <code>grid[y][x]</code> (y — номер строки, x — номер столбца);</li><li>живая ячейка — <code>1</code>;</li><li>если координаты выходят за пределы поля (x или y меньше 0 либо больше размера матрицы) — возвращай <code>False</code>, а не ошибку.</li></ul>',
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
          'Сначала проверь границы: 0 <= x < len(grid[0]) и 0 <= y < len(grid). Если хоть одно условие нарушено — сразу return False. И только потом смотри значение grid[y][x].',
          { code: 'def is_alive(grid, x, y):\n    if x < 0 or y < 0 or y >= len(grid) or x >= len(grid[0]):\n        return ___\n    return grid[y][x] == ___' },
          { code: 'def is_alive(grid, x, y):\n    if x < 0 or y < 0 or y >= len(grid) or x >= len(grid[0]):\n        return False\n    return grid[y][x] == 1' }
        ],
        improveTip: 'Проверка границ через цепочку or короче и читается слева направо: сначала «выход в минус», потом «выход за размер».',
        successMessage: 'Сенсор границ работает: мир больше не падает при взгляде за горизонт!'
      },
      {
        id: 'life_step_2',
        title: 'Шаг 2: Окрестность Мура',
        glyph: 'lifeNeighbors',
        worldMode: 'chaos',
        narrative: 'Мир задышал, но клетки глухи друг к другу: на холсте хаотичный шум, каждая клетка мерцает сама по себе. Судьбу клетки решают ровно 8 её соседей — по горизонтали, вертикали и диагоналям. Научи клетки считать собратьев.',
        taskHtml: '<p>Напиши функцию <code>count_neighbors(grid, x, y)</code>, которая опрашивает все 8 направлений вокруг <code>(x, y)</code> через <code>is_alive()</code> и возвращает число живых соседей (целое от 0 до 8).</p><p>Окрестность Мура — это смещения <code>(dx, dy)</code> от −1 до 1, кроме нулевого смещения (сама клетка не свой сосед).</p>',
        initialCode: 'def count_neighbors(grid, x, y):\n    # Опроси 8 соседей через is_alive и верни сумму\n    pass\n',
        tests: [
          { call: 'count_neighbors([[0, 0, 0], [0, 1, 0], [0, 0, 0]], 1, 1)', returns: 0 },
          { call: 'count_neighbors([[1, 1, 1], [1, 0, 1], [1, 1, 1]], 1, 1)', returns: 8 },
          { call: 'count_neighbors([[1, 1], [1, 0]], 0, 0)', returns: 2 },
          { call: 'count_neighbors([[1, 0, 1], [0, 1, 0], [1, 0, 1]], 1, 1)', returns: 4, hidden: true },
          { call: 'count_neighbors([[0, 1], [1, 0]], 0, 0)', returns: 2, hidden: true }
        ],
        hints: [
          'Двойной цикл: for dy in range(-1, 2) и for dx in range(-1, 2). Пропусти пару (0, 0) — она указывает на саму клетку. Для каждого смещения вызови is_alive(grid, x + dx, y + dy) и прибавь результат к счётчику.',
          { code: 'def count_neighbors(grid, x, y):\n    count = 0\n    for dy in range(-1, 2):\n        for dx in range(-1, 2):\n            if dx == 0 and dy == 0:\n                continue\n            count += is_alive(grid, x + ___, y + ___)\n    return count' },
          { code: 'def count_neighbors(grid, x, y):\n    count = 0\n    for dy in range(-1, 2):\n        for dx in range(-1, 2):\n            if dx == 0 and dy == 0:\n                continue\n            count += is_alive(grid, x + dx, y + dy)\n    return count' }
        ],
        improveTip: 'is_alive уже знает про границы поля — поэтому count_neighbors можно не проверять края: угловая клетка просто «не досчитает» несуществующих соседей.',
        successMessage: 'Клетки видят окрестность Мура: 8 направлений опрошены верно!'
      },
      {
        id: 'life_step_3',
        title: 'Шаг 3: Законы Конвея (B3/S23)',
        glyph: 'lifeRules',
        worldMode: 'chaos',
        narrative: 'Момент истины. Клетки видят соседей, но законов жизни ещё нет: любая колония гибнет в первый же кадр. Сформулируй правила рождения и выживания — и мир исцелится.',
        taskHtml: '<p>Реализуй функцию <code>should_live(alive, neighbors)</code>:</p><ul><li>клетка жива (<code>alive == True</code>) — выживает при <code>2</code> или <code>3</code> соседях; гибнет от одиночества (&lt; 2) или перенаселения (&gt; 3);</li><li>клетка мертва (<code>alive == False</code>) — оживает ровно при <code>3</code> соседях;</li><li>в остальных случаях — <code>False</code>.</li></ul><p>Успешная сдача оживит вселенную: это законы B3/S23.</p>',
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
          'Раздели два случая. Живая клетка: выживает, если neighbors in (2, 3). Мёртвая: оживает, только если neighbors == 3. Удобно одним выражением: neighbors == 3 or (alive and neighbors == 2).',
          { code: 'def should_live(alive, neighbors):\n    if neighbors == 3:\n        return ___\n    if alive and neighbors == ___:\n        return True\n    return False' },
          { code: 'def should_live(alive, neighbors):\n    if neighbors == 3:\n        return True\n    if alive and neighbors == 2:\n        return True\n    return False' }
        ],
        improveTip: 'Правило B3/S23 записывается одним выражением: return neighbors == 3 or (alive and neighbors == 2). Логика «рождается при 3» общая для живых и мёртвых.',
        successMessage: 'Мир исцелён: законы Конвея B3/S23 приведены в действие!'
      },
      {
        id: 'life_step_4',
        title: 'Шаг 4: Хакер правил вселенной',
        glyph: 'lifePatterns',
        worldMode: 'sandbox',
        narrative: 'Ты оживил вселенную Конвея, но Конвей — лишь одна из сотен возможных вселенных. Параметризуй законы через списки правил birth/survival — и открой песочницу с пресетами и альтернативными физиками.',
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
        improveTip: 'Конвей B3/S23, HighLife B36/S23 и Seeds B2/S — три вселенных, отличающихся только двумя списками. Один валидатор описывает их все.',
        successMessage: 'Вселенная параметризована: в песочнице открыты альтернативные физики!'
      }
    ]
  };

  window.LIFE_MODULE = LIFE_MODULE;
})(window);
