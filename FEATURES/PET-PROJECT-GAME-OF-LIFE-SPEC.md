# Спецификация: Интерактивный пет-проект «Игра «Жизнь» Конвея» (Game of Life)

> **Статус документа:** Архитектурная спецификация модуля для ИИ-агента / Разработчика  
> **Версия спецификации:** 1.0.0  
> **Целевой модуль:** `content/projects/life/`  
> **Стек:** Vanilla JS (ES6+) + HTML5 Canvas + CSS3 + Pyodide WebAssembly  
> **Ограничения:** Zero-Build, Offline-First, No external CDN/npm, VkatStorage compliance  

---

## 1. Концепция и UX-революция модуля

### 1.1. Отказ от классического «сухого» лейаута
В традиционных курсах программирования пет-проекты строятся по унылой схеме: *слева текст задачи, справа редактор, снизу две строчки в консоли*. Это убивает мотивацию новичка.

Модуль **Game of Life** в «вкат.py» проектируется как **живая интерактивная лаборатория**:
1. **Холст — центр внимания:** 60fps Canvas с визуализацией клеток, рождений, смертей и тепловых следов.
2. **Концепция «Сломанного мира»:** Студент не пишет игру «с нуля в пустоте». Мир уже существует на экране перед его глазами, но он *сломан* (застыл, мерцает ошибками, умирает за секунду). Каждый шаг студента в Python буквально «исцеляет» один закон вселенной на экране.
3. **Мгновенный отклик даже на недописанный код:** Студент может потыкать холст мышью, нарисовать фигуры, запустить симуляцию и увидеть, *почему именно* его текущая логика привела к коллапсу или хаосу.
4. **Кульминационный «Hero Moment» (WORLD_BIRTH):** При первой успешной сдаче третьего шага (законы Конвея) интерфейс производит впечатляющую вспышку и анимационную волну пробуждения мира, запуская легендарный глайдер.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ЭКРАН PET-PROJECT: GAME OF LIFE                                  [x Закрыть] │
├──────────────────────────────────────┬──────────────────────────────────────┤
│ ┌──────────────────────────────────┐ │ ┌─ ШАГ 3 / 4 ──────────────────────┐ │
│ │ HUD: Ген: 142 | Живых: 84 [~~~]  │ │ │ Вдохни жизнь: B3 / S23           │ │
│ │                                  │ │ └──────────────────────────────────┘ │
│ │                                  │ │ Инженерный глиф: [ Схема B3/S23 ]    │ │
│ │          CANVAS 50x50            │ │                                      │
│ │   [Живые клетки + шлейфы]        │ │ Задание: Реализуй should_live().     │ │
│ │   [Курсор-инспектор: X:12 Y:8]   │ │ Сейчас клетки гибнут от одиночества. │ │
│ │                                  │ ├──────────────────────────────────────┤
│ ├──────────────────────────────────┤ │ РЕДАКТОР PYTHON                      │ │
│ │ [▶ Старт] [⏸ Пауза] [⏭ Шаг] [↺]  │ │ def should_live(alive, n):           │ │
│ │ Скорость: [======o] Пресеты: [▼] │ │     if alive and n in (2, 3): ...    │ │
│ └──────────────────────────────────┘ ├──────────────────────────────────────┤
│                                      │ [ Тест ] [ ▶ Проверить (Ctrl+Enter) ] │
└──────────────────────────────────────┴──────────────────────────────────────┘
```

---

## 2. Архитектура интеграции и файловая структура

### 2.1. Потоки данных (Python ↔ Web Worker ↔ Canvas 60fps)

1. **Проверка решений (Unit Testing):**
   * Выполняется через существующий мост `VkatChecker` (`app/checker.js`) внутри Web Worker (`app/checker-worker.js`).
   * Студенческий код тестируется на детерминированных тестовых кейсах (границы, подсчёт соседей, правила).
2. **Интерактивный запуск (Live Simulation):**
   * Движок симуляции реализован в двух режимах:
     * **Режим JS-зеркала (для сверхплавных 60fps):** В браузере работает JS-реализация правил, синхронизированная с кодом студента после успешной проверки шага.
     * **Режим «Твой код в деле» (Pyodide Execution):** По кнопке симуляции сетка `grid` передаётся в Pyodide через лёгкий JSON-снапшот, функция студента делает тик в Python, и результат отрисовывается на Canvas.
3. **Изоляция хранилища:**
   * Прогресс шагов и черновики кода сохраняются через `window.VkatStorage` с префиксом `project_life_step_<N>`. Прямой `localStorage` строго запрещён.

### 2.2. Файловая карта модуля

```
vkat_py/
├── content/
│   └── projects/
│       └── life/
│           └── tasks.js           # Задачи шагов 1-4, метаданные, тесты, подсказки
├── app/
│   ├── life-renderer.js           # Холст, частицы, анимация, HUD, интерактив
│   ├── glyphs.js                  # +3 инженерных SVG-глифа (lifeNeighbors, lifeRules, lifePatterns)
│   ├── styles.css                 # +~220 строк стилей .life-*
│   └── renderers.js               # Делегирование рендеринга на screen-life
├── index.html                     # Разметка <div id="screen-life"> + <script> теги
└── dev/
    └── run_js_validation.js       # Секция 22: 12 тестов валидации модуля Life
