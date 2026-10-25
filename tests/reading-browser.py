"""Supplemental reading/settings/save regression against a running Circuit build.

Run: python tests/reading-browser.py [http://127.0.0.1:5173]
Uses installed Python Playwright and CIRCUIT_CHROMIUM (default /usr/bin/chromium).
Headless tabs stay visible, so the visibility pause test dispatches a controlled
document.hidden/visibilitychange transition inside real Chromium.
"""

import json
import os
import re
import sys
import tempfile
from pathlib import Path

from playwright.sync_api import expect, sync_playwright

BASE_URL = sys.argv[1] if len(sys.argv) > 1 else os.environ.get("CIRCUIT_BASE_URL", "http://127.0.0.1:5173")
AUTO = "circuit-auto-v100"
PREFS = "circuit-settings-v100"
CORE = ["live-after-cut", "house-13", "paper-ash"]
DEFAULTS = {
    "textSpeed": "instant", "autoDelay": 2, "musicVolume": 0.35,
    "ambienceVolume": 0.55, "voiceVolume": 0.8, "sfxVolume": 0.6, "voiceEnabled": False, "muted": False, "highContrast": False, "reducedMotion": False,
}
checks = []
errors = []


def checked(name):
    checks.append(name)
    print(f"PASS {name}", flush=True)


def campaign(node="dispatch", evidence=None):
    return {
        "version": 2, "chapterId": "thirteen-households", "nodeId": node,
        "evidence": evidence or [], "history": [node],
        "savedAt": "2026-10-11T02:07:00.000Z", "completed": [], "archive": {},
    }


def new_page(browser, records=None, *, visibility=False, denied=False):
    context = browser.new_context(viewport={"width": 1280, "height": 900}, accept_downloads=True)
    records = records or {PREFS: json.dumps(DEFAULTS)}
    context.add_init_script("""
        window.__audioContexts = [];
        window.__audioGestureFlags = [];
        window.__readingTimerDelays = [];
        const nativeTimeout = window.setTimeout;
        window.setTimeout = (callback, delay, ...args) => {
          if (Number.isFinite(delay) && delay > 0 && delay < 100) window.__readingTimerDelays.push(delay);
          return nativeTimeout.apply(window, [callback, delay, ...args]);
        };
        const NativeAudio = window.AudioContext;
        if (NativeAudio) window.AudioContext = class extends NativeAudio {
          constructor(...args) {
            super(...args);
            window.__audioContexts.push(this);
            window.__audioGestureFlags.push(navigator.userActivation.isActive);
          }
        };
    """)
    if visibility:
        context.add_init_script("""
            window.__testHidden = false;
            Object.defineProperty(document, 'hidden', {configurable:true, get:()=>window.__testHidden});
            Object.defineProperty(document, 'visibilityState', {configurable:true, get:()=>window.__testHidden?'hidden':'visible'});
        """)
    if denied:
        context.add_init_script("Object.defineProperty(window, 'localStorage', {get:()=>{throw new DOMException('Denied', 'SecurityError')}});")
    else:
        context.add_init_script("""
            if (location.protocol.startsWith('http') && !sessionStorage.getItem('__reading_seeded')) {
              for (const [key,value] of Object.entries(RECORDS)) localStorage.setItem(key,value);
              sessionStorage.setItem('__reading_seeded','yes');
            }
        """.replace("RECORDS", json.dumps(records)))
    page = context.new_page()
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(BASE_URL, wait_until="networkidle")
    expect(page.get_by_role("button", name="开始抢修", exact=True)).to_be_visible()
    return context, page


def raw_storage(page):
    return page.evaluate("Object.fromEntries(Object.keys(localStorage).map(key=>[key,localStorage.getItem(key)]))")


def auto(page):
    return page.evaluate("JSON.parse(localStorage.getItem('circuit-auto-v100'))")


def advance_to(page, target):
    for _ in range(40):
        if auto(page)["nodeId"] == target:
            return
        buttons = page.locator(".actions button[data-action-id]")
        assert buttons.count() == 1, f"expected a single dialogue before {target}: {auto(page)['nodeId']}"
        buttons.first.click()
    raise AssertionError(f"did not reach {target}")


def close_panel(page):
    page.keyboard.press("Escape")
    expect(page.get_by_role("dialog")).to_have_count(0)


def open_settings(page):
    selector = page.get_by_role("button", name="设置", exact=True)
    (selector if selector.count() else page.get_by_role("button", name="阅读与声音", exact=True)).click()
    expect(page.get_by_role("dialog", name="阅读与声音")).to_be_visible()


