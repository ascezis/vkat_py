/**
 * Тема этапа 2: Кортежи (углублённая практика)
 */

window.COURSE_TOPICS = window.COURSE_TOPICS || [];

window.COURSE_TOPICS.push({
  id: "l1_tuples",
  title: "Кортежи",
  minutes: 45,
  items: [
    {
      id: "l1_tup_t1",
      type: "theory",
      title: "Что такое кортеж",
      blocks: [
        {
          type: "p",
          html: "Кортеж (<code>tuple</code>) — упорядоченная коллекция элементов, как список, но <b>неизменяемая</b>. После создания кортеж нельзя менять: нельзя заменить, добавить или удалить элемент."
        },
        {
          type: "p",
          html: "Кортеж записывается в круглых скобках через запятую. Скобки можно опустить: кортеж создаёт именно запятая."
        },
        {
          type: "code",
          code: 'point = (3, 4)\nempty = ()\nsingle = (5,)\nno_brackets = 1, 2, 3\nfrom_list = tuple([1, 2, 3])\nchars = tuple("abc")\n\nprint(point)\nprint(single)\nprint(no_brackets)\nprint(from_list)\nprint(chars)\nprint(type(point))',
          output: "(3, 4)\n(5,)\n(1, 2, 3)\n(1, 2, 3)\n('a', 'b', 'c')\n<class 'tuple'>"
        },
        {
          type: "note",
          html: "Кортеж из одного элемента обязательно пишется с запятой: <code>(5,)</code>. Запись <code>(5)</code> — это просто число 5 в скобках."
        },
        {
          type: "p",
          html: "Всё, что не меняет коллекцию, работает у кортежа так же, как у списка: индексы, срезы, <code>len</code>, <code>in</code>, сложение, умножение на число, а также методы <code>count</code> и <code>index</code>."
        },
        {
          type: "code",
          code: 't = (10, 20, 30, 20, 40)\n\nprint(t[0], t[-1])\nprint(t[1:3])\nprint(len(t))\nprint(20 in t)\nprint(t.count(20))\nprint(t.index(30))\nprint((1, 2) + (3,))\nprint((0,) * 3)',
          output: "10 40\n(20, 30)\n5\nTrue\n2\n2\n(1, 2, 3)\n(0, 0, 0)"
        }
      ]
    },
    {
      id: "l1_tup_q1",
      type: "quiz",
      title: "Скобки без запятой",
      question: "Какого типа значение переменной x?",
      code: "x = (5)",
      options: [
        "tuple",
        "int",
        "list",
        "Будет SyntaxError"
      ],
      correct: 1,
      explain: "Кортеж создаёт запятая, а не скобки. Запись (5) — это число 5 в скобках, то есть int. Кортеж из одного элемента пишется как (5,)."
    },
    {
      id: "l1_tup_p1",
      type: "predict",
      title: "Индексы и срезы кортежа",
      explanation: [
        "Посмотри на код программы и определи, какой вывод появится в консоли при запуске. Значения в одной строке разделены пробелом."
      ],
      code: 't = (10, 20, 30, 40, 50)\nprint(t[1], t[-1], t[1:3], len(t))',
      expectedOutput: "20 50 (20, 30) 5",
      explain: "t[1] равен 20, t[-1] — последний элемент 50. Срез t[1:3] берёт индексы 1 и 2 и возвращает кортеж (20, 30). В кортеже пять элементов."
    },
    {
      id: "l1_tup_t2",
      type: "theory",
      title: "Неизменяемость",
      blocks: [
        {
          type: "p",
          html: "Попытка изменить элемент кортежа приводит к ошибке:"
        },
        {
          type: "code",
          code: 't = (1, 2, 3)\nt[0] = 100',
          output: "TypeError: 'tuple' object does not support item assignment"
        },
        {
          type: "p",
          html: "У кортежа нет методов <code>append</code>, <code>insert</code>, <code>remove</code>, <code>pop</code> и <code>sort</code>. Есть только <code>count</code> и <code>index</code>."
        },
        {
          type: "p",
          html: "Чтобы получить «изменённый» кортеж, создают <b>новый</b> кортеж и записывают его в ту же переменную:"
        },
        {
          type: "code",
          code: 't = (1, 2, 3)\nt = t + (4,)\nprint(t)',
          output: "(1, 2, 3, 4)"
        },
        {
          type: "p",
          html: "Если нужно изменить данные, кортеж превращают в список функцией <code>list()</code>, меняют, а затем при необходимости превращают обратно функцией <code>tuple()</code>. Функция <code>sorted()</code> принимает кортеж и возвращает <b>список</b>."
        },
        {
          type: "code",
          code: 't = (3, 1, 2)\n\nitems = list(t)\nitems.sort()\nt = tuple(items)\nprint(t)\n\nprint(sorted((3, 1, 2)))',
          output: "(1, 2, 3)\n[1, 2, 3]"
        },
        {
          type: "note",
          html: "Неизменяемость относится к самому кортежу, то есть к набору объектов, которые в нём лежат. Если внутри кортежа находится список, этот список по-прежнему можно менять."
        }
      ]
    },
    {
      id: "l1_tup_q2",
      type: "quiz",
      title: "Присваивание элементу кортежа",
      question: "Что произойдёт при запуске этого кода?",
      code: "t = (1, 2, 3)\nt[0] = 99\nprint(t)",
      options: [
        "Выведется (99, 2, 3)",
        "Будет TypeError",
        "Будет IndexError",
        "Выведется (1, 2, 3)"
      ],
      correct: 1,
      explain: "Кортеж неизменяемый, поэтому присваивание элементу по индексу приводит к TypeError. IndexError возникает при выходе индекса за границы."
    },
    {
      id: "l1_tup_p2",
      type: "predict",
      title: "Список внутри кортежа",
      explanation: [
        "Кортеж содержит число и список. Определи, что выведется после изменения списка."
      ],
      code: 't = (1, [2, 3])\nt[1].append(4)\nprint(t)',
      expectedOutput: "(1, [2, 3, 4])",
      explain: "Метод append вызывается у списка, а не у кортежа. Кортеж по-прежнему содержит тот же самый список, но сам список стал длиннее."
    },
    {
      id: "l1_tup_f1",
      type: "code",
      tier: "main",
      kind: "fix",
      title: "Найди ошибку: изменение кортежа",
      explanation: [
        "Точка хранится в кортеже (x, y). Элементы кортежа менять нельзя, поэтому функция должна вернуть новый кортеж."
      ],
      assignment: "Программа падает с ошибкой TypeError. Исправь функцию move(point, dx, dy) так, чтобы она не меняла point, а возвращала новый кортеж (x + dx, y + dy). Программа должна вывести одну строку: (4, 6).",
      starterCode: 'def move(point, dx, dy):\n    point[0] += dx\n    point[1] += dy\n    return point\n\nprint(move((1, 2), 3, 4))\n',
      astRequirements: {
        require_def: true,
        require_return: true
      },
      expectedOutput: "(4, 6)",
      tests: [
        { call: "str(move((1, 2), 3, 4))", returns: "(4, 6)" },
        { call: "str(move((0, 0), -1, -1))", returns: "(-1, -1)" },
        { call: "str(move((5, 5), 0, 0))", returns: "(5, 5)", hidden: true }
      ],
      hints: [
        "Кортеж изменить нельзя. Достань x и y из point и верни новый кортеж из изменённых значений.",
        { code: "def move(point, dx, dy):\n    x, y = point\n    return (x + dx, ___)" },
        { code: "def move(point, dx, dy):\n    x, y = point\n    return (x + dx, y + dy)\n\nprint(move((1, 2), 3, 4))" }
      ],
      improveTip: "Функция, которая не меняет входные данные и возвращает новый результат, проще проверять и безопаснее использовать.",
      successMessage: "Ошибка исправлена: функция возвращает новый кортеж."
    },
    {
      id: "l1_tup_t3",
      type: "theory",
      title: "Распаковка кортежей",
      blocks: [
        {
          type: "p",
          html: "Значения кортежа можно разложить по отдельным переменным одним присваиванием. Это называется <b>распаковкой</b>:"
        },
        {
          type: "code",
          code: 'point = (3, 4)\nx, y = point\nprint(x)\nprint(y)',
          output: "3\n4"
        },
        {
          type: "note",
          html: "Число переменных слева должно совпадать с числом элементов справа. Иначе Python выдаст <code>ValueError</code>."
        },
        {
          type: "p",
          html: "Через распаковку записывается обмен значений двух переменных без временной переменной:"
        },
        {
          type: "code",
          code: 'a, b = 1, 2\na, b = b, a\nprint(a, b)',
          output: "2 1"
        },
        {
          type: "p",
          html: "Запись <code>return a, b</code> возвращает из функции кортеж. Вызывающий код может сразу распаковать его в переменные:"
        },
        {
          type: "code",
          code: 'def divide(a, b):\n    return a // b, a % b\n\nprint(divide(17, 5))\n\nq, r = divide(17, 5)\nprint(q, r)',
          output: "(3, 2)\n3 2"
        },
        {
          type: "p",
          html: "Распаковку можно писать прямо в заголовке цикла. Так работают <code>enumerate</code>, <code>zip</code> и <code>items()</code>: каждый шаг цикла отдаёт кортеж."
        },
        {
          type: "code",
          code: 'pairs = [("Аня", 5), ("Борис", 3)]\n\nfor name, score in pairs:\n    print(name, score)',
          output: "Аня 5\nБорис 3"
        }
      ]
    },
    {
      id: "l1_tup_q3",
      type: "quiz",
      title: "Лишнее значение при распаковке",
      question: "Что произойдёт при запуске этого кода?",
      code: "a, b = (1, 2, 3)\nprint(a, b)",
      options: [
        "Выведется 1 2",
        "Будет ValueError",
        "Будет TypeError",
        "Выведется 1 (2, 3)"
      ],
      correct: 1,
      explain: "Слева две переменные, а в кортеже три элемента. Python сообщает ValueError: too many values to unpack."
    },
    {
      id: "l1_tup_p3",
      type: "predict",
      title: "Обмен значений",
      explanation: [
        "Правая часть присваивания вычисляется целиком до того, как переменные получат новые значения."
      ],
      code: 'a, b = 1, 2\na, b = b, a + b\nprint(a, b)',
      expectedOutput: "2 3",
      explain: "Сначала вычисляется правая часть: b равно 2, a + b равно 3. Затем a получает 2, а b получает 3."
    },
    {
      id: "l1_tup_p4",
      type: "predict",
      title: "Что возвращает return a, b",
      explanation: [
        "Определи, что лежит в переменной x и какого она типа."
      ],
      code: 'def f():\n    return 1, 2\n\nx = f()\nprint(x, type(x) == tuple)',
      expectedOutput: "(1, 2) True",
      explain: "Запятая в return создаёт кортеж. Переменная x содержит кортеж (1, 2), поэтому сравнение типа даёт True."
    },
    {
      id: "l1_tup_c1",
      type: "code",
      tier: "warmup",
      title: "Функция min_max",
      explanation: [
        "Чтобы вернуть из функции два значения, достаточно записать их через запятую после return."
      ],
      assignment: "Напиши функцию min_max(nums), которая принимает непустой список чисел и возвращает кортеж из двух значений: наименьшего и наибольшего числа. Например, min_max([3, 1, 4]) возвращает (1, 4).",
      starterCode: "# Напиши функцию min_max(nums)\n",
      astRequirements: {
        require_def: true,
        require_return: true
      },
      tests: [
        { call: "str(min_max([3, 1, 4]))", returns: "(1, 4)" },
        { call: "str(min_max([5]))", returns: "(5, 5)" },
        { call: "str(min_max([-2, -9, 0]))", returns: "(-9, 0)", hidden: true }
      ],
      hints: [
        "Верни через запятую два значения: минимум и максимум списка. Python сам упакует их в кортеж.",
        { code: "def min_max(nums):\n    return ___(nums), max(nums)" },
        { code: "def min_max(nums):\n    return min(nums), max(nums)\n\nprint(min_max([3, 1, 4]))" }
      ],
      successMessage: "Функция min_max возвращает два значения в одном кортеже."
    },
    {
      id: "l1_tup_c2",
      type: "code",
      tier: "warmup",
      title: "Функция swap_pair",
      explanation: [
        "Кортеж из двух элементов можно распаковать в две переменные и собрать заново в другом порядке."
      ],
      assignment: "Напиши функцию swap_pair(pair), которая принимает кортеж из двух элементов и возвращает новый кортеж, в котором элементы поменяны местами. Например, swap_pair((1, 2)) возвращает (2, 1).",
      starterCode: "# Напиши функцию swap_pair(pair)\n",
      astRequirements: {
        require_def: true,
        require_return: true
      },
      tests: [
        { call: "str(swap_pair((1, 2)))", returns: "(2, 1)" },
        { call: 'str(swap_pair(("a", "b")))', returns: "('b', 'a')" },
        { call: "str(swap_pair((5, 5)))", returns: "(5, 5)", hidden: true }
      ],
      hints: [
        "Распакуй pair в две переменные a и b, затем верни их в обратном порядке.",
        { code: "def swap_pair(pair):\n    a, b = pair\n    return ___, ___" },
        { code: "def swap_pair(pair):\n    a, b = pair\n    return b, a\n\nprint(swap_pair((1, 2)))" }
      ],
      successMessage: "Функция swap_pair меняет элементы пары местами."
    },
    {
      id: "l1_tup_c3",
      type: "code",
      tier: "main",
      title: "Функция split_pairs",
      explanation: [
        "Список пар можно перебирать циклом с распаковкой: for name, score in pairs."
      ],
      assignment: "Напиши функцию split_pairs(pairs), которая принимает список кортежей (имя, очки) и возвращает кортеж из двух списков: сначала список всех имён, затем список всех очков. Порядок сохраняется. Например, split_pairs([(\"Аня\", 5), (\"Борис\", 3)]) возвращает ([\"Аня\", \"Борис\"], [5, 3]).",
      starterCode: "# Напиши функцию split_pairs(pairs)\n",
      astRequirements: {
        require_def: true,
        require_return: true
      },
      tests: [
        { call: 'str(split_pairs([("Аня", 5), ("Борис", 3)]))', returns: "(['Аня', 'Борис'], [5, 3])" },
        { call: 'str(split_pairs([("Вера", 4)]))', returns: "(['Вера'], [4])" },
        { call: "str(split_pairs([]))", returns: "([], [])", hidden: true }
      ],
      hints: [
        "Создай два пустых списка names и scores. В цикле с распаковкой for name, score in pairs добавляй значения в соответствующие списки. В конце верни оба списка.",
        { code: "def split_pairs(pairs):\n    names = []\n    scores = []\n    for name, score in pairs:\n        names.append(name)\n        scores.append(___)\n    return names, scores" },
        { code: "def split_pairs(pairs):\n    names = []\n    scores = []\n    for name, score in pairs:\n        names.append(name)\n        scores.append(score)\n    return names, scores\n\nprint(split_pairs([(\"Аня\", 5), (\"Борис\", 3)]))" }
      ],
      successMessage: "Функция split_pairs раскладывает пары по двум спискам."
    },
    {
      id: "l1_tup_c4",
      type: "code",
      tier: "main",
      title: "Функция best_player",
      explanation: [
        "Нужно пройти по списку кортежей и запомнить имя игрока с наибольшим количеством очков."
      ],
      assignment: "Напиши функцию best_player(records), которая принимает непустой список кортежей (имя, очки) и возвращает имя игрока с наибольшим количеством очков. Очки у разных игроков разные. Например, best_player([(\"Аня\", 5), (\"Борис\", 7), (\"Вера\", 6)]) возвращает \"Борис\".",
      starterCode: "# Напиши функцию best_player(records)\n",
      astRequirements: {
        require_def: true,
        require_return: true
      },
      tests: [
        { call: 'best_player([("Аня", 5), ("Борис", 7), ("Вера", 6)])', returns: "Борис" },
        { call: 'best_player([("Аня", 9), ("Борис", 7)])', returns: "Аня" },
        { call: 'best_player([("Вера", 1)])', returns: "Вера", hidden: true },
        { call: 'best_player([("a", -3), ("b", -1), ("c", -2)])', returns: "b", hidden: true }
      ],
      hints: [
        "Возьми первую запись как лучшую. Переберай все записи с распаковкой и, если очки больше лучших, запоминай новое имя и новые очки.",
        { code: "def best_player(records):\n    best_name, best_score = records[0]\n    for name, score in records:\n        if score > ___:\n            best_name = name\n            best_score = score\n    return best_name" },
        { code: "def best_player(records):\n    best_name, best_score = records[0]\n    for name, score in records:\n        if score > best_score:\n            best_name = name\n            best_score = score\n    return best_name\n\nprint(best_player([(\"Аня\", 5), (\"Борис\", 7), (\"Вера\", 6)]))" }
      ],
      successMessage: "Функция best_player находит лучшего игрока в списке кортежей."
    },
    {
      id: "l1_tup_t4",
      type: "theory",
      title: "Список или кортеж, кортеж как ключ словаря",
      blocks: [
        {
          type: "table",
          head: ["", "Список", "Кортеж"],
          rows: [
            ["Запись", "<code>[1, 2]</code>", "<code>(1, 2)</code>"],
            ["Изменяемость", "Изменяемый", "Неизменяемый"],
            ["Методы", "Много: <code>append</code>, <code>pop</code>, <code>sort</code> и другие", "Только <code>count</code> и <code>index</code>"],
            ["Типичное применение", "Набор однотипных элементов, длина которого меняется", "Фиксированная запись из нескольких полей: координаты, пара «имя и очки»"],
            ["Ключ словаря", "Нельзя", "Можно, если все элементы неизменяемые"]
          ]
        },
        {
          type: "p",
          html: "Так как кортеж неизменяемый, он может быть ключом словаря. Это удобно, когда ключом должно быть сразу несколько значений, например координаты:"
        },
        {
          type: "code",
          code: 'visits = {}\nvisits[(1, 2)] = 5\nvisits[(3, 4)] = 1\n\nprint(visits[(1, 2)])\nprint((3, 4) in visits)',
          output: "5\nTrue"
        },
        {
          type: "note",
          html: "Кортеж может быть ключом, только если все его элементы неизменяемые. Кортеж <code>(1, [2])</code> ключом не станет: Python выдаст <code>TypeError: unhashable type: 'list'</code>."
        }
      ]
    },
    {
      id: "l1_tup_q4",
      type: "quiz",
      title: "Допустимый ключ словаря",
      question: "Какое из выражений создаст словарь без ошибки?",
      options: [
        "{[1, 2]: \"a\"}",
        "{(1, 2): \"a\"}",
        "{{1: 2}: \"a\"}",
        "{[]: \"a\"}"
      ],
      correct: 1,
      explain: "Ключом может быть только неизменяемый объект. Кортеж (1, 2) подходит. Список и словарь изменяемые, поэтому Python выдаёт TypeError: unhashable type."
    },
    {
      id: "l1_tup_c5",
      type: "code",
      tier: "main",
      title: "Функция count_pairs",
      explanation: [
        "Кортеж можно использовать как ключ словаря. Счётчик строится так же, как для символов: result[key] = result.get(key, 0) + 1."
      ],
      assignment: "Напиши функцию count_pairs(pairs), которая принимает список кортежей и возвращает словарь: ключ — кортеж из списка, значение — сколько раз этот кортеж встретился. Например, для [(1, 2), (1, 2), (2, 1)] ключ (1, 2) имеет значение 2, а ключ (2, 1) — значение 1.",
      starterCode: "# Напиши функцию count_pairs(pairs)\n",
      astRequirements: {
        require_def: true,
        require_return: true
      },
      tests: [
        { call: "count_pairs([(1, 2), (1, 2), (2, 1)])[(1, 2)]", returns: 2 },
        { call: "count_pairs([(1, 2), (1, 2), (2, 1)])[(2, 1)]", returns: 1 },
        { call: "len(count_pairs([(1, 2), (1, 2), (2, 1)]))", returns: 2 },
        { call: "len(count_pairs([]))", returns: 0, hidden: true },
        { call: "count_pairs([(0, 0)] * 3)[(0, 0)]", returns: 3, hidden: true }
      ],
      hints: [
        "Создай пустой словарь result. Для каждого кортежа p из списка увеличь счётчик: прочитай текущее значение методом get со значением по умолчанию 0 и прибавь 1.",
        { code: "def count_pairs(pairs):\n    result = {}\n    for p in pairs:\n        result[p] = result.get(p, ___) + 1\n    return result" },
        { code: "def count_pairs(pairs):\n    result = {}\n    for p in pairs:\n        result[p] = result.get(p, 0) + 1\n    return result\n\nprint(count_pairs([(1, 2), (1, 2), (2, 1)]))" }
      ],
      successMessage: "Кортежи успешно использованы как ключи словаря."
    },
    {
      id: "l1_tup_c6",
      type: "code",
      tier: "star",
      optional: true,
      title: "Функция closest_to_origin",
      explanation: [
        "Квадрат расстояния от точки (x, y) до начала координат равен x * x + y * y. Корень извлекать не нужно: для сравнения достаточно квадрата."
      ],
      assignment: "Напиши функцию closest_to_origin(points), которая принимает непустой список точек-кортежей (x, y) и возвращает ту точку, которая ближе всего к началу координат (0, 0). Если несколько точек одинаково близки, верни первую из них. Например, closest_to_origin([(3, 4), (1, 1), (5, 0)]) возвращает (1, 1).",
      starterCode: "# Напиши функцию closest_to_origin(points)\n",
      astRequirements: {
        require_def: true,
        require_return: true
      },
      tests: [
        { call: "str(closest_to_origin([(3, 4), (1, 1), (5, 0)]))", returns: "(1, 1)" },
        { call: "str(closest_to_origin([(0, 0), (1, 1)]))", returns: "(0, 0)" },
        { call: "str(closest_to_origin([(-2, 0), (0, 1)]))", returns: "(0, 1)", hidden: true },
        { call: "str(closest_to_origin([(1, 0), (0, 1)]))", returns: "(1, 0)", hidden: true }
      ],
      hints: [
        "Возьми первую точку как лучшую и посчитай её квадрат расстояния. Переберай точки с распаковкой for x, y in points и обновляй лучшую точку только тогда, когда новое расстояние строго меньше.",
        { code: "def closest_to_origin(points):\n    best = points[0]\n    best_d = best[0] ** 2 + best[1] ** 2\n    for x, y in points:\n        d = x * x + y * y\n        if d < ___:\n            best = (x, y)\n            best_d = d\n    return best" },
        { code: "def closest_to_origin(points):\n    best = points[0]\n    best_d = best[0] ** 2 + best[1] ** 2\n    for x, y in points:\n        d = x * x + y * y\n        if d < best_d:\n            best = (x, y)\n            best_d = d\n    return best\n\nprint(closest_to_origin([(3, 4), (1, 1), (5, 0)]))" }
      ],
      successMessage: "Ближайшая к началу координат точка найдена."
    },
    {
      id: "l1_tup_t5",
      type: "theory",
      title: "Частые ошибки",
      blocks: [
        {
          type: "p",
          html: "Справочная таблица типичных затруднений при работе с кортежами:"
        },
        {
          type: "table",
          head: ["Ошибка / Ситуация", "Причина", "Что делать"],
          rows: [
            ["<code>TypeError: 'tuple' object does not support item assignment</code>", "Попытка изменить элемент кортежа", "Создай новый кортеж или преврати кортеж в список через <code>list()</code>"],
            ["<code>AttributeError: 'tuple' object has no attribute 'append'</code>", "У кортежа нет методов изменения", "Используй <code>t + (x,)</code> или работай со списком"],
            ["<code>(5)</code> не кортеж", "Кортеж создаёт запятая, а не скобки", "Для одного элемента пиши <code>(5,)</code>"],
            ["<code>ValueError: too many values to unpack</code>", "Переменных слева меньше, чем элементов в кортеже", "Сделай число переменных равным числу элементов"],
            ["<code>ValueError: not enough values to unpack</code>", "Переменных слева больше, чем элементов в кортеже", "Сделай число переменных равным числу элементов"],
            ["<code>TypeError: unhashable type: 'list'</code>", "В ключе-кортеже лежит список", "Используй в ключе только неизменяемые элементы"]
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
