/**
 * вкат.py — Справочник / бойлерплейты
 * Контекстная панель справа: показывает шаблоны для текущей темы.
 * Кнопка «вставить»: если редактор пуст — вставляет шаблон; иначе — копирует в буфер.
 */

(function (window) {
  'use strict';

  // ============================================================
  // ДАННЫЕ СПРАВОЧНИКА (по индексу темы)
  // ============================================================

  const REFERENCE_DATA = [

    // Тема 0: Переменные и вывод
    {
      label: 'переменные и вывод',
      sections: [
        {
          heading: 'переменная',
          items: [
            {
              title: 'строка',
              desc: 'текстовое значение',
              code: 'name = "Анна"\nprint(name)'
            },
            {
              title: 'число',
              desc: 'целое и дробное',
              code: 'age = 17\nheight = 1.72\nprint(age, height)'
            },
            {
              title: 'f-строка',
              desc: 'подставляет переменную в текст',
              code: 'name = "Анна"\nage = 17\nprint(f"Меня зовут {name}, мне {age} лет")'
            }
          ]
        },
        {
          heading: 'тип данных',
          items: [
            {
              title: 'type()',
              desc: 'узнать тип значения',
              code: 'x = 42\nprint(type(x))   # <class \'int\'>\ny = "текст"\nprint(type(y))   # <class \'str\'>'
            },
            {
              title: 'преобразование типов',
              desc: 'int / float / str',
              code: 'n = int("5")\nf = float("3.14")\ns = str(100)\nprint(n, f, s)'
            }
          ]
        }
      ]
    },

    // Тема 1: Условия
    {
      label: 'условия',
      sections: [
        {
          heading: 'if / elif / else',
          items: [
            {
              title: 'базовая структура',
              desc: 'ветвление по условию',
              code: 'score = 75\n\nif score >= 90:\n    print("отлично")\nelif score >= 60:\n    print("хорошо")\nelse:\n    print("нужно повторить")'
            },
            {
              title: 'вложенное условие',
              desc: 'if внутри if',
              code: 'age = 18\nhas_ticket = True\n\nif age >= 18:\n    if has_ticket:\n        print("проходи")\n    else:\n        print("нет билета")\nelse:\n    print("не подходишь по возрасту")'
            }
          ]
        },
        {
          heading: 'операторы сравнения',
          items: [
            {
              title: 'все операторы',
              desc: '==  !=  >  <  >=  <=',
              code: 'a = 10\nb = 20\n\nprint(a == b)   # False\nprint(a != b)   # True\nprint(a < b)    # True\nprint(a >= 10)  # True'
            },
            {
              title: 'and / or / not',
              desc: 'логические операторы',
              code: 'x = 15\n\nif x > 10 and x < 20:\n    print("в диапазоне")\n\nif x < 5 or x > 10:\n    print("за пределами")\n\nif not x == 0:\n    print("не ноль")'
            }
          ]
        }
      ]
    },

    // Тема 2: Циклы
    {
      label: 'циклы',
      sections: [
        {
          heading: 'for',
          items: [
            {
              title: 'for + range()',
              desc: 'повторить N раз',
              code: 'for i in range(5):\n    print(i)   # 0 1 2 3 4'
            },
            {
              title: 'range с шагом',
              desc: 'range(start, stop, step)',
              code: 'for i in range(0, 10, 2):\n    print(i)   # 0 2 4 6 8'
            },
            {
              title: 'for по списку',
              desc: 'перебрать элементы',
              code: 'fruits = ["яблоко", "банан", "вишня"]\n\nfor fruit in fruits:\n    print(fruit)'
            },
            {
              title: 'enumerate',
              desc: 'индекс + элемент',
              code: 'items = ["a", "b", "c"]\n\nfor i, val in enumerate(items):\n    print(i, val)  # 0 a, 1 b, 2 c'
            }
          ]
        },
        {
          heading: 'while',
          items: [
            {
              title: 'базовый while',
              desc: 'пока условие истинно',
              code: 'count = 0\n\nwhile count < 5:\n    print(count)\n    count += 1'
            },
            {
              title: 'break / continue',
              desc: 'прервать или пропустить шаг',
              code: 'for i in range(10):\n    if i == 3:\n        continue   # пропустить 3\n    if i == 7:\n        break      # остановить на 7\n    print(i)'
            }
          ]
        }
      ]
    },

    // Тема 3: Функции
    {
      label: 'функции',
      sections: [
        {
          heading: 'def / return',
          items: [
            {
              title: 'базовая функция',
              desc: 'принимает аргументы, возвращает значение',
              code: 'def greet(name):\n    return f"Привет, {name}!"\n\nresult = greet("Анна")\nprint(result)'
            },
            {
              title: 'аргумент по умолчанию',
              desc: 'значение если не передали',
              code: 'def power(base, exp=2):\n    return base ** exp\n\nprint(power(3))     # 9\nprint(power(3, 3))  # 27'
            },
            {
              title: 'несколько return',
              desc: 'вернуть несколько значений',
              code: 'def min_max(nums):\n    return min(nums), max(nums)\n\nlo, hi = min_max([4, 1, 8, 2])\nprint(lo, hi)  # 1 8'
            }
          ]
        },
        {
          heading: 'шаблоны',
          items: [
            {
              title: 'функция-счётчик',
              desc: 'подсчёт по условию',
              code: 'def count_positive(nums):\n    count = 0\n    for n in nums:\n        if n > 0:\n            count += 1\n    return count\n\nprint(count_positive([-1, 2, 3, -4]))  # 2'
            }
          ]
        }
      ]
    },

    // Тема 4: Списки и словари
    {
      label: 'списки и словари',
      sections: [
        {
          heading: 'список — методы',
          items: [
            {
              title: 'добавить / удалить',
              desc: 'append, remove, pop',
              code: 'nums = [1, 2, 3]\n\nnums.append(4)    # [1, 2, 3, 4]\nnums.remove(2)    # [1, 3, 4]\nlast = nums.pop() # last=4, nums=[1, 3]'
            },
            {
              title: 'сортировка и разворот',
              desc: 'sort, reverse',
              code: 'items = [3, 1, 4, 1, 5]\n\nitems.sort()     # [1, 1, 3, 4, 5]\nitems.reverse()  # [5, 4, 3, 1, 1]'
            },
            {
              title: 'поиск',
              desc: 'index, count, in',
              code: 'nums = [10, 20, 30, 20]\n\nprint(nums.index(20))  # 1 (первый)\nprint(nums.count(20))  # 2\nprint(30 in nums)      # True'
            },
            {
              title: 'срез (slicing)',
              desc: 'часть списка',
              code: 'a = [0, 1, 2, 3, 4, 5]\n\nprint(a[1:4])   # [1, 2, 3]\nprint(a[:3])    # [0, 1, 2]\nprint(a[::2])   # [0, 2, 4]'
            }
          ]
        },
        {
          heading: 'словарь — методы',
          items: [
            {
              title: 'чтение и запись',
              desc: 'ключ-значение',
              code: 'user = {"name": "Анна", "age": 17}\n\nprint(user["name"])     # Анна\nuser["city"] = "Алматы" # добавить\nprint(user.get("email", "нет"))  # нет'
            },
            {
              title: 'перебор',
              desc: 'keys, values, items',
              code: 'data = {"a": 1, "b": 2}\n\nfor key in data.keys():\n    print(key)\n\nfor k, v in data.items():\n    print(k, "→", v)'
            },
            {
              title: 'удаление',
              desc: 'del / pop',
              code: 'd = {"x": 10, "y": 20}\n\ndel d["x"]\nval = d.pop("y")  # val=20, d={}'
            }
          ]
        }
      ]
    },

    // Тема 5: Строки
    {
      label: 'строки',
      sections: [
        {
          heading: 'методы строк',
          items: [
            {
              title: 'регистр',
              desc: 'upper / lower / title',
              code: 's = "привет, мир"\n\nprint(s.upper())   # ПРИВЕТ, МИР\nprint(s.lower())   # привет, мир\nprint(s.title())   # Привет, Мир'
            },
            {
              title: 'обрезка пробелов',
              desc: 'strip / lstrip / rstrip',
              code: 's = "  текст  "\n\nprint(s.strip())   # "текст"\nprint(s.lstrip())  # "текст  "\nprint(s.rstrip())  # "  текст"'
            },
            {
              title: 'разбить / склеить',
              desc: 'split / join',
              code: 'sentence = "один два три"\nwords = sentence.split()   # ["один", "два", "три"]\n\njoined = "-".join(words)   # "один-два-три"\nprint(joined)'
            },
            {
              title: 'поиск в строке',
              desc: 'find / in / count',
              code: 's = "hello world"\n\nprint("world" in s)    # True\nprint(s.find("world")) # 6 (индекс)\nprint(s.count("l"))    # 3'
            },
            {
              title: 'замена',
              desc: 'replace',
              code: 's = "кот и кот"\nresult = s.replace("кот", "пёс")\nprint(result)  # пёс и пёс'
            },
            {
              title: 'проверка содержимого',
              desc: 'isdigit / isalpha / startswith',
              code: 'print("123".isdigit())      # True\nprint("abc".isalpha())      # True\nprint("hello".startswith("he"))  # True\nprint("world".endswith("ld"))    # True'
            }
          ]
        }
      ]
    }
  ];

  // ============================================================
  // ЛОГИКА ПАНЕЛИ
  // ============================================================

  let drawerEl = null;
  let bodyEl = null;
  let currentTopicIndex = 0;

  function init() {
    drawerEl = document.getElementById('ref-drawer');
    bodyEl = document.getElementById('ref-body');

    const closeBtn = document.getElementById('btn-ref-close');
    if (closeBtn) closeBtn.addEventListener('click', close);

    const backdrop = document.getElementById('ref-backdrop');
    if (backdrop) backdrop.addEventListener('click', close);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawerEl && drawerEl.classList.contains('open')) {
        close();
      }
    });
  }

  function open(topicIndex) {
    currentTopicIndex = topicIndex || 0;
    if (!drawerEl) init();
    render(currentTopicIndex);
    drawerEl.classList.add('open');
    const backdrop = document.getElementById('ref-backdrop');
    if (backdrop) backdrop.classList.add('open');
  }

  function close() {
    if (!drawerEl) return;
    drawerEl.classList.remove('open');
    const backdrop = document.getElementById('ref-backdrop');
    if (backdrop) backdrop.classList.remove('open');
  }

  function render(topicIndex) {
    if (!bodyEl) return;
    const data = REFERENCE_DATA[topicIndex];
    if (!data) {
      bodyEl.innerHTML = '<div class="ref-empty">нет данных для этой темы</div>';
      return;
    }

    // Заголовок панели
    const header = document.getElementById('ref-topic-label');
    if (header) header.textContent = data.label;

    let html = '';
    data.sections.forEach(section => {
      html += `<div class="ref-section">`;
      html += `<div class="ref-section-heading">${section.heading}</div>`;
      section.items.forEach((item, idx) => {
        const escaped = item.code
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        html += `
          <div class="ref-item">
            <div class="ref-item-header">
              <span class="ref-item-title">${item.title}</span>
              <span class="ref-item-desc">${item.desc}</span>
            </div>
            <pre class="ref-code">${escaped}</pre>
            <button class="ref-btn-insert" data-topic="${topicIndex}" data-section="${section.heading}" data-idx="${idx}">вставить</button>
          </div>
        `;
      });
      html += '</div>';
    });

    bodyEl.innerHTML = html;

    // Вешаем обработчики на кнопки вставки
    bodyEl.querySelectorAll('.ref-btn-insert').forEach(btn => {
      const tIdx = parseInt(btn.dataset.topic);
      const sectionHeading = btn.dataset.section;
      const itemIdx = parseInt(btn.dataset.idx);
      btn.addEventListener('click', () => insertSnippet(btn, tIdx, sectionHeading, itemIdx));
    });
  }

  function insertSnippet(btn, topicIndex, sectionHeading, itemIdx) {
    const data = REFERENCE_DATA[topicIndex];
    if (!data) return;

    const section = data.sections.find(s => s.heading === sectionHeading);
    if (!section || !section.items[itemIdx]) return;

    const code = section.items[itemIdx].code;
    const editor = document.getElementById('code-editor');

    if (!editor) {
      copyToClipboard(btn, code);
      return;
    }

    const isEmpty = editor.value.trim() === '';

    if (isEmpty) {
      // Вставляем в редактор напрямую
      editor.value = code;
      editor.focus();
      // Триггерим событие для подсветки/обновления редактора
      editor.dispatchEvent(new Event('input', { bubbles: true }));
      flashButton(btn, '✓ вставлено');
    } else {
      // Редактор не пуст — копируем в буфер
      copyToClipboard(btn, code);
    }
  }

  function copyToClipboard(btn, text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        flashButton(btn, '✓ скопировано');
      }).catch(() => {
        fallbackCopy(btn, text);
      });
    } else {
      fallbackCopy(btn, text);
    }
  }

  function fallbackCopy(btn, text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      flashButton(btn, '✓ скопировано');
    } catch (e) {
      flashButton(btn, '— ошибка');
    }
    document.body.removeChild(ta);
  }

  function flashButton(btn, text) {
    const original = btn.textContent;
    btn.textContent = text;
    btn.classList.add('ref-btn-insert--flashed');
    setTimeout(() => {
      btn.textContent = original;
      btn.classList.remove('ref-btn-insert--flashed');
    }, 1800);
  }

  // Публичный API
  window.Reference = { init, open, close };

})(window);
