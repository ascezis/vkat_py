/**
 * вкат.py — Экран пет-проекта «Игра «Жизнь» Конвея» (модуль life)
 *
 * Живая интерактивная лаборатория: 50x50 Canvas, 60fps, «Сломанный мир».
 *
 * Архитектурные правила (см. FEATURES/PET-PROJECT-GAME-OF-LIFE-SPEC.md):
 *   1. JS-зеркало НИКОГДА не исполняет код ученика. Оно рисует канонические
 *      вселенные: 'frozen'/'chaos' (сломанные режимы), 'conway' (B3/S23),
 *      'sandbox' (выбор вселенной). Эквивалентность принятого кода канону
 *      доказана тестами шага через VkatChecker.
 *   2. Настоящий Python — только кнопкой «Испытать на поле»: скаффолд
 *      #vkat-life-scaffold + принятый код шагов 1-3 → CodeChecker.runCode()
 *      → JSON-снапшот сетки из stdout → канвас.
 *   3. Прогресс: completed[] профиля (ids life_step_1..4) через VkatApp,
 *      черновики кода — drafts[life_step_N], принятый код — drafts[life_step_N::accepted].
 *      Прямой доступ к встроенному хранилищу браузера запрещён (только VkatStorage).
 *
 * Экспортирует window.VkatLife = { init, enter, leave, renderStartCard }.
 */

