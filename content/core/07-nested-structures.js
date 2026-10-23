/**
 * Тема этапа 2: Вложенные структуры данных
 * Список словарей, словарь списков, словарь словарей, безопасное чтение
 * через .get() по цепочке, копирование вложенных структур (deepcopy).
 */

window.COURSE_TOPICS = window.COURSE_TOPICS || [];

window.COURSE_TOPICS.push({
  id: "l1_nested_structures",
  title: "Вложенные структуры данных",
  minutes: 60,
  items: [
    /* ============ ТЕОРИЯ ============ */
    {
      id: "l1_nest_t1",
      type: "theory",
      title: "Список словарей: формат реальных данных",
      blocks: [
        {
          type: "p",
          html: "Самый частый формат данных в реальных программах — список словарей. Каждый словарь описывает одну запись (пользователя, заказ, товар), а список собирает записи вместе. В таком виде приходит ответ почти любого интернет-сервиса."
        },
        {
          type: "code",
          code: 'users = [\n    {"name": "Анна", "score": 82},\n    {"name": "Борис", "score": 67},\n    {"name": "Вера", "score": 91},\n]\n\nprint(users[0]["name"])\nprint(users[2]["score"])\nprint(len(users))',
          output: "Анна\n91\n3"
        },
        {
          type: "p",
          html: "Запись читается по цепочке: сначала индекс в списке, затем ключ в словаре. Каждое следующее обращение работает с результатом предыдущего."
        },
        {
          type: "code",
          code: 'users = [\n    {"name": "Анна", "score": 82},\n    {"name": "Борис", "score": 67},\n    {"name": "Вера", "score": 91},\n]\n\nuser = users[2]\nprint(user)\nprint(user["name"])',
          output: "{'name': 'Вера', 'score': 91}\nВера"
        },
        {
          type: "p",
          html: "Перебирать такой список удобно циклом <code>for</code>: на каждом шаге переменная цикла содержит один словарь-запись."
        },
        {
          type: "code",
          code: 'users = [\n    {"name": "Анна", "score": 82},\n    {"name": "Борис", "score": 67},\n    {"name": "Вера", "score": 91},\n]\n\ntotal = 0\nfor user in users:\n    total += user["score"]\n\nprint(total, total / len(users))',
          output: "240 80.0"
        },
        {
          type: "p",
          html: "Запись внутри списка можно менять на месте: словарь в списке — тот же самый объект."
        },
        {
          type: "code",
          code: 'users = [\n    {"name": "Анна", "score": 82},\n    {"name": "Борис", "score": 67},\n]\n\nusers[1]["score"] = 70\nprint(users[1])',
          output: "{'name': 'Борис', 'score': 70}"
        },
        {
          type: "note",
          html: "Если в записи нет нужного ключа, обращение <code>user['score']</code> вызовет <code>KeyError</code>. Как читать такие данные безопасно, разберём чуть дальше, на словаре словарей."
        }
      ]
    },
    {
      id: "l1_nest_t2",
      type: "theory",
      title: "Фильтрация, поиск максимума и сортировка записей",
      blocks: [
        {
          type: "p",
          html: "Над списком словарей решают три типовые задачи: отобрать записи по условию, найти запись с наибольшим значением и упорядочить записи. Начнём с фильтрации: условие проверяется по полю записи."
        },
        {
          type: "code",
          code: 'users = [\n    {"name": "Анна", "score": 82},\n    {"name": "Борис", "score": 67},\n    {"name": "Вера", "score": 91},\n]\n\npassed = []\nfor user in users:\n    if user["score"] >= 70:\n        passed.append(user["name"])\n\nprint(passed)',
          output: "['Анна', 'Вера']"
        },
        {
          type: "p",
          html: "Для поиска максимума в переменной хранят всю запись целиком, а не только число. Тогда после цикла доступны и счёт, и имя."
        },
        {
          type: "code",
          code: 'users = [\n    {"name": "Анна", "score": 82},\n    {"name": "Борис", "score": 67},\n    {"name": "Вера", "score": 91},\n]\n\nbest = users[0]\nfor user in users:\n    if user["score"] > best["score"]:\n        best = user\n\nprint(best["name"], best["score"])',
          output: "Вера 91"
        },
        {
          type: "p",
          html: "Для сортировки словари не подходят напрямую: Python не умеет сравнивать один словарь с другим. Поэтому в <code>sorted</code> передают параметр <code>key</code> — функцию, которая возвращает из записи значение для сравнения."
        },
        {
          type: "code",
          code: 'users = [\n    {"name": "Анна", "score": 82},\n    {"name": "Борис", "score": 67},\n    {"name": "Вера", "score": 91},\n]\n\ndef get_score(user):\n    return user["score"]\n\nranking = sorted(users, key=get_score, reverse=True)\nfor user in ranking:\n    print(user["name"], user["score"])',
          output: "Вера 91\nАнна 82\nБорис 67"
        },
        {
          type: "list",
          items: [
            "В <code>key</code> передают саму функцию, без скобок: <code>get_score</code>, а не <code>get_score()</code>.",
            "Функция <code>sorted</code> не меняет исходный список, а возвращает новый.",
            "Записи с равными значениями сохраняют исходный порядок, даже при <code>reverse=True</code>."
          ]
        },
        {
          type: "note",
          html: "Короткую запись такой функции через <code>lambda</code> разберём в теме про функции. Пока достаточно обычной <code>def</code>."
        }
      ]
    },
    {
      id: "l1_nest_t3",
      type: "theory",
      title: "Словарь списков: группировка",
      blocks: [
        {
          type: "p",
          html: "Словарь списков хранит группы: ключ — название категории, значение — список элементов этой категории. Так удобно разбирать слова по первой букве, учеников по классам, посты по тегам."
        },
        {
          type: "code",
          code: 'groups = {}\nfor word in ["кот", "коза", "сова", "сом"]:\n    letter = word[0]\n    if letter not in groups:\n        groups[letter] = []\n    groups[letter].append(word)\n\nprint(groups)',
          output: "{'к': ['кот', 'коза'], 'с': ['сова', 'сом']}"
        },
        {
          type: "p",
          html: "Шаблон всегда один: если ключа ещё нет, создать под ним пустой список; затем добавить элемент. Метод <code>setdefault(ключ, значение)</code> делает обе части разом: возвращает существующий список или кладёт под ключ новый и возвращает его."
        },
        {
          type: "code",
          code: 'groups = {}\nfor word in ["кот", "коза", "сова", "сом"]:\n    groups.setdefault(word[0], []).append(word)\n\nprint(groups)\nfor letter, items in groups.items():\n    print(letter, len(items))',
          output: "{'к': ['кот', 'коза'], 'с': ['сова', 'сом']}\nк 2\nс 2"
        },
        {
          type: "p",
          html: "Есть соблазнительная, но неверная заготовка: <code>dict.fromkeys(ключи, [])</code>. Она создаёт один список и кладёт ссылку на него под каждый ключ."
        },
        {
          type: "code",
          code: 'buckets = dict.fromkeys(["a", "b"], [])\nbuckets["a"].append(1)\n\nprint(buckets)',
          output: "{'a': [1], 'b': [1]}"
        },
        {
          type: "note",
          html: "Чтобы у каждого ключа был свой отдельный список, создавай их по одному: через <code>setdefault</code> или генератор словаря <code>{key: [] for key in keys}</code>."
        }
      ]
    },
    {
      id: "l1_nest_t4",
      type: "theory",
      title: "Словарь словарей и безопасное чтение",
      blocks: [
        {
          type: "p",
          html: "Словарь словарей описывает вложенную структуру: настройки по разделам, справочник объектов, дерево данных. Обращение идёт по цепочке ключей, один ключ на каждый уровень."
        },
        {
          type: "code",
          code: 'config = {\n    "db": {"host": "localhost", "port": 5432},\n    "debug": True,\n}\n\nprint(config["db"]["port"])\nconfig["db"]["port"] = 6543\nprint(config["db"])',
          output: "5432\n{'host': 'localhost', 'port': 6543}"
        },
        {
          type: "p",
          html: "Если какого-то ключа нет, обращение через квадратные скобки вызовет <code>KeyError</code>. Метод <code>.get(ключ, по_умолчанию)</code> в этом случае возвращает запасное значение. Для вложенных данных в качестве запасного берут пустой словарь <code>{}</code>, чтобы цепочка могла продолжиться."
        },
        {
          type: "code",
          code: 'config = {\n    "db": {"host": "localhost", "port": 5432},\n    "debug": True,\n}\n\nprint(config.get("cache", {}).get("ttl", 60))\nprint(config.get("db", {}).get("host", "?"))',
          output: "60\nlocalhost"
        },
        {
          type: "note",
          html: "Запись <code>config.get('cache')['ttl']</code> не защищает от ошибки: <code>get</code> вернёт <code>None</code>, а обращение к <code>None</code> по ключу вызовет <code>TypeError</code>. Пустой словарь в качестве значения по умолчанию позволяет продолжить цепочку."
        },
        {
          type: "p",
          html: "Обходить вложенный словарь удобно через <code>.items()</code>: на каждом шаге получаешь пару «ключ — вложенный словарь». Наличие ключа проверяет оператор <code>in</code>."
        },
        {
          type: "code",
          code: 'servers = {"web": {"cpu": 40}, "db": {"cpu": 75}}\n\nfor name, info in servers.items():\n    print(name, info["cpu"])\n\nprint("cpu" in servers["web"], "ram" in servers["web"])',
          output: "web 40\ndb 75\nTrue False"
        }
      ]
    },
    {
      id: "l1_nest_t5",
      type: "theory",
      title: "Копирование вложенных структур и итоги",
      blocks: [
        {
          type: "p",
          html: "Метод <code>.copy()</code> копирует только верхний уровень. Вложенные списки и словари остаются общими у оригинала и копии: копия хранит ссылки на те же объекты."
        },
        {
          type: "code",
          code: 'post = {"title": "Заметка", "tags": ["python"]}\ncopy_post = post.copy()\ncopy_post["tags"].append("sql")\ncopy_post["title"] = "Копия"\n\nprint(post)',
          output: "{'title': 'Заметка', 'tags': ['python', 'sql']}"
        },
        {
          type: "p",
          html: "Заголовок остался прежним, потому что строка заменена в копии целиком. А список тегов общий, поэтому <code>append</code> изменил и оригинал. Полностью независимую копию делает функция <code>deepcopy</code> из модуля <code>copy</code>: она копирует все уровни вложенности."
        },
        {
          type: "code",
          code: 'import copy\n\npost = {"title": "Заметка", "tags": ["python"]}\nfull_copy = copy.deepcopy(post)\nfull_copy["tags"].append("sql")\n\nprint(post["tags"], full_copy["tags"])',
          output: "['python'] ['python', 'sql']"
        },
        {
          type: "list",
          items: [
            "Глубокая копия нужна, когда функция получает структуру и должна вернуть изменённую версию, не испортив исходную.",
            "Для плоской структуры без вложенных списков и словарей хватает обычного <code>.copy()</code>.",
            "<code>deepcopy</code> копирует всё, поэтому для очень больших данных работает заметно дольше."
          ]
        },
        {
          type: "note",
          html: "Простое правило: если внутри есть списки или словари, которые ты собираешься менять, копируй через <code>deepcopy</code>."
        },
        {
          type: "p",
          html: "<b>Шпаргалка по теме</b>"
        },
        {
          type: "table",
          head: ["Что нужно", "Как"],
          rows: [
            ["Прочитать значение внутри записи", "<code>data[0]['key']</code>"],
            ["Безопасно прочитать вложенное значение", "<code>d.get('a', {}).get('b', default)</code>"],
            ["Добавить элемент в группу", "<code>groups.setdefault(key, []).append(item)</code>"],
            ["Отсортировать записи по полю", "<code>sorted(items, key=get_field)</code>"],
            ["Найти запись с наибольшим значением", "цикл с переменной <code>best</code>"],
            ["Создать пустой список для каждого ключа", "<code>{k: [] for k in keys}</code>"],
            ["Скопировать вместе со вложенным", "<code>copy.deepcopy(data)</code>"]
          ]
        }
      ]
    },

    /* ============ ПРОВЕРКА ПОНИМАНИЯ ============ */
    {
      id: "l1_nest_q1",
      type: "quiz",
      title: "Цепочка обращений",
      question: "Что выведет эта программа?",
      code: 'data = [\n    {"name": "Анна", "skills": ["sql", "python"]},\n    {"name": "Борис", "skills": ["go"]},\n]\nprint(data[1]["skills"][0])',
      options: [
        "go",
        "Борис",
        "sql",
        "Будет KeyError"
      ],
      correct: 0,
      explain: "Цепочка читается слева направо: data[1] — запись Бориса, [\"skills\"] — его список навыков, [0] — первый элемент этого списка, то есть «go»."
    },
    {
      id: "l1_nest_q2",
      type: "quiz",
      title: "Что делает copy() с вложенным списком",
      question: "Что выведет последняя строка?",
      code: 'a = {"items": [1, 2]}\nb = a.copy()\nb["items"].append(3)\nprint(a["items"])',
      options: [
        "[1, 2]",
        "[1, 2, 3]",
        "[3]",
        "Будет KeyError"
      ],
      correct: 1,
      explain: "Метод copy() копирует только верхний уровень. Список под ключом «items» остаётся общим для a и b, поэтому append через b меняет и a. Независимую копию дал бы copy.deepcopy(a)."
    },
    {
      id: "l1_nest_q3",
      type: "quiz",
      title: "Безопасное чтение вложенного ключа",
      question: "В словаре config может не быть раздела «cache». Какое выражение вернёт 60, если раздела нет, и не вызовет ошибку?",
      options: [
        "config[\"cache\"][\"ttl\"]",
        "config.get(\"cache\")[\"ttl\"]",
        "config.get(\"cache\", {}).get(\"ttl\", 60)",
        "config.get(\"cache\", \"ttl\", 60)"
      ],
      correct: 2,
      explain: "Первый вариант вызовет KeyError. Во втором get вернёт None, а None[\"ttl\"] вызовет TypeError. В четвёртом у get три аргумента, это тоже ошибка. Верный вариант подставляет пустой словарь и спокойно доходит до значения по умолчанию."
    },

    /* ============ ПРЕДСКАЗАНИЕ ВЫВОДА ============ */
    {
      id: "l1_nest_p1",
      type: "predict",
      title: "Группировка через setdefault",
      explanation: [
        "Определи, что выведется в консоли. Каждое значение печатается на отдельной строке."
      ],
      code: 'words = ["кот", "коза", "сова", "сом", "корова"]\ngroups = {}\nfor w in words:\n    groups.setdefault(w[0], []).append(w)\n\nprint(len(groups))\nprint(len(groups["к"]))\nprint(groups["с"][-1])',
      expectedOutput: "2\n3\nсом",
      explain: "Слова делятся по первой букве на две группы: «к» (кот, коза, корова) и «с» (сова, сом). Поэтому ключей два, в группе «к» три слова, а последнее слово группы «с» — «сом»."
    },
    {
      id: "l1_nest_p2",
      type: "predict",
      title: "Два ключа — один список",
      explanation: [
        "Определи, что выведется в консоли. Обрати внимание, сколько разных списков создано в программе."
      ],
      code: 'row = [0, 0]\ngrid = {"a": row, "b": row}\ngrid["a"][0] = 5\n\nprint(grid["b"][0], row[0])',
      expectedOutput: "5 5",
      explain: "Список один: под ключами «a» и «b» и в переменной row лежит ссылка на один и тот же объект. Изменение через grid[\"a\"] видно во всех трёх местах."
    },
    {
      id: "l1_nest_p3",
      type: "predict",
      title: "Цепочка get со значениями по умолчанию",
      explanation: [
        "Определи, что выведется в консоли. Каждый вызов print печатает одну строку."
      ],
      code: 'user = {"name": "Анна", "address": {"city": "Омск"}}\n\nprint(user.get("phone", {}).get("code", "нет"))\nprint(user["address"].get("street", "-"))\nprint(user.get("address", {}).get("city"))',
      expectedOutput: "нет\n-\nОмск",
      explain: "В первой строке ключа «phone» нет, поэтому берётся пустой словарь и затем значение по умолчанию «нет». Во второй у адреса нет улицы, печатается запасное «-». В третьей оба ключа существуют, результат «Омск»."
    },

    /* ============ НАЙДИ ОШИБКУ (РАЗМИНКА) ============ */
    {
      id: "l1_nest_f1",
      type: "code",
      tier: "warmup",
      kind: "fix",
      title: "Найди ошибку: список имён",
      explanation: [
        "Идея функции верная, но программа падает с ошибкой. Посмотри, к какому объекту применяется обращение по ключу <code>\"name\"</code>."
      ],
      assignment: "Функция <code>get_names(users)</code> должна вернуть список имён из списка словарей-записей. Например, <code>get_names([{\"name\": \"Анна\", \"score\": 82}, {\"name\": \"Борис\", \"score\": 67}])</code> возвращает <code>['Анна', 'Борис']</code>. Исправь код: менять нужно одно обращение внутри цикла.",
      starterCode: 'def get_names(users):\n    result = []\n    for user in users:\n        result.append(users["name"])\n    return result\n',
      tests: [
        { call: 'str(get_names([{"name": "Анна", "score": 82}, {"name": "Борис", "score": 67}]))', returns: "['Анна', 'Борис']" },
        { call: 'str(get_names([{"name": "Вера", "score": 91}]))', returns: "['Вера']" },
        { call: 'str(get_names([]))', returns: "[]", hidden: true },
        { call: 'str(get_names([{"name": "А", "score": 1}, {"name": "Б", "score": 2}, {"name": "В", "score": 3}]))', returns: "['А', 'Б', 'В']", hidden: true }
      ],
      hints: [
        "В цикле переменная user — это один словарь-запись. Ключ «name» нужно брать у неё, а не у всего списка users.",
        { code: 'def get_names(users):\n    result = []\n    for user in users:\n        result.append(___["name"])\n    return result' },
        { code: 'def get_names(users):\n    result = []\n    for user in users:\n        result.append(user["name"])\n    return result\n\nprint(get_names([{"name": "Анна", "score": 82}]))' }
      ],
      successMessage: "Ошибка исправлена: ключ берётся у записи, а не у всего списка."
    },

    /* ============ ОСНОВНЫЕ ЗАДАЧИ ============ */
    {
      id: "l1_nest_c1",
      type: "code",
      tier: "main",
      title: "Функция top_scorer",
      explanation: [
        "Чтобы найти запись с наибольшим значением, в переменной хранят всю запись целиком и заменяют её, когда встречается запись лучше."
      ],
      assignment: "Напиши функцию <code>top_scorer(users)</code>, которая принимает список словарей с ключами <code>\"name\"</code> и <code>\"score\"</code> и возвращает имя пользователя с наибольшим счётом. Если у нескольких пользователей счёт одинаковый, верни того, кто стоит раньше в списке. Для пустого списка верни <code>None</code>. Использовать <code>max</code>, <code>min</code> и <code>sorted</code> нельзя.",
      starterCode: "# Напиши функцию top_scorer(users) без max, min и sorted\n",
      astRequirements: {
        require_def: true,
        require_return: true,
        require_for: true,
        forbid_calls: ["max", "min", "sorted"]
      },
      tests: [
        { call: 'top_scorer([{"name": "Анна", "score": 82}, {"name": "Борис", "score": 67}, {"name": "Вера", "score": 91}])', returns: "Вера" },
        { call: 'top_scorer([{"name": "Анна", "score": 50}])', returns: "Анна" },
        { call: 'str(top_scorer([]))', returns: "None" },
        { call: 'top_scorer([{"name": "Анна", "score": 90}, {"name": "Борис", "score": 90}])', returns: "Анна", hidden: true },
        { call: 'top_scorer([{"name": "А", "score": -5}, {"name": "Б", "score": -2}])', returns: "Б", hidden: true }
      ],
      hints: [
        "Для пустого списка сразу верни None. Иначе возьми в best первую запись, пройди по всем записям и заменяй best, если счёт текущей записи строго больше. В конце верни имя из best.",
        { code: 'def top_scorer(users):\n    if not users:\n        return None\n    best = users[0]\n    for user in users:\n        if user["score"] > best[___]:\n            best = user\n    return best["name"]' },
        { code: 'def top_scorer(users):\n    if not users:\n        return None\n    best = users[0]\n    for user in users:\n        if user["score"] > best["score"]:\n            best = user\n    return best["name"]\n\nprint(top_scorer([{"name": "Анна", "score": 82}, {"name": "Вера", "score": 91}]))' }
      ],
      improveTip: "Можно начать с <code>best = 0</code>, но тогда решение сломается на отрицательных счетах. Начинать с первой записи надёжнее.",
      successMessage: "Запись с наибольшим счётом найдена без max и sorted."
    },
    {
      id: "l1_nest_c2",
      type: "code",
      tier: "main",
      title: "Функция filter_by_tag",
      explanation: [
        "Внутри каждой записи лежит список тегов. Оператор <code>in</code> проверяет, есть ли нужный тег в этом списке."
      ],
      assignment: "Напиши функцию <code>filter_by_tag(posts, tag)</code>, которая принимает список словарей с ключами <code>\"title\"</code> и <code>\"tags\"</code> (список строк) и строку <code>tag</code>. Функция возвращает список заголовков тех постов, у которых <code>tag</code> есть в списке тегов, в исходном порядке. Если подходящих постов нет, верни пустой список <code>[]</code>.",
      starterCode: "# Напиши функцию filter_by_tag(posts, tag)\n",
      astRequirements: {
        require_def: true,
        require_return: true,
        require_for: true
      },
      tests: [
        { call: 'str(filter_by_tag([{"title": "Заметка", "tags": ["python", "sql"]}, {"title": "Обзор", "tags": ["go"]}, {"title": "Гайд", "tags": ["python"]}], "python"))', returns: "['Заметка', 'Гайд']" },
        { call: 'str(filter_by_tag([{"title": "Заметка", "tags": ["python", "sql"]}, {"title": "Обзор", "tags": ["go"]}], "go"))', returns: "['Обзор']" },
        { call: 'str(filter_by_tag([{"title": "Заметка", "tags": ["python"]}], "rust"))', returns: "[]" },
        { call: 'str(filter_by_tag([{"title": "Пусто", "tags": []}], "python"))', returns: "[]", hidden: true },
        { call: 'str(filter_by_tag([], "python"))', returns: "[]", hidden: true }
      ],
      hints: [
        "Заведи пустой список titles. Для каждого поста проверь, входит ли tag в post[\"tags\"] оператором in. Если да, добавь post[\"title\"] в titles. В конце верни titles.",
        { code: 'def filter_by_tag(posts, tag):\n    titles = []\n    for post in posts:\n        if tag in post[___]:\n            titles.append(post["title"])\n    return titles' },
        { code: 'def filter_by_tag(posts, tag):\n    titles = []\n    for post in posts:\n        if tag in post["tags"]:\n            titles.append(post["title"])\n    return titles\n\nprint(filter_by_tag([{"title": "Гайд", "tags": ["python"]}], "python"))' }
      ],
      improveTip: "То же решение можно записать в одну строку через генератор списка: <code>[post[\"title\"] for post in posts if tag in post[\"tags\"]]</code>.",
      successMessage: "Посты отфильтрованы по тегу внутри вложенного списка."
    },
    {
      id: "l1_nest_c3",
      type: "code",
      tier: "main",
      title: "Функция sort_names_by_score",
      explanation: [
        "Сортировка записей идёт через <code>sorted</code> с параметром <code>key</code>. Функция для <code>key</code> возвращает из записи значение, по которому нужно сравнивать."
      ],
      assignment: "Напиши функцию <code>sort_names_by_score(users)</code>, которая принимает список словарей с ключами <code>\"name\"</code> и <code>\"score\"</code> и возвращает список имён, отсортированных по убыванию счёта. Если у нескольких пользователей счёт одинаковый, они остаются в исходном порядке. Исходный список менять нельзя. Для сортировки используй <code>sorted</code>.",
      starterCode: "# Напиши функцию sort_names_by_score(users) через sorted\n",
      astRequirements: {
        require_def: true,
        require_return: true,
        require_calls: ["sorted"],
        forbid_methods: ["sort"]
      },
      tests: [
        { call: 'str(sort_names_by_score([{"name": "Анна", "score": 82}, {"name": "Борис", "score": 67}, {"name": "Вера", "score": 91}]))', returns: "['Вера', 'Анна', 'Борис']" },
        { call: 'str(sort_names_by_score([{"name": "Анна", "score": 80}, {"name": "Борис", "score": 90}, {"name": "Вера", "score": 80}]))', returns: "['Борис', 'Анна', 'Вера']" },
        { call: 'str(sort_names_by_score([{"name": "Яна", "score": 10}]))', returns: "['Яна']" },
        { call: 'str(sort_names_by_score([]))', returns: "[]", hidden: true },
        { call: 'str(sort_names_by_score([{"name": "А", "score": -1}, {"name": "Б", "score": 0}]))', returns: "['Б', 'А']", hidden: true }
      ],
      hints: [
        "Опиши отдельную функцию get_score(user), которая возвращает user[\"score\"]. Затем отсортируй записи через sorted(users, key=get_score, reverse=True) и собери из результата список имён циклом.",
        { code: 'def get_score(user):\n    return user["score"]\n\ndef sort_names_by_score(users):\n    ranking = sorted(users, key=___, reverse=True)\n    names = []\n    for user in ranking:\n        names.append(user["name"])\n    return names' },
        { code: 'def get_score(user):\n    return user["score"]\n\ndef sort_names_by_score(users):\n    ranking = sorted(users, key=get_score, reverse=True)\n    names = []\n    for user in ranking:\n        names.append(user["name"])\n    return names\n\nprint(sort_names_by_score([{"name": "Анна", "score": 82}, {"name": "Вера", "score": 91}]))' }
      ],
      improveTip: "Метод <code>users.sort()</code> сортирует список на месте и меняет исходные данные, поэтому здесь он запрещён. <code>sorted</code> всегда возвращает новый список.",
      successMessage: "Записи отсортированы по полю через sorted и key."
    },
    {
      id: "l1_nest_c4",
      type: "code",
      tier: "main",
      title: "Функция group_names_by_city",
      explanation: [
        "Это словарь списков: ключ — город, значение — список имён. Для каждого человека нужно найти список его города (или создать пустой) и добавить имя."
      ],
      assignment: "Напиши функцию <code>group_names_by_city(people)</code>, которая принимает список словарей с ключами <code>\"name\"</code> и <code>\"city\"</code> и возвращает словарь: город → список имён людей из этого города, в порядке появления в исходном списке. Для пустого списка верни пустой словарь <code>{}</code>.",
      starterCode: "# Напиши функцию group_names_by_city(people)\n",
      astRequirements: {
        require_def: true,
        require_return: true,
        require_for: true
      },
      tests: [
        { call: 'str(group_names_by_city([{"name": "Анна", "city": "Омск"}, {"name": "Борис", "city": "Тула"}, {"name": "Вера", "city": "Омск"}]))', returns: "{'Омск': ['Анна', 'Вера'], 'Тула': ['Борис']}" },
        { call: 'str(group_names_by_city([{"name": "Глеб", "city": "Тула"}]))', returns: "{'Тула': ['Глеб']}" },
        { call: 'str(group_names_by_city([]))', returns: "{}" },
        { call: 'str(group_names_by_city([{"name": "А", "city": "Н"}, {"name": "Б", "city": "Н"}, {"name": "В", "city": "Н"}]))', returns: "{'Н': ['А', 'Б', 'В']}", hidden: true },
        { call: 'str(group_names_by_city([{"name": "А", "city": "Н"}, {"name": "Б", "city": "К"}, {"name": "В", "city": "Н"}, {"name": "Г", "city": "К"}]))', returns: "{'Н': ['А', 'В'], 'К': ['Б', 'Г']}", hidden: true }
      ],
      hints: [
        "Заведи пустой словарь groups. Для каждого человека возьми список его города: если города ещё нет среди ключей, создай под ним пустой список (подойдёт setdefault). Затем добавь имя в этот список.",
        { code: 'def group_names_by_city(people):\n    groups = {}\n    for person in people:\n        groups.setdefault(person["city"], ___).append(person["name"])\n    return groups' },
        { code: 'def group_names_by_city(people):\n    groups = {}\n    for person in people:\n        groups.setdefault(person["city"], []).append(person["name"])\n    return groups\n\nprint(group_names_by_city([{"name": "Анна", "city": "Омск"}]))' }
      ],
      improveTip: "Без <code>setdefault</code> та же логика пишется через проверку <code>if city not in groups: groups[city] = []</code>. Сравни, какая запись читается лучше.",
      successMessage: "Словарь списков собран: имена сгруппированы по городам."
    },
    {
      id: "l1_nest_c5",
      type: "code",
      tier: "main",
      title: "Функция get_in",
      explanation: [
        "Путь к значению задан списком ключей. Идти по нему нужно шаг за шагом: на каждом уровне проверять, что ключ существует."
      ],
      assignment: "Напиши функцию <code>get_in(data, path, default)</code>, где <code>data</code> — вложенный словарь, <code>path</code> — список ключей, а <code>default</code> — значение на случай, если путь не найден. Функция идёт по ключам из <code>path</code> вглубь словаря и возвращает найденное значение. Если какого-то ключа на пути нет, верни <code>default</code>. Для пустого <code>path</code> верни сам <code>data</code>. Считай, что на пути всегда встречаются словари. Например, <code>get_in({\"db\": {\"port\": 5432}}, [\"db\", \"port\"], 0)</code> возвращает <code>5432</code>.",
      starterCode: "# Напиши функцию get_in(data, path, default)\n",
      astRequirements: {
        require_def: true,
        require_return: true,
        require_for: true
      },
      tests: [
        { call: 'get_in({"db": {"host": "localhost", "port": 5432}}, ["db", "port"], 0)', returns: 5432 },
        { call: 'get_in({"db": {"host": "localhost", "port": 5432}}, ["cache", "ttl"], 60)', returns: 60 },
        { call: 'get_in({"db": {"host": "localhost", "port": 5432}}, ["db", "user"], "root")', returns: "root" },
        { call: 'str(get_in({"a": 1}, [], 0))', returns: "{'a': 1}", hidden: true },
        { call: 'get_in({"a": {"b": {"c": 7}}}, ["a", "b", "c"], 0)', returns: 7, hidden: true },
        { call: 'get_in({"a": {"b": {"c": 7}}}, ["a", "x", "c"], -1)', returns: -1, hidden: true }
      ],
      hints: [
        "Начни с current = data. Для каждого ключа из path: если ключа нет в current, сразу верни default, иначе перейди глубже: current = current[key]. После цикла верни current.",
        { code: 'def get_in(data, path, default):\n    current = data\n    for key in path:\n        if key not in ___:\n            return default\n        current = current[key]\n    return current' },
        { code: 'def get_in(data, path, default):\n    current = data\n    for key in path:\n        if key not in current:\n            return default\n        current = current[key]\n    return current\n\nprint(get_in({"db": {"port": 5432}}, ["db", "port"], 0))' }
      ],
      improveTip: "Путь в виде списка ключей работает для любой глубины вложенности: одна и та же функция читает и два, и десять уровней.",
      successMessage: "Значение по цепочке ключей читается безопасно и на любой глубине."
    },

    /* ============ НАЙДИ ОШИБКУ (ОСНОВНОЙ УРОВЕНЬ) ============ */
    {
      id: "l1_nest_f2",
      type: "code",
      tier: "main",
      kind: "fix",
      title: "Найди ошибку: группы по длине слова",
      explanation: [
        "В каждой группе оказываются все слова подряд, а не только слова своей длины. Подумай, сколько списков на самом деле создаёт <code>dict.fromkeys</code>."
      ],
      assignment: "Функция <code>collect_by_length(words)</code> должна вернуть словарь: длина слова → список слов этой длины, в порядке появления. Сейчас у всех ключей общий список. Исправь функцию. Например, <code>collect_by_length([\"кот\", \"сом\", \"лиса\"])</code> должна вернуть <code>{3: ['кот', 'сом'], 4: ['лиса']}</code>.",
      starterCode: 'def collect_by_length(words):\n    groups = dict.fromkeys([len(w) for w in words], [])\n    for w in words:\n        groups[len(w)].append(w)\n    return groups\n',
      tests: [
        { call: 'str(collect_by_length(["кот", "сом", "лиса"]))', returns: "{3: ['кот', 'сом'], 4: ['лиса']}" },
        { call: 'str(collect_by_length(["я"]))', returns: "{1: ['я']}" },
        { call: 'str(collect_by_length([]))', returns: "{}", hidden: true },
        { call: 'str(collect_by_length(["дом", "рак", "лес", "ёж"]))', returns: "{3: ['дом', 'рак', 'лес'], 2: ['ёж']}", hidden: true }
      ],
      hints: [
        "Все ключи словаря, созданного через dict.fromkeys(..., []), ссылаются на один и тот же список. Каждой группе нужен свой собственный список: создавай его отдельно для каждого ключа.",
        { code: 'def collect_by_length(words):\n    groups = {}\n    for w in words:\n        groups.___(len(w), []).append(w)\n    return groups' },
        { code: 'def collect_by_length(words):\n    groups = {}\n    for w in words:\n        groups.setdefault(len(w), []).append(w)\n    return groups\n\nprint(collect_by_length(["кот", "сом", "лиса"]))' }
      ],
      successMessage: "Ошибка исправлена: у каждой группы теперь собственный список."
    },

    /* ============ ЗВЁЗДОЧКИ ============ */
    {
      id: "l1_nest_c6",
      type: "code",
      tier: "star",
      optional: true,
      title: "Функция merge_settings",
      explanation: [
        "Нужно объединить два словаря словарей, не изменив ни один из них. Вспомни, чем поверхностная копия отличается от глубокой."
      ],
      assignment: "Напиши функцию <code>merge_settings(defaults, overrides)</code>, у которой оба аргумента — словари словарей (разделы настроек). Функция возвращает новый словарь: все разделы из <code>defaults</code>, в которых значения ключей заменены значениями из <code>overrides</code>; разделы и ключи, которых не было в <code>defaults</code>, добавляются. Исходные словари <code>defaults</code> и <code>overrides</code> изменяться не должны. Например, для defaults <code>{\"db\": {\"host\": \"localhost\", \"port\": 5432}}</code> и overrides <code>{\"db\": {\"port\": 6543}}</code> результат: <code>{'db': {'host': 'localhost', 'port': 6543}}</code>.",
      starterCode: "# Напиши функцию merge_settings(defaults, overrides)\n# Не меняй defaults и overrides\n",
      astRequirements: {
        require_def: true,
        require_return: true
      },
      tests: [
        { call: 'str(merge_settings({"db": {"host": "localhost", "port": 5432}, "debug": {"level": 0}}, {"db": {"port": 6543}, "cache": {"ttl": 30}}))', returns: "{'db': {'host': 'localhost', 'port': 6543}, 'debug': {'level': 0}, 'cache': {'ttl': 30}}" },
        { call: 'merge_settings({"db": {"port": 5432}}, {})["db"]["port"]', returns: 5432 },
        { call: 'merge_settings({}, {"cache": {"ttl": 30}})["cache"]["ttl"]', returns: 30 },
        { call: 'merge_settings({"app": {"name": "test"}}, {"app": {"version": 2}})["app"]["name"]', returns: "test", hidden: true },
        { call: 'merge_settings({"app": {"name": "test"}}, {"app": {"version": 2}})["app"]["version"]', returns: 2, hidden: true }
      ],
      hints: [
        "Начни с глубокой копии defaults: copy.deepcopy(defaults). Затем для каждого раздела из overrides создай его в результате, если там его ещё нет, и перенеси в него ключи и значения из overrides. Используй копию, а не исходные словари.",
        { code: 'import copy\n\ndef merge_settings(defaults, overrides):\n    result = copy.deepcopy(___)\n    for section, options in overrides.items():\n        if section not in result:\n            result[section] = {}\n        for key, value in options.items():\n            result[section][key] = copy.deepcopy(value)\n    return result' },
        { code: 'import copy\n\ndef merge_settings(defaults, overrides):\n    result = copy.deepcopy(defaults)\n    for section, options in overrides.items():\n        if section not in result:\n            result[section] = {}\n        for key, value in options.items():\n            result[section][key] = copy.deepcopy(value)\n    return result\n\nprint(merge_settings({"db": {"port": 5432}}, {"db": {"port": 6543}}))' }
      ],
      successMessage: "Настройки объединены, исходные словари остались нетронутыми."
    },
    {
      id: "l1_nest_c7",
      type: "code",
      tier: "star",
      optional: true,
      title: "Функция columns",
      explanation: [
        "Нужно превратить список записей в словарь столбцов. Сначала придётся собрать все встречающиеся ключи, потому что в разных записях набор ключей может отличаться."
      ],
      assignment: "Напиши функцию <code>columns(records)</code>, которая принимает список словарей и возвращает словарь столбцов: ключ → список значений этого ключа из всех записей, в порядке записей. Если в какой-то записи ключа нет, в столбец добавляется <code>None</code>. Ключи в результате идут в порядке первого появления. Для пустого списка верни пустой словарь <code>{}</code>. Например, <code>columns([{\"a\": 1}, {\"a\": 2, \"b\": 3}])</code> возвращает <code>{'a': [1, 2], 'b': [None, 3]}</code>.",
      starterCode: "# Напиши функцию columns(records)\n",
      astRequirements: {
        require_def: true,
        require_return: true,
        require_for: true
      },
      tests: [
        { call: 'str(columns([{"a": 1, "b": 2}, {"a": 3, "b": 4}]))', returns: "{'a': [1, 3], 'b': [2, 4]}" },
        { call: 'str(columns([{"a": 1}, {"a": 2, "b": 3}]))', returns: "{'a': [1, 2], 'b': [None, 3]}" },
        { call: 'str(columns([]))', returns: "{}" },
        { call: 'str(columns([{"x": "q"}]))', returns: "{'x': ['q']}", hidden: true },
        { call: 'str(columns([{"a": 1}, {"b": 2}, {"a": 3, "b": 4}]))', returns: "{'a': [1, None, 3], 'b': [None, 2, 4]}", hidden: true }
      ],
      hints: [
        "Сначала пройди по всем записям и собери список ключей в порядке первого появления (без повторов). Затем для каждого ключа составь список значений: для каждой записи добавляй record.get(key), он вернёт None, если ключа нет.",
        { code: 'def columns(records):\n    keys = []\n    for record in records:\n        for key in record:\n            if key not in keys:\n                keys.append(key)\n    result = {}\n    for key in keys:\n        result[key] = []\n        for record in records:\n            result[key].append(record.___(key))\n    return result' },
        { code: 'def columns(records):\n    keys = []\n    for record in records:\n        for key in record:\n            if key not in keys:\n                keys.append(key)\n    result = {}\n    for key in keys:\n        result[key] = []\n        for record in records:\n            result[key].append(record.get(key))\n    return result\n\nprint(columns([{"a": 1}, {"a": 2, "b": 3}]))' }
      ],
      successMessage: "Список записей превращён в словарь столбцов с учётом пропущенных ключей."
    }
  ]
});
