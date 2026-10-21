"""
Автономная проверка логики чекера, структуры курса, эталонов и неправильных решений.
Запуск: python dev/run_tests.py
"""

import sys
import io
import ast
import json
import re
import traceback

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')


# 1. AST Анализатор из checker.js
def analyze_ast(code_str, requirements_json):
    reqs = json.loads(requirements_json)
    try:
        tree = ast.parse(code_str)
    except SyntaxError as e:
        err_type = type(e).__name__
        return json.dumps({"syntax_error": f"{err_type}: {e}", "lineno": e.lineno, "offset": e.offset})

    errors = []
    nodes = list(ast.walk(tree))
    node_types = {type(n) for n in nodes}

    if reqs.get("require_for") and ast.For not in node_types:
        errors.append("В коде должен использоваться цикл for.")
    
    if reqs.get("require_while") and ast.While not in node_types:
        errors.append("В коде должен использоваться цикл while.")
        
    if reqs.get("require_loop") and (ast.For not in node_types and ast.While not in node_types):
        errors.append("В решении обязательно должен использоваться цикл (for или while).")
        
    if reqs.get("require_def") and ast.FunctionDef not in node_types:
        errors.append("Необходимо объявить функцию с помощью ключевого слова def.")
        
    if reqs.get("require_return"):
        has_return = any(isinstance(n, ast.Return) for n in nodes)
        if not has_return:
            errors.append("Функция должна возвращать результат через ключевое слово return.")
            
    if reqs.get("require_if") and ast.If not in node_types:
        errors.append("В коде должно использоваться ветвление с условием if.")

    forbid_calls = reqs.get("forbid_calls", [])
    if forbid_calls:
        for n in nodes:
            if isinstance(n, ast.Call) and isinstance(n.func, ast.Name):
                if n.func.id in forbid_calls:
                    errors.append(f"В этом задании нельзя использовать {n.func.id}().")
                    break

    forbid_methods = reqs.get("forbid_methods", [])
    if forbid_methods:
        for n in nodes:
            if isinstance(n, ast.Call) and isinstance(n.func, ast.Attribute):
                if n.func.attr in forbid_methods:
                    errors.append(f"В этом задании нельзя использовать метод {n.func.attr}().")
                    break

    require_calls = reqs.get("require_calls", [])
    if require_calls:
        for call_name in require_calls:
            called = any(
                isinstance(n, ast.Call) and (
                    (isinstance(n.func, ast.Name) and n.func.id == call_name) or
                    (isinstance(n.func, ast.Attribute) and n.func.attr == call_name)
                )
                for n in nodes
            )
            if not called:
                errors.append(f"В решении нужно вызвать функцию {call_name}.")
                break

    names = []
    for n in nodes:
        if isinstance(n, ast.Name) and isinstance(n.ctx, ast.Store):
            names.append(n.id)

    return json.dumps({
        "errors": errors,
        "variables": names
    })

def _inject_loop_guard(code_str, max_iters=100000):
    try:
        tree = ast.parse(code_str)
    except SyntaxError:
        return code_str

    counter_id = 0
    class LoopGuardInjector(ast.NodeTransformer):
        def _inject(self, node):
            nonlocal counter_id
            counter_id += 1
            var = f"_lc{counter_id}"
            init = ast.Assign(
                targets=[ast.Name(id=var, ctx=ast.Store())],
                value=ast.Constant(value=0),
                lineno=node.lineno, col_offset=0
            )
            inc = ast.AugAssign(
                target=ast.Name(id=var, ctx=ast.Store()),
                op=ast.Add(),
                value=ast.Constant(value=1),
                lineno=node.lineno, col_offset=0
            )
            check = ast.If(
                test=ast.Compare(
                    left=ast.Name(id=var, ctx=ast.Load()),
                    ops=[ast.Gt()],
                    comparators=[ast.Constant(value=max_iters)]
                ),
                body=[ast.Raise(
                    exc=ast.Call(
                        func=ast.Name(id='RuntimeError', ctx=ast.Load()),
                        args=[ast.Constant(value=f'Цикл выполнился больше {max_iters} раз — похоже на бесконечный. Проверь условие цикла.')],
                        keywords=[]
                    ),
                    cause=None
                )],
                orelse=[],
                lineno=node.lineno, col_offset=0
            )
            node.body = [inc, check] + node.body
            self.generic_visit(node)
            return [init, node]

        def visit_For(self, node):
            return self._inject(node)
        def visit_While(self, node):
            return self._inject(node)

    tree = LoopGuardInjector().visit(tree)
    ast.fix_missing_locations(tree)
    return ast.unparse(tree)