def open_saves(page):
    selector = page.get_by_role("button", name="存档", exact=True)
    (selector if selector.count() else page.get_by_role("button", name="存档与读取", exact=True)).click()
    expect(page.get_by_role("dialog", name="存档与读取")).to_be_visible()


def slider(page, label, steps):
    control = page.get_by_role("slider", name=re.compile(label))
    control.press("Home")
    for _ in range(steps):
        control.press("ArrowRight")


def upload(page, content, name="circuit-test.json"):
    page.get_by_label("选择存档文件").set_input_files({"name": name, "mimeType": "application/json", "buffer": content})


def reading_and_keys(browser):
    context, page = new_page(browser, {PREFS: json.dumps({**DEFAULTS, "textSpeed": "slow"})})
    assert page.evaluate("window.__audioContexts.length") == 0
    open_settings(page)
    assert page.evaluate("window.__audioContexts.length") == 0
    close_panel(page)
    page.get_by_role("button", name="开始抢修", exact=True).click()
    page.wait_for_timeout(180)
    text = page.locator(".dialogue-text")
    full = text.get_attribute("aria-label")
    assert 0 < len(text.inner_text()) < len(full)
    slow_delay = min(page.evaluate("window.__readingTimerDelays"))
    assert page.evaluate("window.__audioContexts.length") == 1
    assert page.evaluate("window.__audioGestureFlags.every(Boolean)")
    checked("typewriter starts gradually; WebAudio starts only after a user gesture")
    page.get_by_role("button", name="历史", exact=True).click()
    page.wait_for_timeout(100)
    paused = text.inner_text()
    page.wait_for_timeout(330)
    assert text.inner_text() == paused
    close_panel(page)
    page.wait_for_timeout(150)
    assert len(text.inner_text()) > len(paused)
    checked("opening a notebook pauses and closing resumes text reveal")
    text.click()
    page.keyboard.press("Space")
    expect(text.locator("span")).to_have_text(full)
    assert auto(page)["nodeId"] == "dispatch"
    page.keyboard.press("Enter")
    page.wait_for_function("JSON.parse(localStorage.getItem('circuit-auto-v100')).nodeId === 'call'")
    assert auto(page)["history"] == ["dispatch", "call"]
    checked("Space reveals text and Enter advances once with atomic visit history")
    open_settings(page)
    page.get_by_label("文字显示").select_option("fast")
    close_panel(page)
    page.evaluate("window.__readingTimerDelays=[]")
    page.get_by_role("button", name="出发抢修", exact=True).focus()
    page.keyboard.press("Enter")
    page.wait_for_timeout(180)
    assert auto(page)["history"][:2] == ["dispatch", "call"] and len(auto(page)["history"]) == 3
    assert min(page.evaluate("window.__readingTimerDelays")) < slow_delay and len(text.inner_text()) > 0
    checked("slow/fast settings change live reveal timing; Enter on a focused action does not double advance")
    context.close()


def help_pause_and_layout(browser):
    for width, height in [(1280, 900), (412, 915), (568, 320), (844, 390)]:
        context, page = new_page(browser, {PREFS: json.dumps({**DEFAULTS, "textSpeed": "slow"})})
        page.set_viewport_size({"width": width, "height": height})
        title_help = page.get_by_role("button", name="操作与制作记录", exact=True)
        title_help.focus()
        page.keyboard.press("Enter")
        dialog = page.get_by_role("dialog", name="操作与制作记录")
        close = page.get_by_role("button", name="关闭操作与制作记录", exact=True)
        expect(dialog).to_be_visible()
        expect(close).to_be_focused()
        for text in ["十五名人物", "414 条人物对白", "两部完结", "不包含另外三个手动槽位"]:
            expect(dialog).to_contain_text(text)
        page.keyboard.press("Tab")
        expect(close).to_be_focused()
        page.keyboard.press("Shift+Tab")
        expect(close).to_be_focused()
        body = dialog.locator(".notebook-body")
        body.evaluate("element => element.scrollTop = element.scrollHeight")
        expect(body.locator(".help-content > p").last).to_be_in_viewport()
        expect(close).to_be_in_viewport()
        assert dialog.evaluate("element => element.scrollWidth <= element.clientWidth")
        close_panel(page)
        expect(title_help).to_be_focused()
        page.get_by_role("button", name="开始抢修", exact=True).click()
        page.wait_for_timeout(120)
        help_button = page.get_by_role("button", name="帮助", exact=True)
        expect(help_button).to_be_in_viewport()
        help_button.focus()
        page.keyboard.press("Enter")
        expect(close).to_be_focused()
        saved = raw_storage(page)
        text = page.locator(".dialogue-text")
        paused = text.inner_text()
        dialog.focus()
        page.keyboard.press("Space")
        page.wait_for_timeout(350)
        assert text.inner_text() == paused
        assert raw_storage(page) == saved
        page.keyboard.press("Escape")
        expect(help_button).to_be_focused()
        page.wait_for_timeout(130)
        assert len(text.inner_text()) > len(paused)
        assert raw_storage(page) == saved
        context.close()
        checked(f"help title/reading keyboard entry, trapped focus, exact reveal resume and scrollable content at {width}x{height}")

    context, page = new_page(browser)
    page.get_by_role("button", name="开始抢修", exact=True).click()
    page.get_by_role("button", name="自动阅读", exact=True).click()
    page.get_by_role("button", name="帮助", exact=True).click()
    before = raw_storage(page)
    page.wait_for_timeout(2300)
    assert raw_storage(page) == before
    page.wait_for_function("window.__audioContexts[0].state === 'suspended'")
    close_panel(page)
    expect(page.get_by_role("button", name="帮助", exact=True)).to_be_focused()
    page.wait_for_function("JSON.parse(localStorage.getItem('circuit-auto-v100')).nodeId === 'call'", timeout=4000)
    assert auto(page)["history"] == ["dispatch", "call"]
    context.close()
    checked("help pauses automatic progression and WebAudio, then resumes exactly one dialogue")


