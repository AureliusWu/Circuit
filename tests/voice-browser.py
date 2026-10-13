#!/usr/bin/env python3
"""Native browser media, auto-read, replay, interruption and new chapter regression."""
import importlib.util
import json
import os
from pathlib import Path
import sys
import time
from urllib.parse import urlsplit, urljoin
from playwright.sync_api import expect, sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:4173'
AUTO, PREFS = 'circuit-auto-v100', 'circuit-settings-v100'
spec = importlib.util.spec_from_file_location('release_browser', Path(__file__).with_name('release-browser.py'))
release = importlib.util.module_from_spec(spec)
spec.loader.exec_module(release)
authored = release.fixtures()
preferences = dict(textSpeed='instant', autoDelay=2, musicVolume=0, ambienceVolume=0,
                   voiceVolume=.8, sfxVolume=.6, voiceEnabled=True, muted=False, highContrast=False, reducedMotion=True)
checks, errors = [], []
began = time.monotonic()


def checked(name):
    checks.append(name)
    print('PASS', name, flush=True)


def node(page):
    return page.evaluate(f"JSON.parse(localStorage.getItem('{AUTO}')).nodeId")


with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ['CIRCUIT_CHROMIUM'], headless=True, args=['--no-sandbox'])
    contexts = []

    def open_page(seed=None, failed=False, viewport=None):
        context = browser.new_context(viewport=viewport or dict(width=1280, height=900))
        contexts.append(context)
        if os.environ.get('CIRCUIT_QA_FONT_DIR'):
            font_dir = Path(os.environ['CIRCUIT_QA_FONT_DIR'])
            css = (font_dir / 'index.css').read_text().replace('./files/', '/_qa-fonts/') + "\n*{font-family:'Noto Serif SC Variable',serif !important;}"
            context.route('**/_qa-fonts/*', lambda route: route.fulfill(path=str(font_dir / 'files' / Path(urlsplit(route.request.url).path).name), content_type='font/woff2'))
            context.add_init_script('document.addEventListener("DOMContentLoaded",()=>{const style=document.createElement("style");style.textContent=' + json.dumps(css) + ';document.head.appendChild(style);},{once:true});')
        context.add_init_script('''
          window.__media=[]; window.__hidden=false;
          Object.defineProperty(document,'hidden',{get:()=>window.__hidden,configurable:true});
          const nativePlay=HTMLMediaElement.prototype.play;
          HTMLMediaElement.prototype.play=function(...args) {
            if(!window.__media.includes(this)) window.__media.push(this);
            return nativePlay.apply(this,args);
          };
        ''')
        context.add_init_script('localStorage.setItem(' + json.dumps(PREFS) + ',' + json.dumps(json.dumps(preferences)) + ');' +
                                ('localStorage.setItem(' + json.dumps(AUTO) + ',' + json.dumps(json.dumps(seed)) + ');' if seed else ''))
        if failed:
            context.route('**/audio/voice/h13-dispatch.mp3', lambda route: route.fulfill(status=404, body='missing fixture'))
        page = context.new_page()
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(BASE, wait_until='networkidle')
        page.evaluate('document.fonts.ready')
        return page

    try:
        page = open_page()
        assert page.evaluate('window.__media.length') == 0
        checked('no-title-autoplay')
        page.get_by_role('button', name='开始抢修', exact=True).click()
        page.wait_for_function("window.__media.some(m=>m.src.includes('h13-dispatch.mp3') && !m.paused && m.readyState>=3)")
        assert page.evaluate("window.__media.find(m=>m.src.includes('h13-dispatch.mp3')).duration") > 3
        checked('bundled-mp3-real-playback')
        page.evaluate("window.__media.find(m=>m.src.includes('h13-dispatch.mp3')).playbackRate=.55")
        page.get_by_role('button', name='自动阅读', exact=True).click()
        page.wait_for_timeout(2100)
        assert node(page) == 'dispatch'
        checked('auto-waits-for-real-voice-end')
        page.get_by_role('button', name='暂停语音', exact=True).click()
        page.wait_for_timeout(2100)
        assert node(page) == 'dispatch'
        expect(page.get_by_role('button', name='继续语音', exact=True)).to_be_visible()
        checked('manual-voice-pause-holds-auto')
        page.get_by_role('button', name='继续语音', exact=True).click()
        page.wait_for_function(f"JSON.parse(localStorage.getItem('{AUTO}')).nodeId==='call'", timeout=20000)
        page.get_by_role('button', name='暂停自动', exact=True).click()
        checked('auto-resumes-after-voice-and-delay')
        page.get_by_role('button', name='历史', exact=True).click()
        dialog = page.get_by_role('dialog', name='抢修日志')
        before = page.evaluate(f"localStorage.getItem('{AUTO}')")
        dialog.get_by_role('button', name='重听这条语音', exact=True).first.click()
        page.wait_for_function("window.__media.some(m=>m.src.includes('h13-dispatch.mp3') && !m.paused)")
        assert page.evaluate(f"localStorage.getItem('{AUTO}')") == before
        assert dialog.locator('.history-entry').count() == 2
        checked('visited-history-replay-preserves-progress')
        page.evaluate("window.__hidden=true;document.dispatchEvent(new Event('visibilitychange'))")
        page.wait_for_function("window.__media.filter(m=>m.src.includes('/voice/')).every(m=>m.paused)")
        position = page.evaluate("window.__media.findLast(m=>m.src.includes('h13-dispatch.mp3')).currentTime")
        page.wait_for_timeout(400)
        assert abs(page.evaluate("window.__media.findLast(m=>m.src.includes('h13-dispatch.mp3')).currentTime") - position) < .1
        page.evaluate("window.__hidden=false;document.dispatchEvent(new Event('visibilitychange'))")
        page.wait_for_function("window.__media.some(m=>m.src.includes('h13-dispatch.mp3') && !m.paused)")
        checked('hidden-page-pauses-and-resumes-replay')
        page.keyboard.press('Escape')
        page.get_by_role('button',name='设置',exact=True).click()
        page.wait_for_function("window.__media.filter(m=>m.src.includes('/voice/')).every(m=>m.paused)")
        page.keyboard.press('Escape')
        page.wait_for_function("window.__media.some(m=>m.src.includes('h13-dispatch.mp3') && !m.paused)")
        page.locator('button[data-action-id]').first.click()
        page.wait_for_function("window.__media.filter(m=>m.src.includes('h13-dispatch.mp3')).every(m=>m.paused)")
        checked('scene-change-cancels-old-playback')
        page.get_by_role('button', name='设置', exact=True).click()
        dialog = page.get_by_role('dialog', name='阅读与声音')
        for label, value in [('人物语音音量', .3), ('场景音效音量', .25)]:
            slider = dialog.locator('label').filter(has_text=label).locator('input')
            slider.evaluate('(el,v)=>{const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set;setter.call(el,v);el.dispatchEvent(new Event("input",{bubbles:true}));el.dispatchEvent(new Event("change",{bubbles:true}));}', str(value))
        saved = json.loads(page.evaluate(f"localStorage.getItem('{PREFS}')"))
        assert saved['voiceVolume'] == .3 and saved['sfxVolume'] == .25
        dialog.get_by_label('播放人物语音', exact=True).uncheck()
        assert not json.loads(page.evaluate(f"localStorage.getItem('{PREFS}')"))['voiceEnabled']
        checked('independent-voice-and-sfx-settings')
        page.keyboard.press('Escape')
        page.get_by_role('button', name='标题', exact=True).click()
        assert page.evaluate("window.__media.every(m=>m.paused)")
        checked('title-stops-all-recorded-media')

        missing = open_page(failed=True)
        missing.get_by_role('button', name='开始抢修', exact=True).click()
        expect(missing.locator('.voice-caption')).to_contain_text('录音暂不可用')
        missing.get_by_role('button', name='自动阅读', exact=True).click()
        missing.wait_for_function(f"JSON.parse(localStorage.getItem('{AUTO}')).nodeId==='call'", timeout=8000)
        checked('missing-recording-does-not-block-reading')

        prefix = [chapter['id'] for chapter in authored[:6]]
        seed = dict(version=2, chapterId='return-visit', nodeId='dispatch', evidence=[], history=['dispatch'],
                    completed=prefix, archive={chapter['id']:chapter['requiredEvidence'] for chapter in authored[:6]}, savedAt='2026-10-13T00:00:00.000Z')
        new = open_page(seed)
        new.get_by_role('button', name='继续抢修', exact=True).click()
        for step in ['handover','drive','arrival','luo']:
            new.locator('button[data-action-id]').first.click()
            new.wait_for_function(f"JSON.parse(localStorage.getItem('{AUTO}')).nodeId==={json.dumps(step)}")
        new.locator('.stage-background img').evaluate('async img=>await img.decode()')
        expect(new.locator('.character-portrait img')).to_have_attribute('src', urlsplit(urljoin(BASE.rstrip('/')+'/', 'art/portraits/luo.webp')).path)
        new.locator('.character-portrait img').evaluate('async img=>await img.decode()')
        Path('docs/art').mkdir(parents=True,exist_ok=True)
        new.screenshot(path='docs/art/return-visit-preview.jpg', type='jpeg', quality=85, full_page=True)
        new.set_viewport_size(dict(width=390,height=844))
        new.wait_for_timeout(200)
        assert new.evaluate('document.documentElement.scrollWidth') <= 390
        for control in new.locator('.dialogue .playback-controls button').all():
            box=control.bounding_box()
            assert box and box['x'] >= -1 and box['x']+box['width'] <= 391,box
        new.screenshot(path='docs/art/return-visit-mobile-preview.jpg', type='jpeg', quality=85, full_page=True)
        checked('new-chapter-art-voices-and-mobile-controls')
        echo_seed = {**seed, 'nodeId':'echo', 'history':['echo'], 'evidence':['v01-recording','v01-address','v01-threshold']}
        echo = open_page(echo_seed)
        echo.get_by_role('button', name='继续抢修', exact=True).click()
        echo.wait_for_function("window.__media.some(m=>m.src.includes('v01-arrived.mp3') && !m.paused)")
        echo.get_by_role('button',name='自动阅读',exact=True).click()
        echo.wait_for_function("window.__media.some(m=>m.src.includes('v01-received.mp3') && !m.paused)",timeout=10000)
        assert node(echo) == 'echo'
        echo.wait_for_function(f"JSON.parse(localStorage.getItem('{AUTO}')).nodeId==='secondHub'",timeout=12000)
        assert echo.evaluate("window.__media.filter(m=>m.src.includes('/voice/')).every(m=>m.paused)")
        checked('two-speaker-echo-plays-in-order-before-auto-advance')
        assert not errors,errors
        checked('no-runtime-errors')
    finally:
        for context in contexts:
            context.close()
        browser.close()

report = dict(url=BASE, status='passed', checks=checks, count=len(checks), elapsedSeconds=round(time.monotonic()-began,3),
              limitations=['Headless browser media events and decoding checked; physical speakers and acting not approved.'])
Path('docs/audio/browser-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,ensure_ascii=False,indent=2))
