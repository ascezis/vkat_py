/**
 * Тема 2: Условия (if / elif / else)
 */

window.COURSE_TOPICS = window.COURSE_TOPICS || [];

window.COURSE_TOPICS.push({
  id: "conditions",
  title: "Условия",
  tasks: [
    {
      id: "cond_1",
      title: "Простая проверка через if",
      explanation: [
        "Команда if проверяет условие. Если условие истинно (True), выполняется блок кода под ним.",
        "После условия обязательно ставится двоеточие :, а тело проверки отделяется четырьмя пробелами (отступом). Всё, что написано с отступом, относится к этому условию."
      ],
      example: {
        code: 'score = 150\nif score >= 100:\n    print("Новый рекорд!")',
        output: "Новый рекорд!"
      },
      assignment: "Переменная energy = 80. Напиши условие if: если energy больше 50, выведи на экран фразу «Хватит сил для рывка».",
      starterCode: 'energy = 80\n# Напиши проверку if\n',
      hint: 'if energy > 50:\n    print("Хватит сил для рывка")',
      expectedOutput: "Хватит сил для рывка",
      astRequirements: {
        require_if: true
      },
      improveTip: "В Python четыре пробела для отступа — строгий стандарт сообщества. Не смешивай пробелы и табы.",
      successMessage: "Условие if сработало верно!"
    },
    {
      id: "cond_2",
      title: "Два пути: if и else",
      explanation: [
        "Блок else срабатывает, когда условие в if оказалось ложным (False).",
        "У else нет собственного условия в скобках — после него сразу ставится двоеточие : и отступ со следующей строки."
      ],
      example: {
        code: 'coins = 10\nprice = 25\nif coins >= price:\n    print("Куплено")\nelse:\n    print("Не хватает монет")',
        output: "Не хватает монет"
      },
      assignment: "Дана переменная speed = 45. Напиши ветвление: если speed больше 60, выведи «Штраф», иначе выведи «В пределах нормы».",
      starterCode: 'speed = 45\n# Напиши конструкцию if-else\n',
      hint: 'if speed > 60:\n    print("Штраф")\nelse:\n    print("В пределах нормы")',
      expectedOutput: "В пределах нормы",
      astRequirements: {
        require_if: true
      },
      improveTip: "Строки внутри блоков if и else должны иметь одинаковый отступ в 4 пробела.",
      successMessage: "Ветвление if-else отработало корректно!"
    },
    {
      id: "cond_3",
      title: "Несколько условий с elif",
      explanation: [
        "Когда вариантов больше двух, используют elif (сокращение от else if). Проверки идут по очереди сверху вниз до первого совпадения.",
        "Для сравнения на точное равенство используют двойное равно == (одно = — это присваивание!)."
      ],
      example: {
        code: 'traffic_light = "yellow"\nif traffic_light == "red":\n    print("Стой")\nelif traffic_light == "yellow":\n    print("Приготовься")\nelse:\n    print("Иди")',
        output: "Приготовься"
      },
      assignment: "Переменная rating = 4. Напиши проверку: если rating равен 5, выведи «Отлично»; если rating равен 4, выведи «Хорошо»; в остальных случаях выведи «Нужно подучить».",
      starterCode: 'rating = 4\n# Напиши цепочку if / elif / else\n',
      hint: 'if rating == 5:\n    print("Отлично")\nelif rating == 4:\n    print("Хорошо")\nelse:\n    print("Нужно подучить")',
      expectedOutput: "Хорошо",
      astRequirements: {
        require_if: true
      },
      improveTip: "Не забывай про двойное равенство == при проверке значений. Одиночное = вызовет ошибку синтаксиса.",
      successMessage: "Множественное ветвление успешно пройдено!"
    },
    {
      id: "cond_4",
      title: "Сложные условия: and и or",
      explanation: [
        "Логический оператор and требует, чтобы оба условия были истинными.",
        "Оператор or требует истинности хотя бы одного из условий.",
        "С их помощью можно проверять диапазоны чисел и составные правила."
      ],
      example: {
        code: 'level = 7\nhas_key = True\nif level >= 5 and has_key:\n    print("Дверь открыта")',
        output: "Дверь открыта"
      },
      assignment: "Даны переменные age = 16 и has_ticket = True. Напиши условие: если age >= 14 и has_ticket равен True, выведи «Проходи на сеанс».",
      starterCode: 'age = 16\nhas_ticket = True\n# Напиши условие с оператором and\n',
      hint: 'if age >= 14 and has_ticket:\n    print("Проходи на сеанс")',
      expectedOutput: "Проходи на сеанс",
      astRequirements: {
        require_if: true
      },
      improveTip: "Когда переменная уже содержит True или False, писать `if has_ticket == True` избыточно — достаточно `if has_ticket:`.",
      successMessage: "Сложное условие с and проверено!"
    }
  ]
});
