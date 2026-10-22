/**
 * Тема 3: Циклы (for и while) — Усиленный блок
 */

window.COURSE_TOPICS = window.COURSE_TOPICS || [];

window.COURSE_TOPICS.push({
  id: "loops",
  title: "Циклы",
  tasks: [
    {
      id: "loop_1",
      title: "Цикл for повторяет действие заданное число раз",
      explanation: [
        "Вместо того чтобы писать print() пять раз подряд, можно один раз сказать «повтори это 5 раз» — и Python сделает всё сам.",
        "range(5) — это последовательность из пяти чисел: 0, 1, 2, 3, 4. Переменная i на каждом шаге принимает следующее значение из неё."
      ],
      example: {
        code: 'for i in range(3):\n    print("шаг", i)',
        output: "шаг 0\nшаг 1\nшаг 2"
      },
      assignment: "Напиши цикл for, который выведет числа от 1 до 5 (включительно), каждое на отдельной строке — как счётчик раундов в игре.",
      starterCode: '# Напиши цикл for с функцией range()\n',
      hint: 'Используй range(1, 6), так как правая граница в Python не включается:\nfor i in range(1, 6):\n    print(i)',
      expectedOutput: "1\n2\n3\n4\n5",
      astRequirements: {
        require_for: true
      },
      improveTip: "Помни: range(a, b) идёт от a до b - 1. Чтобы включить число 5, правую границу указывают как 6.",
      successMessage: "Вывод совпадает, цикл for использован верно!"
    },
    {
      id: "loop_2",
      title: "Шаг диапазона в range()",
      explanation: [
        "Функция range(start, stop, step) принимает третий параметр — шаг.",
        "Например, range(0, 10, 2) будет брать только чётные числа с шагом 2: 0, 2, 4, 6, 8. А отрицательный шаг range(5, 0, -1) позволяет считать в обратном порядке."
      ],
      example: {
        code: 'for n in range(10, 0, -2):\n    print(n)',
        output: "10\n8\n6\n4\n2"
      },
      assignment: "Напиши обратный отсчёт запуска ракеты: выведи числа 3, 2, 1 с помощью цикла for с шагом -1.",
      starterCode: '# Напиши обратный цикл\n',
      hint: 'range(3, 0, -1) переберёт числа 3, 2, 1:\nfor i in range(3, 0, -1):\n    print(i)',
      expectedOutput: "3\n2\n1",
      astRequirements: {
        require_for: true
      },
      improveTip: "Обратный диапазон range(start, stop, -1) удобен для таймеров и анимаций в терминале.",
      successMessage: "Обратный отсчёт выполнен через шаг range!"
    },
    {
      id: "loop_3",
      title: "Накопление суммы в цикле",
      explanation: [
        "Очень частый приём: до цикла заводится переменная-аккумулятор (например, total = 0), а внутри цикла к ней прибавляется каждое новое значение: total = total + x.",
        "Краткая запись прибавления: total += x."
      ],
      example: {
        code: 'total = 0\nfor x in range(1, 4):\n    total += x\nprint(total)',
        output: "6"
      },
      assignment: "Подсчитай сумму чисел от 1 до 5 включительно (1 + 2 + 3 + 4 + 5). Заведи переменную total = 0, прибавь в цикле for каждое число и выведи итоговое значение total после окончания цикла.",
      starterCode: 'total = 0\n# Допиши цикл и выведи total\n',
      hint: 'for i in range(1, 6):\n    total += i\nprint(total)',
      expectedOutput: "15",
      astRequirements: {
        require_for: true
      },
      improveTip: "Следи за отступом print(total): если написать его с отступом, он будет печататься на каждом шаге цикла, а без отступа — только один раз в финале.",
      successMessage: "Сумма в цикле рассчитана точно!"
    },
    {
      id: "loop_4",
      title: "Цикл while работает, пока условие истинно",
      explanation: [
        "Цикл while используется, когда мы не знаем заранее, сколько раз нужно повторить действие, но знаем условие продолжения.",
        "Важно: внутри цикла while обязательно нужно менять значение переменной условия (например, energy -= 1), иначе цикл станет бесконечным!"
      ],
      example: {
        code: 'count = 3\nwhile count > 0:\n    print(count)\n    count -= 1',
        output: "3\n2\n1"
      },
      assignment: "Переменная coins = 10. Напиши цикл while: пока coins > 0, выводи значение coins, а затем уменьшай coins на 3. Вывод должен остановиться, когда монет станет 0 или меньше.",
      starterCode: 'coins = 10\n# Напиши цикл while\n',
      hint: 'while coins > 0:\n    print(coins)\n    coins -= 3',
      expectedOutput: "10\n7\n4\n1",
      astRequirements: {
        require_while: true
      },
      improveTip: "Всегда проверяй, что условие в while когда-нибудь обязательно станет False, чтобы программа не зависла.",
      successMessage: "Цикл while отработал без зависания!"
    },
    {
      id: "loop_5",
      title: "Фильтрация в цикле: условия внутри цикла",
      explanation: [
        "Внутри цикла for можно вкладывать условия if, чтобы обрабатывать только определённые элементы.",
        "Например, проверять чётность числа через остаток от деления: i % 2 == 0."
      ],
      example: {
        code: 'for i in range(1, 6):\n    if i % 2 == 0:\n        print("чётное:", i)',
        output: "чётное: 2\nчётное: 4"
      },
      assignment: "Перебери числа от 1 до 6 включительно через for. С помощью условия if выведи только те числа, которые делятся на 3 без остатка (i % 3 == 0).",
      starterCode: '# Перебери диапазон и отфильтруй числа, кратные 3\n',
      hint: 'for i in range(1, 7):\n    if i % 3 == 0:\n        print(i)',
      expectedOutput: "3\n6",
      astRequirements: {
        require_for: true,
        require_if: true
      },
      improveTip: "Вложенные блоки кода сдвигаются ещё на 4 пробела правее (итого 8 пробелов внутри if внутри for).",
      successMessage: "Фильтрация внутри цикла работает безупречно!"
    }
  ]
});
