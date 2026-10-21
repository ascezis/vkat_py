/**
 * Эталоны и некорректные решения для темы «Словари» этапа 2
 * Хранятся отдельно от контента ученика.
 */

window.COURSE_SELFTEST = window.COURSE_SELFTEST || {};

window.COURSE_SELFTEST["l1_dict_c1"] = {
  reference: `def get_price(prices, name):
    return prices.get(name, 0)

menu = {"чай": 100, "кофе": 150}
print(get_price(menu, "чай"))
print(get_price(menu, "сок"))`,
  wrong: [
    {
      name: "квадратные скобки без get (падение на отсутствующем ключе)",
      code: `def get_price(prices, name):
    return prices[name]`
    },
    {
      name: "print вместо return",
      code: `def get_price(prices, name):
    print(prices.get(name, 0))`
    }
  ]
};

window.COURSE_SELFTEST["l1_dict_f1"] = {
  reference: `def add_item(stock, name, count):
    stock[name] = stock.get(name, 0) + count
    return stock[name]

stock = {"яблоки": 5}
print(add_item(stock, "яблоки", 2))
print(add_item(stock, "груши", 3))`,
  wrong: [
    {
      name: "код не изменён (KeyError на втором вызове)",
      code: `def add_item(stock, name, count):
    stock[name] += count
    return stock[name]

stock = {"яблоки": 5}
print(add_item(stock, "яблоки", 2))
print(add_item(stock, "груши", 3))`
    },
    {
      name: "не возвращает новое значение",
      code: `def add_item(stock, name, count):
    stock[name] = stock.get(name, 0) + count

stock = {"яблоки": 5}
print(add_item(stock, "яблоки", 2))
print(add_item(stock, "груши", 3))`
    }
  ]
};

window.COURSE_SELFTEST["l1_dict_c2"] = {
  reference: `def count_chars(text):
    result = {}
    for ch in text:
        result[ch] = result.get(ch, 0) + 1
    return result

print(count_chars("abca"))`,
  wrong: [
    {
      name: "использует Counter (запрещено AST)",
      code: `def count_chars(text):
    return dict(Counter(text))`
    },
    {
      name: "всегда записывает 1 вместо инкремента",
      code: `def count_chars(text):
    result = {}
    for ch in text:
        result[ch] = 1
    return result`
    }
  ]
};

window.COURSE_SELFTEST["l1_dict_c3"] = {
  reference: `def total_price(prices, cart):
    total = 0
    for name, qty in cart.items():
        total += prices[name] * qty
    return total

print(total_price({"чай": 100, "кофе": 150}, {"чай": 2, "кофе": 1}))`,
  wrong: [
    {
      name: "без умножения на количество",
      code: `def total_price(prices, cart):
    total = 0
    for name in cart:
        total += prices[name]
    return total`
    },
    {
      name: "print вместо return",
      code: `def total_price(prices, cart):
    total = 0
    for name, qty in cart.items():
        total += prices[name] * qty
    print(total)`
    }
  ]
};

window.COURSE_SELFTEST["l1_dict_c4"] = {
  reference: `def group_by_length(words):
    result = {}
    for word in words:
        n = len(word)
        if n not in result:
            result[n] = []
        result[n].append(word)
    return result

print(group_by_length(["a", "bb", "c"]))`,
  wrong: [
    {
      name: "перезаписывает список вместо append",
      code: `def group_by_length(words):
    result = {}
    for word in words:
        result[len(word)] = [word]
    return result`
    },
    {
      name: "возвращает число слов вместо словаря",
      code: `def group_by_length(words):
    return len(words)`
    }
  ]
};
