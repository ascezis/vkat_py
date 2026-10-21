/**
 * Эталоны и некорректные решения для темы «Функции» этапа 2
 * Хранятся отдельно от контента ученика.
 */

window.COURSE_SELFTEST = window.COURSE_SELFTEST || {};

window.COURSE_SELFTEST["l1_fn_c1"] = {
  reference: `def double(x):
    return x * 2

print(double(7))
print(double(double(3)))`,
  wrong: [
    {
      name: "print вместо return",
      code: `def double(x):
    print(x * 2)

double(7)`
    },
    {
      name: "умножает на 3",
      code: `def double(x):
    return x * 3

print(double(7))`
    }
  ]
};

window.COURSE_SELFTEST["l1_fn_f1"] = {
  reference: `def triple(x):
    return x * 3

print(triple(5) + triple(2))`,
  wrong: [
    {
      name: "код не изменён",
      code: `def triple(x):
    print(x * 3)

print(triple(5) + triple(2))`
    },
    {
      name: "и print, и return",
      code: `def triple(x):
    print(x * 3)
    return x * 3

print(triple(5) + triple(2))`
    }
  ]
};

window.COURSE_SELFTEST["l1_fn_c2"] = {
  reference: `def draw_line(n):
    print("*" * n)

draw_line(5)
draw_line(12)`,
  wrong: [
    {
      name: "return вместо print",
      code: `def draw_line(n):
    return "*" * n

draw_line(5)`
    },
    {
      name: "всегда пять звёздочек",
      code: `def draw_line(n):
    print("*" * 5)

draw_line(5)`
    }
  ]
};

window.COURSE_SELFTEST["l1_fn_c3"] = {
  reference: `def is_even(n):
    return n % 2 == 0

print(is_even(4))
print(is_even(7))
print(is_even(0))`,
  wrong: [
    {
      name: "возвращает остаток, а не bool",
      code: `def is_even(n):
    return n % 2`
    },
    {
      name: "print вместо return",
      code: `def is_even(n):
    print(n % 2 == 0)`
    },
    {
      name: "перепутано условие",
      code: `def is_even(n):
    return n % 2 == 1`
    }
  ]
};

window.COURSE_SELFTEST["l1_fn_c4"] = {
  reference: `def max_of_two(a, b):
    if a > b:
        return a
    return b

print(max_of_two(3, 5))`,
  wrong: [
    {
      name: "использует max()",
      code: `def max_of_two(a, b):
    if a > b:
        return max(a, b)
    return b`
    },
    {
      name: "забыт второй return",
      code: `def max_of_two(a, b):
    if a > b:
        return a`
    },
    {
      name: "всегда первое",
      code: `def max_of_two(a, b):
    if a > 0:
        return a
    return a`
    }
  ]
};

window.COURSE_SELFTEST["l1_fn_c5"] = {
  reference: `def rectangle(w, h, symbol="#"):
    for _ in range(h):
        print(symbol * w)

rectangle(5, 3)
rectangle(4, 2, "@")`,
  wrong: [
    {
      name: "нет значения по умолчанию",
      code: `def rectangle(w, h, symbol):
    for _ in range(h):
        print(symbol * w)`
    },
    {
      name: "игнорирует symbol",
      code: `def rectangle(w, h, symbol="#"):
    for _ in range(h):
        print("#" * w)`
    }
  ]
};

window.COURSE_SELFTEST["l1_fn_c6"] = {
  reference: `def count_vowels(text):
    count = 0
    for ch in text.lower():
        if ch in "аеёиоуыэюя":
            count += 1
    return count

print(count_vowels("программирование"))`,
  wrong: [
    {
      name: "без ё",
      code: `def count_vowels(text):
    count = 0
    for ch in text.lower():
        if ch in "аеиоуыэюя":
            count += 1
    return count`
    },
    {
      name: "без lower()",
      code: `def count_vowels(text):
    count = 0
    for ch in text:
        if ch in "аеёиоуыэюя":
            count += 1
    return count`
    },
    {
      name: "print вместо return",
      code: `def count_vowels(text):
    count = 0
    for ch in text.lower():
        if ch in "аеёиоуыэюя":
            count += 1
    print(count)`
    }
  ]
};

window.COURSE_SELFTEST["l1_fn_c7"] = {
  reference: `def draw_line(n):
    print("*" * n)

def triangle(n):
    for i in range(1, n + 1):
        draw_line(i)

triangle(4)`,
  wrong: [
    {
      name: "не использует draw_line",
      code: `def draw_line(n):
    print("*" * n)

def triangle(n):
    for i in range(1, n + 1):
        print("*" * i)`
    },
    {
      name: "сдвиг на единицу",
      code: `def draw_line(n):
    print("*" * n)

def triangle(n):
    for i in range(n):
        draw_line(i)`
    }
  ]
};

window.COURSE_SELFTEST["l1_fn_c8"] = {
  reference: `def calc(a, b, op):
    if op == "+":
        return a + b
    if op == "-":
        return a - b
    if op == "*":
        return a * b
    if op == "/":
        if b == 0:
            return "Делить на ноль нельзя"
        return a / b`,
  wrong: [
    {
      name: "нет проверки деления на ноль",
      code: `def calc(a, b, op):
    if op == "+":
        return a + b
    if op == "-":
        return a - b
    if op == "*":
        return a * b
    if op == "/":
        return a / b`
    },
    {
      name: "print вместо return",
      code: `def calc(a, b, op):
    if op == "+":
        print(a + b)`
    }
  ]
};
