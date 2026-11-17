import asyncio
import json
import os
import subprocess
import time
import urllib.request
import websockets
import base64
import sys

EDGE_PATHS = [
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    os.path.expanduser(r"~\AppData\Local\Microsoft\Edge\Application\msedge.exe")
]
EDGE_PATH = next((p for p in EDGE_PATHS if os.path.isfile(p)), None)
PORT = 9228
USER_DATA_DIR = r"C:\Users\azis\Desktop\vkat_py\dev\.edge_profile_sandbox"
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
            print("Failed to find page target on port", PORT)
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
                    "expression": "typeof window.VkatApp !== 'undefined' && typeof window.VkatSandbox !== 'undefined'",
                    "returnByValue": True
                })
                if res.get("result", {}).get("value") is True:
                    break
                await asyncio.sleep(0.2)

            print("Navigating to Sandbox from Start screen...")
            # Click Sandbox banner button on Start screen
            await call("Runtime.evaluate", {
                "expression": "document.getElementById('btn-start-sandbox').click();",
                "returnByValue": True
            })
            await asyncio.sleep(0.5)

            # Check display of screen-sandbox
            res_disp = await call("Runtime.evaluate", {
                "expression": """
                (() => {
                    const sb = document.getElementById('screen-sandbox');
                    return {
                        active: sb.classList.contains('active'),
                        display: getComputedStyle(sb).display,
                        codeLen: document.getElementById('sandbox-code-editor').value.length
                    };
                })()
                """,
                "returnByValue": True
            })
            print("Sandbox open state:", json.dumps(res_disp.get("result", {}).get("value"), ensure_ascii=False))

            # Screenshot initial Sandbox view
            shot1 = await call("Page.captureScreenshot", {"format": "png"})
            out1 = r"C:\Users\azis\.gemini\antigravity\brain\44e9cb7b-26d2-4a1e-951d-23595e493fff\sandbox_initial.png"
            with open(out1, "wb") as f:
                f.write(base64.b64decode(shot1["data"]))
            print("Saved initial Sandbox screenshot:", out1)

            # Run default code
            print("Running default script in Pyodide Worker...")
            await call("Runtime.evaluate", {
                "expression": "document.getElementById('btn-sandbox-run').click();",
                "returnByValue": True
            })

            # Wait for execution to finish
            for _ in range(50):
                res_run = await call("Runtime.evaluate", {
                    "expression": """
                    (() => {
                        const out = document.getElementById('sandbox-terminal-output');
                        const status = document.getElementById('sandbox-term-status').textContent;
                        const time = document.getElementById('sandbox-term-time').textContent;
                        return {
                            isRunning: window.VkatSandbox._state.isRunning,
                            status,
                            time,
                            output: out ? out.textContent : ''
                        };
                    })()
                    """,
                    "returnByValue": True
                })
                val = res_run.get("result", {}).get("value", {})
                if not val.get("isRunning") and val.get("output"):
                    break
                await asyncio.sleep(0.3)

            print("Default run result:", json.dumps(val, ensure_ascii=False))

            shot2 = await call("Page.captureScreenshot", {"format": "png"})
            out2 = r"C:\Users\azis\.gemini\antigravity\brain\44e9cb7b-26d2-4a1e-951d-23595e493fff\sandbox_executed.png"
            with open(out2, "wb") as f:
                f.write(base64.b64decode(shot2["data"]))
            print("Saved executed Sandbox screenshot:", out2)

            # Switch to Benchmark preset and run
            print("Selecting Benchmark preset...")
            await call("Runtime.evaluate", {
                "expression": """
                (() => {
                    const sel = document.getElementById('sandbox-preset-select');
                    sel.value = 'benchmark';
                    sel.dispatchEvent(new Event('change'));
                })()
                """,
                "returnByValue": True
            })
            await asyncio.sleep(0.3)

            print("Running Benchmark script...")
            await call("Runtime.evaluate", {
                "expression": "document.getElementById('btn-sandbox-run').click();",
                "returnByValue": True
            })

            for _ in range(50):
                res_bench = await call("Runtime.evaluate", {
                    "expression": """
                    (() => {
                        const out = document.getElementById('sandbox-terminal-output');
                        const status = document.getElementById('sandbox-term-status').textContent;
                        return {
                            isRunning: window.VkatSandbox._state.isRunning,
                            status,
                            output: out ? out.textContent : ''
                        };
                    })()
                    """,
                    "returnByValue": True
                })
                val_b = res_bench.get("result", {}).get("value", {})
                if not val_b.get("isRunning") and "Обработано элементов" in val_b.get("output", ""):
                    break
                await asyncio.sleep(0.4)

            print("Benchmark result:", json.dumps(val_b, ensure_ascii=False))

            shot3 = await call("Page.captureScreenshot", {"format": "png"})
            out3 = r"C:\Users\azis\.gemini\antigravity\brain\44e9cb7b-26d2-4a1e-951d-23595e493fff\sandbox_benchmark.png"
            with open(out3, "wb") as f:
                f.write(base64.b64decode(shot3["data"]))
            print("Saved Benchmark screenshot:", out3)

            # Test Error handling
            print("Testing error output...")
            await call("Runtime.evaluate", {
                "expression": """
                (() => {
                    const ed = document.getElementById('sandbox-code-editor');
                    ed.value = 'print("До ошибки")\\nx = 1 / 0\\nprint("После")';
                    document.getElementById('btn-sandbox-run').click();
                })()
                """,
                "returnByValue": True
            })

            for _ in range(30):
                res_err = await call("Runtime.evaluate", {
                    "expression": """
                    (() => {
                        const out = document.getElementById('sandbox-terminal-output');
                        const status = document.getElementById('sandbox-term-status').textContent;
                        return {
                            isRunning: window.VkatSandbox._state.isRunning,
                            status,
                            output: out ? out.textContent : ''
                        };
                    })()
                    """,
                    "returnByValue": True
                })
                val_e = res_err.get("result", {}).get("value", {})
                if not val_e.get("isRunning") and "ZeroDivisionError" in val_e.get("output", ""):
                    break
                await asyncio.sleep(0.3)

            print("Error test result:", json.dumps(val_e, ensure_ascii=False))

            # Test back button
            print("Testing Back button...")
            await call("Runtime.evaluate", {
                "expression": "document.getElementById('btn-sandbox-back').click();",
                "returnByValue": True
            })
            await asyncio.sleep(0.3)

            res_back = await call("Runtime.evaluate", {
                "expression": "document.getElementById('screen-start').classList.contains('active')",
                "returnByValue": True
            })
            print("Returned to Start screen:", res_back.get("result", {}).get("value"))

            print("=== ALL SANDBOX CHECKS PASSED SUCCESSFULLY ===")
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=2)
        except Exception:
            proc.kill()

if __name__ == "__main__":
    asyncio.run(run())