def _run_task_tests(tests_json, user_ns):
    tests = json.loads(tests_json)
    for t in tests:
        call_expr = t["call"]
        expected_ret = t.get("returns")
        has_expected_ret = "returns" in t
        expected_stdout = t.get("stdout")
        has_expected_stdout = "stdout" in t
        is_hidden = bool(t.get("hidden"))

        buf = io.StringIO()
        old_out = sys.stdout
        sys.stdout = buf
        call_err = None
        func_not_found = None
        ret_val = None

        try:
            ret_val = eval(call_expr, user_ns)
        except NameError as ne:
            m = re.match(r"^([a-zA-Z_][a-zA-Z0-9_]*)\s*\(", call_expr.strip())
            fn = m.group(1) if m else None
            if fn and f"name '{fn}' is not defined" in str(ne):
                func_not_found = fn
            else:
                call_err = traceback.format_exc()
        except Exception:
            call_err = traceback.format_exc()
        finally:
            sys.stdout = old_out
            captured_stdout = buf.getvalue()

        if func_not_found:
            return json.dumps({
                "passed": False,
                "type": "not_found",
                "func": func_not_found,
                "call": call_expr,
                "hidden": is_hidden
            })

        if call_err:
            return json.dumps({
                "passed": False,
                "type": "error",
                "call": call_expr,
                "error": call_err,
                "hidden": is_hidden
            })

        if has_expected_ret:
            ret_mismatch = False
            if isinstance(expected_ret, bool):
                if not (isinstance(ret_val, bool) and ret_val == expected_ret):
                    ret_mismatch = True
            elif expected_ret is None:
                if ret_val is not None:
                    ret_mismatch = True
            elif isinstance(expected_ret, str):
                if not (isinstance(ret_val, str) and ret_val == expected_ret):
                    ret_mismatch = True
            elif isinstance(expected_ret, (int, float)):
                if isinstance(ret_val, bool) or not isinstance(ret_val, (int, float)) or ret_val != expected_ret:
                    ret_mismatch = True
            else:
                if ret_val != expected_ret:
                    ret_mismatch = True

            if ret_mismatch:
                return json.dumps({
                    "passed": False,
                    "type": "returns_mismatch",
                    "call": call_expr,
                    "expected": expected_ret,
                    "actual": repr(ret_val),
                    "hidden": is_hidden
                })

        if has_expected_stdout:
            norm_actual = "\n".join([line.rstrip() for line in captured_stdout.replace("\r\n", "\n").split("\n")]).strip()
            norm_expected = "\n".join([line.rstrip() for line in expected_stdout.replace("\r\n", "\n").split("\n")]).strip()
            if norm_actual != norm_expected:
                return json.dumps({
                    "passed": False,
                    "type": "stdout_mismatch",
                    "call": call_expr,
                    "expected": norm_expected,
                    "actual": norm_actual,
                    "hidden": is_hidden
                })

    return json.dumps({"passed": True})

def check_solution(user_code, task):
    reqs = task.get("astRequirements", {})
    ast_res = json.loads(analyze_ast(user_code, json.dumps(reqs)))
    if ast_res.get("syntax_error"):
        return {"passed": False, "title": "SyntaxError", "sub": ast_res["syntax_error"]}
    if ast_res.get("errors"):
        return {"passed": False, "title": "ASTError", "sub": ast_res["errors"][0]}

    user_ns = {}
    buf = io.StringIO()
    old_stdout = sys.stdout
    sys.stdout = buf
    runtime_err = None
    try:
        guarded = _inject_loop_guard(user_code)
        exec(guarded, user_ns)
    except Exception:
        runtime_err = traceback.format_exc()
    finally:
        sys.stdout = old_stdout
        out = buf.getvalue()

    if runtime_err:
        return {"passed": False, "title": "RuntimeError", "sub": runtime_err}

    norm_out = "\n".join([l.rstrip() for l in out.replace("\r\n", "\n").split("\n")]).strip()
    if "expectedOutput" in task:
        norm_exp = "\n".join([l.rstrip() for l in task["expectedOutput"].replace("\r\n", "\n").split("\n")]).strip()
        if norm_out != norm_exp:
            return {"passed": False, "title": "OutputMismatch", "sub": f"Expected: {norm_exp}, got: {norm_out}"}

    if task.get("tests"):
        test_res = json.loads(_run_task_tests(json.dumps(task["tests"]), user_ns))
        if not test_res.get("passed"):
            return {"passed": False, "title": "TestFailed", "sub": str(test_res)}

    return {"passed": True}

