# Local check of the built site: both pages load without errors, the task's
# Download saves a real .xlsx, and that file uploads back and is graded.
# Usage: uv run python builder/check.py docs   (from the repo root)
import sys, threading, http.server, functools, socketserver
from pathlib import Path
from playwright.sync_api import sync_playwright
root = Path(sys.argv[1]).resolve()
H = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(root)); H.log_message = lambda *a: None
srv = socketserver.TCPServer(("127.0.0.1", 0), H); port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
ok = True
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1280, "height": 900}, accept_downloads=True); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(f"http://127.0.0.1:{port}/sheet-calc.html"); pg.wait_for_timeout(3000)
    with pg.expect_download() as d:
        pg.locator(".sd-stage button").filter(has_text="הורדת הקובץ").click()
    dl = d.value; path = root.parent / "tmp-download.xlsx"; dl.save_as(path)
    print("downloaded:", dl.suggested_filename, path.stat().st_size, "bytes")
    pg.locator('.sd-stage input[type="file"]').set_input_files(str(path)); pg.wait_for_timeout(800)
    pg.locator(".sd-stage button").filter(has_text="סיום").click(); pg.wait_for_timeout(800)
    verdict = [x.inner_text() for x in pg.locator(".sd-stage li, .sd-stage .tov-check-row").all()][:6]
    print("verdict on the untouched file:", verdict)
    path.unlink()
    pg2 = b.new_page(viewport={"width": 1280, "height": 900})
    pg2.on("pageerror", lambda e: errs.append(str(e)))
    pg2.goto(f"http://127.0.0.1:{port}/presentation.html"); pg2.wait_for_timeout(4000)
    print("presentation h2:", [x.inner_text() for x in pg2.locator("h2").all()][:2])
    print("errors:", errs); ok = not errs
    b.close()
srv.shutdown()
sys.exit(0 if ok else 1)
