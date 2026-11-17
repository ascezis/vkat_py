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
    # Start Edge
    os.makedirs(USER_DATA_DIR, exist_ok=True)
    cmd = [
        EDGE_PATH,
        f"--remote-debugging-port={PORT}",
        f"--user-data-dir={USER_DATA_DIR}",
        "--remote-allow-origins=*",
        "--headless=new",
        "--window-size=1280,800",
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

            # Show life screen
            print("Navigating to screen 'life'...")
            await call("Runtime.evaluate", {
                "expression": "window.VkatApp.showScreen('life')",
                "returnByValue": True
            })
            await asyncio.sleep(0.5)

            # Test drawing on canvas
            print("Simulating canvas drawing...")
            eval_res = await call("Runtime.evaluate", {
                "expression": """
                (() => {
                    const canvas = document.getElementById('life-main-canvas');
                    const rect = canvas.getBoundingClientRect();
                    const S = window.VkatLife._state;

                    const cellW = rect.width / 50;
                    const cellH = rect.height / 50;

                    // 1. Draw single cell at (25, 25)
                    const targetX = 25;
                    const targetY = 25;
                    const clientX = rect.left + (targetX + 0.5) * cellW;
                    const clientY = rect.top + (targetY + 0.5) * cellH;

                    S.grid[targetY * 50 + targetX] = 0;

                    canvas.dispatchEvent(new MouseEvent('mousedown', {
                        clientX: clientX,
                        clientY: clientY,
                        button: 0,
                        bubbles: true,
                        cancelable: true
                    }));

                    const cellDrawn = S.grid[targetY * 50 + targetX];

                    window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

                    // 2. Drag to draw a glider pattern:
                    // Glider coordinates at (10, 10):
                    // . X .
                    // . . X
                    // X X X
                    const gliderOffsets = [
                        [1, 0],
                        [2, 1],
                        [0, 2], [1, 2], [2, 2]
                    ];
                    gliderOffsets.forEach(([dx, dy]) => {
                        const gx = 10 + dx;
                        const gy = 10 + dy;
                        const cx = rect.left + (gx + 0.5) * cellW;
                        const cy = rect.top + (gy + 0.5) * cellH;
                        canvas.dispatchEvent(new MouseEvent('mousedown', {
                            clientX: cx,
                            clientY: cy,
                            button: 0,
                            bubbles: true,
                            cancelable: true
                        }));
                        window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
                    });

                    const gliderCellsState = gliderOffsets.map(([dx, dy]) => S.grid[(10 + dy) * 50 + (10 + dx)]);

                    // 3. Test erase on cell (25, 25) using right click (button 2)
                    canvas.dispatchEvent(new MouseEvent('mousedown', {
                        clientX: clientX,
                        clientY: clientY,
                        button: 2,
                        bubbles: true,
                        cancelable: true
                    }));
                    window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
                    const erasedCell = S.grid[targetY * 50 + targetX];

                    return {
                        singleCellDrawn: cellDrawn === 1,
                        gliderDrawn: gliderCellsState.every(v => v === 1),
                        eraseCellSuccess: erasedCell === 0,
                        population: S.grid.reduce((acc, v) => acc + v, 0)
                    };
                })()
                """,
                "returnByValue": True
            })

            test_result = eval_res.get("result", {}).get("value")
            print("Test result:", json.dumps(test_result, indent=2, ensure_ascii=False))

            # Take screenshot of the screen with the drawn glider
            print("Capturing screenshot...")
            shot = await call("Page.captureScreenshot", {"format": "png"})
            img_data = base64.b64decode(shot["data"])
            out_path = r"C:\Users\azis\.gemini\antigravity\brain\44e9cb7b-26d2-4a1e-951d-23595e493fff\life_canvas_drawn.png"
            with open(out_path, "wb") as f:
                f.write(img_data)
            print("Screenshot written to:", out_path)
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=2)
        except Exception:
            proc.kill()

if __name__ == "__main__":
    asyncio.run(run())
