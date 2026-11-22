// Практикум: Лаборатория отладки (l2_debug_lab)
// Третья тема Практикума: ученики читают трейсбеки, локализуют баг и чинят чужой код.
// Ядро — задания kind:"fix": starterCode содержит один баг, тесты ловят неверное поведение.
// Тон и схема — как в l2_algorithms (docs/content-format.md §5).

window.COURSE_TOPICS = window.COURSE_TOPICS || [];
window.COURSE_TOPICS.push({
  id: "l2_debug_lab",
  title: "Лаборатория отладки: трейсбек, гипотеза, фикс",
  minutes: 70,
  items: [
    // ─── 1. Теория: как читать трейсбек ────────────────────────────────────────
    {
      id: "l2_dbg_t1",
      type: "theory",
      glyph: "l2_dbg_t1",
      title: "Трейсбек — это карта, а не приговор",
      blocks: [
        { type: "p", html: "Ты уже писал свои программы и ловил свои ошибки. Теперь тебе будут приносить <b>чужой</b> код, который падает. Хорошая новость: Python почти всегда сам говорит, где и что сломалось — нужно уметь читать его отчёт. Этот отчёт называется <b>трейсбек</b> (traceback — «след стека»)." },
        { type: "code",
          code: 'Traceback (most recent call last):\n  File "bot.py", line 12, in <module>\n    handler = routes[command]\nKeyError: \'stop\'',
          output: "KeyError: 'stop'" },
        { type: "p", html: "Читай трейсбек <b>снизу вверх</b>. Последняя строка — тип ошибки и сообщение: здесь словарь не нашёл ключ <code>stop</code>. Строкой выше — файл и номер строки, где это произошло: <code>bot.py, строка 12</code>. Ещё выше — цепочка вызовов, которая к этому привела: в большой программе она покажет путь от точки входа до места падения." },
        { type: "list", items: [
          "<b>Последняя строка</b> — тип ошибки. Начинай с неё: IndexError говорит про границы списка, KeyError — про отсутствующий ключ, TypeError — про несовместимые типы.",
          "<b>Номер строки</b> — точка падения. Но чинить иногда нужно не её, а код, который привёл к ней: например, неверный индекс посчитали на строке выше.",
          "<b>Сообщение</b> — конкретика: какой ключ не найден, какой индекс запросили, какие типы столкнулись."
        ] },
        { type: "note", html: "Правило лаборатории: трейсбек — это не наказание, а самописание стендового лога. Python проделал работу по локализации, осталось выдвинуть гипотезу и проверить её." }
      ]
    },

    // ─── 2. Квиз: тип ошибки по трейсбеку ──────────────────────────────────────
    {
      id: "l2_dbg_q1",
      type: "quiz",
      glyph: "l2_dbg_q1",
      title: "Квиз: что говорит трейсбек",
      question: "Сервис упал с таким трейсбеком. Что произошло и где искать причину?",
      code: 'Traceback (most recent call last):\n  File "billing.py", line 7, in total\n    return base + fee\nTypeError: can only concatenate str (not "int") to str',
      options: [
        "Опечатка в имени функции total — Python не смог её найти",
        "В переменной base лежит строка, а в fee — число; складывать str и int нельзя — смотреть, где они заполняются",
        "Список base закончился — индекс вышел за границы"
      ],
      correct: 1,
      explain: "TypeError прямо называет конфликт: str и int в одной операции. Причина почти всегда выше по коду — где-то значение пришло строкой (например, из input() или файла) и не было приведено к числу. Никогда не бывает «из-за опечатки в имени» — это был бы NameError."
    },

    // ─── 3. Predict: теневое имя ───────────────────────────────────────────────
    {
      id: "l2_dbg_p1",
      type: "predict",
      glyph: "l2_dbg_p1",
      title: "Предскажи вывод: загадочный total",
      explanation: [
        "Магазин хранит дневную выручку в переменной `total`. Кассир вызывает checkout(30) — и, кажется, выручка должна вырасти до 130. Прочитай код внимательно и предскажи оба вывода."
      ],
      code: 'total = 100\n\ndef checkout(price):\n    total = price * 2\n    return total\n\nprint(checkout(30))\nprint(total)',
      expectedOutput: "60\n100",
      explain: "Присваивание внутри функции создаёт ЛОКАЛЬНУЮ переменную total — она затеняет глобальную, но не меняет её. Функция вернула 60, глобальная выручка осталась 100. Классический баг «починил, а в проде ничего не изменилось»."
    },

    // ─── 4. Predict: аккумулятор с нулём (максимум на отрицательных) ───────────
    {
      id: "l2_dbg_p2",
      type: "predict",
      glyph: "l2_dbg_p2",
      title: "Предскажи вывод: самый тёплый час ночи",
      explanation: [
        "Датчик ночёвки в теплице пишет отрицательные температуры. Функция warmest должна вернуть самый тёплый час ночи. Предскажи вывод — и особенно то, почему он такой."
      ],
      code: 'def warmest(nights):\n    highest = 0\n    for t in nights:\n        if t > highest:\n            highest = t\n    return highest\n\nprint(warmest([-15, -3, -8]))',
      expectedOutput: "0",
      explain: "Аккумулятор highest стартует с нуля, а условие t > highest для отрицательных температур не срабатывает ни разу: -3 больше нуля? Нет. Функция вернула 0 — значение, которого в данных вообще не было. Правильно стартовать с первого элемента списка."
    },

    // ─── 5. Code (warmup): защитное чтение словаря ─────────────────────────────
    {
      id: "l2_dbg_c1",
      type: "code",
      tier: "warmup",
      glyph: "l2_dbg_c1",
      title: "Разминка: безопасное чтение настроек",
      explanation: [
        "Конфиг сервиса хранится в словаре `settings`. Код, который читает настройки вслепую (`settings[key]`), падает с KeyError на каждом незаполненном поле.",
        "Напиши функцию safe_get(settings, key, default): она возвращает settings[key], если ключ есть, и default — если его нет.",
        "Осторожно с краевым случаем: значение по существующему ключу может быть и 0, и пустой строкой — их тоже нужно вернуть как есть."
      ],
      assignment: "Напиши функцию safe_get(settings, key, default), которая возвращает значение по ключу или default, если ключа нет.",
      starterCode: "# Напиши функцию safe_get(settings, key, default)\n",
      astRequirements: {},
      tests: [
        { call: "safe_get({'lang': 'ru'}, 'lang', 'en')", returns: "ru" },
        { call: "safe_get({}, 'theme', 'dark')", returns: "dark" },
        { call: "safe_get({'retry': 5}, 'timeout', 30)", returns: 30, hidden: true },
        { call: "safe_get({'flag': 0}, 'flag', 1)", returns: 0, hidden: true }
      ],
      hints: [
        "Проверка наличия ключа в словаре: if key in settings. Это правда про наличие, а не про то, что значение «непустое».",
        { code: "def safe_get(settings, key, default):\n    if ___ in ___:\n        return ___\n    return ___" },
        { code: "def safe_get(settings, key, default):\n    if key in settings:\n        return settings[key]\n    return default" }
      ],
      improveTip: "Скрытый тест со значением 0 отсекает популярную ошибку: проверка `if settings.get(key):` возвращает default для нуля. Проверяй наличие ключа, а не «правдивость» значения.",
      successMessage: "Защитное чтение готово: конфиг больше не роняет сервис на пустых полях."
    },

    // ─── 6. Code: деление без падения ──────────────────────────────────────────
    {
      id: "l2_dbg_c2",
      type: "code",
      tier: "main",
      glyph: "l2_dbg_c2",
      title: "Биллинг: делёж, который не падает",
      explanation: [
        "В биллинге деление суммы на количество пользователей иногда получает ноль — например, когда сервис ещё никого не подключил. Наивное деление падает с ZeroDivisionError.",
        "Напиши функцию divide(a, b), которая возвращает a / b, а при b == 0 возвращает None (по спецификации API: «нет данных», а не ноль).",
        "Вернуть None можно просто написав return без значения."
      ],
      assignment: "Напиши функцию divide(a, b): возвращает a / b; при b == 0 возвращает None, не падая.",
      starterCode: "# Напиши функцию divide(a, b), которая не падает при b == 0\n",
      astRequirements: {},
      tests: [
        { call: "divide(9, 3)", returns: 3 },
        { call: "divide(7, 2)", returns: 3.5 },
        { call: "divide(5, 0)", returns: null, hidden: true }
      ],
      hints: [
        "Защититься можно двумя способами: проверить b перед делением или поймать исключение try / except ZeroDivisionError. Оба приняты — выбирай любой.",
        { code: "def divide(a, b):\n    if b == ___:\n        return ___\n    return a / ___" },
        { code: "def divide(a, b):\n    if b == 0:\n        return None\n    return a / b" }
      ],
      improveTip: "None для «значения нет» честнее, чем 0: ноль — это валидный результат деления, и его можно спутать с настоящими данными. Спецификация API — тоже часть защиты от багов.",
      successMessage: "Деление застраховано: биллинг переживает пустые выборки."
    },

    // ─── 7. Квиз: функция вернула None ─────────────────────────────────────────
    {
      id: "l2_dbg_q2",
      type: "quiz",
      glyph: "l2_dbg_q2",
      title: "Квиз: откуда взялся None",
      question: "Функция grade(score) должна вернуть строку с оценкой, но вызывающий код получил None. Что проверить первым?",
      code: 'def grade(score):\n    if score >= 85:\n        return "A"\n    elif score >= 70:\n        return "B"\n    elif score >= 55:\n        return "C"',
      options: [
        "Проверить, что score — число, а не строка",
        "Проверить, есть ли return во ВСЕХ ветках: для score < 55 ветки нет — функция молча доходит до конца и возвращает None",
        "Проверить имя функции на опечатку — иначе было бы NameError"
      ],
      correct: 1,
      explain: "Функция без явного return (или дошедшая до конца без него) возвращает None. Классика отладки: ветка с обычным значением написана, но return в ней потерялся при рефакторинге. Первым делом проверь покрытие всех веток."
    },

    // ─── 8. Predict: срез съел элемент ─────────────────────────────────────────
    {
      id: "l2_dbg_p3",
      type: "predict",
      glyph: "l2_dbg_p3",
      title: "Предскажи вывод: потерянная колонка",
      explanation: [
        "Парсер CSV-строки должен взять вторую и третью колонки: temp и humidity. Автор решил сделать это срезом [1:-1]. Предскажи вывод."
      ],
      code: "row = 'sensor,temp,humidity'\nparts = row.split(',')\nprint(parts[1:-1])",
      expectedOutput: "['temp']",
      explain: "Срез [1:-1] означает «с индекса 1 ДО последнего элемента, не включая его». humidity — последний элемент, поэтому в срез не попал. Для «до конца списка» срез пишут как [1:] или [1:len(parts)]."
    },

    // ─── 9. Fix: IndexError в цикле while ──────────────────────────────────────
    {
      id: "l2_dbg_f1",
      type: "code",
      tier: "main",
      kind: "fix",
      glyph: "l2_dbg_f1",
      title: "Починка: сканер логов падает на выходе",
      explanation: [
        "Сканер логов ищет позицию строки target в списке rows циклом while. На реальных данных он падает с IndexError: list index out of range.",
        "Запусти код с кнопкой проверки — трейсбек подскажет точную строку. Найди ошибку в границе цикла и почини её."
      ],
      assignment: "Функция scan(rows, target) должна возвращать индекс первого вхождения target или -1. Устрани IndexError: сейчас цикл заходит на несуществующий индекс.",
      starterCode: 'def scan(rows, target):\n    i = 0\n    found = -1\n    while i <= len(rows):\n        if rows[i] == target:\n            found = i\n            break\n        i += 1\n    return found\n',
      astRequirements: {},
      tests: [
        { call: "scan(['INFO', 'WARN', 'FATAL'], 'WARN')", returns: 1 },
        { call: "scan(['INFO', 'INFO'], 'FATAL')", returns: -1 },
        { call: "scan([], 'WARN')", returns: -1, hidden: true },
        { call: "scan(['WARN'], 'WARN')", returns: 0, hidden: true }
      ],
      hints: [
        "Индексы списка идут от 0 до len(rows) - 1. Что вернёт len(rows) для пустого списка и до какого значения дойдёт i при условии i <= len(rows)?",
        { code: "def scan(rows, target):\n    i = 0\n    found = -1\n    while i ___ len(rows):\n        if rows[i] == target:\n            found = i\n            break\n        i += 1\n    return found" },
        { code: "def scan(rows, target):\n    i = 0\n    found = -1\n    while i < len(rows):\n        if rows[i] == target:\n            found = i\n            break\n        i += 1\n    return found" }
      ],
      improveTip: "Ошибка на единицу в while коварнее, чем в for: range(len(rows)) сам не выйдет за границу, а ручное условие <= len(rows) — выходит. Индекс последнего элемента всегда len(rows) - 1.",
      successMessage: "Граница исправлена: сканер проходит логи без вылета за край."
    },

    // ─── 10. Fix: KeyError на опечатке ключа ───────────────────────────────────
    {
      id: "l2_dbg_f2",
      type: "code",
      tier: "main",
      kind: "fix",
      glyph: "l2_dbg_f2",
      title: "Починка: карта сервисов теряет notify",
      explanation: [
        "Диспетчер микросервисов резолвит имена в адреса через словарь-карту. На вызове endpoint('notify') сервис падает с KeyError: 'notify'.",
        "Трейсбек покажет строку с обращением к словарю. Сравни ключ в вызове с ключами в карте — ошибка в одном символе."
      ],
      assignment: "Функция endpoint(cfg) должна возвращать адрес сервиса. Устрани KeyError: один из ключей карты написан с опечаткой.",
      starterCode: "def endpoint(cfg):\n    services = {\n        'auth': '10.0.0.1',\n        'billing': '10.0.0.2',\n        'notyfy': '10.0.0.3'\n    }\n    return services[cfg]\n",
      astRequirements: {},
      tests: [
        { call: "endpoint('auth')", returns: "10.0.0.1" },
        { call: "endpoint('notify')", returns: "10.0.0.3" },
        { call: "endpoint('billing')", returns: "10.0.0.2", hidden: true }
      ],
      hints: [
        "KeyError: 'notify' значит: вызывающие просят ключ notify, а в словаре его нет. Посмотри внимательно на каждый ключ словаря.",
        { code: "def endpoint(cfg):\n    services = {\n        'auth': '10.0.0.1',\n        'billing': '10.0.0.2',\n        '___': '10.0.0.3'\n    }\n    return services[cfg]" },
        { code: "def endpoint(cfg):\n    services = {\n        'auth': '10.0.0.1',\n        'billing': '10.0.0.2',\n        'notify': '10.0.0.3'\n    }\n    return services[cfg]" }
      ],
      improveTip: "KeyError почти всегда — рассинхрон между тем, что запрашивают, и тем, что положили в словарь. Сообщение ошибки называет точный ключ: сверяй его с картой побуквенно.",
      successMessage: "Ключ выправлен: диспетчер находит все сервисы карты."
    },

    // ─── 11. Predict: перепутанные параметры ───────────────────────────────────
    {
      id: "l2_dbg_p4",
      type: "predict",
      glyph: "l2_dbg_p4",
      title: "Предскажи вывод: репорт с перепутанными ролями",
      explanation: [
        "Автор функции report хотел первым параметром считать имя задачи, вторым — число ошибок. Посмотри на объявление и на вызов. Что напечатает print?"
      ],
      code: "def report(name, errors):\n    return name + ' завершился с ' + str(errors) + ' ошибками'\n\nprint(report('деплой', 3))",
      expectedOutput: "деплой завершился с 3 ошибками",
      explain: "Позиционные аргументы заполняют параметры по порядку: name='деплой', errors=3 — здесь повезло, вызов совпал с объявлением. Но стоит перепутать порядок при вызове — report(3, 'деплой') — Python молча выдаст '3 завершился с деплой ошибками'. Типы он не проверяет, поэтому перепутанные аргументы не падают, а тихо врут."
    },

    // ─── 12. Fix: TypeError на str + int ───────────────────────────────────────
    {
      id: "l2_dbg_f3",
      type: "code",
      tier: "main",
      kind: "fix",
      glyph: "l2_dbg_f3",
      title: "Починка: биллинг склеивает вместо суммы",
      explanation: [
        "Форма биллинга присылает два счёта построчно. Функция печатает общую сумму, но при вводе 120 и 30 в отчёте оказывается 12030.",
        "Это баг без падения: типы input() — всегда строки, и + склеивает их. В панели «Ввод программы» под редактором задай две строки входа (например, 120 и 30), запусти и посмотри вывод. Почини сумму."
      ],
      assignment: "Сумма двух счётов должна быть числом: при входе 120 и 30 печатать 150. Исправь преобразование типов.",
      starterCode: "# Сумма двух счетов из формы биллинга\nfirst = input()\nsecond = input()\ntotal = first + second\nprint(total)\n",
      astRequirements: {},
      stdin: "120\n30",
      tests: [
        { stdin: "120\n30", stdout: "150" },
        { stdin: "7\n8", stdout: "15", hidden: true }
      ],
      hints: [
        "input() возвращает строку: '120' + '30' — это '12030'. Числа из входа нужно привести к int до сложения.",
        { code: "first = int(input())\nsecond = int(___())\ntotal = first + ___\nprint(total)" },
        { code: "first = int(input())\nsecond = int(input())\ntotal = first + second\nprint(total)" }
      ],
      improveTip: "TypeError здесь не прилетит: для str + int Python упадёт громко, а вот str + str проходит молча и врёт в данных. После каждого input() спрашивай себя: «это число или текст?»",
      successMessage: "Сумма честная: биллинг складывает числа, а не склеивает строки."
    },

    // ─── 13. Fix: потерянный return ────────────────────────────────────────────
    {
      id: "l2_dbg_f4",
      type: "code",
      tier: "main",
      kind: "fix",
      glyph: "l2_dbg_f4",
      title: "Починка: бонусы пропадают в ветке else",
      explanation: [
        "Программа лояльности начисляет баллы: 100 за высокий скор, 50 за средний, 10 за остальные. Пользователи со скором ниже 60 получают None — баллы не начисляются.",
        "Наизусть запомни признак: None из функции — почти всегда потерянный return. Найди ветку без него."
      ],
      assignment: "Функция bonus(score) должна возвращать число баллов для любого score: 100, 50 или 10. Устрани None в нижней ветке.",
      starterCode: "def bonus(score):\n    if score >= 85:\n        return 100\n    elif score >= 60:\n        return 50\n    else:\n        points = 10\n",
      astRequirements: {},
      tests: [
        { call: "bonus(92)", returns: 100 },
        { call: "bonus(70)", returns: 50 },
        { call: "bonus(30)", returns: 10 },
        { call: "bonus(0)", returns: 10, hidden: true }
      ],
      hints: [
        "Посмотри на ветку else: значение points вычисляется, но никого не покидает функцию. Функция доходит до конца без return и возвращает None.",
        { code: "def bonus(score):\n    if score >= 85:\n        return 100\n    elif score >= 60:\n        return 50\n    else:\n        points = 10\n        ___ points" },
        { code: "def bonus(score):\n    if score >= 85:\n        return 100\n    elif score >= 60:\n        return 50\n    else:\n        points = 10\n        return points" }
      ],
      improveTip: "Скрытые тесты бьют в нижнюю границу: score = 0 тоже клиент. Отладочная привычка — проверять края диапазона, а не только середину.",
      successMessage: "Ветка закрыта: баллы начисляются каждому клиенту."
    },

    // ─── 14. Fix: мутация списка во время итерации ─────────────────────────────
    {
      id: "l2_dbg_f5",
      type: "code",
      tier: "main",
      kind: "fix",
      glyph: "l2_dbg_f5",
      title: "Починка: чистка логов пропускает строки",
      explanation: [
        "Очистка лога удаляет отладочные строки прямо во время перебора: for row in rows: rows.remove(row). Результат непредсказуем — часть DEBUG-строк выживает.",
        "Причина: remove сдвигает элементы влево, а итератор уже перешёл на следующий индекс. Почини функцию так, чтобы удаление не мешало перебору."
      ],
      assignment: "Функция clean(rows) должна вернуть список БЕЗ строк, начинающихся с 'DEBUG', не меняя исходный порядок остальных.",
      starterCode: 'def clean(rows):\n    for row in rows:\n        if row.startswith("DEBUG"):\n            rows.remove(row)\n    return rows\n',
      astRequirements: {},
      tests: [
        { call: "clean(['INFO a', 'DEBUG b', 'INFO c', 'DEBUG d'])", returns: ["INFO a", "INFO c"] },
        { call: "clean(['DEBUG x', 'DEBUG y', 'INFO z'])", returns: ["INFO z"], hidden: true },
        { call: "clean(['INFO 1', 'INFO 2'])", returns: ["INFO 1", "INFO 2"], hidden: true },
        { call: "clean([])", returns: [], hidden: true }
      ],
      hints: [
        "Не удаляй элементы из списка, по которому идёт итерация. Собери новый список из нужных строк — или пройди по копии.",
        { code: "def clean(rows):\n    result = []\n    for row in rows:\n        if not row.___('\"DEBUG'):\n            result.___(row)\n    return result" },
        { code: 'def clean(rows):\n    result = []\n    for row in rows:\n        if not row.startswith("DEBUG"):\n            result.append(row)\n    return result' }
      ],
      improveTip: "Правило без исключений: никогда не менять список, по которому идёт for. Новый список через накопитель (или comprehension) — и короче, и предсказуемее.",
      successMessage: "Чистка предсказуема: ни одна отладочная строка не просочилась в архив."
    },

    // ─── 15. Fix: перепутанные аргументы в теле ────────────────────────────────
    {
      id: "l2_dbg_f6",
      type: "code",
      tier: "main",
      kind: "fix",
      glyph: "l2_dbg_f6",
      title: "Починка: подпись письма перевёрнута",
      explanation: [
        "Шаблонизатор письма собирает подпись из имени и должности. В подписи должность и имя поменялись местами: «инженер — Иван Петров» вместо «Иван Петров — инженер».",
        "Объявление функции корректное: первый параметр name, второй role. Ошибка — внутри тела: тело собирает строку из параметров в обратном порядке. Без падений, просто тихая ложь в данных."
      ],
      assignment: "Функция signature(name, role) должна вернуть строку «имя — должность». Исправь порядок в теле функции (объявление не меняй).",
      starterCode: 'def signature(name, role):\n    return role + " — " + name\n',
      astRequirements: {},
      tests: [
        { call: 'signature("Иван Петров", "инженер")', returns: "Иван Петров — инженер" },
        { call: 'signature("Анна Смирнова", "доктор")', returns: "Анна Смирнова — доктор" },
        { call: 'signature("Бай", "термостат")', returns: "Бай — термостат", hidden: true }
      ],
      hints: [
        "Параметры заполнены правильно: name='Иван Петров', role='инженер'. Ошибка в том, в каком порядке тело склеивает их в строку.",
        { code: 'def signature(name, role):\n    return ___ + " — " + ___' },
        { code: 'def signature(name, role):\n    return name + " — " + role' }
      ],
      improveTip: "Баги без падения самые дорогие: тесты на «красивый пример» их не ловят. Скрытые тесты здесь — просто другой вызов с другими данными: сверяйся с ожидаемой строкой, а не с формой вывода.",
      successMessage: "Подпись на месте: письмо выглядит как от человека, а не как от должности."
    },

    // ─── 16. Fix: окно обрезано на один элемент ────────────────────────────────
    {
      id: "l2_dbg_f7",
      type: "code",
      tier: "main",
      kind: "fix",
      glyph: "l2_dbg_f7",
      title: "Починка: мониторинг теряет последнее окно",
      explanation: [
        "Мониторинг считает максимальную сумму по окну из k последовательных метрик. На данных [1, 2, 3, 4] при k = 2 функция возвращает 5, хотя окно [3, 4] даёт 7: последнее окно функция просто не рассматривает.",
        "Диапазон стартов окна: i идёт от 0 до len(nums) - k включительно — последнее корректное окно начинается ровно на len(nums) - k."
      ],
      assignment: "Функция max_window(nums, k) должна вернуть максимум суммы по всем окнам длины k. Почини диапазон цикла, чтобы последнее окно не терялось.",
      starterCode: 'def max_window(nums, k):\n    best = sum(nums[:k])\n    for i in range(len(nums) - k):\n        window = nums[i:i + k]\n        best = max(best, sum(window))\n    return best\n',
      astRequirements: {},
      tests: [
        { call: "max_window([1, 2, 3, 4], 2)", returns: 7 },
        { call: "max_window([5, 1, 1, 5], 2)", returns: 6 },
        { call: "max_window([9, 9, 9], 3)", returns: 27, hidden: true },
        { call: "max_window([-5, -1, -3], 2)", returns: -4, hidden: true }
      ],
      hints: [
        "Сколько стартов у окна длины k в списке длины n? Последний старт — это n - k. Проверь, до какого числа дойдёт range(n - k).",
        { code: "def max_window(nums, k):\n    best = sum(nums[:k])\n    for i in range(len(nums) - k + ___):\n        window = nums[i:i + k]\n        best = max(best, sum(window))\n    return best" },
        { code: "def max_window(nums, k):\n    best = sum(nums[:k])\n    for i in range(len(nums) - k + 1):\n        window = nums[i:i + k]\n        best = max(best, sum(window))\n    return best" }
      ],
      improveTip: "Ошибки диапазона не всегда дают IndexError: иногда они просто молча теряют данные. Скрытый тест с k, равной длине списка, ловит именно это.",
      successMessage: "Все окна в кадре: мониторинг видит последний пик."
    },

    // ─── 17. Fix: аккумулятор с нуля ───────────────────────────────────────────
    {
      id: "l2_dbg_f8",
      type: "code",
      tier: "main",
      kind: "fix",
      glyph: "l2_dbg_f8",
      title: "Починка: самая низкая температура — ноль",
      explanation: [
        "Ты уже видел этот баг в predict-задании, там он работал против максимума. Здесь минимум: аккумулятор minimum = 0 молчит, когда все данные ВЫШЕ нуля, — и функция возвращает 0, которого в данных нет.",
        "Проверь на данных [4, 2, 7]: ожидается 2, функция вернёт 0. Почини так, чтобы аккумулятор стартовал из данных. Метод .min() запрещён — лаборатория учит чинить цикл, а не заменять его встроенной функцией."
      ],
      assignment: "Функция coldest(temps) должна вернуть минимальное значение списка (список всегда непустой). Не используй min() и .sort() — почини аккумулятор.",
      starterCode: 'def coldest(temps):\n    minimum = 0\n    for t in temps:\n        if t < minimum:\n            minimum = t\n    return minimum\n',
      astRequirements: { forbid_calls: ["min"], forbid_methods: ["sort", "sorted"] },
      tests: [
        { call: "coldest([-15, -3, -8])", returns: -15 },
        { call: "coldest([4, 2, 7])", returns: 2 },
        { call: "coldest([-1])", returns: -1, hidden: true },
        { call: "coldest([3, 3, 3])", returns: 3, hidden: true }
      ],
      hints: [
        "Аккумулятор должен стартовать со значения из данных: с первого элемента списка. Тогда сравнение t < minimum отработает на любом диапазоне.",
        { code: "def coldest(temps):\n    minimum = temps[___]\n    for t in temps:\n        if t < ___:\n            minimum = ___\n    return minimum" },
        { code: "def coldest(temps):\n    minimum = temps[0]\n    for t in temps:\n        if t < minimum:\n            minimum = t\n    return minimum" }
      ],
      improveTip: "Аккумулятор минимума/максимума стартует с элемента данных (или с None и отдельной проверкой первого шага), но не с «магического» 0 — магия ломается на отрицательных или больших значениях.",
      successMessage: "Датчик честный: минимум берётся из данных, а не из головы."
    },

    // ─── 18. Теория: метод отладки ─────────────────────────────────────────────
    {
      id: "l2_dbg_t2",
      type: "theory",
      glyph: "l2_dbg_t2",
      title: "Метод отладки: гипотеза → эксперимент",
      blocks: [
        { type: "p", html: "Прочитать трейсбек — половина работы. Вторая половина — <b>метод</b>: так ты ищешь причину в коде без трейсбека (функция возвращает не то, но не падает) и в большом коде, где причина далеко от симптома." },
        { type: "list", items: [
          "<b>Сузь область.</b> Не читай весь файл: найди самую раннюю точку, где данные ещё правильные, и самую позднюю, где они уже сломаны. Причина — между ними.",
          "<b>Выдвини одну гипотезу.</b> «Подозреваю, что сумма считается до добавления скидки». Гипотеза должна быть проверяемой.",
          "<b>Поставь эксперимент.</b> print промежуточных значений в подозрительных местах — самый быстрый инструмент: print('после скидки:', total). Запусти, сравни с ожиданием.",
          "<b>Меняй по одному.</b> Два изменения за раз — и ты не узнаешь, какое из них сработало. Откат тоже фикси: закомментируй эксперимент, когда причина найдена."
        ] },
        { type: "code",
          code: '# Локализация: где именно ломается сумма?\ntotal = base\nprint("1. после base:", total)\ntotal = total - discount\nprint("2. после скидки:", total)\ntotal = total + fee\nprint("3. после сбора:", total)',
          output: "1. после base: 1200\n2. после скидки: 1100\n3. после сбора: 1100.05" },
        { type: "note", html: "Зависший while (забыт i += 1) ловится тем же методом: первый print до цикла сработает, внутри цикла — нет. Но помни: в тренажёре исполнение обрезается по таймауту, а в настоящем проде зависшая функция съедает CPU до перезапуска сервиса." }
      ]
    },

    // ─── 19. Star: два бага в одном коде ───────────────────────────────────────
    {
      id: "l2_dbg_c9",
      type: "code",
      tier: "star",
      optional: true,
      glyph: "l2_dbg_c9",
      title: "★ Две починки: средний балл сдавших",
      explanation: [
        "Аналитика курса считает средний балл сдавших (score >= 60). Код падает с NameError, а после наивной правки — с ZeroDivisionError: в списке могут быть только несдавшие.",
        "Здесь два независимых бага. Почини оба: функция должна вернуть 0, если сдавших нет, и честное среднее — если есть."
      ],
      assignment: "Функция avg_passing(scores) возвращает средний балл сдавших (score >= 60) или 0, если сдавших нет. Устрани NameError и ZeroDivisionError.",
      starterCode: 'def avg_passing(scores):\n    passing = []\n    for s in scores:\n        if s >= 60:\n            passing.append(s)\n    total = total + sum(passing)\n    return total / len(passing)\n',
      astRequirements: {},
      tests: [
        { call: "avg_passing([90, 40, 70])", returns: 80 },
        { call: "avg_passing([50, 40])", returns: 0 },
        { call: "avg_passing([60])", returns: 60, hidden: true },
        { call: "avg_passing([])", returns: 0, hidden: true }
      ],
      hints: [
        "Баг первый: total читается до присваивания (NameError). Баг второй: если passing пуст, len(passing) — это 0, и деление падает. Функция должна заранее ответить 0 на пустой passing.",
        { code: "def avg_passing(scores):\n    passing = []\n    for s in scores:\n        if s >= 60:\n            passing.append(s)\n    if not ___:\n        return ___\n    return sum(passing) / ___(passing)" },
        { code: "def avg_passing(scores):\n    passing = []\n    for s in scores:\n        if s >= 60:\n            passing.append(s)\n    if not passing:\n        return 0\n    return sum(passing) / len(passing)" }
      ],
      improveTip: "Ищи баги по слоям: сначала тот, что громче (NameError), потом тот, что он маскирует. После каждой правки запускай тесты — второй баг часто прячется за первым.",
      successMessage: "Оба слоя починены: средний балл считается на любых данных."
    },

    // ─── 20. Star: слияние теряет хвост ────────────────────────────────────────
    {
      id: "l2_dbg_c10",
      type: "code",
      tier: "star",
      optional: true,
      glyph: "l2_dbg_c10",
      title: "★ Слияние двух реестров теряет хвост",
      explanation: [
        "Слияние двух отсортированных списков (ты писал такое в «Алгоритмах») потеряло финал: когда один из списков заканчивается, остаток второго вообще не попадает в результат.",
        "Скрытые тесты бьют именно в хвосты, включая пустой список. Почини: после основного цикла остатки неистощённого списка нужно дописать целиком."
      ],
      assignment: "Функция merge_sorted(a, b) сливает два отсортированных списка в один отсортированный. Дополни функцию: после основного цикла допиши остатки неистощённого списка.",
      starterCode: 'def merge_sorted(a, b):\n    result = []\n    i = j = 0\n    while i < len(a) and j < len(b):\n        if a[i] <= b[j]:\n            result.append(a[i])\n            i += 1\n        else:\n            result.append(b[j])\n            j += 1\n    return result\n',
      astRequirements: {},
      tests: [
        { call: "merge_sorted([1, 3, 5], [2, 4, 6])", returns: [1, 2, 3, 4, 5, 6] },
        { call: "merge_sorted([1, 10, 11], [2])", returns: [1, 2, 10, 11] },
        { call: "merge_sorted([], [1, 2])", returns: [1, 2], hidden: true },
        { call: "merge_sorted([7], [3])", returns: [3, 7], hidden: true }
      ],
      hints: [
        "После while ровно один из двух списков ещё не исчерпан (или оба, если совпали длины). Остатки дописываются срезом: result.extend(a[i:]) и result.extend(b[j:]) — достаточно вызвать оба, лишний срез пустой.",
        { code: "def merge_sorted(a, b):\n    result = []\n    i = j = 0\n    while i < len(a) and j < len(b):\n        if a[i] <= b[j]:\n            result.append(a[i])\n            i += 1\n        else:\n            result.append(b[j])\n            j += 1\n    result.___(a[___:])\n    result.___(b[___:])\n    return result" },
        { code: "def merge_sorted(a, b):\n    result = []\n    i = j = 0\n    while i < len(a) and j < len(b):\n        if a[i] <= b[j]:\n            result.append(a[i])\n            i += 1\n        else:\n            result.append(b[j])\n            j += 1\n    result.extend(a[i:])\n    result.extend(b[j:])\n    return result" }
      ],
      improveTip: "Классика алгоритма слияния: основной цикл гарантированно исчерпывает только ОДИН список. Тесты на пустые списки и на «один короче другого» — обязательный набор для любой merge-функции.",
      successMessage: "Слияние целостное: ни один элемент реестра не потерян."
    },

    // ─── 21. Теория: чеклист частых багов ──────────────────────────────────────
    {
      id: "l2_dbg_t3",
      type: "theory",
      glyph: "l2_dbg_t3",
      title: "Чеклист лаборатории: семь частых багов",
      blocks: [
        { type: "p", html: "Почти каждый баг, который ты починил в этой теме, — вариация одного из семи типовых. Держи список под рукой при разборе чужого кода — он экономит часы." },
        { type: "list", items: [
          "<b>Off-by-one.</b> Границы цикла и срезов: <= вместо <, len(nums) + 1, срез теряет последний элемент. Симптом: IndexError или «потерянные данные».",
          "<b>Потерянный return.</b> Ветка без return → функция молча возвращает None. Симптом: None там, где ожидалось значение.",
          "<b>str вместо int.</b> input() и чтение файлов всегда дают строки. Симптом: склейка вместо суммы ('12030'), TypeError при явном смешении.",
          "<b>Мутация при итерации.</b> remove/del/append по списку, который перебирает for. Симптом: пропущенные элементы.",
          "<b>Перепутанные аргументы.</b> Порядок вызова не совпал с порядком параметров. Симптом: тихая ложь в данных без падений.",
          "<b>Теневое имя.</b> Присваивание внутри функции создаёт локальную переменную вместо глобальной. Симптом: «починил, а ничего не изменилось».",
          "<b>Магический аккумулятор.</b> Стартовое значение 0 / '' / [] вместо элемента данных. Симптом: результат «из головы», не из данных."
        ] },
        { type: "note", html: "Порядок работы всегда один: симптом → гипотеза из чеклиста → эксперимент (print или запуск тестов) → правка → прогон всех тестов, включая скрытые." }
      ]
    }
  ]
});