```

---

## 3. Спецификация Canvas и графического конвейера

### 3.1. Параметры сетки и рендерера
* **Разрешение матрицы:** 50 колонок × 50 строк (2500 ячеек).
* **Размер ячейки:** $10 \times 10$ px (базовый холст $500 \times 500$ px).
* **HiDPI / Retina Поддержка:** Обязательный учёт `window.devicePixelRatio`.
  ```javascript
  const dpr = window.devicePixelRatio || 1;
  canvas.width = 500 * dpr;
  canvas.height = 500 * dpr;
  canvas.style.width = '500px';
  canvas.style.height = '500px';
  ctx.scale(dpr, dpr);
  ```
* **Частота обновления:** 60 кадров в секунду через `requestAnimationFrame`.
* **Тактовая частота симуляции:** Регулируется от 1 до 30 поколений в секунду (по умолчанию 10 gen/s).

### 3.2. Цветовая палитра (Дизайн-токены `vkat_py`)
Рендерер считывает токены из CSS-переменных темы для идеальной согласованности:

```javascript
const PALETTE = {
  bg: '#0a0a0a',            // Фон холста
  gridLines: '#1a1a1a',     // Сетка 1px
  gridSub: '#141414',       // Фоновые точки
  border: '#2a2a2a',        // Рамка поля
  
  // Клетки (возрастная градация)
  cellNew: '#ffffff',       // Новорожденная клетка (вспышка)
  cellYoung: '#ececec',     // Молодая (1-4 поколения)
  cellMature: '#c8c8c8',    // Зрелая (5-14 поколений)
  cellOld: '#8a8a8a',       // Старая (15+ поколений)
  
  // Анимационные эффекты
  trail: '#FF6A00',         // Фирменный оранжевый шлейф недавней смерти
  cursor: 'rgba(255, 106, 0, 0.4)', // Курсор-инспектор
  selection: '#FF6A00'
};
```

---

## 4. Модель данных и анимационная система

### 4.1. Структура состояния ячейки (Per-Cell Model)
Матрица $50 \times 50$ содержит типизированные структуры ячеек:

```javascript
class Cell {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.alive = false;
    this.age = 0;              // Количество поколений непрерывной жизни
    this.bornProgress = 0;     // 0.0 -> 1.0 (прогресс анимации появления)
    this.dieProgress = 0;      // 0.0 -> 1.0 (прогресс анимации угасания)
    this.trailOpacity = 0;     // 1.0 -> 0.0 (шлейф после гибели)
  }
}
```

### 4.2. Алгоритмы анимации (Кадровые эффекты)

#### А. Рождение клетки (`spawnAnimation`)
* Клетка не просто появляется пикселем — она «прорастает» из центра ячейки с упругим отскоком (`easeOutBack`):
  $$\text{scale}(t) = 1 + 2.70158(t - 1)^3 + 1.70158(t - 1)^2$$
* Длительность: 180 мс (11 кадров).
* На первом кадре: лёгкое свечение `box-shadow` или радиальный градиент `#ffffff` (радиус 1.5 ячейки).

#### Б. Смерть клетки (`deathAnimation`)
* Клетка не исчезает мгновенно:
  * Размер уменьшается: $1.0 \to 0.2$.
  * Прозрачность: $1.0 \to 0.0$.
  * Длительность: 150 мс (9 кадров).

#### В. Тепловой шлейф («Память поля» / `trailAnimation`)
* Если погибшая клетка находилась рядом с активной колонией, на её месте остаётся оранжевый след (`#FF6A00`), затухающий за 400 мс ($0.35 \to 0.0$).
* Это позволяет визуально видеть «траекторию движения» глайдеров и пульсаров в виде красивых кометных хвостов.

#### Г. Кульминационный эффект: WORLD_BIRTH (Пробуждение мира)
Срабатывает ровно один раз при первом успешном прохождении Шага 3 (`should_live`):
1. **Фаза 1 (Затишье, 0–400 мс):** Холст плавно затемняется полупрозрачным оверлеем (`rgba(10, 10, 10, 0.7)`).
2. **Фаза 2 (Световая волна, 400–1200 мс):** Из центра поля $(25, 25)$ радиально во все стороны расходится 2px кольцевая волна янтарного цвета `#FF6A00` со спадом свечения.
3. **Фаза 3 (Рождение жизни, 1200–1600 мс):** В центре поля материализуется классический **Glider**, который делает первые 5 шагов под аккомпанемент плавной подсветки сетки.
4. **Фаза 4 (Тост-баннер):** Всплывает золотисто-оранжевый баннер:
   > **«МИР ОЖИЛ. Законы Конвея приведены в действие.»**

---

## 5. Распознавание паттернов и HUD-интерфейс

### 5.1. Автоматический Pattern Detector
Холст непрерывно сканирует живые скопления клеток и распознаёт классические фигуры Джона Конвея, выводя аккуратный инженерный бейдж в верхнюю плашку:

| Сигнатура | Название | Тип | Реакция интерфейса |
| :--- | :--- | :--- | :--- |
| `2x2 block` | **Блок** | Натюрморт | Бейдж: `[▪] Натюрморт: «Блок»` |
| `3x1 horizontal/vertical` | **Мигалка (Blinker)** | Осциллятор (P2) | Бейдж: `[~] Осциллятор: «Мигалка» (P=2)` |
| `Glider 5-cell` | **Глайдер** | Космический корабль | Бейдж: `[>] Планер: «Глайдер» (V=c/4)` |
| `Pulsar 48-cell` | **Пульсар** | Осциллятор (P3) | Бейдж: `[*] Мега-осциллятор: «Пульсар»` |

