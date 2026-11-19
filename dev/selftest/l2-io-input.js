/**
 * Эталоны и некорректные решения для темы «Потоковый ввод» этапа «Практикум».
 * Хранятся отдельно от контента ученика.
 */

window.COURSE_SELFTEST = window.COURSE_SELFTEST || {};

window.COURSE_SELFTEST["l2_io_c1"] = {
  reference: `line = input()
print(f">>> {line}")`,
  wrong: [
    {
      name: "без префикса",
      code: `line = input()
print(line)`
    },
    {
      name: "неверный префикс",
      code: `line = input()
print(f">> {line}")`
    }
  ]
};

window.COURSE_SELFTEST["l2_io_c2"] = {
  reference: `a = int(input())
b = int(input())
print(a + b)`,
  wrong: [
    {
      name: "склеивает строки без int",
      code: `a = input()
b = input()
print(a + b)`
    },
    {
      name: "читает только одну строку",
      code: `a = int(input())
print(a)`
    }
  ]
};

window.COURSE_SELFTEST["l2_io_c3"] = {
  reference: `host, port, status = input().split(':')
print(f"Хост: {host}")
print(f"Порт: {port}")
print(f"Статус: {status}")`,
  wrong: [
    {
      name: "деление по пробелу вместо двоеточия",
      code: `parts = input().split()
print(parts)`
    },
    {
      name: "в одну строку",
      code: `h, p, s = input().split(':')
print(f"{h} {p} {s}")`
    }
  ]
};

window.COURSE_SELFTEST["l2_io_c4"] = {
  reference: `total = 0
while True:
    try:
        line = input()
    except EOFError:
        break
    total += int(line)
print(total)`,
  wrong: [
    {
      name: "не перехватывает EOFError",
      code: `total = 0
while True:
    total += int(input())
print(total)`
    },
    {
      name: "склеивает строки",
      code: `total = ""
while True:
    try:
        total += input()
    except EOFError:
        break
print(total)`
    }
  ]
};
