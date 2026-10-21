#!/usr/bin/env python3
"""Old-save continuation, sound evidence, both retry endings and offline replay."""
import importlib.util
import json
import os
from pathlib import Path
import re
import sys
import time
from urllib.parse import urlsplit

from playwright.sync_api import expect, sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:4173'
AUTO, PREFS = 'circuit-auto-v100', 'circuit-settings-v100'
VERSION = json.loads(Path('package.json').read_text())['version']
spec = importlib.util.spec_from_file_location('release_browser', Path(__file__).with_name('release-browser.py'))
release = importlib.util.module_from_spec(spec)
spec.loader.exec_module(release)
chapters = release.fixtures()
recordings = release.recording_sources(chapters)
chapter = next(row for row in chapters if row['id'] == 'answering')
prefix = [row['id'] for row in chapters[:7]]
archive = {row['id']: row['requiredEvidence'] for row in chapters[:7]}
preferences = dict(textSpeed='instant', autoDelay=2, musicVolume=0, ambienceVolume=0,
                   voiceVolume=.8, sfxVolume=.5, voiceEnabled=True, muted=False,
                   highContrast=False, reducedMotion=True)
checks, errors, contexts = [], [], []
began = time.monotonic()


def checked(name):
    checks.append(name)
    print('PASS', name, flush=True)


def raw(page):
    return page.evaluate(f"localStorage.getItem('{AUTO}')")


def action(page, identifier):
    page.locator('button[data-action-id=' + json.dumps(identifier) + ']').click()


def evidence(page):
    page.get_by_role('button', name=re.compile(r'^证据 ')).click()
    return page.get_by_role('dialog', name='现场记录', exact=True)


