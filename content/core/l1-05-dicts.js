/**
 * Тема этапа 2: Словари (углублённая практика)
 */

window.COURSE_TOPICS = window.COURSE_TOPICS || [];

window.COURSE_TOPICS.push({
  id: "l1_dicts",
  title: "Словари",
  minutes: 60,
  items: [
    {
      id: "l1_dict_t1",
      type: "theory",
      title: "Словарь: ключ и значение",
      blocks: [
        {
          type: "p",
          html: "Список хранит значения по номерам: <code>0</code>, <code>1</code>, <code>2</code>. Это неудобно, когда данные нужно искать по смыслу: цена по названию товара, возраст по имени, перевод по слову. Для таких задач в Python есть <b>словарь</b> (<code>dict</code>)."
        },
        {
          type: "p",
          html: "Словарь — это набор пар <b>ключ: значение</b>. Пары пишутся в фигурных скобках через запятую. По ключу можно мгновенно получить связанное с ним значение."
        },
        {
          type: "code",
          code: 'user = {"name": "Алиса", "age": 25}\n\nprint(user["name"])\nprint(user["age"])',
          output: "Алиса\n25"
        },
        {
          type: "list",
          items: [
            "Ключ и значение разделяются двоеточием: <code>\"name\": \"Алиса\"</code>.",
            "Значением может быть любой объект: число, строка, список, другой словарь.",
            "Ключи в словаре <b>уникальны</b>: два одинаковых ключа в одном словаре невозможны.",
            "Пустой словарь создаётся так: <code>data = {}</code>.",
            "Начиная с Python 3.7 словарь помнит порядок, в котором в него добавляли пары."
          ]
        },
        {
          type: "note",
          html: "Если обратиться к ключу, которого в словаре нет, Python выдаст <code>KeyError</code>. Это самая частая ошибка при работе со словарями."
        }
      ]
    },
    {
      id: "l1_dict_q1",
      type: "quiz",
      title: "Обращение к несуществующему ключу",
      question: "Что произойдёт при запуске этого кода?",
      code: 'prices = {"чай": 100, "кофе": 150}\nprint(prices["сок"])',
      options: [
        "Выведется 0",
        "Выведется None",
        "Будет KeyError",
        "Будет IndexError"
      ],
      correct: 2,
      explain: "Ключа «сок» в словаре нет. При обращении через квадратные скобки Python выдаёт KeyError. IndexError относится к спискам и номерам элементов."
    },
    {
      id: "l1_dict_t2",
      type: "theory",
      title: "Добавление, изменение, удаление",
      blocks: [
        {
          type: "p",
          html: "Словарь можно менять после создания. Для добавления и изменения используется одна и та же запись <code>d[ключ] = значение</code>:"
        },
        {
          type: "list",
          items: [
            "Если ключа в словаре нет, пара <b>добавляется</b>.",
            "Если ключ уже есть, его значение <b>заменяется</b>."
          ]
        },
        {
          type: "code",
          code: 'stock = {"яблоки": 5}\n\nstock["груши"] = 3      # новый ключ\nstock["яблоки"] = 8     # ключ уже был, значение заменено\ndel stock["груши"]      # удаление пары\n\nprint(stock)\nprint(len(stock))',
          output: "{'яблоки': 8}\n1"
        },
        {
          type: "table",
          head: ["Действие", "Запись", "Результат"],
          rows: [
            ["Получить значение", "<code>d[\"a\"]</code>", "Значение по ключу, <code>KeyError</code> если ключа нет"],
            ["Добавить или изменить", "<code>d[\"a\"] = 1</code>", "Пара записана в словарь"],
            ["Удалить пару", "<code>del d[\"a\"]</code>", "Пары больше нет, <code>KeyError</code> если ключа нет"],
            ["Проверить наличие ключа", "<code>\"a\" in d</code>", "<code>True</code> или <code>False</code>"],
            ["Количество пар", "<code>len(d)</code>", "Целое число"]
          ]
        },
        {
          type: "note",
          html: "Оператор <code>in</code> проверяет именно <b>ключи</b>, а не значения. Выражение <code>1 in {\"a\": 1}</code> даёт <code>False</code>."
        }
      ]
    },
    {
      id: "l1_dict_p1",
      type: "predict",
      title: "Изменение значений словаря",
      explanation: [
        "Посмотри на код программы и определи, какой вывод появится в консоли при запуске. Обрати внимание на порядок строк."
      ],
      code: 'd = {"a": 1, "b": 2}\nd["c"] = d["a"] + d["b"]\nd["a"] = 10\nprint(d["a"], d["c"])',
      expectedOutput: "10 3",
      explain: "Сначала в ключ c записывается сумма 1 + 2 = 3. Затем значение ключа a заменяется на 10. Значение ключа c уже посчитано и от этого не меняется, поэтому вывод: 10 3."
    },
    {
      id: "l1_dict_t3",
      type: "theory",
      title: "Безопасное чтение: in и get",
      blocks: [
        {
          type: "p",
          html: "Чтобы не получить <code>KeyError</code>, перед чтением можно проверить наличие ключа оператором <code>in</code>:"
        },
        {
          type: "code",
          code: 'prices = {"чай": 100, "кофе": 150}\n\nif "сок" in prices:\n    print(prices["сок"])\nelse:\n    print("Такого товара нет")',
          output: "Такого товара нет"
        },
        {
          type: "p",
          html: "Короче и удобнее метод <code>get</code>. Он принимает ключ и необязательное значение по умолчанию. Если ключ найден, возвращается его значение. Если нет, возвращается значение по умолчанию, а когда оно не указано, возвращается <code>None</code>. Ошибки при этом не возникает."
        },
        {
          type: "code",
          code: 'prices = {"чай": 100, "кофе": 150}\n\nprint(prices.get("чай"))\nprint(prices.get("сок"))\nprint(prices.get("сок", 0))',
          output: "100\nNone\n0"
        },
        {
          type: "note",
          html: "Метод <code>get</code> только читает словарь и ничего в него не записывает. После <code>prices.get(\"сок\", 0)</code> ключа «сок» в словаре по-прежнему нет."
        }
      ]
    },
    {
      id: "l1_dict_q2",
      type: "quiz",
      title: "Результат get без значения по умолчанию",
      question: "Что выведет эта программа?",
      code: 'd = {"x": 1}\nprint(d.get("y"))',
      options: [
        "0",
        "None",
        "KeyError",
        "Пустую строку"
      ],
      correct: 1,
      explain: "Метод get не вызывает ошибку. Если ключа нет и значение по умолчанию не указано, возвращается None."
    },
    {
      id: "l1_dict_p2",
      type: "predict",
      title: "in и get на практике",
      explanation: [
        "Определи, что выведет программа. Вспомни, что оператор in проверяет ключи, а не значения."
      ],
      code: 'd = {"x": 1, "y": 2}\nprint("x" in d, 1 in d)\nprint(d.get("z"))\nprint(d.get("z", 0))',
      expectedOutput: "True False\nNone\n0",
      explain: "Ключ \"x\" в словаре есть, поэтому True. Число 1 — это значение, а не ключ, поэтому False. Ключа \"z\" нет: get без второго аргумента даёт None, а с аргументом 0 даёт 0."
    },
    {
      id: "l1_dict_c1",
      type: "code",
      tier: "warmup",
      title: "Функция get_price",
      explanation: [
        "Метод get возвращает значение по ключу или значение по умолчанию, если ключа нет."
      ],
      assignment: "Напиши функцию get_price(prices, name), которая возвращает цену товара name из словаря prices. Если товара в словаре нет, функция возвращает 0. Затем для словаря {\"чай\": 100, \"кофе\": 150} выведи цены для названий \"чай\" и \"сок\".",
      starterCode: "# Напиши функцию get_price(prices, name)\n",
      astRequirements: {
        require_def: true,
        require_return: true
      },
      tests: [
        { call: 'get_price({"чай": 100, "кофе": 150}, "чай")', returns: 100 },
        { call: 'get_price({"чай": 100, "кофе": 150}, "сок")', returns: 0 },
        { call: 'get_price({}, "чай")', returns: 0, hidden: true },
        { call: 'get_price({"чай": 0}, "чай")', returns: 0, hidden: true }
      ],
      hints: [
        "Вызови у словаря метод get и передай вторым аргументом значение по умолчанию 0. Результат верни через return.",
        { code: "def get_price(prices, name):\n    return prices.get(name, ___)\n\nmenu = {\"чай\": 100, \"кофе\": 150}\nprint(get_price(menu, \"чай\"))\nprint(get_price(menu, \"сок\"))" },
        { code: "def get_price(prices, name):\n    return prices.get(name, 0)\n\nmenu = {\"чай\": 100, \"кофе\": 150}\nprint(get_price(menu, \"чай\"))\nprint(get_price(menu, \"сок\"))" }
      ],
      improveTip: "Метод get заменяет связку из проверки in и if/else одной строкой.",
      successMessage: "Функция get_price безопасно читает значения из словаря."
    },
    {
      id: "l1_dict_t4",
      type: "theory",
      title: "Перебор словаря: keys, values, items",
      blocks: [
        {
          type: "p",
          html: "Цикл <code>for</code> по словарю по умолчанию перебирает <b>ключи</b>:"
        },
        {
          type: "code",
          code: 'scores = {"Аня": 5, "Борис": 3, "Вера": 4}\n\nfor name in scores:\n    print(name)',
          output: "Аня\nБорис\nВера"
        },
        {
          type: "p",
          html: "Для других вариантов перебора у словаря есть три метода:"
        },
        {
          type: "table",
          head: ["Метод", "Что перебирает", "Пример цикла"],
          rows: [
            ["<code>d.keys()</code>", "Только ключи", "<code>for k in d.keys():</code>"],
            ["<code>d.values()</code>", "Только значения", "<code>for v in d.values():</code>"],
            ["<code>d.items()</code>", "Пары (ключ, значение)", "<code>for k, v in d.items():</code>"]
          ]
        },
        {
          type: "code",
          code: 'scores = {"Аня": 5, "Борис": 3, "Вера": 4}\n\ntotal = 0\nfor value in scores.values():\n    total += value\nprint(total)\n\nfor name, score in scores.items():\n    print(name, score)',
          output: "12\nАня 5\nБорис 3\nВера 4"
        },
        {
          type: "note",
          html: "Не меняй размер словаря (не добавляй и не удаляй ключи) во время перебора этого же словаря. Python выдаст <code>RuntimeError</code>."
        }
      ]
    },
    {
      id: "l1_dict_q3",
      type: "quiz",
      title: "Что перебирает цикл",
      question: "Что выведет этот код?",
      code: 'd = {"a": 1, "b": 2}\nfor x in d:\n    print(x)',
      options: [
        "1 и 2 на отдельных строках",
        "a и b на отдельных строках",
        "(\"a\", 1) и (\"b\", 2) на отдельных строках",
        "Будет TypeError"
      ],
      correct: 1,
      explain: "Цикл for по словарю без методов перебирает ключи. Чтобы получить значения, нужен d.values(), чтобы получить пары, нужен d.items()."
    },
    {
      id: "l1_dict_p3",
      type: "predict",
      title: "Перебор через items",
      explanation: [
        "Определи, что выведет программа. Переменные name и score на каждом шаге получают ключ и значение очередной пары."
      ],
      code: 'scores = {"Аня": 5, "Борис": 3}\nfor name, score in scores.items():\n    print(name, score * 2)',
      expectedOutput: "Аня 10\nБорис 6",
      explain: "Метод items отдаёт пары по порядку добавления. Для первой пары score равно 5, на экран выводится удвоенное значение 10. Для второй пары 3 * 2 = 6."
    },
    {
      id: "l1_dict_f1",
      type: "code",
      tier: "warmup",
      kind: "fix",
      title: "Найди ошибку: обновление отсутствующего ключа",
      explanation: [
        "Выражение stock[name] += count сначала читает текущее значение. Если ключа нет, чтение приводит к KeyError."
      ],
      assignment: "Программа падает с ошибкой KeyError на втором вызове. Исправь функцию add_item так, чтобы она работала и для существующих, и для новых товаров. Программа должна вывести две строки: 7 и 3.",
      starterCode: 'def add_item(stock, name, count):\n    stock[name] += count\n    return stock[name]\n\nstock = {"яблоки": 5}\nprint(add_item(stock, "яблоки", 2))\nprint(add_item(stock, "груши", 3))\n',
      astRequirements: {
        require_def: true,
        require_return: true
      },
      expectedOutput: "7\n3",
      tests: [
        { call: 'add_item({"a": 1}, "a", 2)', returns: 3 },
        { call: 'add_item({}, "b", 4)', returns: 4 },
        { call: 'add_item({"x": 0}, "y", 1)', returns: 1, hidden: true }
      ],
      hints: [
        "Для нового ключа текущего значения нет. Прочитай его через get с значением по умолчанию 0 и запиши сумму обратно в словарь.",
        { code: "def add_item(stock, name, count):\n    stock[name] = stock.get(name, ___) + count\n    return stock[name]" },
        { code: "def add_item(stock, name, count):\n    stock[name] = stock.get(name, 0) + count\n    return stock[name]\n\nstock = {\"яблоки\": 5}\nprint(add_item(stock, \"яблоки\", 2))\nprint(add_item(stock, \"груши\", 3))" }
      ],
      improveTip: "Запись d[k] = d.get(k, 0) + 1 — стандартный приём для счётчиков.",
      successMessage: "Ошибка исправлена: функция работает и с новыми, и с существующими ключами."
    },
    {
      id: "l1_dict_t5",
      type: "theory",
      title: "Типовые приёмы и ограничения на ключи",
      blocks: [
        {
          type: "p",
          html: "<b>Счётчик.</b> Самая частая задача со словарями — посчитать, сколько раз что-то встречается. Ключ — это объект, значение — количество:"
        },
        {
          type: "code",
          code: 'text = "abca"\ncounts = {}\nfor ch in text:\n    counts[ch] = counts.get(ch, 0) + 1\n\nprint(counts)',
          output: "{'a': 2, 'b': 1, 'c': 1}"
        },
        {
          type: "p",
          html: "<b>Словарь внутри словаря.</b> Значением может быть другой словарь или список. Обращение выполняется по цепочке ключей:"
        },
        {
          type: "code",
          code: 'users = {\n    "alice": {"age": 25, "city": "Москва"},\n    "bob": {"age": 30, "city": "Омск"}\n}\n\nprint(users["bob"]["city"])',
          output: "Омск"
        },
        {
          type: "p",
          html: "<b>Какие объекты могут быть ключами.</b> Ключом может быть только неизменяемый объект: строка, число, кортеж. Список и другой словарь ключом быть не могут: Python выдаст <code>TypeError: unhashable type</code>."
        },
        {
          type: "note",
          html: "Если в литерале словаря указать один ключ дважды, останется <b>последнее</b> значение: <code>{\"a\": 1, \"a\": 2}</code> превратится в <code>{\"a\": 2}</code>."
        }
      ]
    },
    {
      id: "l1_dict_q4",
      type: "quiz",
      title: "Недопустимый ключ",
      question: "Что произойдёт при запуске этого кода?",
      code: 'd = {[1, 2]: "список"}',
      options: [
        "Словарь будет создан",
        "KeyError",
        "TypeError: unhashable type",
        "SyntaxError"
      ],
      correct: 2,
      explain: "Список изменяемый, поэтому он не может быть ключом. Python сообщает TypeError: unhashable type: 'list'. Вместо списка можно использовать кортеж (1, 2)."
    },
    {
      id: "l1_dict_q5",
      type: "quiz",
      title: "Повторяющийся ключ",
      question: "Какое значение будет выведено?",
      code: 'd = {"a": 1, "b": 2, "a": 3}\nprint(d["a"], len(d))',
      options: [
        "1 3",
        "3 3",
        "3 2",
        "1 2"
      ],
      correct: 2,
      explain: "Ключи в словаре уникальны. При повторе ключа остаётся последнее значение: a равно 3. В словаре всего два ключа, поэтому len(d) равно 2."
    },
    {
      id: "l1_dict_c2",
      type: "code",
      tier: "main",
      title: "Функция count_chars",
      explanation: [
        "Для каждого символа строки нужно увеличить его счётчик в словаре. Если символ встретился впервые, счётчик начинается с нуля."
      ],
      assignment: "Напиши функцию count_chars(text), которая возвращает словарь, где ключ — символ строки, а значение — сколько раз этот символ встречается. Для строки \"abca\" результат: {'a': 2, 'b': 1, 'c': 1}. Для пустой строки возвращается пустой словарь. Проверь функцию на строке \"abca\".",
      starterCode: "# Напиши функцию count_chars(text)\n",
      astRequirements: {
        require_def: true,
        require_return: true,
        forbid_calls: ["Counter"]
      },
      tests: [
        { call: 'count_chars("abca")["a"]', returns: 2 },
        { call: 'count_chars("abca")["b"]', returns: 1 },
        { call: 'len(count_chars("abca"))', returns: 3 },
        { call: 'len(count_chars(""))', returns: 0, hidden: true },
        { call: 'count_chars("aaa")["a"]', returns: 3, hidden: true }
      ],
      hints: [
        "Создай пустой словарь result, пройди циклом по символам строки и для каждого символа запиши result[ch] = result.get(ch, 0) + 1. В конце верни словарь.",
        { code: "def count_chars(text):\n    result = {}\n    for ch in text:\n        result[ch] = result.get(ch, ___) + 1\n    return result" },
        { code: "def count_chars(text):\n    result = {}\n    for ch in text:\n        result[ch] = result.get(ch, 0) + 1\n    return result\n\nprint(count_chars(\"abca\"))" }
      ],
      improveTip: "Такой же приём подходит для подсчёта слов в предложении: достаточно перебирать text.split() вместо text.",
      successMessage: "Функция count_chars правильно считает символы через словарь."
    },
    {
      id: "l1_dict_c3",
      type: "code",
      tier: "main",
      title: "Функция total_price",
      explanation: [
        "В словаре prices лежат цены товаров, в словаре cart — количество каждого товара в корзине. Перебирай корзину методом items()."
      ],
      assignment: "Напиши функцию total_price(prices, cart), которая возвращает общую стоимость корзины. prices — словарь «название: цена за единицу», cart — словарь «название: количество». Все товары из cart гарантированно есть в prices. Для пустой корзины результат 0. Проверь функцию на prices = {\"чай\": 100, \"кофе\": 150} и cart = {\"чай\": 2, \"кофе\": 1}: результат 350.",
      starterCode: "# Напиши функцию total_price(prices, cart)\n",
      astRequirements: {
        require_def: true,
        require_return: true
      },
      tests: [
        { call: 'total_price({"чай": 100, "кофе": 150}, {"чай": 2, "кофе": 1})', returns: 350 },
        { call: 'total_price({"чай": 100}, {})', returns: 0 },
        { call: 'total_price({"чай": 100, "кофе": 150}, {"кофе": 3})', returns: 450 },
        { call: 'total_price({"a": 1, "b": 2}, {"a": 5, "b": 5})', returns: 15, hidden: true }
      ],
      hints: [
        "Заведи переменную total = 0. Переберай cart через for name, qty in cart.items() и прибавляй prices[name] * qty. В конце верни total.",
        { code: "def total_price(prices, cart):\n    total = 0\n    for name, qty in cart.___():\n        total += prices[name] * qty\n    return total" },
        { code: "def total_price(prices, cart):\n    total = 0\n    for name, qty in cart.items():\n        total += prices[name] * qty\n    return total\n\nprint(total_price({\"чай\": 100, \"кофе\": 150}, {\"чай\": 2, \"кофе\": 1}))" }
      ],
      improveTip: "Цена берётся из одного словаря, количество из другого. Связывает их общий ключ.",
      successMessage: "Функция total_price объединяет данные из двух словарей."
    },
    {
      id: "l1_dict_c4",
      type: "code",
      tier: "star",
      optional: true,
      title: "Функция group_by_length",
      explanation: [
        "Значением в словаре может быть список. Если ключа ещё нет, нужно сначала создать для него пустой список."
      ],
      assignment: "Напиши функцию group_by_length(words), которая принимает список слов и возвращает словарь: ключ — длина слова, значение — список слов этой длины в порядке появления. Для [\"a\", \"bb\", \"c\"] результат: {1: ['a', 'c'], 2: ['bb']}.",
      starterCode: "# Напиши функцию group_by_length(words)\n",
      astRequirements: {
        require_def: true,
        require_return: true
      },
      tests: [
        { call: 'len(group_by_length(["a", "bb", "c"])[1])', returns: 2 },
        { call: 'group_by_length(["a", "bb", "c"])[2][0]', returns: "bb" },
        { call: 'len(group_by_length(["a", "bb", "c"]))', returns: 2 },
        { call: "len(group_by_length([]))", returns: 0, hidden: true },
        { call: 'group_by_length(["abc", "xyz", "q"])[3][1]', returns: "xyz", hidden: true }
      ],
      hints: [
        "Для каждого слова вычисли n = len(word). Если n ещё нет среди ключей, запиши result[n] = []. Затем добавь слово в список методом append.",
        { code: "def group_by_length(words):\n    result = {}\n    for word in words:\n        n = len(word)\n        if n not in ___:\n            result[n] = []\n        result[n].append(word)\n    return result" },
        { code: "def group_by_length(words):\n    result = {}\n    for word in words:\n        n = len(word)\n        if n not in result:\n            result[n] = []\n        result[n].append(word)\n    return result\n\nprint(group_by_length([\"a\", \"bb\", \"c\"]))" }
      ],
      successMessage: "Словарь со списками в качестве значений построен."
    },
    {
      id: "l1_dict_t6",
      type: "theory",
      title: "Частые ошибки",
      blocks: [
        {
          type: "p",
          html: "Справочная таблица типичных затруднений при работе со словарями:"
        },
        {
          type: "table",
          head: ["Ошибка / Ситуация", "Причина", "Что делать"],
          rows: [
            ["<code>KeyError: 'name'</code>", "Обращение к ключу, которого нет в словаре", "Проверь ключ через <code>in</code> или читай через <code>get</code>"],
            ["<code>TypeError: unhashable type</code>", "В качестве ключа использован список или словарь", "Используй строку, число или кортеж"],
            ["<code>SyntaxError</code> в литерале", "Пропущена запятая между парами или двоеточие в паре", "Проверь, что пары записаны как <code>ключ: значение,</code>"],
            ["<code>RuntimeError: dictionary changed size</code>", "Словарь меняется во время перебора по нему же", "Перебирай копию: <code>list(d.keys())</code>"],
            ["<code>in</code> не находит значение", "Оператор <code>in</code> проверяет только ключи", "Для значений используй <code>value in d.values()</code>"],
            ["Ключ \"1\" не равен ключу 1", "Строка и число — разные ключи", "Следи за типом ключа при записи и чтении"]
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
