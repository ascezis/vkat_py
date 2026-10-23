/**
 * Тема этапа 2: Циклы и условия, продолжение
 * Продолжает темы «Циклы» и «Условия» этапа «Начало»: управление ходом цикла,
 * while с неизвестным числом шагов, else у циклов, вложенные циклы, сложные условия.
 */

window.COURSE_TOPICS = window.COURSE_TOPICS || [];

window.COURSE_TOPICS.push({
  id: "l1_loops_adv",
  title: "Циклы и условия, продолжение",
  minutes: 60,
  items: [
    /* ============ ТЕОРИЯ ============ */
    {
      id: "l1_loop_t1",
      type: "theory",
      title: "Управление циклом: break и continue",
      blocks: [
        {
          type: "p",
          html: "Обычно цикл выполняется до конца: проходит все элементы или работает, пока условие истинно. Два оператора позволяют вмешаться в ход цикла."
        },
        {
          type: "table",
          head: ["Оператор", "Что делает"],
          rows: [
            ["<code>break</code>", "немедленно завершает цикл"],
            ["<code>continue</code>", "пропускает остаток текущей итерации и переходит к следующей"]
          ]
        },
        {
          type: "code",
          code: 'numbers = [3, 8, -1, 5]\n\nfor n in numbers:\n    if n < 0:\n        break\n    print(n)',
          output: "3\n8"
        },
        {
          type: "p",
          html: "Тот же цикл с <code>continue</code> не останавливается, а лишь пропускает отрицательное число:"
        },
        {
          type: "code",
          code: 'numbers = [3, -1, 5]\n\nfor n in numbers:\n    if n < 0:\n        continue\n    print(n)',
          output: "3\n5"
        },
        {
          type: "note",
          html: "Оба оператора действуют только на ближайший цикл, внутри которого записаны."
        },
        {
          type: "p",
          html: "Типичный шаблон поиска: пройти по данным и остановиться на первом подходящем элементе."
        },
        {
          type: "code",
          code: 'words = ["кот", "лиса", "собака", "утка"]\nfirst_long = None\n\nfor w in words:\n    if len(w) > 4:\n        first_long = w\n        break\n\nprint(first_long)',
          output: "собака"
        },
        {
          type: "note",
          html: "Результат поиска сохраняют в переменную до <code>break</code>: после выхода из цикла она сохраняет своё значение. Если ничего не найдено, остаётся начальное значение (здесь <code>None</code>)."
        }
      ]
    },
    {
      id: "l1_loop_t2",
      type: "theory",
      title: "Цикл while: когда число шагов неизвестно",
      blocks: [
        {
          type: "p",
          html: "Цикл <code>for</code> подходит, когда понятно, по чему перебирать. Цикл <code>while</code> повторяется, пока условие истинно, и нужен, когда число шагов заранее неизвестно."
        },
        {
          type: "table",
          head: ["Цикл", "Когда использовать"],
          rows: [
            ["<code>for</code>", "известно, что перебирать: элементы списка, числа от 0 до n"],
            ["<code>while</code>", "число шагов неизвестно: пока число больше нуля, пока значение не достигнет цели"]
          ]
        },
        {
          type: "p",
          html: "Классический пример: сумма цифр числа. Последнюю цифру даёт <code>n % 10</code>, а убрать её помогает <code>n // 10</code>."
        },
        {
          type: "code",
          code: 'n = 1234\ntotal = 0\n\nwhile n > 0:\n    total += n % 10\n    n //= 10\n\nprint(total)',
          output: "10"
        },
        {
          type: "p",
          html: "У цикла <code>while</code> три обязательные части: начальное значение, условие и изменение переменной в теле цикла."
        },
        {
          type: "p",
          html: "Запись <code>while True</code> создаёт цикл, который повторяется бесконечно, пока внутри не сработает <code>break</code>:"
        },
        {
          type: "code",
          code: 'count = 0\n\nwhile True:\n    count += 1\n    if count ** 2 > 50:\n        break\n\nprint(count)',
          output: "8"
        },
        {
          type: "note",
          html: "Если в теле <code>while</code> ничего не меняет переменные из условия, цикл бесконечный. В тренажёре такая программа зависнет, поэтому перед запуском проверяй, что выход из цикла достижим."
        }
      ]
    },
    {
      id: "l1_loop_t3",
      type: "theory",
      title: "Ветка else у цикла",
      blocks: [
        {
          type: "p",
          html: "У циклов <code>for</code> и <code>while</code> есть необязательная ветка <code>else</code>. Она выполняется, только если цикл завершился сам, <b>без</b> <code>break</code>."
        },
        {
          type: "code",
          code: 'n = 9\n\nfor d in range(2, n):\n    if n % d == 0:\n        print("делитель", d)\n        break\nelse:\n    print("делителей нет")',
          output: "делитель 3"
        },
        {
          type: "p",
          html: "Для <code>n = 7</code> делителей нет, цикл доходит до конца, и срабатывает <code>else</code>:"
        },
        {
          type: "code",
          code: 'n = 7\n\nfor d in range(2, n):\n    if n % d == 0:\n        print("делитель", d)\n        break\nelse:\n    print("делителей нет")',
          output: "делителей нет"
        },
        {
          type: "p",
          html: "Ветка <code>else</code> заменяет переменную-флаг. Тот же результат с флагом:"
        },
        {
          type: "code",
          code: 'n = 7\nfound = False\n\nfor d in range(2, n):\n    if n % d == 0:\n        found = True\n        break\n\nif not found:\n    print("делителей нет")',
          output: "делителей нет"
        },
        {
          type: "note",
          html: "Ветка <code>else</code> относится к циклу, а не к <code>if</code> внутри него: её отступ совпадает с отступом <code>for</code>. Оператор <code>continue</code> на выполнение <code>else</code> не влияет."
        }
      ]
    },
    {
      id: "l1_loop_t4",
      type: "theory",
      title: "Вложенные циклы",
      blocks: [
        {
          type: "p",
          html: "Внутри цикла можно запустить другой цикл. На каждую итерацию внешнего цикла внутренний проходит полный круг."
        },
        {
          type: "code",
          code: 'for i in range(2):\n    for j in range(3):\n        print(i, j)',
          output: "0 0\n0 1\n0 2\n1 0\n1 1\n1 2"
        },
        {
          type: "p",
          html: "Тело внутреннего цикла выполнилось 2 × 3 = 6 раз. Параметр <code>end=\"\"</code> в <code>print</code> убирает перевод строки, а пустой <code>print()</code> завершает строку:"
        },
        {
          type: "code",
          code: 'for i in range(1, 4):\n    for j in range(1, i + 1):\n        print(j, end="")\n    print()',
          output: "1\n12\n123"
        },
        {
          type: "p",
          html: "Оператор <code>break</code> выходит только из внутреннего цикла. Чтобы выйти сразу из обоих, внутри функции используют <code>return</code>:"
        },
        {
          type: "code",
          code: 'def find_cell(grid, x):\n    for r in range(len(grid)):\n        for c in range(len(grid[r])):\n            if grid[r][c] == x:\n                return r, c\n    return None\n\nprint(find_cell([[1, 2], [3, 4]], 3))\nprint(find_cell([[1, 2], [3, 4]], 9))',
          output: "(1, 0)\nNone"
        },
        {
          type: "note",
          html: "Число итераций вложенных циклов перемножается. Два вложенных цикла по тысяче элементов дают миллион шагов."
        }
      ]
    },
    {
      id: "l1_loop_t5",
      type: "theory",
      title: "Сложные условия и итоги",
      blocks: [
        {
          type: "p",
          html: "Условия в Python можно записывать короче, чем цепочкой вложенных <code>if</code>."
        },
        {
          type: "code",
          code: 'x = 7\n\nprint(0 < x < 10)\nprint(x < 0 or x > 5)\nprint("чёт" if x % 2 == 0 else "нечёт")',
          output: "True\nTrue\nнечёт"
        },
        {
          type: "list",
          items: [
            "Цепочка сравнений <code>0 < x < 10</code> означает то же, что <code>0 < x and x < 10</code>.",
            "Приоритет операторов: сначала <code>not</code>, затем <code>and</code>, затем <code>or</code>. Если есть сомнения, ставь скобки.",
            "Условное выражение <code>A if условие else B</code> выбирает одно из двух значений."
          ]
        },
        {
          type: "p",
          html: "Любое значение можно использовать как условие. Ложными считаются <code>0</code>, пустая строка, пустой список, <code>None</code> и <code>False</code>, всё остальное считается истинным."
        },
        {
          type: "code",
          code: 'print(bool(0), bool(""), bool([]), bool(None), bool("0"))',
          output: "False False False False True"
        },
        {
          type: "p",
          html: "Операторы <code>and</code> и <code>or</code> возвращают не <code>True</code> или <code>False</code>, а один из операндов: <code>or</code> — первый истинный (или последний), <code>and</code> — первый ложный (или последний)."
        },
        {
          type: "code",
          code: 'print(0 or "x", 3 and 4, None or 0)',
          output: "x 4 0"
        },
        {
          type: "p",
          html: "В цепочке <code>if / elif</code> выполняется только первая ветка с истинным условием. Поэтому порядок веток важен:"
        },
        {
          type: "code",
          code: 'score = 85\n\nif score >= 60:\n    print("зачёт")\nelif score >= 80:\n    print("хорошо")',
          output: "зачёт"
        },
        {
          type: "note",
          html: "Ветка <code>score >= 80</code> здесь недостижима: любое число, большее или равное 80, уже подходит под первое условие. Условия записывают от более узких к более широким."
        },
        {
          type: "p",
          html: "<b>Шпаргалка по теме</b>"
        },
        {
          type: "table",
          head: ["Что нужно", "Как"],
          rows: [
            ["Выйти из цикла", "<code>break</code>"],
            ["Перейти к следующей итерации", "<code>continue</code>"],
            ["Понять, что цикл ничего не нашёл", "ветка <code>else</code> у цикла"],
            ["Повторять, пока выполняется условие", "<code>while условие:</code>"],
            ["Бесконечный цикл с выходом", "<code>while True:</code> и <code>break</code>"],
            ["Выйти сразу из двух циклов", "<code>return</code> внутри функции"],
            ["Проверить диапазон", "<code>0 <= x < n</code>"],
            ["Выбрать одно из двух значений", "<code>A if условие else B</code>"]
          ]
        }
      ]
    },

    /* ============ ПРОВЕРКА ПОНИМАНИЯ ============ */
    {
      id: "l1_loop_q1",
      type: "quiz",
      title: "Что делает continue",
      question: "Какие числа выведет этот цикл?",
      code: 'for i in range(5):\n    if i == 2:\n        continue\n    print(i)',
      options: [
        "0 1",
        "0 1 3 4",
        "0 1 2 3 4",
        "0 1 2"
      ],
      correct: 1,
      explain: "Оператор continue пропускает только одну итерацию, на которой i равно 2, и цикл продолжается. Поэтому выводятся 0, 1, 3 и 4. Вариант «0 1» получился бы при break."
    },
    {
      id: "l1_loop_q2",
      type: "quiz",
      title: "Когда срабатывает else у цикла",
      question: "Что произойдёт при запуске этого кода?",
      code: 'for x in [1, 3, 5]:\n    if x % 2 == 0:\n        break\nelse:\n    print("нет чётных")',
      options: [
        "Выведется «нет чётных»",
        "Ничего не выведется",
        "Выведется «нет чётных» три раза",
        "Будет SyntaxError"
      ],
      correct: 0,
      explain: "В списке нет чётных чисел, поэтому break ни разу не сработал и цикл завершился сам. Ветка else после такого завершения выполняется один раз."
    },
    {
      id: "l1_loop_q3",
      type: "quiz",
      title: "Почему цикл не заканчивается",
      question: "Программа зависает и бесконечно печатает нули. В чём причина?",
      code: 'i = 0\nwhile i < 5:\n    print(i)',
      options: [
        "Условие i < 5 записано неверно",
        "Внутри цикла i не меняется, и условие всегда истинно",
        "В цикле while нельзя использовать print",
        "Не хватает ветки else"
      ],
      correct: 1,
      explain: "Переменная i равна нулю на каждой итерации, поэтому условие i < 5 всегда истинно. В теле цикла нужна строка, которая меняет i, например i += 1."
    },

    /* ============ ПРЕДСКАЗАНИЕ ВЫВОДА ============ */
    {
      id: "l1_loop_p1",
      type: "predict",
      title: "break во вложенном цикле",
      explanation: [
        "Определи, что выведется в консоли. Каждая пара чисел выводится на отдельной строке через пробел. Помни, на какой цикл действует break."
      ],
      code: 'for i in range(3):\n    for j in range(3):\n        if j == 2:\n            break\n        print(i, j)',
      expectedOutput: "0 0\n0 1\n1 0\n1 1\n2 0\n2 1",
      explain: "Оператор break завершает только внутренний цикл, когда j достигает 2. Внешний цикл продолжается, поэтому для каждого i выводятся пары с j равным 0 и 1."
    },
    {
      id: "l1_loop_p2",
      type: "predict",
      title: "for-else и поиск делителя",
      explanation: [
        "Определи, что выведется в консоли. Обрати внимание, к какому оператору относится else."
      ],
      code: 'for n in [4, 7]:\n    for d in range(2, n):\n        if n % d == 0:\n            print(n, "составное")\n            break\n    else:\n        print(n, "простое")',
      expectedOutput: "4 составное\n7 простое",
      explain: "Для n = 4 делитель 2 находится сразу, срабатывает break, и else пропускается. Для n = 7 делителей нет, внутренний цикл завершается сам, и выполняется else."
    },
    {
      id: "l1_loop_p3",
      type: "predict",
      title: "Что возвращают and и or",
      explanation: [
        "Определи, что выведется в консоли. Значения в одной строке разделяются пробелом."
      ],
      code: 'print("" or "default", 5 and 0, [] or [1])',
      expectedOutput: "default 0 [1]",
      explain: "Пустая строка ложная, поэтому or возвращает второй операнд «default». Оператор and возвращает первый ложный операнд, то есть 0. Пустой список ложный, поэтому or возвращает [1]."
    },

    /* ============ НАЙДИ ОШИБКУ (РАЗМИНКА) ============ */
    {
      id: "l1_loop_f1",
      type: "code",
      tier: "warmup",
      kind: "fix",
      title: "Найди ошибку: проверка простого числа",
      explanation: [
        "Функция возвращает ответ уже после проверки первого делителя, а для числа 2 вообще ничего не возвращает. Подумай, в какой момент можно уверенно сказать, что число простое."
      ],
      assignment: "Функция is_prime(n) должна возвращать True для простых чисел и False для остальных. Исправь код так, чтобы она работала правильно для любого целого n. Менять нужно положение одной строки.",
      starterCode: 'def is_prime(n):\n    if n < 2:\n        return False\n    for d in range(2, n):\n        if n % d == 0:\n            return False\n        else:\n            return True\n',
      tests: [
        { call: "is_prime(2)", returns: true },
        { call: "is_prime(7)", returns: true },
        { call: "is_prime(9)", returns: false },
        { call: "is_prime(15)", returns: false },
        { call: "is_prime(1)", returns: false, hidden: true },
        { call: "is_prime(25)", returns: false, hidden: true }
      ],
      hints: [
        "Ответ True можно давать только после того, как проверены все делители. Значит, return True должен стоять не внутри цикла, а после него.",
        { code: "def is_prime(n):\n    if n < 2:\n        return False\n    for d in range(2, n):\n        if n % d == 0:\n            return False\n    return ___" },
        { code: "def is_prime(n):\n    if n < 2:\n        return False\n    for d in range(2, n):\n        if n % d == 0:\n            return False\n    return True\n\nprint(is_prime(7), is_prime(9))" }
      ],
      successMessage: "Ошибка исправлена: ответ True возвращается только после проверки всех делителей."
    },

    /* ============ ОСНОВНЫЕ ЗАДАЧИ ============ */
    {
      id: "l1_loop_c1",
      type: "code",
      tier: "main",
      title: "Функция digit_sum",
      explanation: [
        "Последняя цифра числа равна n % 10. Чтобы отбросить её, используй n // 10. Цикл while повторяется, пока в числе остаются цифры."
      ],
      assignment: "Напиши функцию digit_sum(n), которая принимает целое неотрицательное число n и возвращает сумму его цифр. Например, digit_sum(1234) возвращает 10. Превращать число в строку нельзя: используй операции % и //.",
      starterCode: "# Напиши функцию digit_sum(n) без преобразования в строку\n",
      astRequirements: {
        require_def: true,
        require_return: true,
        forbid_calls: ["str", "sum", "map", "list"]
      },
      tests: [
        { call: "digit_sum(1234)", returns: 10 },
        { call: "digit_sum(7)", returns: 7 },
        { call: "digit_sum(909)", returns: 18 },
        { call: "digit_sum(0)", returns: 0, hidden: true },
        { call: "digit_sum(100000)", returns: 1, hidden: true }
      ],
      hints: [
        "Заведи переменную total со значением 0. Пока n больше нуля, прибавляй к total последнюю цифру n % 10 и отбрасывай её через n //= 10. В конце верни total.",
        { code: "def digit_sum(n):\n    total = 0\n    while n > 0:\n        total += n % ___\n        n //= ___\n    return total" },
        { code: "def digit_sum(n):\n    total = 0\n    while n > 0:\n        total += n % 10\n        n //= 10\n    return total\n\nprint(digit_sum(1234))" }
      ],
      improveTip: "Реши задачу вторым способом: через строку и генератор, sum(int(ch) for ch in str(n)). Сравни, какой вариант читается лучше.",
      successMessage: "Функция digit_sum считает сумму цифр без преобразования в строку."
    },
    {
      id: "l1_loop_c2",
      type: "code",
      tier: "main",
      title: "Функция collatz_steps",
      explanation: [
        "Заранее неизвестно, сколько шагов понадобится, поэтому здесь подходит цикл while с условием «пока n не равно 1»."
      ],
      assignment: "Напиши функцию collatz_steps(n) для целого n >= 1. Пока n не равно 1, выполняй шаг: если n чётное, замени его на n // 2, иначе на 3 * n + 1. Функция возвращает количество выполненных шагов. Например, для 6 цепочка такая: 6, 3, 10, 5, 16, 8, 4, 2, 1, то есть collatz_steps(6) возвращает 8.",
      starterCode: "# Напиши функцию collatz_steps(n)\n",
      astRequirements: {
        require_def: true,
        require_return: true,
        require_if: true
      },
      tests: [
        { call: "collatz_steps(6)", returns: 8 },
        { call: "collatz_steps(1)", returns: 0 },
        { call: "collatz_steps(7)", returns: 16 },
        { call: "collatz_steps(2)", returns: 1, hidden: true },
        { call: "collatz_steps(27)", returns: 111, hidden: true }
      ],
      hints: [
        "Заведи счётчик steps. В цикле while n != 1 проверь чётность через n % 2, измени n по правилу и увеличь steps на 1. После цикла верни steps.",
        { code: "def collatz_steps(n):\n    steps = 0\n    while n != 1:\n        if n % 2 == 0:\n            n = n // 2\n        else:\n            n = ___ * n + 1\n        steps += 1\n    return steps" },
        { code: "def collatz_steps(n):\n    steps = 0\n    while n != 1:\n        if n % 2 == 0:\n            n = n // 2\n        else:\n            n = 3 * n + 1\n        steps += 1\n    return steps\n\nprint(collatz_steps(6))" }
      ],
      successMessage: "Функция collatz_steps считает шаги в цикле с неизвестным числом итераций."
    },
    {
      id: "l1_loop_c3",
      type: "code",
      tier: "main",
      title: "Функция pair_sum",
      explanation: [
        "Чтобы перебрать все пары элементов, нужны два вложенных цикла по индексам. Как только подходящая пара найдена, можно сразу вернуть результат из функции."
      ],
      assignment: "Напиши функцию pair_sum(nums, target), которая ищет в списке два разных элемента (с разными индексами i и j, где i < j) с суммой target. Функция возвращает кортеж (i, j) для первой найденной пары: сначала перебирай i по порядку, для каждого i перебирай j по порядку. Если подходящей пары нет, верни None. Например, pair_sum([2, 7, 11, 15], 9) возвращает (0, 1).",
      starterCode: "# Напиши функцию pair_sum(nums, target)\n",
      astRequirements: {
        require_def: true,
        require_return: true,
        require_for: true
      },
      tests: [
        { call: "str(pair_sum([2, 7, 11, 15], 9))", returns: "(0, 1)" },
        { call: "str(pair_sum([3, 2, 4], 6))", returns: "(1, 2)" },
        { call: "str(pair_sum([1, 2, 3], 10))", returns: "None" },
        { call: "str(pair_sum([5, 5], 10))", returns: "(0, 1)", hidden: true },
        { call: "str(pair_sum([1, 4, 5, 6], 10))", returns: "(1, 3)", hidden: true },
        { call: "str(pair_sum([], 3))", returns: "None", hidden: true }
      ],
      hints: [
        "Внешний цикл перебирает индекс i, внутренний перебирает j начиная с i + 1, чтобы не сравнивать элемент с самим собой и не считать пару дважды. Если сумма равна target, сразу верни (i, j). Если циклы закончились, верни None.",
        { code: "def pair_sum(nums, target):\n    for i in range(len(nums)):\n        for j in range(i + 1, len(nums)):\n            if nums[i] + nums[j] == ___:\n                return i, j\n    return None" },
        { code: "def pair_sum(nums, target):\n    for i in range(len(nums)):\n        for j in range(i + 1, len(nums)):\n            if nums[i] + nums[j] == target:\n                return i, j\n    return None\n\nprint(pair_sum([2, 7, 11, 15], 9))" }
      ],
      improveTip: "Подумай, как ускорить поиск: для каждого числа достаточно проверить, встречалось ли ранее число target - x. Для этого понадобится множество или словарь.",
      successMessage: "Функция pair_sum находит пару через вложенные циклы и выходит по return."
    },
    {
      id: "l1_loop_c4",
      type: "code",
      tier: "main",
      title: "Функция primes_up_to",
      explanation: [
        "Число простое, если у него нет делителей от 2 до n - 1. Ветка else у внутреннего цикла срабатывает именно тогда, когда делитель не найден."
      ],
      assignment: "Напиши функцию primes_up_to(n), которая возвращает список всех простых чисел от 2 до n включительно в порядке возрастания. Если n меньше 2, верни пустой список. Например, primes_up_to(10) возвращает [2, 3, 5, 7].",
      starterCode: "# Напиши функцию primes_up_to(n)\n",
      astRequirements: {
        require_def: true,
        require_return: true,
        require_for: true
      },
      tests: [
        { call: "str(primes_up_to(20))", returns: "[2, 3, 5, 7, 11, 13, 17, 19]" },
        { call: "str(primes_up_to(10))", returns: "[2, 3, 5, 7]" },
        { call: "str(primes_up_to(2))", returns: "[2]" },
        { call: "str(primes_up_to(1))", returns: "[]", hidden: true },
        { call: "str(primes_up_to(30))", returns: "[2, 3, 5, 7, 11, 13, 17, 19, 23, 29]", hidden: true }
      ],
      hints: [
        "Внешний цикл перебирает кандидатов от 2 до n. Внутренний цикл ищет делитель от 2 до кандидата - 1 и прерывается через break, если делитель найден. Кандидата добавляй в результат в ветке else внутреннего цикла.",
        { code: "def primes_up_to(n):\n    result = []\n    for k in range(2, n + 1):\n        for d in range(2, k):\n            if k % d == 0:\n                break\n        else:\n            result.___(k)\n    return result" },
        { code: "def primes_up_to(n):\n    result = []\n    for k in range(2, n + 1):\n        for d in range(2, k):\n            if k % d == 0:\n                break\n        else:\n            result.append(k)\n    return result\n\nprint(primes_up_to(20))" }
      ],
      improveTip: "Делители достаточно проверять до квадратного корня из k: range(2, int(k ** 0.5) + 1). Подумай, почему этого хватает.",
      successMessage: "Простые числа найдены через вложенные циклы и else у цикла."
    },
    {
      id: "l1_loop_c5",
      type: "code",
      tier: "main",
      title: "Лесенка из цифр",
      explanation: [
        "Номер строки задаёт, сколько раз нужно вывести число. Параметр end=\"\" в print оставляет курсор на той же строке."
      ],
      assignment: "Выведи «лесенку» высотой 5: в строке с номером i (от 1 до 5) число i повторяется i раз подряд без пробелов. Первая строка равна 1, вторая 22, пятая 55555.",
      starterCode: "# Выведи лесенку из цифр высотой 5\n",
      astRequirements: {
        require_for: true
      },
      expectedOutput: "1\n22\n333\n4444\n55555",
      hints: [
        "Внешний цикл перебирает номер строки i от 1 до 5. Внутренний цикл выводит число i нужное количество раз с параметром end=\"\". После внутреннего цикла нужен пустой print().",
        { code: "for i in range(1, 6):\n    for _ in range(___):\n        print(i, end=\"\")\n    print()" },
        { code: "for i in range(1, 6):\n    for _ in range(i):\n        print(i, end=\"\")\n    print()" }
      ],
      improveTip: "Реши ту же задачу одним циклом: print(str(i) * i). Умножение строки на число повторяет её.",
      successMessage: "Лесенка выведена вложенными циклами."
    },

    /* ============ НАЙДИ ОШИБКУ (ОСНОВНОЙ УРОВЕНЬ) ============ */
    {
      id: "l1_loop_f2",
      type: "code",
      tier: "main",
      kind: "fix",
      title: "Найди ошибку: подсчёт до первого нуля",
      explanation: [
        "Функция должна остановиться на первом нуле, а не просто пропустить его. Вспомни, чем break отличается от continue."
      ],
      assignment: "Функция count_until_zero(nums) должна вернуть количество чисел, стоящих в списке до первого нуля. Сейчас она считает все ненулевые числа списка. Исправь одну строку. Например, count_until_zero([3, 5, 0, 7, 8]) должна вернуть 2.",
      starterCode: 'def count_until_zero(nums):\n    count = 0\n    for x in nums:\n        if x == 0:\n            continue\n        count += 1\n    return count\n',
      tests: [
        { call: "count_until_zero([3, 5, 0, 7, 8])", returns: 2 },
        { call: "count_until_zero([1, 2, 3])", returns: 3 },
        { call: "count_until_zero([0])", returns: 0, hidden: true },
        { call: "count_until_zero([4, 0, 0])", returns: 1, hidden: true }
      ],
      hints: [
        "После первого нуля подсчёт должен прекратиться полностью. Один оператор завершает весь цикл, а другой пропускает только текущий шаг.",
        { code: "def count_until_zero(nums):\n    count = 0\n    for x in nums:\n        if x == 0:\n            ___\n        count += 1\n    return count" },
        { code: "def count_until_zero(nums):\n    count = 0\n    for x in nums:\n        if x == 0:\n            break\n        count += 1\n    return count\n\nprint(count_until_zero([3, 5, 0, 7, 8]))" }
      ],
      successMessage: "Ошибка исправлена: break останавливает цикл на первом нуле."
    },

    /* ============ ЗВЁЗДОЧКИ ============ */
    {
      id: "l1_loop_c6",
      type: "code",
      tier: "star",
      optional: true,
      title: "Функция longest_streak",
      explanation: [
        "Нужно хранить длину текущей серии одинаковых подряд идущих элементов и лучший результат за всё время."
      ],
      assignment: "Напиши функцию longest_streak(nums), которая возвращает длину самой длинной серии одинаковых подряд идущих элементов списка. Для пустого списка верни 0. Например, longest_streak([1, 1, 2, 2, 2, 3]) возвращает 3.",
      starterCode: "# Напиши функцию longest_streak(nums)\n",
      astRequirements: {
        require_def: true,
        require_return: true
      },
      tests: [
        { call: "longest_streak([1, 1, 2, 2, 2, 3])", returns: 3 },
        { call: "longest_streak([1, 2, 3])", returns: 1 },
        { call: "longest_streak([])", returns: 0 },
        { call: "longest_streak([5])", returns: 1, hidden: true },
        { call: "longest_streak([7, 7, 7, 7])", returns: 4, hidden: true }
      ],
      hints: [
        "Заведи переменные best и current, равные 0. Для каждого элемента: если он равен предыдущему, увеличь current на 1, иначе начни серию заново, current = 1. После каждого шага обновляй best через max.",
        { code: "def longest_streak(nums):\n    best = 0\n    current = 0\n    for i in range(len(nums)):\n        if i > 0 and nums[i] == nums[i - 1]:\n            current += 1\n        else:\n            current = ___\n        best = max(best, current)\n    return best" },
        { code: "def longest_streak(nums):\n    best = 0\n    current = 0\n    for i in range(len(nums)):\n        if i > 0 and nums[i] == nums[i - 1]:\n            current += 1\n        else:\n            current = 1\n        best = max(best, current)\n    return best\n\nprint(longest_streak([1, 1, 2, 2, 2, 3]))" }
      ],
      successMessage: "Самая длинная серия найдена за один проход по списку."
    },
    {
      id: "l1_loop_c7",
      type: "code",
      tier: "star",
      optional: true,
      title: "Функция to_binary",
      explanation: [
        "Двоичные цифры числа получаются многократным делением на 2: остатки записываются в обратном порядке."
      ],
      assignment: "Напиши функцию to_binary(n), которая принимает целое неотрицательное число и возвращает его двоичную запись в виде строки без префикса 0b. Например, to_binary(10) возвращает \"1010\", а to_binary(0) возвращает \"0\". Функции bin() и format() использовать нельзя.",
      starterCode: "# Напиши функцию to_binary(n) без bin() и format()\n",
      astRequirements: {
        require_def: true,
        require_return: true,
        forbid_calls: ["bin", "format"]
      },
      tests: [
        { call: "to_binary(10)", returns: "1010" },
        { call: "to_binary(8)", returns: "1000" },
        { call: "to_binary(1)", returns: "1" },
        { call: "to_binary(0)", returns: "0", hidden: true },
        { call: "to_binary(255)", returns: "11111111", hidden: true }
      ],
      hints: [
        "Для нуля сразу верни \"0\". Иначе заведи пустую строку result и пока n больше нуля добавляй остаток n % 2 слева от уже накопленной строки, а затем делай n //= 2.",
        { code: "def to_binary(n):\n    if n == 0:\n        return \"0\"\n    result = \"\"\n    while n > 0:\n        result = str(n % ___) + result\n        n //= 2\n    return result" },
        { code: "def to_binary(n):\n    if n == 0:\n        return \"0\"\n    result = \"\"\n    while n > 0:\n        result = str(n % 2) + result\n        n //= 2\n    return result\n\nprint(to_binary(10))" }
      ],
      successMessage: "Двоичная запись числа построена делением на 2."
    }
  ]
});
