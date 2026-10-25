/**
 * Эталоны и некорректные решения для темы «Чистый код» этапа 2
 * Хранятся отдельно от контента ученика.
 */

window.COURSE_SELFTEST = window.COURSE_SELFTEST || {};

window.COURSE_SELFTEST["l1_sty_f1"] = {
  reference: "total_sum = 0\nfor price in [10, 20, 30]:\n    total_sum += price\n\ndef total(prices):\n    return sum(prices)",
  wrong: [
    {
      name: "затенённая sum не исправлена",
      code: "sum = 0\nfor price in [10, 20, 30]:\n    sum += price\n\ndef total(prices):\n    return sum(prices)"
    }
  ]
};

window.COURSE_SELFTEST["l1_sty_c1"] = {
  reference: "def ticket_price(age):\n    if age < 0:\n        return None\n    if age < 7:\n        return 0\n    if age < 18:\n        return 200\n    if age >= 65:\n        return 150\n    return 400",
  wrong: [
    {
      name: "неверная граница возраста",
      code: "def ticket_price(age):\n    if age < 0:\n        return None\n    if age <= 7:\n        return 0\n    if age < 18:\n        return 200\n    if age >= 65:\n        return 150\n    return 400"
    }
  ]
};

window.COURSE_SELFTEST["l1_sty_c2"] = {
  reference: "def line_total(name, price, quantity):\n    return f'{name}: {price * quantity} руб.'\n\nfor name, price, qty in [('Яблоко', 50, 3), ('Хлеб', 40, 2), ('Молоко', 90, 1)]:\n    print(line_total(name, price, qty))",
  wrong: [
    {
      name: "нет 'руб.'",
      code: "def line_total(name, price, quantity):\n    return f'{name}: {price * quantity}'"
    }
  ]
};

window.COURSE_SELFTEST["l1_sty_c3"] = {
  reference: "def is_leap_year(year):\n    if year % 400 == 0:\n        return True\n    if year % 100 == 0:\n        return False\n    return year % 4 == 0",
  wrong: [
    {
      name: "без исключения на 100",
      code: "def is_leap_year(year):\n    return year % 4 == 0"
    }
  ]
};

window.COURSE_SELFTEST["l1_sty_f2"] = {
  reference: "def to_int(text):\n    try:\n        return int(text)\n    except ValueError:\n        return 0",
  wrong: [
    {
      name: "опечатка txt не исправлена",
      code: "def to_int(text):\n    try:\n        return int(txt)\n    except:\n        return 0"
    }
  ]
};

window.COURSE_SELFTEST["l1_sty_c4"] = {
  reference: "def add_bonus(scores):\n    return [s + 10 for s in scores]",
  wrong: [
    {
      name: "мутирует исходный список",
      code: "def add_bonus(scores):\n    for i in range(len(scores)):\n        scores[i] += 10\n    return scores"
    }
  ]
};
