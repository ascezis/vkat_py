/**
 * вкат.py — Практикум, тема 1: «Алгоритмы на списках и циклах»
 * Этап «Практикум». Никакого нового синтаксиса — применение изученного:
 * аккумуляторы, ранний выход, слияние, окна, бинарный поиск, два указателя.
 */

window.COURSE_TOPICS = window.COURSE_TOPICS || [];

window.COURSE_TOPICS.push({
  id: "l2_algorithms",
  title: "Алгоритмы: поиск, слияние, окна",
  minutes: 75,
  items: [
    {
      id: "l2_alg_t1",
      type: "theory",
      title: "Алгоритм — это рецепт для данных",
      blocks: [
        {
          type: "p",
          html: "В основном курсе ты изучил инструменты: списки, циклы, функции. Теперь из них собирают <b>алгоритмы</b> — пошаговые рецепты обработки данных. «Найди в списке первый отрицательный», «слей два отсортированных списка», «нарежь данные на куски» — всё это алгоритмы, и все они состоят из одних и тех же приёмов."
        },
        {
          type: "code",
          code: 'nums = [4, -1, 5, -7, 2]\n\ntotal = 0\nfor n in nums:\n    total += n\n\nprint(total)',
          output: "3"
        },
        {
          type: "p",
          html: "Переменная <code>total</code> здесь — <b>аккумулятор</b>: она накапливает результат по мере обхода. Завести аккумулятор, обойти данные, вернуть накопленное — так устроена добрая половина алгоритмов."
        },
        {
          type: "list",
          items: [
            "<b>Аккумулятор</b> — переменная, в которой собирается результат (<code>total</code>, <code>best</code>, <code>result</code>).",
            "<b>Ранний выход</b> — <code>return</code> (или <code>break</code>) внутри цикла, когда ответ уже найден: незачем смотреть дальше.",
            "<b>Значение по умолчанию</b> — что вернуть, если ничего не нашлось (<code>-1</code>, <code>None</code>, пустой список)."
          ]
        },
        {
          type: "note",
          html: "Прежде чем писать цикл, ответь себе на три вопроса: <b>что накапливаю</b>, <b>когда могу остановиться</b>, <b>что вернуть, если не нашёл</b>. Эти три ответа — уже половина алгоритма."
        }
      ]
    },
    {
      id: "l2_alg_q1",
      type: "quiz",
      title: "Инвариант линейного поиска",
      question: "Функция ищет первое вхождение x в список. Какое утверждение про её цикл верно?",
      code: 'def find_first(nums, x):\n    for i in range(len(nums)):\n        if nums[i] == x:\n            return i\n    return -1',
      options: [
        "Цикл обязан пройти весь список до конца, даже если x встретился на первом шаге",
        "Если цикл дошёл до конца и не нашёл x, функция возвращает -1",
        "Цикл возвращает -1, если x нашёлся"
      ],
      correct: 1,
      explain: "Это и есть значение по умолчанию: если обход закончился без раннего выхода, ответ не найден — возвращаем -1. А при нахождении x срабатывает ранний выход return i."
    },
    {
      id: "l2_alg_p1",
      type: "predict",
      title: "Трассировка аккумулятора",
      explanation: [
        "Прогони этот код в голове и запиши, что появится в консоли. Одна строка вывода — одна итерация."
      ],
      code: 'total = 0\nfor n in [4, -1, 5]:\n    total += n\n    print(total)',
      expectedOutput: "4\n3\n8",
      explain: "Аккумулятор печатается после каждого шага: сначала 4, затем 4 + (-1) = 3, затем 3 + 5 = 8. Учись вести таблицу значений — это главный инструмент чтения циклов."
    },
    {
      id: "l2_alg_p2",
      type: "predict",
      title: "Ранний выход в действии",
      explanation: [
        "Функция ищет первое вхождение числа. Сколько итераций сделает каждый вызов и что вернёт?"
      ],
      code: 'def find_first(nums, x):\n    for i in range(len(nums)):\n        if nums[i] == x:\n            return i\n    return -1\n\nprint(find_first([10, 20, 30, 40], 30))\nprint(find_first([10, 20], 99))',
      expectedOutput: "2\n-1",
      explain: "Первый вызов: x=30 нашёлся на индексе 2 — ранний выход, хвост списка даже не смотрели. Второй: обход прошёл весь список, ничего не нашли — сработал return -1 после цикла."
    },
    {
      id: "l2_alg_c1",
      type: "code",
      tier: "warmup",
      title: "Первое вхождение",
      explanation: [
        "Классика линейного поиска: верни индекс первого вхождения x в список. Если x не встречается — верни -1.",
        "Запрещается метод .index() — реализуй поиск своим циклом, это и есть суть задания."
      ],
      assignment: "Напиши функцию find_first(nums, x), которая возвращает индекс первого вхождения x в список nums или -1, если x не встречается.",
      starterCode: "# Напиши функцию find_first(nums, x)\n",
      astRequirements: {
        forbid_methods: ["index"]
      },
      tests: [
        { call: "find_first([1, 2, 3], 2)", returns: 1 },
        { call: "find_first([7], 7)", returns: 0 },
        { call: "find_first([1, 3], 5)", returns: -1 },
        { call: "find_first([2, 2, 2], 2)", returns: 0, hidden: true },
        { call: "find_first([], 1)", returns: -1, hidden: true }
      ],
      hints: [
        "Пройди список по индексам: for i in range(len(nums)). Как только nums[i] == x — сразу return i.",
        { code: "def find_first(nums, x):\n    for i in range(len(nums)):\n        if nums[i] == ___:\n            return ___\n    return ___" },
        { code: "def find_first(nums, x):\n    for i in range(len(nums)):\n        if nums[i] == x:\n            return i\n    return -1" }
      ],
      improveTip: "Ранний выход — не только про скорость: после него оставшаяся часть списка гарантированно не просматривается.",
      successMessage: "Линейный поиск готов — первый классический алгоритм реализован!"
    },
    {
      id: "l2_alg_c2",
      type: "code",
      tier: "warmup",
      title: "Сколько элементов больше",
      explanation: [
        "Аккумулятор-счётчик: обойди список и посчитай, сколько элементов строго больше limit."
      ],
      assignment: "Напиши функцию count_greater(nums, limit), которая возвращает количество элементов списка nums, строго больших limit.",
      starterCode: "# Напиши функцию count_greater(nums, limit)\n",
      tests: [
        { call: "count_greater([1, 5, 8], 4)", returns: 2 },
        { call: "count_greater([3, 3, 3], 3)", returns: 0 },
        { call: "count_greater([2, 9], 0)", returns: 2 },
        { call: "count_greater([], 1)", returns: 0, hidden: true },
        { call: "count_greater([-5, 10], 0)", returns: 1, hidden: true }
      ],
      hints: [
        "Заведи счётчик count = 0. В цикле: если n > limit — увеличь счётчик.",
        { code: "def count_greater(nums, limit):\n    count = 0\n    for n in nums:\n        if n > ___:\n            ___ += 1\n    return count" },
        { code: "def count_greater(nums, limit):\n    count = 0\n    for n in nums:\n        if n > limit:\n            count += 1\n    return count" }
      ],
      improveTip: "«Строго больше» — это >, а не >=. Для [3, 3, 3] и limit=3 правильный ответ 0.",
      successMessage: "Счётчик-аккумулятор работает верно!"
    },
    {
      id: "l2_alg_q2",
      type: "quiz",
      title: "Куда поставить return",
      question: "Ученик написал поиск. Что сломано?",
      code: 'def find_first(nums, x):\n    for i in range(len(nums)):\n        if nums[i] == x:\n            return i\n    else:\n        return -1',
      options: [
        "return -1 нужно ставить после цикла, а не в else к for — иначе функция вернёт -1 на первой же итерации, если x не равен первому элементу",
        "Всё верно: else к циклу — это стандартная конструкция",
        "Ошибка в отступах"
      ],
      correct: 0,
      explain: "else с отступом уровня if внутри цикла выполняется при первой же неудачной проверке. Это ветка if/else, а не else к циклу. Значение по умолчанию всегда ставится после цикла — когда весь обход закончен и раннего выхода не случилось."
    },
    {
      id: "l2_alg_p3",
      type: "predict",
      title: "Вложенные циклы и структура",
      explanation: [
        "Цикл внутри цикла собирает список списков. Прогони вручную: какая строка формируется на каждом шаге внешнего цикла?"
      ],
      code: 'result = []\nfor i in range(3):\n    row = []\n    for j in range(i + 1):\n        row.append(j)\n    result.append(row)\nprint(result)',
      expectedOutput: "[[0], [0, 1], [0, 1, 2]]",
      explain: "Внутренний цикл делает i + 1 итераций: i=0 — [0], i=1 — [0, 1], i=2 — [0, 1, 2]. Вложенные циклы — основа работы с матрицами и таблицами из темы про вложенные структуры."
    },
    {
      id: "l2_alg_c3",
      type: "code",
      tier: "main",
      title: "Префиксные суммы",
      explanation: [
        "running_total превращает список чисел в список накопленных сумм: [1, 2, 3] превращается в [1, 3, 6].",
        "Первый элемент не меняется, каждый следующий — сумма всех предыдущих и себя."
      ],
      assignment: "Напиши функцию running_total(nums), которая возвращает новый список: на каждой позиции — сумма элементов nums от начала до этой позиции включительно. Для пустого списка верни пустой список.",
      starterCode: "# Напиши функцию running_total(nums)\n",
      tests: [
        { call: "running_total([1, 2, 3])", returns: [1, 3, 6] },
        { call: "running_total([5])", returns: [5] },
        { call: "running_total([2, -1, 1])", returns: [2, 1, 2], hidden: true },
        { call: "running_total([])", returns: [], hidden: true }
      ],
      hints: [
        "Аккумулятор + новый список одновременно: total накапливает сумму, result.append(total) записывает её на каждом шаге.",
        { code: "def running_total(nums):\n    result = []\n    total = ___\n    for n in nums:\n        total += ___\n        result.___(total)\n    return result" },
        { code: "def running_total(nums):\n    result = []\n    total = 0\n    for n in nums:\n        total += n\n        result.append(total)\n    return result" }
      ],
      improveTip: "Функция возвращает новый список и не трогает исходный — это правильная привычка, мы закрепим её в задаче про починку.",
      successMessage: "Префиксные суммы — фундамент быстрых алгоритмов на отрезках!"
    },
    {
      id: "l2_alg_c4",
      type: "code",
      tier: "main",
      title: "Слияние двух отсортированных списков",
      explanation: [
        "Даны два ОТСОРТИРОВАННЫХ списка. Нужно слить их в один отсортированный, не используя sort и sorted.",
        "Приём называется «два указателя»: i идёт по списку a, j идёт по списку b. На каждом шаге берём меньший из двух текущих элементов."
      ],
      assignment: "Напиши функцию merge_sorted(a, b), которая сливает два отсортированных списка в один отсортированный. Использовать sort() и sorted() запрещено — смысл задания в обходе двумя указателями.",
      starterCode: "# Напиши функцию merge_sorted(a, b) без sort и sorted\n",
      astRequirements: {
        forbid_calls: ["sorted"],
        forbid_methods: ["sort"]
      },
      tests: [
        { call: "merge_sorted([1, 3, 5], [2, 4])", returns: [1, 2, 3, 4, 5] },
        { call: "merge_sorted([1, 2], [1, 3])", returns: [1, 1, 2, 3] },
        { call: "merge_sorted([], [7])", returns: [7], hidden: true },
        { call: "merge_sorted([5], [1, 2])", returns: [1, 2, 5], hidden: true }
      ],
      hints: [
        "Пока в обоих списках есть элементы: сравни a[i] и b[j], меньший добавляй в результат и двигай его указатель.",
        { code: "def merge_sorted(a, b):\n    result = []\n    i = 0\n    j = 0\n    while i < len(a) and j < len(b):\n        if ___:\n            result.append(a[i])\n            i += 1\n        else:\n            result.append(b[j])\n            j += 1\n    while i < len(a):\n        result.append(a[i])\n        i += 1\n    while j < len(b):\n        result.append(b[j])\n        j += 1\n    return result" },
        { code: "def merge_sorted(a, b):\n    result = []\n    i = 0\n    j = 0\n    while i < len(a) and j < len(b):\n        if a[i] <= b[j]:\n            result.append(a[i])\n            i += 1\n        else:\n            result.append(b[j])\n            j += 1\n    while i < len(a):\n        result.append(a[i])\n        i += 1\n    while j < len(b):\n        result.append(b[j])\n        j += 1\n    return result" }
      ],
      improveTip: "Хвостовые while-циклы — обязательная часть: когда один список кончился, остаток второго нужно дописать целиком.",
      successMessage: "Слияние за один проход — так устроен шаг в настоящей сортировке слиянием!"
    },
    {
      id: "l2_alg_p4",
      type: "predict",
      title: "Трассировка слияния",
      explanation: [
        "Ты только что написал merge_sorted. Прогони чужую версию слияния вручную и запиши её вывод."
      ],
      code: 'def merge_sorted(a, b):\n    result = []\n    i = 0\n    j = 0\n    while i < len(a) and j < len(b):\n        if a[i] <= b[j]:\n            result.append(a[i])\n            i += 1\n        else:\n            result.append(b[j])\n            j += 1\n    while i < len(a):\n        result.append(a[i])\n        i += 1\n    while j < len(b):\n        result.append(b[j])\n        j += 1\n    return result\n\nprint(merge_sorted([1, 4], [2, 3, 5]))',
      expectedOutput: "[1, 2, 3, 4, 5]",
      explain: "1 против 2 — берём 1. 4 против 2 — берём 2. 4 против 3 — берём 3. 4 против 5 — берём 4, список a кончился. Хвост b дописывается вторым while: 5."
    },
    {
      id: "l2_alg_c5",
      type: "code",
      tier: "main",
      title: "Нарезка на куски",
      explanation: [
        "Данные часто нарезают порциями: пагинация, батчи, страницы. Нарежь список на куски по k элементов."
      ],
      assignment: "Напиши функцию chunk(nums, k), которая режет список на подряд идущие куски длиной k (последний кусок может быть короче). Возвращает список кусков: chunk([1, 2, 3, 4], 2) — это [[1, 2], [3, 4]].",
      starterCode: "# Напиши функцию chunk(nums, k)\n",
      tests: [
        { call: "chunk([1, 2, 3, 4], 2)", returns: [[1, 2], [3, 4]] },
        { call: "chunk([1, 2, 3], 2)", returns: [[1, 2], [3]] },
        { call: "chunk([], 3)", returns: [], hidden: true },
        { call: "chunk([1, 2, 3, 4, 5], 2)", returns: [[1, 2], [3, 4], [5]], hidden: true }
      ],
      hints: [
        "range умеет идти с шагом: range(0, len(nums), k) даст стартовые индексы кусков 0, k, 2k...",
        { code: "def chunk(nums, k):\n    result = []\n    for i in range(___, ___, ___):\n        result.append(nums[i:i + ___])\n    return result" },
        { code: "def chunk(nums, k):\n    result = []\n    for i in range(0, len(nums), k):\n        result.append(nums[i:i + k])\n    return result" }
      ],
      improveTip: "Срез nums[i:i + k] сам позаботится о коротком хвосте: он не выйдет за границу списка.",
      successMessage: "Нарезка на куски работает — включая неровный хвост!"
    },
    {
      id: "l2_alg_c6",
      type: "code",
      tier: "main",
      title: "Скользящее окно",
      explanation: [
        "Окно длины k «едет» по списку: для каждой позиции окна нужен его максимум. Это основной приём в анализе потоков данных: пики трафика, максимальная температура за сутки."
      ],
      assignment: "Напиши функцию sliding_max(nums, k), которая возвращает список максимумов каждого окна длины k: для [2, 1, 3, 5, 4] и k=2 это [2, 3, 5, 5]. Окна начинаются на позициях от 0 до len(nums) - k включительно.",
      starterCode: "# Напиши функцию sliding_max(nums, k)\n",
      tests: [
        { call: "sliding_max([2, 1, 3, 5, 4], 2)", returns: [2, 3, 5, 5] },
        { call: "sliding_max([4], 1)", returns: [4] },
        { call: "sliding_max([1, 2, 3], 3)", returns: [3], hidden: true },
        { call: "sliding_max([5, 1, 1, 5], 3)", returns: [5, 5], hidden: true },
        { call: "sliding_max([1], 3)", returns: [], hidden: true }
      ],
      hints: [
        "Внешний цикл — старт окна i от 0 до len(nums) - k включительно. Внутренний — по k элементам окна, ищи максимум аккумулятором best.",
        { code: "def sliding_max(nums, k):\n    result = []\n    for i in range(len(nums) - k + 1):\n        best = nums[i]\n        for j in range(i, i + ___):\n            if nums[j] > best:\n                best = ___\n        result.append(best)\n    return result" },
        { code: "def sliding_max(nums, k):\n    result = []\n    for i in range(len(nums) - k + 1):\n        best = nums[i]\n        for j in range(i, i + k):\n            if nums[j] > best:\n                best = nums[j]\n        result.append(best)\n    return result" }
      ],
      improveTip: "range(len(nums) - k + 1) — ключевые границы: именно они гарантируют, что окно целиком помещается в список. Если k больше длины списка, диапазон пуст и вернётся [].",
      successMessage: "Скользящее окно освоено — приём на весь остаток курса!"
    },
    {
      id: "l2_alg_f1",
      type: "code",
      tier: "main",
      kind: "fix",
      title: "Починка: IndexError в поиске последнего",
      explanation: [
        "Функция должна находить индекс ПОСЛЕДНЕГО вхождения x (обходит список с конца назад или запоминает последний подходящий индекс).",
        "Но код падает с IndexError на любом непустом списке. Найди и почини ошибку."
      ],
      assignment: "Функция find_last(nums, x) должна возвращать индекс последнего вхождения x или -1. Исправь код: сейчас он падает с IndexError.",
      starterCode: 'def find_last(nums, x):\n    position = -1\n    for i in range(len(nums) + 1):\n        if nums[i] == x:\n            position = i\n    return position\n',
      tests: [
        { call: "find_last([1, 2, 1], 1)", returns: 2 },
        { call: "find_last([5], 3)", returns: -1 },
        { call: "find_last([2, 2], 2)", returns: 1, hidden: true },
        { call: "find_last([], 1)", returns: -1, hidden: true }
      ],
      hints: [
            "Проверь границы range: индексы списка идут от 0 до len(nums) - 1. range(len(nums) + 1) обращается к nums[len(nums)] — элемента с таким индексом не существует.",
            { code: "def find_last(nums, x):\n    position = -1\n    for i in range(____):\n        if nums[i] == x:\n            position = i\n    return position" },
            { code: "def find_last(nums, x):\n    position = -1\n    for i in range(len(nums)):\n        if nums[i] == x:\n            position = i\n    return position" }
      ],
      improveTip: "Ошибка на единицу (off-by-one) — самый частый баг в циклах. range(len(nums) + 1) всегда пытается взять элемент за границей.",
      successMessage: "Ошибка исправлена: границы диапазона выверены!"
    },
    {
      id: "l2_alg_f2",
      type: "code",
      tier: "main",
      kind: "fix",
      title: "Починка: функция портит вход",
      explanation: [
        "Функция keep_positive должна возвращать НОВЫЙ список из положительных чисел, не меняя переданный список.",
        "Сейчас она удаляет элементы прямо из входного списка — и заодно пропускает часть чисел (удалять элементы во время обхода того же списка нельзя)."
      ],
      assignment: "Исправь keep_positive(nums): она должна возвращать новый список только из положительных элементов nums и НЕ менять сам nums. Скрытые тесты проверяют, что исходный список остался целым.",
      starterCode: 'def keep_positive(nums):\n    for n in nums:\n        if n <= 0:\n            nums.remove(n)\n    return nums\n',
      tests: [
        { call: "(lambda src: keep_positive(src) == [3, 2] and src == [3, -1, 2])([3, -1, 2])", returns: true },
        { call: "keep_positive([-1, -2])", returns: [] },
        { call: "keep_positive([1, 2, 3])", returns: [1, 2, 3] },
        { call: "(lambda src: keep_positive(src) == [] and src == [-1, 0])([-1, 0])", returns: true, hidden: true }
      ],
      hints: [
        "Не удаляй из входного списка — собирай новый: result.append(n) для положительных, исходный nums не трогай.",
        { code: "def keep_positive(nums):\n    result = []\n    for n in nums:\n        if n ___ 0:\n            result.___(n)\n    return result" },
        { code: "def keep_positive(nums):\n    result = []\n    for n in nums:\n        if n > 0:\n            result.append(n)\n    return result" }
      ],
      improveTip: "Удаление элементов во время обхода того же списка сдвигает позиции — часть элементов пропускается. Правило: обходи один список, собирай другой.",
      successMessage: "Ошибка исправлена: функция больше не портит входные данные!"
    },
    {
      id: "l2_alg_t2",
      type: "theory",
      title: "Два указателя и бинарный поиск",
      blocks: [
        {
          type: "p",
          html: "До сих пор мы просматривали списки одним потоком. Когда данные <b>отсортированы</b>, появляются два более быстрых приёма."
        },
        {
          type: "p",
          html: "<b>Бинарный поиск.</b> Ищем x в отсортированном списке. Смотрим на средний элемент: если x больше — вся левая половина отпадает, если меньше — правая. Каждый шаг отрезает половину, поэтому 1024 элемента проверяются за 10 шагов вместо 1024."
        },
        {
          type: "code",
          code: 'a = [1, 3, 5, 7, 9]\n\nlow = 0\nhigh = len(a) - 1\nx = 7\n\nwhile low <= high:\n    mid = (low + high) // 2\n    print("смотрим:", a[mid])\n    if a[mid] == x:\n        break\n    if a[mid] < x:\n        low = mid + 1\n    else:\n        high = mid - 1',
          output: "смотрим: 5\nсмотрим: 7"
        },
        {
          type: "p",
          html: "<b>Два указателя</b> также работают по отсортированным данным: например, найти пару с заданной суммой можно, поставив один указатель в начало, другой в конец, и двигать их навстречу. В звездочке этого раздела ты реализуешь оба приёма."
        },
        {
          type: "note",
          html: "Бинарный поиск работает ТОЛЬКО по отсортированным данным. Сортировка ради одного поиска обычно дороже линейного прохода, но если искать много раз — сортировка окупается."
        }
      ]
    },
    {
      id: "l2_alg_c7",
      type: "code",
      tier: "main",
      title: "Проверка отсортированности",
      explanation: [
        "Прежде чем применять бинарный поиск, полезно убедиться, что данные отсортированы.",
        "Список отсортирован по неубыванию, если каждый элемент не больше следующего."
      ],
      assignment: "Напиши функцию is_sorted(nums), которая возвращает True, если список отсортирован по неубыванию (каждый элемент <= следующего), иначе False. Пустой список и список из одного элемента считаются отсортированными. sort() и sorted() запрещены.",
      starterCode: "# Напиши функцию is_sorted(nums) без sort и sorted\n",
      astRequirements: {
        forbid_calls: ["sorted"],
        forbid_methods: ["sort"]
      },
      tests: [
        { call: "is_sorted([1, 2, 3])", returns: true },
        { call: "is_sorted([3, 1])", returns: false },
        { call: "is_sorted([1, 1, 2])", returns: true, hidden: true },
        { call: "is_sorted([])", returns: true, hidden: true },
        { call: "is_sorted([7])", returns: true, hidden: true }
      ],
      hints: [
        "Сравнивай каждую пару соседей: если нашлась пара, где левый больше правого — сразу return False.",
        { code: "def is_sorted(nums):\n    for i in range(len(nums) - ___):\n        if nums[i] > nums[i + ___]:\n            return ___\n    return ___" },
        { code: "def is_sorted(nums):\n    for i in range(len(nums) - 1):\n        if nums[i] > nums[i + 1]:\n            return False\n    return True" }
      ],
      improveTip: "«Не убывает» значит <= между соседями, поэтому в цикле достаточно поймать случай, когда левый элемент строго больше правого.",
      successMessage: "Проверка отсортированности готова — можно смело запускать бинарный поиск!"
    },
    {
      id: "l2_alg_c8",
      type: "code",
      tier: "main",
      title: "Удаление всех вхождений",
      explanation: [
        "Верни НОВЫЙ список без всех вхождений x. Исходный список не менять — как в починенной keep_positive."
      ],
      assignment: "Напиши функцию remove_all(nums, x), которая возвращает новый список из всех элементов nums, не равных x. Исходный список должен остаться без изменений.",
      starterCode: "# Напиши функцию remove_all(nums, x)\n",
      tests: [
        { call: "remove_all([1, 2, 1, 3], 1)", returns: [2, 3] },
        { call: "remove_all([5], 5)", returns: [] },
        { call: "remove_all([1, 2], 9)", returns: [1, 2], hidden: true },
        { call: "remove_all([], 1)", returns: [], hidden: true }
      ],
      hints: [
        "Обходи исходный список, собирай в новый только те элементы, которые не равны x.",
        { code: "def remove_all(nums, x):\n    result = []\n    for n in nums:\n        if n != ___:\n            result.___(n)\n    return result" },
        { code: "def remove_all(nums, x):\n    result = []\n    for n in nums:\n        if n != x:\n            result.append(n)\n    return result" }
      ],
      improveTip: "Тот же приём «обхожу один — собираю другой», что и в починенной keep_positive. Он безопаснее удаления на месте всегда.",
      successMessage: "Фильтрация без мутации — закреплено!"
    },
    {
      id: "l2_alg_c9",
      type: "code",
      tier: "star",
      optional: true,
      title: "★ Бинарный поиск",
      explanation: [
        "Реализуй бинарный поиск по отсортированному списку: каждый шаг отрезает половину диапазона.",
        "Функция возвращает индекс x или -1, если x нет. Метод .index() запрещён."
      ],
      assignment: "Напиши функцию binary_search(a, x) для ОТСОРТИРОВАННОГО списка a: верни индекс любого вхождения x или -1. Используй low/high/mid, а не линейный перебор и метод .index().",
      starterCode: "# Напиши функцию binary_search(a, x)\n",
      astRequirements: {
        forbid_methods: ["index"]
      },
      tests: [
        { call: "binary_search([1, 3, 5, 7, 9], 5)", returns: 2 },
        { call: "binary_search([1, 3], 2)", returns: -1 },
        { call: "binary_search([1, 3, 5, 7, 9], 1)", returns: 0, hidden: true },
        { call: "binary_search([1, 3, 5, 7, 9], 9)", returns: 4, hidden: true },
        { call: "binary_search([], 5)", returns: -1, hidden: true }
      ],
      hints: [
        "Держи два указателя: low = 0, high = len(a) - 1. Пока low <= high: mid = (low + high) // 2.",
        { code: "def binary_search(a, x):\n    low = 0\n    high = len(a) - 1\n    while low <= high:\n        mid = (low + high) // ___\n        if a[mid] == x:\n            return ___\n        if a[mid] < x:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return ___" },
        { code: "def binary_search(a, x):\n    low = 0\n    high = len(a) - 1\n    while low <= high:\n        mid = (low + high) // 2\n        if a[mid] == x:\n            return mid\n        if a[mid] < x:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return -1" }
      ],
      improveTip: "Сдвиги границ: после a[mid] < x ищем только в правой половине (low = mid + 1), иначе — в левой (high = mid - 1). Обе границы обязаны сдвигаться, иначе цикл зациклится.",
      successMessage: "Бинарный поиск — алгоритм из настоящей промышленности!"
    },
    {
      id: "l2_alg_c10",
      type: "code",
      tier: "star",
      optional: true,
      title: "★ Пара с нужной суммой",
      explanation: [
        "Есть ли в списке два РАЗНЫХ элемента (по позиции), сумма которых равна s?",
        "Прямое решение — проверить все пары индексов i < j вложенным циклом. Два указателя по отсортированной копии сделали бы это быстрее, но начни с честного перебора пар."
      ],
      assignment: "Напиши функцию pairs_with_sum(nums, s), которая возвращает True, если в списке существуют два элемента на разных позициях с суммой s, иначе False. Один и тот же элемент дважды использовать нельзя: для [5] и s=10 ответ False.",
      starterCode: "# Напиши функцию pairs_with_sum(nums, s)\n",
      tests: [
        { call: "pairs_with_sum([1, 2, 3], 4)", returns: true },
        { call: "pairs_with_sum([1, 2], 5)", returns: false },
        { call: "pairs_with_sum([5, 5], 10)", returns: true, hidden: true },
        { call: "pairs_with_sum([5], 10)", returns: false, hidden: true },
        { call: "pairs_with_sum([], 3)", returns: false, hidden: true }
      ],
      hints: [
        "Два индекса: i идёт по всем позициям, j — строго правее i (range(i + 1, len(nums))).",
        { code: "def pairs_with_sum(nums, s):\n    for i in range(len(nums)):\n        for j in range(i + 1, ___):\n            if nums[i] + nums[j] == ___:\n                return ___\n    return False" },
        { code: "def pairs_with_sum(nums, s):\n    for i in range(len(nums)):\n        for j in range(i + 1, len(nums)):\n            if nums[i] + nums[j] == s:\n                return True\n    return False" }
      ],
      improveTip: "Требование «разные позиции» превращается в j = i + 1 — одна деталь границы цикла, а сколько скрытых багов она отсекает.",
      successMessage: "Перебор пар освоен — это база для задач на множества и таблицы!"
    },
    {
      id: "l2_alg_t3",
      type: "theory",
      title: "Как читать чужой код",
      blocks: [
        {
          type: "p",
          html: "В программировании читать чужой код приходится чаще, чем писать свой. Следующая тема Практикума — сплошная работа с чужим кодом, поэтому зафиксируем приёмы чтения."
        },
        {
          type: "list",
          items: [
            "<b>Прогони на примере</b>: возьми маленький вход и пройди код построчно, ведя таблицу значений переменных.",
            "<b>Найди границы</b>: где начинаются и заканчиваются циклы, не вылезают ли индексы за len - 1.",
            "<b>Найди инвариант</b>: что верно на каждом шаге цикла? Если инвариант не понимаешь — код ты не понял.",
            "<b>Проверь крайние случаи</b>: пустой список, один элемент, дубликаты, отрицательные числа. Код почти всегда ломается на краях."
          ]
        },
        {
          type: "p",
          html: "В заданиях «найди ошибку» работай по этому же списку: сначала крайние случаи, потом границы, потом инвариант. Ошибка почти всегда лежит там."
        },
        {
          type: "note",
          html: "Профессиональная привычка: прежде чем исправлять чужой код, сумей словами объяснить, ЧТО он должен делать и ПОЧЕМУ сейчас этого не делает. Исправление без понимания — это замена одной ошибки другой."
        }
      ]
    }
  ]
});
