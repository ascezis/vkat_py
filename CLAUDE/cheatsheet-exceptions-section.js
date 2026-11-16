/**
 * Новая секция справочника «Исключения» для content/cheatsheet.js.
 *
 * Как подключить: вставить объект ниже в массив window.CHEATSHEET_SECTIONS.
 *
 * Обёртка секции (id, title, items) собрана по описанию в 02-HINTS-SPEC.md:
 * там чётко описаны только карточки внутри items. Если в существующих секциях
 * поля обёртки называются иначе, поправь только их, карточки менять не нужно.
 */
{
  id: "exceptions",
  title: "Исключения",
  items: [
    {
      id: "exc_try_except",
      title: "Обработка ошибок: try / except",
      syntax: "try:\n    ...\nexcept ErrorType:\n    ...",
      desc: "Позволяет перехватить ошибку во время работы программы и не дать ей упасть. Необязательные блоки else и finally добавляются после except.",
      code: "try:\n    n = int(\"abc\")\nexcept ValueError:\n    n = 0  # ошибка перехвачена, программа не упала\nprint(n)  # 0",
      pitfall: "Никогда не пиши голый except: без типа ошибки. Он заглушит даже опечатки в именах переменных, и настоящую причину сбоя будет трудно найти.",
      style: "Перехватывай только конкретные типы ошибок, которые реально ожидаешь, и держи блок try узким.",
      triggers: ["try", "except"],
      topics: ["l1_exceptions"],
      tags: ["try", "except", "ошибка", "исключение", "перехват", "else"]
    },
    {
      id: "exc_finally",
      title: "Блок finally",
      syntax: "try:\n    ...\nfinally:\n    ...",
      desc: "Выполняется всегда: и после успешного try, и после перехваченной ошибки, и даже если в try стоит return.",
      code: "try:\n    print(\"try\")  # try\nfinally:\n    print(\"finally\")  # finally, выполнится при любом исходе",
      pitfall: "Не пиши return внутри finally: он молча заменит результат из try и спрячет возникшую ошибку.",
      style: "Используй finally только для действий, которые нужны при любом исходе, например для освобождения ресурса.",
      triggers: ["finally"],
      topics: ["l1_exceptions"],
      tags: ["finally", "всегда", "очистка", "исключение"]
    },
    {
      id: "exc_raise",
      title: "Выбросить ошибку: raise",
      syntax: "raise ErrorType(\"сообщение\")",
      desc: "Останавливает выполнение функции и сообщает вызывающему коду, что данные неподходящие.",
      code: "def set_age(age):\n    if age < 0:\n        raise ValueError(\"возраст отрицательный\")  # остановит функцию\n    return age\nprint(set_age(5))  # 5",
      pitfall: "Выбирай тип ошибки по смыслу: ValueError для неподходящего значения, TypeError для неподходящего типа. Общий Exception ничего не говорит тому, кто будет ловить ошибку.",
      style: "Пиши в сообщении, что именно не так и какое значение пришло.",
      triggers: ["raise"],
      topics: ["l1_exceptions"],
      tags: ["raise", "выбросить", "ошибка", "исключение", "ValueError"]
    },
    {
      id: "exc_value_error",
      title: "ValueError: неподходящее значение",
      syntax: "int(\"abc\")  # ValueError",
      desc: "Возникает, когда тип значения подходит, а содержание нет. Самый частый случай: превращение строки в число.",
      code: "try:\n    n = int(\"3.5\")\nexcept ValueError:\n    print(\"не число\")  # не число",
      pitfall: "int(\"3.5\") падает: int принимает только запись целого числа. Для дробной строки сначала вызови float(), затем int().",
      style: "Для ввода пользователя перехватывай именно ValueError, а не любые ошибки.",
      triggers: ["ValueError"],
      topics: ["l1_exceptions"],
      tags: ["ValueError", "int", "преобразование", "ошибка значения"]
    },
    {
      id: "exc_zero_division",
      title: "ZeroDivisionError: деление на ноль",
      syntax: "a / b  # ZeroDivisionError при b == 0",
      desc: "Возникает при делении на ноль. Касается операций /, // и %.",
      code: "try:\n    x = 10 / 0\nexcept ZeroDivisionError:\n    x = None  # деление на ноль перехвачено\nprint(x)  # None",
      pitfall: "Ошибка возникает не только при /, но и при // и %. Деление на 0.0 тоже падает: 1 / 0.0 вызывает ZeroDivisionError.",
      style: "Если делитель приходит из данных, предусмотри нулевой случай заранее.",
      triggers: ["ZeroDivisionError"],
      topics: ["l1_exceptions"],
      tags: ["ZeroDivisionError", "деление", "ноль", "ошибка"]
    },
    {
      id: "exc_key_error",
      title: "KeyError: нет ключа в словаре",
      syntax: "d[key]  # KeyError, если ключа нет",
      desc: "Возникает при обращении к отсутствующему ключу словаря через квадратные скобки.",
      code: "d = {\"a\": 1}\ntry:\n    print(d[\"b\"])\nexcept KeyError:\n    print(\"нет ключа\")  # нет ключа",
      pitfall: "Квадратные скобки бросают KeyError, а .get() вернёт None без ошибки. Если ключа может не быть, выбери .get() или try, но не оставляй обращение без защиты.",
      style: "Для простого значения по умолчанию достаточно .get(), для разной реакции на разные ошибки подойдёт try.",
      triggers: ["KeyError"],
      topics: ["l1_exceptions"],
      tags: ["KeyError", "словарь", "ключ", "ошибка"]
    },
    {
      id: "exc_index_error",
      title: "IndexError: индекс вне списка",
      syntax: "items[i]  # IndexError, если i вне границ",
      desc: "Возникает при обращении к элементу списка, строки или кортежа по несуществующему индексу.",
      code: "items = [1, 2]\ntry:\n    print(items[5])\nexcept IndexError:\n    print(\"нет такого индекса\")  # нет такого индекса",
      pitfall: "Последний допустимый индекс равен len(items) - 1. Обращение к items[len(items)] — самая частая причина этой ошибки.",
      style: "Если индекс приходит извне, проверь его или перехвати IndexError.",
      triggers: ["IndexError"],
      topics: ["l1_exceptions"],
      tags: ["IndexError", "индекс", "список", "ошибка"]
    },
    {
      id: "exc_type_error",
      title: "TypeError: неподходящий тип",
      syntax: "\"5\" + 5  # TypeError",
      desc: "Возникает, когда операция применяется к значениям неподходящих типов, например при сложении строки и числа.",
      code: "try:\n    print(\"5\" + 5)\nexcept TypeError:\n    print(\"строку и число не сложить\")  # строку и число не сложить",
      pitfall: "Строки и числа не складываются сами. Приведи число к строке через str() или строку к числу через int(), в зависимости от задачи.",
      style: "Исправляй причину (приведи типы), а не прячь TypeError за широким except.",
      triggers: ["TypeError"],
      topics: ["l1_exceptions"],
      tags: ["TypeError", "тип", "сложение", "ошибка"]
    }
  ]
}