def hit_test(control):
    control.scroll_into_view_if_needed()
    result = control.evaluate('''el => {
      const r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
      return {contained:r.x>=0&&r.y>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1,
        reachable:hit===el||el.contains(hit),rect:{x:r.x,y:r.y,width:r.width,height:r.height},
        covering:hit?.outerHTML.slice(0,300)};
    }''')
    if not result['contained'] or not result['reachable']:
        output = Path('artifacts/answering'); output.mkdir(parents=True, exist_ok=True)
        control.page.screenshot(path=str(output / 'unreachable-control.png'))
    assert result['contained'] and result['reachable'], (control.inner_text(), result)


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(executable_path=os.environ['CIRCUIT_CHROMIUM'], headless=True, args=['--no-sandbox'])

    def open_page(seed, viewport=(1280, 720)):
        context = browser.new_context(viewport=dict(width=viewport[0], height=viewport[1]))
        contexts.append(context)
        if os.environ.get('CIRCUIT_QA_FONT_DIR'):
            font_dir = Path(os.environ['CIRCUIT_QA_FONT_DIR'])
            css = (font_dir / 'index.css').read_text().replace('./files/', '/_qa-fonts/')
            css += "\n*{font-family:'Noto Serif SC Variable',serif !important;}"
            context.route('**/_qa-fonts/*', lambda route: route.fulfill(path=str(font_dir / 'files' / Path(urlsplit(route.request.url).path).name), content_type='font/woff2'))
            context.add_init_script('document.addEventListener("DOMContentLoaded",()=>{const s=document.createElement("style");s.textContent=' + json.dumps(css) + ';document.head.appendChild(s);},{once:true});')
        context.add_init_script('''
          window.__media=[];window.__hidden=false;
          Object.defineProperty(document,'hidden',{get:()=>window.__hidden,configurable:true});
          const nativePlay=HTMLMediaElement.prototype.play;
          HTMLMediaElement.prototype.play=function(...args) {
            if(!window.__media.includes(this))window.__media.push(this);
            if(this.src.includes('/voice/'))this.playbackRate=.3;
            return nativePlay.apply(this,args);
          };
        ''')
        context.add_init_script('if(!sessionStorage.getItem("answering-qa-seeded")){' +
          'localStorage.setItem(' + json.dumps(PREFS) + ',' + json.dumps(json.dumps(preferences)) + ');' +
          'localStorage.setItem(' + json.dumps(AUTO) + ',' + json.dumps(json.dumps(seed)) + ');' +
          'sessionStorage.setItem("answering-qa-seeded","yes");}')
        page = context.new_page()
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(BASE, wait_until='networkidle')
        page.evaluate('document.fonts.ready')
        return page, context

    try:
        old = dict(version=2, chapterId='return-visit', nodeId='end', evidence=chapters[6]['requiredEvidence'],
                   history=['end'], completed=prefix, archive=archive, savedAt='2026-10-13T02:00:00.000Z')
        page, context = open_page(old)
        before = raw(page)
        page.get_by_role('button', name='章节选择', exact=True).click()
        expect(page.locator('[data-chapter-id="answering"]')).to_be_enabled()
        assert raw(page) == before
        page.locator('[data-chapter-id="answering"]').click()
        saved = json.loads(raw(page))
        assert saved['completed'] == prefix and saved['archive'] == archive and saved['evidence'] == []
        checked('v120-save-unlocks-answering-without-read-write')
        for step in chapter['path']:
            action(page, step['actionId'])
            if step['nodeId'] == 'firstHub':
                break
        dialog = evidence(page)
        assert dialog.get_by_role('button', name=re.compile(r'^重听：')).count() == 0
        page.keyboard.press('Escape')
        checked('uncollected-evidence-has-no-replay-controls')
        for identifier in ['seal', 'sealPosition', 'recordSource', 'record-source']:
            action(page, identifier)
        before = raw(page)
        dialog = evidence(page)
        dialog.get_by_role('button', name='重听：柜边录下的程砚声音', exact=True).click()
        page.wait_for_function("window.__media.some(m=>m.src.includes('v01-confirm.mp3')&&!m.paused)".replace('v01-confirm.mp3', recordings['v01-confirm']))
        assert raw(page) == before
        checked('collected-evidence-replays-identical-master-without-save-write')
        dialog.get_by_role('button', name='暂停录音', exact=True).click()
        expect(dialog.get_by_role('button', name='继续录音', exact=True)).to_be_visible()
        page.wait_for_function("window.__media.filter(m=>m.src.includes('/voice/')).every(m=>m.paused)")
        dialog.get_by_role('button', name='继续录音', exact=True).click()
        page.wait_for_function("window.__media.some(m=>m.src.includes('v01-confirm.mp3')&&!m.paused)".replace('v01-confirm.mp3', recordings['v01-confirm']))
        checked('evidence-pause-and-resume')
        page.evaluate("window.__hidden=true;document.dispatchEvent(new Event('visibilitychange'))")
        page.wait_for_function("window.__media.filter(m=>m.src.includes('/voice/')).every(m=>m.paused)")
        position = page.evaluate("window.__media.findLast(m=>m.src.includes('v01-confirm.mp3')).currentTime".replace('v01-confirm.mp3', recordings['v01-confirm']))
        page.wait_for_timeout(350)
        assert abs(page.evaluate("window.__media.findLast(m=>m.src.includes('v01-confirm.mp3')).currentTime".replace('v01-confirm.mp3', recordings['v01-confirm'])) - position) < .1
        page.evaluate("window.__hidden=false;document.dispatchEvent(new Event('visibilitychange'))")
        page.wait_for_function("window.__media.some(m=>m.src.includes('v01-confirm.mp3')&&!m.paused)".replace('v01-confirm.mp3', recordings['v01-confirm']))
        dialog.get_by_role('button', name='停止重听', exact=True).click()
        assert raw(page) == before
        checked('hidden-page-suspends-evidence-and-stop-preserves-progress')
        page.keyboard.press('Escape')
        page.get_by_role('button', name='设置', exact=True).click()
        page.get_by_label('静音', exact=True).check()
        page.keyboard.press('Escape')
        dialog = evidence(page)
        expect(dialog.get_by_role('button', name='重听：柜边录下的程砚声音', exact=True)).to_be_disabled()
        page.keyboard.press('Escape')
        page.get_by_role('button', name='设置', exact=True).click()
        page.get_by_label('静音', exact=True).uncheck()
        page.get_by_label('播放人物语音', exact=True).uncheck()
        page.keyboard.press('Escape')
        dialog = evidence(page)
        expect(dialog.get_by_role('button', name='重听：柜边录下的程砚声音', exact=True)).to_be_disabled()
        page.keyboard.press('Escape')
        page.get_by_role('button', name='设置', exact=True).click()
        page.get_by_label('播放人物语音', exact=True).check()
        page.keyboard.press('Escape')
        checked('mute-and-voice-preference-disable-evidence-replay')

        source_step = next(i for i, step in enumerate(chapter['path']) if step['actionId'] == 'record-source')
        for step in chapter['path'][source_step + 1:]:
            action(page, step['actionId'])
            if step['nodeId'] in ('firstPuzzle', 'finalPuzzle'):
                wrong, failure, retry = ('blameBox', 'boxFailure', 'firstPuzzle') if step['nodeId'] == 'firstPuzzle' else ('answerThird', 'thirdFailure', 'finalPuzzle')
                action(page, wrong)
                action(page, failure)
                saved = json.loads(raw(page))
                assert saved['completed'] == prefix and saved['archive'] == archive
                action(page, retry)
                checked('retry-' + failure + '-keeps-old-completion')
            if step['nodeId'] == 'secondHub':
                page.screenshot(path='docs/art/answering-preview.jpg', type='jpeg', quality=85, full_page=True)
        saved = json.loads(raw(page))
        assert saved['completed'] == prefix + ['answering']
        assert saved['archive']['answering'] == chapter['requiredEvidence']
        page.get_by_role('button', name='线路', exact=True).click()
        dialog = page.get_by_role('dialog', name='城市线路档案', exact=True)
        points = dialog.locator('.city-map-route:not(.map-followup)').get_attribute('points').split()
        assert len(points) == 7 and points[0] == points[-1]
        assert dialog.locator('.map-followup').count() == 2
        page.keyboard.press('Escape')
        checked('answering-completes-as-second-followup-with-original-city-loop')
        before = raw(page)
        dialog = evidence(page)
        assert dialog.get_by_role('button', name=re.compile(r'^重听：')).count() == 3
        dialog.get_by_role('button', name='重听：第二声：季宁收到', exact=True).click()
        page.wait_for_function("window.__media.some(m=>m.src.includes('v01-received.mp3')&&!m.paused)".replace('v01-received.mp3', recordings['v01-received']))
        dialog.get_by_role('button', name='停止重听', exact=True).click()
        assert raw(page) == before
        page.keyboard.press('Escape')
        checked('second-round-recordings-unlock-with-their-evidence')

        page.evaluate('navigator.serviceWorker.ready')
        page.wait_for_function('!!navigator.serviceWorker.controller')
        # The production worker has completed every file in its current precache.
        page.wait_for_function('''async()=>{
          const keys=await caches.keys();const key=keys.find(k=>k.includes('precache'));
          if(!key)return false;const cache=await caches.open(key);
          const entries=await cache.keys();return entries.some(r=>r.url.includes('communications-room.webp'))&&entries.some(r=>r.url.includes('latch-turn.mp3'));
        }''')
        context.set_offline(True)
        page.reload(wait_until='domcontentloaded')
        page.get_by_role('button', name='继续抢修', exact=True).click()
        dialog = evidence(page)
        dialog.get_by_role('button', name='重听：第一声：程砚到场', exact=True).click()
        page.wait_for_function("window.__media.some(m=>m.src.includes('v01-arrived.mp3')&&!m.paused&&m.readyState>=3)".replace('v01-arrived.mp3', recordings['v01-arrived']))
        dialog.get_by_role('button', name='停止重听', exact=True).click()
        checked('offline-restore-and-evidence-replay')
        context.set_offline(False)

        seed = dict(version=2, chapterId='answering', nodeId='firstHub', evidence=[], history=['firstHub'],
                    completed=prefix, archive=archive, savedAt='2026-10-13T02:00:00.000Z')
        for width, height in [(390, 844), (760, 430)]:
            small, _ = open_page(seed, (width, height))
            small.get_by_role('button', name='继续抢修', exact=True).click()
            assert small.locator('.scene-hotspot').count() == 3
            for marker in small.locator('.scene-hotspot').all():
                hit_test(marker)
            for identifier in ['seal', 'sealPosition', 'recordSource', 'record-source']:
                action(small, identifier)
            dialog = evidence(small)
            # Inspect actual CJK glyph rendering instead of a declared family.
            cdp = small.context.new_cdp_session(small)
            cdp.send('DOM.enable'); cdp.send('CSS.enable')
            document = cdp.send('DOM.getDocument')['root']['nodeId']
            title = cdp.send('DOM.querySelector', {'nodeId': document, 'selector': '#notebook-title'})['nodeId']
            fonts = cdp.send('CSS.getPlatformFontsForNode', {'nodeId': title})['fonts']
            assert any(font['isCustomFont'] and font['glyphCount'] >= 4 for font in fonts), fonts
            cdp.detach()
            replay = dialog.get_by_role('button', name='重听：柜边录下的程砚声音', exact=True)
            hit_test(replay)
            assert replay.evaluate('el=>getComputedStyle(el).backgroundColor') == 'rgb(21, 36, 26)'
            notice = small.locator('.save-notice.panel-notice').bounding_box()
            assert not notice or notice['height'] < 80, notice
            replay.click()
            control = dialog.get_by_role('button', name='暂停录音', exact=True)
            hit_test(control)
            control.click()
            small.screenshot(path=f'docs/art/answering-evidence-v{VERSION}-{width}x{height}.jpg', type='jpeg', quality=85, full_page=True)
            hit_test(dialog.get_by_role('button', name='关闭现场记录', exact=True))
            checked(f'chinese-font-evidence-and-hotspots-{width}x{height}')
        assert not errors, errors
        report = dict(status='passed', version=VERSION, base_url=BASE, checks=checks, page_errors=errors,
                      seconds=round(time.monotonic() - began, 2), actual_audio=True,
                      limitations=['Native media decoding and UI checks do not certify acting or physical speaker playback.'])
        Path(f'docs/evidence/v{VERSION}-answering-browser.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    finally:
        for context in contexts:
            context.close()
        browser.close()
