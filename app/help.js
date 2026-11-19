/**
 * вкат.py — Модуль удалённой помощи преподавателя (VkatHelp)
 *
 * Опрашивает POST /help/poll (same-origin, только под Connect /app/):
 *   -> { profileId, capability, result? }
 *   <- { requests: [ { requestId, kind, text, topicId, itemId, expiresAt } ] }
 *
 * Обработка:
 *   - capability: стойкий hex из browser crypto (один раз на вкладку / сессию)
 *   - draft: текущее значение редактора видимой code-задачи (или error: 'no editor')
 *   - hint: доступная плашка с явным 'Понятно' (acknowledged)
 *   - navigate: выбор 'Перейти'/'Отклонить' с проверкой ID тем/шагов и сохранением черновика
 *   - очередь результатов (resultQueue): дедуплицирована по requestId, отправляет порциями
 *   - подавление повторного открытия плашек для уже находящихся в очереди/обработанных requestId
 *   - проверка expiresAt локально в обработчиках клика (даже при сбое сети)
 *   - при постоянных ошибках (HTTP 4xx) сбрасывает текущий отправляемый результат
 *   - смена/завершение профиля и экран выбора профилей останавливают сессию
 *   - в finally сброс isFlight только для совпадающего sessionToken
 */

(function (window) {
  'use strict';

  const POLL_INTERVAL = 1500;
  const CAPABILITY_KEY = 'vkat_help_capability';

  let memoryCapability = null;
  let activeProfileId = null;
  let currentSessionToken = 0;
  let pollTimer = null;
  let isFlight = false;
  let flightResult = null; // результат, находящийся в полёте прямо сейчас
  let resultQueue = [];    // очередь результатов на отправку: [{ requestId, status, ... }]
  let uiContainer = null;
  // Активные UI-карточки ожидания: Map<requestId, { card, close, expiresAt }>
  const activeCards = new Map();
  // Множество requestId, которые когда-либо были обработаны/помещены в очередь в текущей сессии
  const handledRequestIds = new Set();

  function isServedUnderConnectApp() {
    if (typeof window === 'undefined' || !window.location) return false;
    if (window.VKAT_HELP_ENDPOINT) return true;
    const pathname = window.location.pathname || '';
    return /^\/app(\/|$)/.test(pathname);
  }

  function getOrCreateCapability() {
    if (memoryCapability) return memoryCapability;

    if (typeof window !== 'undefined' && window.VkatStorage && typeof window.VkatStorage.readHelpCapability === 'function') {
      const stored = window.VkatStorage.readHelpCapability();
      if (stored && /^[0-9a-fA-F]+$/.test(stored)) {
        memoryCapability = stored;
        return stored;
      }
    }

    if (typeof window === 'undefined' || !window.crypto || typeof window.crypto.getRandomValues !== 'function') {
      return null;
    }

    const arr = new Uint8Array(16);
    window.crypto.getRandomValues(arr);
    const hex = Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');

    memoryCapability = hex;
    if (typeof window !== 'undefined' && window.VkatStorage && typeof window.VkatStorage.writeHelpCapability === 'function') {
      window.VkatStorage.writeHelpCapability(hex);
    }

    return hex;
  }

  function getPollUrl() {
    if (typeof window !== 'undefined' && window.VKAT_HELP_ENDPOINT) {
      return String(window.VKAT_HELP_ENDPOINT).replace(/\/+$/, '') + '/help/poll';
    }
    return '/help/poll';
  }

  function ensureUiContainer() {
    if (typeof document === 'undefined') return null;
    if (!uiContainer) {
      uiContainer = document.getElementById('help-prompt-container');
      if (!uiContainer) {
        uiContainer = document.createElement('div');
        uiContainer.id = 'help-prompt-container';
        uiContainer.setAttribute('role', 'region');
        uiContainer.setAttribute('aria-live', 'polite');
        uiContainer.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;max-width:380px;display:flex;flex-direction:column;gap:12px;pointer-events:none;';
        document.body.appendChild(uiContainer);
      }
    }
    return uiContainer;
  }

  function createNotificationCard(requestId, titleText, bodyText, expiresAt) {
    const parent = ensureUiContainer();
    if (!parent) return null;

    if (activeCards.has(requestId)) {
      activeCards.get(requestId).close();
    }

    const card = document.createElement('div');
    card.setAttribute('data-request-id', requestId);
    card.style.cssText = 'background:#121212;border:1px solid #454545;border-radius:4px;padding:14px 16px;box-shadow:0 8px 24px rgba(0,0,0,0.6);color:#ececec;font-family:var(--font-sans, sans-serif);font-size:13px;line-height:1.5;pointer-events:auto;';

    const header = document.createElement('div');
    header.style.cssText = 'font-weight:600;font-size:12px;letter-spacing:0.04em;text-transform:uppercase;color:#8a8a8a;margin-bottom:6px;';
    header.textContent = titleText;
    card.appendChild(header);

    if (bodyText) {
      const msg = document.createElement('div');
      msg.style.cssText = 'margin-bottom:12px;color:#ececec;word-break:break-word;';
      msg.textContent = bodyText;
      card.appendChild(msg);
    }

    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex;gap:8px;justify-content:flex-end;align-items:center;';
    card.appendChild(actions);

    parent.appendChild(card);

    const cardObj = {
      card,
      actions,
      expiresAt: typeof expiresAt === 'number' ? expiresAt : null,
      close: () => {
        card.remove();
        activeCards.delete(requestId);
      }
    };
    activeCards.set(requestId, cardObj);
    return cardObj;
  }

  function isExpired(expiresAt) {
    if (typeof expiresAt === 'number' && expiresAt > 0) {
      // expiresAt на сервере передаётся в секундах (epoch seconds)
      return (Date.now() / 1000) > expiresAt;
    }
    return false;
  }

  function handleDraftRequest(req) {
    const app = window.VkatApp;
    if (!app || !app.state) {
      return { requestId: req.requestId, status: 'unavailable', error: 'no editor' };
    }

    const dom = app.dom || {};
    const lessonActive = dom.screenLesson && dom.screenLesson.classList.contains('active');
    const task = app.getCurrentTask ? app.getCurrentTask() : null;
    const topic = app.state.topics ? app.state.topics[app.state.currentTopicIndex] : null;

    const isCodeTask = task && (!task.type || task.type === 'code');

    if (!lessonActive || !task || !isCodeTask || !dom.editor) {
      return {
        requestId: req.requestId,
        status: 'unavailable',
        error: 'no editor'
      };
    }

    const currentCode = typeof dom.editor.value === 'string' ? dom.editor.value : '';

    return {
      requestId: req.requestId,
      status: 'completed',
      draft: {
        topicId: topic ? topic.id : (req.topicId || ''),
        itemId: task.id || (req.itemId || ''),
        code: currentCode
      }
    };
  }

  function handleHintRequest(req, sessionToken) {
    const text = req.text || 'Преподаватель отправил подсказку.';
    const ui = createNotificationCard(req.requestId, 'Подсказка преподавателя', text, req.expiresAt);
    if (!ui) {
      enqueueResult({ requestId: req.requestId, status: 'acknowledged' }, sessionToken);
      return;
    }

    const btnOk = document.createElement('button');
    btnOk.type = 'button';
    btnOk.className = 'btn-ghost-sm';
    btnOk.textContent = 'Понятно';
    btnOk.style.cssText = 'cursor:pointer;padding:4px 10px;background:#ececec;color:#0a0a0a;border:none;border-radius:2px;font-size:12px;font-weight:500;';
    btnOk.onclick = () => {
      ui.close();
      if (sessionToken !== currentSessionToken) return;
      if (isExpired(req.expiresAt)) {
        enqueueResult({ requestId: req.requestId, status: 'expired' }, sessionToken);
        return;
      }
      enqueueResult({ requestId: req.requestId, status: 'acknowledged' }, sessionToken);
    };
    ui.actions.appendChild(btnOk);
  }

  function handleNavigateRequest(req, sessionToken) {
    const app = window.VkatApp;
    if (!app || !app.state || !Array.isArray(app.state.topics)) {
      enqueueResult({ requestId: req.requestId, status: 'declined' }, sessionToken);
      return;
    }

    const targetTopicId = req.topicId;
    const targetItemId = req.itemId;

    let topicIdx = -1;
    let taskIdx = -1;
    let targetTopic = null;
    let targetItem = null;

    if (targetTopicId) {
      topicIdx = app.state.topics.findIndex(t => t.id === targetTopicId);
      if (topicIdx !== -1) {
        targetTopic = app.state.topics[topicIdx];
        const items = targetTopic.items || targetTopic.tasks || [];
        if (targetItemId) {
          taskIdx = items.findIndex(it => it.id === targetItemId);
          if (taskIdx !== -1) targetItem = items[taskIdx];
        } else if (items.length > 0) {
          taskIdx = 0;
          targetItem = items[0];
        }
      }
    }

    if (topicIdx === -1 || taskIdx === -1) {
      enqueueResult({ requestId: req.requestId, status: 'declined', error: 'invalid target' }, sessionToken);
      return;
    }

    const navLabel = (targetTopic ? targetTopic.title : targetTopicId) +
      (targetItem && targetItem.title ? ' — ' + targetItem.title : '');
    const msg = req.text
      ? `${req.text}\nПерейти к: ${navLabel}?`
      : `Преподаватель предлагает перейти к заданию: ${navLabel}.`;

    const ui = createNotificationCard(req.requestId, 'Предложение перехода', msg, req.expiresAt);
    if (!ui) {
      enqueueResult({ requestId: req.requestId, status: 'declined' }, sessionToken);
      return;
    }

    const btnDecline = document.createElement('button');
    btnDecline.type = 'button';
    btnDecline.textContent = 'Отклонить';
    btnDecline.style.cssText = 'cursor:pointer;padding:4px 10px;background:transparent;color:#a3a3a3;border:1px solid #454545;border-radius:2px;font-size:12px;';
    btnDecline.onclick = () => {
      ui.close();
      if (sessionToken !== currentSessionToken) return;
      enqueueResult({ requestId: req.requestId, status: 'declined' }, sessionToken);
    };

    const btnAccept = document.createElement('button');
    btnAccept.type = 'button';
    btnAccept.textContent = 'Перейти';
    btnAccept.style.cssText = 'cursor:pointer;padding:4px 10px;background:#ececec;color:#0a0a0a;border:none;border-radius:2px;font-size:12px;font-weight:500;';
    btnAccept.onclick = () => {
      ui.close();

      if (sessionToken !== currentSessionToken) return;

      // Локальная проверка TTL: никогда не переходим по просроченному предложению
      if (isExpired(req.expiresAt)) {
        enqueueResult({ requestId: req.requestId, status: 'expired' }, sessionToken);
        return;
      }

      // Сохраняем текущий черновик видимой кодовой задачи перед навигацией
      if (app.dom && app.dom.editor && app.getCurrentTask) {
        const cur = app.getCurrentTask();
        const isCode = cur && (!cur.type || cur.type === 'code');
        if (isCode) {
          app.state.codeDrafts[cur.id] = app.dom.editor.value;
          if (typeof app.saveStorage === 'function') {
            app.saveStorage();
          }
          if (window.VkatStorage && typeof window.VkatStorage.flushSync === 'function') {
            window.VkatStorage.flushSync();
          }
        }
      }

      if (typeof app.selectTask === 'function') {
        app.selectTask(topicIdx, taskIdx);
      }
      enqueueResult({ requestId: req.requestId, status: 'accepted' }, sessionToken);
    };

    ui.actions.appendChild(btnDecline);
    ui.actions.appendChild(btnAccept);
  }

  function enqueueResult(resObj, sessionToken) {
    if (sessionToken !== currentSessionToken || !activeProfileId || !resObj || !resObj.requestId) return;

    handledRequestIds.add(resObj.requestId);

    // Дедупликация в очереди по requestId: обновляем существующий или добавляем новый
    const existingIdx = resultQueue.findIndex(r => r.requestId === resObj.requestId);
    if (existingIdx !== -1) {
      resultQueue[existingIdx] = resObj;
    } else {
      resultQueue.push(resObj);
    }
  }

  function pruneExpiredCards(serverPendingRequestIds) {
    const validIds = new Set(serverPendingRequestIds || []);

    for (const [reqId, cardObj] of activeCards.entries()) {
      // Закрываем карточку если её нет в server pending list или истёк её expiresAt
      if (!validIds.has(reqId) || isExpired(cardObj.expiresAt)) {
        cardObj.close();
      }
    }
  }

  function processIncomingRequests(requests, sessionToken) {
    if (!Array.isArray(requests)) return;

    const serverIds = requests.map(r => r.requestId).filter(Boolean);
    pruneExpiredCards(serverIds);

    for (const req of requests) {
      if (!req || !req.requestId || !req.kind) continue;

      // Если истёк TTL до показа
      if (isExpired(req.expiresAt)) {
        continue;
      }

      // Подавление повторного открытия карточки для уже находящихся в очереди/обработанных requestId
      if (handledRequestIds.has(req.requestId)) {
        continue;
      }

      if (req.kind === 'draft') {
        const res = handleDraftRequest(req);
        enqueueResult(res, sessionToken);
      } else if (req.kind === 'hint') {
        if (!activeCards.has(req.requestId)) {
          handleHintRequest(req, sessionToken);
        }
      } else if (req.kind === 'navigate') {
        if (!activeCards.has(req.requestId)) {
          handleNavigateRequest(req, sessionToken);
        }
      }
    }
  }

  async function doPoll() {
    if (isFlight || !activeProfileId || !isServedUnderConnectApp()) return;
    isFlight = true;

    const sessionToken = currentSessionToken;
    const payload = {
      profileId: activeProfileId,
      capability: getOrCreateCapability()
    };

    // Берём следующий результат из очереди (FIFO)
    if (!flightResult && resultQueue.length > 0) {
      flightResult = resultQueue.shift();
    }
    if (flightResult) {
      payload.result = flightResult;
    }

    try {
      const res = await fetch(getPollUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        cache: 'no-store'
      });

      // Сессия инвалидирована во время полёта
      if (sessionToken !== currentSessionToken) return;

      if (res.status >= 400 && res.status < 500) {
        // Перманентная клиентская ошибка 4xx — сбрасываем застрявший результат
        flightResult = null;
        return;
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      // Результат успешно доставлен
      flightResult = null;

      const data = await res.json();
      if (sessionToken === currentSessionToken && data) {
        processIncomingRequests(data.requests, sessionToken);
      }
    } catch (e) {
      // Сетевой сбой: flightResult возвращается в начало очереди для ретрая
      if (flightResult && sessionToken === currentSessionToken) {
        const alreadyInQueue = resultQueue.some(r => r.requestId === flightResult.requestId);
        if (!alreadyInQueue) {
          resultQueue.unshift(flightResult);
        }
        flightResult = null;
      }
    } finally {
      // Сбрасываем флаг isFlight только для совпадающей сессии
      if (sessionToken === currentSessionToken) {
        isFlight = false;
        if (activeProfileId) {
          scheduleNextPoll();
        }
      }
    }
  }

  function scheduleNextPoll() {
    clearPollTimer();
    if (!activeProfileId || !isServedUnderConnectApp()) return;
    pollTimer = setTimeout(() => {
      pollTimer = null;
      doPoll();
    }, POLL_INTERVAL);
  }

  function clearPollTimer() {
    if (pollTimer) {
      clearTimeout(pollTimer);
      pollTimer = null;
    }
  }

  function startSession(profileId) {
    stopSession();
    if (!profileId || !isServedUnderConnectApp()) return;
    activeProfileId = profileId;
    currentSessionToken++;
    isFlight = false;
    flightResult = null;
    resultQueue = [];
    handledRequestIds.clear();
    scheduleNextPoll();
  }

  function stopSession() {
    activeProfileId = null;
    currentSessionToken++;
    isFlight = false;
    flightResult = null;
    resultQueue = [];
    handledRequestIds.clear();
    clearPollTimer();
    for (const card of activeCards.values()) {
      card.close();
    }
    activeCards.clear();
    if (uiContainer) {
      uiContainer.innerHTML = '';
    }
  }

  window.VkatHelp = {
    startSession,
    stopSession,
    getOrCreateCapability,
    isServedUnderConnectApp,
    getPollUrl,
    _getActiveCards: () => activeCards,
    _getResultQueue: () => resultQueue,
    _getHandledRequestIds: () => handledRequestIds
  };

})(typeof window !== 'undefined' ? window : globalThis);
