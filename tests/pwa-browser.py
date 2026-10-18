"""Verify the production subdirectory PWA, including real waiting-worker lifecycle."""
import functools
import hashlib
import http.server
import json
import os
import re
import shutil
import tempfile
import threading
from pathlib import Path
from playwright.sync_api import sync_playwright, expect


def run():
    dist = Path('dist').resolve()
    assert 'start_url' in (dist / 'manifest.webmanifest').read_text()
    results = []
    with tempfile.TemporaryDirectory(prefix='circuit-pwa-') as directory:
        root = Path(directory)
        installed = root / 'Circuit'
        shutil.copytree(dist, installed)
        blocked = [False]
        class Handler(http.server.SimpleHTTPRequestHandler):
            def log_message(self, *args): pass
            def do_GET(self):
                if blocked[0] and self.path.split('?')[0].endswith('.mp3'):
                    self.send_error(503); return
                super().do_GET()
        server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Handler, directory=str(root)))
        threading.Thread(target=server.serve_forever, daemon=True).start()
        origin = f'http://127.0.0.1:{server.server_port}'
        url = origin + '/Circuit/'
        with sync_playwright() as playwright:
            options = {'headless': True}
            if os.getenv('CIRCUIT_CHROMIUM'): options['executable_path'] = os.environ['CIRCUIT_CHROMIUM']
            if os.getenv('CIRCUIT_CHROMIUM_ARGS'): options['args'] = json.loads(os.environ['CIRCUIT_CHROMIUM_ARGS'])
            browser = playwright.chromium.launch(**options)
            for width, height in [(1440,900),(412,915),(568,320),(844,390)]:
                context = browser.new_context(viewport={'width':width, 'height':height})
                page = context.new_page(); page.goto(url)
                page.get_by_role('button', name='安装与离线', exact=True).click()
                expect(page.get_by_role('status').filter(has_text='离线资源已就绪')).to_be_visible(timeout=90000)
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
                page.keyboard.press('Escape')
                page.get_by_role('button', name='开始抢修', exact=True).click()
                page.wait_for_function("localStorage.getItem('circuit-auto-v100') !== null")
                saved = page.evaluate("localStorage.getItem('circuit-auto-v100')")
                context.set_offline(True); page.reload()
                expect(page.get_by_role('button', name='继续抢修', exact=True)).to_be_visible()
                assert page.evaluate("localStorage.getItem('circuit-auto-v100')") == saved
                context.close(); results.append(f'{width}x{height}:ready/offline/save')
            blocked[0] = True
            context = browser.new_context(); page = context.new_page(); page.goto(url)
            page.get_by_role('button', name='安装与离线', exact=True).click()
            expect(page.get_by_role('status').filter(has_text='离线下载未完成')).to_be_visible(timeout=90000)
            blocked[0] = False
            page.get_by_role('button', name='重试下载', exact=True).click()
            expect(page.get_by_role('status').filter(has_text='离线资源已就绪')).to_be_visible(timeout=90000)
            context.close(); results.append('missing-required-audio:failed/retry/ready')
            context = browser.new_context(); first = context.new_page(); first.goto(url)
            first.wait_for_function('navigator.serviceWorker.controller !== null')
            first.get_by_role('button', name='开始抢修', exact=True).click()
            first.wait_for_function("localStorage.getItem('circuit-auto-v100') !== null")
            saved = first.evaluate("localStorage.getItem('circuit-auto-v100')")
            second = context.new_page(); second.goto(url)
            second.wait_for_function('navigator.serviceWorker.controller !== null')
            second.get_by_role('button', name='安装与离线', exact=True).click()
            expect(second.get_by_role('button', name='检查更新', exact=True)).to_be_enabled()
            second.evaluate('window.initialCircuitController = navigator.serviceWorker.controller')
            observer = context.new_page(); observer.goto(origin + '/')
            original = (installed / 'index.html').read_text()
            changed = original.replace('</head>', '<meta name="circuit-revision" content="two"></head>')
            (installed / 'index.html').write_text(changed)
            sw = (installed / 'sw.js').read_text()
            sw, count = re.subn(r'(url:"(?:/Circuit/)?index.html",revision:")[^"]+', r'\g<1>'+hashlib.md5(changed.encode()).hexdigest(), sw)
            assert count == 1, 'index precache revision must change'
            (installed / 'sw.js').write_text(sw)
            first.evaluate('navigator.serviceWorker.getRegistration().then(r => r.update())')
            first.wait_for_function('navigator.serviceWorker.getRegistration().then(r => r.waiting?.state === "installed")', timeout=90000)
            assert first.locator('meta[name="circuit-revision"]').count() == 0
            assert first.evaluate("localStorage.getItem('circuit-auto-v100')") == saved
            second.wait_for_function('navigator.serviceWorker.getRegistration().then(r => r.waiting?.state === "installed")', timeout=30000)
            first.close()
            second.wait_for_function('navigator.serviceWorker.getRegistration().then(r => r.waiting?.state === "installed")', timeout=30000)
            assert second.evaluate('navigator.serviceWorker.controller === window.initialCircuitController')
            second.close()
            observer.wait_for_function('navigator.serviceWorker.getRegistration("/Circuit/").then(r => r.active?.state === "activated" && !r.waiting)', timeout=90000)
            reopened = context.new_page(); reopened.goto(url)
            assert reopened.locator('meta[name="circuit-revision"]').get_attribute('content') == 'two'
            assert reopened.evaluate("localStorage.getItem('circuit-auto-v100')") == saved
            context.set_offline(True); reopened.reload()
            expect(reopened.get_by_role('button', name='继续抢修', exact=True)).to_be_visible()
            context.close(); browser.close(); results.append('two-windows:waiting/last-close/activate/offline/save')
        server.shutdown()
    Path('artifacts').mkdir(exist_ok=True)
    Path('artifacts/pwa-update-browser.json').write_text(json.dumps({'passed':results},ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'passed':results},ensure_ascii=False))

if __name__ == '__main__': run()
