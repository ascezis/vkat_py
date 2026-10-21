/**
 * вкат.py — Дружелюбные пояснения к ошибкам Python
 * Сопоставляет технический traceback или SyntaxError с понятными объяснениями для ученика.
 */

(function (window) {
  'use strict';

  const RULES = [
    {
      test: (msg) => /IndentationError/i.test(msg) || /expected an indented block/i.test(msg) || /unexpected indent/i.test(msg) || /unindent does not match/i.test(msg),
      explain: () => 'Строки внутри функции, цикла или условия сдвигаются на 4 пробела вправо. Остальной код пишется без отступа.'
    },
    {
      test: (msg) => /SyntaxError/i.test(msg) && /expected ':'/i.test(msg),
      explain: () => 'В конце строки с def, if, elif, else, for, while нужно двоеточие.'
    },
    {
      test: (msg) => /SyntaxError/i.test(msg) && (/was never closed/i.test(msg) || /unmatched/i.test(msg) || /unterminated string literal/i.test(msg) || /EOL while scanning string literal/i.test(msg)),
      explain: () => 'Не хватает или лишняя скобка или кавычка. Проверь, что каждая открывающая скобка и кавычка закрыта.'
    },
    {
      test: (msg) => /NameError: name '([^']+)' is not defined/i.test(msg),
      explain: (msg) => {
        const match = msg.match(/NameError: name '([^']+)' is not defined/i);
        const name = match ? match[1] : 'переменной';
        return `Python не знает имя \`${name}\`. Проверь написание (регистр важен), создана ли переменная или функция до использования, и не создана ли она внутри функции: снаружи она не видна.`;
      }
    },
    {
      test: (msg) => /TypeError/i.test(msg) && /missing \d+ required positional argument/i.test(msg),
      explain: () => 'Функции передано меньше аргументов, чем параметров в def. Сравни вызов со строкой def.'
    },
    {
      test: (msg) => /TypeError/i.test(msg) && /positional argument.*given/i.test(msg),
      explain: () => 'Функции передано больше аргументов, чем параметров в def.'
    },
    {
      test: (msg) => /TypeError/i.test(msg) && /unsupported operand type.*NoneType/i.test(msg),
      explain: () => 'Один из операндов равен None. Скорее всего, функция печатает результат через print, а нужно вернуть его через return.'
    },
    {
      test: (msg) => /TypeError/i.test(msg) && (/can only concatenate str/i.test(msg) || /unsupported operand type\(s\) for \+: 'int' and 'str'/i.test(msg) || /unsupported operand type\(s\) for \+: 'str' and 'int'/i.test(msg)),
      explain: () => 'Строку и число нельзя сложить через +. Преврати число в строку через str(x) или перечисли значения через запятую в print.'
    },
    {
      test: (msg) => /ZeroDivisionError/i.test(msg),
      explain: () => 'Деление на ноль. Добавь проверку делителя перед делением.'
    },
    {
      test: (msg) => /IndexError: (list|string|tuple) index out of range/i.test(msg),
      explain: () => 'Такого индекса нет в списке или строке. Индексы начинаются с 0, последний элемент: len(a) - 1 или a[-1].'
    },
    {
      test: (msg) => /KeyError/i.test(msg),
      explain: () => 'Такого ключа нет в словаре. Проверь написание ключа или используй метод get().'
    },
    {
      test: (msg) => /ValueError: invalid literal for int\(\)/i.test(msg),
      explain: () => 'Строку нельзя превратить в число: в ней есть не только цифры.'
    },
    {
      test: (msg) => /AttributeError:.*has no attribute/i.test(msg),
      explain: () => 'У значения такого типа нет этого метода или атрибута. Проверь имя метода и тип значения.'
    }
  ];

  function explain(errorText) {
    if (!errorText || typeof errorText !== 'string') return null;
    for (const rule of RULES) {
      if (rule.test(errorText)) {
        return rule.explain(errorText);
      }
    }
    return null;
  }

  window.FriendlyErrors = {
    explain
  };

})(window);
