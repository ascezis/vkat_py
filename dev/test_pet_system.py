"""
Тестирование модуля «Тамагочи» (пет-проект) на боевом бутстрапе чекера.
Запуск: python dev/test_pet_system.py
"""

import os
import re
import sys
import json
import subprocess

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 1. Загрузка бутстрапа чекера и скаффолда терариума из index.html
with open(os.path.join(ROOT, 'index.html'), encoding='utf-8') as f:
    html = f.read()

m_boot = re.search(r'<script type="text/x-python" id="vkat-checker-python">(.*?)</script>', html, re.S)
if not m_boot:
    raise RuntimeError("script#vkat-checker-python не найден в index.html")
checker_bootstrap = m_boot.group(1)

m_scaffold = re.search(r'<script type="text/x-python" id="vkat-pet-scaffold">(.*?)</script>', html, re.S)
if not m_scaffold:
    raise RuntimeError("script#vkat-pet-scaffold не найден в index.html")
pet_scaffold = m_scaffold.group(1)

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

# 2. Извлечение шагов из content/projects/pet/tasks.js через Node.js
node_cmd = [
    'node', '-e',
    """
    const fs = require('fs');
    const vm = require('vm');
    const ctx = { window: {} };
    ctx.window = ctx;
    vm.runInNewContext(fs.readFileSync('content/projects/pet/tasks.js', 'utf8'), ctx);
    console.log(JSON.stringify(ctx.window.PET_MODULE));
    """
]
raw_json = subprocess.check_output(node_cmd, cwd=ROOT, text=True, encoding='utf-8')
pet_module = json.loads(raw_json)

print(f"=== ТЕСТИРОВАНИЕ TAMAGOTCHI ({pet_module['title']}) ===")
print(f"Экран: {pet_module['screen']} | Шагов: {len(pet_module['steps'])}")

# Эталонные решения
REF_SOLUTIONS = {
    'pet_step_1': """
def new_pet(name):
    return {"имя": name, "сытость": 50, "настроение": 50, "энергия": 50}
""",
    'pet_step_2': """
def feed(pet):
    pet["сытость"] = min(pet["сытость"] + 25, 100)
    return pet["сытость"]
""",
    'pet_step_3': """
def play(pet):
    if pet["энергия"] < 15:
        return False
    pet["настроение"] = min(pet["настроение"] + 20, 100)
    pet["энергия"] = max(pet["энергия"] - 15, 0)
    return True
""",
    'pet_step_4': """
def tick(pet, hour):
    if hour >= 23 or hour < 7:
        pet["энергия"] = min(pet["энергия"] + 15, 100)
        return "ночь"
    else:
        pet["сытость"] = max(pet["сытость"] - 5, 0)
        return "день"
"""
}

