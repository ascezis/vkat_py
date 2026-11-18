/**
 * вкат.py — Практикум, тема 1: «Прикладные алгоритмы: обработка данных»
 * Этап «Практикум».
 * Применение изученного на реальных инженерных сценариях:
 * логи серверов, телеметрия, биллинг, ленты событий, пагинация, поиск без сбоев.
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
      glyph: "l2_alg_t1",
      title: "Алгоритм — это рецепт для данных",
      blocks: [
        {
          type: "p",
          html: "В основном курсе ты изучил синтаксис: списки, циклы, функции. В реальной разработке из них собирают <b>прикладные алгоритмы</b> — пошаговые рецепты обработки данных: «найди первую ошибку в логе сервера», «сбалансируй историю транзакций», «нарежь товары на страницы каталога»."
        },
        {
          type: "code",
          code: 'statuses = [200, 200, 500, 404, 200]\n\n# Ищем первый код сбоя сервера (>= 400)\nfirst_err = -1\nfor i in range(len(statuses)):\n    if statuses[i] >= 400:\n        first_err = i\n        break\n\nprint("Первый сбой на позиции:", first_err)',
          output: "Первый сбой на позиции: 2"
        },
        {
          type: "p",
          html: "Любая прикладная обработка данных держится на трёх базовых концепциях:"
        },
        {
          type: "list",
          items: [
            "<b>Аккумулятор</b> — переменная, накапливающая результат по мере обхода (счётчик ошибок, итоговый баланс, отфильтрованный список).",
            "<b>Ранний выход</b> — <code>return</code> или <code>break</code> сразу, как только результат получен (незачем крутить миллион записей дальше, если нужная уже найдена).",
            "<b>Значение по умолчанию</b> — предсказуемый ответ, если совпадений не обнаружено (<code>-1</code>, <code>0</code> или пустой список <code>[]</code>)."
          ]
        },
        {
          type: "note",
          html: "Прежде чем писать цикл обработки, ответь себе на три вопроса: <b>что накапливаю</b>, <b>когда могу остановиться</b>, <b>что вернуть, если данных нет</b>. Эти три ответа — уже готовый скелет кода."
        }
      ]
    },
    {
      id: "l2_alg_q1",
      type: "quiz",
      glyph: "l2_alg_q1",
      title: "Инвариант линейного поиска",
      question: "Функция ищет индекс первого сбоя x в списке логов nums. Какое утверждение про её цикл верно?",
      code: 'def find_first(nums, x):\n    for i in range(len(nums)):\n        if nums[i] == x:\n            return i\n    return -1',
      options: [
        "Цикл обязан пройти весь список до конца, даже если x встретился на первом шаге",
        "Если цикл дошёл до конца и не нашёл x, функция возвращает -1",
        "Цикл возвращает -1, если x нашёлся"
      ],
      correct: 1,
      explain: "Это и есть значение по умолчанию: если обход закончился без раннего выхода, запись не найдена — возвращаем -1. А при обнаружении x срабатывает мгновенный ранний выход return i."
    },
    {
      id: "l2_alg_p1",
      type: "predict",
      glyph: "l2_alg_p1",
      title: "Трассировка аккумулятора",
      explanation: [
        "Биллинг-система обрабатывает транзакции по счёту. Прогони код в голове и запиши значения баланса в консоли (одна строка вывода — одна операция)."
      ],
      code: 'total = 0\nfor n in [4, -1, 5]:\n    total += n\n    print(total)',
      expectedOutput: "4\n3\n8",
      explain: "Аккумулятор печатается после каждого шага: баланс +4, затем списание -1 (стало 3), затем пополнение +5 (стало 8). Трассировка изменений переменной — главный навык инженера."
    },
    {
      id: "l2_alg_p2",
      type: "predict",
      glyph: "l2_alg_p2",
      title: "Ранний выход в мониторинге",
      explanation: [
        "Служба мониторинга сканирует сетевые пакеты в поисках подозрительного кода. Сколько итераций сделает каждый вызов и что вернёт?"
      ],
      code: 'def find_first(nums, x):\n    for i in range(len(nums)):\n        if nums[i] == x:\n            return i\n    return -1\n\nprint(find_first([10, 20, 30, 40], 30))\nprint(find_first([10, 20], 99))',
      expectedOutput: "2\n-1",
      explain: "Первый вызов: пакет 30 обнаружен на позиции 2 — сработал ранний выход, хвост списка сервер даже не читал. Второй: проверены все пакеты, подозрительный код не встретился — вернулся код -1."
    },
    {
      id: "l2_alg_c1",
      type: "code",
      tier: "warmup",
      glyph: "l2_alg_c1",
      title: "Первая ошибка в логе",
      explanation: [
        "В мониторинге сервиса хранится список статус-кодов запросов `nums`. Нужно быстро определить индекс первого возникновения сбоя `x` (например, ошибки 404 или 500).",
        "Если код `x` ни разу не встречался — верни -1.",
        "Запрещается использовать встроенный метод .index() — напиши свой цикл с ранним выходом, чтобы понимать, как поиск работает под капотом."
      ],
      assignment: "Напиши функцию find_first(nums, x), которая возвращает индекс первого вхождения элемента x в список nums или -1, если x не встречается.",
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
        "Обойди список по индексам: for i in range(len(nums)). Как только nums[i] == x — сразу сделай return i.",
        { code: "def find_first(nums, x):\n    for i in range(len(nums)):\n        if nums[i] == ___:\n            return ___\n    return ___" },
        { code: "def find_first(nums, x):\n    for i in range(len(nums)):\n        if nums[i] == x:\n            return i\n    return -1" }
      ],
      improveTip: "Ранний выход экономит ресурсы сервера: если ошибка произошла в самом начале списка из 1 000 000 записей, функция остановится мгновенно.",
      successMessage: "Поиск с ранним выходом готов: сервис мгновенно находит позицию инцидента!"
    },
    {
      id: "l2_alg_c2",
      type: "code",
      tier: "warmup",
      glyph: "l2_alg_c2",
      title: "Датчик аномалий нагрузки",
      explanation: [
        "Датчик сервера каждую секунду записывает процент загрузки CPU в список `nums`.",
        "Администратору нужно знать, сколько раз за период нагрузка превышала критический порог `limit`."
      ],
      assignment: "Напиши функцию count_greater(nums, limit), которая возвращает количество замеров в списке nums, строго превышающих пороговое значение limit.",
      starterCode: "# Напиши функцию count_greater(nums, limit)\n",
      tests: [
        { call: "count_greater([1, 5, 8], 4)", returns: 2 },
        { call: "count_greater([3, 3, 3], 3)", returns: 0 },
        { call: "count_greater([2, 9], 0)", returns: 2 },
        { call: "count_greater([], 1)", returns: 0, hidden: true },
        { call: "count_greater([-5, 10], 0)", returns: 1, hidden: true }
      ],
      hints: [
        "Заведи счётчик count = 0. При обходе элементов: если n > limit — увеличивай счётчик на единицу.",
        { code: "def count_greater(nums, limit):\n    count = 0\n    for n in nums:\n        if n > ___:\n            ___ += 1\n    return count" },
        { code: "def count_greater(nums, limit):\n    count = 0\n    for n in nums:\n        if n > limit:\n            count += 1\n    return count" }
      ],
      improveTip: "«Строго больше» означает оператор >, а не >=. Для замеров [3, 3, 3] при пороге 3 превышений нет (ответ 0).",
      successMessage: "Счётчик аномалий работает чётко!"
    },
    {
      id: "l2_alg_q2",
      type: "quiz",
      glyph: "l2_alg_q2",
      title: "Куда поставить дефолтный возврат",
      question: "Разработчик писал функцию поиска ошибки в базе. Что сломано в логике?",
      code: 'def find_first(nums, x):\n    for i in range(len(nums)):\n        if nums[i] == x:\n            return i\n    else:\n        return -1',
      options: [
        "return -1 нужно ставить после цикла, а не в else к for — иначе функция вернёт -1 на первой же итерации, если x не равен первому элементу",
        "Всё верно: else к циклу — это стандартная конструкция",
        "Ошибка в отступах"
      ],
      correct: 0,
      explain: "Ветка else с отступом уровня if внутри цикла сработает сразу на первом же несовпавшем элементе. Возврат значения по умолчанию должен происходить строго после завершения всего цикла."
    },
    {
      id: "l2_alg_p3",
      type: "predict",
      glyph: "l2_alg_p3",
      title: "Генератор сетки пикселей",
      explanation: [
        "Движок формирует двумерную матрицу координат для рендера. Какая структура окажется в памяти в конце работы?"
      ],
      code: 'result = []\nfor i in range(3):\n    row = []\n    for j in range(i + 1):\n        row.append(j)\n    result.append(row)\nprint(result)',
      expectedOutput: "[[0], [0, 1], [0, 1, 2]]",
      explain: "Внутренний цикл строит строки разной длины: при i=0 строка [0], при i=1 — [0, 1], при i=2 — [0, 1, 2]. Сборка списков списков — базовый кирпичик работы с матрицами и таблицами."
    },
    {
      id: "l2_alg_c3",
      type: "code",
      tier: "main",
      glyph: "l2_alg_c3",
      title: "График изменения баланса",
      explanation: [
        "Финтех-сервис получает список транзакций `nums` (пополнения и списания).",
        "Чтобы нарисовать график баланса в приложении банка, нужен список накопленного итога после каждого шага: [1, 2, 3] превращается в [1, 3, 6].",
        "Первое значение равно первой транзакции, второе — сумме первой и второй, и так далее."
      ],
      assignment: "Напиши функцию running_total(nums), которая формирует новый список: на каждой позиции — суммарный баланс от начала до текущей транзакции включительно. Для пустого списка транзакций верни [].",
      starterCode: "# Напиши функцию running_total(nums)\n",
      tests: [
        { call: "running_total([1, 2, 3])", returns: [1, 3, 6] },
        { call: "running_total([5])", returns: [5] },
        { call: "running_total([2, -1, 1])", returns: [2, 1, 2], hidden: true },
        { call: "running_total([])", returns: [], hidden: true }
      ],
      hints: [
        "Используй аккумулятор total = 0 и результирующий список result = []. На каждом шаге цикла: total += n, затем result.append(total).",
        { code: "def running_total(nums):\n    result = []\n    total = ___\n    for n in nums:\n        total += ___\n        result.___(total)\n    return result" },
        { code: "def running_total(nums):\n    result = []\n    total = 0\n    for n in nums:\n        total += n\n        result.append(total)\n    return result" }
      ],
      improveTip: "Функция возвращает абсолютно новый список и не трогает входные данные — это критично для финансового ПО.",
      successMessage: "История баланса сформирована — префиксные суммы освоены!"
    },
    {
      id: "l2_alg_c4",
      type: "code",
      tier: "main",
      glyph: "l2_alg_c4",
      title: "Единая лента сообщений",
      explanation: [
        "Мессенджер синхронизирует сообщения из двух каналов `a` и `b`. Оба канала УЖЕ отсортированы по времени (меткам timestamp).",
        "Нужно слить их в одну непрерывную хронологическую ленту. Применять .sort() и sorted() запрещено — это сделало бы лишнюю тяжёлую работу. Используй классический обход «двумя указателями»: сравнивай текущие сообщения в `a` и `b` и бери то, что было раньше."
      ],
      assignment: "Напиши функцию merge_sorted(a, b), которая сливает два отсортированных списка в один общий отсортированный список. Использовать sort() и sorted() запрещено.",
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
        "Пока в обоих списках есть элементы: сравни a[i] и b[j], меньший добавляй в результат и двигай его указатель (i += 1 или j += 1). Когда один список исчерпан, допиши остаток второго.",
        { code: "def merge_sorted(a, b):\n    result = []\n    i = 0\n    j = 0\n    while i < len(a) and j < len(b):\n        if ___:\n            result.append(a[i])\n            i += 1\n        else:\n            result.append(b[j])\n            j += 1\n    while i < len(a):\n        result.append(a[i])\n        i += 1\n    while j < len(b):\n        result.append(b[j])\n        j += 1\n    return result" },
        { code: "def merge_sorted(a, b):\n    result = []\n    i = 0\n    j = 0\n    while i < len(a) and j < len(b):\n        if a[i] <= b[j]:\n            result.append(a[i])\n            i += 1\n        else:\n            result.append(b[j])\n            j += 1\n    while i < len(a):\n        result.append(a[i])\n        i += 1\n    while j < len(b):\n        result.append(b[j])\n        j += 1\n    return result" }
      ],
      improveTip: "Хвостовые циклы while обязательны: если в одном чате сообщения закончились, оставшиеся сообщения второго чата переносятся в ленту целиком.",
      successMessage: "Слияние лент за один проход готово — чистый алгоритм двух указателей!"
    },
    {
      id: "l2_alg_p4",
      type: "predict",
      glyph: "l2_alg_p4",
      title: "Трассировка двух потоков",
      explanation: [
        "Служба агрегации объединяет два потока событий. Проследи по шагам, как элементы попадают в результирующую очередь."
      ],
      code: 'def merge_sorted(a, b):\n    result = []\n    i = 0\n    j = 0\n    while i < len(a) and j < len(b):\n        if a[i] <= b[j]:\n            result.append(a[i])\n            i += 1\n        else:\n            result.append(b[j])\n            j += 1\n    while i < len(a):\n        result.append(a[i])\n        i += 1\n    while j < len(b):\n        result.append(b[j])\n        j += 1\n    return result\n\nprint(merge_sorted([1, 4], [2, 3, 5]))',
      expectedOutput: "[1, 2, 3, 4, 5]",
      explain: "Сравнение: 1 против 2 — забрали 1. Затем 4 против 2 — забрали 2. Затем 4 против 3 — забрали 3. Затем 4 против 5 — забрали 4 (поток 'a' исчерпан). Хвост потока 'b' (5) перенесён в конец."
    },
    {
      id: "l2_alg_c5",
      type: "code",
      tier: "main",
      glyph: "l2_alg_c5",
      title: "Постраничный вывод товаров",
      explanation: [
        "В интернет-магазине список товаров `nums` выводится постранично (плиткой по `k` штук на страницу).",
        "Нужно разбить исходный список на порции (батчи) длиной `k`. Последняя страница может содержать меньше элементов, если на полную порцию не хватило."
      ],
      assignment: "Напиши функцию chunk(nums, k), которая делит список на порции длиной k. Возвращает список порций: chunk([1, 2, 3, 4], 2) -> [[1, 2], [3, 4]].",
      starterCode: "# Напиши функцию chunk(nums, k)\n",
      tests: [
        { call: "chunk([1, 2, 3, 4], 2)", returns: [[1, 2], [3, 4]] },
        { call: "chunk([1, 2, 3], 2)", returns: [[1, 2], [3]] },
        { call: "chunk([], 3)", returns: [], hidden: true },
        { call: "chunk([1, 2, 3, 4, 5], 2)", returns: [[1, 2], [3, 4], [5]], hidden: true }
      ],
      hints: [
        "Функция range может шагать с шагом k: range(0, len(nums), k). На каждой итерации делай срез nums[i:i + k].",
        { code: "def chunk(nums, k):\n    result = []\n    for i in range(___, ___, ___):\n        result.append(nums[i:i + ___])\n    return result" },
        { code: "def chunk(nums, k):\n    result = []\n    for i in range(0, len(nums), k):\n        result.append(nums[i:i + k])\n    return result" }
      ],
      improveTip: "Срезы в Python безопасны к выходу за границу: nums[i:i + k] автоматически корректно заберёт короткий остаток в конце списка.",
      successMessage: "Пагинация каталога работает без сбоев!"
    },
    {
      id: "l2_alg_c6",
      type: "code",
      tier: "main",
      glyph: "l2_alg_c6",
      title: "Пиковый FPS в скользящем окне",
      explanation: [
        "Игровой бенчмарк записывает частоту кадров FPS каждую секунду в список `nums`.",
        "Чтобы выявить локальные всплески производительности, аналитик смотрит на **скользящее окно** шириной `k` секунд и находит максимум в каждом интервале.",
        "Для замеров [2, 1, 3, 5, 4] при k=2 окна будут: [2, 1] (макс 2), [1, 3] (макс 3), [3, 5] (макс 5), [5, 4] (макс 5) -> результат [2, 3, 5, 5]."
      ],
      assignment: "Напиши функцию sliding_max(nums, k), которая вычисляет максимум в каждом скользящем окне длины k. Если k больше длины списка nums — верни пустой список [].",
      starterCode: "# Напиши функцию sliding_max(nums, k)\n",
      tests: [
        { call: "sliding_max([2, 1, 3, 5, 4], 2)", returns: [2, 3, 5, 5] },
        { call: "sliding_max([4], 1)", returns: [4] },
        { call: "sliding_max([1, 2, 3], 3)", returns: [3] },
        { call: "sliding_max([5, 1, 1, 5], 3)", returns: [5, 5], hidden: true },
        { call: "sliding_max([1], 3)", returns: [], hidden: true }
      ],
      hints: [
        "Скользящее окно длины k может начинаться с индекса 0 до len(nums) - k включительно. Для каждого среза окна ищи максимум.",
        { code: "def sliding_max(nums, k):\n    result = []\n    for i in range(len(nums) - k + 1):\n        best = nums[i]\n        for j in range(i, i + ___):\n            if nums[j] > best:\n                best = ___\n        result.append(best)\n    return result" },
        { code: "def sliding_max(nums, k):\n    result = []\n    for i in range(len(nums) - k + 1):\n        best = nums[i]\n        for j in range(i, i + k):\n            if nums[j] > best:\n                best = nums[j]\n        result.append(best)\n    return result" }
      ],
      improveTip: "Выражение range(len(nums) - k + 1) — золотой стандарт скользящих окон. Если список короче размера окна k, диапазон пуст и функция вернёт [].",
      successMessage: "Скользящее окно рассчитано верно — мощный инструмент анализа телеметрии!"
    },
    {
      id: "l2_alg_f1",
      type: "code",
      tier: "main",
      kind: "fix",
      glyph: "l2_alg_f1",
      title: "Починка: сбой бота из-за границы диапазона",
      explanation: [
        "Телеграм-бот ищет в истории сообщений индекс ПОСЛЕДНЕГО вхождения команды `x`.",
        "Однако бот падает в проде с фатальной ошибкой `IndexError` на любых реальных данных. Найди ошибку в границах цикла и почини её."
      ],
      assignment: "Функция find_last(nums, x) должна возвращать индекс последнего вхождения x или -1. Устрани ошибку IndexError: сейчас код вылезает за пределы допустимых индексов списка.",
      starterCode: 'def find_last(nums, x):\n    position = -1\n    for i in range(len(nums) + 1):\n        if nums[i] == x:\n            position = i\n    return position\n',
      tests: [
        { call: "find_last([1, 2, 1], 1)", returns: 2 },
        { call: "find_last([5], 3)", returns: -1 },
        { call: "find_last([2, 2], 2)", returns: 1, hidden: true },
        { call: "find_last([], 1)", returns: -1, hidden: true }
      ],
      hints: [
        "Индексы элементов идут от 0 до len(nums) - 1. Конструкция range(len(nums) + 1) пытается обратиться к элементу с индексом len(nums), которого в списке нет.",
        { code: "def find_last(nums, x):\n    position = -1\n    for i in range(____):\n        if nums[i] == x:\n            position = i\n    return position" },
        { code: "def find_last(nums, x):\n    position = -1\n    for i in range(len(nums)):\n        if nums[i] == x:\n            position = i\n    return position" }
      ],
      improveTip: "Ошибка на единицу (Off-by-one) — самый популярный баг начинающих разработчиков. Помни: range(n) перебирает ровно n элементов от 0 до n - 1.",
      successMessage: "Индекс исправлен — бот больше не падает!"
    },
    {
      id: "l2_alg_f2",
      type: "code",
      tier: "main",
      kind: "fix",
      glyph: "l2_alg_f2",
      title: "Починка: повреждение исходной базы",
      explanation: [
        "Сервис фильтрации `keep_positive` должен вернуть НОВЫЙ список положительных чисел, не изменяя оригинальный массив `nums`.",
        "Сейчас код удаляет отрицательные числа прямо «на лету» во время обхода `nums.remove(...)`. Из-за этого сдвигаются индексы, часть чисел пропускается, а исходная база безвозвратно портится!"
      ],
      assignment: "Исправь keep_positive(nums): функция должна собрать и вернуть новый список только из положительных чисел (n > 0), оставив исходный список nums нетронутым.",
      starterCode: 'def keep_positive(nums):\n    for n in nums:\n        if n <= 0:\n            nums.remove(n)\n    return nums\n',
      tests: [
        { call: "(lambda src: keep_positive(src) == [3, 2] and src == [3, -1, 2])([3, -1, 2])", returns: true },
        { call: "keep_positive([-1, -2])", returns: [] },
        { call: "keep_positive([1, 2, 3])", returns: [1, 2, 3] },
        { call: "(lambda src: keep_positive(src) == [] and src == [-1, 0])([-1, 0])", returns: true, hidden: true }
      ],
      hints: [
        "Золотое правило чистого кода: никогда не изменяй список во время цикла по нему. Заведи result = [] и добавляй в него элементы: if n > 0: result.append(n).",
        { code: "def keep_positive(nums):\n    result = []\n    for n in nums:\n        if n ___ 0:\n            result.___(n)\n    return result" },
        { code: "def keep_positive(nums):\n    result = []\n    for n in nums:\n        if n > 0:\n            result.append(n)\n    return result" }
      ],
      improveTip: "Принцип неизменяемости (immutability) входных аргументов спасает продакшен от невидимых мутаций данных.",
      successMessage: "Мутация устранена: функция безопасна для продакшена!"
    },
    {
      id: "l2_alg_t2",
      type: "theory",
      glyph: "l2_alg_t2",
      title: "Упорядоченные реестры: логарифмическая скорость",
      blocks: [
        {
          type: "p",
          html: "Когда в базе миллионы записей, линейный перебор <code>for x in nums</code> становится непозволительно медленным. Но если данные <b>отсортированы</b>, включаются алгоритмы другого порядка скорости."
        },
        {
          type: "p",
          html: "<b>Бинарный поиск.</b> Как поиск контакта в телефонной книге: мы открываем середину списка. Если нужная фамилия дальше — вся левая половина сразу отбрасывается. Каждый шаг делит объём работы ровно пополам: <b>1 000 000 записей проверяются всего за 20 шагов</b> вместо миллиона!"
        },
        {
          type: "code",
          code: 'a = [10, 20, 30, 40, 50, 60, 70]\nlow = 0\nhigh = len(a) - 1\nx = 50\n\nwhile low <= high:\n    mid = (low + high) // 2\n    print("проверяем ячейку mid:", mid, "со значением:", a[mid])\n    if a[mid] == x:\n        print("найдено на позиции:", mid)\n        break\n    elif a[mid] < x:\n        low = mid + 1\n    else:\n        high = mid - 1',
          output: "проверяем ячейку mid: 3 со значением: 40\nпроверяем ячейку mid: 5 со значением: 60\nпроверяем ячейку mid: 4 со значением: 50\nнайдено на позиции: 4"
        },
        {
          type: "note",
          html: "Бинарный поиск работает <b>только по отсортированным данным</b>. Прежде чем его вызывать, нужно либо знать, что данные упорядочены, либо проверить их валидатором."
        }
      ]
    },
    {
      id: "l2_alg_c7",
      type: "code",
      tier: "main",
      glyph: "l2_alg_c7",
      title: "Валидатор хронологии событий",
      explanation: [
        "Перед применением быстрых поисковых алгоритмов валидатор должен убедиться, что события в списке `nums` идут строго по порядку возрастания (каждое следующее >= предыдущего).",
        "Если порядок нарушен хотя бы в одном месте — сразу верни False.",
        "Использовать функции sort() и sorted() запрещено."
      ],
      assignment: "Напиши функцию is_sorted(nums), которая возвращает True, если список отсортирован по неубыванию (каждый nums[i] <= nums[i + 1]), иначе False. Пустой список и список из одного элемента считаются валидными.",
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
        "Сравнивай соседние элементы в цикле for i in range(len(nums) - 1). Если левый элемент оказался строго больше правого (nums[i] > nums[i + 1]) — сразу return False.",
        { code: "def is_sorted(nums):\n    for i in range(len(nums) - ___):\n        if nums[i] > nums[i + ___]:\n            return ___\n    return ___" },
        { code: "def is_sorted(nums):\n    for i in range(len(nums) - 1):\n        if nums[i] > nums[i + 1]:\n            return False\n    return True" }
      ],
      improveTip: "Обрати внимание на границу len(nums) - 1: последний элемент проверяется в паре с предпоследним, дальше идти нельзя.",
      successMessage: "Валидатор хронологии готов — данные можно безопасно передавать в быстрый поиск!"
    },
    {
      id: "l2_alg_c8",
      type: "code",
      tier: "main",
      glyph: "l2_alg_c8",
      title: "Очистка базы от спам-идентификаторов",
      explanation: [
        "Система безопасности блокирует нарушителя с ID `x`. Нужно очистить список сообщений от всех упоминаний `x`.",
        "Функция должна вернуть НОВЫЙ чистый список. Исходный список изменять нельзя."
      ],
      assignment: "Напиши функцию remove_all(nums, x), которая возвращает новый список из всех элементов nums, не равных x. Исходный список nums должен остаться без изменений.",
      starterCode: "# Напиши функцию remove_all(nums, x)\n",
      tests: [
        { call: "remove_all([1, 2, 1, 3], 1)", returns: [2, 3] },
        { call: "remove_all([5], 5)", returns: [] },
        { call: "remove_all([1, 2], 9)", returns: [1, 2], hidden: true },
        { call: "remove_all([], 1)", returns: [], hidden: true }
      ],
      hints: [
        "Обходи список nums и добавляй в новый список result только те элементы, которые не равны x (if n != x).",
        { code: "def remove_all(nums, x):\n    result = []\n    for n in nums:\n        if n != ___:\n            result.___(n)\n    return result" },
        { code: "def remove_all(nums, x):\n    result = []\n    for n in nums:\n        if n != x:\n            result.append(n)\n    return result" }
      ],
      improveTip: "Паттерн фильтрации «читаем один список — наполняем новый» гарантирует отсутствие скрытых побочных эффектов.",
      successMessage: "Спам-фильтрация завершена успешно!"
    },
    {
      id: "l2_alg_c9",
      type: "code",
      tier: "star",
      optional: true,
      glyph: "l2_alg_c9",
      title: "★ Бинарный поиск в реестре",
      explanation: [
        "Промышленная задача: найти позицию записи `x` в гигантском отсортированном реестре `a`.",
        "Реализуй классический бинарный поиск, отсекающий половину диапазона на каждой итерации. Верни индекс элемента или -1, если элемента в базе нет.",
        "Линейный перебор for и встроенный .index() запрещены."
      ],
      assignment: "Напиши функцию binary_search(a, x) для отсортированного списка a: верни индекс элемента x или -1 при его отсутствии. Используй указатели low, high и mid.",
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
        "Держи границы поиска low = 0 и high = len(a) - 1. В цикле while low <= high находи mid = (low + high) // 2.",
        { code: "def binary_search(a, x):\n    low = 0\n    high = len(a) - 1\n    while low <= high:\n        mid = (low + high) // ___\n        if a[mid] == x:\n            return ___\n        if a[mid] < x:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return ___" },
        { code: "def binary_search(a, x):\n    low = 0\n    high = len(a) - 1\n    while low <= high:\n        mid = (low + high) // 2\n        if a[mid] == x:\n            return mid\n        if a[mid] < x:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return -1" }
      ],
      improveTip: "Обязательно смещай границы: low = mid + 1 или high = mid - 1. Если не вычесть/прибавить 1, алгоритм может зациклиться на отрезке из двух элементов.",
      successMessage: "Звёздный алгоритм взят: бинарный поиск работает на максимальной скорости!"
    },
    {
      id: "l2_alg_c10",
      type: "code",
      tier: "star",
      optional: true,
      glyph: "l2_alg_c10",
      title: "★ Подбор товаров под купон скидки",
      explanation: [
        "В интернет-магазине действует промокод на сумму `s`. Клиент хочет оплатить им ровно ДВА товара из корзины `nums` (без доплаты и остатка).",
        "Нужно проверить, есть ли в корзине два РАЗНЫХ товара, сумма цен которых точно равна `s`.",
        "Один и тот же товар дважды использовать нельзя (для корзины [5] и купона 10 ответ False)."
      ],
      assignment: "Напиши функцию pairs_with_sum(nums, s), которая возвращает True, если в списке nums есть два элемента на разных позициях с суммой s, иначе False.",
      starterCode: "# Напиши функцию pairs_with_sum(nums, s)\n",
      tests: [
        { call: "pairs_with_sum([1, 2, 3], 4)", returns: true },
        { call: "pairs_with_sum([1, 2], 5)", returns: false },
        { call: "pairs_with_sum([5, 5], 10)", returns: true, hidden: true },
        { call: "pairs_with_sum([5], 10)", returns: false, hidden: true },
        { call: "pairs_with_sum([], 3)", returns: false, hidden: true }
      ],
      hints: [
        "Организуй перебор всех уникальных пар: внешний индекс i идёт от 0 до конца, внутренний j начинается строго правее (range(i + 1, len(nums))).",
        { code: "def pairs_with_sum(nums, s):\n    for i in range(len(nums)):\n        for j in range(i + 1, ___):\n            if nums[i] + nums[j] == ___:\n                return ___\n    return False" },
        { code: "def pairs_with_sum(nums, s):\n    for i in range(len(nums)):\n        for j in range(i + 1, len(nums)):\n            if nums[i] + nums[j] == s:\n                return True\n    return False" }
      ],
      improveTip: "Инициализация j = i + 1 не только исключает повторное использование одного товара, но и защищает от проверки дублирующих пар (i, j) и (j, i).",
      successMessage: "Подбор пар освоен — классическая задача решена чисто!"
    },
    {
      id: "l2_alg_t3",
      type: "theory",
      glyph: "l2_alg_t3",
      title: "Инженерный аудит чужого кода",
      blocks: [
        {
          type: "p",
          html: "В коммерческой разработке программисты читают и отлаживают чужой код значительно чаще, чем пишут свой с нуля. Чтобы делать это быстро и без стресса, используй чек-лист аудита:"
        },
        {
          type: "list",
          items: [
            "<b>Прогони на микро-примере</b>: возьми массив из 2–3 элементов и мысленно пройди строки, выписывая значения в блокнот.",
            "<b>Проверь границы диапазонов</b>: где начинаются и заканчиваются циклы, нет ли типичной ошибки <code>range(len(nums) + 1)</code>.",
            "<b>Проверь крайние случаи (Edge cases)</b>: пустой список <code>[]</code>, список из одного элемента, одинаковые числа, отрицательные значения. Почти все баги прячутся на краях данных.",
            "<b>Следи за мутацией</b>: не изменяет ли функция входной список прямо во время итерации по нему."
          ]
        },
        {
          type: "note",
          html: "Главное правило инженера: прежде чем менять чужой код, сумей словами чётко сформулировать: <b>что код должен делать</b> и <b>почему прямо сейчас он этого не делает</b>."
        }
      ]
    }
  ]
});
