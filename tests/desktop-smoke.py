#!/usr/bin/env python3
"""Exercise the installed Tauri executable through its real WebView2 control."""
import argparse
from contextlib import contextmanager, nullcontext
import ctypes
from ctypes import wintypes
import hashlib
import json
import os
from pathlib import Path
import socket
import subprocess
import tempfile
import time
import urllib.request
import winreg
from webview_processes import track_profile_processes

from playwright.sync_api import TimeoutError as PlaywrightTimeoutError, expect, sync_playwright


def windows_for_process(process_id):
    user32 = ctypes.WinDLL('user32', use_last_error=True)
    callback_type = ctypes.WINFUNCTYPE(wintypes.BOOL, wintypes.HWND, wintypes.LPARAM)
    user32.GetWindowThreadProcessId.argtypes = [wintypes.HWND, ctypes.POINTER(wintypes.DWORD)]
    user32.GetWindowTextW.argtypes = [wintypes.HWND, wintypes.LPWSTR, ctypes.c_int]
    user32.GetClassNameW.argtypes = [wintypes.HWND, wintypes.LPWSTR, ctypes.c_int]
    user32.IsWindowVisible.argtypes = [wintypes.HWND]
    user32.GetWindowRect.argtypes = [wintypes.HWND, ctypes.POINTER(wintypes.RECT)]
    windows = []

    @callback_type
    def inspect(handle, _):
        pid = wintypes.DWORD()
        user32.GetWindowThreadProcessId(handle, ctypes.byref(pid))
        if pid.value == process_id:
            title, classname, rectangle = ctypes.create_unicode_buffer(512), ctypes.create_unicode_buffer(256), wintypes.RECT()
            user32.GetWindowTextW(handle, title, len(title))
            user32.GetClassNameW(handle, classname, len(classname))
            user32.GetWindowRect(handle, ctypes.byref(rectangle))
            windows.append(dict(handle=int(handle), title=title.value, classname=classname.value,
                                visible=bool(user32.IsWindowVisible(handle)),
                                rectangle=[rectangle.left, rectangle.top, rectangle.right, rectangle.bottom]))
        return True

    user32.EnumWindows.argtypes = [callback_type, wintypes.LPARAM]
    assert user32.EnumWindows(inspect, 0), 'Could not enumerate native windows'
    return windows


def close_window(process, page, on_timeout):
    if process.poll() is not None:
        assert process.returncode == 0, f'Application exit code: {process.returncode}'
        return
    user32 = ctypes.WinDLL('user32', use_last_error=True)
    user32.PostMessageW.argtypes = [wintypes.HWND, wintypes.UINT, wintypes.WPARAM, wintypes.LPARAM]
    user32.PostMessageW.restype = wintypes.BOOL
    # EnumWindows also returns Tao's internal message target. WM_CLOSE destroys
    # that target before it can dispatch the real window's CloseRequested event.
    # Only send the user's close action to the visible application window.
    targets = [window for window in windows_for_process(process.pid)
               if window['visible'] and window['classname'] == 'Tauri Window' and 'Circuit' in window['title']]
    assert targets, 'No Circuit application window to close'
    try:
        # Keep the CDP event loop running while the native window closes.
        with page.expect_event('close', timeout=20000) if page and not page.is_closed() else nullcontext():
            for window in targets:
                assert user32.PostMessageW(window['handle'], 0x0010, 0, 0), 'Native close message failed'
        process.wait(timeout=20)
    except (subprocess.TimeoutExpired, PlaywrightTimeoutError) as error:
        on_timeout()
        subprocess.run(['taskkill', '/PID', str(process.pid), '/T', '/F'], check=False)
        process.wait(timeout=10)
        raise AssertionError('Installed application did not close normally') from error
    assert process.returncode == 0, f'Application exit code: {process.returncode}'
    return targets


@contextmanager
def elevated_webview_policy(executable, profile, browser_arguments):
    # WebView2 150+ ignores WEBVIEW2_* environment overrides in elevated hosts.
    # This affects GitHub Windows runners, not the shipped game. HKLM overrides
    # are documented for this case; scope them to this executable and restore.
    # https://learn.microsoft.com/microsoft-edge/webview2/concepts/security
    elevated = bool(ctypes.windll.shell32.IsUserAnAdmin())
    original_values = []
    try:
        if elevated:
            for setting, value in [('AdditionalBrowserArguments', browser_arguments),
                                   ('UserDataFolder', str(profile))]:
                path = rf'SOFTWARE\Policies\Microsoft\Edge\WebView2\{setting}'
                with winreg.CreateKeyEx(winreg.HKEY_LOCAL_MACHINE, path, 0,
                                        winreg.KEY_READ | winreg.KEY_WRITE | winreg.KEY_WOW64_64KEY) as key:
                    try:
                        previous = winreg.QueryValueEx(key, executable.name)
                    except FileNotFoundError:
                        previous = None
                    original_values.append((path, previous))
                    winreg.SetValueEx(key, executable.name, 0, winreg.REG_SZ, value)
        yield dict(elevated=elevated, override='per-executable HKLM policy' if elevated else 'environment',
                   user_data_folder=str(profile), browser_arguments=browser_arguments)
    finally:
        for path, previous in reversed(original_values):
            with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, path, 0,
                                winreg.KEY_SET_VALUE | winreg.KEY_WOW64_64KEY) as key:
                if previous is None:
                    winreg.DeleteValue(key, executable.name)
                else:
                    winreg.SetValueEx(key, executable.name, 0, previous[1], previous[0])


