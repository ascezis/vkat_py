/**
 * Эталоны и некорректные решения для темы «Алгоритмы» этапа «Практикум».
 * Хранятся отдельно от контента ученика.
 */

window.COURSE_SELFTEST = window.COURSE_SELFTEST || {};

window.COURSE_SELFTEST["l2_alg_c1"] = {
  reference: `def find_first(nums, x):
    for i in range(len(nums)):
        if nums[i] == x:
            return i
    return -1

print(find_first([1, 2, 3], 2))`,
  wrong: [
    {
      name: "использует метод .index()",
      code: `def find_first(nums, x):
    try:
        return nums.index(x)
    except ValueError:
        return -1

print(find_first([1, 2, 3], 2))`
    },
    {
      name: "возвращает 0 вместо -1",
      code: `def find_first(nums, x):
    for i in range(len(nums)):
        if nums[i] == x:
            return i
    return 0

print(find_first([1, 2, 3], 2))`
    }
  ]
};

window.COURSE_SELFTEST["l2_alg_c2"] = {
  reference: `def count_greater(nums, limit):
    count = 0
    for n in nums:
        if n > limit:
            count += 1
    return count

print(count_greater([1, 5, 8], 4))`,
  wrong: [
    {
      name: "сравнивает нестрого (>=)",
      code: `def count_greater(nums, limit):
    count = 0
    for n in nums:
        if n >= limit:
            count += 1
    return count

print(count_greater([1, 5, 8], 4))`
    },
    {
      name: "теряет последний элемент",
      code: `def count_greater(nums, limit):
    count = 0
    for n in nums[:-1]:
        if n > limit:
            count += 1
    return count

print(count_greater([1, 5, 8], 4))`
    }
  ]
};

window.COURSE_SELFTEST["l2_alg_c3"] = {
  reference: `def running_total(nums):
    result = []
    total = 0
    for n in nums:
        total += n
        result.append(total)
    return result

print(running_total([1, 2, 3]))`,
  wrong: [
    {
      name: "возвращает только итоговую сумму",
      code: `def running_total(nums):
    return [sum(nums)]

print(running_total([1, 2, 3]))`
    },
    {
      name: "добавляет элемент, а не накопленную сумму",
      code: `def running_total(nums):
    result = []
    total = 0
    for n in nums:
        total += n
        result.append(n)
    return result

print(running_total([1, 2, 3]))`
    }
  ]
};

window.COURSE_SELFTEST["l2_alg_c4"] = {
  reference: `def merge_sorted(a, b):
    result = []
    i = 0
    j = 0
    while i < len(a) and j < len(b):
        if a[i] <= b[j]:
            result.append(a[i])
            i += 1
        else:
            result.append(b[j])
            j += 1
    while i < len(a):
        result.append(a[i])
        i += 1
    while j < len(b):
        result.append(b[j])
        j += 1
    return result

print(merge_sorted([1, 3, 5], [2, 4]))`,
  wrong: [
    {
      name: "использует sorted()",
      code: `def merge_sorted(a, b):
    return sorted(a + b)

print(merge_sorted([1, 3, 5], [2, 4]))`
    },
    {
      name: "забыл дописать хвосты списков",
      code: `def merge_sorted(a, b):
    result = []
    i = 0
    j = 0
    while i < len(a) and j < len(b):
        if a[i] <= b[j]:
            result.append(a[i])
            i += 1
        else:
            result.append(b[j])
            j += 1
    return result

print(merge_sorted([1, 3, 5], [2, 4]))`
    }
  ]
};

window.COURSE_SELFTEST["l2_alg_c5"] = {
  reference: `def chunk(nums, k):
    result = []
    for i in range(0, len(nums), k):
        result.append(nums[i:i + k])
    return result

print(chunk([1, 2, 3, 4], 2))`,
  wrong: [
    {
      name: "кусочки на один элемент короче",
      code: `def chunk(nums, k):
    result = []
    for i in range(0, len(nums), k):
        result.append(nums[i:i + k - 1])
    return result

print(chunk([1, 2, 3, 4], 2))`
    },
    {
      name: "перекрывающиеся окна вместо кусков",
      code: `def chunk(nums, k):
    result = []
    for i in range(len(nums)):
        result.append(nums[i:i + k])
    return result

print(chunk([1, 2, 3, 4], 2))`
    }
  ]
};

window.COURSE_SELFTEST["l2_alg_c6"] = {
  reference: `def sliding_max(nums, k):
    result = []
    for i in range(len(nums) - k + 1):
        best = nums[i]
        for j in range(i, i + k):
            if nums[j] > best:
                best = nums[j]
        result.append(best)
    return result

print(sliding_max([2, 1, 3, 5, 4], 2))`,
  wrong: [
    {
      name: "теряет последнее окно",
      code: `def sliding_max(nums, k):
    result = []
    for i in range(len(nums) - k):
        best = nums[i]
        for j in range(i, i + k):
            if nums[j] > best:
                best = nums[j]
        result.append(best)
    return result

print(sliding_max([2, 1, 3, 5, 4], 2))`
    },
    {
      name: "возвращает начало окна вместо максимума",
      code: `def sliding_max(nums, k):
    result = []
    for i in range(len(nums) - k + 1):
        result.append(nums[i])
    return result

print(sliding_max([2, 1, 3, 5, 4], 2))`
    }
  ]
};

