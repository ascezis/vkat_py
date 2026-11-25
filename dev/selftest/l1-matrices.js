window.COURSE_SELFTEST = window.COURSE_SELFTEST || {};
Object.assign(window.COURSE_SELFTEST, {
  "l1_mat_column": {
    "reference": "def column(a, j):\n    return [row[j] for row in a]",
    "wrong": [
      {
        "name": "Ошибка в алгоритме",
        "code": "def column(a, j):\n    return a[j]"
      }
    ]
  },
  "l1_mat_totals": {
    "reference": "def totals(a):\n    return [sum(row) for row in a]",
    "wrong": [
      {
        "name": "Ошибка в алгоритме",
        "code": "def totals(a):\n    return [sum(sum(row) for row in a)]"
      }
    ]
  },
  "l1_mat_grid": {
    "reference": "def mark(h, w, r, c):\n    a = [[0] * w for _ in range(h)]\n    a[r][c] = 1\n    return a",
    "wrong": [
      {
        "name": "Ошибка в алгоритме",
        "code": "def mark(h, w, r, c):\n    a = [[0] * w] * h\n    a[r][c] = 1\n    return a"
      }
    ]
  },
  "l1_mat_transpose": {
    "reference": "def transpose(a):\n    if not a:\n        return []\n    return [[row[j] for row in a] for j in range(len(a[0]))]",
    "wrong": [
      {
        "name": "Ошибка в алгоритме",
        "code": "def transpose(a):\n    return a"
      }
    ]
  }
});