def collect_diagnostics(process, port, log_directory, attempt, diagnostic):
    diagnostic.update(pid=process.pid, returncode=process.poll(), windows=windows_for_process(process.pid))
    try:
        opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
        with opener.open(f'http://127.0.0.1:{port}/json/list', timeout=2) as response:
            diagnostic['cdp_targets'] = json.load(response)
    except (OSError, ValueError) as error:
        diagnostic['cdp_targets_error'] = str(error)
    # Capture process command lines, runtime versions and the desktop even if CDP
    # never starts, without adding a test-only hook to the production executable.
    screenshot = (log_directory / f'{attempt}-desktop.png').resolve()
    script = r"""
$ErrorActionPreference = 'Continue'
Get-CimInstance Win32_Process | Where-Object { $_.Name -in @('circuit.exe','msedgewebview2.exe') } |
    Select-Object ProcessId, ParentProcessId, SessionId, Name, ExecutablePath, CommandLine |
    ConvertTo-Json -Depth 4
Get-ChildItem 'C:\Program Files (x86)\Microsoft\EdgeWebView\Application' -ErrorAction SilentlyContinue |
    Select-Object Name
netstat -ano
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
$bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
$image = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height
$graphics = [System.Drawing.Graphics]::FromImage($image)
try {
    $graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size)
    $image.Save($env:CIRCUIT_DESKTOP_SCREENSHOT)
} finally { $graphics.Dispose(); $image.Dispose() }
"""
    try:
        completed = subprocess.run(['powershell', '-NoProfile', '-NonInteractive', '-Command', script],
                                   env=dict(os.environ, CIRCUIT_DESKTOP_SCREENSHOT=str(screenshot)),
                                   capture_output=True, text=True, errors='replace', timeout=30)
        (log_directory / f'{attempt}-processes.txt').write_text(completed.stdout + '\n' + completed.stderr,
                                                               encoding='utf-8')
    except Exception as error:
        diagnostic['diagnostic_error'] = str(error)
    diagnostic['debug_port'] = port


def profile_processes(profile, observed, timeout=30):
    """Track this UDF's browser and descendants even after their parent exits."""
    script = r"""
$ErrorActionPreference = 'Stop'
@(Get-CimInstance Win32_Process | Select-Object ProcessId, ParentProcessId, Name, CommandLine, CreationDate) |
    ConvertTo-Json -Compress -Depth 3
"""
    completed = subprocess.run(['powershell', '-NoProfile', '-NonInteractive', '-Command', script],
                               capture_output=True, text=True, errors='replace', check=True, timeout=timeout)
    processes = json.loads(completed.stdout)
    if isinstance(processes, dict):
        processes = [processes]
    # tempfile may return RUNNER~1 while Path.resolve expands it to runneradmin.
    # WebView2's command line preserves the spelling passed to UserDataFolder.
    profile_paths = {str(path).replace('/', '\\').casefold() for path in (profile, profile.resolve())}
    # Windows reuses PIDs. Bind orphan tracking to creation identity, and never
    # adopt the PowerShell/CIM poller merely because it inherited a reused PID.
    return track_profile_processes(processes, profile_paths, observed)


def wait_for_profile_shutdown(profile, observed, diagnostic):
    # Closing the host does not mean WebView2 has released its UDF. Wait for the
    # complete process collection before reusing/removing this temporary profile.
    # https://learn.microsoft.com/microsoft-edge/webview2/concepts/user-data-folder
    started = time.monotonic()
    deadline = started + 30
    shutdown = diagnostic['webview_shutdown'] = dict(
        profile_aliases=sorted({str(path).replace('/', '\\').casefold() for path in (profile, profile.resolve())}),
        observed_pids=sorted(observed), remaining_pids=[])
    while True:
        remaining_time = deadline - time.monotonic()
        assert remaining_time > 0, f'WebView2 did not release the temporary profile: {shutdown}'
        remaining = profile_processes(profile, observed, timeout=remaining_time)
        shutdown.update(observed_pids=sorted(observed),
                        remaining_pids=sorted(int(item['ProcessId']) for item in remaining),
                        remaining_processes=[{key: item.get(key) for key in ('ProcessId', 'ParentProcessId', 'Name', 'CreationDate')}
                                             for item in remaining],
                        elapsed_seconds=round(time.monotonic() - started, 3))
        if not remaining:
            return
        time.sleep(min(0.2, max(0, deadline - time.monotonic())))


