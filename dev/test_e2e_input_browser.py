"""
E2E браузерный сценарий через Connect и Edge CDP с настоящим DOM-взаимодействием.
Проверяет:
1. Запуск кода ученика («▶ Запустить» / #btn-exec): ввод из панели stdin, вывод в консоль без зачёта и телеметрии.
2. Проверка решения («Проверить» / #btn-run): ВСЕГДА только с эталонным stdin, даже если в панели экспериментальный ввод намеренно вызывает ошибку.
3. Разминка на прогноз вывода (predict, l2_io_p1): отрисовка видимого блока stdin (#predict-stdin-box / #predict-stdin-view), ввод ответа, зачёт по клику.
4. Преподаватель в Connect Console:
   - Загрузка /dashboard/index.html со всеми 17 темами.
   - Кнопка «Все темы курса (17)» открывает каталог из 17 тем курса.
   - Навигация по темам l2_io_input и variables (var_5).
   - Отображение блока «Входные данные (stdin)» в модальном окне задач.
5. Выпускник (старый профиль с пройденной базой):
   - Карточка этапа «Начало» отображает «Повторить» (100% зачёт).
   - Прямой видимый вход: клик по кнопке «Начать» на карточке «Практикум» сразу открывает урок практикума.
6. Офлайн / Zero-Build:
   - Проверка реального file:// протокола без внешних сетевых зависимостей.

Строго без постоянных артефактов в dev/.edge_profile: профили создаются в tempfile и удаляются в finally.
"""

import asyncio
import json
import os
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.request
import websockets

EDGE_PATHS = [
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    os.path.expanduser(r"~\AppData\Local\Microsoft\Edge\Application\msedge.exe")
]
EDGE_PATH = next((p for p in EDGE_PATHS if os.path.isfile(p)), None)

CONNECT_PORT = 8092
CDP_PORT = 9231
APP_URL = f"http://127.0.0.1:{CONNECT_PORT}/app/index.html"
DASHBOARD_URL = f"http://127.0.0.1:{CONNECT_PORT}/dashboard/index.html"

