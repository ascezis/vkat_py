/**
 * Тема этапа 2: Строки, продолжение (углублённая практика)
 */

window.COURSE_TOPICS = window.COURSE_TOPICS || [];

window.COURSE_TOPICS.push({
  id: "l1_strings",
  title: "Строки: методы и форматирование",
  minutes: 60,
  items: [
    /* ============ 1. Неизменяемость, индексы, срезы ============ */
    {
      id: "l1_str_t1",
      type: "theory",
      title: "Строка как последовательность и её неизменяемость",
      blocks: [
        {
          type: "p",
          html: "Строка (<code>str</code>) — упорядоченная последовательность символов. Как и у списка, у строки есть индексы, срезы, длина и проверка через <code>in</code>."
        },
        {
          type: "code",
          code: 's = "Python"\n\nprint(s[0], s[-1])\nprint(s[1:4])\nprint(s[::-1])\nprint(len(s))\nprint("th" in s)',
          output: "P n\nyth\nnohtyP\n6\nTrue"
        },
        {
          type: "p",
          html: "Строки можно склеивать оператором <code>+</code> и повторять умножением на число:"
        },
        {
          type: "code",
          code: 'print("ab" + "cd")\nprint("-" * 5)',
          output: "abcd\n-----"
        },
        {
          type: "p",
          html: "Главное отличие от списка: строка <b>неизменяемая</b>. Заменить символ по индексу нельзя:"
        },
        {
          type: "code",
          code: 's = "python"\ns[0] = "P"',
          output: "TypeError: 'str' object does not support item assignment"
        },
        {
          type: "p",
          html: "Чтобы получить изменённую строку, создают новую и записывают её в переменную:"
        },
        {
          type: "code",
          code: 's = "python"\ns = "P" + s[1:]\nprint(s)',
          output: "Python"
        },
        {
          type: "p",
          html: "Все методы строк работают так же: они <b>возвращают новую строку</b> и не меняют исходную."
        },
        {
          type: "code",
          code: 's = "python"\ns.upper()\nprint(s)\n\nt = s.upper()\nprint(t)',
          output: "python\nPYTHON"
        }
      ]
    },
    {
      id: "l1_str_q1",
      type: "quiz",
      title: "Присваивание символу строки",
      question: "Что произойдёт при запуске этого кода?",
      code: 's = "cat"\ns[0] = "b"\nprint(s)',
      options: [
        "Выведется bat",
        "Будет TypeError",
        "Будет IndexError",
        "Выведется cat"
      ],
      correct: 1,
      explain: "Строка неизменяемая, поэтому присваивание символу по индексу приводит к TypeError. Чтобы получить bat, нужно создать новую строку, например s = \"b\" + s[1:]."
    },
    {
      id: "l1_str_q2",
      type: "quiz",
      title: "Метод upper без присваивания",
      question: "Что выведет эта программа?",
      code: 's = "abc"\ns.upper()\nprint(s)',
      options: [
        "ABC",
        "abc",
        "None",
        "Будет ошибка"
      ],
      correct: 1,
      explain: "Метод upper возвращает новую строку и не меняет s. Результат нигде не сохранён, поэтому s остаётся равной abc."
    },
    {
      id: "l1_str_p1",
      type: "predict",
      title: "Срезы строки",
      explanation: [
        "Определи, что выведет программа. В слове «программирование» 16 букв. Значения в одной строке разделены пробелом."
      ],
      code: 's = "программирование"\nprint(s[:6], s[-5:], s[::4])',
      expectedOutput: "програ вание приа",
      explain: "s[:6] — первые шесть букв: «програ». s[-5:] — последние пять: «вание». s[::4] берёт буквы с индексами 0, 4, 8, 12: «п», «р», «и», «а»."
    },

    /* ============ 2. Регистр, очистка, замена ============ */
    {
      id: "l1_str_t2",
      type: "theory",
      title: "Регистр, очистка и замена",
      blocks: [
        {
          type: "table",
          head: ["Метод", "Что делает"],
          rows: [
            ["<code>s.upper()</code>", "все буквы заглавные"],
            ["<code>s.lower()</code>", "все буквы строчные"],
            ["<code>s.capitalize()</code>", "первая буква заглавная, остальные строчные"],
            ["<code>s.strip()</code>", "убирает пробелы и переводы строк по краям"],
            ["<code>s.lstrip()</code> / <code>s.rstrip()</code>", "убирает пробелы только слева или только справа"],
            ["<code>s.strip(chars)</code>", "убирает по краям любые символы из строки <code>chars</code>"],
            ["<code>s.replace(old, new)</code>", "заменяет <b>все</b> вхождения <code>old</code> на <code>new</code>"]
          ]
        },
        {
          type: "code",
          code: 'text = "  Привет, Мир!  "\n\nprint(text.strip())\nprint(text.strip().upper())\nprint(text.strip().lower())\nprint(text.replace("Мир", "Python").strip())\nprint("привет мир".capitalize())\nprint("xxhixx".strip("x"))\nprint("banana".replace("a", "o"))',
          output: "Привет, Мир!\nПРИВЕТ, МИР!\nпривет, мир!\nПривет, Python!\nПривет мир\nhi\nbonono"
        },
        {
          type: "note",
          html: "Методы можно соединять в цепочку: <code>text.strip().lower()</code>. Цепочка выполняется слева направо, каждый следующий метод применяется к результату предыдущего."
        }
      ]
    },
    {
      id: "l1_str_p2",
      type: "predict",
      title: "Цепочка методов",
      explanation: [
        "Методы применяются слева направо. Обрати внимание на порядок: сначала lower, потом replace."
      ],
      code: 's = "  Hello, World  "\nprint(s.strip().lower().replace("world", "python"))',
      expectedOutput: "hello, python",
      explain: "strip убирает пробелы по краям, lower переводит строку в нижний регистр: «hello, world». Затем replace заменяет «world» на «python». Если бы replace стоял до lower, слово «World» с заглавной буквы не нашлось бы."
    },

    /* ============ 3. Поиск ============ */
    {
      id: "l1_str_t3",
      type: "theory",
      title: "Поиск в строке",
      blocks: [
        {
          type: "table",
          head: ["Метод / оператор", "Что возвращает"],
          rows: [
            ["<code>s.find(sub)</code>", "индекс первого вхождения или <code>-1</code>, если подстроки нет"],
            ["<code>s.count(sub)</code>", "сколько раз подстрока встречается без пересечений"],
            ["<code>s.startswith(sub)</code>", "<code>True</code>, если строка начинается с <code>sub</code>"],
            ["<code>s.endswith(sub)</code>", "<code>True</code>, если строка заканчивается на <code>sub</code>"],
            ["<code>sub in s</code>", "<code>True</code>, если подстрока есть в строке"]
          ]
        },
        {
          type: "code",
          code: 's = "hello world, hello python"\n\nprint(s.find("hello"))\nprint(s.find("world"))\nprint(s.find("java"))\nprint(s.count("hello"))\nprint(s.startswith("hello"))\nprint(s.endswith("python"))\nprint("world" in s)',
          output: "0\n6\n-1\n2\nTrue\nTrue\nTrue"
        },
        {
          type: "note",
          html: "Метод <code>find</code> при неудаче не вызывает ошибку, а возвращает <code>-1</code>. Индекс <code>0</code> — это настоящая позиция в начале строки, поэтому проверка <code>if s.find(x):</code> неверна. Чтобы узнать, есть ли подстрока, используй <code>x in s</code> или сравнивай <code>s.find(x) != -1</code>."
        }
      ]
    },
    {
      id: "l1_str_q3",
      type: "quiz",
      title: "Результат find",
      question: "Что выведет эта программа?",
      code: 's = "python"\nprint(s.find("java"))',
      options: [
        "0",
        "None",
        "-1",
        "Будет ValueError"
      ],
      correct: 2,
      explain: "Если подстрока не найдена, find возвращает -1. Ошибки при этом не возникает, а 0 означало бы, что подстрока найдена в самом начале."
    },
    {
      id: "l1_str_p3",
      type: "predict",
      title: "find и count",
      explanation: [
        "Определи четыре значения. Подстрока «an» в «banana» встречается дважды, без пересечений."
      ],
      code: 's = "banana"\nprint(s.find("n"), s.find("x"), s.count("a"), s.count("an"))',
      expectedOutput: "2 -1 3 2",
      explain: "Первая «n» стоит на индексе 2. Буквы «x» в слове нет, поэтому -1. Буква «a» встречается три раза. Подстрока «an» встречается на индексах 1 и 3, то есть два раза."
    },
    {
      id: "l1_str_c1",
      type: "code",
      tier: "warmup",
      title: "Функция clean_name",
      explanation: [
        "Метод strip убирает пробелы по краям, а метод capitalize делает первую букву заглавной и приводит остальные к строчным."
      ],
      assignment: "Напиши функцию clean_name(text), которая возвращает строку без пробелов по краям, где первая буква заглавная, а остальные строчные. Например, clean_name(\"  аНЯ  \") возвращает \"Аня\".",
      starterCode: "# Напиши функцию clean_name(text)\n",
      astRequirements: {
        require_def: true,
        require_return: true
      },
      tests: [
        { call: 'clean_name("  аНЯ  ")', returns: "Аня" },
        { call: 'clean_name("борис")', returns: "Борис" },
        { call: 'clean_name("ВЕРА")', returns: "Вера", hidden: true },
        { call: 'clean_name("")', returns: "", hidden: true }
      ],
      hints: [
        "Сначала убери пробелы по краям методом strip, затем примени к результату метод capitalize.",
        { code: "def clean_name(text):\n    return text.strip().___()" },
        { code: "def clean_name(text):\n    return text.strip().capitalize()\n\nprint(clean_name(\"  аНЯ  \"))" }
      ],
      successMessage: "Функция clean_name приводит имя к аккуратному виду."
    },
    {
      id: "l1_str_c2",
      type: "code",
      tier: "warmup",
      title: "Функция is_palindrome",
      explanation: [
        "Палиндром читается одинаково слева направо и справа налево. Для сравнения регистров строку нужно привести к одному регистру."
      ],
      assignment: "Напиши функцию is_palindrome(text), которая возвращает True, если строка читается одинаково в обе стороны без учёта регистра букв, и False в остальных случаях. Пробелы и знаки препинания считаются обычными символами. Пустая строка является палиндромом.",
      starterCode: "# Напиши функцию is_palindrome(text)\n",
      astRequirements: {
        require_def: true,
        require_return: true
      },
      tests: [
        { call: 'is_palindrome("Level")', returns: true },
        { call: 'is_palindrome("abc")', returns: false },
        { call: 'is_palindrome("")', returns: true, hidden: true },
        { call: 'is_palindrome("Aa")', returns: true, hidden: true }
      ],
      hints: [
        "Приведи строку к нижнему регистру и сравни её с самой собой, развёрнутой срезом с шагом -1.",
        { code: "def is_palindrome(text):\n    t = text.lower()\n    return t == t[::___]" },
        { code: "def is_palindrome(text):\n    t = text.lower()\n    return t == t[::-1]\n\nprint(is_palindrome(\"Level\"))\nprint(is_palindrome(\"abc\"))" }
      ],
      successMessage: "Функция is_palindrome сравнивает строку с её отражением."
    },
    {
      id: "l1_str_c3",
      type: "code",
      tier: "warmup",
      title: "Функция mask_card",
      explanation: [
        "Последние четыре символа строки можно получить срезом s[-4:]. Строки склеиваются оператором +."
      ],
      assignment: "Напиши функцию mask_card(number), которая принимает строку из цифр (не короче четырёх символов) и возвращает строку из четырёх звёздочек и последних четырёх цифр номера. Например, mask_card(\"1234567890123456\") возвращает \"****3456\".",
      starterCode: "# Напиши функцию mask_card(number)\n",
      astRequirements: {
        require_def: true,
        require_return: true
      },
      tests: [
        { call: 'mask_card("1234567890123456")', returns: "****3456" },
        { call: 'mask_card("1111")', returns: "****1111" },
        { call: 'mask_card("40001234")', returns: "****1234", hidden: true }
      ],
      hints: [
        "Возьми последние четыре символа срезом с отрицательным индексом и приклей их к строке из четырёх звёздочек.",
        { code: "def mask_card(number):\n    return \"****\" + number[___:]" },
        { code: "def mask_card(number):\n    return \"****\" + number[-4:]\n\nprint(mask_card(\"1234567890123456\"))" }
      ],
      successMessage: "Функция mask_card скрывает номер карты и оставляет последние цифры."
    },

    /* ============ 4. split и join ============ */
    {
      id: "l1_str_t4",
      type: "theory",
      title: "split и join",
      blocks: [
        {
          type: "p",
          html: "Метод <code>split</code> разбивает строку на список подстрок. Метод <code>join</code> делает обратное: склеивает список строк в одну строку с заданным разделителем."
        },
        {
          type: "code",
          code: 'text = "один два три"\nwords = text.split()\nprint(words)\nprint(len(words))\n\ndata = "red,green,blue"\nparts = data.split(",")\nprint(parts)\n\nprint(" ".join(words))\nprint("-".join(["2024", "10", "22"]))\nprint("".join(["a", "b", "c"]))',
          output: "['один', 'два', 'три']\n3\n['red', 'green', 'blue']\nодин два три\n2024-10-22\nabc"
        },
        {
          type: "p",
          html: "Метод <code>split()</code> без аргументов делит строку по любым группам пробелов и не создаёт пустых элементов. Метод <code>split(\" \")</code> делит ровно по одному пробелу, поэтому подряд идущие пробелы дают пустые строки."
        },
        {
          type: "code",
          code: 'print("a b  c".split())\nprint("a b  c".split(" "))',
          output: "['a', 'b', 'c']\n['a', 'b', '', 'c']"
        },
        {
          type: "note",
          html: "Метод <code>join</code> принимает только строки. Для списка чисел сначала нужно превратить каждое число в строку функцией <code>str()</code>, иначе будет <code>TypeError</code>."
        },
        {
          type: "code",
          code: 'nums = [1, 2, 3]\nprint(",".join([str(n) for n in nums]))',
          output: "1,2,3"
        },
        {
          type: "note",
          html: "Разделитель стоит <b>перед</b> точкой: <code>\"-\".join(список)</code>. Метод <code>join</code> принадлежит строке-разделителю, а не списку."
        }
      ]
    },
    {
      id: "l1_str_q4",
      type: "quiz",
      title: "split без аргументов",
      question: "Сколько элементов в списке, который получится в этом коде?",
      code: 'words = "a b  c".split()\nprint(len(words))',
      options: [
        "3",
        "4",
        "5",
        "Будет ошибка"
      ],
      correct: 0,
      explain: "Метод split() без аргументов делит строку по группам пробелов и не создаёт пустых элементов. Получается ['a', 'b', 'c'], то есть три элемента. Запись split(\" \") дала бы четыре элемента с пустой строкой."
    },
    {
      id: "l1_str_p4",
      type: "predict",
      title: "split и join вместе",
      explanation: [
        "Определи, что выведет программа. Вывод состоит из двух строк."
      ],
      code: 'parts = "red,green,blue".split(",")\nprint(parts[1], len(parts))\nprint("+".join(parts))',
      expectedOutput: "green 3\nred+green+blue",
      explain: "Метод split(\",\") даёт список из трёх строк. Элемент с индексом 1 равен «green». Метод join склеивает элементы через плюс."
    },
    {
      id: "l1_str_c4",
      type: "code",
      tier: "main",
      title: "Функция normalize_spaces",
      explanation: [
        "Метод split() без аргументов выбрасывает лишние пробелы, а метод join склеивает слова одним пробелом."
      ],
      assignment: "Напиши функцию normalize_spaces(text), которая возвращает строку, где слова разделены ровно одним пробелом, а пробелов в начале и в конце нет. Например, normalize_spaces(\"  привет   мир \") возвращает \"привет мир\".",
      starterCode: "# Напиши функцию normalize_spaces(text)\n",
      astRequirements: {
        require_def: true,
        require_return: true
      },
      tests: [
        { call: 'normalize_spaces("  привет   мир ")', returns: "привет мир" },
        { call: 'normalize_spaces("a")', returns: "a" },
        { call: 'normalize_spaces("a    b    c")', returns: "a b c", hidden: true },
        { call: 'normalize_spaces("")', returns: "", hidden: true }
      ],
      hints: [
        "Раздели строку на слова методом split() без аргументов, затем склей слова через один пробел методом join.",
        { code: "def normalize_spaces(text):\n    return \" \".___(text.split())" },
        { code: "def normalize_spaces(text):\n    return \" \".join(text.split())\n\nprint(normalize_spaces(\"  привет   мир \"))" }
      ],
      successMessage: "Функция normalize_spaces убирает лишние пробелы."
    },
    {
      id: "l1_str_c5",
      type: "code",
      tier: "main",
      title: "Функция initials",
      explanation: [
        "Первая буква слова — это word[0]. Чтобы она стала заглавной, к ней применяют метод upper."
      ],
      assignment: "Напиши функцию initials(full_name), которая принимает строку с именем из нескольких слов и возвращает инициалы: первую заглавную букву каждого слова с точкой после неё. Например, initials(\"Иван Петров\") возвращает \"И.П.\", а initials(\"анна\") возвращает \"А.\".",
      starterCode: "# Напиши функцию initials(full_name)\n",
      astRequirements: {
        require_def: true,
        require_return: true
      },
      tests: [
        { call: 'initials("Иван Петров")', returns: "И.П." },
        { call: 'initials("анна")', returns: "А." },
        { call: 'initials("иван петрович сидоров")', returns: "И.П.С.", hidden: true },
        { call: 'initials("  Иван   Петров ")', returns: "И.П.", hidden: true }
      ],
      hints: [
        "Создай пустую строку result. Раздели full_name методом split(), в цикле добавляй к result первую букву слова в верхнем регистре и точку. В конце верни result.",
        { code: "def initials(full_name):\n    result = \"\"\n    for word in full_name.split():\n        result += word[___].upper() + \".\"\n    return result" },
        { code: "def initials(full_name):\n    result = \"\"\n    for word in full_name.split():\n        result += word[0].upper() + \".\"\n    return result\n\nprint(initials(\"Иван Петров\"))" }
      ],
      successMessage: "Функция initials собирает инициалы из слов."
    },

    /* ============ 5. f-строки и форматирование ============ */
    {
      id: "l1_str_t5",
      type: "theory",
      title: "f-строки и форматирование",
      blocks: [
        {
          type: "p",
          html: "Перед строкой можно поставить букву <code>f</code>. Тогда внутри фигурных скобок можно писать переменные и любые выражения, и Python подставит их значения:"
        },
        {
          type: "code",
          code: 'name = "Аня"\nage = 17\nprice = 3.14159\n\nprint(f"{name} - {age} лет")\nprint(f"Через год {name} будет {age + 1}")\nprint(f"Цена: {price:.2f}")\nprint(f"[{name:>6}]")\nprint(f"[{name:<6}]")\nprint(f"[{name:^6}]")',
          output: "Аня - 17 лет\nЧерез год Аня будет 18\nЦена: 3.14\n[   Аня]\n[Аня   ]\n[ Аня  ]"
        },
        {
          type: "p",
          html: "После двоеточия внутри скобок записывается формат:"
        },
        {
          type: "table",
          head: ["Формат", "Что делает", "Пример"],
          rows: [
            ["<code>:.2f</code>", "число с двумя знаками после запятой", "<code>f\"{3.14159:.2f}\"</code> даёт <code>3.14</code>"],
            ["<code>:>6</code>", "выравнивание вправо в поле шириной 6", "<code>f\"{'ab':>6}\"</code> даёт <code>'    ab'</code>"],
            ["<code>:<6</code>", "выравнивание влево в поле шириной 6", "<code>f\"{'ab':<6}\"</code> даёт <code>'ab    '</code>"],
            ["<code>:^6</code>", "выравнивание по центру в поле шириной 6", "<code>f\"{'ab':^6}\"</code> даёт <code>'  ab  '</code>"]
          ]
        },
        {
          type: "note",
          html: "Склеивание через <code>+</code> работает только со строками: <code>\"Возраст: \" + 17</code> вызовет <code>TypeError</code>. В f-строке число подставляется само: <code>f\"Возраст: {17}\"</code>."
        }
      ]
    },
    {
      id: "l1_str_q5",
      type: "quiz",
      title: "Выражение внутри f-строки",
      question: "Что выведет эта программа?",
      code: 'x = 4\nprint(f"x * 2 = {x * 2}")',
      options: [
        "x * 2 = 8",
        "x * 2 = {x * 2}",
        "x * 2 = 4",
        "Будет ошибка"
      ],
      correct: 0,
      explain: "Внутри фигурных скобок f-строки вычисляется выражение. Выражение x * 2 равно 8, и это значение подставляется в строку."
    },
    {
      id: "l1_str_p5",
      type: "predict",
      title: "Формат в f-строке",
      explanation: [
        "Определи, что выведет программа. Формат .2f округляет число до двух знаков после запятой."
      ],
      code: 'a = 10\nb = 3\nprint(f"{a / b:.2f}")\nprint(f"{a // b} и {a % b}")',
      expectedOutput: "3.33\n3 и 1",
      explain: "10 / 3 равно 3.333..., формат .2f оставляет два знака: 3.33. Целое деление 10 // 3 равно 3, остаток 10 % 3 равен 1."
    },
    {
      id: "l1_str_c6",
      type: "code",
      tier: "main",
      title: "Функция format_price",
      explanation: [
        "Формат .2f внутри f-строки показывает число с двумя знаками после запятой. Он работает и для целых, и для дробных чисел."
      ],
      assignment: "Напиши функцию format_price(name, price), которая возвращает строку вида «Название: цена руб.», где цена записана с двумя знаками после запятой. Например, format_price(\"Чай\", 100.5) возвращает \"Чай: 100.50 руб.\".",
      starterCode: "# Напиши функцию format_price(name, price)\n",
      astRequirements: {
        require_def: true,
        require_return: true
      },
      tests: [
        { call: 'format_price("Чай", 100.5)', returns: "Чай: 100.50 руб." },
        { call: 'format_price("Кофе", 150)', returns: "Кофе: 150.00 руб." },
        { call: 'format_price("Сок", 99.999)', returns: "Сок: 100.00 руб.", hidden: true }
      ],
      hints: [
        "Верни f-строку, в которой название подставлено как есть, а цена записана с форматом .2f.",
        { code: "def format_price(name, price):\n    return f\"{name}: {price:.___f} руб.\"" },
        { code: "def format_price(name, price):\n    return f\"{name}: {price:.2f} руб.\"\n\nprint(format_price(\"Чай\", 100.5))" }
      ],
      successMessage: "Функция format_price форматирует цену с двумя знаками."
    },
    {
      id: "l1_str_f1",
      type: "code",
      tier: "main",
      kind: "fix",
      title: "Найди ошибку: склейка строки с числом",
      explanation: [
        "Оператор + не склеивает строку с числом. Возраст нужно превратить в строку или подставить через f-строку."
      ],
      assignment: "Программа падает с ошибкой TypeError. Исправь функцию describe(name, age) так, чтобы она возвращала строку вида «Аня - 17 лет». Программа должна вывести одну строку: Аня - 17 лет.",
      starterCode: 'def describe(name, age):\n    return name + " - " + age + " лет"\n\nprint(describe("Аня", 17))\n',
      astRequirements: {
        require_def: true,
        require_return: true
      },
      expectedOutput: "Аня - 17 лет",
      tests: [
        { call: 'describe("Аня", 17)', returns: "Аня - 17 лет" },
        { call: 'describe("Борис", 5)', returns: "Борис - 5 лет" },
        { call: 'describe("", 0)', returns: " - 0 лет", hidden: true }
      ],
      hints: [
        "Строку нельзя складывать с числом. Используй f-строку: переменные name и age подставляются в фигурных скобках.",
        { code: "def describe(name, age):\n    return f\"{name} - {___} лет\"" },
        { code: "def describe(name, age):\n    return f\"{name} - {age} лет\"\n\nprint(describe(\"Аня\", 17))" }
      ],
      improveTip: "Можно было также превратить число в строку: name + \" - \" + str(age) + \" лет\". Запись через f-строку короче и читается легче.",
      successMessage: "Ошибка исправлена: число подставлено в строку через f-строку."
    },

    /* ============ ЗВЁЗДОЧКИ ============ */
    {
      id: "l1_str_c7",
      type: "code",
      tier: "star",
      optional: true,
      title: "Функция compress",
      explanation: [
        "Нужно пройти по строке и считать, сколько раз подряд повторяется текущий символ. Число к строке добавляется через str()."
      ],
      assignment: "Напиши функцию compress(text), которая сжимает строку: каждая группа одинаковых подряд идущих символов заменяется на символ и количество повторов. Например, compress(\"aaabbc\") возвращает \"a3b2c1\". Для пустой строки возвращается пустая строка.",
      starterCode: "# Напиши функцию compress(text)\n",
      astRequirements: {
        require_def: true,
        require_return: true
      },
      tests: [
        { call: 'compress("aaabbc")', returns: "a3b2c1" },
        { call: 'compress("abc")', returns: "a1b1c1" },
        { call: 'compress("")', returns: "", hidden: true },
        { call: 'compress("zzzz")', returns: "z4", hidden: true },
        { call: 'compress("aabaa")', returns: "a2b1a2", hidden: true }
      ],
      hints: [
        "Запомни текущий символ и счётчик повторов. Когда следующий символ другой, добавь в результат текущий символ и счётчик (через str) и начни считать заново. Не забудь добавить последнюю группу после цикла.",
        { code: "def compress(text):\n    if text == \"\":\n        return \"\"\n    result = \"\"\n    current = text[0]\n    count = 1\n    for ch in text[1:]:\n        if ch == current:\n            count += 1\n        else:\n            result += current + str(___)\n            current = ch\n            count = 1\n    result += current + str(count)\n    return result" },
        { code: "def compress(text):\n    if text == \"\":\n        return \"\"\n    result = \"\"\n    current = text[0]\n    count = 1\n    for ch in text[1:]:\n        if ch == current:\n            count += 1\n        else:\n            result += current + str(count)\n            current = ch\n            count = 1\n    result += current + str(count)\n    return result\n\nprint(compress(\"aaabbc\"))" }
      ],
      successMessage: "Строка сжата по группам одинаковых символов."
    },
    {
      id: "l1_str_c8",
      type: "code",
      tier: "star",
      optional: true,
      title: "Функция is_anagram",
      explanation: [
        "Функция sorted принимает строку и возвращает список её символов в алфавитном порядке. Слова-анаграммы дают одинаковые списки."
      ],
      assignment: "Напиши функцию is_anagram(a, b), которая возвращает True, если слова a и b состоят из одних и тех же букв (в другом порядке), без учёта регистра, и False в остальных случаях. Например, is_anagram(\"Лес\", \"сел\") возвращает True.",
      starterCode: "# Напиши функцию is_anagram(a, b)\n",
      astRequirements: {
        require_def: true,
        require_return: true
      },
      tests: [
        { call: 'is_anagram("Лес", "сел")', returns: true },
        { call: 'is_anagram("кот", "ток")', returns: true },
        { call: 'is_anagram("кот", "кит")', returns: false },
        { call: 'is_anagram("а", "аа")', returns: false, hidden: true }
      ],
      hints: [
        "Приведи обе строки к нижнему регистру, отсортируй буквы каждой функцией sorted и сравни полученные списки.",
        { code: "def is_anagram(a, b):\n    return sorted(a.lower()) == sorted(___.lower())" },
        { code: "def is_anagram(a, b):\n    return sorted(a.lower()) == sorted(b.lower())\n\nprint(is_anagram(\"Лес\", \"сел\"))" }
      ],
      successMessage: "Анаграммы распознаются через сортировку букв."
    },

    /* ============ Частые ошибки ============ */
    {
      id: "l1_str_t6",
      type: "theory",
      title: "Частые ошибки",
      blocks: [
        {
          type: "p",
          html: "Справочная таблица типичных затруднений при работе со строками:"
        },
        {
          type: "table",
          head: ["Ошибка / Ситуация", "Причина", "Что делать"],
          rows: [
            ["<code>TypeError: 'str' object does not support item assignment</code>", "Попытка заменить символ строки по индексу", "Собери новую строку срезами и конкатенацией"],
            ["Строка после <code>s.upper()</code> не изменилась", "Метод вернул новую строку, а результат не сохранён", "Запиши результат: <code>s = s.upper()</code>"],
            ["<code>TypeError: can only concatenate str</code>", "Склейка строки с числом через <code>+</code>", "Используй f-строку или <code>str(число)</code>"],
            ["<code>TypeError: sequence item 0: expected str instance</code>", "В <code>join</code> передан список с числами", "Преврати элементы в строки: <code>[str(n) for n in nums]</code>"],
            ["<code>if s.find(x):</code> срабатывает неверно", "Метод <code>find</code> возвращает <code>-1</code> при неудаче и <code>0</code> при совпадении в начале", "Используй <code>x in s</code> или <code>s.find(x) != -1</code>"],
            ["<code>IndexError: string index out of range</code>", "Индекс больше или равен длине строки", "Проверь длину через <code>len(s)</code> или используй срез"],
            ["В списке после <code>split(\" \")</code> есть пустые строки", "Между словами было несколько пробелов подряд", "Используй <code>split()</code> без аргументов"]
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
