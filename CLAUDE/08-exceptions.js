/**
 * Тема этапа 2: Исключения
 * try / except / else / finally, перехват конкретных типов ошибок
 * (ValueError, ZeroDivisionError, KeyError, IndexError), raise, чтение трейсбека.
 */

window.COURSE_TOPICS = window.COURSE_TOPICS || [];

window.COURSE_TOPICS.push({
  id: "l1_exceptions",
  title: "Исключения",
  minutes: 60,
  items: [
    /* ============ ОШИБКИ И ТРЕЙСБЕК ============ */
    {
      id: "l1_exc_t1",
      type: "theory",
      title: "Ошибки времени выполнения и трейсбек",
      blocks: [
        {
          type: "p",
          html: "Иногда программа с правильным синтаксисом падает уже во время работы: пользователь ввёл буквы вместо числа, в словаре нет нужного ключа, делитель оказался нулём. Такая ошибка называется <b>исключением</b>. Если ничего не предпринять, программа остановится и покажет <b>трейсбек</b> — отчёт о том, где и почему всё сломалось."
        },
        {
          type: "table",
          head: ["Тип ошибки", "Когда возникает", "Пример"],
          rows: [
            ["<code>ValueError</code>", "тип значения подходит, а содержание нет", "<code>int(\"abc\")</code>"],
            ["<code>ZeroDivisionError</code>", "деление на ноль", "<code>10 / 0</code>"],
            ["<code>KeyError</code>", "в словаре нет такого ключа", "<code>{\"a\": 1}[\"b\"]</code>"],
            ["<code>IndexError</code>", "индекс выходит за границы списка", "<code>[1, 2][5]</code>"],
            ["<code>TypeError</code>", "операция с неподходящим типом", "<code>\"5\" + 5</code>"]
          ]
        },
        {
          type: "p",
          html: "Трейсбек читают <b>снизу вверх</b>: самая важная строка находится в конце."
        },
        {
          type: "table",
          head: ["Строка отчёта", "Что означает"],
          rows: [
            ["<code>Traceback (most recent call last):</code>", "заголовок: ниже перечислены вызовы, которые привели к ошибке"],
            ["<code>File \"main.py\", line 4, in &lt;module&gt;</code>", "где произошло: файл, номер строки и функция (<code>&lt;module&gt;</code> значит верхний уровень программы)"],
            ["<code>print(10 / n)</code>", "строка кода, на которой остановилась программа"],
            ["<code>ZeroDivisionError: division by zero</code>", "тип ошибки и пояснение: эту строку читай первой"]
          ]
        },
        {
          type: "note",
          html: "Исключение и ошибка синтаксиса — разные вещи. Забытое двоеточие или опечатку в имени ты исправляешь в коде. Исключения, которые могут возникнуть из-за данных (ввод, отсутствующий ключ, ноль в делителе), ты предусматриваешь заранее: об этом вся тема."
        }
      ]
    },
    {
      id: "l1_exc_q1",
      type: "quiz",
      title: "Какая строка трейсбека главная",
      question: "Программа упала и показала трейсбек из четырёх строк (заголовок, место ошибки, строка кода, тип ошибки). С какой строки нужно начинать чтение, чтобы быстрее всего понять причину?",
      options: [
        "С заголовка «Traceback (most recent call last)»",
        "Со строки с названием файла и номером строки",
        "С последней строки, где написан тип ошибки",
        "Со строки кода, на которой остановилась программа"
      ],
      correct: 2,
      explain: "Последняя строка называет тип ошибки и коротко объясняет её, например «ZeroDivisionError: division by zero». Зная тип, ты уже понимаешь причину, а строки выше подскажут, где именно это произошло."
    },

    /* ============ TRY / EXCEPT ============ */
    {
      id: "l1_exc_t2",
      type: "theory",
      title: "Перехват ошибки: try и except",
      blocks: [
        {
          type: "p",
          html: "Блок <code>try</code> содержит код, который может упасть. Если в нём возникает ошибка нужного типа, Python пропускает остаток блока и выполняет код из <code>except</code>. Программа при этом не останавливается."
        },
        {
          type: "code",
          code: 'text = "abc"\ntry:\n    number = int(text)\n    print("Число:", number)\nexcept ValueError:\n    print("Это не число")\nprint("Программа продолжает работу")',
          output: "Это не число\nПрограмма продолжает работу"
        },
        {
          type: "p",
          html: "Строка <code>print(\"Число:\", number)</code> не выполнилась: ошибка случилась на предыдущей строке, и Python сразу перешёл к <code>except</code>. Чтобы получить текст ошибки, добавь <code>as</code> и имя переменной."
        },
        {
          type: "code",
          code: 'try:\n    print(10 / 0)\nexcept ZeroDivisionError as e:\n    print("Ошибка:", e)',
          output: "Ошибка: division by zero"
        },
        {
          type: "p",
          html: "Блоков <code>except</code> может быть несколько: для каждого типа ошибки своя реакция. Python проверяет их сверху вниз и выполняет только первый подходящий."
        },
        {
          type: "code",
          code: 'data = {"a": [1, 2]}\ntry:\n    print(data["b"][0])\nexcept KeyError:\n    print("нет такого ключа")\nexcept IndexError:\n    print("нет такого индекса")',
          output: "нет такого ключа"
        },
        {
          type: "list",
          items: [
            "Если реакция на несколько типов одинакова, перечисли их в скобках: <code>except (ValueError, TypeError):</code>.",
            "Если ошибка в <code>try</code> не совпала ни с одним типом из <code>except</code>, она не перехватывается, и программа падает как обычно.",
            "Общий тип <code>Exception</code> перехватывает почти любую ошибку, поэтому его ставят в самый конец, после конкретных типов."
          ]
        },
        {
          type: "note",
          html: "Не пиши <code>except:</code> без указания типа. Такая запись заглушит любую ошибку, включая опечатку в имени переменной, и ты не узнаешь настоящую причину сбоя. Перехватывай только те типы, которые действительно ожидаешь."
        }
      ]
    },
    {
      id: "l1_exc_q2",
      type: "quiz",
      title: "Почему плох голый except",
      question: "Почему не стоит писать except: без указания типа ошибки?",
      options: [
        "Такая запись вызывает SyntaxError",
        "Она перехватывает вообще любые ошибки, в том числе опечатки в коде, и прячет настоящую причину",
        "Она работает только с ошибкой ValueError",
        "Она замедляет программу в два раза"
      ],
      correct: 1,
      explain: "Запись except: допустима, но слишком широка. Если в try попадёт опечатка вроде printt(x), ошибка NameError будет молча проглочена, и найти баг станет трудно. Ловить нужно конкретные типы, которых ты ждёшь."
    },
    {
      id: "l1_exc_p1",
      type: "predict",
      title: "Какой except сработает",
      explanation: [
        "Определи, что выведется в консоли. Каждый вызов print печатает одну строку. Проверь, какая ошибка возникает на каждом шаге цикла."
      ],
      code: 'data = {"a": [1, 2]}\n\nfor key, idx in [("a", 1), ("a", 5), ("b", 0)]:\n    try:\n        print(data[key][idx])\n    except KeyError:\n        print("key")\n    except IndexError:\n        print("index")',
      expectedOutput: "2\nindex\nkey",
      explain: "Для пары (\"a\", 1) ошибки нет, выводится элемент 2. Для (\"a\", 5) ключ найден, но индекс 5 выходит за границы списка, срабатывает IndexError. Для (\"b\", 0) ключа нет, срабатывает KeyError."
    },
    {
      id: "l1_exc_f1",
      type: "code",
      tier: "warmup",
      kind: "fix",
      title: "Найди ошибку: не тот тип в except",
      explanation: [
        "Функция должна справляться с нечисловой строкой, но при вызове to_number(\"abc\") программа падает. Посмотри на последнюю строку трейсбека: она называет тип ошибки, которая возникает на самом деле."
      ],
      assignment: "Функция to_number(text) должна превращать строку в целое число, а если строка не является числом, возвращать 0. Сейчас to_number(\"abc\") завершается ошибкой. Исправь функцию: менять нужно одно слово.",
      starterCode: 'def to_number(text):\n    try:\n        return int(text)\n    except ZeroDivisionError:\n        return 0\n',
      tests: [
        { call: 'to_number("12")', returns: 12 },
        { call: 'to_number("abc")', returns: 0 },
        { call: 'to_number("")', returns: 0, hidden: true },
        { call: 'to_number("-7")', returns: -7, hidden: true }
      ],
      hints: [
        "Попробуй выполнить int(\"abc\") и посмотри, какой тип ошибки назван в последней строке трейсбека. Именно этот тип должен стоять после except.",
        { code: 'def to_number(text):\n    try:\n        return int(text)\n    except ___:\n        return 0' },
        { code: 'def to_number(text):\n    try:\n        return int(text)\n    except ValueError:\n        return 0\n\nprint(to_number("abc"))' }
      ],
      successMessage: "Ошибка исправлена: тип в except совпадает с тем, что реально возникает."
    },
    {
      id: "l1_exc_c1",
      type: "code",
      tier: "main",
      title: "Функция safe_int",
      explanation: [
        "Любая строка может оказаться не числом. Вместо предварительных проверок можно просто попробовать преобразовать её и перехватить ошибку."
      ],
      assignment: "Напиши функцию safe_int(text, default=0), которая пытается превратить строку text в целое число через int() и возвращает его. Если строка не является целым числом, функция возвращает default. Например, safe_int(\"42\") возвращает 42, а safe_int(\"3.5\", -1) возвращает -1. Использовать isdigit и isnumeric нельзя: перехватывай ошибку.",
      starterCode: "# Напиши функцию safe_int(text, default=0) через try / except\n",
      astRequirements: {
        require_def: true,
        require_return: true,
        require_try: true,
        forbid_methods: ["isdigit", "isnumeric"]
      },
      tests: [
        { call: 'safe_int("42")', returns: 42 },
        { call: 'safe_int("abc")', returns: 0 },
        { call: 'safe_int("3.5", -1)', returns: -1 },
        { call: 'safe_int("")', returns: 0 },
        { call: 'safe_int(" 7 ")', returns: 7, hidden: true },
        { call: 'safe_int("-5")', returns: -5, hidden: true }
      ],
      hints: [
        "Внутри try выполни int(text) и верни результат. В блоке except ValueError верни значение default.",
        { code: 'def safe_int(text, default=0):\n    try:\n        return int(text)\n    except ___:\n        return default' },
        { code: 'def safe_int(text, default=0):\n    try:\n        return int(text)\n    except ValueError:\n        return default\n\nprint(safe_int("42"), safe_int("abc"))' }
      ],
      improveTip: "Проверка text.isdigit() не подошла бы: она считает строку «-5» не числом. Перехват ошибки проще и надёжнее.",
      successMessage: "Функция safe_int безопасно превращает строку в число."
    },
    {
      id: "l1_exc_c2",
      type: "code",
      tier: "main",
      title: "Функция safe_divide",
      explanation: [
        "Деление на ноль возникает из-за данных, поэтому его удобно предусмотреть через ZeroDivisionError."
      ],
      assignment: "Напиши функцию safe_divide(a, b), которая возвращает результат деления a / b. Если b равно нулю, функция возвращает None. Реши задачу через try / except ZeroDivisionError. Например, safe_divide(10, 4) возвращает 2.5.",
      starterCode: "# Напиши функцию safe_divide(a, b) через try / except\n",
      astRequirements: {
        require_def: true,
        require_return: true,
        require_try: true
      },
      tests: [
        { call: 'safe_divide(10, 4)', returns: 2.5 },
        { call: 'str(safe_divide(1, 0))', returns: "None" },
        { call: 'safe_divide(0, 5)', returns: 0 },
        { call: 'safe_divide(-9, 3)', returns: -3, hidden: true },
        { call: 'str(safe_divide(0, 0))', returns: "None", hidden: true }
      ],
      hints: [
        "В try верни результат деления a на b. В блоке except ZeroDivisionError верни None.",
        { code: 'def safe_divide(a, b):\n    try:\n        return a / b\n    except ___:\n        return None' },
        { code: 'def safe_divide(a, b):\n    try:\n        return a / b\n    except ZeroDivisionError:\n        return None\n\nprint(safe_divide(10, 4), safe_divide(1, 0))' }
      ],
      successMessage: "Деление на ноль перехвачено, функция возвращает None."
    },
    {
      id: "l1_exc_c3",
      type: "code",
      tier: "main",
      title: "Функция read_value",
      explanation: [
        "Здесь возможны две разные ошибки, и на каждую нужна своя реакция. Для этого понадобятся два блока except."
      ],
      assignment: "Напиши функцию read_value(data, key, index), где data — словарь, значения которого — списки. Функция возвращает data[key][index]. Если ключа нет, верни строку \"нет ключа\", а если в списке нет элемента с таким индексом, верни строку \"нет элемента\". Например, read_value({\"a\": [1, 2]}, \"a\", 1) возвращает 2.",
      starterCode: "# Напиши функцию read_value(data, key, index) с двумя блоками except\n",
      astRequirements: {
        require_def: true,
        require_return: true,
        require_try: true
      },
      tests: [
        { call: 'read_value({"a": [1, 2]}, "a", 1)', returns: 2 },
        { call: 'read_value({"a": [1]}, "b", 0)', returns: "нет ключа" },
        { call: 'read_value({"a": [1]}, "a", 5)', returns: "нет элемента" },
        { call: 'read_value({"a": []}, "a", 0)', returns: "нет элемента", hidden: true },
        { call: 'read_value({}, "x", 0)', returns: "нет ключа", hidden: true }
      ],
      hints: [
        "В try верни data[key][index]. Отсутствующий ключ вызывает KeyError, индекс за границами списка вызывает IndexError: для каждого типа сделай свой блок except со своим сообщением.",
        { code: 'def read_value(data, key, index):\n    try:\n        return data[key][index]\n    except KeyError:\n        return "нет ключа"\n    except ___:\n        return "нет элемента"' },
        { code: 'def read_value(data, key, index):\n    try:\n        return data[key][index]\n    except KeyError:\n        return "нет ключа"\n    except IndexError:\n        return "нет элемента"\n\nprint(read_value({"a": [1, 2]}, "a", 1))' }
      ],
      successMessage: "Обе ошибки перехвачены отдельно, каждая со своим сообщением."
    },

    /* ============ ELSE И FINALLY ============ */
    {
      id: "l1_exc_t3",
      type: "theory",
      title: "Блоки else и finally",
      blocks: [
        {
          type: "p",
          html: "К <code>try / except</code> можно добавить ещё два необязательных блока. Блок <code>else</code> выполняется, только если в <code>try</code> ошибки <b>не было</b>. Блок <code>finally</code> выполняется <b>всегда</b>: и после успеха, и после перехваченной ошибки."
        },
        {
          type: "code",
          code: 'def parse(text):\n    try:\n        n = int(text)\n    except ValueError:\n        print("ошибка")\n    else:\n        print("ok", n)\n    finally:\n        print("готово")\n\nparse("5")\nparse("x")',
          output: "ok 5\nготово\nошибка\nготово"
        },
        {
          type: "list",
          items: [
            "В <code>else</code> удобно класть код, который нужно выполнить только после успешного <code>try</code>. Так в <code>try</code> остаются лишь строки, которые действительно могут упасть.",
            "В <code>finally</code> помещают действия, которые нужны при любом исходе: например, закрыть ресурс или записать итог в журнал.",
            "Блок <code>finally</code> выполняется даже тогда, когда в <code>try</code> стоит <code>return</code>: сначала отработает <code>finally</code>, а потом функция вернёт значение."
          ]
        },
        {
          type: "note",
          html: "Порядок блоков всегда один: <code>try</code>, затем один или несколько <code>except</code>, затем <code>else</code>, затем <code>finally</code>."
        }
      ]
    },
    {
      id: "l1_exc_q3",
      type: "quiz",
      title: "Когда выполняется else",
      question: "Что выведется при запуске этого кода?",
      code: 'try:\n    x = int("12")\nexcept ValueError:\n    print("ошибка")\nelse:\n    print("успех")',
      options: [
        "ошибка",
        "успех",
        "ошибка и затем успех",
        "Ничего не выведется"
      ],
      correct: 1,
      explain: "Строка \"12\" спокойно превращается в число, ошибки нет, поэтому блок except пропускается, а блок else выполняется."
    },
    {
      id: "l1_exc_p2",
      type: "predict",
      title: "Порядок try, except, else и finally",
      explanation: [
        "Определи, что выведется в консоли при двух вызовах функции. Каждый вызов print печатает одну строку."
      ],
      code: 'def f(x):\n    try:\n        print("A")\n        result = 10 / x\n        print("B")\n    except ZeroDivisionError:\n        print("C")\n    else:\n        print("D")\n    finally:\n        print("E")\n\nf(2)\nf(0)',
      expectedOutput: "A\nB\nD\nE\nA\nC\nE",
      explain: "Вызов f(2) проходит без ошибок: выводятся A и B, затем else печатает D, а finally печатает E. В вызове f(0) после A возникает ZeroDivisionError, строка B пропускается, срабатывает except (C), else пропускается, а finally всё равно печатает E."
    },
    {
      id: "l1_exc_p3",
      type: "predict",
      title: "finally и return",
      explanation: [
        "Определи, что выведется в консоли. Обрати внимание на то, что происходит раньше: вывод внутри функции или возврат значения."
      ],
      code: 'def g():\n    try:\n        return "try"\n    finally:\n        print("finally")\n\nprint(g())',
      expectedOutput: "finally\ntry",
      explain: "Перед тем как функция вернёт значение, Python обязан выполнить finally. Поэтому сначала печатается «finally», а затем print(g()) выводит возвращённое значение «try»."
    },
    {
      id: "l1_exc_c4",
      type: "code",
      tier: "main",
      title: "Функция sum_valid",
      explanation: [
        "Блок try можно поместить внутрь цикла: тогда ошибка в одном элементе не остановит обработку остальных."
      ],
      assignment: "Напиши функцию sum_valid(items), которая принимает список строк и возвращает сумму тех из них, которые можно превратить в целое число через int(). Строки, которые числами не являются, пропускай. Для пустого списка верни 0. Например, sum_valid([\"1\", \"2\", \"x\", \"4\"]) возвращает 7.",
      starterCode: "# Напиши функцию sum_valid(items): try внутри цикла\n",
      astRequirements: {
        require_def: true,
        require_return: true,
        require_for: true,
        require_try: true
      },
      tests: [
        { call: 'sum_valid(["1", "2", "x", "4"])', returns: 7 },
        { call: 'sum_valid([])', returns: 0 },
        { call: 'sum_valid(["a", "b"])', returns: 0 },
        { call: 'sum_valid(["10", "-3", "3.5", ""])', returns: 7, hidden: true },
        { call: 'sum_valid(["5"])', returns: 5, hidden: true }
      ],
      hints: [
        "Заведи переменную total со значением 0. Для каждой строки в цикле выполни в try прибавление int(item) к total. Если возникает ValueError, перейди к следующей строке оператором continue. В конце верни total.",
        { code: 'def sum_valid(items):\n    total = 0\n    for item in items:\n        try:\n            total += int(item)\n        except ___:\n            continue\n    return total' },
        { code: 'def sum_valid(items):\n    total = 0\n    for item in items:\n        try:\n            total += int(item)\n        except ValueError:\n            continue\n    return total\n\nprint(sum_valid(["1", "2", "x", "4"]))' }
      ],
      improveTip: "Строки вроде «3.5» и пустая строка тоже вызывают ValueError и пропускаются, поэтому отдельная проверка не нужна.",
      successMessage: "Ошибки в отдельных элементах не мешают обработать остальные."
    },

    /* ============ RAISE ============ */
    {
      id: "l1_exc_t4",
      type: "theory",
      title: "Создать ошибку самому: raise",
      blocks: [
        {
          type: "p",
          html: "Ошибки не только перехватывают, но и создают. Оператор <code>raise</code> останавливает выполнение функции и сообщает вызывающему коду, что данные неподходящие. После типа ошибки в скобках указывают понятное сообщение."
        },
        {
          type: "code",
          code: 'def set_age(age):\n    if age < 0:\n        raise ValueError("возраст не может быть отрицательным")\n    return age\n\ntry:\n    set_age(-5)\nexcept ValueError as e:\n    print(e)',
          output: "возраст не может быть отрицательным"
        },
        {
          type: "p",
          html: "Так функция разделяет обязанности: она проверяет данные и сообщает о проблеме, а решать, что делать с ошибкой (показать сообщение, взять значение по умолчанию, завершить программу), будет тот, кто её вызывает."
        },
        {
          type: "list",
          items: [
            "Выбирай тип ошибки по смыслу: <code>ValueError</code> — значение неподходящее, <code>TypeError</code> — неподходящий тип, <code>KeyError</code> — нет ключа.",
            "В сообщении пиши, что именно не так, и по возможности, какое значение пришло.",
            "Если <code>raise</code> нигде не перехвачен, программа остановится с трейсбеком, в последней строке которого будет твоя ошибка и твоё сообщение."
          ]
        },
        {
          type: "note",
          html: "После <code>raise</code> остаток функции не выполняется — точно так же, как после <code>return</code>. Поэтому <code>else</code> после проверки с <code>raise</code> обычно не нужен."
        }
      ]
    },
    {
      id: "l1_exc_c5",
      type: "code",
      tier: "main",
      title: "Функции validate_age и is_valid_age",
      explanation: [
        "Одна функция проверяет данные и выбрасывает ошибку, другая использует её и превращает ошибку в простой ответ «да» или «нет»."
      ],
      assignment: "Напиши две функции. Функция validate_age(age) возвращает age, если возраст находится в пределах от 0 до 150 включительно, иначе выбрасывает ValueError через raise с любым сообщением. Функция is_valid_age(age) вызывает validate_age внутри try и возвращает True, если ошибки не было, и False, если возникла ValueError. Например, is_valid_age(30) возвращает True, а is_valid_age(-1) возвращает False.",
      starterCode: "# Напиши validate_age(age), которая выбрасывает ValueError,\n# и is_valid_age(age), которая её перехватывает\n",
      astRequirements: {
        require_def: true,
        require_return: true,
        require_try: true,
        require_raise: true,
        require_calls: ["validate_age"]
      },
      tests: [
        { call: 'validate_age(25)', returns: 25 },
        { call: 'is_valid_age(30)', returns: true },
        { call: 'is_valid_age(-1)', returns: false },
        { call: 'is_valid_age(200)', returns: false },
        { call: 'is_valid_age(0)', returns: true, hidden: true },
        { call: 'is_valid_age(150)', returns: true, hidden: true },
        { call: 'is_valid_age(151)', returns: false, hidden: true }
      ],
      hints: [
        "В validate_age проверь выход за границы условием и выбрось ValueError через raise, иначе верни age. В is_valid_age вызови validate_age внутри try: если ошибки нет, верни True, а в блоке except ValueError верни False.",
        { code: 'def validate_age(age):\n    if age < 0 or age > 150:\n        raise ___("Недопустимый возраст")\n    return age\n\ndef is_valid_age(age):\n    try:\n        validate_age(age)\n    except ValueError:\n        return False\n    return True' },
        { code: 'def validate_age(age):\n    if age < 0 or age > 150:\n        raise ValueError("Недопустимый возраст")\n    return age\n\ndef is_valid_age(age):\n    try:\n        validate_age(age)\n    except ValueError:\n        return False\n    return True\n\nprint(is_valid_age(30), is_valid_age(-1))' }
      ],
      improveTip: "В сообщение удобно добавить само значение, например f\"Недопустимый возраст: {age}\": так по трейсбеку сразу видно, что пришло в функцию.",
      successMessage: "Функция проверяет данные через raise, а вызывающий код превращает ошибку в простой ответ."
    },
    {
      id: "l1_exc_f2",
      type: "code",
      tier: "main",
      kind: "fix",
      title: "Найди ошибку: порядок блоков except",
      explanation: [
        "Функция всегда отвечает «ошибка», даже когда ключа просто нет в словаре. Вспомни, что Python выбирает первый подходящий блок except сверху вниз, а Exception подходит почти к любой ошибке."
      ],
      assignment: "Функция describe(data, key) возвращает data[key]. Если ключа нет в словаре, она должна вернуть \"нет ключа\", а при любой другой ошибке (например, когда data вообще не словарь) вернуть \"ошибка\". Сейчас отсутствующий ключ тоже даёт «ошибка». Исправь функцию, не добавляя новых строк.",
      starterCode: 'def describe(data, key):\n    try:\n        return data[key]\n    except Exception:\n        return "ошибка"\n    except KeyError:\n        return "нет ключа"\n',
      tests: [
        { call: 'describe({"a": 1}, "a")', returns: 1 },
        { call: 'describe({"a": 1}, "b")', returns: "нет ключа" },
        { call: 'describe(None, "a")', returns: "ошибка" },
        { call: 'describe({}, 5)', returns: "нет ключа", hidden: true },
        { call: 'describe(7, "x")', returns: "ошибка", hidden: true }
      ],
      hints: [
        "Python проверяет блоки except сверху вниз и выполняет первый подходящий. KeyError — частный случай Exception, поэтому первый блок перехватывает и его. Конкретный тип нужно поставить раньше общего.",
        { code: 'def describe(data, key):\n    try:\n        return data[key]\n    except ___:\n        return "нет ключа"\n    except Exception:\n        return "ошибка"' },
        { code: 'def describe(data, key):\n    try:\n        return data[key]\n    except KeyError:\n        return "нет ключа"\n    except Exception:\n        return "ошибка"\n\nprint(describe({"a": 1}, "b"))' }
      ],
      successMessage: "Ошибка исправлена: конкретный тип стоит раньше общего Exception."
    },

    /* ============ ИТОГИ ============ */
    {
      id: "l1_exc_t5",
      type: "theory",
      title: "Как пользоваться исключениями и итоги",
      blocks: [
        {
          type: "p",
          html: "Предусмотреть ошибку можно двумя способами: проверить данные заранее через <code>if</code> или выполнить действие и перехватить ошибку. Для данных, которые могут оказаться любыми (ввод, файл, ответ сервера), второй способ чаще проще и надёжнее."
        },
        {
          type: "code",
          code: 'def safe_div(a, b):\n    try:\n        return a / b\n    except ZeroDivisionError:\n        return None\n\nprint(safe_div(6, 3), safe_div(1, 0))',
          output: "2.0 None"
        },
        {
          type: "list",
          items: [
            "Перехватывай <b>конкретные</b> типы ошибок, которые реально ожидаешь. Широкий <code>Exception</code> оставляй только для крайних случаев, и ставь его последним.",
            "Держи блок <code>try</code> <b>узким</b>: в нём должны быть только строки, которые могут упасть. Плохо, когда в <code>try</code> лежит вся программа. Хорошо, когда там одна строка с <code>int(text)</code>.",
            "Не проглатывай ошибку молча: либо верни понятное значение, либо покажи сообщение.",
            "Опечатки и ошибки в логике (<code>NameError</code>, неверные индексы по твоей вине) не перехватывают, их исправляют в коде."
          ]
        },
        {
          type: "note",
          html: "Когда программа упала, читай трейсбек с конца: тип ошибки в последней строке чаще всего сразу указывает на причину."
        },
        {
          type: "p",
          html: "<b>Шпаргалка по теме</b>"
        },
        {
          type: "table",
          head: ["Что нужно", "Как"],
          rows: [
            ["Перехватить конкретную ошибку", "<code>except ValueError:</code>"],
            ["Получить текст ошибки", "<code>except ValueError as e:</code>"],
            ["Одна реакция на несколько типов", "<code>except (ValueError, TypeError):</code>"],
            ["Выполнить код только при отсутствии ошибки", "блок <code>else:</code>"],
            ["Выполнить код при любом исходе", "блок <code>finally:</code>"],
            ["Создать свою ошибку", "<code>raise ValueError(\"сообщение\")</code>"],
            ["Понять причину падения", "последняя строка трейсбека"]
          ]
        }
      ]
    },

    /* ============ ЗВЁЗДОЧКИ ============ */
    {
      id: "l1_exc_c6",
      type: "code",
      tier: "star",
      optional: true,
      title: "Функция parse_log",
      explanation: [
        "Задача на понимание порядка блоков: нужно записать в журнал, какие части конструкции выполнились и в каком порядке."
      ],
      assignment: "Напиши функцию parse_log(text), которая возвращает список шагов. Первым шагом всегда идёт \"start\". Затем функция пытается выполнить int(text): если получилось, в блоке else добавляется шаг \"ok\", если возникла ValueError, в блоке except добавляется шаг \"error\". Последним шагом всегда идёт \"done\", его нужно добавлять в блоке finally. Например, parse_log(\"5\") возвращает ['start', 'ok', 'done'], а parse_log(\"x\") возвращает ['start', 'error', 'done'].",
      starterCode: "# Напиши функцию parse_log(text) с блоками try / except / else / finally\n",
      astRequirements: {
        require_def: true,
        require_return: true,
        require_try: true
      },
      tests: [
        { call: 'str(parse_log("5"))', returns: "['start', 'ok', 'done']" },
        { call: 'str(parse_log("x"))', returns: "['start', 'error', 'done']" },
        { call: 'str(parse_log(""))', returns: "['start', 'error', 'done']", hidden: true },
        { call: 'str(parse_log("-3"))', returns: "['start', 'ok', 'done']", hidden: true }
      ],
      hints: [
        "Заведи список steps со значением [\"start\"]. В try выполни int(text). В except ValueError добавь \"error\", в else добавь \"ok\", в finally добавь \"done\". После всей конструкции верни steps.",
        { code: 'def parse_log(text):\n    steps = ["start"]\n    try:\n        int(text)\n    except ValueError:\n        steps.append("error")\n    else:\n        steps.append("ok")\n    finally:\n        steps.append(___)\n    return steps' },
        { code: 'def parse_log(text):\n    steps = ["start"]\n    try:\n        int(text)\n    except ValueError:\n        steps.append("error")\n    else:\n        steps.append("ok")\n    finally:\n        steps.append("done")\n    return steps\n\nprint(parse_log("5"))' }
      ],
      successMessage: "Все четыре блока работают в нужном порядке."
    },
    {
      id: "l1_exc_c7",
      type: "code",
      tier: "star",
      optional: true,
      title: "Функция average_of_valid",
      explanation: [
        "Здесь придётся перехватывать ошибки дважды: при разборе каждой части строки и при делении на количество подошедших чисел."
      ],
      assignment: "Напиши функцию average_of_valid(text), которая принимает строку с числами через запятую, например \"4, x, 6\". Функция отбрасывает всё, что не является целым числом, и возвращает среднее арифметическое оставшихся. Если подходящих чисел нет, верни None. Пробелы вокруг частей допускаются. Использовать isdigit нельзя: перехватывай ошибки. Например, average_of_valid(\"4, x, 6\") возвращает 5.",
      starterCode: "# Напиши функцию average_of_valid(text)\n",
      astRequirements: {
        require_def: true,
        require_return: true,
        require_for: true,
        require_try: true,
        forbid_methods: ["isdigit", "isnumeric"]
      },
      tests: [
        { call: 'average_of_valid("1, 2, 3")', returns: 2 },
        { call: 'average_of_valid("4, x, 6")', returns: 5 },
        { call: 'str(average_of_valid("a, b"))', returns: "None" },
        { call: 'str(average_of_valid(""))', returns: "None" },
        { call: 'average_of_valid("10")', returns: 10, hidden: true },
        { call: 'average_of_valid("1,2,x,y,3")', returns: 2, hidden: true }
      ],
      hints: [
        "Раздели строку по запятым методом split. Для каждой части в try добавь int(part.strip()) в список, а при ValueError переходи к следующей. После цикла в отдельном try раздели сумму списка на его длину, а при ZeroDivisionError верни None.",
        { code: 'def average_of_valid(text):\n    numbers = []\n    for part in text.split(","):\n        try:\n            numbers.append(int(part.strip()))\n        except ValueError:\n            continue\n    try:\n        return sum(numbers) / len(numbers)\n    except ___:\n        return None' },
        { code: 'def average_of_valid(text):\n    numbers = []\n    for part in text.split(","):\n        try:\n            numbers.append(int(part.strip()))\n        except ValueError:\n            continue\n    try:\n        return sum(numbers) / len(numbers)\n    except ZeroDivisionError:\n        return None\n\nprint(average_of_valid("4, x, 6"))' }
      ],
      successMessage: "Оба вида ошибок перехвачены: неверные части пропущены, пустой набор не вызывает падения."
    }
  ]
});