*Тост держится 2.5 секунды, не спамит (кулдаун 10 секунд на один и тот же тип фигуры).*

### 5.2. HUD (Информационная панель поверх Canvas)
В верхнем левом и правом углах Canvas отображаются тонкие полупрозрачные индикаторы:
* **Слева:** Поколение (`GEN: 0142`), Живых клеток (`POP: 84`), Плотность биомассы (`3.36%`).
* **Справа:** Микро-график популяции (**Sparkline**) за последние 50 поколений:
  * 1px линия цвета `#ececec`.
  * Оранжевая точка на конце (`#FF6A00`).
  * Позволяет наглядно видеть затухание, циклы осцилляторов или экспоненциальный взрыв.

### 5.3. Интерактив мыши и карандаш
1. **Клик / Зажатие ЛКМ:** Оживляет ячейку под курсором.
2. **Зажатие ПКМ или Shift+ЛКМ:** Стирает ячейку.
3. **Курсор-прицел:** При наведении на холст ячейка подсвечивается тонким оранжевым контуром, а снизу пишется `X: 14 | Y: 28 | Соседей: 3`.
4. **Smart Pause:** Если холст находился в режиме воспроизведения, зажатие мыши для рисования мягко ставит симуляцию на паузу, предотвращая смазывание рисунка, и позволяет продолжить после отпускания.

---

## 6. Четырёхшаговая прогрессия обучения («Сломанный мир»)

### Шаг 1: «Границы вселенной» — `is_alive(grid, x, y)`
* **Нарратив:** Мир полон пустоты, но любая попытка заглянуть за горизонт вызывает краш симулятора (`IndexError`). Нам нужен безопасный сенсор.
* **Задача:** Написать функцию `is_alive(grid, x, y)`, возвращающую `True`, если ячейка жива, и `False`, если она мертва или координаты выходят за пределы матрицы $50 \times 50$.
* **Тесты:** Проверка корректных координат, отрицательных чисел, выхода за `len(grid)` и `len(grid[0])`.
* **Визуализация на холсте:** Холст в статическом режиме «Инспектор». Клик по ячейкам подсвечивает проверяемые координаты лучом радара.

### Шаг 2: «Окрестность Мура» — `count_neighbors(grid, x, y)`
* **Нарратив:** Клетки глухи друг к другу. Ни одна клетка не знает, сколько собратьев находится вокруг неё. На экране хаотичный статичный шум.
* **Задача:** Написать функцию `count_neighbors(grid, x, y)`, которая опрашивает 8 соседних ячеек (по горизонтали, вертикали и диагоналям) с помощью `is_alive()` и возвращает их сумму.
* **Тесты:** Углы поля, изоляция (0 соседей), плотное окружение (8 соседей), произвольный паттерн креста.
* **Инженерный глиф:** `lifeNeighbors` (схема 3×3 с векторами направлений).

### Шаг 3: «Законы Конвея» — `should_live(alive, n)`
* **Нарратив:** Главный закон жизни. Сейчас любая колония вымирает в первый же кадр. Сформулируй правила рождения и выживания.
* **Задача:**
  * Если клетка жива (`alive == True`), она выживает только при 2 или 3 соседях. Иначе гибнет от одиночества или перенаселения.
  * Если клетка мертва (`alive == False`), в ней зарождается жизнь ровно при 3 соседях.
* **Тесты:** Все комбинации $0..8$ соседей для живой и мертвой клетки.
* **Инженерный глиф:** `lifeRules` (сравнительная схема B3 / S23).
* **Триггер:** Успешный прогон тестов запускает **WORLD_BIRTH**!

### Шаг 4: «Хакер правил» — `BIRTH_RULE` и `SURVIVAL_RULE`
* **Нарратив:** Мир Конвея — лишь одна из сотен возможных вселенных. Параметризуй движок через списки правил и исследуй альтернативные формы бытия.
* **Задача:**
  * Переписать логику на универсальный вид:
    ```python
    BIRTH_RULE = [3]       # B3
    SURVIVAL_RULE = [2, 3] # S23

    def step(grid):
        ...
    ```
  * Студенту предлагается испытать знаменитый режим **HighLife** (`B36/S23` — порождает знаменитый самовоспроизводящийся Репликатор) и режим **Seeds** (`B2/S` — безумный кристаллический рост).
* **Разблокировка:** Полноценный режим песочницы: выпадающий список пресетов (Glider, Gosper Gun, Pulsar, Spaceship), экспорт/импорт поля в формате RLE / JSON.
* **Инженерный глиф:** `lifePatterns`.

---

## 7. Спецификация 3 новых SVG-глифов (`app/glyphs.js`)

Глифы строятся строго по стандартам дизайн-системы: $360 \times 220$, 1px линии, токены `.gl`, `.gm`, `.gf`, `.gt`, `.gT`, анимационные классы появления `.d` и `.f`.

### 7.1. Глиф 1: `lifeNeighbors` (Окрестность Мура)
* **Смысл:** Сетка $3 \times 3$, центральная клетка выделена инверсией (`.gf`), от неё идут 8 тонких пунктирных стрелок к соседям с подписями смещений $(\Delta x, \Delta y)$.
* **Подпись:** `«окрестность Мура: 8 направлений вокруг клетки (dx, dy)»`.

### 7.2. Глиф 2: `lifeRules` (Законы B3/S23)
* **Смысл:** Две параллельные колонки с делителем. Слева: Рождение (`Birth = 3` — из трёх серых рождается яркая). Справа: Выживание (`Survival = 2..3`, смерть от перенаселения $\ge 4$ и одиночества $\le 1$).
* **Подпись:** `«правило B3/S23: рождение ровно при 3, жизнь при 2 или 3»`.