def preference_persistence(browser):
    context, page = new_page(browser)
    open_settings(page)
    page.get_by_label("文字显示").select_option("slow")
    slider(page, "自动阅读停留", 6)
    slider(page, "音乐音量", 4)
    slider(page, "环境与提示音", 13)
    page.get_by_label("静音", exact=True).check()
    page.get_by_label("高对比文字").check()
    page.get_by_label("减少动态效果 / 即时全文").check()
    expected = {**DEFAULTS, "textSpeed": "slow", "autoDelay": 8, "musicVolume": 0.2,
                "ambienceVolume": 0.65, "muted": True, "highContrast": True, "reducedMotion": True}
    assert json.loads(raw_storage(page)[PREFS]) == expected
    close_panel(page)
    expect(page.locator("main")).to_have_class(re.compile("high-contrast"))
    expect(page.locator("main")).to_have_class(re.compile("reduced-motion"))
    page.reload(wait_until="networkidle")
    open_settings(page)
    expect(page.get_by_label("文字显示")).to_have_value("slow")
    expect(page.get_by_label("静音", exact=True)).to_be_checked()
    expect(page.get_by_label("高对比文字")).to_be_checked()
    expect(page.get_by_label("减少动态效果 / 即时全文")).to_be_checked()
    assert json.loads(raw_storage(page)[PREFS]) == expected
    close_panel(page)
    page.get_by_role("button", name="开始抢修", exact=True).click()
    text = page.locator(".dialogue-text")
    expect(text.locator("span")).to_have_text(text.get_attribute("aria-label"))
    checked("text speed, delay, audio levels, mute, contrast and reduced motion persist across reload")
    checked("reduced motion forces immediate full text despite slow text preference")
    open_settings(page)
    page.get_by_label("减少动态效果 / 即时全文").uncheck()
    page.get_by_label("文字显示").select_option("instant")
    close_panel(page)
    page.get_by_role("button", name="接下工单", exact=True).click()
    expect(text.locator("span")).to_have_text(text.get_attribute("aria-label"))
    checked("instant preference applies immediately to the next narrative node")
    context.close()