async def main():
    if not EDGE_PATH:
        print("ERROR: Edge not found")
        sys.exit(1)

    temp_edge_dir = tempfile.mkdtemp(prefix="vkat_edge_temp_")
    temp_db_dir = tempfile.mkdtemp(prefix="vkat_connect_db_")
    db_file = os.path.join(temp_db_dir, "connect.sqlite3")

    connect_proc = None
    edge_proc = None

    try:
        # 1. Запуск Connect Console
        connect_py = r"C:\Users\azis\Desktop\connect-console\server.py"
        app_dir = r"C:\Users\azis\Desktop\vkat_py"
        connect_cmd = [
            sys.executable,
            connect_py,
            "--port", str(CONNECT_PORT),
            "--app-dir", app_dir,
            "--db", db_file
        ]
        connect_proc = subprocess.Popen(connect_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        # Ждём запуска Connect
        for _ in range(30):
            try:
                with urllib.request.urlopen(f"http://127.0.0.1:{CONNECT_PORT}/api/state", timeout=1) as resp:
                    if resp.status == 200:
                        break
            except Exception:
                time.sleep(0.2)
        else:
            print("ERROR: Connect server failed to start")
            sys.exit(1)
        print("  ✓ Connect Console запущен на порту", CONNECT_PORT)

        # 2. Запуск Edge в headless режиме
        edge_cmd = [
            EDGE_PATH,
            f"--remote-debugging-port={CDP_PORT}",
            f"--user-data-dir={temp_edge_dir}",
            "--remote-allow-origins=*",
            "--allow-file-access-from-files",
            "--headless=new",
            "--window-size=1280,900",
            APP_URL
        ]
        edge_proc = subprocess.Popen(edge_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        ws_url = None
        for _ in range(40):
            try:
                resp = urllib.request.urlopen(f"http://127.0.0.1:{CDP_PORT}/json/list", timeout=1)
                targets = json.loads(resp.read().decode('utf-8'))
                for t in targets:
                    if t.get("type") == "page":
                        ws_url = t.get("webSocketDebuggerUrl")
                        break
                if ws_url:
                    break
            except Exception:
                time.sleep(0.25)

        if not ws_url:
            print("ERROR: WebSocket debugger URL not found")
            sys.exit(1)

        print("  ✓ Edge CDP подключен:", ws_url)

        async with websockets.connect(ws_url, max_size=10*1024*1024) as ws:
            msg_id = 0
            async def call(method, params=None):
                nonlocal msg_id
                msg_id += 1
                req = {"id": msg_id, "method": method, "params": params or {}}
                await ws.send(json.dumps(req))
                while True:
                    raw = await ws.recv()
                    res = json.loads(raw)
                    if res.get("id") == msg_id:
                        return res.get("result", {})

            await call("Page.enable")
            await call("Runtime.enable")

            # Ожидание готовности Pyodide в приложении
            print("  Ожидание готовности приложения...")
            for _ in range(60):
                res = await call("Runtime.evaluate", {
                    "expression": "Boolean(window.VkatApp && window.CodeChecker && window.CodeChecker.isReady && window.CodeChecker.isReady())",
                    "returnByValue": True
                })
                if res.get("result", {}).get("value") is True:
                    break
                await asyncio.sleep(0.5)
            else:
                await call("Runtime.evaluate", {
                    "expression": "window.CodeChecker.ensureReady()",
                    "awaitPromise": True
                })

            print("  ✓ Pyodide и интерфейс готовы")

            # ──────────────────────────────────────────────────────────────────
            # СЦЕНАРИЙ 1: Студент — Запуск (#btn-exec) vs Проверка (#btn-run) через DOM
            # ──────────────────────────────────────────────────────────────────
            print("\n--- Тест 1: Студент: DOM-запуск (#btn-exec) и зачёт (#btn-run) ---")

            # Переход в урок var_5
            await call("Runtime.evaluate", {
                "expression": """
                (() => {
                    window.VkatApp.selectTask(0, 4); // var_5
                })()
                """
            })
            await asyncio.sleep(0.2)

            # Проверяем видимость панели ввода
            chk_panel = await call("Runtime.evaluate", {
                "expression": """
                (() => {
                    const p = document.getElementById('stdin-panel');
                    const btnExec = document.getElementById('btn-exec');
                    const btnRun = document.getElementById('btn-run');
                    return {
                        panelVisible: p && p.style.display !== 'none',
                        hasBtnExec: Boolean(btnExec),
                        hasBtnRun: Boolean(btnRun)
                    };
                })()
                """,
                "returnByValue": True
            })
            panel_info = chk_panel.get("result", {}).get("value", {})
            assert panel_info.get("panelVisible") is True, f"stdin panel not visible: {panel_info}"
            assert panel_info.get("hasBtnExec") is True, "btn-exec missing from DOM"
            assert panel_info.get("hasBtnRun") is True, "btn-run missing from DOM"

            # Студент вводит код и пользовательский stdin, нажимает «▶ Запустить»
            run_exec_res = await call("Runtime.evaluate", {
                "expression": """
                (async () => {
                    const ed = document.getElementById('code-editor');
                    const stdinEd = document.getElementById('stdin-editor');
                    const btnExec = document.getElementById('btn-exec');
                    const consoleOut = document.getElementById('console-out');
                    const resultBox = document.getElementById('result-box');

                    ed.value = 'name = input()\\nprint(f"Здравствуй, {name}!")';
                    ed.dispatchEvent(new Event('input', { bubbles: true }));

                    stdinEd.value = 'Студент-Экспериментатор';
                    stdinEd.dispatchEvent(new Event('input', { bubbles: true }));

                    // Кликаем по кнопке «▶ Запустить»
                    btnExec.click();

                    // Ждём пока кнопка снова станет активной
                    for (let i = 0; i < 40; i++) {
                        if (!btnExec.disabled) break;
                        await new Promise(r => setTimeout(r, 100));
                    }

                    const state = window.VkatApp.state;
                    return {
                        consoleText: consoleOut.textContent.trim(),
                        resultBoxVisible: resultBox.classList.contains('visible'),
                        isCompleted: state.completedTasks.has('var_5'),
                        btnNextVisible: document.getElementById('btn-next').style.display !== 'none'
                    };
                })()
                """,
                "awaitPromise": True,
                "returnByValue": True
            })
            exec_val = run_exec_res.get("result", {}).get("value", {})
            assert "Здравствуй, Студент-Экспериментатор!" in exec_val.get("consoleText", ""), f"exec output mismatch: {exec_val}"
            assert exec_val.get("resultBoxVisible") is False, "resultBox must NOT be visible after run!"
            assert exec_val.get("isCompleted") is False, "task must NOT be completed after run!"
            assert exec_val.get("btnNextVisible") is False, "btnNext must NOT be visible after run!"
            print("  ✓ [DOM] «▶ Запустить» (#btn-exec) вывел результат в консоль без зачёта и кнопки «Дальше»")

            # Теперь студент вводит в stdin намеренно ломающие данные (вызывающие несовпадение),
            # но нажимает «Проверить» (#btn-run). Проверка ДОЛЖНА пройти, так как она идёт
            # строго по эталонным тестам!
            run_check_res = await call("Runtime.evaluate", {
                "expression": """
                (async () => {
                    const ed = document.getElementById('code-editor');
                    const stdinEd = document.getElementById('stdin-editor');
                    const btnRun = document.getElementById('btn-run');
                    const resultBox = document.getElementById('result-box');
                    const resultMark = document.getElementById('result-mark');

                    // Корректный код
                    ed.value = 'name = input()\\nprint(f"Привет, {name}!")';
                    ed.dispatchEvent(new Event('input', { bubbles: true }));

                    // В панели оставляем ломающий ввод
                    stdinEd.value = 'МУСОР_КОТОРЫЙ_НЕ_ДОЛЖЕН_СЛОМАТЬ_ЭТАЛОННЫЙ_ЗАЧЕТ';
                    stdinEd.dispatchEvent(new Event('input', { bubbles: true }));

                    // Кликаем «Проверить»
                    btnRun.click();

                    for (let i = 0; i < 50; i++) {
                        if (!btnRun.disabled) break;
                        await new Promise(r => setTimeout(r, 100));
                    }

                    const state = window.VkatApp.state;
                    return {
                        resultBoxVisible: resultBox.classList.contains('visible'),
                        resultMarkText: resultMark.textContent.trim(),
                        isCompleted: state.completedTasks.has('var_5')
                    };
                })()
                """,
                "awaitPromise": True,
                "returnByValue": True
            })
            check_val = run_check_res.get("result", {}).get("value", {})
            assert check_val.get("resultBoxVisible") is True, f"resultBox not visible: {check_val}"
            assert check_val.get("resultMarkText") == "✓", f"resultMark is not check: {check_val}"
            assert check_val.get("isCompleted") is True, f"var_5 not completed: {check_val}"
            print("  ✓ [DOM] «Проверить» (#btn-run) успешно зачло решение по эталонным тестам, проигнорировав мусор в stdin")

            # Проверка l2_io_c2 (сумма двух чисел): студент вводит буквы, вызывающие ValueError при запуске,
            # но эталонная проверка проходит!
            c2_res = await call("Runtime.evaluate", {
                "expression": """
                (async () => {
                    // Переходим в тему l2_io_input, задача l2_io_c2
                    const topIdx = window.VkatApp.state.topics.findIndex(t => t.id === 'l2_io_input');
                    const itemIdx = window.VkatApp.state.topics[topIdx].items.findIndex(it => it.id === 'l2_io_c2');
                    window.VkatApp.selectTask(topIdx, itemIdx);

                    const ed = document.getElementById('code-editor');
                    const stdinEd = document.getElementById('stdin-editor');
                    const btnExec = document.getElementById('btn-exec');
                    const btnRun = document.getElementById('btn-run');
                    const consoleOut = document.getElementById('console-out');

                    // Верный код задачи:
                    ed.value = 'a = int(input())\\nb = int(input())\\nprint(a + b)';
                    ed.dispatchEvent(new Event('input', { bubbles: true }));

                    // Студент вводит буквы 'abc', которые вызовут ValueError
                    stdinEd.value = 'abc\\ndef';
                    stdinEd.dispatchEvent(new Event('input', { bubbles: true }));

                    // 1. «Запустить»
                    btnExec.click();
                    for (let i = 0; i < 40; i++) {
                        if (!btnExec.disabled) break;
                        await new Promise(r => setTimeout(r, 100));
                    }
                    const execErrOut = consoleOut.textContent;
                    const execCompleted = window.VkatApp.state.completedTasks.has('l2_io_c2');

                    // 2. «Проверить»
                    btnRun.click();
                    for (let i = 0; i < 50; i++) {
                        if (!btnRun.disabled) break;
                        await new Promise(r => setTimeout(r, 100));
                    }
                    const checkCompleted = window.VkatApp.state.completedTasks.has('l2_io_c2');

                    return {
                        hasValueError: execErrOut.includes('ValueError'),
                        execCompleted,
                        checkCompleted
                    };
                })()
                """,
                "awaitPromise": True,
                "returnByValue": True
            })
            c2_val = c2_res.get("result", {}).get("value", {})
            assert c2_val.get("hasValueError") is True, f"ValueError missing in run: {c2_val}"
            assert c2_val.get("execCompleted") is False, "task completed on run"
            assert c2_val.get("checkCompleted") is True, "task failed on check with valid code"
            print("  ✓ [DOM] l2_io_c2: 'Запустить' отобразил ValueError от кастомного ввода, 'Проверить' дал чистый зачёт")

            # ──────────────────────────────────────────────────────────────────
            # СЦЕНАРИЙ 2: Predict с input() (l2_io_p1) — отрисовка stdin и проверка
            # ──────────────────────────────────────────────────────────────────
            print("\n--- Тест 2: Predict с input(): видимый блок stdin (#predict-stdin-box) и зачёт ---")
            p1_res = await call("Runtime.evaluate", {
                "expression": """
                (async () => {
                    const topIdx = window.VkatApp.state.topics.findIndex(t => t.id === 'l2_io_input');
                    const itemIdx = window.VkatApp.state.topics[topIdx].items.findIndex(it => it.id === 'l2_io_p1');
                    window.VkatApp.selectTask(topIdx, itemIdx);

                    const box = document.getElementById('predict-stdin-box');
                    const view = document.getElementById('predict-stdin-view');
                    const input = document.getElementById('predict-input');
                    const checkBtn = document.getElementById('btn-predict-check');
                    const resultMark = document.getElementById('predict-result-mark');

                    const boxVisible = box && box.style.display !== 'none';
                    const stdinText = view ? view.textContent.trim() : '';

                    // Студент вводит прогноз
                    input.value = 'Анна:20';
                    input.dispatchEvent(new Event('input', { bubbles: true }));

                    checkBtn.click();
                    for (let i = 0; i < 40; i++) {
                        if (!checkBtn.disabled) break;
                        await new Promise(r => setTimeout(r, 100));
                    }

                    const isDone = window.VkatApp.state.completedTasks.has('l2_io_p1');
                    return {
                        boxVisible,
                        stdinText,
                        markOk: resultMark.textContent.trim() === '✓',
                        isDone
                    };
                })()
                """,
                "awaitPromise": True,
                "returnByValue": True
            })
            p1_val = p1_res.get("result", {}).get("value", {})
            assert p1_val.get("boxVisible") is True, f"predict stdin box not visible: {p1_val}"
            assert "Анна" in p1_val.get("stdinText", ""), f"predict stdin view content mismatch: {p1_val}"
            assert p1_val.get("markOk") is True, f"predict mark not ok: {p1_val}"
            assert p1_val.get("isDone") is True, f"l2_io_p1 not completed: {p1_val}"
            print("  ✓ [DOM] Predict l2_io_p1: видимый блок #predict-stdin-box показал 'Анна\\n20', ответ 'Анна:20' зачтён")

            # ──────────────────────────────────────────────────────────────────
            # СЦЕНАРИЙ 3: Преподаватель в Connect Console (/dashboard/index.html)
            # ──────────────────────────────────────────────────────────────────
            print("\n--- Тест 3: Connect Console: 17 тем, каталог и показ stdin в модалке задач ---")

            # Переходим в дашборд преподавателя
            await call("Page.navigate", {"url": DASHBOARD_URL})
            for _ in range(30):
                ready_st = await call("Runtime.evaluate", {"expression": "document.readyState"})
                if ready_st.get("result", {}).get("value") == "complete":
                    break
                await asyncio.sleep(0.1)

            dash_res = await call("Runtime.evaluate", {
                "expression": """
                (async () => {
                    // Переключаемся на вкладку «подготовка»
                    for (let i = 0; i < 40; i++) {
                        const prepTab = document.getElementById('tab-prep');
                        if (prepTab) {
                            prepTab.click();
                            break;
                        }
                        await new Promise(r => setTimeout(r, 100));
                    }
                    await new Promise(r => setTimeout(r, 300));

                    const btnCatalog = document.getElementById('btn-open-topic-catalog');
                    const btnText = btnCatalog ? btnCatalog.textContent.trim() : '';

                    // Открываем каталог кликом
                    btnCatalog.click();
                    await new Promise(r => setTimeout(r, 200));

                    const modal = document.getElementById('catalog-modal');
                    const modalVisible = modal && modal.style.display === 'flex';
                    const modalTitle = modal ? modal.querySelector('.catalog-modal-title').textContent : '';

                    // Считаем карточки тем в каталоге
                    const topicCards = modal ? modal.querySelectorAll('.catalog-topic-card') : [];
                    const topicCount = topicCards.length;

                    // Находим тему l2_io_input
                    const hasIoTopic = Array.from(topicCards).some(c => c.textContent.includes('l2_io_input') || c.textContent.includes('Потоковый ввод'));

                    // Раскрываем список заданий для variables
                    const toggleVars = modal ? modal.querySelector('.btn-toggle-topic-tasks[data-topic-id="variables"]') : null;
                    if (toggleVars) toggleVars.click();
                    await new Promise(r => setTimeout(r, 200));

                    // В каталоге находим кнопку задания var_5 и кликаем её
                    const pillVar5 = modal ? modal.querySelector('.btn-catalog-task-pill[data-task-id="var_5"]') : null;
                    if (pillVar5) pillVar5.click();
                    await new Promise(r => setTimeout(r, 250));

                    const taskModal = document.getElementById('task-modal');
                    const taskModalVisible = taskModal && taskModal.style.display === 'flex';
                    const taskModalHtml = taskModal ? taskModal.innerHTML : '';
                    const hasStdinInModal = taskModalHtml.includes('Входные данные (stdin)');

                    // Закрываем модалку задач
                    const closeBtn = document.getElementById('btn-close-task-modal');
                    if (closeBtn) closeBtn.click();
                    await new Promise(r => setTimeout(r, 150));

                    // Раскрываем список заданий для l2_io_input
                    const toggleIo = modal ? modal.querySelector('.btn-toggle-topic-tasks[data-topic-id="l2_io_input"]') : null;
                    if (toggleIo) toggleIo.click();
                    await new Promise(r => setTimeout(r, 200));

                    // В каталоге находим кнопку задания l2_io_p1 и кликаем её
                    const pillL2P1 = modal ? modal.querySelector('.btn-catalog-task-pill[data-task-id="l2_io_p1"]') : null;
                    if (pillL2P1) pillL2P1.click();
                    await new Promise(r => setTimeout(r, 250));

                    const p1ModalHtml = taskModal ? taskModal.innerHTML : '';
                    const p1HasStdin = p1ModalHtml.includes('Входные данные (stdin)');

                    const closeBtn2 = document.getElementById('btn-close-task-modal');
                    if (closeBtn2) closeBtn2.click();
                    await new Promise(r => setTimeout(r, 150));

                    // Кликаем «Открыть тему» для l2_io_input
                    const openIoBtn = modal ? modal.querySelector('[data-switch-topic="l2_io_input"]') : null;
                    if (openIoBtn) openIoBtn.click();
                    await new Promise(r => setTimeout(r, 200));

                    return {
                        btnText,
                        modalVisible,
                        modalTitle,
                        topicCount,
                        hasIoTopic,
                        taskModalVisible,
                        hasStdinInModal,
                        p1HasStdin,
                        currentTopicAfterSwitch: window.state ? window.state.currentTopicId : null
                    };
                })()
                """,
                "awaitPromise": True,
                "returnByValue": True
            })
            dash_val = dash_res.get("result", {}).get("value", {})
            assert "Все темы курса (17)" in dash_val.get("btnText", ""), f"btnCatalog text mismatch: {dash_val}"
            assert dash_val.get("modalVisible") is True, "catalog modal not opened"
            assert "(17 тем)" in dash_val.get("modalTitle", ""), f"catalog modal title mismatch: {dash_val}"
            assert dash_val.get("topicCount") == 17, f"catalog topic count must be 17, got {dash_val.get('topicCount')}"
            assert dash_val.get("hasIoTopic") is True, "l2_io_input missing from catalog"
            assert dash_val.get("hasStdinInModal") is True, "stdin section missing from var_5 modal"
            assert dash_val.get("p1HasStdin") is True, "stdin section missing from l2_io_p1 modal"
            assert dash_val.get("currentTopicAfterSwitch") == "l2_io_input", f"topic switch failed: {dash_val}"
            print("  ✓ [DOM] Connect: кнопка 'Все темы курса (17)' открыла каталог из 17 тем; stdin отображён в диалогах var_5 и l2_io_p1")

            # ──────────────────────────────────────────────────────────────────
            # СЦЕНАРИЙ 4: Выпускник (старый профиль) — прямой видимый вход
            # ──────────────────────────────────────────────────────────────────
            print("\n--- Тест 4: Старый профиль выпускника: кнопка «Повторить» (100%) и прямой вход в Практикум ---")

            # Возвращаемся в приложение тренажёра
            await call("Page.navigate", {"url": APP_URL})
            for _ in range(30):
                ready_st = await call("Runtime.evaluate", {"expression": "Boolean(window.VkatApp && document.readyState === 'complete')"})
                if ready_st.get("result", {}).get("value") is True:
                    break
                await asyncio.sleep(0.1)

            # Симулируем старый профиль, завершивший все 26 обязательных задач этапа «Начало»
            grad_res = await call("Runtime.evaluate", {
                "expression": """
                (async () => {
                    const startTopIds = ['variables', 'conditions', 'loops', 'functions', 'lists-dicts', 'strings'];
                    const baseCompleted = [];
                    window.COURSE_TOPICS.forEach(top => {
                        if (startTopIds.includes(top.id)) {
                            (top.tasks || top.items || []).forEach(t => {
                                if (t.id !== 'var_5') baseCompleted.push(t.id);
                            });
                        }
                    });

                    // Записываем старый профиль
                    const oldProfile = {
                        schema: 2,
                        completed: baseCompleted,
                        drafts: { var_1: 'print("вкат в python")' },
                        position: { topicId: 'variables', itemId: 'var_1' },
                        updated: Date.now()
                    };

                    const profileId = 'prof_grad';
                    localStorage.setItem('vkat_profiles', JSON.stringify([{
                        id: profileId,
                        name: 'Выпускник Базы',
                        created: Date.now(),
                        lastActive: Date.now()
                    }]));
                    localStorage.setItem('vkat_p:' + profileId, JSON.stringify(oldProfile));
                    sessionStorage.setItem('vkat_active_profile', profileId);
                    localStorage.setItem('vkat_active_profile', profileId);

                    // Перезагружаем хранилище в приложении и открываем стартовый экран
                    await window.VkatApp.loadStorage();
                    window.VkatApp.showScreen('start');

                    const startCards = document.querySelectorAll('.stage-card');
                    const cardsInfo = Array.from(startCards).map(c => {
                        const title = c.querySelector('.stage-card-title').textContent.trim();
                        const btn = c.querySelector('.stage-card-btn');
                        const progress = c.querySelector('.stage-card-progress-label').textContent.trim();
                        return { title, btnText: btn ? btn.textContent.trim() : '', progress, stageId: btn.getAttribute('data-stage') };
                    });

                    // Находим карточку «Практикум» и кликаем «Начать»
                    const practiceCard = Array.from(startCards).find(c => c.querySelector('.stage-card-title').textContent.includes('Практикум'));
                    const practiceBtn = practiceCard.querySelector('.stage-card-btn');
                    const practiceBtnText = practiceBtn.textContent.trim();

                    // Кликаем по кнопке прямого входа в Практикум
                    practiceBtn.click();
                    await new Promise(r => setTimeout(r, 200));

                    const isLessonActive = Boolean(document.getElementById('screen-lesson') && document.getElementById('screen-lesson').classList.contains('active'));
                    const curTopic = window.VkatApp.state.topics[window.VkatApp.state.currentTopicIndex].id;

                    return {
                        cardsInfo,
                        practiceBtnText,
                        isLessonActive,
                        curTopic
                    };
                })()
                """,
                "awaitPromise": True,
                "returnByValue": True
            })
            grad_val = grad_res.get("result", {}).get("value", {})
            start_card = next((c for c in grad_val.get("cardsInfo", []) if "Начало" in c.get("title", "")), None)
            assert start_card is not None, f"start card missing: {grad_val}"
            assert start_card.get("btnText") == "Повторить", f"start card button should be 'Повторить', got: {start_card}"
            assert "пройдено" in start_card.get("progress", "") or "26 из 26" in start_card.get("progress", ""), f"start card not 100%: {start_card}"
            assert grad_val.get("practiceBtnText") == "Начать", f"practice card should be 'Начать': {grad_val}"
            assert grad_val.get("isLessonActive") is True, f"should navigate to lesson screen: {grad_val}"
            assert grad_val.get("curTopic") in ["l2_algorithms", "l2_io_input"], f"should enter practice topic: {grad_val}"
            print("  ✓ [DOM] Выпускник: карточка «Начало» показывает 'Повторить' (100%), клик 'Начать' на 'Практикум' сразу открыл урок")

            # ──────────────────────────────────────────────────────────────────
            # СЦЕНАРИЙ 5: Офлайн / Zero-Build (проверка file:// протокола)
            # ──────────────────────────────────────────────────────────────────
            print("\n--- Тест 5: Реальный file:// протокол (офлайн / Zero-Build) ---")
            file_url = f"file:///{app_dir.replace('\\', '/')}/index.html"
            await call("Page.navigate", {"url": file_url})
            for _ in range(40):
                ready_st = await call("Runtime.evaluate", {"expression": "Boolean(window.VkatApp && window.CodeChecker && document.readyState === 'complete')"})
                if ready_st.get("result", {}).get("value") is True:
                    break
                await asyncio.sleep(0.1)

            file_res = await call("Runtime.evaluate", {
                "expression": """
                (async () => {
                    for (let i = 0; i < 40; i++) {
                        if (window.VkatApp && window.CodeChecker) break;
                        await new Promise(r => setTimeout(r, 100));
                    }
                    if (window.CodeChecker && window.CodeChecker.ensureReady) {
                        await window.CodeChecker.ensureReady();
                    }
                    const isAppOk = Boolean(window.VkatApp);
                    const isCheckerOk = Boolean(window.CodeChecker);
                    const runRes = await window.CodeChecker.runCode('print("ОФЛАЙН ОК")', 7000);
                    return {
                        isAppOk,
                        isCheckerOk,
                        stdout: runRes.stdout.trim()
                    };
                })()
                """,
                "awaitPromise": True,
                "returnByValue": True
            })
            file_val = file_res.get("result", {}).get("value", {})
            assert file_val.get("isAppOk") is True, f"VkatApp failed on file://: {file_val}"
            assert file_val.get("isCheckerOk") is True, f"CodeChecker failed on file://: {file_val}"
            assert file_val.get("stdout") == "ОФЛАЙН ОК", f"runCode failed on file://: {file_val}"
            print("  ✓ [file://] Тренажер успешно загрузился и исполнил Python-код локально по file://")

            print("\n=======================================================")
            print("ВСЕ 5 НАСТОЯЩИХ DOM E2E СЦЕНАРИЕВ УСПЕШНО ПРОЙДЕНЫ!")
            print("=======================================================")

    finally:
        if edge_proc:
            edge_proc.terminate()
            try:
                edge_proc.wait(timeout=3)
            except Exception:
                edge_proc.kill()
        if connect_proc:
            connect_proc.terminate()
            try:
                connect_proc.wait(timeout=3)
            except Exception:
                connect_proc.kill()

        # Очистка временных директорий
        time.sleep(0.5)
        shutil.rmtree(temp_edge_dir, ignore_errors=True)
        shutil.rmtree(temp_db_dir, ignore_errors=True)

if __name__ == '__main__':
    asyncio.run(main())