### 7.3. Глиф 3: `lifePatterns` (Анатомия паттернов)
* **Смысл:** Три мини-диаграммы: Натюрморт («Блок»), Осциллятор («Мигалка» в 2 фазах со стрелкой цикла) и Планер («Глайдер» с вектором перемещения $v = c/4$).
* **Подпись:** `«архетипы Конвея: натюрморты, осцилляторы и космические корабли»`.

---

## 8. Эталонный Python Scaffold (`index.html`)

В `index.html` монтируется скрытый тег шаблона:

```html
<script type="text/x-python" id="vkat-life-scaffold">
# === ДВИЖОК СИМУЛЯТОРА GAME OF LIFE (СКАФФОЛД) ===
import json

WIDTH = 50
HEIGHT = 50

# Сюда инжектируется код студента:
# __STUDENT_CODE__

def create_empty_grid(w=WIDTH, h=HEIGHT):
    return [[0 for _ in range(w)] for _ in range(h)]

def simulate_step(grid):
    new_grid = create_empty_grid(len(grid[0]), len(grid))
    for y in range(len(grid)):
        for x in range(len(grid[0])):
            alive = is_alive(grid, x, y)
            neighbors = count_neighbors(grid, x, y)
            new_grid[y][x] = 1 if should_live(alive, neighbors) else 0
    return new_grid

def get_grid_json(grid):
    return json.dumps(grid)
</script>
```

---

## 9. HTML-разметка экрана (`<div id="screen-life">`)

Добавляется в `index.html` на том же уровне, что и `screen-lesson`:

```html
<!-- Экран пет-проекта: Game of Life -->
<div id="screen-life" class="screen" style="display: none;">
  <!-- Верхняя навигация пет-проекта -->
  <header class="life-header">
    <div class="life-header-left">
      <button type="button" id="btn-life-back" class="btn-ghost-sm" title="Вернуться в курс">
        ← В меню курса
      </button>
      <span class="life-header-title">ПЕТ-ПРОЕКТ: ИГРА «ЖИЗНЬ» КОНВЕЯ</span>
      <span class="life-step-badge" id="life-step-indicator">ШАГ 1 ИЗ 4</span>
    </div>
    <div class="life-header-right">
      <div class="life-pattern-toast" id="life-pattern-toast" style="display: none;">
        <span class="toast-icon">▪</span>
        <span class="toast-text" id="life-toast-text">Обнаружен паттерн: Блок</span>
      </div>
    </div>
  </header>

  <!-- Основная рабочая область: Двухколоночный Grid -->
  <main class="life-body">
    <!-- Левая колонка: Интерактивная Вселенная (Canvas + Контролы) -->
    <section class="life-canvas-panel">
      <div class="life-canvas-container">
        <!-- HUD поверх холста -->
        <div class="life-hud">
          <div class="hud-left">
            <span class="hud-item">GEN: <strong id="life-stat-gen">0</strong></span>
            <span class="hud-item">POP: <strong id="life-stat-pop">0</strong></span>
          </div>
          <div class="hud-right">
            <canvas id="life-sparkline" width="100" height="24" title="История популяции"></canvas>
          </div>
        </div>

        <!-- Основной холст -->
        <canvas id="life-main-canvas" width="500" height="500"></canvas>

        <!-- Оверлей для эффекта WORLD_BIRTH -->
        <div id="life-birth-overlay" class="life-birth-overlay" style="display: none;">
          <div class="birth-message">
            <h2>МИР ОЖИЛ</h2>
            <p>Законы вселенной Конвея активированы</p>
          </div>
        </div>
      </div>

      <!-- Тулбар управления симуляцией под холстом -->
      <div class="life-controls-bar">
        <div class="btn-group">
          <button type="button" id="btn-life-play" class="btn-sm btn-primary">▶ Старт</button>
          <button type="button" id="btn-life-step" class="btn-sm btn-ghost">⏭ Шаг</button>
          <button type="button" id="btn-life-clear" class="btn-sm btn-ghost">↺ Очистить</button>
          <button type="button" id="btn-life-random" class="btn-sm btn-ghost">🎲 Рандом</button>
        </div>

        <div class="life-speed-control">
          <label for="life-speed-slider">Скорость:</label>
          <input type="range" id="life-speed-slider" min="1" max="30" value="10">
          <span id="life-speed-val">10/с</span>
        </div>

        <div class="life-presets-dropdown">
          <select id="life-preset-select" class="life-select">
            <option value="" disabled selected>Пресеты...</option>
            <option value="glider">Глайдер</option>
            <option value="blinker">Мигалка</option>
            <option value="pulsar">Пульсар</option>
            <option value="gosper">Пушка Госпера</option>
            <option value="acorn">Жёлудь (Хаос)</option>
          </select>
        </div>
      </div>
      
      <div class="life-canvas-hint">
        <span>ЛКМ — рисовать клетки</span> · <span>ПКМ / Shift+ЛКМ — стирать</span>
      </div>
    </section>

    <!-- Правая колонка: Задание, Теория, Глиф и Редактор Python -->
    <section class="life-editor-panel">
      <div class="life-task-card">
        <h2 id="life-task-title">Шаг 1: Сенсор границ</h2>
        <div id="life-glyph-slot" class="life-glyph-slot"></div>
        <div id="life-task-desc" class="life-task-desc">
          <!-- Описание шага и подсказки -->
        </div>
      </div>

      <!-- Редактор Python -->
      <div class="life-code-wrapper">
        <div class="life-editor-header">
          <span>РЕШЕНИЕ (PYTHON 3)</span>
          <span id="life-editor-status" class="editor-status">Не проверено</span>
        </div>
        <textarea id="life-code-editor" class="code-area" spellcheck="false"></textarea>
      </div>

      <!-- Кнопки проверки и обратная связь -->
      <div class="life-action-bar">
        <div id="life-feedback" class="life-feedback-msg"></div>
        <div class="action-buttons">
          <button type="button" id="btn-life-run-local" class="btn-secondary" title="Запустить код на холсте без зачёта">
            Испытать на поле
          </button>
          <button type="button" id="btn-life-submit" class="btn-primary" title="Ctrl + Enter">
            Проверить решение (Ctrl+Enter)
          </button>
        </div>
      </div>
    </section>
  </main>
</div>
```

