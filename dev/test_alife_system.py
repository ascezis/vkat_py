"""
Тестирование модуля Alife-System (пет-проект) на боевом бутстрапе чекера.
Запуск: python dev/test_alife_system.py
"""

import os
import re
import sys
import json
import subprocess

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 1. Загрузка бутстрапа чекера из index.html
with open(os.path.join(ROOT, 'index.html'), encoding='utf-8') as f:
    html = f.read()

m_boot = re.search(r'<script type="text/x-python" id="vkat-checker-python">(.*?)</script>', html, re.S)
if not m_boot:
    raise RuntimeError("script#vkat-checker-python не найден в index.html")
checker_bootstrap = m_boot.group(1)

m_scaffold = re.search(r'<script type="text/x-python" id="vkat-life-scaffold">(.*?)</script>', html, re.S)
if not m_scaffold:
    raise RuntimeError("script#vkat-life-scaffold не найден в index.html")
life_scaffold = m_scaffold.group(1)

# Создаём изолированное окружение для чекера
checker_ns = {'__name__': '_vkat_bootstrap'}
exec(compile(checker_bootstrap, '<checker-bootstrap>', 'exec'), checker_ns)
_checker_mod = checker_ns['_checker_mod']
analyze_ast = checker_ns['analyze_ast']
_exec_user_code = checker_ns['_exec_user_code']
_run_task_tests = checker_ns['_run_task_tests']

def check_solution(user_code, task):
    reqs = task.get("astRequirements", {})
    ast_res = json.loads(analyze_ast(user_code, json.dumps(reqs)))
    if ast_res.get("syntax_error"):
        return {"passed": False, "title": "SyntaxError", "sub": ast_res["syntax_error"]}
    if ast_res.get("errors"):
        return {"passed": False, "title": "ASTError", "sub": ast_res["errors"][0]}

    _exec_user_code(user_code, save_user_ns=True)
    runtime_err = _checker_mod._runtime_err
    if runtime_err:
        return {"passed": False, "title": "RuntimeError", "sub": runtime_err}

    if task.get("tests"):
        test_res = json.loads(_run_task_tests(json.dumps(task["tests"])))
        if not test_res.get("passed"):
            return {"passed": False, "title": "TestFailed", "sub": str(test_res)}

    return {"passed": True}

# 2. Извлечение шагов из content/projects/life/tasks.js через Node.js
node_cmd = [
    'node', '-e',
    """
    const fs = require('fs');
    const vm = require('vm');
    const ctx = { window: {} };
    ctx.window = ctx;
    vm.runInNewContext(fs.readFileSync('content/projects/life/tasks.js', 'utf8'), ctx);
    console.log(JSON.stringify(ctx.window.LIFE_MODULE));
    """
]
raw_json = subprocess.check_output(node_cmd, cwd=ROOT, text=True, encoding='utf-8')
life_module = json.loads(raw_json)

print(f"=== ТЕСТИРОВАНИЕ ALIFE-SYSTEM ({life_module['title']}) ===")
print(f"Экран: {life_module['screen']} | Шагов: {len(life_module['steps'])}")

# Эталонные решения
REF_SOLUTIONS = {
    'life_step_1': """
def should_live(alive, neighbors):
    return neighbors == 3 or (alive and neighbors == 2)
""",
    'life_step_2': """
def is_alive(grid, x, y):
    if x < 0 or y < 0 or y >= len(grid) or x >= len(grid[0]):
        return False
    return grid[y][x] == 1
""",
    'life_step_3': """
def count_neighbors(grid, x, y):
    count = 0
    for dy in range(-1, 2):
        for dx in range(-1, 2):
            if dx == 0 and dy == 0:
                continue
            count += is_alive(grid, x + dx, y + dy)
    return count
""",
    'life_step_4': """
BIRTH = [3]
SURVIVAL = [2, 3]

def step_rules(alive, neighbors, birth, survival):
    if not alive and neighbors in birth:
        return True
    if alive and neighbors in survival:
        return True
    return False
"""
}

