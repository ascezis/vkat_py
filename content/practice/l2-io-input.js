/**
 * вкат.py — Практикум, тема: «Потоковый ввод: input(), split() и обработка данных»
 * Этап «Практикум».
 * Изучение работы с потоком stdin, функции input(), разбора строк и обработки EOF.
 */

window.COURSE_TOPICS = window.COURSE_TOPICS || [];

window.COURSE_TOPICS.push({
  id: "l2_io_input",
  title: "Потоковый ввод: input() и типы данных",
  minutes: 45,
  items: [
    {
      id: "l2_io_t1",
      type: "theory",
      glyph: "l2_io_t1",
      title: "Поток ввода программы (stdin)",
      blocks: [
        {
          type: "p",
          html: "В консольных утилитах, бэкенд-сервисах и олимпиадных задачах данные часто поступают из <b>стандартного потока ввода</b> (<code>stdin</code>). В консоли пользователь набирает строку и нажимает Enter, а в тренажёре строки поступают через панель <b>«Ввод программы»</b>."
        },
        {
          type: "code",
          code: 'name = input()\nprint(f"Привет, {name}!")',
          output: "Привет, Алекс!"
        },
        {
          type: "p",
          html: "Основные правила работы с <code>input()</code>:"
        },
        {
          type: "list",
          items: [
            "Каждый вызов <code>input()</code> считывает ровно <b>одну строку</b> до символа перевода строки.",
            "Возвращаемое значение — всегда строка (тип <code>str</code>), даже если введены одни цифры.",
            "Если поток ввода исчерпан, а программа снова вызывает <code>input()</code>, возникает исключение <code>EOFError</code> (End Of File)."
          ]
        },
        {
          type: "note",
          html: "В панели «Ввод программы» можно свободно менять строки и экспериментировать с поведением кода."
        }
      ]
    },
    {
      id: "l2_io_q1",
      type: "quiz",
      glyph: "l2_io_q1",
      title: "Тип данных после input()",
      question: "Пользователь ввёл число 42. Какой тип данных вернёт вызов функции input()?",
      options: [
        "Целое число (int)",
        "Строка (str)",
        "Автоматически определит тип (int или str)"
      ],
      correct: 1,
      explain: "Функция input() ВСЕГДА возвращает строку (str). Чтобы получить число, нужно явно выполнить преобразование: num = int(input())."
    },
    {
      id: "l2_io_p1",
      type: "predict",
      glyph: "l2_io_p1",
      title: "Предсказание: чтение двух строк",
      explanation: [
        "Программа считывает имя и возраст пользователя. Что выведет программа на экран при заданном вводе?"
      ],
      code: 'name = input()\nage = int(input())\nprint(f"{name}:{age + 1}")',
      stdin: "Анна\n19",
      expectedOutput: "Анна:20",
      explain: "Первый input() читает строку 'Анна', второй input() читает '19', int('19') + 1 даёт 20. Итог: 'Анна:20'."
    },
    {
      id: "l2_io_c1",
      type: "code",
      tier: "warmup",
      glyph: "l2_io_c1",
      title: "Эхо-логгер",
      explanation: [
        "Считай одну строку из входного потока с помощью `input()` и выведи её с префиксом `>>> `.",
        "Если введена пустая строка, должен выводиться префикс `>>> ` без текста."
      ],
      assignment: "Считай строку из stdin с помощью input() и выведи её на экран с префиксом «>>> ».",
      starterCode: "# Считай строку и выведи её с префиксом '>>> '\n",
      stdin: "ping",
      tests: [
        { stdin: "ping", stdout: ">>> ping" },
        { stdin: "status ok", stdout: ">>> status ok" },
        { stdin: "\n", stdout: ">>> " }
      ],
      astRequirements: {},
      improveTip: "Используй f-строку: print(f\">>> {line}\").",
      successMessage: "Первый поток ввода успешно обработан!"
    },
    {
      id: "l2_io_t2",
      type: "theory",
      glyph: "l2_io_t2",
      title: "Несколько значений в одной строке: split()",
      blocks: [
        {
          type: "p",
          html: "Часто на одной строке передаются сразу несколько значений через пробел (например, параметры запроса или координаты). Метод <code>.split()</code> разбивает строку по пробелам на список строк:"
        },
        {
          type: "code",
          code: 'raw = input()          # например, "10 20"\na, b = raw.split()     # a = "10", b = "20"\nprint(int(a) + int(b)) # 30',
          output: "30"
        },
        {
          type: "p",
          html: "Можно также указывать конкретный разделитель: <code>line.split(':')</code> или <code>line.split(',')</code>."
        }
      ]
    },
    {
      id: "l2_io_q2",
      type: "quiz",
      glyph: "l2_io_q2",
      title: "Склеивание vs Сложение",
      question: "Что выведет следующий код, если на вход поданы строки 5 и 3?",
      code: 'x = input()\ny = input()\nprint(x + y)',
      options: [
        "8",
        "53",
        "Ошибка TypeError"
      ],
      correct: 1,
      explain: "Так как input() возвращает строки, оператор + выполняет склеивание (конкатенацию): '5' + '3' = '53'. Для арифметического сложения нужно преобразовать строки в числа через int()."
    },
    {
      id: "l2_io_p2",
      type: "predict",
      glyph: "l2_io_p2",
      title: "Предсказание: split() и регистр",
      explanation: [
        "Программа считывает слова из строки и выводит их количество и первое слово в верхнем регистре."
      ],
      code: 'words = input().split()\nprint(len(words), words[0].upper())',
      stdin: "alpha beta gamma",
      expectedOutput: "3 ALPHA",
      explain: "split() разбивает строку на список из 3 слов ['alpha', 'beta', 'gamma']. words[0].upper() даёт 'ALPHA'."
    },
    {
      id: "l2_io_c2",
      type: "code",
      glyph: "l2_io_c2",
      title: "Сумма двух чисел из разных строк",
      explanation: [
        "Во входном потоке передаются два целых числа, каждое на отдельной строке.",
        "Считай каждое число через `input()`, переведи в тип `int` и выведи их сумму на экран."
      ],
      assignment: "Считай два целых числа (каждое на отдельной строке) и выведи их сумму на экран.",
      starterCode: "# Считай два числа и выведи их сумму\n",
      stdin: "15\n27",
      tests: [
        { stdin: "15\n27", stdout: "42" },
        { stdin: "-5\n10", stdout: "5" },
        { stdin: "0\n0", stdout: "0" }
      ],
      astRequirements: {},
      improveTip: "a = int(input()) на первой строке и b = int(input()) на второй строке.",
      successMessage: "Числа из многострочного ввода успешно сложены!"
    },
    {
      id: "l2_io_c3",
      type: "code",
      glyph: "l2_io_c3",
      title: "Парсер конфигурации сервиса",
      explanation: [
        "Строка конфигурации сервиса передаётся в формате `хост:порт:статус` (разделитель — двоеточие `:`).",
        "Считай строку с помощью `input()`, разбей её методом `.split(':')` и выведи три параметра построчно:",
        "Хост: {хост}",
        "Порт: {порт}",
        "Статус: {статус}"
      ],
      assignment: "Считай строку конфигурации 'хост:порт:статус', разбей её через .split(':') и выведи параметры построчно.",
      starterCode: "# Считай конфигурацию сервиса и выведи три параметра\n",
      stdin: "db.internal:5432:online",
      tests: [
        { stdin: "db.internal:5432:online", stdout: "Хост: db.internal\nПорт: 5432\nСтатус: online" },
        { stdin: "auth.service:443:standby", stdout: "Хост: auth.service\nПорт: 443\nСтатус: standby" },
        { stdin: "gateway:80:ready", stdout: "Хост: gateway\nПорт: 80\nСтатус: ready" }
      ],
      astRequirements: {},
      improveTip: "host, port, status = input().split(':')",
      successMessage: "Конфигурация сервиса успешно разобрана!"
    },
    {
      id: "l2_io_c4",
      type: "code",
      optional: true,
      glyph: "l2_io_c4",
      title: "★ Чтение до конца потока (EOF)",
      explanation: [
        "Когда количество строк ввода заранее неизвестно, чтение производят в бесконечном цикле `while True`, перехватывая `EOFError` через `try...except`.",
        "Во входном потоке передаются целые числа — по одному на строке (может быть несколько чисел или ни одного).",
        "Посчитай сумму всех чисел и выведи её на экран. Если строк нет, выведи 0."
      ],
      assignment: "Считывай целые числа из потока ввода построчно до наступления EOFError и выведи их сумму на экран.",
      starterCode: "total = 0\nwhile True:\n    try:\n        line = input()\n    except EOFError:\n        break\n    # Добавь число line к total\n\nprint(total)\n",
      stdin: "10\n20\n30",
      tests: [
        { stdin: "10\n20\n30", stdout: "60" },
        { stdin: "5\n-5\n100", stdout: "100" },
        { stdin: "", stdout: "0" }
      ],
      astRequirements: {},
      improveTip: "Не забудь преобразовать прочитанную строку в int перед добавлением к total: total += int(line).",
      successMessage: "Отличная работа с потоковым вводом и исключением EOFError!"
    }
  ]
});
