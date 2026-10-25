/**
 * Эталоны и некорректные решения для темы «Списки» этапа 2
 * Хранятся отдельно от контента ученика.
 */

window.COURSE_SELFTEST = window.COURSE_SELFTEST || {};

window.COURSE_SELFTEST["l1_list_c1"] = {
  reference: "grades = [4, 5, 3, 5, 4, 2, 5]\n\nprint(len(grades), sum(grades) / len(grades), max(grades), grades.count(5))",
  wrong: [
    {
      name: "код не изменён",
      code: "grades = [4, 5, 3, 5, 4, 2, 5]\n\n# Выведи: количество, среднее, максимум, число пятёрок"
    }
  ]
};

window.COURSE_SELFTEST["l1_list_c2"] = {
  reference: "def reverse_list(a):\n    return a[::-1]\n\nprint(reverse_list([1, 2, 3, 4]))",
  wrong: [
    {
      name: "код не изменён",
      code: "# Напиши функцию reverse_list(a) без метода reverse()"
    }
  ]
};

window.COURSE_SELFTEST["l1_list_c3"] = {
  reference: "def even_odd(nums):\n    evens = []\n    odds = []\n    for x in nums:\n        if x % 2 == 0:\n            evens.append(x)\n        else:\n            odds.append(x)\n    return evens, odds\n\nprint(even_odd(list(range(1, 21))))",
  wrong: [
    {
      name: "код не изменён",
      code: "# Напиши функцию even_odd(nums)"
    }
  ]
};

window.COURSE_SELFTEST["l1_list_c4"] = {
  reference: "def desc_and_sum(line):\n    nums = [int(x) for x in line.split()]\n    return sorted(nums, reverse=True), sum(nums)\n\nprint(desc_and_sum(\"3 1 2\"))",
  wrong: [
    {
      name: "код не изменён",
      code: "# Напиши функцию desc_and_sum(line)"
    }
  ]
};

window.COURSE_SELFTEST["l1_list_c5"] = {
  reference: "def unique_ordered(items):\n    result = []\n    for x in items:\n        if x not in result:\n            result.append(x)\n    return result\n\nprint(unique_ordered([1, 2, 2, 3, 1, 4, 3]))",
  wrong: [
    {
      name: "код не изменён",
      code: "# Напиши функцию unique_ordered(items)"
    }
  ]
};

window.COURSE_SELFTEST["l1_list_c6"] = {
  reference: "def second_max(nums):\n    unique = list(set(nums))\n    first = max(unique)\n    unique.remove(first)\n    return max(unique)\n\nprint(second_max([4, 9, 1, 9, 7]))",
  wrong: [
    {
      name: "код не изменён",
      code: "# Напиши функцию second_max(nums) без sort() и sorted()"
    }
  ]
};

window.COURSE_SELFTEST["l1_list_c7"] = {
  reference: "def shift_right(a, k):\n    k = k % len(a)\n    return a[-k:] + a[:-k]\n\nprint(shift_right([1, 2, 3, 4, 5], 2))",
  wrong: [
    {
      name: "код не изменён",
      code: "# Напиши функцию shift_right(a, k)"
    }
  ]
};

window.COURSE_SELFTEST["l1_list_c8"] = {
  reference: "def long_words_upper(text):\n    return [w.upper() for w in text.split() if len(w) > 3]\n\nprint(long_words_upper(\"Python это очень удобный язык для новичков\"))",
  wrong: [
    {
      name: "код не изменён",
      code: "# Напиши функцию long_words_upper(text)"
    }
  ]
};

window.COURSE_SELFTEST["l1_list_c9"] = {
  reference: "table = [[i * j for j in range(1, 6)] for i in range(1, 6)]\nfor row in table:\n    print(row)",
  wrong: [
    {
      name: "код не изменён",
      code: "# Создай таблицу умножения 5x5 и выведи её построчно"
    }
  ]
};

window.COURSE_SELFTEST["l1_list_f1"] = {
  reference: "board = [[\".\"] * 3 for _ in range(3)]\nboard[1][1] = \"X\"\nprint(board)",
  wrong: [
    {
      name: "код не изменён",
      code: "board = [[\".\"] * 3] * 3\nboard[1][1] = \"X\"\nprint(board)"
    }
  ]
};

window.COURSE_SELFTEST["l1_list_c10"] = {
  reference: "def longest_words(words):\n    max_len = 0\n    for w in words:\n        if len(w) > max_len:\n            max_len = len(w)\n    return [w for w in words if len(w) == max_len]\n\nprint(longest_words([\"кот\", \"собака\", \"лиса\"]))",
  wrong: [
    {
      name: "код не изменён",
      code: "# Напиши функцию longest_words(words)"
    }
  ]
};

window.COURSE_SELFTEST["l1_list_c11"] = {
  reference: "def transpose(m):\n    result = [[0] * 3 for _ in range(3)]\n    for i in range(3):\n        for j in range(3):\n            result[j][i] = m[i][j]\n    return result\n\nprint(transpose([[1, 2, 3], [4, 5, 6], [7, 8, 9]]))",
  wrong: [
    {
      name: "код не изменён",
      code: "# Напиши функцию transpose(m) для матрицы 3x3"
    }
  ]
};