def automatic_pause(browser):
    context, page = new_page(browser, visibility=True)
    page.get_by_role("button", name="开始抢修", exact=True).click()
    page.get_by_role("button", name="自动阅读", exact=True).click()
    page.wait_for_timeout(400)
    page.get_by_role("button", name="历史", exact=True).click()
    page.wait_for_timeout(2300)
    assert auto(page)["nodeId"] == "dispatch"
    page.wait_for_function("window.__audioContexts[0].state === 'suspended'")
    close_panel(page)
    page.wait_for_function("JSON.parse(localStorage.getItem('circuit-auto-v100')).nodeId === 'call'", timeout=4000)
    page.evaluate("window.__testHidden=true; document.dispatchEvent(new Event('visibilitychange'))")
    page.wait_for_timeout(2300)
    assert auto(page)["nodeId"] == "call"
    page.wait_for_function("window.__audioContexts[0].state === 'suspended'")
    page.evaluate("window.__testHidden=false; document.dispatchEvent(new Event('visibilitychange'))")
    page.get_by_role("button", name="标题", exact=True).click()
    page.wait_for_timeout(2300)
    assert auto(page)["nodeId"] == "call"
    page.wait_for_function("window.__audioContexts[0].state === 'suspended'")
    page.get_by_role("button", name="继续抢修", exact=True).click()
    expect(page.get_by_role("button", name="自动阅读", exact=True)).to_have_attribute("aria-pressed", "false")
    checked("auto reading and audio pause for notebook, controlled hidden-page event and title")
    page.get_by_role("button", name="自动阅读", exact=True).click()
    page.wait_for_function("JSON.parse(localStorage.getItem('circuit-auto-v100')).nodeId !== 'call'", timeout=4000)
    assert len(auto(page)["history"]) == 3
    context.close()
    context, page = new_page(browser, {PREFS: json.dumps(DEFAULTS), AUTO: json.dumps(campaign("meterbox"))})
    page.get_by_role("button", name="继续抢修", exact=True).click()
    page.get_by_role("button", name="自动阅读", exact=True).click()
    page.wait_for_timeout(2300)
    assert auto(page)["nodeId"] == "meterbox" and auto(page)["evidence"] == []
    checked("auto reading advances single dialogues but stops at investigation without collecting evidence")
    context.close()
    for node, evidence in [("inspectCurrent", []), ("deduction", CORE), ("wrongWarning", CORE)]:
        context, page = new_page(browser, {PREFS: json.dumps(DEFAULTS), AUTO: json.dumps(campaign(node, evidence))})
        page.get_by_role("button", name="继续抢修", exact=True).click()
        page.get_by_role("button", name="自动阅读", exact=True).click()
        page.wait_for_timeout(2250)
        assert auto(page)["nodeId"] == node and auto(page)["evidence"] == evidence, {"expected": node, "actual": auto(page)}
        context.close()
    checked("auto reading never confirms evidence, makes deductions or restarts failure endings")


def save_transfer(browser):
    context, page = new_page(browser)
    page.get_by_role("button", name="开始抢修", exact=True).click()
    open_saves(page)
    page.get_by_role("button", name="导入存档文件", exact=True).focus()
    page.keyboard.press("Tab")
    expect(page.get_by_role("button", name="关闭存档与读取", exact=True)).to_be_focused()
    page.keyboard.press("Shift+Tab")
    expect(page.get_by_role("button", name="导入存档文件", exact=True)).to_be_focused()
    checked("save dialog focus wraps around visible controls and excludes the hidden file input")
    page.get_by_role("button", name="保存到槽 1", exact=True).click()
    before_export = raw_storage(page)
    with page.expect_download() as pending:
        page.get_by_role("button", name="导出当前进度", exact=True).click()
    with tempfile.TemporaryDirectory(prefix="circuit-reading-") as directory:
        path = Path(directory) / "export.json"
        pending.value.save_as(str(path))
        exported = path.read_bytes()
    parsed = json.loads(exported)
    assert parsed["version"] == 2 and parsed["nodeId"] == "dispatch"
    assert raw_storage(page) == before_export
    close_panel(page)
    for slot, action in [(2, "接下工单"), (3, "出发抢修")]:
        page.get_by_role("button", name=action, exact=True).click()
        open_saves(page)
        page.get_by_role("button", name=f"保存到槽 {slot}", exact=True).click()
        close_panel(page)
    advance_to(page, "meterbox")
    records = raw_storage(page)
    assert [json.loads(records[f"circuit-slot-v100-{slot}"])["nodeId"] for slot in [1, 2, 3]] == ["dispatch", "call", "safetyBrief"]
    assert auto(page)["nodeId"] == "meterbox"
    checked("three manual slots remain independent and JSON export never mutates stored records")
    open_saves(page)
    for content, expected in [
        (b"{ bad json", "原进度已保留"),
        (json.dumps(campaign("end", [])).encode(), "存档内容损坏"),
        (b" " * (512 * 1024 + 1), "文件过大"),
    ]:
        upload(page, content)
        expect(page.locator(".save-notice, .title-notice")).to_contain_text(expected)
        assert raw_storage(page) == records
    checked("syntax-invalid, impossible-state and oversized imports preserve every prior slot")
    page.get_by_role("button", name="读取槽 1", exact=True).click()
    expect(page.get_by_role("button", name="接下工单", exact=True)).to_be_visible()
    assert raw_storage(page) == records
    checked("reading an older manual slot preserves the newer automatic record exactly")
    page.get_by_role("button", name="接下工单", exact=True).click()
    assert auto(page)["nodeId"] == "call"
    manual_before = {key: value for key, value in raw_storage(page).items() if key.startswith("circuit-slot-v100-")}
    open_saves(page)
    upload(page, exported)
    expect(page.get_by_role("region", name="确认导入存档")).to_be_visible()
    expect(page.get_by_role("button", name="取消导入", exact=True)).to_be_focused()
    assert auto(page)["nodeId"] == "call"
    before_import = raw_storage(page)
    with page.expect_download() as pending:
        page.get_by_role("button", name="导出当前进度", exact=True).click()
    assert raw_storage(page) == before_import
    page.get_by_role("button", name="取消导入", exact=True).click()
    assert raw_storage(page) == before_import
    upload(page, exported)
    close_panel(page)
    assert raw_storage(page) == before_import
    open_saves(page)
    upload(page, exported)
    page.get_by_role("button", name="确认导入", exact=True).click()
    expect(page.get_by_role("dialog")).to_have_count(0)
    assert auto(page)["nodeId"] == "dispatch"
    assert {key: value for key, value in raw_storage(page).items() if key.startswith("circuit-slot-v100-")} == manual_before
    checked("import preview, export, cancel and Escape preserve progress; explicit confirmation replaces only automatic storage")
    context.close()
    return exported