---

## 10. CSS-спецификация оформления (`app/styles.css`)

Все стили добавляются в `app/styles.css` с префиксом `.life-`:

```css
/* ==========================================================================
   МОДУЛЬ ПЕТ-ПРОЕКТА: GAME OF LIFE (.life-*)
   ========================================================================== */

#screen-life {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background-color: var(--bg);
  color: var(--text);
  overflow: hidden;
}

.life-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 24px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-panel);
  height: 52px;
  flex-shrink: 0;
}

.life-header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.life-header-title {
  font-family: var(--font-mono);
  font-size: 13px;
  letter-spacing: 0.08em;
  font-weight: 600;
  color: var(--text);
}

.life-step-badge {
  font-family: var(--font-mono);
  font-size: 11px;
  padding: 2px 8px;
  background: var(--border);
  color: var(--brand-orange);
  border: 1px solid var(--border-strong);
}

.life-body {
  display: grid;
  grid-template-columns: 540px 1fr;
  flex: 1;
  min-height: 0;
}

/* Левая колонка (Canvas) */
.life-canvas-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  border-right: 1px solid var(--border);
  background: var(--bg);
  overflow-y: auto;
}

.life-canvas-container {
  position: relative;
  width: 500px;
  height: 500px;
  background: #000000;
  border: 1px solid var(--border-strong);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
}

#life-main-canvas {
  width: 500px;
  height: 500px;
  display: block;
  cursor: crosshair;
}

/* HUD поверх Canvas */
.life-hud {
  position: absolute;
  top: 8px;
  left: 8px;
  right: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  pointer-events: none;
  font-family: var(--font-mono);
  font-size: 11px;
  color: rgba(236, 236, 236, 0.7);
}

.hud-item {
  background: rgba(10, 10, 10, 0.75);
  padding: 3px 8px;
  border: 1px solid var(--border);
  margin-right: 6px;
}

.hud-item strong {
  color: var(--brand-orange);
}

/* Панель управления */
.life-controls-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 500px;
  margin-top: 14px;
  gap: 8px;
}

.life-speed-control {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--muted);
}

.life-speed-control input[type="range"] {
  width: 70px;
  accent-color: var(--brand-orange);
}

.life-select {
  background: var(--bg-panel);
  border: 1px solid var(--border);
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 11px;
  padding: 4px 8px;
}

.life-canvas-hint {
  margin-top: 10px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: #666;
}

/* Правая колонка (Задание и Редактор) */
.life-editor-panel {
  display: flex;
  flex-direction: column;
  padding: 24px;
  overflow-y: auto;
  gap: 16px;
  background: var(--bg-panel);
}

.life-task-card {
  border: 1px solid var(--border);
  padding: 16px;
  background: var(--bg);
}

.life-task-card h2 {
  font-size: 16px;
  margin-bottom: 12px;
  color: var(--text);
}

.life-glyph-slot {
  margin: 12px 0;
  display: flex;
  justify-content: center;
}

.life-code-wrapper {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 220px;
  border: 1px solid var(--border-strong);
  background: var(--bg);
}

.life-editor-header {
  display: flex;
  justify-content: space-between;
  padding: 6px 12px;
  background: #141414;
  border-bottom: 1px solid var(--border);
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--muted);
}

#life-code-editor {
  flex: 1;
  width: 100%;
  background: transparent;
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.5;
  padding: 12px;
  border: none;
  resize: none;
  outline: none;
}

.life-action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 8px;
}

/* Оверлей WORLD_BIRTH */
.life-birth-overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle, rgba(255,106,0,0.2) 0%, rgba(10,10,10,0.85) 70%);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: life-fade-in 0.4s ease-out;
  pointer-events: none;
}

.birth-message {
  text-align: center;
  font-family: var(--font-mono);
}

.birth-message h2 {
  font-size: 28px;
  color: #ffffff;
  letter-spacing: 0.15em;
  text-shadow: 0 0 16px var(--brand-orange);
}

.birth-message p {
  color: var(--brand-orange);
  font-size: 12px;
  margin-top: 6px;
}

/* Тост обнаружения паттерна */
.life-pattern-toast {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #1a1a1a;
  border: 1px solid var(--brand-orange);
  padding: 4px 12px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: #fff;
  animation: life-pop 0.3s ease-out;
}

@keyframes life-pop {
  0% { transform: translateY(-8px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}

@keyframes life-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

---

## 11. Данные модуля `content/projects/life/tasks.js`

Создаётся чистый файл данных курса с 4 шагами:

```javascript
/**
 * вкат.py — Модуль пет-проекта «Игра «Жизнь» Конвея»
 * Идентификатор модуля: 'life'
 */