# Неправильные решения для проверки строгости тестов
WRONG_SOLUTIONS = {
    'life_step_1': [
        ('клетка не выживает при 2 соседях', 'def should_live(alive, neighbors):\n    return neighbors == 3'),
        ('клетка выживает при 4 соседях (нет защиты от перенаселения)', 'def should_live(alive, neighbors):\n    return neighbors in (2, 3, 4) if alive else neighbors == 3'),
        ('рождается при 2 соседях', 'def should_live(alive, neighbors):\n    return neighbors in (2, 3)')
    ],
    'life_step_2': [
        ('нет проверки границ (IndexError)', 'def is_alive(grid, x, y):\n    return grid[y][x] == 1'),
        ('перепутаны x и y (grid[x][y])', 'def is_alive(grid, x, y):\n    if x < 0 or y < 0 or x >= len(grid) or y >= len(grid[0]): return False\n    return grid[x][y] == 1'),
        ('всегда False', 'def is_alive(grid, x, y):\n    return False')
    ],
    'life_step_3': [
        ('считает саму клетку (без dx==0 and dy==0)', 'def count_neighbors(grid, x, y):\n    c = 0\n    for dy in range(-1, 2):\n        for dx in range(-1, 2):\n            c += is_alive(grid, x + dx, y + dy)\n    return c'),
        ('считает только 4 соседа (без диагоналей)', 'def count_neighbors(grid, x, y):\n    return is_alive(grid, x+1, y) + is_alive(grid, x-1, y) + is_alive(grid, x, y+1) + is_alive(grid, x, y-1)'),
        ('всегда 0', 'def count_neighbors(grid, x, y):\n    return 0')
    ],
    'life_step_4': [
        ('игнорирует birth', 'def step_rules(alive, neighbors, birth, survival):\n    return alive and neighbors in survival'),
        ('игнорирует survival', 'def step_rules(alive, neighbors, birth, survival):\n    return not alive and neighbors in birth'),
        ('перепутаны birth и survival', 'def step_rules(alive, neighbors, birth, survival):\n    return (not alive and neighbors in survival) or (alive and neighbors in birth)')
    ]
}

total_passed = 0
total_failed = 0

def check(name, cond, details=''):
    global total_passed, total_failed
    if cond:
        print(f"  ✓ {name}")
        total_passed += 1
    else:
        print(f"  × {name} — ОШИБКА: {details}")
        total_failed += 1

# Тестируем шаги 1..4
composed_code = ""
for idx, step in enumerate(life_module['steps']):
    sid = step['id']
    task_config = {
        'tests': step['tests'],
        'astRequirements': {}
    }
    
    # 1. Проверка эталона с учётом композиции кода
    current_code = REF_SOLUTIONS[sid]
    full_submission = (composed_code + "\n\n" + current_code).strip()
    
    res = check_solution(full_submission, task_config)
    check(f"[{sid}] Эталон принят чекером ({len(step['tests'])} тестов)", res.get('passed') is True, res.get('title', ''))
    
    # Запоминаем код для следующих шагов (композиция)
    composed_code = full_submission
    
    # 2. Проверка отсеивания неправильных решений
    for wname, wcode in WRONG_SOLUTIONS[sid]:
        # Для шага 2 и далее подмешиваем предыдущие эталоны, чтобы ошибка была именно в текущей логике
        prev_code = ""
        for prev_idx in range(idx):
            prev_code += REF_SOLUTIONS[life_module['steps'][prev_idx]['id']] + "\n\n"
        w_sub = (prev_code + wcode).strip()
        
        w_res = check_solution(w_sub, task_config)
        check(f"[{sid}] Ошибочное решение '{wname}' корректно отклонено", w_res.get('passed') is False)

# 3. Тестирование движка симуляции (Python Scaffold)
print("\n=== ТЕСТИРОВАНИЕ ДВИЖКА СИМУЛЯЦИИ (SCAFFOLD) ===")

# Собираем боевой симулятор: scaffold + все функции студента
engine_source = life_scaffold.replace('__STUDENT_CODE__', composed_code)
engine_ns = {}
exec(engine_source, engine_ns)

create_empty_grid = engine_ns['create_empty_grid']
simulate_step = engine_ns['simulate_step']

# Тест А: Натюрморт «Блок» (2x2) должен быть стабилен на 10 поколений
grid_block = create_empty_grid(10, 10)
grid_block[4][4] = 1
grid_block[4][5] = 1
grid_block[5][4] = 1
grid_block[5][5] = 1

