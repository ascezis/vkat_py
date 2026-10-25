/**
 * Заключительная тема: Чистый код и оформление
 * PEP 8, имена, структура функций, «ниндзя-код» и как его не писать,
 * комментарии и итоговый чек-лист.
 */

window.COURSE_TOPICS = window.COURSE_TOPICS || [];

window.COURSE_TOPICS.push({
  id: "l1_code_style",
  title: "Чистый код и оформление",
  minutes: 50,
  items: [
    /* ============ ОФОРМЛЕНИЕ: PEP 8 ============ */
    {
      id: "l1_sty_t1",
      type: "theory",
      title: "Зачем нужен стиль и что такое PEP 8",
      blocks: [
        {
          type: "p",
          html: "Код пишут один раз, а читают много: и другие люди, и ты сам через месяц. Программа с одинаковым результатом может читаться легко или мучительно. Чтобы код выглядел одинаково у разных людей, в Python есть общепринятый свод правил оформления — <b>PEP 8</b>."
        },
        {
          type: "code",
          code: 'def area(w,h):\n  return w*h\nprint(area(3,4))',
          output: "12"
        },
        {
          type: "p",
          html: "Та же программа, оформленная по правилам:"
        },
        {
          type: "code",
          code: 'def area(width, height):\n    return width * height\n\n\nprint(area(3, 4))',
          output: "12"
        },
        {
          type: "p",
          html: "Результат один, но второй вариант читается без усилий: понятны имена, видны границы функции, операторы не слипаются."
        },
        {
          type: "table",
          head: ["Правило", "Плохо", "Хорошо"],
          rows: [
            ["Отступ — 4 пробела", "<code>  return x</code> (2 пробела)", "<code>    return x</code>"],
            ["Пробелы вокруг операторов", "<code>total=price*qty</code>", "<code>total = price * qty</code>"],
            ["Пробел после запятой", "<code>f(a,b)</code>", "<code>f(a, b)</code>"],
            ["Без пробелов внутри скобок", "<code>f( a, b )</code>", "<code>f(a, b)</code>"],
            ["Именованные аргументы без пробелов вокруг <code>=</code>", "<code>f(a, key = 1)</code>", "<code>f(a, key=1)</code>"],
            ["Одно действие на строку", "<code>a = 1; b = 2</code>", "<code>a = 1</code> и <code>b = 2</code> на разных строках"],
            ["Две пустые строки между функциями", "функции вплотную друг к другу", "две пустые строки между ними"],
            ["Строка не длиннее 79 символов", "строка, уходящая за край экрана", "длинное выражение разбито на части"]
          ]
        },
        {
          type: "note",
          html: "В настоящих проектах оформление проверяют автоматически (например, программами <code>flake8</code> и <code>black</code>). Но привычка писать аккуратно с самого начала экономит больше времени, чем любая проверка."
        }
      ]
    },
    {
      id: "l1_sty_q1",
      type: "quiz",
      title: "Какая запись оформлена по PEP 8",
      question: "Какая из этих строк оформлена по правилам PEP 8?",
      options: [
        "total=price*qty",
        "total = price * qty",
        "total =price* qty",
        "total= price *qty"
      ],
      correct: 1,
      explain: "По PEP 8 вокруг знака присваивания и арифметических операторов ставят по одному пробелу с каждой стороны: total = price * qty. В остальных вариантах пробелы расставлены хаотично."
    },

    /* ============ ИМЕНА ============ */
    {
      id: "l1_sty_t2",
      type: "theory",
      title: "Имена, которые объясняют код",
      blocks: [
        {
          type: "p",
          html: "Имя переменной или функции — самая частая документация. Хорошее имя избавляет от комментария, плохое заставляет разгадывать код."
        },
        {
          type: "code",
          code: 'def f(a, b):\n    c = 0\n    for i in range(b):\n        c += a\n    return c\n\nprint(f(3, 4))',
          output: "12"
        },
        {
          type: "p",
          html: "Что делает эта функция? Придётся читать тело. Теперь тот же код с говорящими именами:"
        },
        {
          type: "code",
          code: 'def total_cost(price, quantity):\n    total = 0\n    for _ in range(quantity):\n        total += price\n    return total\n\nprint(total_cost(3, 4))',
          output: "12"
        },
        {
          type: "table",
          head: ["Что называем", "Как", "Примеры"],
          rows: [
            ["Переменные и функции", "<code>snake_case</code>: строчные буквы, слова через <code>_</code>", "<code>user_name</code>, <code>total_price</code>"],
            ["Константы", "<code>UPPER_CASE</code>", "<code>MAX_ATTEMPTS = 3</code>"],
            ["Функции-действия", "глагол, описывающий действие", "<code>calculate_total</code>, <code>read_config</code>"],
            ["Функции-проверки", "начало <code>is_</code>, <code>has_</code>, <code>can_</code>", "<code>is_even</code>, <code>has_access</code>"],
            ["Коллекции", "имя во множественном числе", "<code>prices</code>, <code>users</code>"],
            ["Счётчики в коротких циклах", "допустимы <code>i</code>, <code>j</code>", "<code>for i in range(5)</code>"]
          ]
        },
        {
          type: "note",
          html: "Не называй переменные именами встроенных функций: <code>list</code>, <code>sum</code>, <code>max</code>, <code>min</code>, <code>str</code>, <code>len</code>, <code>input</code>, <code>type</code>. Такая переменная затеняет встроенную функцию, и обращение к ней вызовет ошибку вроде <code>'int' object is not callable</code>. Не используй также одиночные <code>l</code>, <code>O</code>, <code>I</code>: они похожи на единицу и ноль."
        },
        {
          type: "p",
          html: "Длина имени тоже имеет значение: слишком короткое ничего не объясняет, слишком длинное (<code>number_of_students_in_the_first_group</code>) мешает читать выражение. Достаточно, чтобы имя отвечало на вопрос «что это?» без заглядывания в код."
        }
      ]
    },
    {
      id: "l1_sty_q2",
      type: "quiz",
      title: "Что случится с переменной sum",
      question: "Что произойдёт при запуске этого кода?",
      code: 'sum = 0\nprint(sum([1, 2, 3]))',
      options: [
        "Выведется 6",
        "Выведется 0",
        "Будет TypeError: 'int' object is not callable",
        "Будет NameError"
      ],
      correct: 2,
      explain: "Первая строка превратила имя sum в число 0 и затенила встроенную функцию. При вызове sum([1, 2, 3]) Python пытается вызвать число, отсюда ошибка «'int' object is not callable». Переменную нужно назвать иначе, например total."
    },
    {
      id: "l1_sty_p1",
      type: "predict",
      title: "Код с неговорящими именами",
      explanation: [
        "Определи, что выведется в консоли. Заметь, сколько времени уходит на то, чтобы понять смысл функции из-за имён."
      ],
      code: 'def f(l, n):\n    r = []\n    for x in l:\n        if x > n:\n            r.append(x)\n    return r\n\nprint(f([5, 1, 8, 3], 4))',
      expectedOutput: "[5, 8]",
      explain: "Функция собирает в новый список все элементы, которые больше порога n. С именами вроде filter_greater(numbers, limit) это было бы понятно с первого взгляда, без разбора тела."
    },
    {
      id: "l1_sty_f1",
      type: "code",
      tier: "warmup",
      kind: "fix",
      title: "Найди ошибку: затенённая встроенная функция",
      explanation: [
        "Функция total падает с ошибкой «'int' object is not callable». Посмотри, чему в начале файла присвоено имя sum."
      ],
      assignment: "Функция total(prices) должна вернуть сумму списка через встроенную функцию sum. Сейчас вызов total([1, 2, 3]) завершается ошибкой. Исправь код так, чтобы встроенная функция снова была доступна: менять нужно имя переменной в верхней части файла.",
      starterCode: 'sum = 0\nfor price in [10, 20, 30]:\n    sum += price\n\ndef total(prices):\n    return sum(prices)\n',
      tests: [
        { call: 'total([1, 2, 3])', returns: 6 },
        { call: 'total([])', returns: 0, hidden: true },
        { call: 'total([-5, 5, 10])', returns: 10, hidden: true }
      ],
      hints: [
        "Имя sum в начале файла стало переменной и перекрыло встроенную функцию. Дай переменной другое имя, которое описывает, что в ней хранится, и замени его в двух местах: при создании и при увеличении.",
        { code: '___ = 0\nfor price in [10, 20, 30]:\n    ___ += price\n\ndef total(prices):\n    return sum(prices)' },
        { code: 'total_price = 0\nfor price in [10, 20, 30]:\n    total_price += price\n\ndef total(prices):\n    return sum(prices)' }
      ],
      successMessage: "Ошибка исправлена: переменная названа иначе, и встроенная sum снова работает."
    },

    /* ============ СТРУКТУРА КОДА ============ */
    {
      id: "l1_sty_t3",
      type: "theory",
      title: "Структура функций: просто, плоско, без повторов",
      blocks: [
        {
          type: "p",
          html: "<b>Одна функция — одна задача.</b> Если название функции приходится строить с союзом «и» (<code>calculate_and_print</code>), вероятно, это две функции. Короткие функции проще понять, проверить и использовать повторно."
        },
        {
          type: "p",
          html: "<b>Плоско лучше, чем вложенно.</b> Глубокая лесенка из <code>if / else</code> заставляет держать в голове много условий сразу. Раннее возвращение (<code>return</code> сразу, как только ответ известен) делает код плоским."
        },
        {
          type: "code",
          code: 'def grade(score):\n    if score >= 90:\n        return "A"\n    else:\n        if score >= 70:\n            return "B"\n        else:\n            return "C"\n\nprint(grade(95), grade(75), grade(10))',
          output: "A B C"
        },
        {
          type: "p",
          html: "Тот же результат без вложенности:"
        },
        {
          type: "code",
          code: 'def grade(score):\n    if score >= 90:\n        return "A"\n    if score >= 70:\n        return "B"\n    return "C"\n\nprint(grade(95), grade(75), grade(10))',
          output: "A B C"
        },
        {
          type: "p",
          html: "<b>Не повторяйся.</b> Если один и тот же кусок кода встречается трижды, вынеси его в функцию или цикл. Тогда ошибку придётся исправлять в одном месте, а не в трёх."
        },
        {
          type: "p",
          html: "<b>Никаких магических чисел.</b> Число, смысл которого не очевиден, выносят в константу с говорящим именем."
        },
        {
          type: "code",
          code: 'TAX_RATE = 0.2\n\ndef with_tax(price):\n    return price * (1 + TAX_RATE)\n\nprint(with_tax(100))',
          output: "120.0"
        },
        {
          type: "p",
          html: "<b>Не меняй чужие данные незаметно.</b> Функция, которая получает список и возвращает результат, не должна тихо изменять исходный список: вызывающий код этого не ожидает."
        },
        {
          type: "code",
          code: 'def add_one(items):\n    items.append(1)\n    return items\n\nnums = [5]\nadd_one(nums)\nprint(nums)',
          output: "[5, 1]"
        },
        {
          type: "note",
          html: "Список <code>nums</code> изменился, хотя результат функции никуда не сохранялся. Честнее вернуть новый список: <code>return items + [1]</code>. Тогда исходный останется нетронутым."
        }
      ]
    },
    {
      id: "l1_sty_c1",
      type: "code",
      tier: "main",
      title: "Рефакторинг: ticket_price",
      explanation: [
        "Дан работающий, но трудно читаемый код: у функции непонятное имя и пять уровней вложенности. Нужно переписать его, не изменив поведение. Тесты защищают от случайных поломок: рефакторинг без проверки опасен."
      ],
      assignment: "Перепиши функцию f из заготовки как ticket_price(age), чтобы она работала так же, но была плоской и с понятным именем (раннее возвращение вместо вложенных else). Правила: для отрицательного возраста вернуть None, до 7 лет (не включая 7) цена 0, от 7 до 17 включительно 200, от 18 до 64 включительно 400, от 65 и старше 150.",
      starterCode: 'def f(a):\n    if a < 0:\n        return None\n    else:\n        if a < 7:\n            return 0\n        else:\n            if a < 18:\n                return 200\n            else:\n                if a >= 65:\n                    return 150\n                else:\n                    return 400\n',
      astRequirements: {
        require_def: true,
        require_return: true,
        require_if: true
      },
      tests: [
        { call: 'ticket_price(5)', returns: 0 },
        { call: 'ticket_price(10)', returns: 200 },
        { call: 'ticket_price(30)', returns: 400 },
        { call: 'ticket_price(70)', returns: 150 },
        { call: 'str(ticket_price(-1))', returns: "None", hidden: true },
        { call: 'ticket_price(7)', returns: 200, hidden: true },
        { call: 'ticket_price(17)', returns: 200, hidden: true },
        { call: 'ticket_price(18)', returns: 400, hidden: true },
        { call: 'ticket_price(64)', returns: 400, hidden: true },
        { call: 'ticket_price(65)', returns: 150, hidden: true },
        { call: 'ticket_price(0)', returns: 0, hidden: true }
      ],
      hints: [
        "Проверяй условия по порядку и сразу возвращай ответ: отрицательный возраст, затем границы 7, 18 и 65. Раз каждая проверка заканчивается return, ветки else не нужны. Последняя строка вернёт цену по умолчанию.",
        { code: 'def ticket_price(age):\n    if age < 0:\n        return None\n    if age < 7:\n        return 0\n    if age < ___:\n        return 200\n    if age >= 65:\n        return 150\n    return 400' },
        { code: 'def ticket_price(age):\n    if age < 0:\n        return None\n    if age < 7:\n        return 0\n    if age < 18:\n        return 200\n    if age >= 65:\n        return 150\n    return 400\n\nprint(ticket_price(30))' }
      ],
      improveTip: "Цены и границы возраста можно вынести в константы, например CHILD_AGE = 7 и SENIOR_AGE = 65: тогда правила менять проще, чем искать числа по коду.",
      successMessage: "Рефакторинг выполнен: функция плоская, имя понятное, поведение сохранено."
    },
    {
      id: "l1_sty_c2",
      type: "code",
      tier: "main",
      title: "Рефакторинг: line_total без повторов",
      explanation: [
        "В заготовке три почти одинаковые строки: меняются только данные. Такое повторение нужно вынести в функцию и обрабатывать данные циклом."
      ],
      assignment: "Напиши функцию line_total(name, price, quantity), которая возвращает строку вида \"Яблоко: 150 руб.\" (название, двоеточие и пробел, итоговая стоимость price * quantity, пробел и «руб.»). Затем замени три повторяющиеся строки заготовки циклом по списку позиций, который вызывает эту функцию. Вывод программы не должен измениться.",
      starterCode: 'print("Яблоко: " + str(3 * 50) + " руб.")\nprint("Хлеб: " + str(2 * 40) + " руб.")\nprint("Молоко: " + str(1 * 90) + " руб.")\n',
      astRequirements: {
        require_def: true,
        require_return: true,
        require_for: true,
        require_calls: ["line_total"]
      },
      expectedOutput: "Яблоко: 150 руб.\nХлеб: 80 руб.\nМолоко: 90 руб.",
      tests: [
        { call: 'line_total("Яблоко", 50, 3)', returns: "Яблоко: 150 руб." },
        { call: 'line_total("Хлеб", 40, 2)', returns: "Хлеб: 80 руб." },
        { call: 'line_total("Чай", 0, 5)', returns: "Чай: 0 руб.", hidden: true }
      ],
      hints: [
        "Функция line_total собирает строку из названия, двоеточия, стоимости (price * quantity, приведённой к строке через str) и слова «руб.». Позиции храни в списке кортежей (название, цена, количество) и перебирай циклом for, распаковывая кортеж на три переменные.",
        { code: 'def line_total(name, price, quantity):\n    return name + ": " + str(price * ___) + " руб."\n\nitems = [("Яблоко", 50, 3), ("Хлеб", 40, 2), ("Молоко", 90, 1)]\nfor name, price, quantity in items:\n    print(line_total(name, price, quantity))' },
        { code: 'def line_total(name, price, quantity):\n    return name + ": " + str(price * quantity) + " руб."\n\nitems = [("Яблоко", 50, 3), ("Хлеб", 40, 2), ("Молоко", 90, 1)]\nfor name, price, quantity in items:\n    print(line_total(name, price, quantity))' }
      ],
      improveTip: "Теперь добавить четвёртый товар можно одной строкой в список items, а формат всех строк меняется в одном месте.",
      successMessage: "Повторы убраны: логика в одной функции, данные в списке."
    },

    /* ============ НИНДЗЯ-КОД ============ */
    {
      id: "l1_sty_t4",
      type: "theory",
      title: "Ниндзя-код: чего не писать",
      blocks: [
        {
          type: "p",
          html: "«Ниндзя-код» — это код, который работает, но разобрать его почти невозможно: слишком хитрый, слишком сжатый или слишком запутанный. Автор экономит строки, а читатель платит часами. Сравни два варианта с одним результатом."
        },
        {
          type: "code",
          code: 'print([x * x for x in range(20) if x % 2 == 0 if x % 3 == 0 or x > 15])',
          output: "[0, 36, 144, 256, 324]"
        },
        {
          type: "code",
          code: 'def is_selected(x):\n    is_even = x % 2 == 0\n    divisible_by_three = x % 3 == 0\n    return is_even and (divisible_by_three or x > 15)\n\n\nprint([x * x for x in range(20) if is_selected(x)])',
          output: "[0, 36, 144, 256, 324]"
        },
        {
          type: "p",
          html: "Условие вынесено в функцию с понятным именем, а промежуточные значения названы. Теперь видно, какие числа отбираются и почему. Типичные приёмы ниндзя-кода и их замена:"
        },
        {
          type: "table",
          head: ["Приём", "Чем плох", "Как лучше"],
          rows: [
            ["<code>if flag == True:</code>", "лишнее сравнение", "<code>if flag:</code>"],
            ["<code>if len(items) == 0:</code>", "многословно", "<code>if not items:</code>"],
            ["<code>if x == None:</code>", "<code>None</code> сравнивают по тождеству, а не по значению", "<code>if x is None:</code>"],
            ["<code>except:</code> или <code>except Exception: pass</code>", "прячет настоящие ошибки, включая опечатки", "перехватывай конкретный тип и не молчи"],
            ["вложенные тернарные операторы", "не читаются с первого раза", "обычный <code>if / elif / else</code>"],
            ["несколько действий в одной строке", "нельзя отладить по шагам", "одно действие на строку"],
            ["имена <code>tmp</code>, <code>data2</code>, <code>l</code>", "не говорят о смысле", "имя по содержимому"],
            ["закомментированный старый код", "мусор, который вводит в заблуждение", "удали: прошлые версии хранит система контроля версий"]
          ]
        },
        {
          type: "note",
          html: "Оператор <code>==</code> сравнивает значения, а <code>is</code> проверяет, что это один и тот же объект. Значение <code>None</code> существует в единственном экземпляре, поэтому его принято проверять через <code>is None</code> и <code>is not None</code>."
        },
        {
          type: "p",
          html: "Краткость ценна, пока код остаётся понятным. Проверочный вопрос: сможет ли коллега (или ты сам через месяц) прочитать эту строку без расшифровки? Если нет, перепиши её. В принципах Python прямо сказано, что читаемость имеет значение."
        }
      ]
    },
    {
      id: "l1_sty_p2",
      type: "predict",
      title: "Вложенный тернарный оператор",
      explanation: [
        "Определи, что выведется в консоли. Запись в одну строку — пример того, как не стоит писать, но читать её нужно уметь."
      ],
      code: 'x = 10\nprint("fizzbuzz" if x % 15 == 0 else "fizz" if x % 3 == 0 else "buzz" if x % 5 == 0 else x)',
      expectedOutput: "buzz",
      explain: "Условия проверяются слева направо. 10 не делится на 15 и на 3, поэтому проверка доходит до третьего условия: 10 делится на 5, результат «buzz». Обычная цепочка if / elif читалась бы заметно легче."
    },
    {
      id: "l1_sty_p3",
      type: "predict",
      title: "Приоритет операторов без скобок",
      explanation: [
        "Определи, что выведется в консоли. Вспомни порядок: сначала возведение в степень, затем умножение, целочисленное деление и остаток (слева направо), в последнюю очередь сложение."
      ],
      code: 'print(1 + 2 * 3 ** 2 // 4 % 5)',
      expectedOutput: "5",
      explain: "3 ** 2 равно 9, затем 2 * 9 равно 18, затем 18 // 4 равно 4, затем 4 % 5 равно 4, и в конце 1 + 4 равно 5. Выражение верное, но чтобы его понять, пришлось держать в голове цепочку. Разбить его на несколько строк или поставить скобки было бы честнее."
    },
    {
      id: "l1_sty_c3",
      type: "code",
      tier: "main",
      title: "Рефакторинг: is_leap_year",
      explanation: [
        "В заготовке функция в одну строку с непонятным именем. Она работает, но возвращает не всегда True или False. Сначала пойми правило, затем запиши его читаемо."
      ],
      assignment: "Напиши функцию is_leap_year(year), которая возвращает True, если год високосный, и False в остальных случаях (именно значения True и False). Год високосный, если он делится на 4, кроме годов, которые делятся на 100; но годы, которые делятся на 400, всё же високосные. Запиши правило читаемо, по частям, вместо одной строки из заготовки.",
      starterCode: 'def l(y): return not(y%4) and (y%100 or not y%400)\n',
      astRequirements: {
        require_def: true,
        require_return: true
      },
      tests: [
        { call: 'is_leap_year(2000)', returns: true },
        { call: 'is_leap_year(1900)', returns: false },
        { call: 'is_leap_year(2024)', returns: true },
        { call: 'is_leap_year(2023)', returns: false },
        { call: 'is_leap_year(2100)', returns: false, hidden: true },
        { call: 'is_leap_year(1600)', returns: true, hidden: true },
        { call: 'is_leap_year(4)', returns: true, hidden: true },
        { call: 'is_leap_year(1)', returns: false, hidden: true }
      ],
      hints: [
        "Проверяй правила от самого сильного исключения к общему: если год делится на 400, он високосный; иначе, если делится на 100, нет; иначе он високосный тогда, когда делится на 4.",
        { code: 'def is_leap_year(year):\n    if year % 400 == 0:\n        return True\n    if year % 100 == 0:\n        return ___\n    return year % 4 == 0' },
        { code: 'def is_leap_year(year):\n    if year % 400 == 0:\n        return True\n    if year % 100 == 0:\n        return False\n    return year % 4 == 0\n\nprint(is_leap_year(2024), is_leap_year(1900))' }
      ],
      improveTip: "Запусти исходную функцию l(2024): она вернёт не True, а число 24. Короткая запись незаметно изменила тип результата, и именно такие сюрпризы отличают ниндзя-код от читаемого.",
      successMessage: "Правило записано читаемо и возвращает честные True и False."
    },
    {
      id: "l1_sty_f2",
      type: "code",
      tier: "main",
      kind: "fix",
      title: "Найди ошибку: голый except прячет опечатку",
      explanation: [
        "Функция всегда возвращает 0, даже для правильной строки. Причина не в самой логике: ошибка в коде спрятана оператором except без типа."
      ],
      assignment: "Функция to_int(text) должна превращать строку в целое число, а если это не получается, возвращать 0. Сейчас to_int(\"42\") возвращает 0. Исправь функцию: найди и поправь опечатку в имени переменной, а голый except замени на except ValueError, чтобы подобные опечатки больше не проглатывались молча.",
      starterCode: 'def to_int(text):\n    try:\n        return int(txt)\n    except:\n        return 0\n',
      tests: [
        { call: 'to_int("42")', returns: 42 },
        { call: 'to_int("abc")', returns: 0 },
        { call: 'to_int("-3")', returns: -3, hidden: true },
        { call: 'to_int("")', returns: 0, hidden: true }
      ],
      hints: [
        "Внутри функции используется имя txt, а параметр называется text. Из-за этого возникает NameError, и голый except его молча перехватывает. Исправь имя и ограничь except типом ошибки, которую ты действительно ждёшь от int().",
        { code: 'def to_int(text):\n    try:\n        return int(___)\n    except ValueError:\n        return 0' },
        { code: 'def to_int(text):\n    try:\n        return int(text)\n    except ValueError:\n        return 0\n\nprint(to_int("42"), to_int("abc"))' }
      ],
      successMessage: "Опечатка найдена, а except теперь ловит только ожидаемую ошибку."
    },

    /* ============ КОММЕНТАРИИ И ИТОГИ ============ */
    {
      id: "l1_sty_t5",
      type: "theory",
      title: "Комментарии, докстринги и итоговый чек-лист",
      blocks: [
        {
          type: "p",
          html: "<b>Комментарий отвечает на вопрос «почему», а код — на вопрос «что».</b> Пересказ очевидного только шумит: <code>i += 1  # увеличиваем i на 1</code> ничего не добавляет. Полезный комментарий объясняет причину решения, которую из кода не прочитать."
        },
        {
          type: "code",
          code: '# Цена в базе хранится в копейках, поэтому переводим в рубли\nprice_rub = 12990 / 100\nprint(price_rub)',
          output: "129.9"
        },
        {
          type: "list",
          items: [
            "Устаревший комментарий хуже, чем отсутствие комментария: он вводит в заблуждение. Меняешь код — проверь комментарии рядом.",
            "Если для понимания кода нужен длинный комментарий, часто проще переименовать переменные или вынести кусок в функцию с хорошим именем.",
            "Закомментированный старый код удаляй: если он понадобится, его можно найти в истории версий."
          ]
        },
        {
          type: "p",
          html: "<b>Докстринг</b> — это строка в тройных кавычках сразу после строки <code>def</code>. Она кратко описывает, что делает функция, и показывается в подсказках редакторов."
        },
        {
          type: "code",
          code: 'def area(width, height):\n    """Возвращает площадь прямоугольника."""\n    return width * height\n\n\nprint(area(3, 4))',
          output: "12"
        },
        {
          type: "note",
          html: "Рабочий порядок такой: сначала добейся, чтобы код работал, затем сделай его читаемым, затем снова проверь, что он работает. Рефакторинг без проверки легко ломает рабочую программу."
        },
        {
          type: "p",
          html: "<b>Чек-лист перед тем, как сказать «готово»</b>"
        },
        {
          type: "table",
          head: ["Что проверить", "Вопрос к себе"],
          rows: [
            ["Имена", "Понятно ли по имени, что хранится в переменной и что делает функция?"],
            ["Встроенные имена", "Не перекрыл ли я <code>list</code>, <code>sum</code>, <code>max</code>, <code>str</code> и другие?"],
            ["Размер функций", "Делает ли функция одно дело и помещается ли она на экран?"],
            ["Повторы", "Нет ли одинаковых кусков кода, которые можно вынести в функцию или цикл?"],
            ["Числа", "Нет ли «магических» чисел без объяснения?"],
            ["Ошибки", "Перехватываю ли я конкретный тип, а не голый <code>except</code>?"],
            ["Комментарии", "Объясняют ли они «почему» и не устарели ли?"],
            ["Оформление", "Отступ в 4 пробела, пробелы вокруг операторов, строки до 79 символов?"],
            ["Результат", "Работает ли программа так же, как до правок?"]
          ]
        }
      ]
    },
    {
      id: "l1_sty_q3",
      type: "quiz",
      title: "Какой комментарий полезнее",
      question: "К строке кода нужен комментарий. Какой из вариантов самый полезный?",
      code: 'price = amount / 100',
      options: [
        "# делим amount на 100",
        "# amount хранится в копейках, переводим в рубли",
        "# деление",
        "Комментарий не нужен: из кода и так всё ясно"
      ],
      correct: 1,
      explain: "Первый и третий варианты пересказывают то, что видно в самом коде. Второй объясняет причину, которую из кода не узнать: почему именно делим на 100. Именно «почему» и должен объяснять комментарий."
    },

    /* ============ ЗВЁЗДОЧКА ============ */
    {
      id: "l1_sty_c4",
      type: "code",
      tier: "star",
      optional: true,
      title: "Функция add_bonus без побочных эффектов",
      explanation: [
        "Функция в заготовке даёт правильный результат, но попутно меняет переданный список. Нужно сделать её «честной»: вернуть новый список, а исходный не трогать."
      ],
      assignment: "Перепиши функцию add_bonus(scores) так, чтобы она возвращала новый список, в котором к каждому баллу прибавлено 10, и не изменяла исходный список. Например, add_bonus([50, 70]) возвращает [60, 80], а переданный список остаётся [50, 70].",
      starterCode: 'def add_bonus(scores):\n    for i in range(len(scores)):\n        scores[i] += 10\n    return scores\n',
      astRequirements: {
        require_def: true,
        require_return: true
      },
      tests: [
        { call: 'str(add_bonus([50, 70]))', returns: "[60, 80]" },
        { call: 'str((s := [1, 2], add_bonus(s), s)[2])', returns: "[1, 2]" },
        { call: 'str(add_bonus([]))', returns: "[]", hidden: true },
        { call: 'str((s := [5], add_bonus(s), s)[1])', returns: "[15]", hidden: true }
      ],
      hints: [
        "Создай новый пустой список и добавляй в него по одному значению score + 10 для каждого балла из исходного списка. Исходный список только читай, не изменяй. В конце верни новый список.",
        { code: 'def add_bonus(scores):\n    result = []\n    for score in scores:\n        result.append(score + ___)\n    return result' },
        { code: 'def add_bonus(scores):\n    result = []\n    for score in scores:\n        result.append(score + 10)\n    return result\n\nprint(add_bonus([50, 70]))' }
      ],
      improveTip: "То же решение записывается одной строкой: [score + 10 for score in scores]. Здесь она читается легко, и это пример того, что краткость и ясность могут совпадать.",
      successMessage: "Функция вернула новый список и не тронула исходный."
    }
  ]
});
