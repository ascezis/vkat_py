/**
 * Тема 4: Функции (def, аргументы, return) — Усиленный блок
 */

window.COURSE_TOPICS = window.COURSE_TOPICS || [];

window.COURSE_TOPICS.push({
  id: "functions",
  title: "Функции",
  tasks: [
    {
      id: "fn_1",
      title: "Объявление функции через def",
      explanation: [
        "Функция — это подписанный блок кода, который можно вызывать многократно из разных мест программы.",
        "Функция объявляется ключевым словом def, за которым следует имя функции, круглые скобки () и двоеточие :. Тело функции пишется с отступом в 4 пробела."
      ],
      example: {
        code: 'def greet():\n    print("Добро пожаловать в игру!")\n\n# Вызов функции:\ngreet()',
        output: "Добро пожаловать в игру!"
      },
      assignment: "Объяви функцию say_hello(), которая при вызове печатает «Привет, Python!». Вызови эту функцию один раз.",
      starterCode: '# Объяви функцию say_hello и вызови её\n',
      hint: 'def say_hello():\n    print("Привет, Python!")\n\nsay_hello()',
      expectedOutput: "Привет, Python!",
      astRequirements: {
        require_def: true
      },
      testCode: 'assert "say_hello" in _user_ns and callable(_user_ns["say_hello"]), "Функция say_hello не найдена"',
      improveTip: "Между объявлением функции и основным кодом программы по PEP8 принято оставлять одну или две пустые строки.",
      successMessage: "Первая функция успешно объявлена и вызвана!"
    },
    {
      id: "fn_2",
      title: "Функция с аргументами",
      explanation: [
        "Внутрь скобок функции можно передавать параметры (аргументы). Это переменные, которые принимают значения в момент вызова функции.",
        "Это делает функцию универсальной: одна и та же функция может здороваться с разными игроками."
      ],
      example: {
        code: 'def welcome(name):\n    print("Привет,", name)\n\nwelcome("Алиса")\nwelcome("Боб")',
        output: "Привет, Алиса\nПривет, Боб"
      },
      assignment: "Напиши функцию show_score(player, points), которая принимает два аргумента: имя игрока и количество очков. Внутри она должна печатать имя и очки через пробел (print(player, points)). Вызови show_score(\"Max\", 100).",
      starterCode: '# Объяви show_score(player, points) и вызови с аргументами "Max", 100\n',
      hint: 'def show_score(player, points):\n    print(player, points)\n\nshow_score("Max", 100)',
      expectedOutput: "Max 100",
      astRequirements: {
        require_def: true
      },
      testCode: 'import io as _tio; import sys as _tsys; _tb = _tio.StringIO(); _tsys.stdout = _tb; _user_ns["show_score"]("Test", 42); _tsys.stdout = _tsys.__stdout__; assert "Test 42" in _tb.getvalue(), "Функция show_score должна печатать имя и очки"',
      improveTip: "Параметры в круглых скобках функции перечисляются через запятую с пробелом после неё.",
      successMessage: "Функция с аргументами работает как надо!"
    },
    {
      id: "fn_3",
      title: "Возврат значения через return",
      explanation: [
        "Главная разница между print() и return: print просто выводит текст на экран для человека, а return возвращает результат вычислений обратно в программу, чтобы его можно было использовать дальше (сохранить в переменную или передать в другую функцию).",
        "Когда выполнение доходит до return, функция немедленно завершается."
      ],
      example: {
        code: 'def square(n):\n    return n * n\n\nres = square(4)\nprint(res)',
        output: "16"
      },
      assignment: "Напиши функцию double(x), которая принимает число x и возвращает его удвоенное значение (x * 2) через return. Вызови её для числа 21 и напечатай результат через print(double(21)).",
      starterCode: '# Напиши функцию double(x) с оператором return\n',
      hint: 'def double(x):\n    return x * 2\n\nprint(double(21))',
      expectedOutput: "42",
      astRequirements: {
        require_def: true,
        require_return: true
      },
      testCode: 'assert _user_ns["double"](5) == 10 and _user_ns["double"](0) == 0, "double должна возвращать удвоенное число"',
      improveTip: "Запомни: return — это не функция, скобки после него не нужны (пиши `return x * 2`, а не `return(x * 2)`).",
      successMessage: "Значение функции корректно возвращается через return!"
    },
    {
      id: "fn_4",
      title: "Логика и ветвление внутри функции",
      explanation: [
        "Функция может содержать любые конструкции: условия if/else, циклы и несколько инструкций return.",
        "Это позволяет инкапсулировать правила игры или бизнес-логику в одно понятное место."
      ],
      example: {
        code: 'def is_even(num):\n    if num % 2 == 0:\n        return "чётное"\n    else:\n        return "нечётное"\n\nprint(is_even(7))',
        output: "нечётное"
      },
      assignment: "Напиши функцию check_pass(score). Если score >= 50, функция должна возвращать строку «Сдал», иначе строку «Не сдал». Напечатай результат вызова print(check_pass(75)).",
      starterCode: '# Напиши функцию check_pass(score)\n',
      hint: 'def check_pass(score):\n    if score >= 50:\n        return "Сдал"\n    else:\n        return "Не сдал"\n\nprint(check_pass(75))',
      expectedOutput: "Сдал",
      astRequirements: {
        require_def: true,
        require_return: true,
        require_if: true
      },
      testCode: 'assert _user_ns["check_pass"](50) == "Сдал" and _user_ns["check_pass"](49) == "Не сдал"',
      improveTip: "После return в if блок else иногда можно опустить, так как return уже завершает функцию. Но с else код читается наглядно для новичка.",
      successMessage: "Условия внутри функции работают безукоризненно!"
    },
    {
      id: "fn_5",
      title: "Вычисления и вызов функций в цепочке",
      explanation: [
        "Результат работы одной функции можно сразу использовать в расчетах или передавать аргументом в другую.",
        "Так из маленьких простых функций собираются сложные программы."
      ],
      example: {
        code: 'def add(a, b):\n    return a + b\n\ntotal = add(10, 20) + add(5, 5)\nprint(total)',
        output: "40"
      },
      assignment: "Напиши функцию calc_damage(base_attack, bonus), которая возвращает сумму base_attack + bonus. Вызови её со значениями (30, 15) и напечатай результат.",
      starterCode: '# Напиши функцию calc_damage и выведи результат вызова\n',
      hint: 'def calc_damage(base_attack, bonus):\n    return base_attack + bonus\n\nprint(calc_damage(30, 15))',
      expectedOutput: "45",
      astRequirements: {
        require_def: true,
        require_return: true
      },
      testCode: 'assert _user_ns["calc_damage"](10, 5) == 15',
      improveTip: "Давай функциям понятные имена в виде глаголов (calc_damage, get_user, is_valid) — так код объясняет сам себя.",
      successMessage: "Функция написана по всем канонам Python!"
    }
  ]
});
