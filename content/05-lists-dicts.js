/**
 * Тема 5: Списки и словари (базовые структуры данных)
 */

window.COURSE_TOPICS = window.COURSE_TOPICS || [];

window.COURSE_TOPICS.push({
  id: "lists-dicts",
  title: "Списки и словари",
  tasks: [
    {
      id: "ld_1",
      title: "Списки хранят упорядоченный набор данных",
      explanation: [
        "Список (list) — это упорядоченная коллекция элементов в квадратных скобках []. Элементы перечисляются через запятую.",
        "Нумерация элементов в Python начинается с нуля (0): первый элемент имеет индекс 0, второй — 1, и так далее."
      ],
      example: {
        code: 'inventory = ["меч", "зелье", "щит"]\nprint(inventory[0])\nprint(inventory[1])',
        output: "меч\nзелье"
      },
      assignment: "Создай список heroes с тремя именами: [\"Маг\", \"Воин\", \"Лучник\"]. Выведи на экран второй элемент списка (у которого индекс 1).",
      starterCode: '# Создай список heroes и выведи второй элемент\n',
      hint: 'heroes = ["Маг", "Воин", "Лучник"]\nprint(heroes[1])',
      expectedOutput: "Воин",
      astRequirements: {
        require_vars: ["heroes"]
      },
      testCode: 'assert "heroes" in _user_ns and _user_ns["heroes"] == ["Маг", "Воин", "Лучник"], "Список heroes должен содержать [\\"Маг\\", \\"Воин\\", \\"Лучник\\"]"',
      improveTip: "Помни: первый элемент в Python всегда идёт под индексом [0], а не [1].",
      successMessage: "Список создан и доступ по индексу выполнен!"
    },
    {
      id: "ld_2",
      title: "Добавление элементов и длина списка len()",
      explanation: [
        "Метод .append(элемент) добавляет новое значение в конец существующего списка.",
        "Функция len(список) возвращает количество элементов (длину) списка."
      ],
      example: {
        code: 'backpack = ["карта"]\nbackpack.append("компас")\nprint(len(backpack))',
        output: "2"
      },
      assignment: "Дан список quest = [\"лес\", \"пещера\"]. Добавь в него элемент \"замок\" с помощью .append(), а затем выведи на экран общую длину списка через print(len(quest)).",
      starterCode: 'quest = ["лес", "пещера"]\n# Добавь "замок" и напечатай len(quest)\n',
      hint: 'quest.append("замок")\nprint(len(quest))',
      expectedOutput: "3",
      astRequirements: {
        require_call: ["append", "len"]
      },
      testCode: 'assert "quest" in _user_ns and "замок" in _user_ns["quest"] and len(_user_ns["quest"]) == 3, "Добавь \\"замок\\" в список quest через .append()"',
      improveTip: "Метод append изменяет исходный список на месте и ничего не возвращает, поэтому не нужно писать quest = quest.append().",
      successMessage: "Метод .append() и функция len() освоены!"
    },
    {
      id: "ld_3",
      title: "Перебор списка циклом for",
      explanation: [
        "Цикл for умеет напрямую перебирать элементы списка без индексов: for item in list.",
        "На каждом шаге переменная item по очереди принимает очередное значение из списка."
      ],
      example: {
        code: 'loot = ["золото", "рубин"]\nfor item in loot:\n    print("Найдено:", item)',
        output: "Найдено: золото\nНайдено: рубин"
      },
      assignment: "Дан список чисел scores = [10, 20, 30]. С помощью цикла for выведи каждое число на отдельной строке.",
      starterCode: 'scores = [10, 20, 30]\n# Напиши цикл for по элементам scores\n',
      hint: 'for s in scores:\n    print(s)',
      expectedOutput: "10\n20\n30",
      astRequirements: {
        require_for: true
      },
      improveTip: "В Python принято называть список во множественном числе (scores), а переменную в цикле — в единственном (score).",
      successMessage: "Перебор списка циклом for выполнен отлично!"
    },
    {
      id: "ld_4",
      title: "Словари хранят пары «ключ — значение»",
      explanation: [
        "Словарь (dict) создаётся фигурными скобками {}. Каждый элемент состоит из ключа и значения, разделённых двоеточием: {\"ключ\": значение}.",
        "В отличие от списков, где мы обращаемся по порядковому номеру [0], в словаре доступ происходит по имени ключа: player[\"hp\"]."
      ],
      example: {
        code: 'hero = {"name": "Артур", "level": 5}\nprint(hero["name"])\nprint(hero["level"])',
        output: "Артур\n5"
      },
      assignment: "Создай словарь item со свойствами: \"title\": \"Факел\" и \"cost\": 15. Выведи на экран стоимость предмета через print(item[\"cost\"]).",
      starterCode: '# Создай словарь item и выведи значение по ключу "cost"\n',
      hint: 'item = {"title": "Факел", "cost": 15}\nprint(item["cost"])',
      expectedOutput: "15",
      astRequirements: {
        require_vars: ["item"]
      },
      testCode: 'assert "item" in _user_ns and isinstance(_user_ns["item"], dict) and _user_ns["item"].get("cost") == 15, "Словарь item должен содержать ключ cost со значением 15"',
      improveTip: "Ключами словаря чаще всего выступают строки. Всегда проверяй кавычки вокруг имени ключа.",
      successMessage: "Словарь создан и значение по ключу получено!"
    }
  ]
});
