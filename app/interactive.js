/**
 * вкат.py — Модуль «Интерактив: Сбор монет и Лабиринт» v2
 * --------------------------------------------------------
 * • 2 режима: «Сбор монет» и «Лабиринт»
 * • Лабиринт: движение по клеткам, проверка столкновения со стенами
 * • RAF-анимация плавного движения черепашки
 * • Анимация сбора монет (пульс-кольцо → исчезновение)
 * • Drag-and-Drop перестановка карточек (HTML5 native DnD)
 * • Регулятор скорости (медленно / нормально / быстро / мгновенно)
 * • Кнопки +/− вместо голого input (со степпером)
 * • Кастомный выбор уровня (полоска кнопок)
 * • Группированная палитра
 * • Человекочитаемый лог без технических координат
 * • Победная анимация
 */

(function (window) {
  'use strict';

  /* ================================================================
     КОНСТАНТЫ И УРОВНИ
  ================================================================ */

  const CANVAS_W = 480;
  const CANVAS_H = 400;
  const CELL_SIZE = 40;
  const GRID_COLS = 12;
  const GRID_ROWS = 10;
  const PICKUP_RADIUS = 22;

  // ── Уровни режима «Сбор монет» ────────────────────────────────
  const COIN_LEVELS = [
    {
      id: 'lvl1',
      title: '1 · прямая линия',
      description: 'Черепашка смотрит вправо. Собери 3 монеты по прямой — добавь нужные карточки справа.',
      startPos: { x: 80, y: 200, heading: 0 },
      coins: [{ x: 200, y: 200 }, { x: 300, y: 200 }, { x: 400, y: 200 }],
      defaultBlocks: []
    },
    {
      id: 'lvl2',
      title: '2 · поворот за угол',
      description: 'Г-образный маршрут: сначала вправо, потом вверх. Понадобится поворот.',
      startPos: { x: 80, y: 320, heading: 0 },
      coins: [{ x: 240, y: 320 }, { x: 240, y: 200 }, { x: 240, y: 80 }],
      defaultBlocks: []
    },
    {
      id: 'lvl3',
      title: '3 · зигзаг ступенями',
      description: 'Лестница из 5 монет: чередуй «вперёд» и повороты влево/вправо.',
      startPos: { x: 60, y: 340, heading: 0 },
      coins: [
        { x: 160, y: 340 }, { x: 160, y: 220 },
        { x: 290, y: 220 }, { x: 290, y: 100 }, { x: 410, y: 100 }
      ],
      defaultBlocks: []
    },
    {
      id: 'lvl4',
      title: '4 · квадрат (цикл)',
      description: '4 монеты по углам квадрата. Подсказка: используй карточку «повторить» — меньше карточек, тот же результат.',
      startPos: { x: 120, y: 320, heading: 0 },
      coins: [
        { x: 360, y: 320 }, { x: 360, y: 80 },
        { x: 120, y: 80 }, { x: 120, y: 320 }
      ],
      defaultBlocks: []
    },
    {
      id: 'lvl5',
      title: '5 · свободное поле',
      description: '6 монет по всему полю. Спланируй маршрут сам — используй перо, чтобы не рисовать лишних линий.',
      startPos: { x: 240, y: 200, heading: 0 },
      coins: [
        { x: 390, y: 200 }, { x: 390, y: 80 },
        { x: 90, y: 80 }, { x: 90, y: 320 },
        { x: 390, y: 320 }, { x: 240, y: 200 }
      ],
      defaultBlocks: []
    }
  ];

  // ── Уровни режима «Лабиринт» ──────────────────────────────────
  const MAZE_LEVELS = [
    {
      id: 'maze_lvl1',
      title: '1 · один поворот',
      description: 'Пройди по коридору вверх, затем поверни направо к выходу ⚑.',
      grid: [
        '############',
        '#.........F#',
        '#.##########',
        '#.##########',
        '#.##########',
        '#.##########',
        '#.##########',
        '#.##########',
        '#S##########',
        '############'
      ],
      startPos: { x: 60, y: 340, heading: 90 }, // c:1, r:8
      finishPos: { x: 420, y: 60 },             // c:10, r:1
      defaultBlocks: []
    },
    {
      id: 'maze_lvl2',
      title: '2 · змейка',
      description: 'Змейка: коридор петляет с 4 поворотами. Поворачивай вовремя, чтобы не удариться о стену!',
      grid: [
        '############',
        '#S.........#',
        '##########.#',
        '##########.#',
        '#..........#',
        '#.##########',
        '#.##########',
        '#.##########',
        '#.........F#',
        '############'
      ],
      startPos: { x: 60, y: 60, heading: 0 },   // c:1, r:1
      finishPos: { x: 420, y: 340 },           // c:10, r:8
      defaultBlocks: []
    },
    {
      id: 'maze_lvl3',
      title: '3 · ступени (цикл)',
      description: 'Ступенчатый подъем. Попробуй карточку «повторить» для одинаковых шагов!',
      grid: [
        '############',
        '########.F##',
        '######...###',
        '####...#####',
        '##...#######',
        '#S..########',
        '############',
        '############',
        '############',
        '############'
      ],
      startPos: { x: 60, y: 220, heading: 0 },  // c:1, r:5
      finishPos: { x: 380, y: 60 },             // c:9, r:1
      defaultBlocks: []
    },
    {
      id: 'maze_lvl4',
      title: '4 · развилка с тупиком',
      description: 'Один из путей ведёт в тупик! Изучи лабиринт перед запуском и выбери верную дорогу.',
      grid: [
        '############',
        '#..........#',
        '#.########.#',
        '#.########.#',
        '#......###.#',
        '#.####.###.#',
        '#.####.###.#',
        '#.####.###.#',
        '#S####....F#',
        '############'
      ],
      startPos: { x: 60, y: 340, heading: 90 }, // c:1, r:8
      finishPos: { x: 420, y: 340 },            // c:10, r:8
      defaultBlocks: []
    }
  ];

  // ── Определение команд для монет ─────────────────────────────
  const COMMAND_DEFS_COINS = {
    forward:  { label: 'вперёд',       group: 'move',   pythonName: 'forward',  unit: '',     defaultVal: 80,  min: 10, max: 400, step: 10 },
    backward: { label: 'назад',        group: 'move',   pythonName: 'backward', unit: '',     defaultVal: 80,  min: 10, max: 400, step: 10 },
    left:     { label: 'влево',        group: 'turn',   pythonName: 'left',     unit: '°',    defaultVal: 90,  min: 15, max: 360, step: 15 },
    right:    { label: 'вправо',       group: 'turn',   pythonName: 'right',    unit: '°',    defaultVal: 90,  min: 15, max: 360, step: 15 },
    repeat:   { label: 'повторить',    group: 'struct', pythonName: 'repeat',   unit: ' раз', defaultVal: 4,  min: 2,  max: 20,  step: 1, isContainer: true },
    penup:    { label: 'поднять перо', group: 'pen',    pythonName: 'penup',    unit: '',     defaultVal: null, noVal: true },
    pendown:  { label: 'опустить перо', group: 'pen',   pythonName: 'pendown',  unit: '',     defaultVal: null, noVal: true }
  };

  // ── Определение команд для лабиринта (шаг кратен 40px) ───────
  const COMMAND_DEFS_MAZE = {
    forward:  { label: 'вперёд',    group: 'move',   pythonName: 'forward',  unit: ' px', defaultVal: 40, min: 40, max: 400, step: 40 },
    backward: { label: 'назад',     group: 'move',   pythonName: 'backward', unit: ' px', defaultVal: 40, min: 40, max: 400, step: 40 },
    left:     { label: 'влево',     group: 'turn',   pythonName: 'left',     unit: '°',   defaultVal: 90, min: 45, max: 360, step: 45 },
    right:    { label: 'вправо',    group: 'turn',   pythonName: 'right',    unit: '°',   defaultVal: 90, min: 45, max: 360, step: 45 },
    repeat:   { label: 'повторить', group: 'struct', pythonName: 'repeat',   unit: ' раз', defaultVal: 4, min: 2,  max: 20,  step: 1, isContainer: true }
  };

  const PALETTE_GROUPS_COINS = [
    { id: 'move',   label: 'движение',  types: ['forward', 'backward'] },
    { id: 'turn',   label: 'поворот',   types: ['left', 'right'] },
    { id: 'struct', label: 'структура', types: ['repeat'] },
    { id: 'pen',    label: 'перо',      types: ['penup', 'pendown'] }
  ];

  const PALETTE_GROUPS_MAZE = [
    { id: 'move',   label: 'движение',  types: ['forward', 'backward'] },
    { id: 'turn',   label: 'поворот',   types: ['left', 'right'] },
    { id: 'struct', label: 'структура', types: ['repeat'] }
  ];

  const SPEED_PRESETS = {
    slow:    { label: 'медленно',  moveDuration: 700, rotDuration: 350 },
    normal:  { label: 'нормально', moveDuration: 340, rotDuration: 170 },
    fast:    { label: 'быстро',    moveDuration: 90,  rotDuration: 45  },
    instant: { label: 'мгновенно', moveDuration: 0,   rotDuration: 0   }
  };

  const SK_MODE  = 'vkat_interactive_mode_v2';
  const SK_PROG  = 'vkat_interactive_program_v2';
  const SK_SPEED = 'vkat_interactive_speed_v2';

  /* ================================================================
     СОСТОЯНИЕ
  ================================================================ */

  const state = {
    mode: 'coins',              // 'coins' | 'maze'
    currentLevelIndexCoins: 0,
    currentLevelIndexMaze: 0,
    programBlocks: [],
    turtle: { x: 0, y: 0, heading: 0, penDown: true },
    coins: [],
    lines: [],                  // сохранённые сегменты следа
    collectedCount: 0,
    mazeCompleted: false,
    isRunning: false,
    isPaused: false,
    viewMode: 'blocks',
    speedPreset: 'normal',
    executionQueue: [],
    executingIndex: 0,
    execTimer: null,
    // Движок анимации
    anim: {
      active: false, type: null,
      startX: 0, startY: 0, endX: 0, endY: 0,
      startHeading: 0, endHeading: 0,
      penDown: true, startTime: 0, duration: 0,
      rafId: null, onDone: null
    },
    // Анимации монет при сборе
    coinAnims: [],              // [{coinIdx, startTime, done}]
    // Анимация удара о стену в лабиринте
    collisionAnim: null,        // { x, y, startTime }
    // Победная анимация
    victory: { active: false, startTime: 0, rafId: null },
    // Drag-and-drop
    dnd: { draggingId: null, dropTargetId: null, dropPosition: null }
  };

  let dom = {};
  let initialized = false;

  function getCurrentLevels() {
    return state.mode === 'coins' ? COIN_LEVELS : MAZE_LEVELS;
  }

  function getCurrentLevelIndex() {
    return state.mode === 'coins' ? state.currentLevelIndexCoins : state.currentLevelIndexMaze;
  }

  function setCurrentLevelIndex(idx) {
    if (state.mode === 'coins') state.currentLevelIndexCoins = idx;
    else state.currentLevelIndexMaze = idx;
  }

  function getCommandDefs() {
    return state.mode === 'coins' ? COMMAND_DEFS_COINS : COMMAND_DEFS_MAZE;
  }

  function getPaletteGroups() {
    return state.mode === 'coins' ? PALETTE_GROUPS_COINS : PALETTE_GROUPS_MAZE;
  }

  /* ================================================================
     INIT DOM
  ================================================================ */

  function initDom() {
    dom.screen        = document.getElementById('screen-interactive');
    dom.btnModeCoins  = document.getElementById('interactive-mode-coins');
    dom.btnModeMaze   = document.getElementById('interactive-mode-maze');
    dom.levelStrip    = document.getElementById('interactive-level-strip');
    dom.levelDesc     = document.getElementById('interactive-level-desc');
    dom.canvas        = document.getElementById('interactive-canvas');
    dom.ctx           = dom.canvas ? dom.canvas.getContext('2d') : null;
    dom.statsCoins    = document.getElementById('interactive-stats-coins');
    dom.statsMaze     = document.getElementById('interactive-stats-maze');
    dom.coinScore     = document.getElementById('interactive-coin-score');
    dom.coinTotal     = document.getElementById('interactive-coin-total');
    dom.statusBadge   = document.getElementById('interactive-status-badge');
    dom.actionLog     = document.getElementById('interactive-action-log');
    dom.paletteList   = document.getElementById('interactive-palette-list');
    dom.workspaceList = document.getElementById('interactive-workspace-list');
    dom.emptyNote     = document.getElementById('interactive-workspace-empty');
    dom.btnRun        = document.getElementById('interactive-btn-run');
    dom.btnStep       = document.getElementById('interactive-btn-step');
    dom.btnReset      = document.getElementById('interactive-btn-reset');
    dom.btnClear      = document.getElementById('interactive-btn-clear');
    dom.speedBar      = document.getElementById('interactive-speed-bar');
    dom.tabBlocks     = document.getElementById('interactive-tab-blocks');
    dom.tabPython     = document.getElementById('interactive-tab-python');
    dom.viewBlocks    = document.getElementById('interactive-view-blocks');
    dom.viewPython    = document.getElementById('interactive-view-python');
    dom.pythonOutput  = document.getElementById('interactive-python-code');
    dom.btnCopyCode   = document.getElementById('interactive-btn-copy-code');
  }

  /* ================================================================
     STORAGE
  ================================================================ */

  function loadStorage() {
    try {
      const mode = localStorage.getItem(SK_MODE);
      if (mode === 'coins' || mode === 'maze') state.mode = mode;

      const spd = localStorage.getItem(SK_SPEED);
      if (spd && SPEED_PRESETS[spd]) state.speedPreset = spd;
    } catch (_) {}
  }

  function saveStorage() {
    try {
      localStorage.setItem(SK_MODE, state.mode);
      localStorage.setItem(SK_SPEED, state.speedPreset);

      const raw = localStorage.getItem(SK_PROG);
      let all = {};
      try { all = JSON.parse(raw) || {}; } catch (_) {}

      const levels = getCurrentLevels();
      const curLvl = levels[getCurrentLevelIndex()];
      if (curLvl) {
        all[curLvl.id] = state.programBlocks;
      }
      localStorage.setItem(SK_PROG, JSON.stringify(all));
    } catch (_) {}
  }

  function loadProgramForCurrentLevel() {
    const levels = getCurrentLevels();
    const curLvl = levels[getCurrentLevelIndex()];
    if (!curLvl) { state.programBlocks = []; return; }

    try {
      const raw = localStorage.getItem(SK_PROG);
      if (raw) {
        const all = JSON.parse(raw);
        if (all[curLvl.id] && Array.isArray(all[curLvl.id])) {
          state.programBlocks = all[curLvl.id];
          return;
        }
      }
    } catch (_) {}
    state.programBlocks = JSON.parse(JSON.stringify(curLvl.defaultBlocks || []));
  }

  /* ================================================================
     УПРАВЛЕНИЕ РЕЖИМАМИ И УРОВНЯМИ
  ================================================================ */

  function setMode(newMode) {
    if (state.mode === newMode) return;
    stopExecution();
    state.mode = newMode;
    saveStorage();

    if (dom.btnModeCoins) dom.btnModeCoins.classList.toggle('active', newMode === 'coins');
    if (dom.btnModeMaze)  dom.btnModeMaze.classList.toggle('active', newMode === 'maze');

    if (dom.statsCoins) dom.statsCoins.style.display = newMode === 'coins' ? '' : 'none';
    if (dom.statsMaze)  dom.statsMaze.style.display  = newMode === 'maze' ? '' : 'none';

    renderPalette();
    setupLevel(getCurrentLevelIndex());
  }

  function setupLevel(idx) {
    stopExecution();
    const levels = getCurrentLevels();
    if (idx < 0 || idx >= levels.length) idx = 0;
    setCurrentLevelIndex(idx);

    const level = levels[idx];

    state.turtle = {
      x: level.startPos.x,
      y: level.startPos.y,
      heading: level.startPos.heading,
      penDown: true
    };
    state.lines = [];
    state.coinAnims = [];
    state.collisionAnim = null;
    state.victory = { active: false, startTime: 0, rafId: null };
    state.mazeCompleted = false;

    if (state.mode === 'coins') {
      state.coins = (level.coins || []).map(c => ({ x: c.x, y: c.y, collected: false }));
      state.collectedCount = 0;
      if (dom.coinTotal) dom.coinTotal.textContent = String(state.coins.length);
      updateScoreDisplay();
    } else {
      state.coins = [];
      state.collectedCount = 0;
    }

    if (dom.levelDesc) dom.levelDesc.textContent = level.description;

    updateStatusBadge('готов к запуску', 'idle');
    clearLog();
    log(`режим: ${state.mode === 'coins' ? 'монеты' : 'лабиринт'} · ${level.title}`);

    loadProgramForCurrentLevel();
    renderLevelStrip();
    renderWorkspace();
    renderPythonCode();
    drawArena();
    saveStorage();
  }

  function resetArena() {
    stopExecution();
    const levels = getCurrentLevels();
    const level = levels[getCurrentLevelIndex()];
    if (!level) return;

    state.turtle = {
      x: level.startPos.x,
      y: level.startPos.y,
      heading: level.startPos.heading,
      penDown: true
    };
    state.lines = [];
    state.coinAnims = [];
    state.collisionAnim = null;
    state.victory = { active: false, startTime: 0, rafId: null };
    state.mazeCompleted = false;

    if (state.mode === 'coins') {
      state.coins = (level.coins || []).map(c => ({ x: c.x, y: c.y, collected: false }));
      state.collectedCount = 0;
      updateScoreDisplay();
    }

    updateStatusBadge('готов к запуску', 'idle');
    log('арена сброшена');
    renderWorkspace();
    drawArena();
  }

  /* ================================================================
     РЕНДЕР: ПОЛОСКА УРОВНЕЙ
  ================================================================ */

  function renderLevelStrip() {
    if (!dom.levelStrip) return;
    dom.levelStrip.innerHTML = '';
    const levels = getCurrentLevels();
    const currentIdx = getCurrentLevelIndex();

    levels.forEach((lvl, idx) => {
      const btn = document.createElement('button');
      btn.className = 'level-btn' + (idx === currentIdx ? ' active' : '');
      btn.textContent = String(idx + 1);
      btn.title = lvl.title;
      btn.addEventListener('click', () => setupLevel(idx));
      dom.levelStrip.appendChild(btn);
    });
  }

  /* ================================================================
     ЛАБИРИНТ: ПРОВЕРКА СТЕН И ФИНИША
  ================================================================ */

  function isMazeWallAt(x, y) {
    if (state.mode !== 'maze') return false;
    const level = MAZE_LEVELS[state.currentLevelIndexMaze];
    if (!level || !level.grid) return false;

    // Границы поля с отступом для радиуса черепашки
    if (x < 14 || x > CANVAS_W - 14 || y < 14 || y > CANVAS_H - 14) return true;

    const col = Math.floor(x / CELL_SIZE);
    const row = Math.floor(y / CELL_SIZE);

    if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) return true;
    return level.grid[row] && level.grid[row][col] === '#';
  }

  function checkMazeFinishAt(x, y) {
    if (state.mode !== 'maze') return false;
    const level = MAZE_LEVELS[state.currentLevelIndexMaze];
    if (!level || !level.finishPos) return false;

    const dx = x - level.finishPos.x;
    const dy = y - level.finishPos.y;
    return Math.sqrt(dx * dx + dy * dy) <= 22;
  }

  /* ================================================================
     РЕНДЕР: CANVAS (главный цикл рисования)
  ================================================================ */

  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  function drawArena() {
    if (!dom.ctx || !dom.canvas) return;
    const ctx = dom.ctx;
    const W   = CANVAS_W;
    const H   = CANVAS_H;
    const now = performance.now();

    // 1. Фон
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, W, H);

    // 2. В режиме лабиринта — рисуем стены и финиш
    if (state.mode === 'maze') {
      const level = MAZE_LEVELS[state.currentLevelIndexMaze];
      if (level && level.grid) {
        // Стены
        for (let r = 0; r < GRID_ROWS; r++) {
          for (let c = 0; c < GRID_COLS; c++) {
            const ch = level.grid[r] ? level.grid[r][c] : '.';
            const x = c * CELL_SIZE;
            const y = r * CELL_SIZE;

            if (ch === '#') {
              ctx.fillStyle = '#141414';
              ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
              ctx.strokeStyle = '#262626';
              ctx.lineWidth = 1;
              ctx.strokeRect(x + 0.5, y + 0.5, CELL_SIZE - 1, CELL_SIZE - 1);
            } else {
              // Пол свободного коридора с легкой разметкой
              ctx.strokeStyle = '#121212';
              ctx.lineWidth = 1;
              ctx.strokeRect(x + 0.5, y + 0.5, CELL_SIZE - 1, CELL_SIZE - 1);
            }
          }
        }

        // Финишная клетка
        if (level.finishPos) {
          const fx = level.finishPos.x;
          const fy = level.finishPos.y;
          const pulse = Math.sin(now / 400) * 1.5;

          ctx.save();
          // Мягкий фон финиша
          ctx.fillStyle = '#181818';
          ctx.fillRect(fx - 18, fy - 18, 36, 36);

          // Обводка финиша с пульсом
          ctx.strokeStyle = '#ececec';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(fx, fy, 15 + pulse, 0, Math.PI * 2);
          ctx.stroke();

          // Значок финиша (флаг)
          ctx.fillStyle = '#ececec';
          ctx.font = '700 13px "IBM Plex Mono", monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('⚑', fx, fy - 1);
          ctx.restore();
        }
      }
    } else {
      // 3. В режиме монет — обычная координатная сетка
      ctx.strokeStyle = '#181818';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = CELL_SIZE; x < W; x += CELL_SIZE) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
      for (let y = CELL_SIZE; y < H; y += CELL_SIZE) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
      ctx.stroke();
    }

    // Рамка холста
    ctx.strokeStyle = '#2a2a2a';
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);

    // 4. Сохранённые линии следа
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2;
    ctx.strokeStyle = state.mode === 'maze' ? '#6a6a6a' : '#505050';
    for (const seg of state.lines) {
      if (seg.penDown) {
        ctx.beginPath();
        ctx.moveTo(seg.x1, seg.y1);
        ctx.lineTo(seg.x2, seg.y2);
        ctx.stroke();
      }
    }

    // 5. Живой след во время движения
    const a = state.anim;
    if (a.active && a.type === 'move' && a.penDown) {
      ctx.strokeStyle = state.mode === 'maze' ? '#6a6a6a' : '#505050';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(a.startX, a.startY);
      ctx.lineTo(state.turtle.x, state.turtle.y);
      ctx.stroke();
    }

    // 6. Отрисовка монет (только в режиме монет)
    if (state.mode === 'coins') {
      state.coins.forEach((coin, idx) => {
        const anim = state.coinAnims.find(item => item.coinIdx === idx);

        if (anim && !anim.done) {
          const elapsed = (now - anim.startTime) / 450;
          const t = Math.min(elapsed, 1);
          if (t >= 1) { anim.done = true; return; }

          ctx.save();
          ctx.globalAlpha = 1 - t;
          ctx.strokeStyle = '#ececec';
          ctx.lineWidth = 2 - t * 1.5;
          ctx.beginPath();
          ctx.arc(coin.x, coin.y, 14 * (1 + t * 0.9), 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = '#ececec';
          ctx.font = `${Math.round(13 + t * 10)}px "IBM Plex Mono", monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('✓', coin.x, coin.y);
          ctx.restore();

        } else if (!coin.collected) {
          const pulse = Math.sin(now / 1000 + idx * 1.4) * 0.8;
          ctx.save();
          ctx.fillStyle = '#101010';
          ctx.strokeStyle = '#d0d0d0';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(coin.x, coin.y, 14 + pulse, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#d0d0d0';
          ctx.font = '600 12px "IBM Plex Mono", monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('+', coin.x, coin.y + 0.5);
          ctx.restore();

        } else if (!anim) {
          ctx.save();
          ctx.strokeStyle = '#2a2a2a';
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.arc(coin.x, coin.y, 14, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();
        }
      });
    }

    // 7. Эффект столкновения со стеной в лабиринте
    if (state.collisionAnim) {
      const elapsed = (now - state.collisionAnim.startTime) / 500;
      const ct = Math.min(elapsed, 1);
      if (ct < 1) {
        ctx.save();
        ctx.globalAlpha = 1 - ct;
        ctx.strokeStyle = '#ff7b7b';
        ctx.lineWidth = 2;
        const cx = state.collisionAnim.x;
        const cy = state.collisionAnim.y;
        const cr = 8 + ct * 14;

        ctx.beginPath();
        ctx.arc(cx, cy, cr, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#ff7b7b';
        ctx.font = 'bold 16px "IBM Plex Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('×', cx, cy);
        ctx.restore();
      } else {
        state.collisionAnim = null;
      }
    }

    // 8. Черепашка — шеврон
    const t = state.turtle;
    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.rotate((-t.heading * Math.PI) / 180);

    const sz = 13;
    ctx.beginPath();
    ctx.moveTo(sz * 1.3, 0);
    ctx.lineTo(-sz, -sz * 0.9);
    ctx.lineTo(-sz * 0.35, 0);
    ctx.lineTo(-sz, sz * 0.9);
    ctx.closePath();

    ctx.fillStyle = '#ececec';
    ctx.fill();
    ctx.strokeStyle = '#0a0a0a';
    ctx.lineWidth = 1;
    ctx.stroke();

    if (t.penDown) {
      ctx.fillStyle = '#0a0a0a';
      ctx.beginPath();
      ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 9. Победная анимация
    if (state.victory.active) {
      const elapsed = (now - state.victory.startTime) / 850;
      const vt = Math.min(elapsed, 1);
      if (vt < 1) {
        const flashAlpha = (1 - vt) * 0.3;
        ctx.fillStyle = `rgba(236,236,236,${flashAlpha})`;
        ctx.fillRect(0, 0, W, H);

        const textAlpha = vt < 0.4 ? vt / 0.4 : 1 - ((vt - 0.4) / 0.6);
        const textSize  = 56 + vt * 16;
        ctx.save();
        ctx.globalAlpha = textAlpha;
        ctx.fillStyle = '#ececec';
        ctx.font = `600 ${Math.round(textSize)}px "IBM Plex Mono", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✓', W / 2, H / 2);
        ctx.restore();
      } else {
        state.victory.active = false;
      }
    }
  }

  /* ================================================================
     ДВИЖОК АНИМАЦИИ
  ================================================================ */

  function cancelAnimation() {
    if (state.anim.rafId) cancelAnimationFrame(state.anim.rafId);
    state.anim.active = false;
    state.anim.rafId  = null;
    state.anim.onDone = null;
  }

  function moveDuration() { return SPEED_PRESETS[state.speedPreset].moveDuration; }
  function rotDuration()  { return SPEED_PRESETS[state.speedPreset].rotDuration; }

  function handleMazeWallCollision(x, y) {
    state.collisionAnim = { x, y, startTime: performance.now() };
    cancelAnimation();
    stopExecution();
    updateStatusBadge('столкновение со стеной!', 'collision');
    log('ой! удар о стену лабиринта — исправь команды');
    drawArena();
  }

  function animateMove(fromX, fromY, toX, toY, penDown, onDone) {
    const dur = moveDuration();

    // В лабиринте проверяем промежуточные точки на стены
    if (state.mode === 'maze') {
      const samples = Math.max(10, Math.ceil(Math.hypot(toX - fromX, toY - fromY) / 4));
      for (let i = 1; i <= samples; i++) {
        const f = i / samples;
        const curX = fromX + (toX - fromX) * f;
        const curY = fromY + (toY - fromY) * f;
        if (isMazeWallAt(curX, curY)) {
          // Черепашка останавливается чуть раньше точки столкновения
          const safeF = Math.max(0, (i - 1) / samples);
          const stopX = fromX + (toX - fromX) * safeF;
          const stopY = fromY + (toY - fromY) * safeF;
          state.turtle.x = stopX;
          state.turtle.y = stopY;
          if (penDown) state.lines.push({ x1: fromX, y1: fromY, x2: stopX, y2: stopY, penDown: true });
          handleMazeWallCollision(curX, curY);
          return;
        }
      }
    }

    if (dur === 0) {
      if (state.mode === 'coins') {
        for (let f = 0; f <= 1; f += 0.1) {
          checkCoinPickupAt(fromX + (toX - fromX) * f, fromY + (toY - fromY) * f);
        }
      }
      state.turtle.x = toX;
      state.turtle.y = toY;
      if (penDown) state.lines.push({ x1: fromX, y1: fromY, x2: toX, y2: toY, penDown: true });

      if (state.mode === 'maze' && checkMazeFinishAt(toX, toY)) {
        onMazeVictory();
      }

      drawArena();
      onDone();
      return;
    }

    state.anim = {
      active: true, type: 'move',
      startX: fromX, startY: fromY, endX: toX, endY: toY,
      startHeading: 0, endHeading: 0,
      penDown, startTime: performance.now(), duration: dur,
      rafId: null, onDone
    };

    function frame(now) {
      const raw = Math.min((now - state.anim.startTime) / dur, 1);
      const eased = easeInOut(raw);

      state.turtle.x = fromX + (toX - fromX) * eased;
      state.turtle.y = fromY + (toY - fromY) * eased;

      if (state.mode === 'coins') {
        checkCoinPickupAt(state.turtle.x, state.turtle.y);
      } else if (state.mode === 'maze' && checkMazeFinishAt(state.turtle.x, state.turtle.y)) {
        onMazeVictory();
      }

      drawArena();

      if (raw < 1) {
        state.anim.rafId = requestAnimationFrame(frame);
      } else {
        state.turtle.x = toX;
        state.turtle.y = toY;
        if (penDown) state.lines.push({ x1: fromX, y1: fromY, x2: toX, y2: toY, penDown: true });
        state.anim.active = false;
        drawArena();
        const cb = state.anim.onDone;
        state.anim.onDone = null;
        if (cb) cb();
      }
    }
    state.anim.rafId = requestAnimationFrame(frame);
  }

  function animateRotate(fromH, toH, onDone) {
    const dur = rotDuration();

    if (dur === 0) {
      state.turtle.heading = ((toH % 360) + 360) % 360;
      drawArena();
      onDone();
      return;
    }

    let delta = toH - fromH;
    if (delta > 180)  delta -= 360;
    if (delta < -180) delta += 360;

    state.anim = {
      active: true, type: 'rotate',
      startX: 0, startY: 0, endX: 0, endY: 0,
      startHeading: fromH, endHeading: toH,
      penDown: false, startTime: performance.now(), duration: dur,
      rafId: null, onDone
    };

    function frame(now) {
      const raw   = Math.min((now - state.anim.startTime) / dur, 1);
      const eased = easeInOut(raw);
      state.turtle.heading = ((fromH + delta * eased) % 360 + 360) % 360;
      drawArena();
      if (raw < 1) {
        state.anim.rafId = requestAnimationFrame(frame);
      } else {
        state.turtle.heading = ((toH % 360) + 360) % 360;
        state.anim.active = false;
        drawArena();
        const cb = state.anim.onDone;
        state.anim.onDone = null;
        if (cb) cb();
      }
    }
    state.anim.rafId = requestAnimationFrame(frame);
  }

  /* ================================================================
     СБОР МОНЕТ И ПОБЕДА
  ================================================================ */

  function checkCoinPickupAt(x, y) {
    state.coins.forEach((coin, idx) => {
      if (coin.collected) return;
      const dx = x - coin.x, dy = y - coin.y;
      if (Math.sqrt(dx * dx + dy * dy) <= PICKUP_RADIUS) {
        coin.collected = true;
        state.collectedCount++;
        state.coinAnims.push({ coinIdx: idx, startTime: performance.now(), done: false });
        updateScoreDisplay();
        log(`монета ${state.collectedCount} из ${state.coins.length} собрана`);
        if (state.collectedCount === state.coins.length) {
          updateStatusBadge('все монеты собраны ✓', 'success');
        }
      }
    });
  }

  function onMazeVictory() {
    if (state.mazeCompleted) return;
    state.mazeCompleted = true;
    updateStatusBadge('лабиринт пройден ✓', 'success');
    log('победа! выход из лабиринта найден!');
    startVictoryAnimation();
  }

  /* ================================================================
     ДВИЖОК ВЫПОЛНЕНИЯ
  ================================================================ */

  function flattenQueue(blocks) {
    const q = [];
    function process(list) {
      for (const b of list) {
        if (b.type === 'repeat') {
          const n = parseInt(b.val, 10) || 1;
          for (let i = 1; i <= n; i++) {
            for (const sub of (b.subBlocks || [])) {
              q.push({ blockId: sub.id, parentBlockId: b.id, type: sub.type, val: sub.val });
            }
          }
        } else {
          q.push({ blockId: b.id, type: b.type, val: b.val });
        }
      }
    }
    process(blocks);
    return q;
  }

  function animateCommand(cmd, onDone) {
    const t   = state.turtle;
    const val = parseFloat(cmd.val) || 0;

    switch (cmd.type) {
      case 'forward': {
        const rad = (-t.heading * Math.PI) / 180;
        const fx  = t.x, fy = t.y;
        const ex  = t.x + Math.cos(rad) * val;
        const ey  = t.y + Math.sin(rad) * val;
        log('вперёд на ' + val);
        animateMove(fx, fy, ex, ey, t.penDown, onDone);
        break;
      }
      case 'backward': {
        const rad = (-t.heading * Math.PI) / 180;
        const fx  = t.x, fy = t.y;
        const ex  = t.x - Math.cos(rad) * val;
        const ey  = t.y - Math.sin(rad) * val;
        log('назад на ' + val);
        animateMove(fx, fy, ex, ey, t.penDown, onDone);
        break;
      }
      case 'left': {
        const fromH = t.heading;
        const toH   = ((t.heading + val) % 360 + 360) % 360;
        log('поворот влево на ' + val + '°');
        animateRotate(fromH, toH, onDone);
        break;
      }
      case 'right': {
        const fromH = t.heading;
        const toH   = ((t.heading - val) % 360 + 360) % 360;
        log('поворот вправо на ' + val + '°');
        animateRotate(fromH, toH, onDone);
        break;
      }
      case 'penup': {
        t.penDown = false;
        log('перо поднято');
        drawArena();
        setTimeout(onDone, moveDuration() > 0 ? 80 : 0);
        break;
      }
      case 'pendown': {
        t.penDown = true;
        log('перо опущено');
        drawArena();
        setTimeout(onDone, moveDuration() > 0 ? 80 : 0);
        break;
      }
      default:
        onDone();
    }
  }

  function runNextStep() {
    if (!state.isRunning) return;
    const cmd = state.executionQueue[state.executingIndex];
    if (!cmd) { finishExecution(); return; }

    state.executingIndex++;
    highlightActiveBlock(cmd.blockId, cmd.parentBlockId);

    animateCommand(cmd, () => {
      if (state.isRunning) {
        state.execTimer = setTimeout(runNextStep, moveDuration() > 0 ? 16 : 0);
      }
    });
  }

  function runProgram() {
    if (state.programBlocks.length === 0) {
      log('добавь команды из палитры, чтобы начать');
      return;
    }

    if (state.isRunning) { pauseProgram(); return; }

    if (!state.isPaused) {
      resetArena();
      state.executionQueue = flattenQueue(state.programBlocks);
      state.executingIndex = 0;
    }

    state.isRunning = true;
    state.isPaused  = false;
    updateStatusBadge('выполняется...', 'running');
    if (dom.btnRun)  dom.btnRun.textContent = 'Пауза';
    if (dom.btnStep) dom.btnStep.disabled = true;

    runNextStep();
  }

  function pauseProgram() {
    state.isRunning = false;
    state.isPaused  = true;
    if (state.execTimer) clearTimeout(state.execTimer);
    cancelAnimation();
    updateStatusBadge('пауза', 'idle');
    if (dom.btnRun)  dom.btnRun.textContent = 'Продолжить';
    if (dom.btnStep) dom.btnStep.disabled = false;
    log('пауза');
  }

  function stopExecution() {
    state.isRunning = false;
    state.isPaused  = false;
    if (state.execTimer) clearTimeout(state.execTimer);
    cancelAnimation();
    if (dom.btnRun)  dom.btnRun.textContent = 'Запустить';
    if (dom.btnStep) dom.btnStep.disabled = false;
    highlightActiveBlock(null);
  }

  function finishExecution() {
    state.isRunning = false;
    state.isPaused  = false;
    if (dom.btnRun)  dom.btnRun.textContent = 'Запустить';
    if (dom.btnStep) dom.btnStep.disabled = false;
    highlightActiveBlock(null);

    if (state.mode === 'coins') {
      if (state.collectedCount === state.coins.length) {
        updateStatusBadge('все монеты собраны ✓', 'success');
        log('готово — все монеты собраны!');
        startVictoryAnimation();
      } else {
        updateStatusBadge(`собрано ${state.collectedCount} из ${state.coins.length}`, 'idle');
        log(`выполнение завершено — собрано ${state.collectedCount} из ${state.coins.length}`);
      }
    } else {
      if (state.mazeCompleted) {
        updateStatusBadge('лабиринт пройден ✓', 'success');
      } else {
        updateStatusBadge('финиш не достигнут', 'idle');
        log('черепашка остановилась — финиш ещё не достигнут');
      }
    }
  }

  function stepProgram() {
    if (state.programBlocks.length === 0) return;

    if (!state.isPaused && !state.isRunning && state.executingIndex === 0) {
      resetArena();
      state.executionQueue = flattenQueue(state.programBlocks);
      state.executingIndex = 0;
    }

    if (state.isRunning) { pauseProgram(); return; }

    if (state.executingIndex < state.executionQueue.length) {
      const cmd = state.executionQueue[state.executingIndex];
      state.executingIndex++;
      state.isPaused = true;
      if (dom.btnRun) dom.btnRun.textContent = 'Продолжить';

      highlightActiveBlock(cmd.blockId, cmd.parentBlockId);
      updateStatusBadge(`шаг ${state.executingIndex} / ${state.executionQueue.length}`, 'idle');

      animateCommand(cmd, () => {
        if (state.executingIndex >= state.executionQueue.length) finishExecution();
      });
    } else {
      finishExecution();
    }
  }

  /* ================================================================
     ПОБЕДНАЯ АНИМАЦИЯ
  ================================================================ */

  function startVictoryAnimation() {
    if (state.victory.rafId) cancelAnimationFrame(state.victory.rafId);
    state.victory = { active: true, startTime: performance.now(), rafId: null };

    function victoryFrame() {
      drawArena();
      if (state.victory.active) {
        state.victory.rafId = requestAnimationFrame(victoryFrame);
      }
    }
    victoryFrame();
  }

  /* ================================================================
     УПРАВЛЕНИЕ БЛОКАМИ
  ================================================================ */

  function uid() { return 'b_' + Math.random().toString(36).substr(2, 8); }

  function addBlockToWorkspace(type, targetSubArray) {
    const defs = getCommandDefs();
    const def = defs[type];
    if (!def) return;

    const block = { id: uid(), type, val: def.defaultVal };
    if (def.isContainer) {
      const subVal = state.mode === 'maze' ? 40 : 80;
      block.subBlocks = [
        { id: uid(), type: 'forward', val: subVal },
        { id: uid(), type: 'left',    val: 90 }
      ];
    }
    if (targetSubArray) targetSubArray.push(block);
    else state.programBlocks.push(block);

    stopExecution();
    renderWorkspace();
    renderPythonCode();
    saveStorage();
  }

  function removeBlock(blockId) {
    function del(list) {
      const i = list.findIndex(b => b.id === blockId);
      if (i !== -1) { list.splice(i, 1); return true; }
      return list.some(b => b.subBlocks && del(b.subBlocks));
    }
    del(state.programBlocks);
    stopExecution();
    renderWorkspace();
    renderPythonCode();
    saveStorage();
  }

  function moveBlock(blockId, dir) {
    function mv(list) {
      const i = list.findIndex(b => b.id === blockId);
      if (i !== -1) {
        const j = i + dir;
        if (j >= 0 && j < list.length) { [list[i], list[j]] = [list[j], list[i]]; return true; }
        return false;
      }
      return list.some(b => b.subBlocks && mv(b.subBlocks));
    }
    if (mv(state.programBlocks)) {
      stopExecution();
      renderWorkspace();
      renderPythonCode();
      saveStorage();
    }
  }

  function reorderBlocks(dragId, dropId, position) {
    const srcIdx = state.programBlocks.findIndex(b => b.id === dragId);
    if (srcIdx === -1) return;
    const [dragged] = state.programBlocks.splice(srcIdx, 1);
    let dstIdx = state.programBlocks.findIndex(b => b.id === dropId);
    if (dstIdx === -1) {
      state.programBlocks.push(dragged);
    } else {
      if (position === 'after') dstIdx++;
      state.programBlocks.splice(dstIdx, 0, dragged);
    }
    stopExecution();
    renderWorkspace();
    renderPythonCode();
    saveStorage();
  }

  function updateBlockVal(blockId, newVal) {
    function upd(list) {
      for (const b of list) {
        if (b.id === blockId) { b.val = newVal; return true; }
        if (b.subBlocks && upd(b.subBlocks)) return true;
      }
    }
    upd(state.programBlocks);
    renderPythonCode();
    saveStorage();
  }

  /* ================================================================
     РЕНДЕР: ПАЛИТРА
  ================================================================ */

  function renderPalette() {
    if (!dom.paletteList) return;
    dom.paletteList.innerHTML = '';

    const groups = getPaletteGroups();
    const defs   = getCommandDefs();

    groups.forEach(group => {
      const groupEl = document.createElement('div');
      groupEl.className = 'palette-group';

      const labelEl = document.createElement('div');
      labelEl.className = 'palette-group-label';
      labelEl.textContent = group.label;
      groupEl.appendChild(labelEl);

      const cardsEl = document.createElement('div');
      cardsEl.className = 'palette-group-cards';

      group.types.forEach(type => {
        const def = defs[type];
        if (!def) return;
        const btn = document.createElement('button');
        btn.className = 'palette-card';
        btn.type = 'button';
        btn.title = 'Добавить: ' + def.label;

        const nameSpan = document.createElement('span');
        nameSpan.className = 'palette-card-name';
        nameSpan.textContent = def.label;
        btn.appendChild(nameSpan);

        if (!def.noVal) {
          const paramSpan = document.createElement('span');
          paramSpan.className = 'palette-card-param';
          paramSpan.textContent = def.defaultVal + def.unit;
          btn.appendChild(paramSpan);
        }

        btn.addEventListener('click', () => addBlockToWorkspace(type));
        cardsEl.appendChild(btn);
      });

      groupEl.appendChild(cardsEl);
      dom.paletteList.appendChild(groupEl);
    });
  }

  /* ================================================================
     РЕНДЕР: РАБОЧАЯ ОБЛАСТЬ (карточки + DnD)
  ================================================================ */

  function renderWorkspace() {
    if (!dom.workspaceList) return;
    dom.workspaceList.innerHTML = '';
    const isEmpty = state.programBlocks.length === 0;
    if (dom.emptyNote) dom.emptyNote.style.display = isEmpty ? 'block' : 'none';
    if (isEmpty) return;

    state.programBlocks.forEach((block, idx) => {
      const el = createBlockEl(block, state.programBlocks, idx, false);
      if (el) dom.workspaceList.appendChild(el);
    });
  }

  function createBlockEl(block, parentList, index, isSubBlock) {
    const defs = getCommandDefs();
    const def = defs[block.type] || COMMAND_DEFS_COINS[block.type];
    if (!def) return null;

    const el = document.createElement('div');
    el.className = 'code-card' + (isSubBlock ? ' sub-card' : '');
    el.setAttribute('data-block-id', block.id);

    // Шапка карточки
    const header = document.createElement('div');
    header.className = 'card-header';

    // Хэндл drag-and-drop
    if (!isSubBlock) {
      const handle = document.createElement('div');
      handle.className = 'card-drag-handle';
      handle.setAttribute('aria-hidden', 'true');
      header.appendChild(handle);

      el.draggable = true;
      el.addEventListener('dragstart',  e => onDragStart(e, block.id, el));
      el.addEventListener('dragover',   e => onDragOver(e, block.id, el));
      el.addEventListener('drop',       e => onDrop(e, block.id));
      el.addEventListener('dragend',    () => onDragEnd());
      el.addEventListener('dragenter',  e => e.preventDefault());
      el.addEventListener('dragleave',  e => {
        if (!el.contains(e.relatedTarget)) {
          el.classList.remove('drop-before', 'drop-after');
        }
      });
    }

    // Номер + название
    const left = document.createElement('div');
    left.className = 'card-left';

    if (!isSubBlock) {
      const orderEl = document.createElement('span');
      orderEl.className = 'card-order';
      orderEl.textContent = String(index + 1);
      left.appendChild(orderEl);
    }

    const fnLbl = document.createElement('span');
    fnLbl.className = 'card-fn-label';
    fnLbl.textContent = def.label;
    left.appendChild(fnLbl);
    header.appendChild(left);

    // Степпер числового значения
    if (!def.noVal) {
      header.appendChild(createStepper(block, def));
    }

    // Кнопки управления
    const actions = document.createElement('div');
    actions.className = 'card-actions';

    function ctrlBtn(text, title, disabled, onClick) {
      const b = document.createElement('button');
      b.className = 'btn-card-ctrl';
      b.type = 'button';
      b.textContent = text;
      b.title = title;
      b.disabled = disabled;
      b.addEventListener('click', e => { e.stopPropagation(); onClick(); });
      return b;
    }

    actions.appendChild(ctrlBtn('▲', 'Выше', index === 0, () => moveBlock(block.id, -1)));
    actions.appendChild(ctrlBtn('▼', 'Ниже', index === parentList.length - 1, () => moveBlock(block.id, 1)));
    actions.appendChild(ctrlBtn('×', 'Удалить', false, () => removeBlock(block.id)));
    actions.children[actions.children.length - 1].classList.add('del');

    header.appendChild(actions);
    el.appendChild(header);

    // Тело контейнера (repeat)
    if (def.isContainer) {
      const body = document.createElement('div');
      body.className = 'card-container-body';

      (block.subBlocks || []).forEach((sub, sIdx) => {
        const subEl = createBlockEl(sub, block.subBlocks, sIdx, true);
        if (subEl) body.appendChild(subEl);
      });

      const addBtn = document.createElement('button');
      addBtn.className = 'btn-add-sub';
      addBtn.type = 'button';
      addBtn.textContent = '+ шаг в цикл';
      addBtn.addEventListener('click', () => addBlockToWorkspace('forward', block.subBlocks));
      body.appendChild(addBtn);
      el.appendChild(body);
    }

    return el;
  }

  function createStepper(block, def) {
    const wrap = document.createElement('div');
    wrap.className = 'card-stepper';
    wrap.addEventListener('click', e => e.stopPropagation());

    const btnDec = document.createElement('button');
    btnDec.className = 'btn-step';
    btnDec.type = 'button';
    btnDec.textContent = '−';
    btnDec.title = '−' + def.step;

    const display = document.createElement('span');
    display.className = 'step-display';
    display.textContent = String(block.val);

    const unitEl = document.createElement('span');
    unitEl.className = 'step-unit';
    unitEl.textContent = def.unit;

    const btnInc = document.createElement('button');
    btnInc.className = 'btn-step';
    btnInc.type = 'button';
    btnInc.textContent = '+';
    btnInc.title = '+' + def.step;

    function setVal(v) {
      v = Math.round(v / def.step) * def.step;
      v = Math.max(def.min, Math.min(def.max, v));
      block.val = v;
      display.textContent = String(v);
      updateBlockVal(block.id, v);
    }

    btnDec.addEventListener('click', () => setVal(block.val - def.step));
    btnInc.addEventListener('click', () => setVal(block.val + def.step));

    display.addEventListener('dblclick', () => {
      const input = document.createElement('input');
      input.type = 'number';
      input.className = 'step-inline-input';
      input.value = block.val;
      input.min = def.min; input.max = def.max; input.step = def.step;
      display.replaceWith(input);
      input.focus(); input.select();
      function commit() {
        let v = parseInt(input.value, 10);
        if (isNaN(v)) v = block.val;
        setVal(v);
        input.replaceWith(display);
        display.textContent = String(block.val);
      }
      input.addEventListener('blur', commit);
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') commit();
        if (e.key === 'Escape') { input.replaceWith(display); }
      });
    });

    wrap.appendChild(btnDec);
    wrap.appendChild(display);
    wrap.appendChild(unitEl);
    wrap.appendChild(btnInc);
    return wrap;
  }

  /* ================================================================
     DRAG AND DROP
  ================================================================ */

  function onDragStart(e, blockId, el) {
    state.dnd.draggingId = blockId;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', blockId);

    const ghost = el.cloneNode(true);
    ghost.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:' + el.offsetWidth + 'px;opacity:0.75;pointer-events:none;';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, el.offsetWidth / 2, 24);
    setTimeout(() => ghost.remove(), 0);

    requestAnimationFrame(() => el.classList.add('dragging'));
  }

  function onDragOver(e, blockId, el) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (blockId === state.dnd.draggingId) return;

    dom.workspaceList.querySelectorAll('.drop-before, .drop-after').forEach(c => {
      c.classList.remove('drop-before', 'drop-after');
    });

    const rect = el.getBoundingClientRect();
    const pos  = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
    el.classList.add(pos === 'before' ? 'drop-before' : 'drop-after');

    state.dnd.dropTargetId = blockId;
    state.dnd.dropPosition = pos;
  }

  function onDrop(e, blockId) {
    e.preventDefault();
    if (
      state.dnd.draggingId &&
      state.dnd.dropTargetId &&
      state.dnd.draggingId !== state.dnd.dropTargetId
    ) {
      reorderBlocks(state.dnd.draggingId, state.dnd.dropTargetId, state.dnd.dropPosition);
    }
    onDragEnd();
  }

  function onDragEnd() {
    state.dnd.draggingId   = null;
    state.dnd.dropTargetId = null;
    state.dnd.dropPosition = null;
    if (dom.workspaceList) {
      dom.workspaceList.querySelectorAll('.code-card').forEach(c => {
        c.classList.remove('dragging', 'drop-before', 'drop-after');
      });
    }
  }

  /* ================================================================
     ПОДСВЕТКА АКТИВНОГО БЛОКА
  ================================================================ */

  function highlightActiveBlock(blockId, parentBlockId) {
    if (!dom.workspaceList) return;
    dom.workspaceList.querySelectorAll('.code-card').forEach(el => el.classList.remove('active-step'));
    if (!blockId) return;

    const el = dom.workspaceList.querySelector('[data-block-id="' + blockId + '"]');
    if (el) { el.classList.add('active-step'); el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }

    if (parentBlockId) {
      const pel = dom.workspaceList.querySelector('[data-block-id="' + parentBlockId + '"]');
      if (pel) pel.classList.add('active-step');
    }
  }

  /* ================================================================
     РЕГУЛЯТОР СКОРОСТИ
  ================================================================ */

  function setupSpeedControl() {
    if (!dom.speedBar) return;
    dom.speedBar.innerHTML = '';

    const label = document.createElement('span');
    label.className = 'speed-label';
    label.textContent = 'скорость:';
    dom.speedBar.appendChild(label);

    Object.entries(SPEED_PRESETS).forEach(([key, preset]) => {
      const btn = document.createElement('button');
      btn.className = 'speed-btn' + (key === state.speedPreset ? ' active' : '');
      btn.type = 'button';
      btn.textContent = preset.label;
      btn.addEventListener('click', () => {
        state.speedPreset = key;
        saveStorage();
        dom.speedBar.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
      dom.speedBar.appendChild(btn);
    });
  }

  /* ================================================================
     ВКЛАДКИ (карточки / python)
  ================================================================ */

  function setupTabs() {
    if (!dom.tabBlocks || !dom.tabPython) return;

    dom.tabBlocks.addEventListener('click', () => {
      state.viewMode = 'blocks';
      dom.tabBlocks.classList.add('active');
      dom.tabPython.classList.remove('active');
      dom.viewBlocks.style.display = 'flex';
      dom.viewPython.style.display = 'none';
    });

    dom.tabPython.addEventListener('click', () => {
      state.viewMode = 'python';
      dom.tabPython.classList.add('active');
      dom.tabBlocks.classList.remove('active');
      dom.viewBlocks.style.display = 'none';
      dom.viewPython.style.display = 'block';
      renderPythonCode();
    });

    if (dom.btnCopyCode) {
      dom.btnCopyCode.addEventListener('click', () => {
        navigator.clipboard.writeText(generatePythonCode())
          .then(() => {
            const orig = dom.btnCopyCode.textContent;
            dom.btnCopyCode.textContent = 'скопировано ✓';
            setTimeout(() => { dom.btnCopyCode.textContent = orig; }, 1800);
          })
          .catch(() => { dom.btnCopyCode.textContent = 'ошибка'; });
      });
    }
  }

  /* ================================================================
     ГЕНЕРАЦИЯ PYTHON-КОДА
  ================================================================ */

  function generatePythonCode() {
    let py = `# Черепашка: ${state.mode === 'coins' ? 'сбор монет' : 'прохождение лабиринта'}\nimport turtle\n\nt = turtle.Turtle()\nt.speed(3)\n\n`;

    const defs = getCommandDefs();

    function ser(list, indent) {
      for (const b of list) {
        const def = defs[b.type] || COMMAND_DEFS_COINS[b.type];
        if (!def) continue;
        if (b.type === 'repeat') {
          py += indent + 'for _ in range(' + b.val + '):\n';
          if (b.subBlocks && b.subBlocks.length) ser(b.subBlocks, indent + '    ');
          else py += indent + '    pass\n';
        } else if (def.noVal) {
          py += indent + 't.' + def.pythonName + '()\n';
        } else {
          py += indent + 't.' + def.pythonName + '(' + b.val + ')\n';
        }
      }
    }

    if (!state.programBlocks.length) {
      py += '# Программа пуста. Добавь карточки команд.\n';
    } else {
      ser(state.programBlocks, '');
    }
    return py;
  }

  function renderPythonCode() {
    if (!dom.pythonOutput) return;
    const py = generatePythonCode();
    if (window.PythonHighlighter) {
      dom.pythonOutput.innerHTML = window.PythonHighlighter.highlightCode(py);
    } else {
      dom.pythonOutput.textContent = py;
    }
  }

  /* ================================================================
     ЛОГ
  ================================================================ */

  function log(msg) {
    if (!dom.actionLog) return;
    const line = document.createElement('div');
    line.className = 'log-line';
    line.textContent = '› ' + msg;
    dom.actionLog.appendChild(line);
    dom.actionLog.scrollTop = dom.actionLog.scrollHeight;
  }

  function clearLog() {
    if (dom.actionLog) dom.actionLog.innerHTML = '';
  }

  /* ================================================================
     ВСПОМОГАТЕЛЬНЫЕ: статус и счёт
  ================================================================ */

  function updateScoreDisplay() {
    if (dom.coinScore) dom.coinScore.textContent = String(state.collectedCount);
  }

  function updateStatusBadge(text, type) {
    if (!dom.statusBadge) return;
    dom.statusBadge.textContent = text;
    dom.statusBadge.className = 'interactive-badge';
    if (type === 'running') dom.statusBadge.classList.add('running');
    if (type === 'success') dom.statusBadge.classList.add('success');
    if (type === 'collision') dom.statusBadge.classList.add('collision');
  }

  /* ================================================================
     СОБЫТИЯ
  ================================================================ */

  function setupEvents() {
    if (dom.btnModeCoins) dom.btnModeCoins.addEventListener('click', () => setMode('coins'));
    if (dom.btnModeMaze)  dom.btnModeMaze.addEventListener('click', () => setMode('maze'));

    if (dom.btnRun)   dom.btnRun.addEventListener('click', runProgram);
    if (dom.btnStep)  dom.btnStep.addEventListener('click', stepProgram);
    if (dom.btnReset) dom.btnReset.addEventListener('click', resetArena);
    if (dom.btnClear) dom.btnClear.addEventListener('click', () => {
      stopExecution();
      state.programBlocks = [];
      resetArena();
      renderWorkspace();
      renderPythonCode();
      saveStorage();
      log('программа очищена');
    });
  }

  /* ================================================================
     IDLE-ЦИКЛ: пульс монет, финиша и анимации
  ================================================================ */

  function startIdlePulse() {
    let lastTs = 0;
    function tick(ts) {
      const isVisible = dom.screen && dom.screen.classList.contains('active');
      if (isVisible && !state.anim.active && !state.victory.active) {
        if (state.mode === 'coins') {
          const hasAnimatingCoins   = state.coinAnims.some(a => !a.done);
          const hasUncollectedCoins = state.coins.some(c => !c.collected);
          if ((hasAnimatingCoins || hasUncollectedCoins) && ts - lastTs > 33) {
            lastTs = ts;
            drawArena();
          }
        } else if (state.mode === 'maze') {
          // Пульс метки финиша в лабиринте
          if (!state.mazeCompleted && ts - lastTs > 40) {
            lastTs = ts;
            drawArena();
          }
        }
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ================================================================
     ЗАПУСК МОДУЛЯ
  ================================================================ */

  function startInteractive() {
    initDom();
    if (!dom.screen) return;

    if (!initialized) {
      initialized = true;
      loadStorage();
      setupTabs();
      setupEvents();
      setupSpeedControl();

      if (dom.btnModeCoins) dom.btnModeCoins.classList.toggle('active', state.mode === 'coins');
      if (dom.btnModeMaze)  dom.btnModeMaze.classList.toggle('active', state.mode === 'maze');
      if (dom.statsCoins)   dom.statsCoins.style.display = state.mode === 'coins' ? '' : 'none';
      if (dom.statsMaze)    dom.statsMaze.style.display  = state.mode === 'maze' ? '' : 'none';

      renderPalette();
      setupLevel(getCurrentLevelIndex());
      startIdlePulse();
    } else {
      drawArena();
    }
  }

  window.InteractiveTurtle = {
    start: startInteractive,
    resetArena,
    stop: stopExecution,
    setMode
  };

})(window);