window.COURSE_SELFTEST["l2_alg_f1"] = {
  reference: `def find_last(nums, x):
    position = -1
    for i in range(len(nums)):
        if nums[i] == x:
            position = i
    return position

print(find_last([1, 2, 1], 1))`,
  wrong: [
    {
      name: "код не изменён (IndexError)",
      code: `def find_last(nums, x):
    position = -1
    for i in range(len(nums) + 1):
        if nums[i] == x:
            position = i
    return position

print(find_last([1, 2, 1], 1))`
    },
    {
      name: "перестарался с границей (-1)",
      code: `def find_last(nums, x):
    position = -1
    for i in range(len(nums) - 1):
        if nums[i] == x:
            position = i
    return position

print(find_last([1, 2, 1], 1))`
    }
  ]
};

window.COURSE_SELFTEST["l2_alg_f2"] = {
  reference: `def keep_positive(nums):
    result = []
    for n in nums:
        if n > 0:
            result.append(n)
    return result

print(keep_positive([3, -1, 2]))`,
  wrong: [
    {
      name: "код не изменён (портит вход)",
      code: `def keep_positive(nums):
    for n in nums:
        if n <= 0:
            nums.remove(n)
    return nums

print(keep_positive([3, -1, 2]))`
    },
    {
      name: "дополнительно сортирует результат",
      code: `def keep_positive(nums):
    result = []
    for n in nums:
        if n > 0:
            result.append(n)
    return sorted(result)

print(keep_positive([3, -1, 2]))`
    }
  ]
};

window.COURSE_SELFTEST["l2_alg_c7"] = {
  reference: `def is_sorted(nums):
    for i in range(len(nums) - 1):
        if nums[i] > nums[i + 1]:
            return False
    return True

print(is_sorted([1, 2, 3]))`,
  wrong: [
    {
      name: "использует sorted()",
      code: `def is_sorted(nums):
    return nums == sorted(nums)

print(is_sorted([1, 2, 3]))`
    },
    {
      name: "отвергает списки с повторами",
      code: `def is_sorted(nums):
    for i in range(len(nums) - 1):
        if nums[i] >= nums[i + 1]:
            return False
    return True

print(is_sorted([1, 2, 3]))`
    }
  ]
};

window.COURSE_SELFTEST["l2_alg_c8"] = {
  reference: `def remove_all(nums, x):
    result = []
    for n in nums:
        if n != x:
            result.append(n)
    return result

print(remove_all([1, 2, 1, 3], 1))`,
  wrong: [
    {
      name: "перепутано условие (оставляет x)",
      code: `def remove_all(nums, x):
    result = []
    for n in nums:
        if n == x:
            result.append(n)
    return result

print(remove_all([1, 2, 1, 3], 1))`
    },
    {
      name: "удаляет только первое вхождение",
      code: `def remove_all(nums, x):
    if x in nums:
        nums.remove(x)
    return nums

print(remove_all([1, 2, 1, 3], 1))`
    }
  ]
};

window.COURSE_SELFTEST["l2_alg_c9"] = {
  reference: `def binary_search(a, x):
    low = 0
    high = len(a) - 1
    while low <= high:
        mid = (low + high) // 2
        if a[mid] == x:
            return mid
        if a[mid] < x:
            low = mid + 1
        else:
            high = mid - 1
    return -1

print(binary_search([1, 3, 5, 7, 9], 5))`,
  wrong: [
    {
      name: "использует метод .index()",
      code: `def binary_search(a, x):
    try:
        return a.index(x)
    except ValueError:
        return -1

print(binary_search([1, 3, 5, 7, 9], 5))`
    },
    {
      name: "перепутаны направления сдвига границ",
      code: `def binary_search(a, x):
    low = 0
    high = len(a) - 1
    while low <= high:
        mid = (low + high) // 2
        if a[mid] == x:
            return mid
        if a[mid] < x:
            high = mid - 1
        else:
            low = mid + 1
    return -1

print(binary_search([1, 3, 5, 7, 9], 5))`
    }
  ]
};

window.COURSE_SELFTEST["l2_alg_c10"] = {
  reference: `def pairs_with_sum(nums, s):
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] + nums[j] == s:
                return True
    return False

print(pairs_with_sum([1, 2, 3], 4))`,
  wrong: [
    {
      name: "использует один элемент дважды",
      code: `def pairs_with_sum(nums, s):
    for i in range(len(nums)):
        for j in range(len(nums)):
            if nums[i] + nums[j] == s:
                return True
    return False

print(pairs_with_sum([1, 2, 3], 4))`
    },
    {
      name: "перепутаны True и False",
      code: `def pairs_with_sum(nums, s):
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] + nums[j] == s:
                return False
    return True

print(pairs_with_sum([1, 2, 3], 4))`
    }
  ]
};
