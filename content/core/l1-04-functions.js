/**
 * Тема этапа 2: Функции (углублённая практика)
 */

window.COURSE_TOPICS = window.COURSE_TOPICS || [];

window.COURSE_TOPICS.push({
  id: "l1_functions",
  title: "Функции",
  minutes: 60,
  items: [
    {
      id: "l1_fn_t1",
      type: "theory",
      title: "Функция: определение и вызов",
      blocks: [
        {
          type: "p",
          html: "Функция — это поименованный блок кода, который можно запускать многократно из разных мест программы."
        },
        {
          type: "p",
          html: "Функция создаётся ключевым словом <code>def</code>. После имени функции пишутся круглые скобки и двоеточие, а весь код тела функции сдвигается на 4 пробела."
        },
        {
          type: "code",
          code: 'def say_hello():\n    print("Привет, игрок!")\n\n# Чтобы функция заработала, её нужно вызвать:\nsay_hello()',
          output: "Привет, игрок!"
        },
        {
          type: "note",
          html: "Главное правило: строка с <code>def</code> только запоминает функцию. Код внутри неё <b>не выполняется</b>, пока функция не будет вызвана по имени со скобками."
        }
      ]
    },
    {
      id: "l1_fn_q1",
      type: "quiz",
      title: "Функция создана, но не вызвана",
      question: "В программе есть только эти строки. Что произойдёт при запуске?",
      code: 'def hello():\n    print("Привет")',
      options: [
        "Выведется «Привет»",
        "Ничего не выведется",
        "Будет NameError",
        "Будет SyntaxError"
      ],
      correct: 1,
      explain: "Строка def только запоминает функцию. Код внутри выполняется при вызове hello()."
    },
    {
      id: "l1_fn_t2",
      type: "theory",
      title: "Параметры и аргументы",
      blocks: [
        {
          type: "p",
          html: "Чтобы функция была универсальной и обрабатывала разные данные, ей передают параметры."
        },
        {
          type: "p",
          html: "<b>Параметр</b> — переменная в скобках при создании функции (<code>def greet(name):</code>).<br><b>Аргумент</b> — конкретное значение, передаваемое при вызове (<code>greet(\"Алиса\")</code>)."
        },
        {
          type: "code",
          code: 'def show_rect(w, h):\n    print(f"Прямоугольник {w} на {h}")\n\nshow_rect(10, 5)\nshow_rect(h=5, w=10)  # именованные аргументы',
          output: "Прямоугольник 10 на 5\nПрямоугольник 10 на 5"
        },
        {
          type: "note",
          html: "Если передать меньше или больше аргументов, чем параметров в <code>def</code>, Python выдаст <code>TypeError</code> (missing required positional argument или takes positional arguments but given)."
        }
      ]
    },
    {
      id: "l1_fn_q2",
      type: "quiz",
      title: "Вызов без аргументов",
      question: "Функция создана как def greet(name). Что произойдёт при вызове greet() без аргументов?",
      options: [
        "Выведется пустое имя",
        "TypeError: не передан обязательный аргумент name",
        "NameError",
        "Ничего не произойдёт"
      ],
      correct: 1,
      explain: "Параметров больше, чем аргументов, Python сообщает TypeError: missing 1 required positional argument."
    },
    {
      id: "l1_fn_t3",
      type: "theory",
      title: "return и print",
      blocks: [
        {
          type: "p",
          html: "Разница между <code>print</code> и <code>return</code> — фундаментальное различие при работе с функциями:"
        },
        {
          type: "list",
          items: [
            "<code>print(...)</code> просто показывает текст на экране для человека. Результат вывода нельзя сохранить в переменную или использовать в дальнейших вычислениях.",
            "<code>return ...</code> возвращает результат вычислений обратно в программу. Значение можно сохранить в переменную, сложить с другим значением или передать в другую функцию."
          ]
        },
        {
          type: "code",
          code: 'def square(n):\n    return n * n\n\nres = square(4) + 1  # 16 + 1\nprint(res)',
          output: "17"
        },
        {
          type: "p",
          html: "Если в функции нет <code>return</code>, она возвращает специальное значение <code>None</code> («ничего»)."
        },
        {
          type: "note",
          html: "Инструкция <code>return</code> немедленно завершает работу функции. Любой код после неё внутри функции не выполнится."
        }
      ]
    },
    {
      id: "l1_fn_p1",
      type: "predict",
      title: "Сложение результатов return",
      explanation: [
        "Посмотри на код программы и определи, какой вывод появится в консоли при запуске."
      ],
      code: 'def square(x):\n    return x * x\n\nprint(square(2) + square(3))',
      expectedOutput: "13",
      explain: "square(2) возвращает 4, square(3) возвращает 9. return отдаёт значение, поэтому его можно сложить: 4 + 9 = 13."
    },
    {
      id: "l1_fn_p2",
      type: "predict",
      title: "Что лежит в переменной после print",
      explanation: [
        "Посмотри на код функции g(x) и вывод переменной y. Обрати внимание на каждую строку вывода."
      ],
      code: 'def g(x):\n    print(x * 2)\n\ny = g(4)\nprint(y)',
      expectedOutput: "8\nNone",
      explain: "Функция g печатает 8, но ничего не возвращает. Поэтому в y лежит None, и вторая строка вывода: None."
    },
    {
      id: "l1_fn_c1",
      type: "code",
      tier: "warmup",
      title: "Функция double с return",
      explanation: [
        "Функция должна вернуть удвоенное число в программу с помощью return, а не печатать его."
      ],
      assignment: "Напиши функцию double(x), которая возвращает число x, умноженное на 2 (через return, не print). Затем выведи print(double(7)) и print(double(double(3))).",
      starterCode: "# Напиши функцию double и выведи два результата\n",
      astRequirements: {
        require_def: true,
        require_return: true
      },
      tests: [
        { call: "double(7)", returns: 14 },
        { call: "double(0)", returns: 0 },
        { call: "double(-2)", returns: -4 },
        { call: "double(2.5)", returns: 5.0, hidden: true }
      ],
      hints: [
        "Объяви функцию def double(x): и верни x * 2 с помощью return.",
        { code: "def double(x):\n    return x * ___\n\nprint(double(7))\nprint(double(double(3)))" },
        { code: "def double(x):\n    return x * 2\n\nprint(double(7))\nprint(double(double(3)))" }
      ],
      improveTip: "Результат работы функции с return можно сразу передавать аргументом в другой вызов этой же функции.",
      successMessage: "Функция double успешно возвращает результат через return!"
    },
    {
      id: "l1_fn_f1",
      type: "code",
      tier: "warmup",
      kind: "fix",
      title: "Найди ошибку: print вместо return",
      explanation: [
        "Функция triple печатает результат вместо возврата. Из-за этого сложение triple(5) + triple(2) падает с ошибкой TypeError."
      ],
      assignment: "Программа падает с ошибкой TypeError. Исправь функцию triple так, чтобы программа вывела ровно одну строку: 21.",
      starterCode: 'def triple(x):\n    print(x * 3)\n\nprint(triple(5) + triple(2))\n',
      astRequirements: {
        require_def: true,
        require_return: true
      },
      expectedOutput: "21",
      tests: [
        { call: "triple(5)", returns: 15 },
        { call: "triple(0)", returns: 0 },
        { call: "triple(-1)", returns: -3, hidden: true }
      ],
      hints: [
        "Замени print внутри функции triple на return, чтобы функция отдавала число наружу.",
        { code: "def triple(x):\n    return x * ___\n\nprint(triple(5) + triple(2))" },
        { code: "def triple(x):\n    return x * 3\n\nprint(triple(5) + triple(2))" }
      ],
      improveTip: "Если убрать print внутри triple, на экране останется только итоговая сумма.",
      successMessage: "Ошибка исправлена: теперь значения складываются через return!"
    },
    {
      id: "l1_fn_c2",
      type: "code",
      tier: "warmup",
      title: "Функция draw_line",
      explanation: [
        "В Python строку можно умножить на число: \"*\" * 5 даст строку из 5 звёздочек \"*****\"."
      ],
      assignment: "Напиши функцию draw_line(n), которая печатает строку из n звёздочек (*). Например, draw_line(5) печатает *****. Вызови её с числами 5 и 12.",
      starterCode: "# Напиши функцию draw_line(n)\n",
      astRequirements: {
        require_def: true
      },
      tests: [
        { call: "draw_line(5)", stdout: "*****" },
        { call: "draw_line(1)", stdout: "*" },
        { call: "draw_line(12)", stdout: "************", hidden: true },
        { call: "draw_line(0)", stdout: "", hidden: true }
      ],
      hints: [
        "Функция должна печатать символы через print, умножая звёздочку на переданное число n.",
        { code: "def draw_line(n):\n    print(\"*\" * ___)\n\ndraw_line(5)\ndraw_line(12)" },
        { code: "def draw_line(n):\n    print(\"*\" * n)\n\ndraw_line(5)\ndraw_line(12)" }
      ],
      successMessage: "Функция draw_line печатает линии заданной длины!"
    },
    {
      id: "l1_fn_c3",
      type: "code",
      tier: "main",
      title: "Функция is_even",
      explanation: [
        "Остаток от деления на 2 проверяется оператором %. Число чётно, если n % 2 == 0. Результат этого сравнения равен True или False."
      ],
      assignment: "Напиши функцию is_even(n), которая возвращает True, если число чётное, и False, если нечётное. Проверь её на числах 4, 7 и 0.",
      starterCode: "# Напиши функцию is_even(n)\n",
      astRequirements: {
        require_def: true,
        require_return: true
      },
      tests: [
        { call: "is_even(4)", returns: true },
        { call: "is_even(7)", returns: false },
        { call: "is_even(0)", returns: true },
        { call: "is_even(-3)", returns: false, hidden: true }
      ],
      hints: [
        "Используй проверку n % 2 == 0. Можно вернуть само логическое выражение без if/else.",
        { code: "def is_even(n):\n    return n % 2 == ___\n\nprint(is_even(4))\nprint(is_even(7))\nprint(is_even(0))" },
        { code: "def is_even(n):\n    return n % 2 == 0\n\nprint(is_even(4))\nprint(is_even(7))\nprint(is_even(0))" }
      ],
      improveTip: "Выражение n % 2 == 0 само по себе даёт True или False, поэтому конструкция if/else здесь не обязательна.",
      successMessage: "Функция is_even возвращает логическое значение!"
    },
    {
      id: "l1_fn_c4",
      type: "code",
      tier: "main",
      title: "Функция max_of_two без max()",
      explanation: [
        "Сравни два числа с помощью условного оператора if и верни большее. Встроенными max() и min() пользоваться нельзя."
      ],
      assignment: "Напиши функцию max_of_two(a, b), которая возвращает большее из двух чисел. Готовыми функциями max() и min() пользоваться нельзя, используй if.",
      starterCode: "# Напиши функцию max_of_two(a, b) без max()\n",
      astRequirements: {
        require_def: true,
        require_return: true,
        require_if: true,
        forbid_calls: ["max", "min", "sorted"]
      },
      tests: [
        { call: "max_of_two(3, 5)", returns: 5 },
        { call: "max_of_two(9, 2)", returns: 9 },
        { call: "max_of_two(4, 4)", returns: 4 },
        { call: "max_of_two(-1, -5)", returns: -1, hidden: true }
      ],
      hints: [
        "Сравни a > b: если условие истинно, верни a, иначе верни b.",
        { code: "def max_of_two(a, b):\n    if a > b:\n        return ___\n    return ___" },
        { code: "def max_of_two(a, b):\n    if a > b:\n        return a\n    return b\n\nprint(max_of_two(3, 5))" }
      ],
      successMessage: "Поиск максимума через условия работает без встроенных функций!"
    },
    {
      id: "l1_fn_t4",
      type: "theory",
      title: "Значения по умолчанию и локальные переменные",
      blocks: [
        {
          type: "p",
          html: "Параметрам функции можно задать значения по умолчанию. Если аргумент не указан при вызове, подставится стандартное значение:"
        },
        {
          type: "code",
          code: 'def greet(name, prefix="Привет"):\n    print(f"{prefix}, {name}!")\n\ngreet("Алиса")              # Привет, Алиса!\ngreet("Борис", "Здравствуй") # Здравствуй, Борис!',
          output: "Привет, Алиса!\nЗдравствуй, Борис!"
        },
        {
          type: "p",
          html: "Параметры со значениями по умолчанию всегда объявляются <b>после</b> обязательных параметров."
        },
        {
          type: "note",
          html: "Переменные, созданные внутри функции, являются <b>локальными</b>. Они существуют только во время работы функции и снаружи не видны. Чтобы передать значение наружу, используй <code>return</code>."
        }
      ]
    },
    {
      id: "l1_fn_q3",
      type: "quiz",
      title: "Локальная переменная",
      question: "Что произойдёт при запуске этого кода?",
      code: 'def calc():\n    total = 10\n\ncalc()\nprint(total)',
      options: [
        "Выведется 10",
        "Выведется None",
        "Будет NameError",
        "Выведется 0"
      ],
      correct: 2,
      explain: "Переменная total создана внутри функции и снаружи не видна. Чтобы получить значение, функция должна вернуть его через return."
    },
    {
      id: "l1_fn_c5",
      type: "code",
      tier: "main",
      title: "Функция rectangle со значением по умолчанию",
      explanation: [
        "Параметр symbol=\"#\" имеет значение по умолчанию. Если третий аргумент не передан, используется решётка."
      ],
      assignment: "Напиши функцию rectangle(w, h, symbol=\"#\"), которая печатает прямоугольник: h строк, в каждой w символов symbol. Если symbol не передан, используется #. Вызови rectangle(5, 3) и rectangle(4, 2, \"@\").",
      starterCode: '# Напиши функцию rectangle(w, h, symbol="#")\n',
      astRequirements: {
        require_def: true
      },
      tests: [
        { call: "rectangle(5, 3)", stdout: "#####\n#####\n#####" },
        { call: 'rectangle(4, 2, "@")', stdout: "@@@@\n@@@@" },
        { call: "rectangle(1, 1)", stdout: "#" },
        { call: 'rectangle(3, 1, "*")', stdout: "***", hidden: true }
      ],
      hints: [
        "Используй цикл for _ in range(h) и внутри печатай symbol * w.",
        { code: "def rectangle(w, h, symbol=\"#\"):\n    for _ in range(h):\n        print(___ * w)\n\nrectangle(5, 3)\nrectangle(4, 2, \"@\")" },
        { code: "def rectangle(w, h, symbol=\"#\"):\n    for _ in range(h):\n        print(symbol * w)\n\nrectangle(5, 3)\nrectangle(4, 2, \"@\")" }
      ],
      successMessage: "Функция rectangle успешно использует значение по умолчанию!"
    },
    {
      id: "l1_fn_c6",
      type: "code",
      tier: "main",
      title: "Функция count_vowels",
      explanation: [
        "Чтобы регистр букв не влиял на подсчёт, строку можно привести к нижнему регистру методом .lower()."
      ],
      assignment: "Напиши функцию count_vowels(text), которая возвращает количество гласных русских букв в строке (а е ё и о у ы э ю я), независимо от регистра. Проверь на слове «программирование».",
      starterCode: "# Напиши функцию count_vowels(text)\n",
      astRequirements: {
        require_def: true,
        require_return: true
      },
      tests: [
        { call: 'count_vowels("программирование")', returns: 7 },
        { call: 'count_vowels("")', returns: 0 },
        { call: 'count_vowels("Привет")', returns: 2 },
        { call: 'count_vowels("ЁЛКА")', returns: 2, hidden: true },
        { call: 'count_vowels("ПРОГРАММА")', returns: 3, hidden: true }
      ],
      hints: [
        "Создай счётчик count = 0, пройди циклом for ch in text.lower() и проверяй if ch in \"аеёиоуыэюя\": count += 1.",
        { code: "def count_vowels(text):\n    count = 0\n    for ch in text.lower():\n        if ch in \"аеёиоуыэюя\":\n            count += ___\n    return count" },
        { code: "def count_vowels(text):\n    count = 0\n    for ch in text.lower():\n        if ch in \"аеёиоуыэюя\":\n            count += 1\n    return count\n\nprint(count_vowels(\"программирование\"))" }
      ],
      improveTip: "Не забудь про букву «ё» — в русском языке она тоже гласная.",
      successMessage: "Функция count_vowels точно подсчитывает гласные любого регистра!"
    },
    {
      id: "l1_fn_q4",
      type: "quiz",
      title: "Почему ошибка",
      question: "Почему этот код выдаст ошибку?",
      code: 'def hello():\nprint("Привет")',
      options: [
        "Нет двоеточия после def",
        "Строка внутри функции без отступа (IndentationError)",
        "Имя hello занято",
        "print нельзя использовать внутри функции"
      ],
      correct: 1,
      explain: "Тело функции пишется с отступом в 4 пробела. Без отступа Python выдаёт IndentationError."
    },
    {
      id: "l1_fn_c7",
      type: "code",
      tier: "star",
      optional: true,
      title: "Функция triangle через draw_line",
      explanation: [
        "Одна функция может вызывать другую функцию для решения подзадачи."
      ],
      assignment: "Функция draw_line(n) уже написана выше. Напиши функцию triangle(n), которая печатает «лесенку» из n строк: в первой одна звёздочка, во второй две и так далее. Используй draw_line. Для triangle(4) должно получиться:\n*\n**\n***\n****",
      starterCode: 'def draw_line(n):\n    print("*" * n)\n\n# Напиши функцию triangle(n), используя draw_line\n',
      astRequirements: {
        require_def: true,
        require_calls: ["draw_line"]
      },
      tests: [
        { call: "triangle(4)", stdout: "*\n**\n***\n****" },
        { call: "triangle(1)", stdout: "*" },
        { call: "triangle(3)", stdout: "*\n**\n***", hidden: true }
      ],
      hints: [
        "Запусти цикл for i in range(1, n + 1) и на каждом шаге вызывай draw_line(i).",
        { code: "def triangle(n):\n    for i in range(1, n + 1):\n        draw_line(___)\n\ntriangle(4)" },
        { code: "def draw_line(n):\n    print(\"*\" * n)\n\ndef triangle(n):\n    for i in range(1, n + 1):\n        draw_line(i)\n\ntriangle(4)" }
      ],
      successMessage: "Сложная фигура построена вызовом вспомогательной функции!"
    },
    {
      id: "l1_fn_c8",
      type: "code",
      tier: "star",
      optional: true,
      title: "Функция calc",
      explanation: [
        "Функция принимает два числа и знак операции. Не забудь обработать случай деления на ноль."
      ],
      assignment: 'Напиши функцию calc(a, b, op), где op — один из знаков "+", "-", "*", "/". Функция возвращает результат действия. При делении на ноль она возвращает строку "Делить на ноль нельзя".',
      starterCode: "# Напиши функцию calc(a, b, op)\n",
      astRequirements: {
        require_def: true,
        require_return: true
      },
      tests: [
        { call: 'calc(6, 3, "+")', returns: 9 },
        { call: 'calc(6, 3, "-")', returns: 3 },
        { call: 'calc(6, 3, "*")', returns: 18 },
        { call: 'calc(6, 3, "/")', returns: 2.0 },
        { call: 'calc(5, 0, "/")', returns: "Делить на ноль нельзя" },
        { call: 'calc(7, 2, "/")', returns: 3.5, hidden: true }
      ],
      hints: [
        'Используй последовательные проверки if op == "+": return a + b и т.д. Для деления проверь if b == 0: return "Делить на ноль нельзя".',
        { code: 'def calc(a, b, op):\n    if op == "+":\n        return a + b\n    if op == "-":\n        return a - b\n    if op == "*":\n        return a * b\n    if op == "/":\n        if b == 0:\n            return "Делить на ноль нельзя"\n        return a / b' },
        { code: 'def calc(a, b, op):\n    if op == "+":\n        return a + b\n    if op == "-":\n        return a - b\n    if op == "*":\n        return a * b\n    if op == "/":\n        if b == 0:\n            return "Делить на ноль нельзя"\n        return a / b' }
      ],
      successMessage: "Калькулятор с защитой от деления на ноль готов!"
    },
    {
      id: "l1_fn_t5",
      type: "theory",
      title: "Частые ошибки",
      blocks: [
        {
          type: "p",
          html: "Справочная таблица типичных затруднений при работе с функциями:"
        },
        {
          type: "table",
          head: ["Ошибка / Ситуация", "Причина", "Что делать"],
          rows: [
            ["<code>IndentationError</code>", "В теле функции нет отступа в 4 пробела", "Сдвинь строки внутри <code>def</code> на 4 пробела вправо"],
            ["<code>SyntaxError: expected ':'</code>", "Пропущено двоеточие в конце строки <code>def</code>", "Поставь <code>:</code> в конце строки объявления функции"],
            ["<code>TypeError: NoneType and int</code>", "Функция сделала <code>print</code> вместо <code>return</code>", "Замени <code>print</code> в функции на <code>return</code>"],
            ["<code>NameError: not defined</code>", "Имя не объявлено или создано внутри функции", "Проверь написание и верни переменную через <code>return</code>"],
            ["<code>TypeError: missing argument</code>", "Передано меньше аргументов, чем параметров", "Передай все обязательные аргументы в вызове"],
            ["Вывод пуст", "Функция определена через <code>def</code>, но не вызвана", "Добавь вызов функции по имени со скобками"]
          ]
        },
        {
          type: "note",
          html: "Если программа завершилась с ошибкой, всегда внимательно читай блок «Что это значит» рядом с окном консоли."
        }
      ]
    }
  ]
});