(function (window) {
  'use strict';

  const LIFE_MODULE = {
    id: 'life',
    title: 'Пет-проект: Игра «Жизнь»',
    kicker: 'клеточные автоматы',
    description: 'Создай легендарный симулятор Конвея своими руками за 4 шага.',
    rendererType: 'game_scaffold',
    steps: [
      {
        id: 'life_step_1',
        title: 'Шаг 1: Сенсор границ мира',
        tier: 1,
        glyph: 'lifeNeighbors',
        narrative: 'Вселенная Конвея замкнута в сетке 50x50. Если программа обратится к несуществующей клетке с отрицательными координатами или координатой >= 50, симулятор упадёт с ошибкой. Напиши безопасную функцию проверки.',
        taskHtml: '<p>Напиши функцию <code>is_alive(grid, x, y)</code>, которая принимает матрицу <code>grid</code> и координаты <code>x, y</code>. Функция должна возвращать <code>True</code>, только если координаты лежат внутри поля и ячейка равна <code>1</code>. В остальных случаях возвращай <code>False</code>.</p>',
        initialCode: 'def is_alive(grid, x, y):\n    # Твой код здесь\n    pass\n',
        tests: [
          {
            name: 'Живая клетка внутри поля',
            code: 'g = [[0, 1], [0, 0]]\nassert is_alive(g, 1, 0) == True'
          },
          {
            name: 'Мёртвая клетка внутри поля',
            code: 'g = [[0, 1], [0, 0]]\nassert is_alive(g, 0, 0) == False'
          },
          {
            name: 'Отрицательные координаты за пределами',
            code: 'g = [[1]]\nassert is_alive(g, -1, 0) == False\nassert is_alive(g, 0, -1) == False'
          },
          {
            name: 'Координаты больше размера матрицы',
            code: 'g = [[1]]\nassert is_alive(g, 1, 0) == False\nassert is_alive(g, 0, 5) == False'
          }
        ]
      },
      {
        id: 'life_step_2',
        title: 'Шаг 2: Окрестность Мура',
        tier: 2,
        glyph: 'lifeNeighbors',
        narrative: 'Судьба каждой клетки зависит исключительно от 8 её соседей. Сейчас клетки слепы и не видят собратьев рядом.',
        taskHtml: '<p>Напиши функцию <code>count_neighbors(grid, x, y)</code>. Она должна проверить все 8 направлений вокруг <code>(x, y)</code> с помощью созданной ранее логики и вернуть число живых соседей (целое число от 0 до 8).</p>',
        initialCode: 'def count_neighbors(grid, x, y):\n    # Проверь 8 направлений вокруг (x, y)\n    pass\n',
        tests: [
          {
            name: 'Одинокая клетка (0 соседей)',
            code: 'g = [\n [0, 0, 0],\n [0, 1, 0],\n [0, 0, 0]\n]\nassert count_neighbors(g, 1, 1) == 0'
          },
          {
            name: 'Полное окружение (8 соседей)',
            code: 'g = [\n [1, 1, 1],\n [1, 0, 1],\n [1, 1, 1]\n]\nassert count_neighbors(g, 1, 1) == 8'
          },
          {
            name: 'Угловая ячейка (проверка границ)',
            code: 'g = [\n [1, 1],\n [1, 0]\n]\nassert count_neighbors(g, 0, 0) == 2'
          }
        ]
      },
      {
        id: 'life_step_3',
        title: 'Шаг 3: Законы Конвея (B3/S23)',
        tier: 3,
        glyph: 'lifeRules',
        narrative: 'Момент истины. Мы объединяем состояние клетки и количество соседей в священные правила бытия.',
        taskHtml: '<p>Реализуй функцию <code>should_live(alive, neighbors)</code>:</p><ul><li>Если клетка была жива (<code>alive == True</code>), она выживает, только если соседей ровно <code>2</code> или <code>3</code>.</li><li>Если клетка была мертва (<code>alive == False</code>), она оживает, только если соседей ровно <code>3</code>.</li><li>В остальных случаях возвращай <code>False</code>.</li></ul>',
        initialCode: 'def should_live(alive, neighbors):\n    # Законы B3/S23\n    pass\n',
        tests: [
          {
            name: 'Рождение из небытия (3 соседа)',
            code: 'assert should_live(False, 3) == True'
          },
          {
            name: 'Мертвая клетка при 2 соседях остается мертвой',
            code: 'assert should_live(False, 2) == False'
          },
          {
            name: 'Выживание при 2 и 3 соседях',
            code: 'assert should_live(True, 2) == True\nassert should_live(True, 3) == True'
          },
          {
            name: 'Смерть от одиночества (< 2) и перенаселения (> 3)',
            code: 'assert should_live(True, 1) == False\nassert should_live(True, 4) == False\nassert should_live(True, 8) == False'
          }
        ]
      },
      {
        id: 'life_step_4',
        title: 'Шаг 4: Хакер правил вселенной',
        tier: 3,
        glyph: 'lifePatterns',
        narrative: 'Ты оживил вселенную Конвея! Теперь параметризуй правила через множества B/S и исследуй альтернативные миры.',
        taskHtml: '<p>Создай списки правил <code>BIRTH = [3]</code> и <code>SURVIVAL = [2, 3]</code> и напиши функцию <code>step_rules(alive, neighbors, birth, survival)</code>, проверяющую вхождение числа соседей в соответствующие списки.</p>',
        initialCode: 'BIRTH = [3]\nSURVIVAL = [2, 3]\n\ndef step_rules(alive, neighbors, birth, survival):\n    # Универсальный валидатор правил\n    pass\n',
        tests: [
          {
            name: 'Стандартный Конвей B3/S23',
            code: 'assert step_rules(False, 3, [3], [2, 3]) == True\nassert step_rules(True, 2, [3], [2, 3]) == True'
          },
          {
            name: 'Режим HighLife (B36/S23)',
            code: 'assert step_rules(False, 6, [3, 6], [2, 3]) == True'
          },
          {
            name: 'Режим Seeds (B2/S - выживания нет)',
            code: 'assert step_rules(True, 2, [2], []) == False\nassert step_rules(False, 2, [2], []) == True'
          }
        ]
      }
    ]
  };

  window.LIFE_MODULE = LIFE_MODULE;
})(window);
```

---

## 12. Спецификация валидационных тестов (`dev/run_js_validation.js`)

В конец файла `dev/run_js_validation.js` добавляется секция **Раздел 22: Модуль пет-проекта «Игра «Жизнь»** со следующими 12 автоматическими проверками:

```javascript
// ============================================================================
// Раздел 22: Модуль пет-проекта «Игра «Жизнь» (Game of Life)
// ============================================================================