@contextmanager
def launch(playwright, executable, profile, log_directory, attempt):
    with socket.socket() as listener:
        listener.bind(('127.0.0.1', 0))
        port = listener.getsockname()[1]
    profile.mkdir(parents=True, exist_ok=True)
    browser_arguments = f'--remote-debugging-port={port}'
    environment = dict(os.environ,
                       WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=browser_arguments,
                       WEBVIEW2_USER_DATA_FOLDER=str(profile))
    browser, page, failure = None, None, None
    diagnostic = dict(attempt=attempt)
    observed_webview_processes = {}
    with elevated_webview_policy(executable, profile, browser_arguments) as override, \
            (log_directory / f'{attempt}-stdout.txt').open('wb') as stdout, \
            (log_directory / f'{attempt}-stderr.txt').open('wb') as stderr:
        diagnostic.update(override)
        process = subprocess.Popen([str(executable)], cwd=executable.parent, env=environment, stdout=stdout, stderr=stderr)
        try:
            deadline = time.monotonic() + 60
            opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
            last_error = None
            while time.monotonic() < deadline:
                assert process.poll() is None, f'Application exited before WebView2 started: {process.returncode}'
                try:
                    with opener.open(f'http://127.0.0.1:{port}/json/version', timeout=1) as response:
                        version = json.load(response)
                        endpoint = version['webSocketDebuggerUrl']
                    diagnostic['webview_version'] = version
                    break
                except (OSError, KeyError, ValueError) as error:
                    last_error = str(error)
                    time.sleep(0.2)
            else:
                raise AssertionError(f'Installed WebView2 debugging endpoint did not start: {last_error}')
            browser = playwright.chromium.connect_over_cdp(endpoint)
            profile_processes(profile, observed_webview_processes)
            assert observed_webview_processes, 'No WebView2 process belongs to the temporary profile'
            context = browser.contexts[0]
            diagnostic['initial_page_urls'] = [page.url for page in context.pages]
            # A WebView target can appear after the browser endpoint. Sync API
            # properties are cached; time.sleep prevents its page/navigation
            # events from being dispatched. Wait through Playwright instead.
            # https://playwright.dev/python/docs/library#timesleep-leads-to-outdated-state
            page = context.pages[0] if context.pages else context.wait_for_event('page', timeout=30000)
            page.wait_for_url(lambda url: url != 'about:blank', wait_until='domcontentloaded', timeout=30000)
            diagnostic['document_url'] = page.url
            page.set_default_timeout(15000)
            visible_windows = [window for window in windows_for_process(process.pid) if window['visible']]
            diagnostic['windows'] = visible_windows
            assert any('Circuit' in window['title'] and window['rectangle'][2] > window['rectangle'][0]
                       for window in visible_windows), 'No visible installed Circuit native window'
            yield page
            page.screenshot(path=str(log_directory / f'{attempt}-game.png'))
        except BaseException as error:
            failure = error
            diagnostic['error'] = str(error)
            collect_diagnostics(process, port, log_directory, attempt, diagnostic)
            raise
        finally:
            try:
                profile_processes(profile, observed_webview_processes)
                diagnostic['closed_native_windows'] = close_window(process, page, lambda: collect_diagnostics(
                    process, port, log_directory, attempt + '-shutdown', diagnostic))
            except Exception as error:
                diagnostic['shutdown_error'] = str(error)
                if failure is None:
                    raise
            finally:
                try:
                    if browser:
                        browser.close()
                    wait_for_profile_shutdown(profile, observed_webview_processes, diagnostic)
                finally:
                    diagnostic['exit_code'] = process.poll()
                    (log_directory / f'{attempt}-diagnostic.json').write_text(
                        json.dumps(diagnostic, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


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
                title_help = page.get_by_role('button', name='操作与制作记录', exact=True)
                title_help.focus()
                page.keyboard.press('Enter')
                help_dialog = page.get_by_role('dialog', name='操作与制作记录', exact=True)
                expect(help_dialog).to_contain_text('403 条人物对白')
                expect(page.get_by_role('button', name='关闭操作与制作记录', exact=True)).to_be_focused()
                page.keyboard.press('Escape')
                expect(title_help).to_be_focused()
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
                help_opener = page.get_by_role('button', name='帮助', exact=True)
                help_opener.click()
                expect(help_dialog).to_be_visible()
                paused_text = page.locator('.dialogue-text').inner_text()
                page.wait_for_timeout(400)
                assert page.locator('.dialogue-text').inner_text() == paused_text
                assert page.evaluate("localStorage.getItem('circuit-auto-v100')") == original
                page.keyboard.press('Escape')
                expect(help_opener).to_be_focused()
                result['checks'].append('native title and reading help pause text without changing saves and restore focus')
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
            result['webview_shutdown'] = {
                attempt: json.loads((arguments.output.parent / f'{attempt}-diagnostic.json').read_text(
                    encoding='utf-8'))['webview_shutdown'] for attempt in ('first', 'reopen')}
            result['checks'].append('both WebView2 process collections exit before profile cleanup')
        assert not Path(temporary).exists(), 'Temporary WebView2 profile was not removed'
        result['temporary_profile_removed'] = True
        result['checks'].append('temporary WebView2 profile is completely removed')
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