# Тестирование заданий из пилотной темы
print("=== Запуск тестов Python ===")

# Загружаем тему через чтение JS и извлечение данных или ручное определение
# Проверим эталоны и неправильные решения из Appendix A
tasks_data = {
    "l1_fn_c1": {
        "astRequirements": {"require_def": True, "require_return": True},
        "tests": [
            {"call": "double(7)", "returns": 14},
            {"call": "double(0)", "returns": 0},
            {"call": "double(-2)", "returns": -4},
            {"call": "double(2.5)", "returns": 5.0, "hidden": True}
        ],
        "ref": "def double(x):\n    return x * 2\n\nprint(double(7))\nprint(double(double(3)))",
        "wrong": [
            ("print вместо return", "def double(x):\n    print(x * 2)\n\ndouble(7)"),
            ("умножает на 3", "def double(x):\n    return x * 3\n\nprint(double(7))")
        ]
    },
    "l1_fn_f1": {
        "astRequirements": {"require_def": True, "require_return": True},
        "expectedOutput": "21",
        "tests": [
            {"call": "triple(5)", "returns": 15},
            {"call": "triple(0)", "returns": 0},
            {"call": "triple(-1)", "returns": -3, "hidden": True}
        ],
        "ref": "def triple(x):\n    return x * 3\n\nprint(triple(5) + triple(2))",
        "wrong": [
            ("код не изменён", "def triple(x):\n    print(x * 3)\n\nprint(triple(5) + triple(2))"),
            ("и print, и return", "def triple(x):\n    print(x * 3)\n    return x * 3\n\nprint(triple(5) + triple(2))")
        ]
    },
    "l1_fn_c2": {
        "astRequirements": {"require_def": True},
        "tests": [
            {"call": "draw_line(5)", "stdout": "*****"},
            {"call": "draw_line(1)", "stdout": "*"},
            {"call": "draw_line(12)", "stdout": "************", "hidden": True},
            {"call": "draw_line(0)", "stdout": "", "hidden": True}
        ],
        "ref": "def draw_line(n):\n    print('*' * n)\n\ndraw_line(5)\ndraw_line(12)",
        "wrong": [
            ("return вместо print", "def draw_line(n):\n    return '*' * n\n\ndraw_line(5)"),
            ("всегда пять звёздочек", "def draw_line(n):\n    print('*' * 5)\n\ndraw_line(5)")
        ]
    },
    "l1_fn_c3": {
        "astRequirements": {"require_def": True, "require_return": True},
        "tests": [
            {"call": "is_even(4)", "returns": True},
            {"call": "is_even(7)", "returns": False},
            {"call": "is_even(0)", "returns": True},
            {"call": "is_even(-3)", "returns": False, "hidden": True}
        ],
        "ref": "def is_even(n):\n    return n % 2 == 0\n\nprint(is_even(4))\nprint(is_even(7))\nprint(is_even(0))",
        "wrong": [
            ("возвращает остаток, а не bool", "def is_even(n):\n    return n % 2"),
            ("print вместо return", "def is_even(n):\n    print(n % 2 == 0)"),
            ("перепутано условие", "def is_even(n):\n    return n % 2 == 1")
        ]
    },
    "l1_fn_c4": {
        "astRequirements": {"require_def": True, "require_return": True, "require_if": True, "forbid_calls": ["max", "min", "sorted"]},
        "tests": [
            {"call": "max_of_two(3, 5)", "returns": 5},
            {"call": "max_of_two(9, 2)", "returns": 9},
            {"call": "max_of_two(4, 4)", "returns": 4},
            {"call": "max_of_two(-1, -5)", "returns": -1, "hidden": True}
        ],
        "ref": "def max_of_two(a, b):\n    if a > b:\n        return a\n    return b\n\nprint(max_of_two(3, 5))",
        "wrong": [
            ("использует max()", "def max_of_two(a, b):\n    if a > b:\n        return max(a, b)\n    return b"),
            ("забыт второй return", "def max_of_two(a, b):\n    if a > b:\n        return a"),
            ("всегда первое", "def max_of_two(a, b):\n    if a > 0:\n        return a\n    return a")
        ]
    },
    "l1_fn_c5": {
        "astRequirements": {"require_def": True},
        "tests": [
            {"call": "rectangle(5, 3)", "stdout": "#####\n#####\n#####"},
            {"call": "rectangle(4, 2, '@')", "stdout": "@@@@\n@@@@"},
            {"call": "rectangle(1, 1)", "stdout": "#"},
            {"call": "rectangle(3, 1, '*')", "stdout": "***", "hidden": True}
        ],
        "ref": "def rectangle(w, h, symbol='#'):\n    for _ in range(h):\n        print(symbol * w)\n\nrectangle(5, 3)\nrectangle(4, 2, '@')",
        "wrong": [
            ("нет значения по умолчанию", "def rectangle(w, h, symbol):\n    for _ in range(h):\n        print(symbol * w)"),
            ("игнорирует symbol", "def rectangle(w, h, symbol='#'):\n    for _ in range(h):\n        print('#' * w)")
        ]
    },
    "l1_fn_c6": {
        "astRequirements": {"require_def": True, "require_return": True},
        "tests": [
            {"call": "count_vowels('программирование')", "returns": 7},
            {"call": "count_vowels('')", "returns": 0},
            {"call": "count_vowels('Привет')", "returns": 2},
            {"call": "count_vowels('ЁЛКА')", "returns": 2, "hidden": True},
            {"call": "count_vowels('ПРОГРАММА')", "returns": 3, "hidden": True}
        ],
        "ref": "def count_vowels(text):\n    count = 0\n    for ch in text.lower():\n        if ch in 'аеёиоуыэюя':\n            count += 1\n    return count\n\nprint(count_vowels('программирование'))",
        "wrong": [
            ("без ё", "def count_vowels(text):\n    count = 0\n    for ch in text.lower():\n        if ch in 'аеиоуыэюя':\n            count += 1\n    return count"),
            ("без lower()", "def count_vowels(text):\n    count = 0\n    for ch in text:\n        if ch in 'аеёиоуыэюя':\n            count += 1\n    return count"),
            ("print вместо return", "def count_vowels(text):\n    count = 0\n    for ch in text.lower():\n        if ch in 'аеёиоуыэюя':\n            count += 1\n    print(count)")
        ]
    },
    "l1_fn_c7": {
        "astRequirements": {"require_def": True, "require_calls": ["draw_line"]},
        "tests": [
            {"call": "triangle(4)", "stdout": "*\n**\n***\n****"},
            {"call": "triangle(1)", "stdout": "*"},
            {"call": "triangle(3)", "stdout": "*\n**\n***", "hidden": True}
        ],
        "ref": "def draw_line(n):\n    print('*' * n)\n\ndef triangle(n):\n    for i in range(1, n + 1):\n        draw_line(i)\n\ntriangle(4)",
        "wrong": [
            ("не использует draw_line", "def draw_line(n):\n    print('*' * n)\n\ndef triangle(n):\n    for i in range(1, n + 1):\n        print('*' * i)"),
            ("сдвиг на единицу", "def draw_line(n):\n    print('*' * n)\n\ndef triangle(n):\n    for i in range(n):\n        draw_line(i)")
        ]
    },
    "l1_fn_c8": {
        "astRequirements": {"require_def": True, "require_return": True},
        "tests": [
            {"call": "calc(6, 3, '+')", "returns": 9},
            {"call": "calc(6, 3, '-')", "returns": 3},
            {"call": "calc(6, 3, '*')", "returns": 18},
            {"call": "calc(6, 3, '/')", "returns": 2.0},
            {"call": "calc(5, 0, '/')", "returns": "Делить на ноль нельзя"},
            {"call": "calc(7, 2, '/')", "returns": 3.5, "hidden": True}
        ],
        "ref": "def calc(a, b, op):\n    if op == '+':\n        return a + b\n    if op == '-':\n        return a - b\n    if op == '*':\n        return a * b\n    if op == '/':\n        if b == 0:\n            return 'Делить на ноль нельзя'\n        return a / b",
        "wrong": [
            ("нет проверки деления на ноль", "def calc(a, b, op):\n    if op == '+':\n        return a + b\n    if op == '-':\n        return a - b\n    if op == '*':\n        return a * b\n    if op == '/':\n        return a / b"),
            ("print вместо return", "def calc(a, b, op):\n    if op == '+':\n        print(a + b)")
        ]
    },
    "l1_dict_c1": {
        "astRequirements": {"require_def": True, "require_return": True},
        "tests": [
            {"call": 'get_price({"чай": 100, "кофе": 150}, "чай")', "returns": 100},
            {"call": 'get_price({"чай": 100, "кофе": 150}, "сок")', "returns": 0},
            {"call": 'get_price({}, "чай")', "returns": 0, "hidden": True},
            {"call": 'get_price({"чай": 0}, "чай")', "returns": 0, "hidden": True}
        ],
        "ref": "def get_price(prices, name):\n    return prices.get(name, 0)\n\nmenu = {'чай': 100, 'кофе': 150}\nprint(get_price(menu, 'чай'))\nprint(get_price(menu, 'сок'))",
        "wrong": [
            ("квадратные скобки без get", "def get_price(prices, name):\n    return prices[name]"),
            ("print вместо return", "def get_price(prices, name):\n    print(prices.get(name, 0))")
        ]
    },
    "l1_dict_f1": {
        "astRequirements": {"require_def": True, "require_return": True},
        "expectedOutput": "7\n3",
        "tests": [
            {"call": 'add_item({"a": 1}, "a", 2)', "returns": 3},
            {"call": 'add_item({}, "b", 4)', "returns": 4},
            {"call": 'add_item({"x": 0}, "y", 1)', "returns": 1, "hidden": True}
        ],
        "ref": "def add_item(stock, name, count):\n    stock[name] = stock.get(name, 0) + count\n    return stock[name]\n\nstock = {'яблоки': 5}\nprint(add_item(stock, 'яблоки', 2))\nprint(add_item(stock, 'груши', 3))",
        "wrong": [
            ("код не изменён", "def add_item(stock, name, count):\n    stock[name] += count\n    return stock[name]\n\nstock = {'яблоки': 5}\nprint(add_item(stock, 'яблоки', 2))\nprint(add_item(stock, 'груши', 3))"),
            ("не возвращает значение", "def add_item(stock, name, count):\n    stock[name] = stock.get(name, 0) + count\n\nstock = {'яблоки': 5}\nprint(add_item(stock, 'яблоки', 2))\nprint(add_item(stock, 'груши', 3))")
        ]
    },
    "l1_dict_c2": {
        "astRequirements": {"require_def": True, "require_return": True, "forbid_calls": ["Counter"]},
        "tests": [
            {"call": 'count_chars("abca")["a"]', "returns": 2},
            {"call": 'count_chars("abca")["b"]', "returns": 1},
            {"call": 'len(count_chars("abca"))', "returns": 3},
            {"call": 'len(count_chars(""))', "returns": 0, "hidden": True},
            {"call": 'count_chars("aaa")["a"]', "returns": 3, "hidden": True}
        ],
        "ref": "def count_chars(text):\n    result = {}\n    for ch in text:\n        result[ch] = result.get(ch, 0) + 1\n    return result\n\nprint(count_chars('abca'))",
        "wrong": [
            ("использует Counter", "def count_chars(text):\n    return dict(Counter(text))"),
            ("всегда 1", "def count_chars(text):\n    result = {}\n    for ch in text:\n        result[ch] = 1\n    return result")
        ]
    },
    "l1_dict_c3": {
        "astRequirements": {"require_def": True, "require_return": True},
        "tests": [
            {"call": 'total_price({"чай": 100, "кофе": 150}, {"чай": 2, "кофе": 1})', "returns": 350},
            {"call": 'total_price({"чай": 100}, {})', "returns": 0},
            {"call": 'total_price({"чай": 100, "кофе": 150}, {"кофе": 3})', "returns": 450},
            {"call": 'total_price({"a": 1, "b": 2}, {"a": 5, "b": 5})', "returns": 15, "hidden": True}
        ],
        "ref": "def total_price(prices, cart):\n    total = 0\n    for name, qty in cart.items():\n        total += prices[name] * qty\n    return total\n\nprint(total_price({'чай': 100, 'кофе': 150}, {'чай': 2, 'кофе': 1}))",
        "wrong": [
            ("без умножения на количество", "def total_price(prices, cart):\n    total = 0\n    for name in cart:\n        total += prices[name]\n    return total"),
            ("print вместо return", "def total_price(prices, cart):\n    total = 0\n    for name, qty in cart.items():\n        total += prices[name] * qty\n    print(total)")
        ]
    },
    "l1_dict_c4": {
        "astRequirements": {"require_def": True, "require_return": True},
        "tests": [
            {"call": 'len(group_by_length(["a", "bb", "c"])[1])', "returns": 2},
            {"call": 'group_by_length(["a", "bb", "c"])[2][0]', "returns": "bb"},
            {"call": 'len(group_by_length(["a", "bb", "c"]))', "returns": 2},
            {"call": 'len(group_by_length([]))', "returns": 0, "hidden": True},
            {"call": 'group_by_length(["abc", "xyz", "q"])[3][1]', "returns": "xyz", "hidden": True}
        ],
        "ref": "def group_by_length(words):\n    result = {}\n    for word in words:\n        n = len(word)\n        if n not in result:\n            result[n] = []\n        result[n].append(word)\n    return result\n\nprint(group_by_length(['a', 'bb', 'c']))",
        "wrong": [
            ("перезаписывает вместо append", "def group_by_length(words):\n    result = {}\n    for word in words:\n        result[len(word)] = [word]\n    return result"),
            ("возвращает число слов", "def group_by_length(words):\n    return len(words)")
        ]
    }
}

