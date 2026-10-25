/**
 * Эталоны и некорректные решения для темы «Вложенные структуры данных» этапа 2
 * Хранятся отдельно от контента ученика.
 */

window.COURSE_SELFTEST = window.COURSE_SELFTEST || {};

window.COURSE_SELFTEST["l1_nest_f1"] = {
  reference: "def get_names(users):\n    result = []\n    for user in users:\n        result.append(user[\"name\"])\n    return result\n\nprint(get_names([{\"name\": \"Анна\", \"score\": 82}]))",
  wrong: [
    {
      name: "код не изменён",
      code: "def get_names(users):\n    result = []\n    for user in users:\n        result.append(users[\"name\"])\n    return result"
    }
  ]
};

window.COURSE_SELFTEST["l1_nest_c1"] = {
  reference: "def top_scorer(users):\n    if not users:\n        return None\n    best = users[0]\n    for user in users:\n        if user[\"score\"] > best[\"score\"]:\n            best = user\n    return best[\"name\"]\n\nprint(top_scorer([{\"name\": \"Анна\", \"score\": 82}, {\"name\": \"Вера\", \"score\": 91}]))",
  wrong: [
    {
      name: "код не изменён",
      code: "# Напиши функцию top_scorer(users) без max, min и sorted"
    }
  ]
};

window.COURSE_SELFTEST["l1_nest_c2"] = {
  reference: "def filter_by_tag(posts, tag):\n    titles = []\n    for post in posts:\n        if tag in post[\"tags\"]:\n            titles.append(post[\"title\"])\n    return titles\n\nprint(filter_by_tag([{\"title\": \"Гайд\", \"tags\": [\"python\"]}], \"python\"))",
  wrong: [
    {
      name: "код не изменён",
      code: "# Напиши функцию filter_by_tag(posts, tag)"
    }
  ]
};

window.COURSE_SELFTEST["l1_nest_c3"] = {
  reference: "def get_score(user):\n    return user[\"score\"]\n\ndef sort_names_by_score(users):\n    ranking = sorted(users, key=get_score, reverse=True)\n    names = []\n    for user in ranking:\n        names.append(user[\"name\"])\n    return names\n\nprint(sort_names_by_score([{\"name\": \"Анна\", \"score\": 82}, {\"name\": \"Вера\", \"score\": 91}]))",
  wrong: [
    {
      name: "код не изменён",
      code: "# Напиши функцию sort_names_by_score(users) через sorted"
    }
  ]
};

window.COURSE_SELFTEST["l1_nest_c4"] = {
  reference: "def group_names_by_city(people):\n    groups = {}\n    for person in people:\n        groups.setdefault(person[\"city\"], []).append(person[\"name\"])\n    return groups\n\nprint(group_names_by_city([{\"name\": \"Анна\", \"city\": \"Омск\"}]))",
  wrong: [
    {
      name: "код не изменён",
      code: "# Напиши функцию group_names_by_city(people)"
    }
  ]
};

window.COURSE_SELFTEST["l1_nest_c5"] = {
  reference: "def get_in(data, path, default):\n    current = data\n    for key in path:\n        if key not in current:\n            return default\n        current = current[key]\n    return current\n\nprint(get_in({\"db\": {\"port\": 5432}}, [\"db\", \"port\"], 0))",
  wrong: [
    {
      name: "код не изменён",
      code: "# Напиши функцию get_in(data, path, default)"
    }
  ]
};

window.COURSE_SELFTEST["l1_nest_f2"] = {
  reference: "def collect_by_length(words):\n    groups = {}\n    for w in words:\n        groups.setdefault(len(w), []).append(w)\n    return groups\n\nprint(collect_by_length([\"кот\", \"сом\", \"лиса\"]))",
  wrong: [
    {
      name: "код не изменён",
      code: "def collect_by_length(words):\n    groups = dict.fromkeys([len(w) for w in words], [])\n    for w in words:\n        groups[len(w)].append(w)\n    return groups"
    }
  ]
};

window.COURSE_SELFTEST["l1_nest_c6"] = {
  reference: "import copy\n\ndef merge_settings(defaults, overrides):\n    result = copy.deepcopy(defaults)\n    for section, options in overrides.items():\n        if section not in result:\n            result[section] = {}\n        for key, value in options.items():\n            result[section][key] = copy.deepcopy(value)\n    return result\n\nprint(merge_settings({\"db\": {\"port\": 5432}}, {\"db\": {\"port\": 6543}}))",
  wrong: [
    {
      name: "код не изменён",
      code: "# Напиши функцию merge_settings(defaults, overrides)\n# Не меняй defaults и overrides"
    }
  ]
};

window.COURSE_SELFTEST["l1_nest_c7"] = {
  reference: "def columns(records):\n    keys = []\n    for record in records:\n        for key in record:\n            if key not in keys:\n                keys.append(key)\n    result = {}\n    for key in keys:\n        result[key] = []\n        for record in records:\n            result[key].append(record.get(key))\n    return result\n\nprint(columns([{\"a\": 1}, {\"a\": 2, \"b\": 3}]))",
  wrong: [
    {
      name: "код не изменён",
      code: "# Напиши функцию columns(records)"
    }
  ]
};