curr = grid_block
for gen in range(10):
    curr = simulate_step(curr)

check("Движок: «Блок» 2x2 остаётся стабилен 10 поколений", curr == grid_block)

# Тест Б: Осциллятор «Мигалка» (период 2)
# Горизонтальная полоска 3 клетки
grid_blinker_h = create_empty_grid(5, 5)
grid_blinker_h[2][1] = 1
grid_blinker_h[2][2] = 1
grid_blinker_h[2][3] = 1

# Вертикальная полоска
grid_blinker_v = create_empty_grid(5, 5)
grid_blinker_v[1][2] = 1
grid_blinker_v[2][2] = 1
grid_blinker_v[3][2] = 1

g1 = simulate_step(grid_blinker_h)
check("Движок: «Мигалка» поворачивается вертикально на 1 шаге", g1 == grid_blinker_v)
g2 = simulate_step(g1)
check("Движок: «Мигалка» возвращается в горизонт на 2 шаге (период 2)", g2 == grid_blinker_h)

# Тест В: Космический корабль «Глайдер» (смещение на +1, +1 за 4 поколения)
# Координаты глайдера в фазе 0: (1, 0), (2, 1), (0, 2), (1, 2), (2, 2)
grid_glider = create_empty_grid(20, 20)
glider_cells = [(1, 0), (2, 1), (0, 2), (1, 2), (2, 2)]
for x, y in glider_cells:
    grid_glider[y][x] = 1

g_curr = grid_glider
for _ in range(4):
    g_curr = simulate_step(g_curr)

# Координаты через 4 тика: все клетки должны сместиться ровно на +1 по X и +1 по Y
expected_glider_cells = [(x + 1, y + 1) for x, y in glider_cells]
actual_glider_cells = []
for y in range(20):
    for x in range(20):
        if g_curr[y][x] == 1:
            actual_glider_cells.append((x, y))

check("Движок: «Глайдер» сместился по диагонали на (+1, +1) за 4 поколения",
      sorted(actual_glider_cells) == sorted(expected_glider_cells))

# 4. Проверка интеграции UI и JS-зеркала
print("\n=== ТЕСТИРОВАНИЕ JS-ЗЕРКАЛА И ИНТЕРФЕЙСА ===")
js_test_cmd = [
    'node', '-e',
    """
    const fs = require('fs');
    const vm = require('vm');
    
    // Эмуляция окружения браузера
    const ctx = {
      window: {},
      document: {
        getElementById: () => null,
        createElement: () => ({ style: {} }),
        addEventListener: () => {}
      },
      navigator: { userAgent: 'test' },
      requestAnimationFrame: (fn) => setTimeout(fn, 16),
      cancelAnimationFrame: (id) => clearTimeout(id)
    };
    ctx.window = ctx;
    
    vm.runInNewContext(fs.readFileSync('content/projects/life/tasks.js', 'utf8'), ctx);
    const LM = ctx.window.LIFE_MODULE;
    
    if (!LM || LM.title !== 'Пет-проект: Alife-System') {
      console.error('Ошибка: неверный заголовок LIFE_MODULE:', LM && LM.title);
      process.exit(1);
    }
    
    // Проверка всех 4 шагов и worldMode
    const expectedModes = ['frozen', 'chaos', 'chaos', 'sandbox'];
    LM.steps.forEach((s, i) => {
      if (s.worldMode !== expectedModes[i]) {
        console.error(`Ошибка: шаг ${s.id} имеет режим ${s.worldMode}, ожидался ${expectedModes[i]}`);
        process.exit(1);
      }
    });
    
    console.log('OK: Все контракты JS-зеркала соблюдены');
    """
]
js_test_output = subprocess.check_output(js_test_cmd, cwd=ROOT, text=True, encoding='utf-8').strip()
check("Интерфейс: JS-контракты Alife-System (заголовок, worldModes)", "OK:" in js_test_output)

print(f"\nИТОГ ТЕСТИРОВАНИЯ ALIFE-SYSTEM: {total_passed} пройдено, {total_failed} ошибок.")
if total_failed > 0:
    sys.exit(1)