passed_tests = 0
failed_tests = 0

for tid, tinfo in tasks_data.items():
    # Прогон эталона
    res = check_solution(tinfo["ref"], tinfo)
    if res["passed"]:
        print(f"  ✓ [{tid}] Эталон принят")
        passed_tests += 1
    else:
        print(f"  × [{tid}] ОШИБКА: Эталон отклонён: {res}")
        failed_tests += 1

    # Прогон неправильных
    for wname, wcode in tinfo["wrong"]:
        res = check_solution(wcode, tinfo)
        if not res["passed"]:
            print(f"  ✓ [{tid}] Ошибочное решение '{wname}' корректно отклонено")
            passed_tests += 1
        else:
            print(f"  × [{tid}] ОШИБКА: Ошибочное решение '{wname}' было ПРИНЯТО!")
            failed_tests += 1

# Проверка predict
predict_tests = [
    ("l1_fn_p1", "def square(x):\n    return x * x\n\nprint(square(2) + square(3))", "13"),
    ("l1_fn_p2", "def g(x):\n    print(x * 2)\n\ny = g(4)\nprint(y)", "8\nNone"),
    ("l1_dict_p1", "d = {'a': 1, 'b': 2}\nd['c'] = d['a'] + d['b']\nd['a'] = 10\nprint(d['a'], d['c'])", "10 3"),
    ("l1_dict_p2", "d = {'x': 1, 'y': 2}\nprint('x' in d, 1 in d)\nprint(d.get('z'))\nprint(d.get('z', 0))", "True False\nNone\n0"),
    ("l1_dict_p3", "scores = {'Аня': 5, 'Борис': 3}\nfor name, score in scores.items():\n    print(name, score * 2)", "Аня 10\nБорис 6")
]

for pid, pcode, pexp in predict_tests:
    buf = io.StringIO()
    old_out = sys.stdout
    sys.stdout = buf
    exec(pcode, {})
    sys.stdout = old_out
    actual = buf.getvalue().strip()
    if actual == pexp:
        print(f"  ✓ [{pid}] Predict вывод совпадает ({actual})")
        passed_tests += 1
    else:
        print(f"  × [{pid}] Predict не совпадает: {actual} != {pexp}")
        failed_tests += 1

print(f"\nИТОГ: {passed_tests} пройдено, {failed_tests} ошибок.")
if failed_tests > 0:
    sys.exit(1)
