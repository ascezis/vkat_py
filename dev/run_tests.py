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

    if reqs.get("require_try") and ast.Try not in node_types:
        errors.append("В коде должна использоваться конструкция try/except.")

    if reqs.get("require_raise") and ast.Raise not in node_types:
        errors.append("В коде должен использоваться оператор raise.")

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

def _inject_loop_guard_ast(tree, max_iters=5000000):
    counter_id = 0
    class LoopGuardInjector(ast.NodeTransformer):
        def _inject(self, node):
            nonlocal counter_id
            counter_id += 1
            var = f"_lc{counter_id}"
            init = ast.Assign(
                targets=[ast.Name(id=var, ctx=ast.Store())],
                value=ast.Constant(value=0)
            )
            ast.copy_location(init, node)
            inc = ast.AugAssign(
                target=ast.Name(id=var, ctx=ast.Store()),
                op=ast.Add(),
                value=ast.Constant(value=1)
            )
            ast.copy_location(inc, node)
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
                orelse=[]
            )
            ast.copy_location(check, node)
            node.body = [inc, check] + node.body
            self.generic_visit(node)
            return [init, node]

        def visit_For(self, node):
            return self._inject(node)
        def visit_While(self, node):
            return self._inject(node)

    tree = LoopGuardInjector().visit(tree)
    ast.fix_missing_locations(tree)
    return tree

def _clean_tb(tb):
    lines = tb.splitlines()
    cleaned = []
    in_student = False
    for l in lines:
        if '<student>' in l:
            in_student = True
        if in_student or l.startswith('Traceback'):
            cleaned.append(l)
    return '\n'.join(cleaned) if cleaned else tb

def _inject_loop_guard(code_str, max_iters=5000000):
    """Внедряет счётчик итераций в каждый цикл for/while для защиты от бесконечных циклов."""
    try:
        tree = ast.parse(code_str)
        tree = _inject_loop_guard_ast(tree, max_iters=max_iters)
        return ast.unparse(tree)
    except SyntaxError:
        return code_str

