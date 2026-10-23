/**
 * Тема этапа 2: Списки (углублённая практика)
 * Источник: урок «Списки в Python» (теория 45 мин + практика 45 мин)
 */

window.COURSE_TOPICS = window.COURSE_TOPICS || [];

window.COURSE_TOPICS.push({
  id: "l1_lists",
  title: "Списки",
  minutes: 90,
  items: [
    /* ============ ТЕОРИЯ ============ */
    {
      id: "l1_list_t1",
      type: "theory",
      title: "Что такое список",
      blocks: [
        {
          type: "p",
          html: "Список (<code>list</code>) — упорядоченная <b>изменяемая</b> коллекция элементов. Элементы могут быть любого типа, в том числе разных."
        },
        {
          type: "code",
          code: 'numbers = [1, 2, 3]\nmixed = [1, "hello", 3.14, True]\nempty = []\nalso_empty = list()\nchars = list("abc")\nnums = list(range(5))\n\nprint(mixed)\nprint(chars)\nprint(nums)',
          output: "[1, 'hello', 3.14, True]\n['a', 'b', 'c']\n[0, 1, 2, 3, 4]"
        },
        {
          type: "p",
          html: "Списки нужны, чтобы хранить наборы данных (оценки, имена, координаты) вместо десятков отдельных переменных."
        },
        {
          type: "note",
          html: "Подумай: как бы ты хранил оценки 30 студентов без списка?"
        }
      ]
    },
    {
      id: "l1_list_t2",
      type: "theory",
      title: "Индексы и срезы",
      blocks: [
        {
          type: "p",
          html: "Каждый элемент списка имеет номер (индекс). Нумерация с начала идёт с нуля, нумерация с конца — с <code>-1</code>."
        },
        {
          type: "table",
          head: ["", "яблоко", "банан", "вишня", "груша"],
          rows: [
            ["Индекс", "0", "1", "2", "3"],
            ["Отрицательный индекс", "-4", "-3", "-2", "-1"]
          ]
        },
        {
          type: "code",
          code: 'fruits = ["яблоко", "банан", "вишня", "груша"]\n\nprint(fruits[0])\nprint(fruits[-1])\nprint(len(fruits))',
          output: "яблоко\nгруша\n4"
        },
        {
          type: "note",
          html: "Обращение к несуществующему индексу, например <code>fruits[10]</code>, вызывает <code>IndexError</code>."
        },
        {
          type: "p",
          html: "<b>Срезы</b> записываются как <code>список[start:stop:step]</code>. Элемент с индексом <code>stop</code> в срез не входит."
        },
        {
          type: "code",
          code: 'nums = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]\n\nprint(nums[2:5])\nprint(nums[:3])\nprint(nums[7:])\nprint(nums[::2])\nprint(nums[::-1])\nprint(nums[-3:])',
          output: "[2, 3, 4]\n[0, 1, 2]\n[7, 8, 9]\n[0, 2, 4, 6, 8]\n[9, 8, 7, 6, 5, 4, 3, 2, 1, 0]\n[7, 8, 9]"
        },
        {
          type: "note",
          html: "Срез всегда возвращает <b>новый</b> список и не вызывает <code>IndexError</code> при выходе за границы."
        },
        {
          type: "p",
          html: "Полезные операции со списками:"
        },
        {
          type: "code",
          code: 'nums = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]\n\nprint(3 in nums)\nprint([1, 2] + [3, 4])\nprint([0] * 5)\nprint(min(nums), max(nums), sum(nums))',
          output: "True\n[1, 2, 3, 4]\n[0, 0, 0, 0, 0]\n0 9 45"
        }
      ]
    },
    {
      id: "l1_list_p1",
      type: "predict",
      title: "Срез строки",
      explanation: [
        "Строки тоже поддерживают индексы и срезы. Определи, какой вывод появится в консоли."
      ],
      code: 'print("python"[::-1])',
      expectedOutput: "nohtyp",
      explain: "Срез с шагом -1 проходит по строке с конца в начало, поэтому символы выводятся в обратном порядке."
    },
    {
      id: "l1_list_t3",
      type: "theory",
      title: "Изменяемость и методы",
      blocks: [
        {
          type: "p",
          html: "Главное отличие списка от строк и кортежей: его можно менять на месте."
        },
        {
          type: "code",
          code: 'a = [1, 2, 3]\na[0] = 100\nprint(a)\n\na[1:3] = [20, 30, 40]\nprint(a)',
          output: "[100, 2, 3]\n[100, 20, 30, 40]"
        },
        {
          type: "p",
          html: "При замене среза длина списка может меняться."
        },
        {
          type: "p",
          html: "<b>Добавление элементов</b>"
        },
        {
          type: "table",
          head: ["Метод", "Что делает", "Пример"],
          rows: [
            ["<code>append(x)</code>", "добавляет в конец", "<code>a.append(5)</code>"],
            ["<code>insert(i, x)</code>", "вставляет на позицию <code>i</code>", "<code>a.insert(0, 9)</code>"],
            ["<code>extend(iter)</code>", "добавляет все элементы", "<code>a.extend([7, 8])</code>"]
          ]
        },
        {
          type: "note",
          html: "Частая ошибка: <code>a.append([7, 8])</code> добавит <b>один</b> элемент-список, а не два числа."
        },
        {
          type: "p",
          html: "<b>Удаление элементов</b>"
        },
        {
          type: "table",
          head: ["Метод", "Что делает"],
          rows: [
            ["<code>pop()</code> / <code>pop(i)</code>", "удаляет и <b>возвращает</b> элемент (по умолчанию последний)"],
            ["<code>remove(x)</code>", "удаляет первое значение <code>x</code> (<code>ValueError</code>, если его нет)"],
            ["<code>del a[i]</code>, <code>del a[1:3]</code>", "удаляет по индексу или по срезу"],
            ["<code>clear()</code>", "очищает список"]
          ]
        },
        {
          type: "p",
          html: "<b>Поиск и порядок</b>"
        },
        {
          type: "code",
          code: 'a = [3, 1, 4, 1, 5]\n\nprint(a.index(4))\nprint(a.count(1))\n\na.sort()\nprint(a)\na.sort(reverse=True)\nprint(a)\na.reverse()\nprint(a)\n\nprint(sorted(a))',
          output: "2\n2\n[1, 1, 3, 4, 5]\n[5, 4, 3, 1, 1]\n[1, 1, 3, 4, 5]\n[1, 1, 3, 4, 5]"
        },
        {
          type: "p",
          html: "Метод <code>a.sort()</code> меняет список на месте, а функция <code>sorted(a)</code> возвращает <b>новый</b> список."
        },
        {
          type: "p",
          html: "<b>Важная ловушка</b>"
        },
        {
          type: "code",
          code: 'a = [3, 1, 2]\nb = a.sort()\nprint(b)',
          output: "None"
        },
        {
          type: "note",
          html: "Методы, которые меняют список на месте, возвращают <code>None</code>."
        }
      ]
    },
    {
      id: "l1_list_t4",
      type: "theory",
      title: "Перебор и генераторы списков",
      blocks: [
        {
          type: "p",
          html: "Список можно перебирать циклом <code>for</code>. Функция <code>enumerate</code> даёт номер и элемент, функция <code>zip</code> перебирает несколько списков параллельно."
        },
        {
          type: "code",
          code: 'fruits = ["яблоко", "банан", "вишня", "груша"]\n\nfor fruit in fruits:\n    print(fruit)\n\nfor i, fruit in enumerate(fruits):\n    print(i, fruit)\n\nfor a, b in zip([1, 2, 3], ["x", "y", "z"]):\n    print(a, b)',
          output: "яблоко\nбанан\nвишня\nгруша\n0 яблоко\n1 банан\n2 вишня\n3 груша\n1 x\n2 y\n3 z"
        },
        {
          type: "p",
          html: "<b>Генератор списка</b> (list comprehension) — компактный способ создать список."
        },
        {
          type: "code",
          code: 'squares = [x ** 2 for x in range(1, 6)]\nevens = [x for x in range(20) if x % 2 == 0]\nlengths = [len(w) for w in ["кот", "собака"]]\n\nprint(squares)\nprint(evens)\nprint(lengths)',
          output: "[1, 4, 9, 16, 25]\n[0, 2, 4, 6, 8, 10, 12, 14, 16, 18]\n[3, 6]"
        },
        {
          type: "p",
          html: "Тот же список квадратов через обычный цикл:"
        },
        {
          type: "code",
          code: 'squares = []\nfor x in range(1, 6):\n    squares.append(x ** 2)\n\nprint(squares)',
          output: "[1, 4, 9, 16, 25]"
        },
        {
          type: "note",
          html: "Правило: если генератор списка не помещается в одну читаемую строку, используй обычный цикл."
        }
      ]
    },
    {
      id: "l1_list_t5",
      type: "theory",
      title: "Копирование, вложенные списки, ловушки",
      blocks: [
        {
          type: "p",
          html: "<b>Присваивание не копирует список.</b> После <code>b = a</code> обе переменные ссылаются на один и тот же объект."
        },
        {
          type: "code",
          code: 'a = [1, 2, 3]\nb = a\nb.append(4)\n\nprint(a)',
          output: "[1, 2, 3, 4]"
        },
        {
          type: "p",
          html: "Чтобы получить копию, используй <code>a.copy()</code>, <code>a[:]</code> или <code>list(a)</code>."
        },
        {
          type: "code",
          code: 'a = [1, 2, 3]\nb = a.copy()\nb.append(4)\n\nprint(a)\nprint(b)',
          output: "[1, 2, 3]\n[1, 2, 3, 4]"
        },
        {
          type: "p",
          html: "<b>Вложенные списки</b> (матрицы) — списки, элементами которых являются другие списки:"
        },
        {
          type: "code",
          code: 'matrix = [[1, 2, 3],\n          [4, 5, 6]]\n\nprint(matrix[1][2])',
          output: "6"
        },
        {
          type: "p",
          html: "<b>Классическая ошибка</b> при создании матрицы:"
        },
        {
          type: "code",
          code: 'grid = [[0] * 3] * 3\ngrid[0][0] = 1\nprint(grid)\n\ngrid = [[0] * 3 for _ in range(3)]\ngrid[0][0] = 1\nprint(grid)',
          output: "[[1, 0, 0], [1, 0, 0], [1, 0, 0]]\n[[1, 0, 0], [0, 0, 0], [0, 0, 0]]"
        },
        {
          type: "note",
          html: "Запись <code>[[0] * 3] * 3</code> создаёт три ссылки на <b>один</b> список. Правильный способ — генератор списка с <code>for _ in range(3)</code>."
        },
        {
          type: "note",
          html: "Для вложенных структур <code>.copy()</code> делает только поверхностную копию. Для глубокой копии используется <code>copy.deepcopy</code>."
        }
      ]
    },
    {
      id: "l1_list_t6",
      type: "theory",
      title: "Итоги и шпаргалка",
      blocks: [
        {
          type: "list",
          items: [
            "Список: упорядоченный, изменяемый, элементы любых типов.",
            "Индексы начинаются с 0, отрицательные считаются с конца, срезы записываются как <code>[start:stop:step]</code>.",
            "Добавление: <code>append</code>, <code>insert</code>, <code>extend</code>. Удаление: <code>pop</code>, <code>remove</code>, <code>del</code>. Сортировка: <code>sort</code>, <code>sorted</code>.",
            "Запись <code>b = a</code> не копирует список.",
            "Запись <code>[[0] * n] * m</code> — ловушка."
          ]
        },
        {
          type: "table",
          head: ["Что нужно", "Как"],
          rows: [
            ["Длина", "<code>len(a)</code>"],
            ["Последний элемент", "<code>a[-1]</code>"],
            ["Копия", "<code>a.copy()</code> / <code>a[:]</code>"],
            ["Добавить в конец", "<code>a.append(x)</code>"],
            ["Добавить несколько", "<code>a.extend(items)</code>"],
            ["Удалить по индексу", "<code>a.pop(i)</code> / <code>del a[i]</code>"],
            ["Удалить по значению", "<code>a.remove(x)</code>"],
            ["Отсортировать (новый список)", "<code>sorted(a)</code>"],
            ["Отсортировать (на месте)", "<code>a.sort()</code>"],
            ["Фильтр + преобразование", "<code>[f(x) for x in a if cond(x)]</code>"]
          ]
        }
      ]
    },

    /* ============ РАЗМИНКА: ПРЕДСКАЗАНИЕ ВЫВОДА ============ */
    {
      id: "l1_list_p2",
      type: "predict",
      title: "Разминка 1: срезы",
      explanation: [
        "Посмотри на код и определи, что выведется в консоли. Значения в одной строке разделяются пробелом."
      ],
      code: 'a = [10, 20, 30, 40, 50]\nprint(a[1:4], a[-2], a[::2])',
      expectedOutput: "[20, 30, 40] 40 [10, 30, 50]",
      explain: "a[1:4] берёт элементы с индексами 1, 2, 3. a[-2] — предпоследний элемент. a[::2] берёт каждый второй элемент с начала."
    },
    {
      id: "l1_list_p3",
      type: "predict",
      title: "Разминка 2: append со списком",
      explanation: [
        "Обрати внимание, что именно добавляет метод append."
      ],
      code: 'b = [1, 2, 3]\nb.append([4, 5])\nprint(len(b))',
      expectedOutput: "4",
      explain: "Метод append добавляет один элемент, даже если этот элемент сам является списком. Поэтому в b теперь четыре элемента: 1, 2, 3 и список [4, 5]."
    },
    {
      id: "l1_list_p4",
      type: "predict",
      title: "Разминка 3: две переменные, один список",
      explanation: [
        "Вспомни, что делает присваивание одного списка другой переменной."
      ],
      code: 'c = [1, 2, 3]\nd = c\nd[0] = 99\nprint(c)',
      expectedOutput: "[99, 2, 3]",
      explain: "Присваивание d = c не создаёт копию. Переменные c и d ссылаются на один и тот же список, поэтому изменение через d видно и через c."
    },
    {
      id: "l1_list_p5",
      type: "predict",
      title: "Разминка 4: результат sort",
      explanation: [
        "Вспомни, что возвращают методы, меняющие список на месте."
      ],
      code: 'x = [3, 1, 2]\nprint(x.sort())',
      expectedOutput: "None",
      explain: "Метод sort сортирует список на месте и возвращает None. Функция print выводит именно это возвращаемое значение."
    },
    {
      id: "l1_list_p6",
      type: "predict",
      title: "Разминка 5: генератор списка",
      explanation: [
        "Определи, какой список будет построен."
      ],
      code: 'print([i * 2 for i in range(4)])',
      expectedOutput: "[0, 2, 4, 6]",
      explain: "range(4) даёт числа 0, 1, 2, 3. Каждое число умножается на 2."
    },

    /* ============ БАЗОВЫЕ ЗАДАЧИ ============ */
    {
      id: "l1_list_c1",
      type: "code",
      tier: "warmup",
      title: "Статистика по оценкам",
      explanation: [
        "Для работы со списком чисел подходят функции len, sum, max и метод count."
      ],
      assignment: "Дан список grades = [4, 5, 3, 5, 4, 2, 5]. Выведи одной строкой через пробел четыре значения в таком порядке: количество оценок, среднее арифметическое, максимальную оценку, сколько раз встречается оценка 5.",
      starterCode: "grades = [4, 5, 3, 5, 4, 2, 5]\n\n# Выведи: количество, среднее, максимум, число пятёрок\n",
      expectedOutput: "7 4.0 5 3",
      hints: [
        "Передай в один print четыре значения через запятую: длину списка, сумму, делённую на длину, максимум и количество пятёрок через метод count.",
        { code: "grades = [4, 5, 3, 5, 4, 2, 5]\n\nprint(len(grades), sum(grades) / len(grades), ___(grades), grades.count(___))" },
        { code: "grades = [4, 5, 3, 5, 4, 2, 5]\n\nprint(len(grades), sum(grades) / len(grades), max(grades), grades.count(5))" }
      ],
      successMessage: "Статистика по списку оценок посчитана."
    },
    {
      id: "l1_list_c2",
      type: "code",
      tier: "warmup",
      title: "Функция reverse_list",
      explanation: [
        "Список можно развернуть срезом, функцией reversed() или циклом."
      ],
      assignment: "Напиши функцию reverse_list(a), которая возвращает новый список с элементами в обратном порядке. Метод reverse() использовать нельзя. Способ (срез, reversed() или цикл) выбери любой.",
      starterCode: "# Напиши функцию reverse_list(a) без метода reverse()\n",
      astRequirements: {
        require_def: true,
        require_return: true,
        forbid_methods: ["reverse"]
      },
      tests: [
        { call: "str(reverse_list([1, 2, 3, 4]))", returns: "[4, 3, 2, 1]" },
        { call: "str(reverse_list([]))", returns: "[]" },
        { call: "str(reverse_list([5]))", returns: "[5]", hidden: true },
        { call: 'str(reverse_list(["a", "b", "c"]))', returns: "['c', 'b', 'a']", hidden: true }
      ],
      hints: [
        "Самый короткий способ — срез с шагом -1: он возвращает новый список в обратном порядке.",
        { code: "def reverse_list(a):\n    return a[::___]\n\nprint(reverse_list([1, 2, 3, 4]))" },
        { code: "def reverse_list(a):\n    return a[::-1]\n\nprint(reverse_list([1, 2, 3, 4]))" }
      ],
      improveTip: "Попробуй решить задачу ещё двумя способами: через list(reversed(a)) и через цикл с a.insert(0, x).",
      successMessage: "Функция reverse_list возвращает список в обратном порядке."
    },
    {
      id: "l1_list_c3",
      type: "code",
      tier: "warmup",
      title: "Функция even_odd",
      explanation: [
        "Число чётное, если остаток от деления на 2 равен нулю. Функция может вернуть два значения через запятую."
      ],
      assignment: "Напиши функцию even_odd(nums), которая принимает список чисел и возвращает два списка: сначала список чётных чисел, затем список нечётных. Порядок чисел в каждом списке сохраняется. Например, even_odd([1, 2, 3, 4, 5]) возвращает ([2, 4], [1, 3, 5]).",
      starterCode: "# Напиши функцию even_odd(nums)\n",
      astRequirements: {
        require_def: true,
        require_return: true
      },
      tests: [
        { call: "str(even_odd([1, 2, 3, 4, 5]))", returns: "([2, 4], [1, 3, 5])" },
        { call: "str(even_odd([2, 4]))", returns: "([2, 4], [])" },
        { call: "str(even_odd([]))", returns: "([], [])", hidden: true },
        { call: "str(even_odd([7]))", returns: "([], [7])", hidden: true }
      ],
      hints: [
        "Создай два пустых списка, пройди по nums циклом и добавь число в нужный список в зависимости от остатка от деления на 2. В конце верни оба списка.",
        { code: "def even_odd(nums):\n    evens = []\n    odds = []\n    for x in nums:\n        if x % 2 == ___:\n            evens.append(x)\n        else:\n            odds.append(x)\n    return evens, odds" },
        { code: "def even_odd(nums):\n    evens = []\n    odds = []\n    for x in nums:\n        if x % 2 == 0:\n            evens.append(x)\n        else:\n            odds.append(x)\n    return evens, odds\n\nprint(even_odd(list(range(1, 21))))" }
      ],
      improveTip: "Реши задачу вторым способом: каждый из двух списков можно построить через генератор списка с условием.",
      successMessage: "Функция even_odd разделяет числа на чётные и нечётные."
    },
    {
      id: "l1_list_c4",
      type: "code",
      tier: "warmup",
      title: "Функция desc_and_sum",
      explanation: [
        "Строку с числами через пробел превращают в список методом split(). Каждый элемент после этого нужно привести к int."
      ],
      assignment: "Напиши функцию desc_and_sum(line), которая принимает строку с целыми числами через пробел (например, \"3 1 2\") и возвращает два значения: список этих чисел типа int, отсортированный по убыванию, и сумму чисел. Например, desc_and_sum(\"3 1 2\") возвращает ([3, 2, 1], 6).",
      starterCode: "# Напиши функцию desc_and_sum(line)\n",
      astRequirements: {
        require_def: true,
        require_return: true
      },
      tests: [
        { call: 'str(desc_and_sum("3 1 2"))', returns: "([3, 2, 1], 6)" },
        { call: 'str(desc_and_sum("10"))', returns: "([10], 10)" },
        { call: 'str(desc_and_sum("5 5 -1"))', returns: "([5, 5, -1], 9)", hidden: true }
      ],
      hints: [
        "Разбей строку методом split(), преврати каждый элемент в int с помощью генератора списка, затем верни sorted(nums, reverse=True) и sum(nums).",
        { code: "def desc_and_sum(line):\n    nums = [int(x) for x in line.___()]\n    return sorted(nums, reverse=True), sum(nums)" },
        { code: "def desc_and_sum(line):\n    nums = [int(x) for x in line.split()]\n    return sorted(nums, reverse=True), sum(nums)\n\nprint(desc_and_sum(\"3 1 2\"))" }
      ],
      successMessage: "Функция desc_and_sum превращает строку в список и считает сумму."
    },
    {
      id: "l1_list_c5",
      type: "code",
      tier: "warmup",
      title: "Функция unique_ordered",
      explanation: [
        "Оператор in позволяет проверить, есть ли элемент в списке. Порядок первых вхождений должен сохраниться."
      ],
      assignment: "Напиши функцию unique_ordered(items), которая возвращает новый список без повторяющихся элементов. Элементы остаются в том порядке, в котором они впервые встретились. Например, unique_ordered([1, 2, 2, 3, 1, 4, 3]) возвращает [1, 2, 3, 4].",
      starterCode: "# Напиши функцию unique_ordered(items)\n",
      astRequirements: {
        require_def: true,
        require_return: true
      },
      tests: [
        { call: "str(unique_ordered([1, 2, 2, 3, 1, 4, 3]))", returns: "[1, 2, 3, 4]" },
        { call: "str(unique_ordered([]))", returns: "[]" },
        { call: "str(unique_ordered([3, 1, 3, 2]))", returns: "[3, 1, 2]", hidden: true }
      ],
      hints: [
        "Создай пустой список result. Пройди циклом по items и добавляй элемент в result, только если его там ещё нет. В конце верни result.",
        { code: "def unique_ordered(items):\n    result = []\n    for x in items:\n        if x ___ result:\n            result.append(x)\n    return result" },
        { code: "def unique_ordered(items):\n    result = []\n    for x in items:\n        if x not in result:\n            result.append(x)\n    return result\n\nprint(unique_ordered([1, 2, 2, 3, 1, 4, 3]))" }
      ],
      successMessage: "Дубликаты удалены, порядок элементов сохранён."
    },

    /* ============ ЗАДАЧИ СРЕДНЕЙ СЛОЖНОСТИ ============ */
    {
      id: "l1_list_c6",
      type: "code",
      tier: "main",
      title: "Функция second_max",
      explanation: [
        "Повторяющиеся значения считаются один раз: во втором максимуме для [4, 9, 1, 9, 7] ответ равен 7, а не 9. Сортировкой пользоваться нельзя."
      ],
      assignment: "Напиши функцию second_max(nums), которая возвращает второе по величине число в списке. Повторяющиеся значения считаются один раз. В списке гарантированно есть минимум два разных числа. Использовать sort() и sorted() нельзя.",
      starterCode: "# Напиши функцию second_max(nums) без sort() и sorted()\n",
      astRequirements: {
        require_def: true,
        require_return: true,
        forbid_calls: ["sorted"],
        forbid_methods: ["sort"]
      },
      tests: [
        { call: "second_max([4, 9, 1, 9, 7])", returns: 7 },
        { call: "second_max([1, 2])", returns: 1 },
        { call: "second_max([5, 5, 3])", returns: 3, hidden: true },
        { call: "second_max([-1, -5, -3])", returns: -3, hidden: true }
      ],
      hints: [
        "Получи уникальные значения через list(set(nums)), найди максимум, удали его из списка методом remove и снова найди максимум.",
        { code: "def second_max(nums):\n    unique = list(set(nums))\n    first = max(unique)\n    unique.remove(___)\n    return max(unique)" },
        { code: "def second_max(nums):\n    unique = list(set(nums))\n    first = max(unique)\n    unique.remove(first)\n    return max(unique)\n\nprint(second_max([4, 9, 1, 9, 7]))" }
      ],
      successMessage: "Второй максимум найден без сортировки."
    },
    {
      id: "l1_list_c7",
      type: "code",
      tier: "main",
      title: "Функция shift_right",
      explanation: [
        "Сдвиг на k позиций вправо можно получить сложением двух срезов: последние k элементов и всё остальное."
      ],
      assignment: "Напиши функцию shift_right(a, k), которая возвращает новый список, циклически сдвинутый вправо на k позиций. Например, shift_right([1, 2, 3, 4, 5], 2) возвращает [4, 5, 1, 2, 3]. Значение k может быть больше длины списка. Список a непустой.",
      starterCode: "# Напиши функцию shift_right(a, k)\n",
      astRequirements: {
        require_def: true,
        require_return: true
      },
      tests: [
        { call: "str(shift_right([1, 2, 3, 4, 5], 2))", returns: "[4, 5, 1, 2, 3]" },
        { call: "str(shift_right([1, 2, 3], 1))", returns: "[3, 1, 2]" },
        { call: "str(shift_right([1, 2, 3, 4, 5], 0))", returns: "[1, 2, 3, 4, 5]", hidden: true },
        { call: "str(shift_right([1, 2, 3, 4, 5], 7))", returns: "[4, 5, 1, 2, 3]", hidden: true }
      ],
      hints: [
        "Сначала приведи k к диапазону длины списка: k = k % len(a). Затем сложи срез из последних k элементов со срезом всего, что до них.",
        { code: "def shift_right(a, k):\n    k = k % len(a)\n    return a[-k:] + a[:___]" },
        { code: "def shift_right(a, k):\n    k = k % len(a)\n    return a[-k:] + a[:-k]\n\nprint(shift_right([1, 2, 3, 4, 5], 2))" }
      ],
      successMessage: "Циклический сдвиг списка реализован через срезы."
    },
    {
      id: "l1_list_c8",
      type: "code",
      tier: "main",
      title: "Функция long_words_upper",
      explanation: [
        "Строку делят на слова методом split(). Фильтр по длине и приведение к верхнему регистру удобно записать генератором списка."
      ],
      assignment: "Напиши функцию long_words_upper(text), которая возвращает список слов строки text, длина которых строго больше 3, приведённых к верхнему регистру. Порядок слов сохраняется.",
      starterCode: "# Напиши функцию long_words_upper(text)\n",
      astRequirements: {
        require_def: true,
        require_return: true
      },
      tests: [
        { call: 'str(long_words_upper("Python это очень удобный язык для новичков"))', returns: "['PYTHON', 'ОЧЕНЬ', 'УДОБНЫЙ', 'ЯЗЫК', 'НОВИЧКОВ']" },
        { call: 'str(long_words_upper("a bb ccc dddd"))', returns: "['DDDD']", hidden: true },
        { call: 'str(long_words_upper(""))', returns: "[]", hidden: true }
      ],
      hints: [
        "Раздели text методом split() и построй генератор списка: для каждого слова w с условием len(w) > 3 бери w.upper().",
        { code: "def long_words_upper(text):\n    return [w.___() for w in text.split() if len(w) > 3]" },
        { code: "def long_words_upper(text):\n    return [w.upper() for w in text.split() if len(w) > 3]\n\nprint(long_words_upper(\"Python это очень удобный язык для новичков\"))" }
      ],
      successMessage: "Функция long_words_upper фильтрует и преобразует слова в одной строке."
    },
    {
      id: "l1_list_c9",
      type: "code",
      tier: "main",
      title: "Таблица умножения 5×5",
      explanation: [
        "Вложенный список строится двумя вложенными генераторами: внешний создаёт строки, внутренний — элементы строки."
      ],
      assignment: "Создай таблицу умножения 5×5 как вложенный список: в строке с номером i (от 1 до 5) на позиции j (от 1 до 5) стоит число i * j. Выведи таблицу построчно: каждая строка выводится как список отдельным вызовом print.",
      starterCode: "# Создай таблицу умножения 5x5 и выведи её построчно\n",
      expectedOutput: "[1, 2, 3, 4, 5]\n[2, 4, 6, 8, 10]\n[3, 6, 9, 12, 15]\n[4, 8, 12, 16, 20]\n[5, 10, 15, 20, 25]",
      hints: [
        "Внешний генератор перебирает i от 1 до 5, внутренний перебирает j от 1 до 5 и даёт i * j. Затем выведи каждую строку циклом for.",
        { code: "table = [[i * j for j in range(1, 6)] for i in range(1, ___)]\nfor row in table:\n    print(row)" },
        { code: "table = [[i * j for j in range(1, 6)] for i in range(1, 6)]\nfor row in table:\n    print(row)" }
      ],
      successMessage: "Таблица умножения построена как вложенный список."
    },
    {
      id: "l1_list_f1",
      type: "code",
      tier: "main",
      kind: "fix",
      title: "Найди ошибку: общий внутренний список",
      explanation: [
        "Запись [[\".\"] * 3] * 3 создаёт три ссылки на один и тот же внутренний список. Изменение одной строки меняет все."
      ],
      assignment: "Программа ставит X сразу в каждую строку поля. Исправь создание board так, чтобы X оказался только в центре: во второй строке на второй позиции. Программа должна вывести: [['.', '.', '.'], ['.', 'X', '.'], ['.', '.', '.']]",
      starterCode: 'board = [["."] * 3] * 3\nboard[1][1] = "X"\nprint(board)\n',
      expectedOutput: "[['.', '.', '.'], ['.', 'X', '.'], ['.', '.', '.']]",
      hints: [
        "Все три строки — один и тот же список. Создай каждую строку отдельно с помощью генератора списка и for _ in range(3).",
        { code: "board = [[\".\"] * 3 for _ in ___(3)]\nboard[1][1] = \"X\"\nprint(board)" },
        { code: "board = [[\".\"] * 3 for _ in range(3)]\nboard[1][1] = \"X\"\nprint(board)" }
      ],
      successMessage: "Ошибка исправлена: каждая строка поля теперь отдельный список."
    },

    /* ============ ЗВЁЗДОЧКИ (из домашнего задания) ============ */
    {
      id: "l1_list_c10",
      type: "code",
      tier: "star",
      optional: true,
      title: "Функция longest_words",
      explanation: [
        "Сначала нужно найти максимальную длину слова, затем выбрать все слова такой длины."
      ],
      assignment: "Напиши функцию longest_words(words), которая принимает непустой список слов и возвращает список всех слов, длина которых равна длине самого длинного слова. Порядок слов сохраняется. Например, longest_words([\"аб\", \"вг\", \"д\"]) возвращает [\"аб\", \"вг\"].",
      starterCode: "# Напиши функцию longest_words(words)\n",
      astRequirements: {
        require_def: true,
        require_return: true
      },
      tests: [
        { call: 'str(longest_words(["кот", "собака", "лиса", "слон", "утка"]))', returns: "['собака']" },
        { call: 'str(longest_words(["аб", "вг", "д"]))', returns: "['аб', 'вг']" },
        { call: 'str(longest_words(["кот", "пёс", "лев"]))', returns: "['кот', 'пёс', 'лев']", hidden: true }
      ],
      hints: [
        "Найди максимальную длину циклом по словам, затем верни генератор списка со словами, длина которых равна максимальной.",
        { code: "def longest_words(words):\n    max_len = 0\n    for w in words:\n        if len(w) > max_len:\n            max_len = ___\n    return [w for w in words if len(w) == max_len]" },
        { code: "def longest_words(words):\n    max_len = 0\n    for w in words:\n        if len(w) > max_len:\n            max_len = len(w)\n    return [w for w in words if len(w) == max_len]\n\nprint(longest_words([\"кот\", \"собака\", \"лиса\"]))" }
      ],
      successMessage: "Все самые длинные слова найдены."
    },
    {
      id: "l1_list_c11",
      type: "code",
      tier: "star",
      optional: true,
      title: "Функция transpose",
      explanation: [
        "При транспонировании строки матрицы становятся столбцами: элемент m[i][j] переходит на позицию [j][i]. Не забудь про ловушку с [[0] * 3] * 3."
      ],
      assignment: "Напиши функцию transpose(m), которая принимает матрицу 3×3 (список из трёх списков по три числа) и возвращает новую транспонированную матрицу. Например, transpose([[1, 2, 3], [4, 5, 6], [7, 8, 9]]) возвращает [[1, 4, 7], [2, 5, 8], [3, 6, 9]].",
      starterCode: "# Напиши функцию transpose(m) для матрицы 3x3\n",
      astRequirements: {
        require_def: true,
        require_return: true
      },
      tests: [
        { call: "str(transpose([[1, 2, 3], [4, 5, 6], [7, 8, 9]]))", returns: "[[1, 4, 7], [2, 5, 8], [3, 6, 9]]" },
        { call: "str(transpose([[1, 2, 3], [1, 2, 3], [1, 2, 3]]))", returns: "[[1, 1, 1], [2, 2, 2], [3, 3, 3]]", hidden: true }
      ],
      hints: [
        "Создай новую матрицу 3×3 из нулей через генератор списка, затем двумя вложенными циклами запиши result[j][i] = m[i][j].",
        { code: "def transpose(m):\n    result = [[0] * 3 for _ in range(3)]\n    for i in range(3):\n        for j in range(3):\n            result[___][___] = m[i][j]\n    return result" },
        { code: "def transpose(m):\n    result = [[0] * 3 for _ in range(3)]\n    for i in range(3):\n        for j in range(3):\n            result[j][i] = m[i][j]\n    return result\n\nprint(transpose([[1, 2, 3], [4, 5, 6], [7, 8, 9]]))" }
      ],
      successMessage: "Матрица транспонирована."
    }
  ]
});
