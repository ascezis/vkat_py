/**
 * вкат.py — Модуль телеметрии CONNECT (VkatConnect)
 *
 * Собирает события урока (пульс, попытки, закрытие шагов, завершение этапа)
 * и отправляет их на сервер преподавателя. Полный снимок прогресса
 * формируется по спеке FEATURES/CONNECT-PROTOCOL.md (vkat-connect/v1).
 *
 * Принцип автономности: без настроенного endpoint'а модуль полностью no-op —
 * ни одного сетевого вызова, ни одного обращения к DOM. Офлайн-режим вката
 * остаётся прежним. Данные в очередь outbox пишутся только через VkatStorage.
 */

(function (window) {
  'use strict';

  const HEARTBEAT_INTERVAL = 20000;  // пульс каждые 20 секунд
  const FLUSH_INTERVAL = 60000;      // досыл outbox раз в минуту
  const OUTBOX_LIMIT = 200;          // максимум событий в очереди outbox
  const FLUSH_BATCH = 20;            // порция за один flush
  const RETRY_DELAY = 2000;          // повторная попытка после сбоя сети
  const CODE_SNIPPET_LIMIT = 8000;   // обрезка финального кода в событии
  const ANSWER_SNIPPET_LIMIT = 500;  // обрезка ответа predict/quiz

  // ─── Состояние сессии ─────────────────────────────────────────────────────

  // session = {
  //   base: string              — база endpoint'а (без /report и /event)
  //   profileId: string
  //   name: string
  //   startedTs: number
  //   activeMs: number          — накопленное активное время
  //   lastResumeTs: number|null — null, пока вкладка неактивна
  //   lastActivityTs: number
  //   items: Map<itemId, {...}> — статистика по шагам для снапшота
  // }
  let session = null;
  let heartbeatTimer = null;
  let flushTimer = null;
  let flushing = false;
  let flushSoonTimer = null;  // отложенный на макротаску flush после успешной отправки
  let retryTimer = null;      // повторный flush после сбоя сети

  // ─── Endpoint ─────────────────────────────────────────────────────────────

  /**
   * Приоритет источника endpoint'а:
   *   1) window.VKAT_CONNECT_ENDPOINT — явная глобальная настройка (спека);
   *   2) авто-детект: страница отдана консолью преподавателя (путь /app/...) —
   *      телеметрия идёт same-origin, ноль настройки на машине ученика;
   *   3) настройка connect_endpoint через VkatStorage (на будущее — UI в v3.2).
   * Значение трактуется как база: /report и /event достраиваются автоматически.
   */
  function resolveEndpoint() {
    let raw = null;
    if (typeof window.VKAT_CONNECT_ENDPOINT === 'string' && window.VKAT_CONNECT_ENDPOINT.trim()) {
      raw = window.VKAT_CONNECT_ENDPOINT.trim();
    }
    if (!raw && window.location && /^\/app(\/|$)/.test(window.location.pathname)) {
      const origin = window.location.origin;
      if (origin && origin !== 'null') raw = origin;
    }
    if (!raw && window.VkatStorage && typeof window.VkatStorage.getSetting === 'function') {
      const stored = window.VkatStorage.getSetting('connect_endpoint');
      if (typeof stored === 'string' && stored.trim()) raw = stored.trim();
    }
    if (!raw) return null;
    raw = raw.replace(/\/+$/, '');
    if (raw.slice(-7) === '/report') raw = raw.slice(0, -7);
    return raw;
  }

  // ─── Учёт активного времени ───────────────────────────────────────────────

  function pauseActiveTime() {
    if (!session || session.lastResumeTs == null) return;
    session.activeMs += Date.now() - session.lastResumeTs;
    session.lastResumeTs = null;
  }

  function resumeActiveTime() {
    if (!session || session.lastResumeTs != null) return;
    session.lastResumeTs = Date.now();
  }

  function timeSpentSeconds() {
    if (!session) return 0;
    const extra = session.lastResumeTs != null ? Date.now() - session.lastResumeTs : 0;
    return Math.floor((session.activeMs + extra) / 1000);
  }

  function touchActivity() {
    if (session) session.lastActivityTs = Date.now();
  }

  function onVisibilityChange() {
    if (typeof document === 'undefined') return;
    if (document.hidden) pauseActiveTime();
    else resumeActiveTime();
  }

  // ─── Отправка и outbox ────────────────────────────────────────────────────

  function post(url, data, keepalive) {
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      keepalive: !!keepalive,
      cache: 'no-store'
    }).then(res => {
      // Flush откладывается на макротаску: микрозадачи-обработчики .catch
      // соседних запросов должны успеть положить свои события в очередь.
      if (res.ok) triggerFlushSoon();
      return res;
    }).catch(() => {
      enqueueOutbox(url, data);
    });
  }

  function triggerFlushSoon() {
    if (flushSoonTimer) return;
    flushSoonTimer = setTimeout(() => {
      flushSoonTimer = null;
      flushOutbox();
    }, 0);
  }

  function scheduleRetry() {
    if (retryTimer || !session) return;
    retryTimer = setTimeout(() => {
      retryTimer = null;
      flushOutbox();
    }, RETRY_DELAY);
  }

  function enqueueOutbox(url, data) {
    if (!window.VkatStorage) return;
    const queue = window.VkatStorage.getOutbox();
    queue.push({ url, data, ts: Date.now() });
    while (queue.length > OUTBOX_LIMIT) queue.shift();
    window.VkatStorage.setOutbox(queue);
    scheduleRetry();
  }

  function flushOutbox() {
    if (flushing || !session || !window.VkatStorage) return;
    const queue = window.VkatStorage.getOutbox();
    if (!queue.length) return;
    flushing = true;
    const batch = queue.splice(0, FLUSH_BATCH);
    window.VkatStorage.setOutbox(queue);
    let chain = Promise.resolve();
    batch.forEach(item => {
      chain = chain.then(() => fetch(item.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.data),
        cache: 'no-store'
      })).then(res => {
        if (!res.ok) enqueueOutbox(item.url, item.data);
      }).catch(() => {
        enqueueOutbox(item.url, item.data);
      });
    });
    chain.finally(() => { flushing = false; });
  }

  function sendEvent(payload, keepalive) {
    if (!session) return;
    return post(session.base + '/event', payload, keepalive);
  }

  // ─── Контекст урока (позиция ученика) ─────────────────────────────────────

  function currentTopic() {
    const st = window.VkatApp && window.VkatApp.state;
    return st && st.topics ? st.topics[st.currentTopicIndex] : null;
  }

  function ensureItem(task) {
    const topic = currentTopic();
    const st = window.VkatApp && window.VkatApp.state;
    let item = session.items.get(task.id);
    if (!item) {
      item = {
        type: task.type || 'code',
        topicId: topic ? topic.id : null,
        topicTitle: topic ? topic.title : null,
        title: task.title || null,
        attempts: 0,
        passed: false,
        errors: new Set(),
        lastCode: null,
        lastAnswer: null
      };
      session.items.set(task.id, item);
    }
    return item;
  }

  // ─── Пульс ────────────────────────────────────────────────────────────────

  function heartbeatPayload() {
    const topic = currentTopic();
    const st = window.VkatApp && window.VkatApp.state;
    const task = window.VkatApp && window.VkatApp.getCurrentTask ? window.VkatApp.getCurrentTask() : null;
    return {
      kind: 'heartbeat',
      ts: Date.now(),
      profileId: session.profileId,
      name: session.name,
      topicId: topic ? topic.id : null,
      topicTitle: topic ? topic.title : null,
      itemId: task ? task.id : null,
      itemTitle: task ? (task.title || null) : null,
      completed: st && st.completedTasks ? st.completedTasks.size : null,
      total: topic && topic.items ? topic.items.length : null,
      lastActivityTs: session.lastActivityTs,
      timeSpentSeconds: timeSpentSeconds()
    };
  }

  function sendHeartbeat() {
    if (!session) return;
    sendEvent(heartbeatPayload());
  }

  // ─── Расшифровка класса ошибки ────────────────────────────────────────────

  function extractErrorClass(errorText, isSyntaxError) {
    if (!errorText) return isSyntaxError ? 'SyntaxError' : null;
    const lines = String(errorText).trim().split('\n');
    for (let i = lines.length - 1; i >= 0; i--) {
      const m = lines[i].match(/([A-Za-z_][A-Za-z0-9_]*(?:Error|Exception))\b/);
      if (m) return m[1];
    }
    return isSyntaxError ? 'SyntaxError' : null;
  }

  // ─── Публичный API ────────────────────────────────────────────────────────

  /**
   * Начало сессии телеметрии. Вызывается из app.js, когда известен активный
   * профиль. Если endpoint не настроен — сессия не создаётся (no-op).
   */
  function sessionStart(profileId, name) {
    sessionEnd();
    const base = resolveEndpoint();
    if (!base || !profileId) return;
    session = {
      base,
      profileId,
      name: name || '',
      startedTs: Date.now(),
      activeMs: 0,
      lastResumeTs: Date.now(),
      lastActivityTs: Date.now(),
      items: new Map()
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibilityChange);
    }
    heartbeatTimer = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
    flushTimer = setInterval(flushOutbox, FLUSH_INTERVAL);
    sendHeartbeat();
    flushOutbox();
  }

  function clearDeferredTimers() {
    if (flushSoonTimer) { clearTimeout(flushSoonTimer); flushSoonTimer = null; }
    if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; }
  }

  /**
   * Конец сессии: финальный пульс и досыл очереди (keepalive доживает до закрытия).
   */
  function sessionEnd() {
    if (!session) return;
    pauseActiveTime();
    if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
    if (flushTimer) { clearInterval(flushTimer); flushTimer = null; }
    clearDeferredTimers();
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', onVisibilityChange);
    }
    try {
      fetch(session.base + '/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(heartbeatPayload()),
        keepalive: true,
        cache: 'no-store'
      }).catch(() => {});
    } catch (e) { /* сеть недоступна — событие не критично */ }
    flushOutbox();
    session = null;
  }

  /**
   * Попытка решения (code / predict / quiz). info = {
   *   passed, completed?, errorText?, isSyntaxError?, code?, userAnswer?
   * }
   */
  function trackCheck(task, info) {
    if (!session || !task || !info) return;
    touchActivity();
    const item = ensureItem(task);
    item.attempts += 1;
    if (info.passed) item.passed = true;

    const errorClass = extractErrorClass(info.errorText, info.isSyntaxError);
    if (errorClass) item.errors.add(errorClass);
    if (info.code != null) item.lastCode = String(info.code).slice(0, CODE_SNIPPET_LIMIT);
    if (info.userAnswer != null && info.userAnswer !== '') {
      item.lastAnswer = String(info.userAnswer).slice(0, ANSWER_SNIPPET_LIMIT);
    }

    sendEvent({
      kind: 'attempt',
      ts: Date.now(),
      profileId: session.profileId,
      name: session.name,
      topicId: item.topicId,
      topicTitle: item.topicTitle,
      itemId: task.id,
      itemTitle: item.title,
      itemType: item.type,
      attemptNo: item.attempts,
      passed: !!info.passed,
      completed: info.completed != null ? !!info.completed : !!info.passed,
      errorClass,
      finalCode: info.code != null ? String(info.code).slice(0, CODE_SNIPPET_LIMIT) : undefined,
      userAnswer: item.lastAnswer || undefined
    });
  }

  /**
   * Шаг закрыт (в т.ч. теория — без попытки проверки)
   */
  function trackItemComplete(task) {
    if (!session || !task) return;
    touchActivity();
    const item = ensureItem(task);
    item.passed = true;
    sendEvent({
      kind: 'item_complete',
      ts: Date.now(),
      profileId: session.profileId,
      name: session.name,
      topicId: item.topicId,
      topicTitle: item.topicTitle,
      itemId: task.id,
      itemTitle: item.title,
      itemType: item.type
    });
  }

  /**
   * Этап завершён: отправляем полный снапшот vkat-connect/v1
   */
  function trackStageComplete(stageId) {
    if (!session) return;
    touchActivity();
    const st = window.VkatApp && window.VkatApp.state;
    const topic = currentTopic();
    const solutions = [];
    let totalAttempts = 0;
    session.items.forEach((item, itemId) => {
      totalAttempts += item.attempts;
      const sol = {
        itemId,
        type: item.type,
        passed: item.passed,
        attempts: item.attempts,
        errorsEncountered: Array.from(item.errors)
      };
      if (item.type === 'code' && item.lastCode != null) sol.finalCode = item.lastCode;
      if ((item.type === 'predict' || item.type === 'quiz') && item.lastAnswer != null) {
        sol.userAnswer = item.lastAnswer;
      }
      solutions.push(sol);
    });

    const payload = {
      protocol: 'vkat-connect/v1',
      timestamp: Date.now(),
      student: { profileId: session.profileId, name: session.name },
      session: {
        stageId: stageId || null,
        topicId: topic ? topic.id : null,
        timeSpentSeconds: timeSpentSeconds()
      },
      summary: {
        totalItems: topic && topic.items ? topic.items.length : null,
        completedItems: topic && topic.items && st && st.completedTasks
          ? topic.items.filter(it => st.completedTasks.has(it.id)).length
          : null,
        totalAttempts
      },
      solutions
    };
    return post(session.base + '/report', payload);
  }

  window.VkatConnect = {
    sessionStart,
    sessionEnd,
    trackCheck,
    trackItemComplete,
    trackStageComplete,
    // Для самопроверки (dev/run_js_validation.js) и отладки
    isEnabled,
    resolveEndpoint
  };

  function isEnabled() {
    return !!(session && session.base);
  }

})(typeof window !== 'undefined' ? window : globalThis);