def _compile_user_code(code_str, filename='<student>', max_iters=5000000):
    import linecache
    linecache.cache[filename] = (
        len(code_str),
        None,
        [line + '\n' for line in code_str.splitlines()],
        filename
    )
    try:
        tree = ast.parse(code_str, filename=filename)
        tree = _inject_loop_guard_ast(tree, max_iters=max_iters)
        return compile(tree, filename, 'exec')
    except SyntaxError:
        return compile(code_str, filename, 'exec')

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
                call_err = _clean_tb(traceback.format_exc())
        except Exception:
            call_err = _clean_tb(traceback.format_exc())
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
        code_obj = _compile_user_code(user_code)
        exec(code_obj, user_ns)
    except Exception:
        runtime_err = _clean_tb(traceback.format_exc())
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
    },
    "l1_exc_f1": {
        "astRequirements": {},
        "tests": [
            {"call": 'to_number("12")', "returns": 12},
            {"call": 'to_number("abc")', "returns": 0},
            {"call": 'to_number("")', "returns": 0, "hidden": True},
            {"call": 'to_number("-7")', "returns": -7, "hidden": True}
        ],
        "ref": "def to_number(text):\n    try:\n        return int(text)\n    except ValueError:\n        return 0",
        "wrong": [
            ("код не изменён", "def to_number(text):\n    try:\n        return int(text)\n    except ZeroDivisionError:\n        return 0")
        ]
    },
    "l1_exc_c1": {
        "astRequirements": {"require_def": True, "require_return": True, "require_try": True, "forbid_methods": ["isdigit", "isnumeric"]},
        "tests": [
            {"call": 'safe_int("42")', "returns": 42},
            {"call": 'safe_int("abc")', "returns": 0},
            {"call": 'safe_int("3.5", -1)', "returns": -1},
            {"call": 'safe_int("")', "returns": 0},
            {"call": 'safe_int(" 7 ")', "returns": 7, "hidden": True},
            {"call": 'safe_int("-5")', "returns": -5, "hidden": True}
        ],
        "ref": "def safe_int(text, default=0):\n    try:\n        return int(text)\n    except ValueError:\n        return default",
        "wrong": [
            ("без try", "def safe_int(text, default=0):\n    return int(text)"),
            ("использует isdigit", "def safe_int(text, default=0):\n    try:\n        if text.isdigit():\n            return int(text)\n        return default\n    except ValueError:\n        return default")
        ]
    },
    "l1_exc_c2": {
        "astRequirements": {"require_def": True, "require_return": True, "require_try": True},
        "tests": [
            {"call": 'safe_divide(10, 4)', "returns": 2.5},
            {"call": 'str(safe_divide(1, 0))', "returns": "None"},
            {"call": 'safe_divide(0, 5)', "returns": 0},
            {"call": 'safe_divide(-9, 3)', "returns": -3, "hidden": True},
            {"call": 'str(safe_divide(0, 0))', "returns": "None", "hidden": True}
        ],
        "ref": "def safe_divide(a, b):\n    try:\n        return a / b\n    except ZeroDivisionError:\n        return None",
        "wrong": [
            ("без try", "def safe_divide(a, b):\n    if b == 0:\n        return None\n    return a / b")
        ]
    },
    "l1_exc_c3": {
        "astRequirements": {"require_def": True, "require_return": True, "require_try": True},
        "tests": [
            {"call": 'read_value({"a": [1, 2]}, "a", 1)', "returns": 2},
            {"call": 'read_value({"a": [1]}, "b", 0)', "returns": "нет ключа"},
            {"call": 'read_value({"a": [1]}, "a", 5)', "returns": "нет элемента"},
            {"call": 'read_value({"a": []}, "a", 0)', "returns": "нет элемента", "hidden": True},
            {"call": 'read_value({}, "x", 0)', "returns": "нет ключа", "hidden": True}
        ],
        "ref": "def read_value(data, key, index):\n    try:\n        return data[key][index]\n    except KeyError:\n        return 'нет ключа'\n    except IndexError:\n        return 'нет элемента'",
        "wrong": [
            ("перепутаны сообщения", "def read_value(data, key, index):\n    try:\n        return data[key][index]\n    except KeyError:\n        return 'нет элемента'\n    except IndexError:\n        return 'нет ключа'")
        ]
    },
    "l1_exc_c4": {
        "astRequirements": {"require_def": True, "require_return": True, "require_for": True, "require_try": True},
        "tests": [
            {"call": 'sum_valid(["1", "2", "x", "4"])', "returns": 7},
            {"call": 'sum_valid([])', "returns": 0},
            {"call": 'sum_valid(["a", "b"])', "returns": 0},
            {"call": 'sum_valid(["10", "-3", "3.5", ""])', "returns": 7, "hidden": True},
            {"call": 'sum_valid(["5"])', "returns": 5, "hidden": True}
        ],
        "ref": "def sum_valid(items):\n    total = 0\n    for item in items:\n        try:\n            total += int(item)\n        except ValueError:\n            continue\n    return total",
        "wrong": [
            ("без try", "def sum_valid(items):\n    total = 0\n    for item in items:\n        total += int(item)\n    return total")
        ]
    },
    "l1_exc_c5": {
        "astRequirements": {"require_def": True, "require_return": True, "require_try": True, "require_raise": True, "require_calls": ["validate_age"]},
        "tests": [
            {"call": 'validate_age(25)', "returns": 25},
            {"call": 'is_valid_age(30)', "returns": True},
            {"call": 'is_valid_age(-1)', "returns": False},
            {"call": 'is_valid_age(200)', "returns": False},
            {"call": 'is_valid_age(0)', "returns": True, "hidden": True},
            {"call": 'is_valid_age(150)', "returns": True, "hidden": True},
            {"call": 'is_valid_age(151)', "returns": False, "hidden": True}
        ],
        "ref": "def validate_age(age):\n    if age < 0 or age > 150:\n        raise ValueError('Недопустимый возраст')\n    return age\n\ndef is_valid_age(age):\n    try:\n        validate_age(age)\n    except ValueError:\n        return False\n    return True",
        "wrong": [
            ("без raise", "def validate_age(age):\n    return age\n\ndef is_valid_age(age):\n    try:\n        validate_age(age)\n    except ValueError:\n        return False\n    return True")
        ]
    },
    "l1_exc_f2": {
        "astRequirements": {},
        "tests": [
            {"call": 'describe({"a": 1}, "a")', "returns": 1},
            {"call": 'describe({"a": 1}, "b")', "returns": "нет ключа"},
            {"call": 'describe(None, "a")', "returns": "ошибка"},
            {"call": 'describe({}, 5)', "returns": "нет ключа", "hidden": True},
            {"call": 'describe(7, "x")', "returns": "ошибка", "hidden": True}
        ],
        "ref": "def describe(data, key):\n    try:\n        return data[key]\n    except KeyError:\n        return 'нет ключа'\n    except Exception:\n        return 'ошибка'",
        "wrong": [
            ("код не изменён", "def describe(data, key):\n    try:\n        return data[key]\n    except Exception:\n        return 'ошибка'\n    except KeyError:\n        return 'нет ключа'")
        ]
    },
    "l1_sty_f1": {
        "astRequirements": {},
        "tests": [
            {"call": "total([1, 2, 3])", "returns": 6},
            {"call": "total([])", "returns": 0, "hidden": True},
            {"call": "total([-5, 5, 10])", "returns": 10, "hidden": True}
        ],
        "ref": "total_sum = 0\nfor price in [10, 20, 30]:\n    total_sum += price\n\ndef total(prices):\n    return sum(prices)",
        "wrong": [
            ("затенённая sum не исправлена", "sum = 0\nfor price in [10, 20, 30]:\n    sum += price\n\ndef total(prices):\n    return sum(prices)")
        ]
    },
    "l1_sty_c1": {
        "astRequirements": {"require_def": True, "require_return": True},
        "tests": [
            {"call": "ticket_price(5)", "returns": 0},
            {"call": "ticket_price(10)", "returns": 200},
            {"call": "ticket_price(30)", "returns": 400},
            {"call": "ticket_price(70)", "returns": 150},
            {"call": "str(ticket_price(-1))", "returns": "None", "hidden": True},
            {"call": "ticket_price(7)", "returns": 200, "hidden": True},
            {"call": "ticket_price(17)", "returns": 200, "hidden": True},
            {"call": "ticket_price(18)", "returns": 400, "hidden": True},
            {"call": "ticket_price(64)", "returns": 400, "hidden": True},
            {"call": "ticket_price(65)", "returns": 150, "hidden": True},
            {"call": "ticket_price(0)", "returns": 0, "hidden": True}
        ],
        "ref": "def ticket_price(age):\n    if age < 0:\n        return None\n    if age < 7:\n        return 0\n    if age < 18:\n        return 200\n    if age >= 65:\n        return 150\n    return 400",
        "wrong": [
            ("неверная граница возраста", "def ticket_price(age):\n    if age < 0:\n        return None\n    if age <= 7:\n        return 0\n    if age < 18:\n        return 200\n    if age >= 65:\n        return 150\n    return 400")
        ]
    },
    "l1_sty_c2": {
        "astRequirements": {"require_def": True, "require_return": True},
        "tests": [
            {"call": 'line_total("Яблоко", 50, 3)', "returns": "Яблоко: 150 руб."},
            {"call": 'line_total("Хлеб", 40, 2)', "returns": "Хлеб: 80 руб."},
            {"call": 'line_total("Чай", 0, 5)', "returns": "Чай: 0 руб.", "hidden": True}
        ],
        "ref": "def line_total(name, price, quantity):\n    return f'{name}: {price * quantity} руб.'\n\nfor name, price, qty in [('Яблоко', 50, 3), ('Хлеб', 40, 2), ('Молоко', 90, 1)]:\n    print(line_total(name, price, qty))",
        "wrong": [
            ("нет 'руб.'", "def line_total(name, price, quantity):\n    return f'{name}: {price * quantity}'")
        ]
    },
    "l1_sty_c3": {
        "astRequirements": {"require_def": True, "require_return": True},
        "tests": [
            {"call": "is_leap_year(2000)", "returns": True},
            {"call": "is_leap_year(1900)", "returns": False},
            {"call": "is_leap_year(2024)", "returns": True},
            {"call": "is_leap_year(2023)", "returns": False},
            {"call": "is_leap_year(2100)", "returns": False, "hidden": True},
            {"call": "is_leap_year(1600)", "returns": True, "hidden": True},
            {"call": "is_leap_year(4)", "returns": True, "hidden": True},
            {"call": "is_leap_year(1)", "returns": False, "hidden": True}
        ],
        "ref": "def is_leap_year(year):\n    if year % 400 == 0:\n        return True\n    if year % 100 == 0:\n        return False\n    return year % 4 == 0",
        "wrong": [
            ("без исключения на 100", "def is_leap_year(year):\n    return year % 4 == 0")
        ]
    },
    "l1_sty_f2": {
        "astRequirements": {},
        "tests": [
            {"call": 'to_int("42")', "returns": 42},
            {"call": 'to_int("abc")', "returns": 0},
            {"call": 'to_int("-3")', "returns": -3, "hidden": True},
            {"call": 'to_int("")', "returns": 0, "hidden": True}
        ],
        "ref": "def to_int(text):\n    try:\n        return int(text)\n    except ValueError:\n        return 0",
        "wrong": [
            ("опечатка txt не исправлена", "def to_int(text):\n    try:\n        return int(txt)\n    except:\n        return 0")
        ]
    },
    "l1_sty_c4": {
        "astRequirements": {"require_def": True, "require_return": True},
        "tests": [
            {"call": "str(add_bonus([50, 70]))", "returns": "[60, 80]"},
            {"call": "str((s := [1, 2], add_bonus(s), s)[2])", "returns": "[1, 2]"},
            {"call": "str(add_bonus([]))", "returns": "[]", "hidden": True},
            {"call": "str((s := [5], add_bonus(s), s)[1])", "returns": "[15]", "hidden": True}
        ],
        "ref": "def add_bonus(scores):\n    return [s + 10 for s in scores]",
        "wrong": [
            ("мутирует исходный список", "def add_bonus(scores):\n    for i in range(len(scores)):\n        scores[i] += 10\n    return scores")
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
    ("l1_list_p1", 'print("python"[::-1])', "nohtyp"),
    ("l1_fn_p1", "def square(x):\n    return x * x\n\nprint(square(2) + square(3))", "13"),
    ("l1_fn_p2", "def g(x):\n    print(x * 2)\n\ny = g(4)\nprint(y)", "8\nNone"),
    ("l1_dict_p1", "d = {'a': 1, 'b': 2}\nd['c'] = d['a'] + d['b']\nd['a'] = 10\nprint(d['a'], d['c'])", "10 3"),
    ("l1_dict_p2", "d = {'x': 1, 'y': 2}\nprint('x' in d, 1 in d)\nprint(d.get('z'))\nprint(d.get('z', 0))", "True False\nNone\n0"),
    ("l1_dict_p3", "scores = {'Аня': 5, 'Борис': 3}\nfor name, score in scores.items():\n    print(name, score * 2)", "Аня 10\nБорис 6"),
    ("l1_exc_p1", 'data = {"a": [1, 2]}\n\nfor key, idx in [("a", 1), ("a", 5), ("b", 0)]:\n    try:\n        print(data[key][idx])\n    except KeyError:\n        print("key")\n    except IndexError:\n        print("index")', "2\nindex\nkey"),
    ("l1_exc_p2", 'def f(x):\n    try:\n        print("A")\n        result = 10 / x\n        print("B")\n    except ZeroDivisionError:\n        print("C")\n    else:\n        print("D")\n    finally:\n        print("E")\n\nf(2)\nf(0)', "A\nB\nD\nE\nA\nC\nE"),
    ("l1_exc_p3", 'def g():\n    try:\n        return "try"\n    finally:\n        print("finally")\n\nprint(g())', "finally\ntry"),
    ("l1_sty_p1", "def f(l, n):\n    r = []\n    for x in l:\n        if x > n:\n            r.append(x)\n    return r\n\nprint(f([5, 1, 8, 3], 4))", "[5, 8]"),
    ("l1_sty_p2", 'x = 10\nprint("fizzbuzz" if x % 15 == 0 else "fizz" if x % 3 == 0 else "buzz" if x % 5 == 0 else x)', "buzz"),
    ("l1_sty_p3", "print(1 + 2 * 3 ** 2 // 4 % 5)", "5")
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

# Проверка регрессий: защита от ложных срабатываний и точность строк в ошибках
# Регрессия 1: цикл на 150 000 итераций не должен падать
large_loop_code = """
n = 0
while n < 150000:
    n += 1
print('Done:', n)
"""
large_res = check_solution(large_loop_code, {"expectedOutput": "Done: 150000"})
if large_res["passed"]:
    print("  ✓ [regression_loop_guard] Цикл на 150 000 итераций успешно выполнен")
    passed_tests += 1
else:
    print(f"  × [regression_loop_guard] ОШИБКА: {large_res}")
    failed_tests += 1

# Регрессия 2: номер строки в ошибке совпадает со строкой в коде с комментариями
commented_error_code = """# line 1
# line 2
def buggy():
    # line 4
    return 1 / 0

buggy()
"""
err_tb = ""
try:
    c_obj = _compile_user_code(commented_error_code)
    exec(c_obj, {})
except Exception:
    err_tb = _clean_tb(traceback.format_exc())

if 'line 5, in buggy' in err_tb:
    print("  ✓ [regression_lineno] Номер строки с ошибкой в коде с комментариями точно указывает на строку 5")
    passed_tests += 1
else:
    print(f"  × [regression_lineno] ОШИБКА: ожидалась строка 5 в traceback, получено:\n{err_tb}")
    failed_tests += 1

# Регрессия 3: Python bootstrap из app/checker.js не содержит SyntaxError (unterminated string literal)
import subprocess
node_script = (
    "const fs = require('fs');\n"
    "const content = fs.readFileSync('app/checker.js', 'utf8');\n"
    "const start = content.indexOf('await pyodide.runPythonAsync(`');\n"
    "const end = content.indexOf('`);', start);\n"
    "const lit = content.substring(start + 'await pyodide.runPythonAsync(`'.length - 1, end + 1);\n"
    "process.stdout.write(eval(lit));"
)
try:
    n_res = subprocess.run(['node', '-e', node_script], capture_output=True, text=True, encoding='utf-8')
    if n_res.returncode == 0:
        ast.parse(n_res.stdout)
        print("  ✓ [regression_bootstrap_ast] Встроенный код Python в app/checker.js синтаксически корректен")
        passed_tests += 1
    else:
        print(f"  × [regression_bootstrap_ast] Ошибка извлечения bootstrap через Node: {n_res.stderr}")
        failed_tests += 1
except Exception as e:
    print(f"  × [regression_bootstrap_ast] Исключение при синтаксическом разборе bootstrap: {e}")
    failed_tests += 1

print(f"\nИТОГ: {passed_tests} пройдено, {failed_tests} ошибок.")
if failed_tests > 0:
    sys.exit(1)