console.log('\n--- 22. Валидация модуля пет-проекта Life ---');

// 22.1 Проверка наличия файла данных
const lifePath = path.join(__dirname, '..', 'content', 'projects', 'life', 'tasks.js');
check('Life: файл content/projects/life/tasks.js существует на диске', fs.existsSync(lifePath));

// Загрузка модуля в контекст
if (fs.existsSync(lifePath)) {
  const code = fs.readFileSync(lifePath, 'utf8');
  vm.runInContext(code, context);
}

const LM = context.LIFE_MODULE;
// 22.2 Экспорт объекта
check('Life: window.LIFE_MODULE успешно экспортирован', Boolean(LM) && typeof LM === 'object');

// 22.3 Метаданные модуля
check('Life: корректный ID и заголовок модуля', LM && LM.id === 'life' && Boolean(LM.title));

// 22.4 Количество шагов
check('Life: модуль содержит ровно 4 шага', LM && Array.isArray(LM.steps) && LM.steps.length === 4);

// 22.5 Структура шагов
const allStepsValid = LM && LM.steps.every(s => 
  s.id && s.title && s.initialCode && Array.isArray(s.tests) && s.tests.length > 0
);
check('Life: каждый шаг содержит id, title, initialCode и массив tests', allStepsValid);

// 22.6 Наличие разметки в index.html
const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
check('Life: index.html содержит контейнер <div id="screen-life">', indexHtml.includes('id="screen-life"'));
check('Life: index.html содержит холст <canvas id="life-main-canvas">', indexHtml.includes('id="life-main-canvas"'));
check('Life: index.html содержит Python-скаффолд <script id="vkat-life-scaffold">', indexHtml.includes('id="vkat-life-scaffold"'));

// 22.7 Стили в styles.css
const stylesCss = fs.readFileSync(path.join(__dirname, '..', 'app', 'styles.css'), 'utf8');
check('Life: styles.css содержит селекторы .life-canvas-container и .life-hud', 
  stylesCss.includes('.life-canvas-container') && stylesCss.includes('.life-hud'));

// 22.8 Глифы в app/glyphs.js
const glyphsCode = fs.readFileSync(path.join(__dirname, '..', 'app', 'glyphs.js'), 'utf8');
check('Life: glyphs.js содержит регистрацию схем lifeNeighbors, lifeRules, lifePatterns',
  glyphsCode.includes('lifeNeighbors') && glyphsCode.includes('lifeRules') && glyphsCode.includes('lifePatterns'));

// 22.9 Модуль рендерера
const lifeRendererPath = path.join(__dirname, '..', 'app', 'life-renderer.js');
check('Life: файл app/life-renderer.js существует на диске', fs.existsSync(lifeRendererPath));

// 22.10 Zero-Build аудит
const lifeRendererCode = fs.existsSync(lifeRendererPath) ? fs.readFileSync(lifeRendererPath, 'utf8') : '';
check('Life: life-renderer.js не содержит запрещённых npm/require импортов',
  !lifeRendererCode.includes('require(') && !lifeRendererCode.includes('import '));
```

---

## 13. Чек-лист визуальной приёмки (Visual Verification)

При интерактивном тестировании через `run.bat` проверить:
1. [ ] **Открытие экрана:** Клик по карточке пет-проекта плавно скрывает стартовый экран и отображает `#screen-life` без мерцаний.
2. [ ] **Рисование мышью:** Зажатие ЛКМ мгновенно зажигает белые ячейки 10x10 с легкой вспышкой.
3. [ ] **Шлейфы:** При запуске движения глайдера за ним остаётся 4-кадровый оранжевый след затухания.
4. [ ] **Инспектор курсора:** При перемещении мыши по холсту внизу точно выводятся координаты ячейки `[X, Y]`.
5. [ ] **WORLD_BIRTH:** На Шаге 3 при успешной отправке решения срабатывает оверлей с кольцевой волной, сетка озаряется янтарным светом, и появляется глайдер.
6. [ ] **Детектор паттернов:** При рисовании устойчивого квадрата $2 \times 2$ через 500 мс всплывает тост `«Обнаружен натюрморт: «Блок»»`.
7. [ ] **Спарклайн:** В правом верхнем углу холста график плавно рисует кривую колебаний численности популяции.
8. [ ] **Кнопка возврата:** Нажатие «← В меню курса» сохраняет текущий черновик в `VkatStorage` и возвращает пользователя на стартовый экран.