def legacy_readonly(browser):
    legacy = json.dumps({"node": "call", "evidence": []})
    context, page = new_page(browser, {PREFS: json.dumps(DEFAULTS), "circuit-save-v010": legacy})
    before = raw_storage(page)
    open_saves(page)
    page.get_by_role("button", name="读取槽 1", exact=True).click()
    assert raw_storage(page) == before
    page.get_by_role("button", name="出发抢修", exact=True).click()
    assert auto(page)["nodeId"] == "safetyBrief"
    assert raw_storage(page)["circuit-save-v010"] == legacy
    assert "circuit-slot-v100-1" not in raw_storage(page)
    context.close()
    old = {"version": 1, "chapterId": "thirteen-households", "nodeId": "end", "evidence": CORE,
           "history": ["end"], "savedAt": "2026-10-11T02:07:00.000Z"}
    context, page = new_page(browser, {PREFS: json.dumps(DEFAULTS), "circuit-auto-v011": json.dumps(old)})
    before = raw_storage(page)
    page.get_by_role("button", name="继续抢修", exact=True).click()
    assert raw_storage(page) == before
    page.get_by_role("button", name=re.compile("继续下一章")).click()
    assert auto(page)["chapterId"] == "seventh-night"
    assert auto(page)["completed"] == ["thirteen-households"]
    assert auto(page)["archive"]["thirteen-households"] == CORE
    assert raw_storage(page)["circuit-auto-v011"] == before["circuit-auto-v011"]
    checked("v010 manual and completed v011 auto migrate read-only; the next action writes only new storage")
    context.close()


def unavailable_storage(browser, exported):
    context, page = new_page(browser, denied=True)
    page.get_by_role("button", name="开始抢修", exact=True).click()
    expect(page.locator(".save-notice, .title-notice")).to_contain_text("浏览器存储暂不可用")
    page.get_by_role("button", name="接下工单", exact=True).click()
    page.get_by_role("button", name="历史", exact=True).click()
    expect(page.locator(".history-entry")).to_have_count(2)
    close_panel(page)
    checked("denied localStorage still allows play and keeps in-memory history consistent")
    open_saves(page)
    upload(page, exported)
    page.get_by_role("button", name="确认导入", exact=True).click()
    expect(page.get_by_role("dialog")).to_have_count(0)
    expect(page.locator(".save-notice, .title-notice")).to_contain_text("存储")
    checked("import with unavailable storage preserves the persistence warning")
    context.close()


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(executable_path=os.environ.get("CIRCUIT_CHROMIUM", "/usr/bin/chromium"), headless=True, args=["--no-sandbox"])
    try:
        reading_and_keys(browser)
        help_pause_and_layout(browser)
        preference_persistence(browser)
        automatic_pause(browser)
        exported = save_transfer(browser)
        legacy_readonly(browser)
        unavailable_storage(browser, exported)
        assert not errors, errors
        checked("no uncaught JavaScript exceptions")
    finally:
        browser.close()

print(json.dumps({"url": BASE_URL, "passed": len(checks), "checks": checks, "page_errors": errors,
                  "visibility_note": "headless hidden-page event is controlled; timers/audio execute in real Chromium"}, ensure_ascii=False, indent=2))
