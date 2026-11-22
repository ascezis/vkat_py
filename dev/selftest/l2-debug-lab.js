/**
 * Эталоны и некорректные решения для темы «Лаборатория отладки» этапа «Практикум».
 * Для fix-задач wrong[0] — код «как был»: баг должен проявляться и решение отклоняться.
 * Хранятся отдельно от контента ученика.
 */

window.COURSE_SELFTEST = window.COURSE_SELFTEST || {};

window.COURSE_SELFTEST["l2_dbg_c1"] = {
  reference: `def safe_get(settings, key, default):
    if key in settings:
        return settings[key]
    return default

print(safe_get({'lang': 'ru'}, 'lang', 'en'))
print(safe_get({}, 'theme', 'dark'))
print(safe_get({'flag': 0}, 'flag', 1))`,
  wrong: [
    {
      name: "проверка через правдивость значения (теряет 0)",
      code: `def safe_get(settings, key, default):
    if settings.get(key):
        return settings[key]
    return default

print(safe_get({'flag': 0}, 'flag', 1))`
    },
    {
      name: "чтение вслепую без защиты",
      code: `def safe_get(settings, key, default):
    return settings[key]

print(safe_get({}, 'theme', 'dark'))`
    }
  ]
};

window.COURSE_SELFTEST["l2_dbg_c2"] = {
  reference: `def divide(a, b):
    if b == 0:
        return None
    return a / b

print(divide(9, 3))
print(divide(5, 0))`,
  wrong: [
    {
      name: "наивное деление без защиты",
      code: `def divide(a, b):
    return a / b

print(divide(5, 0))`
    },
    {
      name: "возвращает 0 вместо None",
      code: `def divide(a, b):
    try:
        return a / b
    except ZeroDivisionError:
        return 0

print(divide(5, 0))`
    }
  ]
};

window.COURSE_SELFTEST["l2_dbg_f1"] = {
  reference: `def scan(rows, target):
    i = 0
    found = -1
    while i < len(rows):
        if rows[i] == target:
            found = i
            break
        i += 1
    return found

print(scan(['INFO', 'WARN', 'FATAL'], 'WARN'))
print(scan([], 'WARN'))`,
  wrong: [
    {
      name: "код не изменён (IndexError)",
      code: `def scan(rows, target):
    i = 0
    found = -1
    while i <= len(rows):
        if rows[i] == target:
            found = i
            break
        i += 1
    return found

print(scan(['INFO'], 'WARN'))`
    },
    {
      name: "обход начинается с 1 (теряет первый элемент)",
      code: `def scan(rows, target):
    i = 1
    found = -1
    while i < len(rows):
        if rows[i] == target:
            found = i
            break
        i += 1
    return found

print(scan(['WARN'], 'WARN'))`
    }
  ]
};

window.COURSE_SELFTEST["l2_dbg_f2"] = {
  reference: `def endpoint(cfg):
    services = {
        'auth': '10.0.0.1',
        'billing': '10.0.0.2',
        'notify': '10.0.0.3'
    }
    return services[cfg]

print(endpoint('notify'))`,
  wrong: [
    {
      name: "код не изменён (KeyError)",
      code: `def endpoint(cfg):
    services = {
        'auth': '10.0.0.1',
        'billing': '10.0.0.2',
        'notyfy': '10.0.0.3'
    }
    return services[cfg]

print(endpoint('notify'))`
    },
    {
      name: "заглушил KeyError через .get с неверной заглушкой",
      code: `def endpoint(cfg):
    services = {
        'auth': '10.0.0.1',
        'billing': '10.0.0.2',
        'notyfy': '10.0.0.3'
    }
    return services.get(cfg, '10.0.0.9')

print(endpoint('notify'))`
    }
  ]
};

window.COURSE_SELFTEST["l2_dbg_f3"] = {
  reference: `first = int(input())
second = int(input())
total = first + second
print(total)`,
  wrong: [
    {
      name: "код не изменён (склейка строк)",
      code: `first = input()
second = input()
total = first + second
print(total)`
    },
    {
      name: "int после склейки",
      code: `first = input()
second = input()
total = int(first + second)
print(total)`
    }
  ]
};

window.COURSE_SELFTEST["l2_dbg_f4"] = {
  reference: `def bonus(score):
    if score >= 85:
        return 100
    elif score >= 60:
        return 50
    else:
        points = 10
        return points

print(bonus(30))
print(bonus(92))`,
  wrong: [
    {
      name: "код не изменён (None в нижней ветке)",
      code: `def bonus(score):
    if score >= 85:
        return 100
    elif score >= 60:
        return 50
    else:
        points = 10

print(bonus(30))`
    },
    {
      name: "возвращает 0 вместо 10",
      code: `def bonus(score):
    if score >= 85:
        return 100
    elif score >= 60:
        return 50
    else:
        return 0

print(bonus(30))`
    }
  ]
};

window.COURSE_SELFTEST["l2_dbg_f5"] = {
  reference: `def clean(rows):
    result = []
    for row in rows:
        if not row.startswith("DEBUG"):
            result.append(row)
    return result

print(clean(['DEBUG x', 'DEBUG y', 'INFO z']))
print(clean(['INFO a', 'DEBUG b', 'INFO c', 'DEBUG d']))`,
  wrong: [
    {
      name: "код не изменён (пропуск соседних элементов)",
      code: `def clean(rows):
    for row in rows:
        if row.startswith("DEBUG"):
            rows.remove(row)
    return rows

print(clean(['DEBUG x', 'DEBUG y', 'INFO z']))`
    },
    {
      name: "инвертированное условие (оставил DEBUG)",
      code: `def clean(rows):
    result = []
    for row in rows:
        if row.startswith("DEBUG"):
            result.append(row)
    return result

print(clean(['DEBUG x', 'INFO z']))`
    }
  ]
};