---

## 14. Таблица запрещённых паттернов (Strict Constraints)

| Паттерн | Статус | Почему запрещено | Что использовать вместо |
| :--- | :--- | :--- | :--- |
| `localStorage.setItem(...)` | ❌ СТРОГО ЗАПРЕЩЕНО | Нарушает многопользовательскую изоляцию профилей | `await window.VkatStorage.setDraft(...)` |
| `npm install canvas / p5.js` | ❌ СТРОГО ЗАПРЕЩЕНО | Нарушает принцип Zero-Build | Чистый HTML5 Canvas 2D API |
| `cdn.jsdelivr.net/...` | ❌ СТРОГО ЗАПРЕЩЕНО | Нарушает принцип Offline-First | Локальные ассеты |
| Проверка кода регулярками | ❌ СТРОГО ЗАПРЕЩЕНО | Не гарантирует работоспособность алгоритма | Реальный запуск тестов через `VkatChecker` |
| Использование `border-radius` в глифах | ❌ СТРОГО ЗАПРЕЩЕНО | Нарушает инженерный стиль 1px чертежа | Прямоугольники и полилинии без скруглений |

---

## 15. Критерии готовности (Definition of Done)

* [ ] Файл спецификации сохранён в `FEATURES/PET-PROJECT-GAME-OF-LIFE-SPEC.md`.
* [ ] Создан файл задач `content/projects/life/tasks.js` с 4 шагами.
* [ ] Реализован холст и логика симуляции в `app/life-renderer.js`.
* [x] Добавлены 3 SVG-глифа в `app/glyphs.js`.
* [x] Добавлены стили `.life-*` в `app/styles.css`.
* [x] Разметка экрана `#screen-life` и Python-скаффолд добавлены в `index.html`.
* [x] Добавлена Секция 22 в `dev/run_js_validation.js`.
* [x] Запуск `node dev/run_js_validation.js` выдаёт **0 ошибок** (394 проверки зелёные).
* [x] Запуск `python dev/run_tests.py` выдаёт **0 ошибок** (211 проверки).
* [x] Нет ни одного прямого обращения к `localStorage`/`sessionStorage` вне `storage.js`.
* [x] Код полностью отформатирован и готов к коммиту в ветку `feat/pet-game-of-life`.

---

## 16. Решения реализации (v1.1.0, зафиксированы при сборке модуля)

Расхождения спеки v1.0.0 с кодовой базой разрешены так:

1. **Формат тестов — TaskTest, не assert-код.** Тесты шагов выражены как
   `{call, returns, hidden}` (docs/types.d.ts), сетка инлайнится в выражение
   вызова. Бутстрап чекера не расширялся. Python-литералы `False/True` в `call`
   валидны: выражения исполняются в Pyodide.
2. **`rendererType` не реализован.** `LIFE_MODULE` — отдельный глобал вне
   `COURSE_TOPICS`/`COURSE_STAGES`; экран `#screen-life` с собственным
   enter/leave; вход — карточка на `screen-start` (`#life-start-card`),
   рендерится `VkatLife.renderStartCard()`. Обобщение до `rendererType` — при
   появлении второго пет-проекта.
3. **Прогресс** — `completed[]` (`life_step_1..4`) + `drafts`. Ключи drafts:
   `life_step_N` — черновик редактора, `life_step_N::accepted` — принятый код
   шага. «WORLD_BIRTH ровно один раз» выводится из наличия `life_step_3` в
   `completed[]`, отдельный флаг не нужен.
4. **Композиция кода.** Проверка шага N исполняет принятый код шагов 1..N-1 +
   текущий черновик (функции строятся друг на друге: без композиции шаг 2 падает
   с NameError на `is_alive`). Live-режим: скаффолд `#vkat-life-scaffold` +
   принятые шаги 1-3, один тик = один `runCode()` с `print(get_grid_json(...))`,
   сетка парсится из stdout; пачка тиков не гоняется — по одному на итерацию
   цикла с паузой по скорости.
5. **JS-зеркало ≠ код ученика.** Зеркало рисует только канонические вселенные:
   seed-режимы `frozen`/`chaos` (шаги 1-3), Conway B3/S23 (после шага 3),
   песочница с выбором вселенной (шаг 4: B3/S23, HighLife B36/S23, Seeds B2/S).
   Эквивалентность принятого кода канону доказана тестами шага 3.
6. **Детектор паттернов.** Блок/мигалка/глайдер — по связным компонентам
   (8-связность) с диэдральными масками всех фаз глайдера (фазы генерируются
   собственным тиком движка). Пульсар — отдельное оконное сопоставление с
   маской: под 8-связностью он распадается на ~12 компонент и по компонентам
   не ловится.
7. **Валидация.** Секция 22 в `dev/run_js_validation.js` — 21 проверка,
   включая поведенческий прогон всех 26 тестов шагов на эталонном JS-решении
   (с шимами `True`/`False` под Python-литералы в `call`).
8. **Отладочный хук.** `window.VkatLife._state` — ссылка на внутреннее
   состояние для dev-консоли/E2E; не является публичным контрактом.
