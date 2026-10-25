/**
 * вкат.py — Модуль изолированного хранилища профилей и прогресса (VkatStorage)
 * Полная инкапсуляция localStorage и sessionStorage.
 */

(function (window) {
  'use strict';

  const KEYS = {
    PROFILES: 'vkat_profiles',
    LAST_PROFILE: 'vkat_last_profile',
    PROFILE_PREFIX: 'vkat_p:',
    ACTIVE_TAB_PROFILE: 'vkat_active_profile',
    LEGACY_BACKUP: 'vkat_legacy_backup',
    // Устаревшие ключи (для миграции)
    LEGACY_COMPLETED: 'vkat_completed_tasks',
    LEGACY_DRAFTS: 'vkat_code_drafts',
    LEGACY_POSITION: 'vkat_current_position',
    LEGACY_SCHEMA: 'vkat_schema'
  };

  // Внутреннее состояние
  let activeProfileCache = null; // ProfileMeta
  let activeDataCache = null;    // ProfileData
  let draftDebounceTimer = null;
  let pendingDrafts = {};        // { [taskId]: code }

  /**
   * Безопасное чтение из localStorage
   */
  function storageGet(key) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {
      console.warn('localStorage read error:', e);
    }
    return null;
  }

  /**
   * Безопасная запись в localStorage
   */
  function storageSet(key, value) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {
      console.warn('localStorage write error:', e);
    }
  }

  /**
   * Безопасное удаление из localStorage
   */
  function storageRemove(key) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (e) {
      console.warn('localStorage remove error:', e);
    }
  }

  /**
   * Безопасное чтение из sessionStorage
   */
  function sessionGet(key) {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        return window.sessionStorage.getItem(key);
      }
    } catch (e) {
      console.warn('sessionStorage read error:', e);
    }
    return null;
  }

  /**
   * Безопасная запись в sessionStorage
   */
  function sessionSet(key, value) {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem(key, value);
      }
    } catch (e) {
      console.warn('sessionStorage write error:', e);
    }
  }

  /**
   * Безопасное удаление из sessionStorage
   */
  function sessionRemove(key) {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.removeItem(key);
      }
    } catch (e) {
      console.warn('sessionStorage remove error:', e);
    }
  }

  /**
   * Генерация случайного 8-символьного ID (base36)
   */
  function generateId() {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      const bytes = new Uint8Array(5);
      window.crypto.getRandomValues(bytes);
      return Array.from(bytes).map(b => b.toString(36).padStart(2, '0')).join('').slice(0, 8);
    }
    return Math.random().toString(36).substring(2, 10);
  }

  /**
   * Хэширование PIN-кода (SHA-256 с солью profileId)
   */
  async function hashPin(pin, salt) {
    if (!pin) return null;
    const str = `${salt}:${pin.trim()}`;
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      try {
        const msgUint8 = new TextEncoder().encode(str);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      } catch (e) {
        console.warn('SubtleCrypto error, falling back to simple hash:', e);
      }
    }
    // Простой fallback-хэш, если SubtleCrypto недоступен (например, незащищённое окружение)
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return 'fallback_' + Math.abs(hash).toString(16);
  }

  /**
   * Получение списка метаданных всех профилей
   */
  async function listProfiles() {
    const raw = storageGet(KEYS.PROFILES);
    if (!raw) return [];
    try {
      const list = JSON.parse(raw);
      return Array.isArray(list) ? list : [];
    } catch (e) {
      console.warn('Не удалось распарсить список профилей:', e);
      return [];
    }
  }

  /**
   * Создание нового профиля
   */
  async function createProfile(name, pin) {
    const trimmed = (name || '').trim();
    if (!trimmed) {
      throw new Error('Имя профиля не может быть пустым');
    }
    if (trimmed.length > 30) {
      throw new Error('Имя профиля не должно превышать 30 символов');
    }

    const profiles = await listProfiles();
    const id = generateId();

    let pinHash = null;
    if (pin && String(pin).trim().length > 0) {
      pinHash = await hashPin(String(pin).trim(), id);
    }

    const now = Date.now();
    const meta = {
      id,
      name: trimmed,
      pinHash: pinHash || undefined,
      created: now,
      lastUsed: now
    };

    // Начальные пустые данные профиля
    const initialData = {
      schema: 2,
      completed: [],
      drafts: {},
      position: {
        topicId: '',
        itemId: ''
      },
      updated: now
    };

    profiles.push(meta);
    storageSet(KEYS.PROFILES, JSON.stringify(profiles));
    storageSet(KEYS.PROFILE_PREFIX + id, JSON.stringify(initialData));

    return meta;
  }

  /**
   * Удаление профиля
   */
  async function deleteProfile(id) {
    let profiles = await listProfiles();
    profiles = profiles.filter(p => p.id !== id);
    storageSet(KEYS.PROFILES, JSON.stringify(profiles));

    // Удаляем объект данных
    storageRemove(KEYS.PROFILE_PREFIX + id);

    // Если это был последний использованный
    if (storageGet(KEYS.LAST_PROFILE) === id) {
      storageRemove(KEYS.LAST_PROFILE);
    }

    // Если это был активный профиль в текущей вкладке
    if (sessionGet(KEYS.ACTIVE_TAB_PROFILE) === id) {
      sessionRemove(KEYS.ACTIVE_TAB_PROFILE);
      activeProfileCache = null;
      activeDataCache = null;
    }
  }

  /**
   * Выбор профиля для текущей вкладки (авторизация)
   */
  async function selectProfile(id, pin) {
    const profiles = await listProfiles();
    const profile = profiles.find(p => p.id === id);
    if (!profile) {
      throw new Error('Профиль не найден');
    }

    // Проверка PIN-кода, если задан
    if (profile.pinHash) {
      const providedHash = await hashPin(String(pin || '').trim(), profile.id);
      if (providedHash !== profile.pinHash) {
        throw new Error('Неверный PIN-код');
      }
    }

    // Запоминаем в текущей вкладке
    sessionSet(KEYS.ACTIVE_TAB_PROFILE, profile.id);
    // Обновляем подсказку последнего входа в localStorage
    storageSet(KEYS.LAST_PROFILE, profile.id);

    // Обновляем timestamp lastUsed
    profile.lastUsed = Date.now();
    storageSet(KEYS.PROFILES, JSON.stringify(profiles));

    activeProfileCache = profile;

    // Загружаем данные профиля
    const data = await load();
    return data;
  }

  /**
   * Получение метаданных активного профиля в текущей вкладке
   */
  function getActiveProfileSync() {
    if (activeProfileCache) return activeProfileCache;
    const activeId = sessionGet(KEYS.ACTIVE_TAB_PROFILE);
    if (!activeId) return null;

    const raw = storageGet(KEYS.PROFILES);
    if (!raw) return null;
    try {
      const list = JSON.parse(raw);
      const found = list.find(p => p.id === activeId);
      if (found) {
        activeProfileCache = found;
        return found;
      }
    } catch (e) {
      // ignore
    }
    return null;
  }

  async function getActiveProfile() {
    return getActiveProfileSync();
  }

  /**
   * Сброс активного профиля в текущей вкладке
   */
  function clearActiveProfile() {
    flushSync();
    sessionRemove(KEYS.ACTIVE_TAB_PROFILE);
    activeProfileCache = null;
    activeDataCache = null;
  }

  /**
   * Получение ID последней активной учетной записи (подсказка для входа)
   */
  function getLastProfileId() {
    return storageGet(KEYS.LAST_PROFILE);
  }

  /**
   * Получение количества пройденных шагов для конкретного профиля
   */
  function getProgressCount(id) {
    if (!id) return 0;
    if (activeProfileCache && activeProfileCache.id === id && activeDataCache && Array.isArray(activeDataCache.completed)) {
      return activeDataCache.completed.length;
    }
    const raw = storageGet(KEYS.PROFILE_PREFIX + id);
    if (!raw) return 0;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed.completed) ? parsed.completed.length : 0;
    } catch (e) {
      return 0;
    }
  }

  /**
   * Загрузка данных активного профиля
   */
  async function load() {
    const activeId = sessionGet(KEYS.ACTIVE_TAB_PROFILE);
    if (!activeId) {
      return {
        schema: 2,
        completed: [],
        drafts: {},
        position: { topicId: '', itemId: '' },
        updated: Date.now()
      };
    }

    const raw = storageGet(KEYS.PROFILE_PREFIX + activeId);
    if (!raw) {
      const fresh = {
        schema: 2,
        completed: [],
        drafts: {},
        position: { topicId: '', itemId: '' },
        updated: Date.now()
      };
      storageSet(KEYS.PROFILE_PREFIX + activeId, JSON.stringify(fresh));
      activeDataCache = fresh;
      return fresh;
    }

    try {
      const parsed = JSON.parse(raw);
      activeDataCache = {
        schema: 2,
        completed: Array.isArray(parsed.completed) ? parsed.completed : [],
        drafts: parsed.drafts && typeof parsed.drafts === 'object' ? parsed.drafts : {},
        position: parsed.position && typeof parsed.position === 'object' ? parsed.position : { topicId: '', itemId: '' },
        updated: parsed.updated || Date.now()
      };
      return activeDataCache;
    } catch (e) {
      console.warn('Ошибка чтения данных профиля:', e);
      return {
        schema: 2,
        completed: [],
        drafts: {},
        position: { topicId: '', itemId: '' },
        updated: Date.now()
      };
    }
  }

  /**
   * Сохранение изменений в активный профиль
   */
  async function save(patch) {
    const activeId = sessionGet(KEYS.ACTIVE_TAB_PROFILE);
    if (!activeId) return;

    if (!activeDataCache) {
      await load();
    }

    if (patch.completed) {
      activeDataCache.completed = Array.from(new Set(patch.completed));
    }
    if (patch.drafts) {
      activeDataCache.drafts = { ...activeDataCache.drafts, ...patch.drafts };
    }
    if (patch.position) {
      activeDataCache.position = { ...activeDataCache.position, ...patch.position };
    }
    activeDataCache.updated = Date.now();

    storageSet(KEYS.PROFILE_PREFIX + activeId, JSON.stringify(activeDataCache));
  }

  /**
   * Отложенное сохранение черновика кода (debounce 500ms)
   */
  function saveDraftDebounced(taskId, code) {
    if (!taskId) return;
    pendingDrafts[taskId] = code;

    if (activeDataCache && activeDataCache.drafts) {
      activeDataCache.drafts[taskId] = code;
    }

    if (draftDebounceTimer) {
      clearTimeout(draftDebounceTimer);
    }

    draftDebounceTimer = setTimeout(() => {
      flushSync();
    }, 500);
  }

  /**
   * Немедленный синхронный сброс буфера черновиков в localStorage
   */
  function flushSync() {
    if (draftDebounceTimer) {
      clearTimeout(draftDebounceTimer);
      draftDebounceTimer = null;
    }

    const activeId = sessionGet(KEYS.ACTIVE_TAB_PROFILE);
    if (!activeId) return;

    const hasPending = Object.keys(pendingDrafts).length > 0;
    if (!hasPending && !activeDataCache) return;

    try {
      let current = activeDataCache;
      if (!current) {
        const raw = storageGet(KEYS.PROFILE_PREFIX + activeId);
        current = raw ? JSON.parse(raw) : { schema: 2, completed: [], drafts: {}, position: {} };
      }

      current.drafts = { ...current.drafts, ...pendingDrafts };
      current.updated = Date.now();
      storageSet(KEYS.PROFILE_PREFIX + activeId, JSON.stringify(current));
      activeDataCache = current;
      pendingDrafts = {};
    } catch (e) {
      console.warn('Ошибка flushSync:', e);
    }
  }

  /**
   * Проверка наличия старых данных (до введения профилей)
   */
  function checkLegacyData() {
    const hasCompleted = Boolean(storageGet(KEYS.LEGACY_COMPLETED));
    const rawProfiles = storageGet(KEYS.PROFILES);
    let hasProfiles = false;
    if (rawProfiles) {
      try {
        const parsed = JSON.parse(rawProfiles);
        hasProfiles = Array.isArray(parsed) && parsed.length > 0;
      } catch (e) {
        hasProfiles = false;
      }
    }
    return hasCompleted && !hasProfiles;
  }

  /**
   * Миграция устаревших плоских ключей в указанный профиль
   */
  async function migrateLegacyToProfile(profileId, courseStages, courseTopics) {
    if (!profileId) return;

    // 1. Создаем резервный снимок старых данных
    const legacySnapshot = {
      completed: storageGet(KEYS.LEGACY_COMPLETED),
      drafts: storageGet(KEYS.LEGACY_DRAFTS),
      position: storageGet(KEYS.LEGACY_POSITION),
      schema: storageGet(KEYS.LEGACY_SCHEMA),
      migratedAt: Date.now()
    };
    storageSet(KEYS.LEGACY_BACKUP, JSON.stringify(legacySnapshot));

    // 2. Читаем и парсим старые данные
    let completedArr = [];
    try {
      const c = storageGet(KEYS.LEGACY_COMPLETED);
      if (c) completedArr = JSON.parse(c);
    } catch (e) {}

    let draftsObj = {};
    try {
      const d = storageGet(KEYS.LEGACY_DRAFTS);
      if (d) draftsObj = JSON.parse(d);
    } catch (e) {}

    // Преобразуем числовую позицию в семантическую { topicId, itemId }
    let positionObj = { topicId: '', itemId: '' };
    try {
      const p = storageGet(KEYS.LEGACY_POSITION);
      if (p) {
        const parsedPos = JSON.parse(p);
        const topIdx = parsedPos.topicIndex || 0;
        const tskIdx = parsedPos.taskIndex || 0;

        const topicsList = Array.isArray(courseTopics)
          ? courseTopics
          : ((typeof window !== 'undefined' && window.COURSE_TOPICS) || []);

        if (Array.isArray(topicsList) && topicsList[topIdx]) {
          const topic = topicsList[topIdx];
          positionObj.topicId = topic.id;
          const items = topic.items || topic.tasks || [];
          if (items[tskIdx]) {
            positionObj.itemId = items[tskIdx].id;
          }
        }
      }
    } catch (e) {}

    // 3. Записываем в новый профиль
    const targetKey = KEYS.PROFILE_PREFIX + profileId;
    let targetData;
    try {
      const raw = storageGet(targetKey);
      targetData = raw ? JSON.parse(raw) : { schema: 2, completed: [], drafts: {}, position: {} };
    } catch (e) {
      targetData = { schema: 2, completed: [], drafts: {}, position: {} };
    }

    targetData.completed = Array.from(new Set([...targetData.completed, ...completedArr]));
    targetData.drafts = { ...targetData.drafts, ...draftsObj };
    if (!targetData.position.topicId && positionObj.topicId) {
      targetData.position = positionObj;
    }
    targetData.updated = Date.now();

    storageSet(targetKey, JSON.stringify(targetData));

    // 4. Удаляем старые ключи, чтобы исключить повторную миграцию
    storageRemove(KEYS.LEGACY_COMPLETED);
    storageRemove(KEYS.LEGACY_DRAFTS);
    storageRemove(KEYS.LEGACY_POSITION);
    storageRemove(KEYS.LEGACY_SCHEMA);
  }

  /**
   * Экспорт данных профиля в формате JSON-файла
   */
  async function exportProfile(id) {
    const profiles = await listProfiles();
    const profile = profiles.find(p => p.id === id);
    if (!profile) throw new Error('Профиль не найден');

    const rawData = storageGet(KEYS.PROFILE_PREFIX + id);
    const data = rawData ? JSON.parse(rawData) : null;

    const exportBundle = {
      vkat_export_version: 1,
      vkat_app_version: (typeof window !== 'undefined' && window.VKAT_VERSION) ? window.VKAT_VERSION : '2.3.1',
      exportedAt: new Date().toISOString(),
      profile: {
        id: profile.id,
        name: profile.name,
        created: profile.created
      },
      data: data
    };

    const jsonStr = JSON.stringify(exportBundle, null, 2);
    if (typeof document !== 'undefined' && typeof URL !== 'undefined' && URL.createObjectURL) {
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const safeName = profile.name.replace(/[^a-zA-Z0-9а-яА-ЯёЁ_-]/g, '_');
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `vkat-profile-${safeName}-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    return exportBundle;
  }

  /**
   * Импорт профиля из строки JSON
   */
  async function importProfile(jsonString) {
    let bundle;
    try {
      bundle = JSON.parse(jsonString);
    } catch (e) {
      throw new Error('Файл повреждён или не является корректным JSON');
    }

    if (!bundle || !bundle.profile || !bundle.profile.name || !bundle.data) {
      throw new Error('Некорректная структура файла профиля вкат.py');
    }

    const profiles = await listProfiles();
    // Генерируем новый ID во избежание коллизий
    const newId = generateId();
    const now = Date.now();

    const meta = {
      id: newId,
      name: bundle.profile.name + ' (импорт)',
      created: bundle.profile.created || now,
      lastUsed: now
    };

    const data = {
      schema: 2,
      completed: Array.isArray(bundle.data.completed) ? bundle.data.completed : [],
      drafts: bundle.data.drafts && typeof bundle.data.drafts === 'object' ? bundle.data.drafts : {},
      position: bundle.data.position && typeof bundle.data.position === 'object' ? bundle.data.position : { topicId: '', itemId: '' },
      updated: now
    };

    profiles.push(meta);
    storageSet(KEYS.PROFILES, JSON.stringify(profiles));
    storageSet(KEYS.PROFILE_PREFIX + newId, JSON.stringify(data));

    return meta;
  }

  /**
   * Полный сброс всех профилей и данных тренажера на компьютере
   */
  async function resetAll() {
    flushSync();
    try {
      const profiles = await listProfiles();
      profiles.forEach(p => {
        storageRemove(KEYS.PROFILE_PREFIX + p.id);
      });
      storageRemove(KEYS.PROFILES);
      storageRemove(KEYS.LAST_PROFILE);
      sessionRemove(KEYS.ACTIVE_TAB_PROFILE);
      activeProfileCache = null;
      activeDataCache = null;
    } catch (e) {
      console.warn('Ошибка resetAll:', e);
    }
  }

  // Экспорт публичного API
  window.VkatStorage = {
    KEYS,
    listProfiles,
    createProfile,
    deleteProfile,
    selectProfile,
    getActiveProfile,
    getActiveProfileSync,
    clearActiveProfile,
    getLastProfileId,
    getProgressCount,
    load,
    save,
    saveDraftDebounced,
    flushSync,
    checkLegacyData,
    migrateLegacyToProfile,
    exportProfile,
    importProfile,
    resetAll
  };

})(typeof window !== 'undefined' ? window : globalThis);