window.COURSE_SELFTEST["l2_dbg_f6"] = {
  reference: `def signature(name, role):
    return name + " — " + role

print(signature("Иван Петров", "инженер"))`,
  wrong: [
    {
      name: "код не изменён (перевёрнутая подпись)",
      code: `def signature(name, role):
    return role + " — " + name

print(signature("Иван Петров", "инженер"))`
    },
    {
      name: "потерял тире в шаблоне",
      code: `def signature(name, role):
    return name + " " + role

print(signature("Иван Петров", "инженер"))`
    }
  ]
};

window.COURSE_SELFTEST["l2_dbg_f7"] = {
  reference: `def max_window(nums, k):
    best = sum(nums[:k])
    for i in range(len(nums) - k + 1):
        window = nums[i:i + k]
        best = max(best, sum(window))
    return best

print(max_window([1, 2, 3, 4], 2))`,
  wrong: [
    {
      name: "код не изменён (последнее окно теряется)",
      code: `def max_window(nums, k):
    best = sum(nums[:k])
    for i in range(len(nums) - k):
        window = nums[i:i + k]
        best = max(best, sum(window))
    return best

print(max_window([1, 2, 3, 4], 2))`
    },
    {
      name: "best = 0 вместо первого окна (ломается на отрицательных)",
      code: `def max_window(nums, k):
    best = 0
    for i in range(len(nums) - k + 1):
        window = nums[i:i + k]
        best = max(best, sum(window))
    return best

print(max_window([1, -2, 3], 2))`
    }
  ]
};

window.COURSE_SELFTEST["l2_dbg_f8"] = {
  reference: `def coldest(temps):
    minimum = temps[0]
    for t in temps:
        if t < minimum:
            minimum = t
    return minimum

print(coldest([-15, -3, -8]))
print(coldest([4, 2, 7]))`,
  wrong: [
    {
      name: "код не изменён (нуль не пробивается)",
      code: `def coldest(temps):
    minimum = 0
    for t in temps:
        if t < minimum:
            minimum = t
    return minimum

print(coldest([-15, -3, -8]))`
    },
    {
      name: "инвертированное сравнение (вернул максимум)",
      code: `def coldest(temps):
    minimum = temps[0]
    for t in temps:
        if t > minimum:
            minimum = t
    return minimum

print(coldest([4, 2, 7]))`
    },
    {
      name: "подмена цикла встроенным min() (запрещено заданием)",
      code: `def coldest(temps):
    return min(temps)

print(coldest([-15, -3, -8]))`
    }
  ]
};

window.COURSE_SELFTEST["l2_dbg_c9"] = {
  reference: `def avg_passing(scores):
    passing = []
    for s in scores:
        if s >= 60:
            passing.append(s)
    if not passing:
        return 0
    return sum(passing) / len(passing)

print(avg_passing([90, 40, 70]))
print(avg_passing([50, 40]))
print(avg_passing([]))`,
  wrong: [
    {
      name: "код не изменён (NameError)",
      code: `def avg_passing(scores):
    passing = []
    for s in scores:
        if s >= 60:
            passing.append(s)
    total = total + sum(passing)
    return total / len(passing)

print(avg_passing([90, 40, 70]))`
    },
    {
      name: "чинит только NameError (ZeroDivisionError остаётся)",
      code: `def avg_passing(scores):
    passing = []
    for s in scores:
        if s >= 60:
            passing.append(s)
    total = sum(passing)
    return total / len(passing)

print(avg_passing([50, 40]))`
    },
    {
      name: "пустой список возвращает None",
      code: `def avg_passing(scores):
    passing = []
    for s in scores:
        if s >= 60:
            passing.append(s)
    if not passing:
        return None
    return sum(passing) / len(passing)

print(avg_passing([]))`
    }
  ]
};

window.COURSE_SELFTEST["l2_dbg_c10"] = {
  reference: `def merge_sorted(a, b):
    result = []
    i = j = 0
    while i < len(a) and j < len(b):
        if a[i] <= b[j]:
            result.append(a[i])
            i += 1
        else:
            result.append(b[j])
            j += 1
    result.extend(a[i:])
    result.extend(b[j:])
    return result

print(merge_sorted([1, 3, 5], [2, 4, 6]))
print(merge_sorted([1, 10, 11], [2]))`,
  wrong: [
    {
      name: "код не изменён (хвост потерян)",
      code: `def merge_sorted(a, b):
    result = []
    i = j = 0
    while i < len(a) and j < len(b):
        if a[i] <= b[j]:
            result.append(a[i])
            i += 1
        else:
            result.append(b[j])
            j += 1
    return result

print(merge_sorted([1, 10, 11], [2]))`
    },
    {
      name: "дописывает обработанные элементы вместо остатков",
      code: `def merge_sorted(a, b):
    result = []
    i = j = 0
    while i < len(a) and j < len(b):
        if a[i] <= b[j]:
            result.append(a[i])
            i += 1
        else:
            result.append(b[j])
            j += 1
    result.extend(a[:i])
    result.extend(b[:j])
    return result

print(merge_sorted([1, 10, 11], [2]))`
    }
  ]
};
