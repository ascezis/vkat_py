/**
 * Эталоны и некорректные решения для темы «Кортежи» этапа 2
 * Хранятся отдельно от контента ученика.
 */

window.COURSE_SELFTEST = window.COURSE_SELFTEST || {};

window.COURSE_SELFTEST["l1_tup_f1"] = {
  reference: "def move(point, dx, dy):\n    x, y = point\n    return (x + dx, y + dy)\n\nprint(move((1, 2), 3, 4))",
  wrong: [
    {
      name: "код не изменён",
      code: "def move(point, dx, dy):\n    point[0] += dx\n    point[1] += dy\n    return point\n\nprint(move((1, 2), 3, 4))"
    }
  ]
};

window.COURSE_SELFTEST["l1_tup_c1"] = {
  reference: "def min_max(nums):\n    return min(nums), max(nums)\n\nprint(min_max([3, 1, 4]))",
  wrong: [
    {
      name: "код не изменён",
      code: "# Напиши функцию min_max(nums)"
    }
  ]
};

window.COURSE_SELFTEST["l1_tup_c2"] = {
  reference: "def swap_pair(pair):\n    a, b = pair\n    return b, a\n\nprint(swap_pair((1, 2)))",
  wrong: [
    {
      name: "код не изменён",
      code: "# Напиши функцию swap_pair(pair)"
    }
  ]
};

window.COURSE_SELFTEST["l1_tup_c3"] = {
  reference: "def split_pairs(pairs):\n    names = []\n    scores = []\n    for name, score in pairs:\n        names.append(name)\n        scores.append(score)\n    return names, scores\n\nprint(split_pairs([(\"Аня\", 5), (\"Борис\", 3)]))",
  wrong: [
    {
      name: "код не изменён",
      code: "# Напиши функцию split_pairs(pairs)"
    }
  ]
};

window.COURSE_SELFTEST["l1_tup_c4"] = {
  reference: "def best_player(records):\n    best_name, best_score = records[0]\n    for name, score in records:\n        if score > best_score:\n            best_name = name\n            best_score = score\n    return best_name\n\nprint(best_player([(\"Аня\", 5), (\"Борис\", 7), (\"Вера\", 6)]))",
  wrong: [
    {
      name: "код не изменён",
      code: "# Напиши функцию best_player(records)"
    }
  ]
};

window.COURSE_SELFTEST["l1_tup_c5"] = {
  reference: "def count_pairs(pairs):\n    result = {}\n    for p in pairs:\n        result[p] = result.get(p, 0) + 1\n    return result\n\nprint(count_pairs([(1, 2), (1, 2), (2, 1)]))",
  wrong: [
    {
      name: "код не изменён",
      code: "# Напиши функцию count_pairs(pairs)"
    }
  ]
};

window.COURSE_SELFTEST["l1_tup_c6"] = {
  reference: "def closest_to_origin(points):\n    best = points[0]\n    best_d = best[0] ** 2 + best[1] ** 2\n    for x, y in points:\n        d = x * x + y * y\n        if d < best_d:\n            best = (x, y)\n            best_d = d\n    return best\n\nprint(closest_to_origin([(3, 4), (1, 1), (5, 0)]))",
  wrong: [
    {
      name: "код не изменён",
      code: "# Напиши функцию closest_to_origin(points)"
    }
  ]
};
