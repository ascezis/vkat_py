/**
 * Эталоны и некорректные решения для темы «Строки» этапа 2
 * Хранятся отдельно от контента ученика.
 */

window.COURSE_SELFTEST = window.COURSE_SELFTEST || {};

window.COURSE_SELFTEST["l1_str_c1"] = {
  reference: "def clean_name(text):\n    return text.strip().capitalize()\n\nprint(clean_name(\"  аНЯ  \"))",
  wrong: [
    {
      name: "код не изменён",
      code: "# Напиши функцию clean_name(text)"
    }
  ]
};

window.COURSE_SELFTEST["l1_str_c2"] = {
  reference: "def is_palindrome(text):\n    t = text.lower()\n    return t == t[::-1]\n\nprint(is_palindrome(\"Level\"))\nprint(is_palindrome(\"abc\"))",
  wrong: [
    {
      name: "код не изменён",
      code: "# Напиши функцию is_palindrome(text)"
    }
  ]
};

window.COURSE_SELFTEST["l1_str_c3"] = {
  reference: "def mask_card(number):\n    return \"****\" + number[-4:]\n\nprint(mask_card(\"1234567890123456\"))",
  wrong: [
    {
      name: "код не изменён",
      code: "# Напиши функцию mask_card(number)"
    }
  ]
};

window.COURSE_SELFTEST["l1_str_c4"] = {
  reference: "def normalize_spaces(text):\n    return \" \".join(text.split())\n\nprint(normalize_spaces(\"  привет   мир \"))",
  wrong: [
    {
      name: "код не изменён",
      code: "# Напиши функцию normalize_spaces(text)"
    }
  ]
};

window.COURSE_SELFTEST["l1_str_c5"] = {
  reference: "def initials(full_name):\n    result = \"\"\n    for word in full_name.split():\n        result += word[0].upper() + \".\"\n    return result\n\nprint(initials(\"Иван Петров\"))",
  wrong: [
    {
      name: "код не изменён",
      code: "# Напиши функцию initials(full_name)"
    }
  ]
};

window.COURSE_SELFTEST["l1_str_c6"] = {
  reference: "def format_price(name, price):\n    return f\"{name}: {price:.2f} руб.\"\n\nprint(format_price(\"Чай\", 100.5))",
  wrong: [
    {
      name: "код не изменён",
      code: "# Напиши функцию format_price(name, price)"
    }
  ]
};

window.COURSE_SELFTEST["l1_str_f1"] = {
  reference: "def describe(name, age):\n    return f\"{name} - {age} лет\"\n\nprint(describe(\"Аня\", 17))",
  wrong: [
    {
      name: "код не изменён",
      code: "def describe(name, age):\n    return name + \" - \" + age + \" лет\"\n\nprint(describe(\"Аня\", 17))"
    }
  ]
};

window.COURSE_SELFTEST["l1_str_c7"] = {
  reference: "def compress(text):\n    if text == \"\":\n        return \"\"\n    result = \"\"\n    current = text[0]\n    count = 1\n    for ch in text[1:]:\n        if ch == current:\n            count += 1\n        else:\n            result += current + str(count)\n            current = ch\n            count = 1\n    result += current + str(count)\n    return result\n\nprint(compress(\"aaabbc\"))",
  wrong: [
    {
      name: "код не изменён",
      code: "# Напиши функцию compress(text)"
    }
  ]
};

window.COURSE_SELFTEST["l1_str_c8"] = {
  reference: "def is_anagram(a, b):\n    return sorted(a.lower()) == sorted(b.lower())\n\nprint(is_anagram(\"Лес\", \"сел\"))",
  wrong: [
    {
      name: "код не изменён",
      code: "# Напиши функцию is_anagram(a, b)"
    }
  ]
};
