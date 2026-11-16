/**
 * Новая карточка справочника для темы «Чистый код и оформление» (l1_code_style).
 *
 * Как подключить: вставить объект ниже в массив items секции ctrl
 * в content/cheatsheet.js (поле id начинается с префикса секции).
 *
 * Триггер "is" нужно проверить на коллизии прогоном dev/run_js_validation.js:
 * я не вижу существующий cheatsheet.js.
 */
{
  id: "ctrl_is_none",
  title: "Сравнение с None: is / is not",
  syntax: "x is None\nx is not None",
  desc: "Оператор is проверяет, что два имени указывают на один и тот же объект. None существует в единственном экземпляре, поэтому его сравнивают через is, а не через ==.",
  code: "x = None\nprint(x is None)  # True\nprint(x is not None)  # False\nprint([] is None)  # False",
  pitfall: "Не используй is для сравнения чисел и строк: is сравнивает объекты, а не значения, и результат может оказаться неожиданным. Для значений нужен оператор ==.",
  style: "Проверяй None через is None или is not None, а не через == None (рекомендация PEP 8).",
  triggers: ["is"],
  topics: ["l1_code_style"],
  tags: ["is", "is not", "None", "сравнение", "тождество"]
}
