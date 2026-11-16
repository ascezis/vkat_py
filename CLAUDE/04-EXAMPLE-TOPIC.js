/**
 * вкат.py — Эталонный пример структуры темы контента
 *
 * Файл демонстрирует правильный формат всех 5 типов учебных элементов:
 * theory, quiz, predict, fix, code (+ optional звёздочка).
 */

window.COURSE_TOPICS = window.COURSE_TOPICS || [];

window.COURSE_TOPICS.push({
  id: "l1_example",
  title: "Пример темы: Шаблон и стандарты",
  items: [
    /* ------------------------------------------------------------- */
    /* 1. ТЕОРИЯ: Введение в концепцию                               */
    /* ------------------------------------------------------------- */
    {
      type: "theory",
      id: "l1_ex_t1",
      title: "Как устроена функция",
      blocks: [
        {
          type: "p",
          text: "Функция — это именованный блок кода. Она принимает аргументы, выполняет действия и возвращает результат через ключевое слово return."
        },
        {
          type: "code",
          code: "def square(x):\n    return x * x\n\nres = square(5)\nprint(res)",
          output: "25"
        },
        {
          type: "tip",
          text: "Главное правило: функция без явного return всегда возвращает специальное значение None."
        }
      ]
    },

    /* ------------------------------------------------------------- */
    /* 2. КВИЗ: Проверка понимания теории                            */
    /* ------------------------------------------------------------- */
    {
      type: "quiz",
      id: "l1_ex_q1",
      title: "Что вернёт функция?",
      question: "Какое значение будет сохранено в переменной `y` после выполнения кода?",
      code: "def greet(name):\n    print('Привет,', name)\n\ny = greet('Аня')",
      options: [
        "'Привет, Аня'",
        "None",
        "True",
        "Ошибка SyntaxError"
      ],
      answer: 1, // 0-based: "None"
      explanation: "Функция greet выводит текст на экран через print, но не содержит инструкции return, поэтому неявно возвращает None."
    },

    /* ------------------------------------------------------------- */
    /* 3. PREDICT: Чтение кода и предсказание вывода                 */
    /* ------------------------------------------------------------- */
    {
      type: "predict",
      id: "l1_ex_p1",
      title: "Предскажи вывод программы",
      code: "def add(a, b=2):\n    return a + b\n\nprint(add(3), add(3, 5))",
      expectedOutput: "5 8",
      explanation: "При первом вызове b принимает значение по умолчанию 2 (3 + 2 = 5). При втором вызове передано 5 (3 + 5 = 8)."
    },

    /* ------------------------------------------------------------- */
    /* 4. FIX: Поиск и исправление типичной ошибки                   */
    /* ------------------------------------------------------------- */
    {
      type: "fix",
      id: "l1_ex_f1",
      title: "Исправь баг: перепутан оператор",
      prompt: "Функция должна проверять, является ли число положительным (строго больше нуля). Сейчас она ошибочно считает ноль положительным. Исправь условие.",
      initialCode: "def is_positive(n):\n    return n >= 0\n\nprint(is_positive(0))",
      tests: [
        { call: "is_positive(5)", returns: true },
        { call: "is_positive(0)", returns: false },
        { call: "is_positive(-3)", returns: false },
        { call: "is_positive(1)", returns: true, hidden: true }
      ],
      expectedOutput: "False"
    },

    /* ------------------------------------------------------------- */
    /* 5. CODE: Самостоятельное написание решения                    */
    /* ------------------------------------------------------------- */
    {
      type: "code",
      id: "l1_ex_c1",
      title: "Функция подсчёта чётных чисел",
      prompt: "Напиши функцию `count_evens(numbers)`, которая принимает список целых чисел и возвращает количество чётных элементов в нём.",
      initialCode: "def count_evens(numbers):\n    # твой код здесь\n    pass\n\nprint(count_evens([1, 2, 3, 4, 6]))",
      astRequirements: {
        require_def: true,
        require_return: true,
        require_for: true
      },
      tests: [
        { call: "count_evens([1, 2, 3, 4, 6])", returns: 3 },
        { call: "count_evens([1, 3, 5])", returns: 0 },
        { call: "count_evens([])", returns: 0 },
        { call: "count_evens([2, 4, 8, 10])", returns: 4, hidden: true }
      ]
    },

    /* ------------------------------------------------------------- */
    /* 6. CODE (★ Звёздочка / Опциональное усложнённое задание)       */
    /* ------------------------------------------------------------- */
    {
      type: "code",
      id: "l1_ex_c2_star",
      optional: true,
      tier: "star",
      title: "★ Частотный словарь без collections.Counter",
      prompt: "Напиши функцию `char_frequency(text)`, которая возвращает словарь с частотой каждого символа в строке text. Запрещено использовать модуль collections.",
      initialCode: "def char_frequency(text):\n    pass\n\nprint(char_frequency('банан'))",
      astRequirements: {
        require_def: true,
        require_return: true,
        require_loop: true,
        forbid_calls: ["Counter"]
      },
      tests: [
        { call: "char_frequency('банан')", returns: { "б": 1, "а": 2, "н": 2 } },
        { call: "char_frequency('')", returns: {} },
        { call: "char_frequency('aaa')", returns: { "а": 3 }, hidden: true }
      ]
    }
  ]
});
