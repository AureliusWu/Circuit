"""Exercise a generated review page in an isolated real Chromium context.

Python Playwright is optional authoring tooling, never a game dependency.
"""
import argparse
from functools import partial
import hashlib
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
from threading import Thread

from playwright.sync_api import sync_playwright


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_): pass


def run(root, executable=None):
    folder = root / "docs/production/quality-20261023"
    report = json.loads((folder / "media-quality.json").read_text())
    handler = partial(QuietHandler, directory=str(root))
    server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
    Thread(target=server.serve_forever, daemon=True).start()
    url = f"http://127.0.0.1:{server.server_port}/docs/production/quality-20261023/media-review.html"
    results = {"project": report["project"], "runtimeCommit": report["runtimeCommit"],
               "catalogSha256": report["catalogSha256"], "checks": [], "screenshots": []}
    try:
        with sync_playwright() as p:
            options = {"headless": True, "args": ["--no-sandbox", "--no-zygote", "--disable-dev-shm-usage"]}
            if executable: options["executable_path"] = executable
            browser = p.chromium.launch(**options)
            results["browser"] = browser.version
            for label, viewport in [("desktop", {"width": 1440, "height": 900}),
                                    ("phone", {"width": 412, "height": 915})]:
                context = browser.new_context(viewport=viewport, accept_downloads=True)
                page = context.new_page()
                errors = []
                page.on("pageerror", lambda error: errors.append(str(error)))
                page.goto(url)
                page.wait_for_function("document.querySelectorAll('#list .row').length > 0")
                assert page.locator("#list .row").count() == report["summary"]["dialogueBindings"]
                assert page.locator("#decision").input_value() == "pending"
                results["checks"].append(label + ": initial full catalog stays pending")
                page.locator("#audio").evaluate("a => { a.load(); }")
                page.wait_for_function("document.querySelector('#audio').readyState >= 1")
                assert page.locator("#audio").evaluate("a => a.duration > 0")
                page.locator("#audio").evaluate("a => a.play()")
                page.wait_for_function("!document.querySelector('#audio').paused")
                page.locator("#next").click()
                assert page.locator("#audio").evaluate("a => a.paused")
                results["checks"].append(label + ": real local audio decode, play and stop on navigation")
                first = report["audio"][0]
                page.locator("#search").fill(first["id"])
                assert page.locator("#list .row").count() == 1
                malicious = "试听备注 <img src=x onerror=alert(1)> & 原样保留"
                page.locator("#notes").fill(malicious)
                page.locator("#decision").select_option("changes")
                page.reload()
                assert page.locator("#decision").input_value() == "changes"
                assert page.locator("#notes").input_value() == malicious
                assert page.locator("#notes img").count() == 0
                results["checks"].append(label + ": search, editable notes and isolated persistence")
                with page.expect_download() as download_event: page.locator("#export").click()
                download = download_event.value
                exported = json.loads(Path(download.path()).read_text())
                assert exported["runtimeCommit"] == report["runtimeCommit"]
                assert exported["catalogSha256"] == report["catalogSha256"]
                assert exported["notes"][first["id"]] == {"status": "changes", "note": malicious}
                wrong = {**exported, "runtimeCommit": "0" * 40}
                page.locator("#importFile").set_input_files({"name": "wrong.json", "mimeType": "application/json", "buffer": json.dumps(wrong).encode()})
                page.wait_for_function("document.querySelector('#message').textContent.includes('版本或素材摘要不一致')")
                assert page.locator("#decision").input_value() == "changes"
                unknown = {**exported, "notes": {"unknown-id": {"status": "accepted", "note": ""}}}
                page.locator("#importFile").set_input_files({"name": "unknown.json", "mimeType": "application/json", "buffer": json.dumps(unknown).encode()})
                page.wait_for_function("document.querySelector('#message').textContent.includes('未知素材')")
                imported = {**exported, "notes": {first["id"]: {"status": "accepted", "note": "已试听，本条通过"}}}
                page.locator("#importFile").set_input_files({"name": "valid.json", "mimeType": "application/json", "buffer": json.dumps(imported).encode()})
                page.wait_for_function("document.querySelector('#decision').value === 'accepted'")
                results["checks"].append(label + ": JSON export, exact-version import and rejected foreign IDs")
                page.locator("#status").select_option("accepted")
                assert page.locator("#list .row").count() == 1
                page.locator("#status").select_option("pending")
                assert page.locator("#list .row").count() == len(report["audio"]) - 1
                page.locator("#status").select_option("all")
                page.locator("#priority").check()
                assert page.locator("#list .row").count() == sum(bool(item["flags"]) for item in report["audio"])
                page.locator("#priority").uncheck()
                page.locator("#kind").select_option("artwork")
                assert page.locator("#list .row").count() == len(report["artwork"])
                page.wait_for_function("document.querySelector('#art').complete && document.querySelector('#art').naturalWidth > 0")
                assert page.locator("#audio").evaluate("a => a.paused && !a.getAttribute('src')")
                assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")
                results["checks"].append(label + ": status/priority filters, real image and no horizontal overflow")
                # Keep preview records pristine and avoid presenting automated test decisions as human acceptance.
                page.evaluate("localStorage.clear()")
                page.reload()
                assert page.locator("#decision").input_value() == "pending"
                screenshot = folder / f"review-{label}.png"
                page.screenshot(path=str(screenshot), full_page=True)
                results["screenshots"].append({"path": screenshot.name, "sha256": hashlib.sha256(screenshot.read_bytes()).hexdigest(), "viewport": viewport})
                assert not errors, errors
                results["checks"].append(label + ": zero page errors; initial pending state restored")
                context.close()
            context = browser.new_context()
            page = context.new_page()
            page.goto((folder / "media-review.html").as_uri())
            page.locator("#audio").evaluate("a => a.load()")
            page.wait_for_function("document.querySelector('#audio').readyState >= 1")
            page.locator("#kind").select_option("artwork")
            page.wait_for_function("document.querySelector('#art').complete && document.querySelector('#art').naturalWidth > 0")
            results["checks"].append("file URL: standalone page loads local audio and artwork without a server")
            context.close()
            browser.close()
    finally:
        server.shutdown()
        server.server_close()
    results["passed"] = len(results["checks"])
    results["humanListening"] = False
    results["physicalDevice"] = False
    (folder / "review-browser.json").write_text(json.dumps(results, ensure_ascii=False, indent=2) + "\n")
    return results


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, required=True)
    parser.add_argument("--browser")
    args = parser.parse_args()
    result = run(args.root.resolve(), args.browser)
    print(json.dumps({key: result[key] for key in ["project", "browser", "passed", "humanListening", "physicalDevice"]}))
