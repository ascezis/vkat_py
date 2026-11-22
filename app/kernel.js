/**
 * вкат.py — Микро-контейнер зависимостей (kernel)
 *
 * Service locator для app-модулей: явная регистрация, fail-fast при дублях
 * и при обращении к незарегистрированному сервису. Заменяет неявный контракт
 * «порядок тегов <script> в index.html» на проверяемый (TECH-DEBT P1, issue #12).
 *
 * Правила:
 *   - Каждый app-модуль после своего экспорта регистрируется:
 *       window.Vkat.define('storage', window.VkatStorage);
 *   - window.X-алиасы сохраняются (валидатор, types.d.ts, dev-харнесс).
 *   - Загрузка списков скриптов — только через content/manifest.js.
 *   - НЕ касается браузерных хранилищ (правило секции 13 валидатора)
 *     и ничего не знает о домене приложения.
 *
 * Первый app-скрипт в манифесте: должен загрузиться до всех остальных модулей.
 */

(function (window) {
  'use strict';

  /** @type {Map<string, any>} */
  const registry = new Map();

  const Vkat = {
    /**
     * Зарегистрировать сервис по имени.
     * @param {string} name имя сервиса ('storage', 'checker', ...)
     * @param {any} value экспортируемый API модуля
     */
    define(name, value) {
      if (typeof name !== 'string' || !name) {
        throw new Error('[VkatKernel] define: имя сервиса обязательно');
      }
      if (registry.has(name)) {
        throw new Error('[VkatKernel] Сервис \'' + name + '\' уже зарегистрирован — двойная загрузка модуля или дубль в manifest.js?');
      }
      registry.set(name, value);
      return value;
    },

    /** Получить сервис; отсутствующий — программная ошибка сборки, не undefined. */
    get(name) {
      if (!registry.has(name)) {
        const known = registry.size ? ' Зарегистрированы: ' + Vkat.list().join(', ') + '.' : ' Реестр пуст — app/kernel.js не загружен первым?';
        throw new Error('[VkatKernel] Сервис \'' + name + '\' не зарегистрирован.' + known);
      }
      return registry.get(name);
    },

    /** Проверка наличия без броска. */
    has(name) {
      return registry.has(name);
    },

    /**
     * Явно объявить load-time зависимости модуля и получить их.
     * Кидают ошибку с перечнем недостающего до того, как модуль начнёт работу.
     * @param {...string} names имена сервисов
     */
    require(...names) {
      const missing = names.filter(function (n) { return !registry.has(n); });
      if (missing.length) {
        throw new Error('[VkatKernel] Модуль требует незарегистрированные сервисы: ' + missing.join(', ') + '. Проверь порядок в content/manifest.js.');
      }
      return names.map(function (n) { return registry.get(n); });
    },

    /** Имена всех зарегистрированных сервисов (для отладки и валидатора). */
    list() {
      return Array.from(registry.keys());
    },

    /** Число зарегистрированных сервисов. */
    get size() { return registry.size; }
  };

  // Замораживаем поверхность API — изменение контейнера из модулей запрещено.
  Object.freeze(Vkat);

  window.Vkat = Vkat;
})(typeof window !== 'undefined' ? window : globalThis);
