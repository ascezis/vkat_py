/**
 * Эталоны и некорректные решения для темы «Исключения» этапа 2
 * Хранятся отдельно от контента ученика.
 */

window.COURSE_SELFTEST = window.COURSE_SELFTEST || {};

window.COURSE_SELFTEST["l1_exc_f1"] = {
  reference: "def to_number(text):\n    try:\n        return int(text)\n    except ValueError:\n        return 0",
  wrong: [
    {
      name: "код не изменён",
      code: "def to_number(text):\n    try:\n        return int(text)\n    except ZeroDivisionError:\n        return 0"
    }
  ]
};

window.COURSE_SELFTEST["l1_exc_c1"] = {
  reference: "def safe_int(text, default=0):\n    try:\n        return int(text)\n    except ValueError:\n        return default",
  wrong: [
    {
      name: "без try",
      code: "def safe_int(text, default=0):\n    return int(text)"
    },
    {
      name: "использует isdigit",
      code: "def safe_int(text, default=0):\n    try:\n        if text.isdigit():\n            return int(text)\n        return default\n    except ValueError:\n        return default"
    }
  ]
};

window.COURSE_SELFTEST["l1_exc_c2"] = {
  reference: "def safe_divide(a, b):\n    try:\n        return a / b\n    except ZeroDivisionError:\n        return None",
  wrong: [
    {
      name: "без try",
      code: "def safe_divide(a, b):\n    if b == 0:\n        return None\n    return a / b"
    }
  ]
};

window.COURSE_SELFTEST["l1_exc_c3"] = {
  reference: "def read_value(data, key, index):\n    try:\n        return data[key][index]\n    except KeyError:\n        return 'нет ключа'\n    except IndexError:\n        return 'нет элемента'",
  wrong: [
    {
      name: "перепутаны сообщения",
      code: "def read_value(data, key, index):\n    try:\n        return data[key][index]\n    except KeyError:\n        return 'нет элемента'\n    except IndexError:\n        return 'нет ключа'"
    }
  ]
};

window.COURSE_SELFTEST["l1_exc_c4"] = {
  reference: "def sum_valid(items):\n    total = 0\n    for item in items:\n        try:\n            total += int(item)\n        except ValueError:\n            continue\n    return total",
  wrong: [
    {
      name: "без try",
      code: "def sum_valid(items):\n    total = 0\n    for item in items:\n        total += int(item)\n    return total"
    }
  ]
};

window.COURSE_SELFTEST["l1_exc_c5"] = {
  reference: "def validate_age(age):\n    if age < 0 or age > 150:\n        raise ValueError('Недопустимый возраст')\n    return age\n\ndef is_valid_age(age):\n    try:\n        validate_age(age)\n    except ValueError:\n        return False\n    return True",
  wrong: [
    {
      name: "без raise",
      code: "def validate_age(age):\n    return age\n\ndef is_valid_age(age):\n    try:\n        validate_age(age)\n    except ValueError:\n        return False\n    return True"
    }
  ]
};

window.COURSE_SELFTEST["l1_exc_f2"] = {
  reference: "def describe(data, key):\n    try:\n        return data[key]\n    except KeyError:\n        return 'нет ключа'\n    except Exception:\n        return 'ошибка'",
  wrong: [
    {
      name: "код не изменён",
      code: "def describe(data, key):\n    try:\n        return data[key]\n    except Exception:\n        return 'ошибка'\n    except KeyError:\n        return 'нет ключа'"
    }
  ]
};

window.COURSE_SELFTEST["l1_exc_c6"] = {
  reference: "def parse_log(text):\n    steps = ['start']\n    try:\n        int(text)\n    except ValueError:\n        steps.append('error')\n    else:\n        steps.append('ok')\n    finally:\n        steps.append('done')\n    return steps",
  wrong: [
    {
      name: "код не изменён",
      code: "# Напиши функцию parse_log(text) с блоками try / except / else / finally\n"
    }
  ]
};

window.COURSE_SELFTEST["l1_exc_c7"] = {
  reference: "def average_of_valid(text):\n    numbers = []\n    for part in text.split(','):\n        try:\n            numbers.append(int(part.strip()))\n        except ValueError:\n            continue\n    try:\n        return sum(numbers) / len(numbers)\n    except ZeroDivisionError:\n        return None",
  wrong: [
    {
      name: "код не изменён",
      code: "# Напиши функцию average_of_valid(text)\n"
    },
    {
      name: "запрещённый isdigit",
      code: "def average_of_valid(text):\n    numbers = []\n    for part in text.split(','):\n        part = part.strip()\n        if part.isdigit():\n            numbers.append(int(part))\n    if not numbers:\n        return None\n    return sum(numbers) / len(numbers)"
    }
  ]
};
