import asyncio
import json
import os
import subprocess
import time
import urllib.request
import websockets
import base64
import sys

EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
PORT = 9222
USER_DATA_DIR = r"C:\Users\azis\Desktop\vkat_py\dev\.edge_profile"
URL = "http://localhost:8085"

async def run():
    os.makedirs(USER_DATA_DIR, exist_ok=True)
    cmd = [
        EDGE_PATH,
        f"--remote-debugging-port={PORT}",
        f"--user-data-dir={USER_DATA_DIR}",
        "--remote-allow-origins=*",
        "--headless=new",
        "--window-size=1280,850",
        URL
    ]
    proc = subprocess.Popen(cmd)
    try:
        ws_url = None
        for _ in range(30):
            try:
                resp = urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json/list", timeout=1)
                targets = json.loads(resp.read().decode('utf-8'))
                for t in targets:
                    if t.get("type") == "page" and "8085" in t.get("url", ""):
                        ws_url = t.get("webSocketDebuggerUrl")
                        break
                if ws_url:
                    break
            except Exception:
                time.sleep(0.3)

        if not ws_url:
            print("Failed to find page target on port 9222")
            sys.exit(1)

        print("Connected to target:", ws_url)
        async with websockets.connect(ws_url) as ws:
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
                        return res.get("result")

            await call("Page.enable")
            await call("Runtime.enable")

            # Wait for VkatApp to initialize
            for _ in range(30):
                res = await call("Runtime.evaluate", {
                    "expression": "typeof window.VkatApp !== 'undefined' && typeof window.VkatLife !== 'undefined'",
                    "returnByValue": True
                })
                if res.get("result", {}).get("value") is True:
                    break
                await asyncio.sleep(0.2)

            # Clear any previously saved life_tour_completed
            await call("Runtime.evaluate", {
                "expression": "if (window.VkatStorage) window.VkatStorage.setSetting('life_tour_completed', null);",
                "returnByValue": True
            })

            # Navigate to screen 'life'
            print("Navigating to screen 'life'...")
            await call("Runtime.evaluate", {
                "expression": "window.VkatApp.showScreen('life')",
                "returnByValue": True
            })
            await asyncio.sleep(0.5)

            # Test Step 1 of Tour
            print("Testing Tour Step 1 (Solitude)...")
            eval_step1 = await call("Runtime.evaluate", {
                "expression": """
                (() => {
                    const card = document.getElementById('life-tour-card');
                    const isVisible = card && card.style.display !== 'none';
                    const btnSpawn1 = document.getElementById('btn-tour-act-spawn-1');
                    if (btnSpawn1) btnSpawn1.click();
                    const S = window.VkatLife._state;
                    const popAfterSpawn = S.grid.reduce((acc, v) => acc + v, 0);

                    const btnStep1 = document.getElementById('btn-tour-act-step-1');
                    if (btnStep1) btnStep1.click();
                    const popAfterStep = S.grid.reduce((acc, v) => acc + v, 0);
                    const resBox = document.getElementById('life-tour-result');
                    const hasResultText = resBox && resBox.style.display !== 'none' && resBox.innerText.includes('исчезла');

                    return {
                        tourCardVisible: isVisible,
                        popAfterSpawn,
                        popAfterStep,
                        hasResultText
                    };
                })()
                """,
                "returnByValue": True
            })
            print("Tour Step 1 Result:", json.dumps(eval_step1.get("result", {}).get("value"), indent=2, ensure_ascii=False))

            # Advance to Step 2
            print("Testing Tour Step 2 (Blinker)...")
            eval_step2 = await call("Runtime.evaluate", {
                "expression": """
                (() => {
                    const nextBtn = document.getElementById('btn-tour-next-2');
                    if (nextBtn) nextBtn.click();

                    const S = window.VkatLife._state;
                    const isStep2 = S.tourStep === 2;

                    const btnSpawn2 = document.getElementById('btn-tour-act-spawn-2');
                    if (btnSpawn2) btnSpawn2.click();

                    const popBlinker = S.grid.reduce((acc, v) => acc + v, 0);
                    const isRunning = S.running;

                    return {
                        isStep2,
                        popBlinker,
                        isRunning
                    };
                })()
                """,
                "returnByValue": True
            })
            print("Tour Step 2 Result:", json.dumps(eval_step2.get("result", {}).get("value"), indent=2, ensure_ascii=False))
            await asyncio.sleep(0.5)

            # Advance to Step 3
            print("Testing Tour Step 3 (Glider)...")
            eval_step3 = await call("Runtime.evaluate", {
                "expression": """
                (() => {
                    const nextBtn = document.getElementById('btn-tour-next-3');
                    if (nextBtn) nextBtn.click();

                    const S = window.VkatLife._state;
                    const isStep3 = S.tourStep === 3;

                    const btnSpawn3 = document.getElementById('btn-tour-act-spawn-3');
                    if (btnSpawn3) btnSpawn3.click();

                    const popGlider = S.grid.reduce((acc, v) => acc + v, 0);
                    const isRunning = S.running;

                    return {
                        isStep3,
                        popGlider,
                        isRunning
                    };
                })()
                """,
                "returnByValue": True
            })
            print("Tour Step 3 Result:", json.dumps(eval_step3.get("result", {}).get("value"), indent=2, ensure_ascii=False))
            await asyncio.sleep(0.8)

            # Capture screenshot of the tour card and glider
            print("Capturing screenshot of Tour...")
            shot = await call("Page.captureScreenshot", {"format": "png"})
            img_data = base64.b64decode(shot["data"])
            out_path = r"C:\Users\azis\.gemini\antigravity\brain\44e9cb7b-26d2-4a1e-951d-23595e493fff\life_tour_screen.png"
            with open(out_path, "wb") as f:
                f.write(img_data)
            print("Screenshot written to:", out_path)

            # Finish Tour
            eval_finish = await call("Runtime.evaluate", {
                "expression": """
                (() => {
                    const btnFinish = document.getElementById('btn-tour-finish');
                    if (btnFinish) btnFinish.click();

                    const S = window.VkatLife._state;
                    const card = document.getElementById('life-tour-card');
                    const isHidden = !card || card.style.display === 'none';
                    const isSaved = window.VkatStorage && window.VkatStorage.getSetting('life_tour_completed', false);

                    return {
                        tourActiveAfterFinish: S.tourActive,
                        cardHidden: isHidden,
                        isSaved
                    };
                })()
                """,
                "returnByValue": True
            })
            print("Tour Finish Result:", json.dumps(eval_finish.get("result", {}).get("value"), indent=2, ensure_ascii=False))

    finally:
        proc.terminate()
        try:
            proc.wait(timeout=2)
        except Exception:
            proc.kill()

if __name__ == "__main__":
    asyncio.run(run())
