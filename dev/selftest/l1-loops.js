/**
 * Эталоны и некорректные решения для темы «Циклы (продолжение)» этапа 2
 * Хранятся отдельно от контента ученика.
 */

window.COURSE_SELFTEST = window.COURSE_SELFTEST || {};

window.COURSE_SELFTEST["l1_loop_f1"] = {
  reference: "def is_prime(n):\n    if n < 2:\n        return False\n    for d in range(2, n):\n        if n % d == 0:\n            return False\n    return True\n\nprint(is_prime(7), is_prime(9))",
  wrong: [
    {
      name: "код не изменён",
      code: "def is_prime(n):\n    if n < 2:\n        return False\n    for d in range(2, n):\n        if n % d == 0:\n            return False\n        else:\n            return True"
    }
  ]
};

window.COURSE_SELFTEST["l1_loop_c1"] = {
  reference: "def digit_sum(n):\n    total = 0\n    while n > 0:\n        total += n % 10\n        n //= 10\n    return total\n\nprint(digit_sum(1234))",
  wrong: [
    {
      name: "код не изменён",
      code: "# Напиши функцию digit_sum(n) без преобразования в строку"
    }
  ]
};

window.COURSE_SELFTEST["l1_loop_c2"] = {
  reference: "def collatz_steps(n):\n    steps = 0\n    while n != 1:\n        if n % 2 == 0:\n            n = n // 2\n        else:\n            n = 3 * n + 1\n        steps += 1\n    return steps\n\nprint(collatz_steps(6))",
  wrong: [
    {
      name: "код не изменён",
      code: "# Напиши функцию collatz_steps(n)"
    }
  ]
};

window.COURSE_SELFTEST["l1_loop_c3"] = {
  reference: "def pair_sum(nums, target):\n    for i in range(len(nums)):\n        for j in range(i + 1, len(nums)):\n            if nums[i] + nums[j] == target:\n                return i, j\n    return None\n\nprint(pair_sum([2, 7, 11, 15], 9))",
  wrong: [
    {
      name: "код не изменён",
      code: "# Напиши функцию pair_sum(nums, target)"
    }
  ]
};

window.COURSE_SELFTEST["l1_loop_c4"] = {
  reference: "def primes_up_to(n):\n    result = []\n    for k in range(2, n + 1):\n        for d in range(2, k):\n            if k % d == 0:\n                break\n        else:\n            result.append(k)\n    return result\n\nprint(primes_up_to(20))",
  wrong: [
    {
      name: "код не изменён",
      code: "# Напиши функцию primes_up_to(n)"
    }
  ]
};

window.COURSE_SELFTEST["l1_loop_c5"] = {
  reference: "for i in range(1, 6):\n    for _ in range(i):\n        print(i, end=\"\")\n    print()",
  wrong: [
    {
      name: "код не изменён",
      code: "# Выведи лесенку из цифр высотой 5"
    }
  ]
};

window.COURSE_SELFTEST["l1_loop_f2"] = {
  reference: "def count_until_zero(nums):\n    count = 0\n    for x in nums:\n        if x == 0:\n            break\n        count += 1\n    return count\n\nprint(count_until_zero([3, 5, 0, 7, 8]))",
  wrong: [
    {
      name: "код не изменён",
      code: "def count_until_zero(nums):\n    count = 0\n    for x in nums:\n        if x == 0:\n            continue\n        count += 1\n    return count"
    }
  ]
};

window.COURSE_SELFTEST["l1_loop_c6"] = {
  reference: "def longest_streak(nums):\n    best = 0\n    current = 0\n    for i in range(len(nums)):\n        if i > 0 and nums[i] == nums[i - 1]:\n            current += 1\n        else:\n            current = 1\n        best = max(best, current)\n    return best\n\nprint(longest_streak([1, 1, 2, 2, 2, 3]))",
  wrong: [
    {
      name: "код не изменён",
      code: "# Напиши функцию longest_streak(nums)"
    }
  ]
};

window.COURSE_SELFTEST["l1_loop_c7"] = {
  reference: "def to_binary(n):\n    if n == 0:\n        return \"0\"\n    result = \"\"\n    while n > 0:\n        result = str(n % 2) + result\n        n //= 2\n    return result\n\nprint(to_binary(10))",
  wrong: [
    {
      name: "код не изменён",
      code: "# Напиши функцию to_binary(n) без bin() и format()"
    }
  ]
};
