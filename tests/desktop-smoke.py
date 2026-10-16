#!/usr/bin/env python3
"""Exercise the installed Tauri executable through its real WebView2 control."""
import argparse
from contextlib import contextmanager
import ctypes
import hashlib
import json
import os
from pathlib import Path
import socket
import subprocess
import tempfile
import time
import urllib.request

from playwright.sync_api import expect, sync_playwright


def close_window(process):
    if process.poll() is not None:
        return
    user32 = ctypes.WinDLL('user32', use_last_error=True)
    callback_type = ctypes.WINFUNCTYPE(ctypes.c_bool, ctypes.c_void_p, ctypes.c_void_p)

    @callback_type
    def close(handle, _):
        pid = ctypes.c_ulong()
        user32.GetWindowThreadProcessId(ctypes.c_void_p(handle), ctypes.byref(pid))
        if pid.value == process.pid:
            user32.PostMessageW(ctypes.c_void_p(handle), 0x0010, 0, 0)
        return True

    user32.EnumWindows(close, 0)
    try:
        process.wait(timeout=20)
    except subprocess.TimeoutExpired:
        subprocess.run(['taskkill', '/PID', str(process.pid), '/T', '/F'], check=False)
        process.wait(timeout=10)
        raise AssertionError('Installed application did not close normally')
    assert process.returncode == 0, f'Application exit code: {process.returncode}'


@contextmanager
def launch(playwright, executable, profile, log_directory, attempt):
    with socket.socket() as listener:
        listener.bind(('127.0.0.1', 0))
        port = listener.getsockname()[1]
    environment = dict(os.environ,
                       WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=f'--remote-debugging-port={port}',
                       WEBVIEW2_USER_DATA_FOLDER=str(profile))
    browser = None
    with (log_directory / f'{attempt}-stdout.txt').open('wb') as stdout, \
            (log_directory / f'{attempt}-stderr.txt').open('wb') as stderr:
        process = subprocess.Popen([str(executable)], env=environment, stdout=stdout, stderr=stderr)
        try:
            deadline = time.monotonic() + 60
            while time.monotonic() < deadline:
                assert process.poll() is None, f'Application exited before WebView2 started: {process.returncode}'
                try:
                    with urllib.request.urlopen(f'http://127.0.0.1:{port}/json/version', timeout=1) as response:
                        endpoint = json.load(response)['webSocketDebuggerUrl']
                    break
                except (OSError, KeyError, ValueError):
                    time.sleep(0.2)
            else:
                raise AssertionError('Installed WebView2 debugging endpoint did not start')
            browser = playwright.chromium.connect_over_cdp(endpoint)
            deadline = time.monotonic() + 30
            page = None
            while time.monotonic() < deadline:
                pages = [page for context in browser.contexts for page in context.pages
                         if page.url != 'about:blank']
                if pages:
                    page = pages[0]
                    break
                time.sleep(0.2)
            assert page is not None, 'Installed game did not load a document'
            page.set_default_timeout(15000)
            yield page
        finally:
            close_window(process)
            if browser:
                browser.close()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--exe', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    arguments = parser.parse_args()
    assert os.name == 'nt', 'This check requires actual Windows execution'
    executable = arguments.exe.resolve(strict=True)
    arguments.output.parent.mkdir(parents=True, exist_ok=True)
    version = json.loads(Path('package.json').read_text(encoding='utf-8'))['version']
    result = dict(version=version, executable=str(executable),
                  executable_sha256=hashlib.sha256(executable.read_bytes()).hexdigest(),
                  commit=os.environ.get('GITHUB_SHA'), checks=[], status='running')
    errors = []
    try:
        with tempfile.TemporaryDirectory(prefix='circuit-installed-webview-') as temporary, \
                sync_playwright() as playwright:
            profile = Path(temporary) / 'profile'
            with launch(playwright, executable, profile, arguments.output.parent, 'first') as page:
                page.on('pageerror', lambda error: errors.append(str(error)))
                expect(page.locator('.version')).to_contain_text(f'v{version}')
                expect(page.get_by_role('heading', name='回路', exact=True)).to_be_visible()
                result['document_url'] = page.url
                result['checks'].append('installed executable renders current version and title')
                page.get_by_role('button', name='开始抢修', exact=True).click()
                expect(page.locator('.hud')).to_be_visible()
                page.wait_for_function("localStorage.getItem('circuit-auto-v100') !== null")
                original = page.evaluate("localStorage.getItem('circuit-auto-v100')")
                opener = page.get_by_role('button', name='历史', exact=True)
                opener.click()
                dialog = page.get_by_role('dialog', name='抢修日志', exact=True)
                expect(dialog).to_be_visible()
                page.keyboard.press('Tab')
                assert dialog.evaluate('element => element.contains(document.activeElement)')
                page.keyboard.press('Escape')
                expect(dialog).to_have_count(0)
                expect(opener).to_be_focused()
                assert page.evaluate("localStorage.getItem('circuit-auto-v100')") == original
                result['checks'].append('native start, automatic save, history and keyboard focus')
            with launch(playwright, executable, profile, arguments.output.parent, 'reopen') as page:
                page.on('pageerror', lambda error: errors.append(str(error)))
                expect(page.get_by_role('button', name='继续抢修', exact=True)).to_be_visible()
                assert page.evaluate("localStorage.getItem('circuit-auto-v100')") == original
                page.get_by_role('button', name='继续抢修', exact=True).click()
                expect(page.locator('.hud')).to_be_visible()
                assert page.evaluate("localStorage.getItem('circuit-auto-v100')") == original
                result['checks'].append('close, relaunch and restore the same native save')
            assert not errors, errors
            result['checks'].append('no JavaScript page errors and normal application shutdown')
        result['status'] = 'passed'
    except Exception as error:
        result['status'] = 'failed'
        result['error'] = str(error)
        raise
    finally:
        result['page_errors'] = errors
        arguments.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        print(json.dumps(result, ensure_ascii=True))


if __name__ == '__main__':
    main()