(function (window, document) {
  'use strict';

  // ─── Константы ───────────────────────────────────────────────────────────────

  const GRID_W = 50;
  const GRID_H = 50;
  const CELL = 10;
  const CANVAS_PX = GRID_W * CELL; // 500

  const BORN_MS = 180;   // анимация появления (easeOutBack)
  const DIE_MS = 150;    // анимация угасания
  const TRAIL_MS = 400;  // оранжевый шлейф после гибели

  const PALETTE = {
    bg: '#0a0a0a',
    gridLines: '#1a1a1a',
    gridSub: '#141414',
    border: '#2a2a2a',
    cellNew: '#ffffff',
    cellYoung: '#ececec',
    cellMature: '#c8c8c8',
    cellOld: '#8a8a8a',
    trail: '#FF6A00',
    cursor: 'rgba(255, 106, 0, 0.4)'
  };

  /** Канонические вселенные правил для JS-зеркала (шаг 4). */
  const UNIVERSES = {
    conway: { label: 'Alife B3/S23', birth: [3], survival: [2, 3] },
    highlife: { label: 'HighLife B36/S23', birth: [3, 6], survival: [2, 3] },
    seeds: { label: 'Seeds B2/S', birth: [2], survival: [] }
  };

  /** Пресеты фигур (координаты клеток). */
  const PRESETS = {
    glider: { name: 'Глайдер', cells: [[1, 0], [2, 1], [0, 2], [1, 2], [2, 2]] },
    blinker: { name: 'Мигалка', cells: [[0, 0], [1, 0], [2, 0]] },
    pulsar: { name: 'Пульсар', cells: pulsarCells() },
    gosper: { name: 'Пушка Госпера', cells: gosperCells() },
    acorn: { name: 'Жёлудь (Хаос)', cells: [[0, 1], [1, 1], [1, 3], [3, 2], [4, 3], [5, 3], [6, 3]] }
  };

  function pulsarCells() {
    // Классический пульсар (13x13, 48 клеток)
    const rows = [
      '..OOO...OOO..',
      '.............',
      'O....O.O....O',
      'O....O.O....O',
      'O....O.O....O',
      '..OOO...OOO..',
      '.............',
      '..OOO...OOO..',
      'O....O.O....O',
      'O....O.O....O',
      'O....O.O....O',
      '.............',
      '..OOO...OOO..'
    ];
    const cells = [];
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        if (row[x] === 'O') cells.push([x, y]);
      }
    });
    return cells;
  }

  function gosperCells() {
    // Пушка Госпера (36x9)
    const rows = [
      '........................O...........',
      '......................O.O...........',
      '............OO......OO............OO',
      '...........O...O....OO............OO',
      'OO........O.....O...OO..............',
      'OO........O...O.OO....O.O...........',
      '..........O.....O.......O...........',
      '...........O...O....................',
      '............OO......................'
    ];
    const cells = [];
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        if (row[x] === 'O') cells.push([x, y]);
      }
    });
    return cells;
  }

  // ─── Состояние модуля ────────────────────────────────────────────────────────

  const S = {
    module: null,
    dom: {},
    active: false,
    rafId: null,
    lastFrame: 0,

    // Шаги
    currentStepIndex: 0,
    revealedHints: {},     // stepId -> число открытых подсказок
    isChecking: false,

    // Мир
    worldMode: 'frozen',   // frozen | chaos | conway | sandbox
    seededMode: '',        // какой режим последний раз засеян
    ruleUniverse: 'conway',
    grid: null,            // Uint8Array GRID_W*GRID_H
    age: null,             // Uint16Array — поколения непрерывной жизни
    born: null,            // Float32Array — прогресс появления 0..1
    die: null,             // Float32Array — прогресс угасания 0..1
    trail: null,           // Float32Array — шлейф 1..0
    gen: 0,
    running: false,
    speed: 10,             // поколений в секунду
    simAcc: 0,
    popHistory: [],

    // Ввод
    drawing: false,
    drawingErase: false,
    smartPauseWasRunning: false,
    lastPaintCell: null,
    cursor: null,          // {x, y} под курсором

    // WORLD_BIRTH
    birthAnim: null,

    // Детектор паттернов
    scanAcc: 0,
    toastTimer: null,
    toastCooldown: {},     // тип -> timestamp последнего показа

    // Live-режим Pyodide
    liveRunning: false,

    // Интерактивное обучение (экраны теории перед лабораторией)
    introActive: false,
    introSlide: 1,
    demoTimer: null,
    demoPaused: false,
    demoGrid: null,
    demoPattern: 'glider'
  };

  // ─── Утилиты ─────────────────────────────────────────────────────────────────

  function idx(x, y) {
    return y * GRID_W + x;
  }

  function inBounds(x, y) {
    return x >= 0 && y >= 0 && x < GRID_W && y < GRID_H;
  }

  function easeOutBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ─── Мир: создание и тики ────────────────────────────────────────────────────

  function makeWorld() {
    S.grid = new Uint8Array(GRID_W * GRID_H);
    S.age = new Uint16Array(GRID_W * GRID_H);
    S.born = new Float32Array(GRID_W * GRID_H);
    S.die = new Float32Array(GRID_W * GRID_H);
    S.trail = new Float32Array(GRID_W * GRID_H);
    S.gen = 0;
    S.popHistory = [];
  }

  function seedCell(x, y) {
    if (!inBounds(x, y)) return;
    const i = idx(x, y);
    S.grid[i] = 1;
    S.age[i] = 0;
    S.born[i] = 1; // без анимации при засеве
    S.die[i] = 0;
  }

  function seedPattern(cells, cx, cy) {
    cells.forEach(([px, py]) => seedCell(cx + px, cy + py));
  }

  /** Застывшая колония: натюрморты и замершая мигалка (шаг 1). */
  function seedFrozenWorld() {
    makeWorld();
    seedPattern(PRESETS.blinker.cells, 22, 24);
    seedPattern(PRESETS.blinker.cells, 28, 24);
    seedPattern([[0, 0], [1, 0], [0, 1], [1, 1]], 15, 18);
    seedPattern([[0, 0], [1, 0], [0, 1], [1, 1]], 34, 20);
    seedPattern([[0, 0], [1, 0], [0, 1], [1, 1]], 20, 30);
    seedPattern([[0, 0], [1, 0], [0, 1], [1, 1]], 30, 30);
    S.running = false;
  }

  /** Хаотичный шум: мир мерцает без законов (шаги 2-3). */
  function seedChaosWorld() {
    makeWorld();
    for (let i = 0; i < S.grid.length; i++) {
      if (Math.random() < 0.26) {
        seedCell(i % GRID_W, Math.floor(i / GRID_W));
      }
    }
    S.running = true;
  }

  /** Счёт соседей Мура по текущей сетке. */
  function countNeighborsAt(x, y) {
    let n = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (inBounds(nx, ny) && S.grid[idx(nx, ny)] === 1) n++;
      }
    }
    return n;
  }

  /**
   * Канонический тик по спискам правил. Возвращает новую сетку.
   * Используется и движком, и генерацией фаз глайдера для детектора.
   */
  function conwayTick(src, w, h, birth, survival) {
    const next = new Uint8Array(src.length);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let n = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && ny >= 0 && nx < w && ny < h && src[ny * w + nx] === 1) n++;
          }
        }
        const alive = src[y * w + x] === 1;
        const ok = alive ? survival.indexOf(n) !== -1 : birth.indexOf(n) !== -1;
        next[y * w + x] = ok ? 1 : 0;
      }
    }
    return next;
  }

  /** Применяет новое поколение: обновляет анимационные состояния клеток. */
  function applyGeneration(next) {
    let pop = 0;
    for (let i = 0; i < S.grid.length; i++) {
      const was = S.grid[i];
      const now = next[i];
      if (was === 1 && now === 1) {
        S.age[i]++;
        if (S.age[i] > 60000) S.age[i] = 60000;
      } else if (was === 1 && now === 0) {
        S.grid[i] = 0;
        S.age[i] = 0;
        S.die[i] = 0.001; // старт анимации гибели
        S.trail[i] = 1;   // старт шлейфа
      } else if (was === 0 && now === 1) {
        S.grid[i] = 1;
        S.age[i] = 0;
        S.born[i] = 0.001; // старт анимации рождения
        S.trail[i] = 0;
        S.die[i] = 0;
      }
      if (now === 1) pop++;
    }
    S.gen++;
    S.popHistory.push(pop);
    if (S.popHistory.length > 50) S.popHistory.shift();
  }

  function doSimTick() {
    if (S.worldMode === 'frozen') return; // мир застыл: законов нет
    if (S.worldMode === 'chaos') {
      // Сломанная вселенная: клетки мерцают случайно
      const next = new Uint8Array(S.grid);
      for (let i = 0; i < next.length; i++) {
        if (next[i] === 1 && Math.random() < 0.05) next[i] = 0;
        else if (next[i] === 0 && Math.random() < 0.04) next[i] = 1;
      }
      applyGeneration(next);
      return;
    }
    const u = UNIVERSES[S.ruleUniverse] || UNIVERSES.conway;
    applyGeneration(conwayTick(S.grid, GRID_W, GRID_H, u.birth, u.survival));
  }

  // ─── Рендер ──────────────────────────────────────────────────────────────────

  function setupCanvas() {
    const canvas = S.dom.canvas;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_PX * dpr;
    canvas.height = CANVAS_PX * dpr;
    // размер на экране задаёт CSS (.life-canvas-container), битмап остаётся CANVAS_PX*dpr
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
  }

  function cellColor(age) {
    if (age <= 0) return PALETTE.cellNew;
    if (age <= 4) return PALETTE.cellYoung;
    if (age <= 14) return PALETTE.cellMature;
    return PALETTE.cellOld;
  }

  function render() {
    const ctx = S.dom.ctx;
    ctx.fillStyle = PALETTE.bg;
    ctx.fillRect(0, 0, CANVAS_PX, CANVAS_PX);

    // Фоновые точки на пересечениях сетки
    ctx.fillStyle = PALETTE.gridSub;
    for (let y = 0; y <= GRID_H; y += 2) {
      for (let x = 0; x <= GRID_W; x += 2) {
        ctx.fillRect(x * CELL, y * CELL, 1, 1);
      }
    }

    // Линии сетки
    ctx.strokeStyle = PALETTE.gridLines;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= GRID_W; x++) {
      ctx.moveTo(x * CELL + 0.5, 0);
      ctx.lineTo(x * CELL + 0.5, CANVAS_PX);
    }
    for (let y = 0; y <= GRID_H; y++) {
      ctx.moveTo(0, y * CELL + 0.5);
      ctx.lineTo(CANVAS_PX, y * CELL + 0.5);
    }
    ctx.stroke();

    // Шлейфы погибших клеток
    for (let i = 0; i < S.trail.length; i++) {
      if (S.trail[i] > 0 && S.grid[i] === 0) {
        const a = 0.35 * S.trail[i];
        if (a <= 0.01) continue;
        ctx.fillStyle = 'rgba(255, 106, 0, ' + a.toFixed(3) + ')';
        ctx.fillRect((i % GRID_W) * CELL, Math.floor(i / GRID_W) * CELL, CELL, CELL);
      }
    }

    // Клетки: рождение (easeOutBack), жизнь (возрастная градация), смерть (угасание)
    for (let i = 0; i < S.grid.length; i++) {
      const alive = S.grid[i] === 1;
      const dying = !alive && S.die[i] > 0;
      if (!alive && !dying) continue;

      const cx = (i % GRID_W) * CELL;
      const cy = Math.floor(i / GRID_W) * CELL;
      let scale = 1;
      let alpha = 1;

      if (alive && S.born[i] < 1) {
        const t = Math.min(1, S.born[i]);
        scale = Math.max(0.1, Math.min(1.12, easeOutBack(t)));
        if (t < 0.3) alpha = 0.4 + t * 2;
      } else if (dying) {
        const t = Math.min(1, S.die[i]);
        scale = 1 - 0.8 * t;
        alpha = 1 - t;
      }

      const size = CELL * scale;
      const offset = (CELL - size) / 2;
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.fillStyle = cellColor(S.age[i]);
      ctx.fillRect(cx + offset, cy + offset, size, size);
      ctx.globalAlpha = 1;
    }

    // Курсор-инспектор
    if (S.cursor) {
      const { x, y } = S.cursor;
      if (inBounds(x, y)) {
        ctx.strokeStyle = PALETTE.cursor;
        ctx.lineWidth = 2;
        ctx.strokeRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
        const n = countNeighborsAt(x, y);
        const label = 'X: ' + x + ' | Y: ' + y + ' | Соседей: ' + n;
        ctx.font = '10px ' + (getComputedStyle(document.documentElement).getPropertyValue('--font-mono') || 'monospace');
        const w = ctx.measureText(label).width + 12;
        ctx.fillStyle = 'rgba(10, 10, 10, 0.8)';
        ctx.fillRect(6, CANVAS_PX - 20, w, 14);
        ctx.fillStyle = 'rgba(236, 236, 236, 0.85)';
        ctx.fillText(label, 12, CANVAS_PX - 9);
      }
    }

    renderBirthFx(ctx);
    renderHud();
  }

  /** Эффекты WORLD_BIRTH: кольцевая волна и янтарное свечение. */
  function renderBirthFx(ctx) {
    if (!S.birthAnim) return;
    const elapsed = performance.now() - S.birthAnim.t0;

    // Фаза 2: световая волна 400-1200 мс
    if (elapsed > 400 && elapsed < 1200) {
      const t = (elapsed - 400) / 800;
      const radius = t * CANVAS_PX * 0.75;
      ctx.strokeStyle = 'rgba(255, 106, 0, ' + (0.8 * (1 - t)).toFixed(3) + ')';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(CANVAS_PX / 2, CANVAS_PX / 2, radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Фаза 3: подсветка сетки 1200-1600 мс
    if (elapsed > 1200 && elapsed < 1600) {
      const t = (elapsed - 1200) / 400;
      ctx.fillStyle = 'rgba(255, 106, 0, ' + (0.22 * (1 - t)).toFixed(3) + ')';
      ctx.fillRect(0, 0, CANVAS_PX, CANVAS_PX);
    }
  }

  function renderHud() {
    let pop = 0;
    for (let i = 0; i < S.grid.length; i++) {
      if (S.grid[i] === 1) pop++;
    }
    S.dom.statGen.textContent = String(S.gen).padStart(4, '0');
    S.dom.statPop.textContent = String(pop);
    if (S.dom.statDensity) {
      S.dom.statDensity.textContent = (pop / (GRID_W * GRID_H) * 100).toFixed(2) + '%';
    }
    drawSparkline(pop);
  }

  function drawSparkline(currentPop) {
    const c = S.dom.sparkline;
    if (!c) return;
    const ctx = c.getContext('2d');
    const w = c.width;
    const h = c.height;
    ctx.clearRect(0, 0, w, h);

    const hist = S.popHistory;
    if (hist.length < 2) return;
    const max = Math.max(currentPop, ...hist, 10);

    ctx.strokeStyle = 'rgba(236, 236, 236, 0.85)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    hist.forEach((v, i) => {
      const px = (i / (50 - 1)) * w;
      const py = h - 2 - (v / max) * (h - 4);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();

    // Оранжевая точка на конце
    const lastX = ((hist.length - 1) / (50 - 1)) * w;
    const lastY = h - 2 - (currentPop / max) * (h - 4);
    ctx.fillStyle = PALETTE.trail;
    ctx.beginPath();
    ctx.arc(lastX, lastY, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // ─── Главный цикл ────────────────────────────────────────────────────────────

  function frame(ts) {
    S.rafId = requestAnimationFrame(frame);
    if (!S.active) return;

    const dt = S.lastFrame ? Math.min(100, ts - S.lastFrame) : 16;
    S.lastFrame = ts;

    // Анимации клеток (кадровые, идут даже на паузе)
    const bornStep = dt / BORN_MS;
    const dieStep = dt / DIE_MS;
    const trailStep = dt / TRAIL_MS;
    for (let i = 0; i < S.grid.length; i++) {
      if (S.born[i] > 0 && S.born[i] < 1) S.born[i] = Math.min(1, S.born[i] + bornStep);
      if (S.die[i] > 0) {
        S.die[i] += dieStep;
        if (S.die[i] >= 1) S.die[i] = 0;
      }
      if (S.trail[i] > 0) {
        S.trail[i] -= trailStep;
        if (S.trail[i] < 0) S.trail[i] = 0;
      }
    }

    // Симуляция по тактовой частоте
    if (S.running && S.worldMode !== 'frozen') {
      S.simAcc += dt;
      const tickMs = 1000 / S.speed;
      let guard = 0;
      while (S.simAcc >= tickMs && guard < 5) {
        S.simAcc -= tickMs;
        doSimTick();
        guard++;
      }
    }

    // Детектор паттернов: сканируем раз в 400 мс
    S.scanAcc += dt;
    if (S.scanAcc >= 400) {
      S.scanAcc = 0;
      if ((S.worldMode === 'conway' || S.worldMode === 'sandbox') && S.running) {
        scanPatterns();
      }
    }

    render();
  }

  // ─── Детектор паттернов ──────────────────────────────────────────────────────

  /** Фазы глайдера для точного распознавания (генерируются движком). */
  let gliderMasks = null;
  /** Нормализованные маски фаз пульсара (пульсар не связен под 8-связностью). */
  let pulsarMasks = null;

  function buildGliderMasks() {
    const base = PRESETS.glider.cells;
    const masks = new Set();
    let phase = base;
    for (let p = 0; p < 4; p++) {
      // 8 диэдральных вариантов каждой фазы
      let cur = phase;
      for (let r = 0; r < 4; r++) {
        addMask(masks, cur);
        addMask(masks, mirror(cur));
        cur = rotate(cur);
      }
      // следующая фаза — один канонический тик
      phase = cellsFromGrid(conwayTick(gridFromCells(phase, 4, 4), 4, 4, [3], [2, 3]), 4, 4);
    }
    return masks;
  }

  function gridFromCells(cells, w, h) {
    const g = new Uint8Array(w * h);
    cells.forEach(([x, y]) => {
      if (x >= 0 && y >= 0 && x < w && y < h) g[y * w + x] = 1;
    });
    return g;
  }

  function cellsFromGrid(g, w, h) {
    const cells = [];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (g[y * w + x] === 1) cells.push([x, y]);
      }
    }
    return cells;
  }

  function rotate(cells) {
    return cells.map(([x, y]) => [-y, x]);
  }

  function mirror(cells) {
    return cells.map(([x, y]) => [-x, y]);
  }

  function addMask(set, cells) {
    const norm = normalizeCells(cells);
    if (norm) set.add(norm.key);
  }

  /** Маски фаз пульсара: 3 фазы × диэдральные преобразования, без дубликатов. */
  function buildPulsarMasks() {
    const byKey = new Map();
    let phase = PRESETS.pulsar.cells;
    for (let p = 0; p < 3; p++) {
      let cur = phase;
      for (let r = 0; r < 4; r++) {
        addPulsarMask(byKey, cur);
        addPulsarMask(byKey, mirror(cur));
        cur = rotate(cur);
      }
      phase = cellsFromGrid(conwayTick(gridFromCells(phase, 13, 13), 13, 13, [3], [2, 3]), 13, 13);
    }
    return Array.from(byKey.values());
  }

  function addPulsarMask(byKey, cells) {
    const norm = normalizeCells(cells);
    if (!norm) return;
    if (!byKey.has(norm.key)) {
      byKey.set(norm.key, {
        w: norm.w,
        h: norm.h,
        cells: norm.cells,
        set: new Set(norm.cells.map(p => p[0] + ',' + p[1]))
      });
    }
  }

  /** Точное совпадение окна origin..origin+w/h с маской (лишние клетки недопустимы). */
  function maskMatchesAt(origin, mask) {
    if (origin.x < 0 || origin.y < 0) return false;
    if (origin.x + mask.w > GRID_W || origin.y + mask.h > GRID_H) return false;
    for (let y = 0; y < mask.h; y++) {
      for (let x = 0; x < mask.w; x++) {
        const alive = S.grid[idx(origin.x + x, origin.y + y)] === 1;
        if (alive !== mask.set.has(x + ',' + y)) return false;
      }
    }
    return true;
  }

  /** Пульсар: для каждой живой клетки-якоря пробуем её как каждую клетку маски. */
  function scanPulsar() {
    if (!pulsarMasks || S.popHistory.length === 0) return;
    const lastPop = S.popHistory[S.popHistory.length - 1];
    if (lastPop < 48) return;

    for (let i = 0; i < S.grid.length; i++) {
      if (S.grid[i] !== 1) continue;
      const ax = i % GRID_W;
      const ay = Math.floor(i / GRID_W);
      for (const mask of pulsarMasks) {
        for (const [ox, oy] of mask.cells) {
          if (maskMatchesAt({ x: ax - ox, y: ay - oy }, mask)) {
            showPatternToast('pulsar', '*', 'Мега-осциллятор: «Пульсар»');
            return;
          }
        }
      }
    }
  }

  /** Нормализация: сдвиг к (0,0), сортировка, строковый ключ. */
  function normalizeCells(cells) {
    if (cells.length === 0) return null;
    let minX = Infinity, minY = Infinity;
    cells.forEach(([x, y]) => {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
    });
    const pts = cells.map(([x, y]) => [x - minX, y - minY]);
    pts.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
    let maxX = 0, maxY = 0;
    pts.forEach(([x, y]) => {
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    });
    return { key: pts.map(p => p.join(',')).join(';'), w: maxX + 1, h: maxY + 1, cells: pts };
  }

  /** Сканирует сетку: связные компоненты (8-связность) и их сигнатуры. */
  function scanPatterns() {
    const visited = new Uint8Array(S.grid.length);
    const stack = [];
    const found = [];

    for (let start = 0; start < S.grid.length; start++) {
      if (S.grid[start] !== 1 || visited[start]) continue;
      const comp = [];
      stack.length = 0;
      stack.push(start);
      visited[start] = 1;
      while (stack.length > 0) {
        const i = stack.pop();
        comp.push(i);
        const x = i % GRID_W;
        const y = Math.floor(i / GRID_W);
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx;
            const ny = y + dy;
            if (!inBounds(nx, ny)) continue;
            const ni = idx(nx, ny);
            if (S.grid[ni] === 1 && !visited[ni]) {
              visited[ni] = 1;
              stack.push(ni);
            }
          }
        }
      }

      const cells = comp.map(i => [i % GRID_W, Math.floor(i / GRID_W)]);
      const norm = normalizeCells(cells);
      if (!norm) continue;
      found.push({ size: cells.length, norm });
    }

    for (const f of found) {
      let type = null;
      let icon = '';
      let label = '';

      if (f.size === 4 && f.norm.w === 2 && f.norm.h === 2) {
        type = 'block'; icon = '▪'; label = 'Натюрморт: «Блок»';
      } else if (f.size === 3 && (f.norm.w === 3 || f.norm.h === 3)) {
        type = 'blinker'; icon = '~'; label = 'Осциллятор: «Мигалка» (P=2)';
      } else if (f.size === 5 && f.norm.w === 3 && f.norm.h === 3 && gliderMasks && gliderMasks.has(f.norm.key)) {
        type = 'glider'; icon = '>'; label = 'Планер: «Глайдер» (V=c/4)';
      }

      if (type) showPatternToast(type, icon, label);
    }

    // Пульсар ищется отдельно: под 8-связностью он распадается на компоненты
    scanPulsar();
  }

  function showPatternToast(type, icon, label) {
    const now = performance.now();
    const last = S.toastCooldown[type] || 0;
    if (now - last < 10000) return; // кулдаун 10 с на тип
    S.toastCooldown[type] = now;

    S.dom.toastIcon.textContent = icon;
    S.dom.toastText.textContent = 'Обнаружен паттерн: ' + label;
    S.dom.toast.style.display = 'flex';
    if (S.toastTimer) clearTimeout(S.toastTimer);
    S.toastTimer = setTimeout(() => {
      S.dom.toast.style.display = 'none';
    }, 2500);
  }

  // ─── WORLD_BIRTH ─────────────────────────────────────────────────────────────

  function fireWorldBirth() {
    S.birthAnim = { t0: performance.now() };
    S.dom.birthOverlay.style.display = 'flex';

    // Фаза 3: в центре материализуется глайдер
    setTimeout(() => {
      seedPattern(PRESETS.glider.cells, 23, 23);
      S.worldMode = 'conway';
      S.running = true;
      updatePlayButton();
    }, 1200);

    // Фаза 4: скрыть оверлей с сообщением
    setTimeout(() => {
      S.dom.birthOverlay.style.display = 'none';
    }, 2600);
    setTimeout(() => {
      S.birthAnim = null;
    }, 3000);
  }

  // ─── Мышь и рисование ────────────────────────────────────────────────────────

  function canvasCellFromEvent(e) {
    const rect = S.dom.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const clientX = (e.touches && e.touches.length > 0) ? e.touches[0].clientX : e.clientX;
    const clientY = (e.touches && e.touches.length > 0) ? e.touches[0].clientY : e.clientY;
    const cellW = rect.width / GRID_W;
    const cellH = rect.height / GRID_H;
    const x = Math.floor((clientX - rect.left) / cellW);
    const y = Math.floor((clientY - rect.top) / cellH);
    return inBounds(x, y) ? { x, y } : null;
  }

  function paintCell(x, y, erase) {
    if (!inBounds(x, y)) return;
    const i = idx(x, y);
    if (erase) {
      if (S.grid[i] === 1) {
        S.grid[i] = 0;
        S.age[i] = 0;
        S.die[i] = 0.001;
        S.trail[i] = 1;
      }
    } else {
      if (S.grid[i] === 0) {
        S.grid[i] = 1;
        S.age[i] = 0;
        S.born[i] = 0.001;
        S.die[i] = 0;
        S.trail[i] = 0;
      }
    }
  }

  /** Красит отрезок от прошлой клетки к текущей (без разрывов при быстрой мыши). */
  function paintLine(from, to, erase) {
    if (!from) {
      paintCell(to.x, to.y, erase);
      return;
    }
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    for (let s = 0; s <= steps; s++) {
      const x = Math.round(from.x + (dx * s) / steps);
      const y = Math.round(from.y + (dy * s) / steps);
      paintCell(x, y, erase);
    }
  }

  function setupMouse() {
    const canvas = S.dom.canvas;

    canvas.addEventListener('contextmenu', e => e.preventDefault());

    function onDown(e) {
      const cell = canvasCellFromEvent(e);
      if (!cell) return;
      if (e.cancelable) e.preventDefault();
      const erase = e.button === 2 || e.shiftKey;
      // Smart Pause: рисование мягко ставит симуляцию на паузу
      if (S.running) {
        S.smartPauseWasRunning = true;
        S.running = false;
        updatePlayButton();
      }
      S.drawing = true;
      S.drawingErase = erase;
      paintLine(null, cell, erase);
      S.lastPaintCell = cell;
    }

    function onMove(e) {
      const cell = canvasCellFromEvent(e);
      S.cursor = cell;
      if (S.drawing && cell) {
        if (e.cancelable && e.touches) e.preventDefault();
        paintLine(S.lastPaintCell, cell, S.drawingErase);
        S.lastPaintCell = cell;
      }
    }

    function onUp() {
      if (!S.drawing) return;
      S.drawing = false;
      S.lastPaintCell = null;
      // Продолжить после отпускания, если рисовали на ходу
      if (S.smartPauseWasRunning && S.worldMode !== 'frozen') {
        S.running = true;
      }
      S.smartPauseWasRunning = false;
      updatePlayButton();
    }

    canvas.addEventListener('mousedown', onDown);
    canvas.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);

    canvas.addEventListener('touchstart', onDown, { passive: false });
    canvas.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
    window.addEventListener('touchcancel', onUp);

    canvas.addEventListener('mouseleave', () => {
      S.cursor = null;
    });
  }

  // ─── Прогресс и шаги ─────────────────────────────────────────────────────────

  function completedStepsCount() {
    const completed = (window.VkatApp && window.VkatApp.state.completedTasks) || new Set();
    let n = 0;
    for (const step of S.module.steps) {
      if (completed.has(step.id)) n++;
      else break;
    }
    return n;
  }

  function modeForProgress(n) {
    if (n >= 4) return 'sandbox';
    if (n >= 3) return 'conway';
    if (n >= 1) return 'chaos';
    return 'frozen';
  }

  function loadProgress() {
    const drafts = (window.VkatApp && window.VkatApp.state.codeDrafts) || {};
    const n = completedStepsCount();
    S.currentStepIndex = Math.min(n, S.module.steps.length - 1);
    S.worldMode = modeForProgress(n);
    // Черновики шагов в редактор подтягиваются при рендере шага из drafts
    return drafts;
  }

  function applyWorldForProgress(fireBirth) {
    const n = completedStepsCount();
    const mode = modeForProgress(n);
    if (mode === S.seededMode && mode !== 'conway' && mode !== 'sandbox') {
      S.worldMode = mode;
      return;
    }
    S.worldMode = mode;
    if (mode === 'frozen') {
      seedFrozenWorld();
    } else if (mode === 'chaos' && S.seededMode === 'frozen') {
      seedChaosWorld(); // шаг 1 сдан: мир «задышал» хаосом
    } else if (mode === 'chaos') {
      if (S.seededMode === '') seedChaosWorld();
    }
    if (mode === 'conway' && fireBirth) {
      fireWorldBirth();
    }
    if (mode === 'sandbox') {
      S.running = true;
    }
    S.seededMode = mode;
    updateControlsForMode();
  }

  function updateControlsForMode() {
    const frozen = S.worldMode === 'frozen';
    S.dom.btnPlay.disabled = frozen;
    S.dom.btnStep.disabled = frozen;
    S.dom.btnPlay.title = frozen ? 'Мир застыл: законы ещё не действуют' : 'Запустить симуляцию';

    const sandbox = S.worldMode === 'sandbox';
    S.dom.presetSelect.disabled = !sandbox;
    S.dom.presetSelect.title = sandbox ? '' : 'Пресеты откроются после Шага 4';
    S.dom.universeSelect.style.display = sandbox ? 'inline-block' : 'none';
  }

  function updatePlayButton() {
    S.dom.btnPlay.textContent = S.running ? 'Пауза' : 'Старт';
  }

  // ─── Панель шага (правая колонка) ────────────────────────────────────────────

  function renderStepPanel() {
    const step = S.module.steps[S.currentStepIndex];
    const n = S.currentStepIndex + 1;

    S.dom.stepIndicator.textContent = 'шаг ' + n + ' из ' + S.module.steps.length;
    S.dom.taskTitle.textContent = step.title;
    if (window.Glyphs && step.glyph) {
      S.dom.glyphSlot.innerHTML = window.Glyphs.draw ? window.Glyphs.draw(step.glyph) : (window.Glyphs.render(step.glyph) || '');
    } else {
      S.dom.glyphSlot.innerHTML = '';
    }
    S.dom.taskDesc.innerHTML =
      '<p class="life-narrative">' + escapeHtml(step.narrative) + '</p>' + step.taskHtml;

    const drafts = (window.VkatApp && window.VkatApp.state.codeDrafts) || {};
    S.dom.editor.value = drafts[step.id] || step.initialCode;
    S.dom.editorStatus.textContent = (window.VkatApp.state.completedTasks.has(step.id)) ? 'Сдано ✓' : 'Не проверено';
    S.dom.editorStatus.className = 'editor-status' + (window.VkatApp.state.completedTasks.has(step.id) ? ' ok' : '');

    updateLineNumbers();
    if (S.highlighter) S.highlighter.update();

    S.dom.feedback.className = 'life-feedback-msg';
    S.dom.feedback.innerHTML = '';
    S.dom.hintContent.innerHTML = '';
    // B1: при смене шага панель задания прокручивается к началу
    if (S.dom.editorPanel) S.dom.editorPanel.scrollTop = 0;
    S.dom.hintContent.style.display = 'none';
    S.revealedHints[step.id] = 0;
    updateHintButton();

    renderStepDots();
  }

  function renderStepDots() {
    const dots = [];
    const completed = (window.VkatApp && window.VkatApp.state.completedTasks) || new Set();
    S.module.steps.forEach((step, i) => {
      const cls = [
        'life-dot',
        i === S.currentStepIndex ? 'current' : '',
        completed.has(step.id) ? 'done' : ''
      ].filter(Boolean).join(' ');
      dots.push('<button type="button" class="' + cls + '" data-step="' + i + '" title="' +
        escapeHtml(step.title) + '">' + (i + 1) + '</button>');
    });
    S.dom.stepDots.innerHTML = dots.join('');
    Array.from(S.dom.stepDots.children).forEach(btn => {
      btn.addEventListener('click', () => setStep(parseInt(btn.getAttribute('data-step'), 10)));
    });
  }

  function setStep(i) {
    if (i < 0 || i >= S.module.steps.length) return;
    // Нельзя перескочить дальше первого несданного шага
    const n = completedStepsCount();
    if (i > n) return;
    S.currentStepIndex = i;
    renderStepPanel();
    if (window.VkatConnect) window.VkatConnect.refreshLocation();
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // ─── Подсказки ───────────────────────────────────────────────────────────────

  function updateHintButton() {
    const step = S.module.steps[S.currentStepIndex];
    if (!step) return;
    const rawHints = step.hints || (step.hint ? [{ code: step.hint }] : []);
    const hints = rawHints.map(h => typeof h === 'string' ? { text: h } : h);
    const revealed = S.revealedHints[step.id] || 0;

    if (hints.length === 0) {
      S.dom.btnHint.style.display = 'none';
      return;
    }

    S.dom.btnHint.style.display = 'inline-block';
    if (revealed === 0) {
      S.dom.btnHint.textContent = `Показать подсказку (1 из ${hints.length})`;
    } else if (revealed < hints.length) {
      const isSolution = (revealed + 1 === hints.length);
      S.dom.btnHint.textContent = isSolution
        ? `Показать решение (${revealed + 1} из ${hints.length})`
        : `Следующая подсказка (${revealed + 1} из ${hints.length})`;
    } else {
      const isVis = S.dom.hintContent.style.display !== 'none';
      S.dom.btnHint.textContent = isVis ? 'Скрыть подсказки' : 'Показать подсказки';
    }
  }

  function revealHint() {
    const step = S.module.steps[S.currentStepIndex];
    if (!step) return;
    const rawHints = step.hints || (step.hint ? [{ code: step.hint }] : []);
    const hints = rawHints.map(h => typeof h === 'string' ? { text: h } : h);
    const revealed = S.revealedHints[step.id] || 0;

    if (revealed < hints.length) {
      S.revealedHints[step.id] = revealed + 1;
      renderHintsList(hints, S.revealedHints[step.id]);
      S.dom.hintContent.style.display = 'flex';
    } else {
      const isVis = S.dom.hintContent.style.display !== 'none';
      S.dom.hintContent.style.display = isVis ? 'none' : 'flex';
    }
    updateHintButton();
  }

  function renderHintsList(hints, count) {
    let html = '';
    for (let i = 0; i < count; i++) {
      const h = hints[i];
      const isLast = (i + 1 === hints.length);
      const label = isLast ? `подсказка ${i + 1} из ${hints.length} (решение)` : `подсказка ${i + 1} из ${hints.length}`;
      html += '<div class="life-hint-item">';
      html += `<div class="life-hint-meta">${label}</div>`;
      if (h.text) {
        html += `<p class="life-hint-text">${escapeHtml(h.text)}</p>`;
      }
      if (h.code) {
        const highlighted = window.PythonHighlighter ? window.PythonHighlighter.highlightCode(h.code) : escapeHtml(h.code);
        html += `<pre class="life-hint-code"><code>${highlighted}</code></pre>`;
      }
      html += '</div>';
    }
    S.dom.hintContent.innerHTML = html;
  }

  // ─── Проверка решения ────────────────────────────────────────────────────────

  function buildCheckTask(step) {
    /** @type {TaskItem} */
    const task = {
      id: step.id,
      type: 'code',
      title: step.title,
      tests: step.tests,
      astRequirements: {},
      improveTip: step.improveTip,
      successMessage: step.successMessage
    };
    return task;
  }

  async function submitStep() {
    const step = S.module.steps[S.currentStepIndex];
    if (!step || S.isChecking) return;

    S.isChecking = true;
    S.dom.btnSubmit.disabled = true;
    S.dom.btnSubmit.textContent = 'Проверяем...';

    try {
      // Композиция: принятый код предыдущих шагов + текущий черновик
      const accepted = acceptedCodeBefore(S.currentStepIndex);
      const code = accepted ? accepted + '\n\n' + S.dom.editor.value : S.dom.editor.value;
      const result = await window.CodeChecker.checkSolution(code, buildCheckTask(step));

      if (window.VkatConnect) {
        window.VkatConnect.trackCheck({
          id: step.id,
          title: step.title,
          type: 'code',
          topicId: 'life',
          topicTitle: 'Alife-System',
          stageTitle: 'Пет-проекты'
        }, {
          passed: result.passed,
          errorText: result.stdout || (result.sub ? result.title + ': ' + result.sub : ''),
          code: S.dom.editor.value
        });
      }

      if (result.passed) {
        onStepPassed(step, code, result);
      } else {
        S.dom.editorStatus.textContent = 'Есть ошибки';
        S.dom.editorStatus.className = 'editor-status err';
        renderFailFeedback(result);
      }
    } catch (err) {
      renderFailFeedback({
        title: 'Ошибка среды выполнения Python',
        sub: (err && err.message) || String(err),
        stdout: '',
        friendlyExplain: null,
        improveTips: []
      });
    } finally {
      S.isChecking = false;
      S.dom.btnSubmit.disabled = false;
      S.dom.btnSubmit.textContent = 'Проверить';
    }
  }

  function renderFailFeedback(result) {
    const fb = S.dom.feedback;
    fb.className = 'life-feedback-msg err';
    let html = '<div class="life-fb-row"><span class="life-fb-mark err">×</span>' +
      '<div><div class="life-fb-title">' + escapeHtml(result.title || 'Решение не прошло проверку') + '</div>' +
      '<div class="life-fb-sub">' + escapeHtml(result.sub || '') + '</div></div></div>';
    if (result.friendlyExplain) {
      html += '<div class="life-fb-explain">' + escapeHtml(result.friendlyExplain) + '</div>';
    }
    if (result.stdout && result.stdout.trim()) {
      html += '<pre class="life-fb-console">' + escapeHtml(result.stdout) + '</pre>';
    }
    fb.innerHTML = html;
    showFeedback();
  }

  function showFeedback() {
    // B2: результат проверки и кнопка «Следующий шаг» должны быть видны
    // целиком сразу после сдачи, без ручной прокрутки панели задания.
    // Двойной скролл: немедленно + осадка после перелистовки контента
    // (шрифты/подсветка дорастают и сдвигают максимум).
    if (S.dom.editorPanel) {
      S.dom.editorPanel.scrollTop = S.dom.editorPanel.scrollHeight;
      setTimeout(() => {
        if (S.dom.editorPanel) S.dom.editorPanel.scrollTop = S.dom.editorPanel.scrollHeight;
      }, 400);
    }
  }

  function onStepPassed(step, code, result) {
    const appState = window.VkatApp.state;

    // Принятый код — отдельно от черновика (черновик можно испортить)
    appState.codeDrafts[step.id + '::accepted'] = code;
    if (window.VkatStorage) window.VkatStorage.saveDraftDebounced(step.id + '::accepted', code);

    // Прогресс
    const wasMode = S.worldMode;
    const prevCount = completedStepsCount();
    appState.completedTasks.add(step.id);
    window.VkatApp.saveStorage();

    if (window.VkatConnect) {
      window.VkatConnect.trackItemComplete({
        id: step.id,
        title: step.title,
        type: 'code',
        topicId: 'life',
        topicTitle: 'Alife-System',
        stageTitle: 'Пет-проекты'
      });
    }

    S.dom.editorStatus.textContent = 'Сдано ✓';
    S.dom.editorStatus.className = 'editor-status ok';

    const fb = S.dom.feedback;
    fb.className = 'life-feedback-msg ok';
    let html = '<div class="life-fb-row"><span class="life-fb-mark ok">✓</span>' +
      '<div><div class="life-fb-title">' + escapeHtml(result.title || 'Решение принято') + '</div>' +
      '<div class="life-fb-sub">' + escapeHtml(step.successMessage || result.sub || '') + '</div></div></div>';
    if (result.improveTips && result.improveTips.length > 0) {
      html += '<div class="life-fb-explain">' + result.improveTips.map(t => escapeHtml(t)).join('<br>') + '</div>';
    }
    const isLast = S.currentStepIndex + 1 >= S.module.steps.length;
    if (!isLast) {
      html += '<button type="button" class="life-btn life-btn-sm" id="btn-life-next-step">Следующий шаг →</button>';
    } else {
      html += '<div class="life-fb-explain">Пет-проект пройден полностью! Песочница открыта: экспериментируй с вселенными правил.</div>';
    }
    fb.innerHTML = html;
    showFeedback();
    const nextBtn = document.getElementById('btn-life-next-step');
    if (nextBtn) nextBtn.addEventListener('click', () => setStep(S.currentStepIndex + 1));

    // Мир исцеляется по прогрессу; шаг 3 — кульминация WORLD_BIRTH
    applyWorldForProgress(S.currentStepIndex === 2 && wasMode !== 'conway');
    renderStepDots();
  }

  // ─── Live-режим: настоящий Python на холсте ──────────────────────────────────

  function gridToJson() {
    const rows = [];
    for (let y = 0; y < GRID_H; y++) {
      const row = [];
      for (let x = 0; x < GRID_W; x++) {
        row.push(S.grid[idx(x, y)]);
      }
      rows.push(row);
    }
    return JSON.stringify(rows);
  }

  /**
   * Принятый код шагов до stepIndex (сплит-композиция): функции шагов строятся
   * друг на друге, поэтому проверка шага N исполняет принятые шаги 1..N-1 +
   * текущий черновик. Тесты шага N вызывают только функцию шага N.
   */
  function acceptedCodeBefore(stepIndex) {
    const drafts = (window.VkatApp && window.VkatApp.state.codeDrafts) || {};
    const parts = [];
    for (let i = 0; i < stepIndex && i < S.module.steps.length; i++) {
      const code = drafts[S.module.steps[i].id + '::accepted'];
      if (code) parts.push(code);
    }
    return parts.join('\n\n');
  }

  function composeLiveScript() {
    const scaffoldEl = document.getElementById('vkat-life-scaffold');
    const scaffold = scaffoldEl ? scaffoldEl.textContent : '';
    const student = acceptedCodeBefore(S.module.steps.length);
    return scaffold.replace('__STUDENT_CODE__', student) +
      '\n\nGRID_JSON = """' + gridToJson() + '"""\n' +
      '__g = json.loads(GRID_JSON)\n' +
      '__g = simulate_step(__g)\n' +
      'print(get_grid_json(__g))\n';
  }

  function parseGridJson(stdout) {
    if (!stdout) return null;
    const lines = String(stdout).split('\n').map(s => s.trim()).reverse();
    for (const line of lines) {
      if (!line.startsWith('[')) continue;
      try {
        const parsed = JSON.parse(line);
        if (!Array.isArray(parsed) || parsed.length !== GRID_H) continue;
        for (const row of parsed) {
          if (!Array.isArray(row) || row.length !== GRID_W) return null;
        }
        return parsed;
      } catch (_) {
        continue;
      }
    }
    return null;
  }

  function applyPythonGrid(parsed) {
    const next = new Uint8Array(S.grid.length);
    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        next[idx(x, y)] = parsed[y][x] ? 1 : 0;
      }
    }
    applyGeneration(next);
  }

  async function runPythonTick() {
    try {
      const res = await window.CodeChecker.runCode(composeLiveScript());
      if (res.error) {
        stopLiveMode();
        renderFailFeedback({
          title: 'Ошибка Python в «Испытать на поле»',
          sub: 'Симуляция остановлена. Проверь принятый код шагов.',
          stdout: res.error,
          friendlyExplain: null,
          improveTips: []
        });
        return false;
      }
      const parsed = parseGridJson(res.stdout);
      if (!parsed) {
        stopLiveMode();
        renderFailFeedback({
          title: 'Не удалось прочитать сетку',
          sub: 'Python не вернул JSON-снапшот поля.',
          stdout: res.stdout || '',
          friendlyExplain: null,
          improveTips: []
        });
        return false;
      }
      applyPythonGrid(parsed);
      return true;
    } catch (err) {
      stopLiveMode();
      renderFailFeedback({
        title: 'Ошибка запуска Python',
        sub: (err && err.message) || String(err),
        stdout: '',
        friendlyExplain: null,
        improveTips: []
      });
      return false;
    }
  }

  async function liveLoop() {
    while (S.liveRunning) {
      const t0 = performance.now();
      const ok = await runPythonTick();
      if (!ok) break;
      const elapsed = performance.now() - t0;
      await sleep(Math.max(30, 1000 / Math.max(1, S.speed) - elapsed));
    }
    updateLiveButton();
  }

  function startLiveMode() {
    if (completedStepsCount() < 3) return; // нужны все три функции
    // На время live-режима JS-зеркало останавливается: поле ведёт Python
    S.running = false;
    S.liveRunning = true;
    updatePlayButton();
    updateLiveButton();
    liveLoop();
  }

  function stopLiveMode() {
    S.liveRunning = false;
    updateLiveButton();
  }

  function updateLiveButton() {
    const ready = completedStepsCount() >= 3;
    S.dom.btnRunLocal.disabled = !ready || S.isChecking;
    S.dom.btnRunLocal.title = ready ? 'Прогнать принятый код в настоящем Python' : 'Откроется после сдачи шагов 1-3';
    S.dom.btnRunLocal.textContent = S.liveRunning ? '⏹ Остановить' : 'Испытать на поле';
    S.dom.btnRunLocal.classList.toggle('active', S.liveRunning);
  }

  // ─── Управление симуляцией ───────────────────────────────────────────────────

  function togglePlay() {
    if (S.worldMode === 'frozen') return;
    if (S.liveRunning) stopLiveMode();
    S.running = !S.running;
    updatePlayButton();
  }

  function stepOnce() {
    if (S.worldMode === 'frozen') return;
    if (S.liveRunning) stopLiveMode();
    S.running = false;
    updatePlayButton();
    doSimTick();
  }

  function clearWorld() {
    stopLiveMode();
    makeWorld();
    S.running = false;
    updatePlayButton();
  }

  function randomWorld() {
    stopLiveMode();
    seedChaosWorld();
    updatePlayButton();
  }

  function applyPreset(name) {
    const preset = PRESETS[name];
    if (!preset || S.worldMode !== 'sandbox') return;
    stopLiveMode();
    makeWorld();
    // Разместить пресет по центру поля
    const cells = preset.cells;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    cells.forEach(([x, y]) => {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    });
    const cx = Math.floor((GRID_W - (maxX - minX + 1)) / 2) - minX;
    const cy = Math.floor((GRID_H - (maxY - minY + 1)) / 2) - minY;
    seedPattern(cells, cx, cy);
    S.running = true;
    updatePlayButton();
  }

  // ─── Стартовая карточка пет-проекта ──────────────────────────────────────────

  function renderStartCard() {
    const host = document.getElementById('life-start-card');
    if (!host || !S.module) return;

    const n = completedStepsCount();
    const total = S.module.steps.length;
    const done = n >= total;
    const btnText = n === 0 ? 'Начать' : (done ? 'Повторить' : 'Продолжить');
    const percent = total > 0 ? Math.round((n / total) * 100) : 0;
    const glyph = (window.Glyphs && typeof window.Glyphs.render === 'function')
      ? window.Glyphs.render('lifePatterns')
      : '';

    host.className = 'stage-card project-hero';
    host.innerHTML =
      '<figure class="visual">' + glyph + '</figure>' +
      '<div class="stage-card-header">' +
        '<div class="stage-card-title">Alife-System</div>' +
        '<div class="stage-card-progress-label">' + (done ? '✓ пройдено' : n + ' из ' + total) + '</div>' +
      '</div>' +
      '<p class="stage-card-desc">' + escapeHtml(S.module.description) + '</p>' +
      '<div class="stage-card-meta">' +
        '<span>1 тема</span>' +
        '<span>' + total + ' задания</span>' +
      '</div>' +
      '<div class="stage-card-note">★ Продвинутый (после Тамагочи): клеточные автоматы B3/S23 и интерактивная песочница.</div>' +
      '<div class="stage-card-actions">' +
        '<button type="button" class="stage-card-btn" id="btn-life-open">' + btnText + '</button>' +
        '<span style="font-family: var(--font-mono); font-size: 12px; color: var(--text-dim);">' + percent + '%</span>' +
      '</div>';

    const btn = document.getElementById('btn-life-open');
    if (btn) {
      btn.addEventListener('click', () => {
        window.VkatApp.showScreen('life');
      });
    }
  }

  // ─── DOM ─────────────────────────────────────────────────────────────────────

  function cacheDom() {
    const d = id => document.getElementById(id);
    S.dom = {
      screen: d('screen-life'),
      body: d('life-body'),
      splitter: d('life-splitter'),
      canvasPanel: d('life-canvas-panel'),
      editorPanel: d('life-editor-panel'),
      canvas: d('life-main-canvas'),
      sparkline: d('life-sparkline'),
      birthOverlay: d('life-birth-overlay'),
      toast: d('life-pattern-toast'),
      toastIcon: d('life-toast-icon'),
      toastText: d('life-toast-text'),
      statGen: d('life-stat-gen'),
      statPop: d('life-stat-pop'),
      statDensity: d('life-stat-density'),
      stepIndicator: d('life-step-indicator'),
      stepDots: d('life-step-dots'),
      taskTitle: d('life-task-title'),
      glyphSlot: d('life-glyph-slot'),
      taskDesc: d('life-task-desc'),
      editor: d('life-code-editor'),
      editorHighlight: d('life-editor-highlight'),
      lineNumbers: d('life-line-numbers'),
      autocompletePopup: d('life-autocomplete-popup'),
      editorStatus: d('life-editor-status'),
      feedback: d('life-feedback'),
      hintContent: d('life-hint-content'),
      btnBack: d('btn-life-back'),
      btnHint: d('btn-life-hint'),
      btnSubmit: d('btn-life-submit'),
      btnRunLocal: d('btn-life-run-local'),
      btnPlay: d('btn-life-play'),
      btnStep: d('btn-life-step'),
      btnClear: d('btn-life-clear'),
      btnRandom: d('btn-life-random'),
      speedSlider: d('life-speed-slider'),
      speedVal: d('life-speed-val'),
      presetSelect: d('life-preset-select'),
      universeSelect: d('life-universe-select'),
      introView: d('life-intro-view'),
      introTabs: d('life-intro-tabs'),
      introSlides: d('life-intro-slides'),
      demoToggle: d('btn-demo-toggle'),
      btnOpenIntro: d('btn-life-open-intro'),
      btnSkipIntro: d('btn-life-skip-intro'),
      btnEnterLab: d('btn-intro-enter-lab'),
      mooreGrid: d('moore-grid'),
      mooreCountBadge: d('moore-count-badge'),
      moorePredAlive: d('moore-pred-alive'),
      moorePredDead: d('moore-pred-dead'),
      demoCanvas: d('life-demo-canvas'),
      btnDemoSingle: d('btn-demo-single'),
      btnDemoBlinker: d('btn-demo-blinker'),
      btnDemoGlider: d('btn-demo-glider'),
      demoInfoTitle: d('demo-info-title'),
      demoInfoDesc: d('demo-info-desc')
    };
    S.dom.ctx = S.dom.canvas.getContext('2d');
  }

  function setupEvents() {
    S.dom.btnBack.addEventListener('click', () => window.VkatApp.showScreen('projects'));
    if (S.dom.btnOpenIntro) S.dom.btnOpenIntro.addEventListener('click', () => showIntroView(1));
    if (S.dom.btnSkipIntro) S.dom.btnSkipIntro.addEventListener('click', showWorkbenchView);
    if (S.dom.btnEnterLab) S.dom.btnEnterLab.addEventListener('click', showWorkbenchView);

    if (S.dom.introTabs) {
      S.dom.introTabs.addEventListener('click', e => {
        const btn = e.target.closest('.intro-tab-btn');
        if (!btn || !btn.dataset.slide) return;
        showIntroView(parseInt(btn.dataset.slide, 10));
      });
    }

    if (S.dom.introView) {
      S.dom.introView.addEventListener('click', e => {
        const nextBtn = e.target.closest('.life-btn-intro-next');
        if (nextBtn && nextBtn.dataset.next) {
          showIntroView(parseInt(nextBtn.dataset.next, 10));
          return;
        }
        const prevBtn = e.target.closest('.life-btn-intro-prev');
        if (prevBtn && prevBtn.dataset.prev) {
          showIntroView(parseInt(prevBtn.dataset.prev, 10));
          return;
        }
      });
    }

    if (S.dom.demoToggle) {
      S.dom.demoToggle.addEventListener('click', () => {
        setDemoPaused(!S.demoPaused);
      });
    }
    initDemoCanvasDrawing();

    if (S.dom.mooreGrid) {
      S.dom.mooreGrid.addEventListener('click', e => {
        const cell = e.target.closest('.moore-cell');
        if (!cell) return;
        cell.classList.toggle('active');
        updateMoorePredictions();
      });
    }

    if (S.dom.btnDemoSingle) S.dom.btnDemoSingle.addEventListener('click', () => setDemoPattern('single'));
    if (S.dom.btnDemoBlinker) S.dom.btnDemoBlinker.addEventListener('click', () => setDemoPattern('blinker'));
    if (S.dom.btnDemoGlider) S.dom.btnDemoGlider.addEventListener('click', () => setDemoPattern('glider'));

    S.dom.btnPlay.addEventListener('click', togglePlay);
    S.dom.btnStep.addEventListener('click', stepOnce);
    S.dom.btnClear.addEventListener('click', clearWorld);
    S.dom.btnRandom.addEventListener('click', randomWorld);
    S.dom.btnSubmit.addEventListener('click', submitStep);
    S.dom.btnRunLocal.addEventListener('click', () => {
      if (S.liveRunning) stopLiveMode();
      else startLiveMode();
    });
    S.dom.btnHint.addEventListener('click', revealHint);

    S.dom.speedSlider.addEventListener('input', () => {
      S.speed = parseInt(S.dom.speedSlider.value, 10) || 10;
      S.dom.speedVal.textContent = S.speed + '/с';
    });

    S.dom.presetSelect.addEventListener('change', () => {
      applyPreset(S.dom.presetSelect.value);
      S.dom.presetSelect.selectedIndex = 0;
    });

    S.dom.universeSelect.addEventListener('change', () => {
      if (UNIVERSES[S.dom.universeSelect.value]) {
        S.ruleUniverse = S.dom.universeSelect.value;
      }
    });

    // Подсветка синтаксиса и автодополнение в редакторе решения (как в основном курсе)
    if (window.PythonHighlighter && S.dom.editor && S.dom.editorHighlight) {
      S.highlighter = new window.PythonHighlighter(S.dom.editor, S.dom.editorHighlight);
    }
    if (window.CodeIntelliSense && S.dom.editor && S.dom.autocompletePopup) {
      new window.CodeIntelliSense(S.dom.editor, S.dom.autocompletePopup);
    }

    // Редактор: Tab и Ctrl+Enter (как в основном курсе)
    S.dom.editor.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        submitStep();
        return;
      }
      if (S.dom.autocompletePopup && S.dom.autocompletePopup.style.display === 'block') {
        if (e.key === 'Tab' || e.key === 'Enter' || e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Escape') {
          return;
        }
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        const ed = S.dom.editor;
        const start = ed.selectionStart;
        const end = ed.selectionEnd;
        let inserted = false;
        try {
          inserted = Boolean(document.execCommand && document.execCommand('insertText', false, '    '));
        } catch (_) {}
        if (!inserted) {
          ed.value = ed.value.substring(0, start) + '    ' + ed.value.substring(end);
          ed.selectionStart = ed.selectionEnd = start + 4;
        }
        onEditorChange();
      }
    });

    S.dom.editor.addEventListener('input', onEditorChange);
    if (S.dom.editor) {
      S.dom.editor.addEventListener('scroll', () => {
        if (S.dom.lineNumbers) S.dom.lineNumbers.scrollTop = S.dom.editor.scrollTop;
        if (S.dom.editorHighlight) {
          S.dom.editorHighlight.scrollTop = S.dom.editor.scrollTop;
          S.dom.editorHighlight.scrollLeft = S.dom.editor.scrollLeft;
        }
      });
    }
    setupMouse();
    setupSplitter();
  }

  function setupSplitter() {
    const splitter = S.dom.splitter;
    const body = S.dom.body;
    if (!splitter || !body) return;

    // Восстанавливаем сохранённую ширину через VkatStorage (без прямых вызовов storage)
    const saved = window.VkatStorage ? window.VkatStorage.getSetting('life_split_width', null) : null;
    if (saved && typeof saved === 'number' && saved >= 380) {
      body.style.setProperty('--life-left-width', saved + 'px');
    }

    let isDragging = false;

    function onPointerDown(e) {
      if (e.button !== 0) return;
      isDragging = true;
      splitter.classList.add('is-dragging');
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      e.preventDefault();
    }

    function onPointerMove(e) {
      if (!isDragging) return;
      const rect = body.getBoundingClientRect();
      const newWidth = Math.round(e.clientX - rect.left);
      const minLeft = 380;
      const maxLeft = Math.max(minLeft, rect.width - 420);
      const clamped = Math.max(minLeft, Math.min(maxLeft, newWidth));
      body.style.setProperty('--life-left-width', clamped + 'px');
    }

    function onPointerUp() {
      if (!isDragging) return;
      isDragging = false;
      splitter.classList.remove('is-dragging');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);

      const curVal = body.style.getPropertyValue('--life-left-width');
      if (curVal && window.VkatStorage) {
        window.VkatStorage.setSetting('life_split_width', parseInt(curVal, 10));
      }
    }

    splitter.addEventListener('pointerdown', onPointerDown);

    // Двойной клик сбрасывает к стандартным пропорциям
    splitter.addEventListener('dblclick', () => {
      body.style.removeProperty('--life-left-width');
      if (window.VkatStorage) {
        window.VkatStorage.setSetting('life_split_width', null);
      }
    });

    // Клавиатурная доступность (стрелки влево / вправо)
    splitter.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const delta = e.key === 'ArrowLeft' ? -20 : 20;
        const rect = body.getBoundingClientRect();
        const leftEl = S.dom.canvasPanel;
        const curWidth = leftEl ? leftEl.offsetWidth : 560;
        const minLeft = 380;
        const maxLeft = Math.max(minLeft, rect.width - 420);
        const clamped = Math.max(minLeft, Math.min(maxLeft, curWidth + delta));
        body.style.setProperty('--life-left-width', clamped + 'px');
        if (window.VkatStorage) {
          window.VkatStorage.setSetting('life_split_width', clamped);
        }
      }
    });
  }

  function updateLineNumbers() {
    if (!S.dom || !S.dom.lineNumbers || !S.dom.editor) return;
    const lines = (S.dom.editor.value || '').split('\n').length;
    let html = '';
    for (let i = 1; i <= lines; i++) {
      html += i + '\n';
    }
    S.dom.lineNumbers.textContent = html;
  }

  function onEditorChange() {
    const step = S.module.steps[S.currentStepIndex];
    if (!step) return;
    const appState = (window.VkatApp && window.VkatApp.state) || { codeDrafts: {} };
    appState.codeDrafts[step.id] = S.dom.editor.value;
    updateLineNumbers();
    if (S.highlighter) S.highlighter.update();
    if (window.VkatStorage) window.VkatStorage.saveDraftDebounced(step.id, S.dom.editor.value);
  }

  // ─── Интерактивное обучение (Экраны вводной теории) ─────────────────────────

  function updateMoorePredictions() {
    if (!S.dom.mooreGrid || !S.dom.mooreCountBadge) return;
    const activeCells = S.dom.mooreGrid.querySelectorAll('.moore-cell.active');
    const count = activeCells.length;
    S.dom.mooreCountBadge.textContent = 'Соседей: ' + count + ' из 8';

    if (S.dom.moorePredAlive) {
      if (count === 2 || count === 3) {
        S.dom.moorePredAlive.textContent = 'ВЫЖИВЕТ (' + count + ' соседа)';
        S.dom.moorePredAlive.className = 'pred-val ok';
      } else if (count < 2) {
        S.dom.moorePredAlive.textContent = 'ПОГИБНЕТ (одиночество: ' + count + ' < 2)';
        S.dom.moorePredAlive.className = 'pred-val danger';
      } else {
        S.dom.moorePredAlive.textContent = 'ПОГИБНЕТ (перенаселение: ' + count + ' > 3)';
        S.dom.moorePredAlive.className = 'pred-val danger';
      }
    }

    if (S.dom.moorePredDead) {
      if (count === 3) {
        S.dom.moorePredDead.textContent = 'РОДИТСЯ НОВАЯ (ровно 3)';
        S.dom.moorePredDead.className = 'pred-val born';
      } else {
        S.dom.moorePredDead.textContent = 'ОСТАНЕТСЯ ПУСТОЙ (' + count + ' != 3)';
        S.dom.moorePredDead.className = 'pred-val muted';
      }
    }
  }

  // ─── Интерактивный демо-холст (Слайд 3) ──────────────────────────────────────

  const DEMO_SIZE = 28; // 28x28 сетка на холсте 280x280 (ячейка 10px)
  const DEMO_CELL = 10;

  function initDemoGrid() {
    S.demoGrid = new Uint8Array(DEMO_SIZE * DEMO_SIZE);
  }

  function setDemoPattern(pattern) {
    S.demoPattern = pattern;
    if (S.dom.btnDemoSingle) S.dom.btnDemoSingle.classList.toggle('life-btn-primary', pattern === 'single');
    if (S.dom.btnDemoBlinker) S.dom.btnDemoBlinker.classList.toggle('life-btn-primary', pattern === 'blinker');
    if (S.dom.btnDemoGlider) S.dom.btnDemoGlider.classList.toggle('life-btn-primary', pattern === 'glider');

    initDemoGrid();
    stopDemoSimulation();

    if (pattern === 'single') {
      const cx = Math.floor(DEMO_SIZE / 2);
      const cy = Math.floor(DEMO_SIZE / 2);
      S.demoGrid[cy * DEMO_SIZE + cx] = 1;
      if (S.dom.demoInfoTitle) S.dom.demoInfoTitle.textContent = '1. Одинокая клетка (1 клетка)';
      if (S.dom.demoInfoDesc) S.dom.demoInfoDesc.textContent = 'Клетка погибает на первом же шаге (0 соседей). Правило: меньше 2 соседей — гибель от одиночества.';
      drawDemoCanvas();
      S.demoTimer = setTimeout(() => {
        tickDemoGrid();
        drawDemoCanvas();
      }, 700);

    } else if (pattern === 'blinker') {
      const cx = Math.floor(DEMO_SIZE / 2);
      const cy = Math.floor(DEMO_SIZE / 2);
      S.demoGrid[cy * DEMO_SIZE + (cx - 1)] = 1;
      S.demoGrid[cy * DEMO_SIZE + cx] = 1;
      S.demoGrid[cy * DEMO_SIZE + (cx + 1)] = 1;
      if (S.dom.demoInfoTitle) S.dom.demoInfoTitle.textContent = '2. Осциллятор «Мигалка» (3 клетки, период 2)';
      if (S.dom.demoInfoDesc) S.dom.demoInfoDesc.textContent = 'Клетки бесконечно пульсируют. У центральной 2 соседа (выживание), по краям рождаются и умирают клетки (3 соседа — рождение).';
      drawDemoCanvas();
      S.demoTimer = setInterval(() => {
        tickDemoGrid();
        drawDemoCanvas();
      }, 350);

    } else if (pattern === 'glider') {
      const gx = 3, gy = 3;
      const coords = [[1, 0], [2, 1], [0, 2], [1, 2], [2, 2]];
      coords.forEach(([dx, dy]) => {
        S.demoGrid[(gy + dy) * DEMO_SIZE + (gx + dx)] = 1;
      });
      if (S.dom.demoInfoTitle) S.dom.demoInfoTitle.textContent = '3. Космический корабль «Глайдер» (5 клеток)';
      if (S.dom.demoInfoDesc) S.dom.demoInfoDesc.textContent = 'Клетки шагают сквозь пространство. Команды перемещения в коде нет — движение рождается из последовательных рождений и смертей соседей.';
      drawDemoCanvas();
      S.demoTimer = setInterval(() => {
        tickDemoGrid();
        drawDemoCanvas();
      }, 130);
    }
  }

  function tickDemoGrid() {
    if (!S.demoGrid) return;
    const next = new Uint8Array(DEMO_SIZE * DEMO_SIZE);
    for (let y = 0; y < DEMO_SIZE; y++) {
      for (let x = 0; x < DEMO_SIZE; x++) {
        let count = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = (x + dx + DEMO_SIZE) % DEMO_SIZE;
            const ny = (y + dy + DEMO_SIZE) % DEMO_SIZE;
            if (S.demoGrid[ny * DEMO_SIZE + nx] === 1) count++;
          }
        }
        const alive = S.demoGrid[y * DEMO_SIZE + x] === 1;
        if (alive && (count === 2 || count === 3)) {
          next[y * DEMO_SIZE + x] = 1;
        } else if (!alive && count === 3) {
          next[y * DEMO_SIZE + x] = 1;
        }
      }
    }
    S.demoGrid = next;
  }

  function drawDemoCanvas() {
    if (!S.dom.demoCanvas) return;
    const ctx = S.dom.demoCanvas.getContext('2d');
    if (!ctx) return;
    const w = S.dom.demoCanvas.width;
    const h = S.dom.demoCanvas.height;

    // Фон
    ctx.fillStyle = PALETTE.bg;
    ctx.fillRect(0, 0, w, h);

    // Сетка
    ctx.strokeStyle = PALETTE.gridLines;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= w; x += DEMO_CELL) {
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, h);
    }
    for (let y = 0; y <= h; y += DEMO_CELL) {
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(w, y + 0.5);
    }
    ctx.stroke();

    // Клетки
    if (!S.demoGrid) return;
    ctx.fillStyle = PALETTE.cellNew;
    for (let y = 0; y < DEMO_SIZE; y++) {
      for (let x = 0; x < DEMO_SIZE; x++) {
        if (S.demoGrid[y * DEMO_SIZE + x] === 1) {
          ctx.fillRect(x * DEMO_CELL + 1, y * DEMO_CELL + 1, DEMO_CELL - 1, DEMO_CELL - 1);
        }
      }
    }
  }

  function startDemoSimulation() {
    setDemoPattern(S.demoPattern || 'glider');
    setDemoPaused(false);
  }

  function stopDemoSimulation() {
    if (S.demoTimer) {
      clearInterval(S.demoTimer);
      clearTimeout(S.demoTimer);
      S.demoTimer = null;
    }
  }

  // Полигон: пауза эволюции без сброса мира
  function setDemoPaused(paused) {
    S.demoPaused = paused;
    if (paused) {
      stopDemoSimulation();
    } else {
      stopDemoSimulation();
      S.demoTimer = setInterval(() => {
        tickDemoGrid();
        drawDemoCanvas();
      }, 130);
    }
    if (S.dom.demoToggle) {
      S.dom.demoToggle.textContent = paused ? 'Запустить' : 'Пауза';
    }
  }

  // Полигон: тыкать клеточки — клик ставит/убирает, зажать и вести — рисуешь
  function demoCellFromEvent(e) {
    const rect = S.dom.demoCanvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / (rect.width / DEMO_SIZE));
    const y = Math.floor((e.clientY - rect.top) / (rect.height / DEMO_SIZE));
    if (x < 0 || y < 0 || x >= DEMO_SIZE || y >= DEMO_SIZE) return null;
    return [x, y];
  }

  function demoToggleCell(e) {
    if (!S.demoGrid) return;
    const cell = demoCellFromEvent(e);
    if (!cell) return;
    const idx = cell[1] * DEMO_SIZE + cell[0];
    S.demoGrid[idx] = S.demoGrid[idx] === 1 ? 0 : 1;
    drawDemoCanvas();
  }

  function demoPaintCell(e) {
    if (!S.demoGrid) return;
    const cell = demoCellFromEvent(e);
    if (!cell) return;
    S.demoGrid[cell[1] * DEMO_SIZE + cell[0]] = 1;
    drawDemoCanvas();
  }

  function initDemoCanvasDrawing() {
    if (!S.dom.demoCanvas) return;
    let painting = false;
    const canvas = S.dom.demoCanvas;

    canvas.addEventListener('pointerdown', e => {
      e.preventDefault();
      painting = true;
      try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
      demoToggleCell(e);
    });
    canvas.addEventListener('pointermove', e => {
      if (!painting) return;
      demoPaintCell(e);
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => {
      canvas.addEventListener(ev, () => { painting = false; });
    });
  }

  // ─── Переключение экранов (Вводный брифинг vs Лаборатория) ──────────────────

  function showIntroView(slideNum) {
    S.introActive = true;
    S.introSlide = Math.max(1, Math.min(4, typeof slideNum === 'number' ? slideNum : 1));
    if (S.dom.introView) S.dom.introView.style.display = 'block';
    if (S.dom.body) S.dom.body.style.display = 'none';
    if (S.dom.btnOpenIntro) S.dom.btnOpenIntro.style.display = 'none';
    if (S.dom.btnSkipIntro) S.dom.btnSkipIntro.style.display = 'inline-flex';

    if (S.dom.introTabs) {
      const tabs = S.dom.introTabs.querySelectorAll('.intro-tab-btn');
      tabs.forEach(tab => {
        const s = parseInt(tab.dataset.slide, 10);
        tab.classList.toggle('active', s === S.introSlide);
      });
    }

    if (S.dom.introSlides) {
      const slides = S.dom.introSlides.querySelectorAll('.intro-slide');
      slides.forEach(slide => {
        const s = parseInt(slide.dataset.slide, 10);
        slide.style.display = (s === S.introSlide) ? 'block' : 'none';
      });
    }

    if (S.introSlide === 2) {
      updateMoorePredictions();
    } else if (S.introSlide === 3) {
      startDemoSimulation();
      setDemoPaused(false);
    } else {
      stopDemoSimulation();
    }
  }

  function showWorkbenchView() {
    S.introActive = false;
    stopDemoSimulation();
    if (S.dom.introView) S.dom.introView.style.display = 'none';
    if (S.dom.body) S.dom.body.style.display = '';
    if (S.dom.btnOpenIntro) S.dom.btnOpenIntro.style.display = 'inline-flex';
    if (S.dom.btnSkipIntro) S.dom.btnSkipIntro.style.display = 'none';
    if (window.VkatStorage) {
      window.VkatStorage.setSetting('life_intro_completed', true);
    }
    render();
    // B1: панель задания всегда начинается сверху, автофокус не уезжает вниз
    if (S.dom.editorPanel) S.dom.editorPanel.scrollTop = 0;
    if (S.dom.editor) {
      S.dom.editor.focus({ preventScroll: true });
    }
    if (window.VkatConnect) window.VkatConnect.refreshLocation();
  }

  // ─── Вход/выход с экрана ───────────────────────────────────────────────────

  function enter() {
    if (!S.module) return;
    S.active = true;
    S.lastFrame = 0;
    loadProgress();
    applyWorldForProgress(false);
    renderStepPanel();
    updateControlsForMode();
    updatePlayButton();
    updateLiveButton();
    render();

    // Авто-показ обучающего брифинга при первом входе, если не завершён и 0 сданных шагов
    const introDone = window.VkatStorage ? window.VkatStorage.getSetting('life_intro_completed', false) : false;
    if (!introDone && completedStepsCount() === 0) {
      showIntroView(1);
    } else {
      showWorkbenchView();
    }
    if (window.VkatConnect) window.VkatConnect.refreshLocation();
  }

  function leave() {
    S.active = false;
    S.liveRunning = false;
    S.cursor = null;
    S.drawing = false;
    stopDemoSimulation();
    if (window.VkatStorage) window.VkatStorage.flushSync();
  }

  function init() {
    S.module = window.LIFE_MODULE;
    if (!S.module || !S.module.steps || S.module.steps.length === 0) {
      console.warn('LIFE_MODULE не найден — экран пет-проекта отключён');
      return;
    }
    cacheDom();
    setupCanvas();
    makeWorld();
    gliderMasks = buildGliderMasks();
    pulsarMasks = buildPulsarMasks();
    setupEvents();

    // Вселенная правил для шага 4
    const universeOptions = Object.keys(UNIVERSES).map(key =>
      '<option value="' + key + '">' + UNIVERSES[key].label + '</option>'
    ).join('');
    S.dom.universeSelect.innerHTML = universeOptions;

    S.rafId = requestAnimationFrame(frame);
  }

  // _state — отладочный хук (dev-консоль/E2E): S не является публичным контрактом
  window.VkatLife = { init, enter, leave, showIntroView, showWorkbenchView, renderStartCard, _state: S };
})(window, document);