# Неправильные решения для проверки строгости тестов
WRONG_SOLUTIONS = {
    'pet_step_1': [
        ('нет ключа «настроение»', 'def new_pet(name):\n    return {"имя": name, "сытость": 50, "настроение": 50}'),
        ('статы по 10 вместо 50', 'def new_pet(name):\n    return {"имя": name, "сытость": 10, "настроение": 10, "энергия": 10}'),
        ('имя в ключе "name" вместо «имя»', 'def new_pet(name):\n    return {"name": name, "сытость": 50, "настроение": 50, "энергия": 50}')
    ],
    'pet_step_2': [
        ('нет капа: сытость улетает за 100', 'def feed(pet):\n    pet["сытость"] = pet["сытость"] + 25\n    return pet["сытость"]'),
        ('уменьшает сытость вместо увеличения', 'def feed(pet):\n    pet["сытость"] = max(pet["сытость"] - 25, 0)\n    return pet["сытость"]'),
        ('возвращает старую сытость', 'def feed(pet):\n    old = pet["сытость"]\n    pet["сытость"] = min(pet["сытость"] + 25, 100)\n    return old')
    ],
    'pet_step_3': [
        ('нет отказа при энергии < 15', 'def play(pet):\n    pet["настроение"] = min(pet["настроение"] + 20, 100)\n    pet["энергия"] = max(pet["энергия"] - 15, 0)\n    return True'),
        ('всегда False', 'def play(pet):\n    return False'),
        ('всегда True', 'def play(pet):\n    return True')
    ],
    'pet_step_4': [
        ('день и ночь перепутаны', 'def tick(pet, hour):\n    if hour >= 7 and hour < 23:\n        pet["энергия"] = min(pet["энергия"] + 15, 100)\n        return "ночь"\n    else:\n        pet["сытость"] = max(pet["сытость"] - 5, 0)\n        return "день"'),
        ('границы ночи не те (hour <= 7 считается ночью)', 'def tick(pet, hour):\n    if hour <= 7 or hour >= 23:\n        pet["энергия"] = min(pet["энергия"] + 15, 100)\n        return "ночь"\n    else:\n        pet["сытость"] = max(pet["сытость"] - 5, 0)\n        return "день"'),
        ('возвращает True вместо "день"/"ночь"', 'def tick(pet, hour):\n    return True')
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
for idx, step in enumerate(pet_module['steps']):
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
        prev_code = ""
        for prev_idx in range(idx):
            prev_code += REF_SOLUTIONS[pet_module['steps'][prev_idx]['id']] + "\n\n"
        w_sub = (prev_code + wcode).strip()

        w_res = check_solution(w_sub, task_config)
        check(f"[{sid}] Ошибочное решение '{wname}' корректно отклонено", w_res.get('passed') is False)

# 3. Тестирование движка терариума (Python Scaffold)
print("\n=== ТЕСТИРОВАНИЕ ДВИЖКА ТЕРАРИУМА (SCAFFOLD) ===")

# Собираем боевой терариум: scaffold + все функции студента
engine_source = pet_scaffold.replace('__STUDENT_CODE__', composed_code)
engine_ns = {}
exec(engine_source, engine_ns)

pet_state_json = engine_ns['pet_state_json']

def round_trip(pet):
    """Канал связи как в рендерере: словарь -> JSON -> словарь."""
    return json.loads(pet_state_json(pet))

# Тест А: канал связи pet_state_json не теряет кириллицу
pet = round_trip({"имя": "Байт", "сытость": 50, "настроение": 50, "энергия": 50})
check("Движок: pet_state_json сохраняет кириллические ключи и имя", pet["имя"] == "Байт" and pet["сытость"] == 50)

# Тест Б: кап кормления на эталоне ученика (90 -> 100, 100 -> 100)
pet = round_trip({"имя": "Байт", "сытость": 90, "настроение": 50, "энергия": 50})
new_hunger = engine_ns['feed'](pet)
check("Движок: feed поднимает сытость 90 -> 100 (кап) и возвращает 100", new_hunger == 100 and pet["сытость"] == 100)
new_hunger = engine_ns['feed'](pet)
check("Движок: повторное кормление не выходит за кап", new_hunger == 100 and pet["сытость"] == 100)

# Тест В: отказ игры без сил (5 -> отказ / False; 15 -> игра есть / True)
pet = round_trip({"имя": "Байт", "сытость": 80, "настроение": 40, "энергия": 5})
played = engine_ns['play'](pet)
check("Движок: play при энергии 5 отказывается (False, питомец не изменился)",
      played is False and pet["настроение"] == 40 and pet["энергия"] == 5)
pet = round_trip({"имя": "Байт", "сытость": 80, "настроение": 40, "энергия": 15})
played = engine_ns['play'](pet)
check("Движок: play при энергии ровно 15 разрешён (True, настроение 40 -> 60, энергия 15 -> 0)",
      played is True and pet["настроение"] == 60 and pet["энергия"] == 0)

# Тест Г: суточный цикл — день тратит, ночь копит, пол на нуле
pet = round_trip({"имя": "Байт", "сытость": 8, "настроение": 60, "энергия": 40})
period = engine_ns['tick'](pet, 14)
check("Движок: дневной такт тратит сытость (8 -> 3) и возвращает 'день'", period == "день" and pet["сытость"] == 3)
engine_ns['tick'](pet, 14)
check("Движок: сытость не уходит ниже нуля (3 -> 0)", pet["сытость"] == 0)
period = engine_ns['tick'](pet, 23)
check("Движок: час 23 — ночь, энергия растёт (40 -> 55) и возвращает 'ночь'", period == "ночь" and pet["энергия"] == 55)

# 4. Проверка интеграции UI и JS-зеркала
print("\n=== ТЕСТИРОВАНИЕ JS-ЗЕРКАЛА И ИНТЕРФЕЙСА ===")
js_test_cmd = [
    'node', '-e',
    """
    const fs = require('fs');
    const vm = require('vm');

    const ctx = { window: {} };
    ctx.window = ctx;

    vm.runInNewContext(fs.readFileSync('content/projects/pet/tasks.js', 'utf8'), ctx);
    const PM = ctx.window.PET_MODULE;

    if (!PM || PM.title !== 'Пет-проект: Тамагочи') {
      console.error('Ошибка: неверный заголовок PET_MODULE:', PM && PM.title);
      process.exit(1);
    }

    const expectedModes = ['egg', 'born', 'playful', 'autonomous'];
    PM.steps.forEach((s, i) => {
      if (s.worldMode !== expectedModes[i]) {
        console.error(`Ошибка: шаг ${s.id} имеет режим ${s.worldMode}, ожидался ${expectedModes[i]}`);
        process.exit(1);
      }
    });

    console.log('OK: Все контракты JS-зеркала соблюдены');
    """
]
js_test_output = subprocess.check_output(js_test_cmd, cwd=ROOT, text=True, encoding='utf-8').strip()
check("Интерфейс: JS-контракты Тамагочи (заголовок, worldModes)", "OK:" in js_test_output)

print(f"\nИТОГ ТЕСТИРОВАНИЯ TAMAGOTCHI: {total_passed} пройдено, {total_failed} ошибок.")
if total_failed > 0:
    sys.exit(1)
