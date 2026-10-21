#!/usr/bin/env python3
"""v1.3 continuation, Visitors deductions, collected-only comparison and offline replay."""
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
spec = importlib.util.spec_from_file_location('release_browser', Path(__file__).with_name('release-browser.py'))
release = importlib.util.module_from_spec(spec)
spec.loader.exec_module(release)
chapters = release.fixtures()
recordings = release.recording_sources(chapters)
chapter = next(row for row in chapters if row['id'] == 'visitors')
prefix = [row['id'] for row in chapters[:8]]
archive = {row['id']: row['requiredEvidence'] for row in chapters[:8]}
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
    assert control.evaluate('''el => {
      const r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
      return r.x>=0&&r.y>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1&&(hit===el||el.contains(hit));
    }''')


def seed(node, evidence_ids):
    return dict(version=2, chapterId='visitors', nodeId=node, evidence=evidence_ids,
                history=['dispatch', node], completed=prefix, archive=archive, savedAt='2026-10-13T10:00:00.000Z')


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(executable_path=os.environ['CIRCUIT_CHROMIUM'], headless=True, args=['--no-sandbox'])

    def open_page(saved, viewport=(1280, 720)):
        context = browser.new_context(viewport=dict(width=viewport[0], height=viewport[1]))
        contexts.append(context)
        if os.environ.get('CIRCUIT_QA_FONT_DIR'):
            font_dir = Path(os.environ['CIRCUIT_QA_FONT_DIR'])
            css = (font_dir / 'index.css').read_text().replace('./files/', '/_qa-fonts/')
            css += "\n*{font-family:'Noto Serif SC Variable',serif !important;}"
            context.route('**/_qa-fonts/*', lambda route: route.fulfill(path=str(font_dir / 'files' / Path(urlsplit(route.request.url).path).name), content_type='font/woff2'))
            context.add_init_script('document.addEventListener("DOMContentLoaded",()=>{const s=document.createElement("style");s.textContent=' + json.dumps(css) + ';document.head.appendChild(s);},{once:true});')
        context.add_init_script('''
          window.__media=[];
          const nativePlay=HTMLMediaElement.prototype.play;
          HTMLMediaElement.prototype.play=function(...args) {
            if(!window.__media.includes(this))window.__media.push(this);
            if(this.src.includes('/voice/'))this.playbackRate=.3;
            return nativePlay.apply(this,args);
          };
        ''')
        context.add_init_script('if(!sessionStorage.getItem("visitors-qa-seeded")){' +
          'localStorage.setItem(' + json.dumps(PREFS) + ',' + json.dumps(json.dumps(preferences)) + ');' +
          'localStorage.setItem(' + json.dumps(AUTO) + ',' + json.dumps(json.dumps(saved)) + ');' +
          'sessionStorage.setItem("visitors-qa-seeded","yes");}')
        page = context.new_page()
        page.set_default_timeout(10000)
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(BASE, wait_until='networkidle')
        page.evaluate('document.fonts.ready')
        return page, context

    try:
        old = dict(version=2, chapterId='answering', nodeId='end', evidence=chapters[7]['requiredEvidence'],
                   history=['end'], completed=prefix, archive=archive, savedAt='2026-10-13T02:00:00.000Z')
        page, context = open_page(old)
        before = raw(page)
        page.get_by_role('button', name='章节选择', exact=True).click()
        expect(page.locator('[data-chapter-id="visitors"]')).to_be_enabled()
        assert raw(page) == before
        page.locator('[data-chapter-id="visitors"]').click()
        saved = json.loads(raw(page))
        assert saved['completed'] == prefix and saved['archive'] == archive and saved['evidence'] == []
        checked('v130-save-unlocks-visitors-without-reading-write')
        compared = False
        for step in chapter['path']:
            action(page, step['actionId'])
            if step['nodeId'] == 'knock':
                page.wait_for_function("Array.from(document.querySelectorAll('.stage img')).every(i=>i.complete&&i.naturalWidth>0)")
                page.screenshot(path='docs/art/visitors-preview.jpg', type='jpeg', quality=85)
            if step['nodeId'] == 'firstHub' and len(step['evidence']) == 1:
                dialog = evidence(page)
                expect(dialog.get_by_role('button', name='并排核对', exact=True)).to_be_disabled()
                assert dialog.locator('select').count() == 0
                page.keyboard.press('Escape')
                checked('one-collected-record-cannot-open-comparison')
            if step['nodeId'] == 'firstHub' and len(step['evidence']) == 2 and not compared:
                before = raw(page)
                dialog = evidence(page)
                dialog.get_by_role('searchbox').fill(chapter['evidence'][step['evidence'][0]]['title'])
                expect(dialog.locator('[data-evidence-id]')).to_have_count(1)
                dialog.get_by_role('button', name='并排核对', exact=True).click()
                left = dialog.get_by_label('核对记录一', exact=True)
                right = dialog.get_by_label('核对记录二', exact=True)
                assert left.locator('option').evaluate_all('els=>els.map(e=>e.value)') == step['evidence']
                assert right.locator('option').count() == 2
                a, b = left.input_value(), right.input_value()
                left.select_option(b)
                assert (left.input_value(), right.input_value()) == (b, a)
                assert dialog.locator('[data-evidence-id]').count() == 2
                dialog.get_by_role('button', name='全部记录', exact=True).click()
                assert dialog.locator('select').count() == 0 and raw(page) == before
                expect(dialog.locator('[data-evidence-id]')).to_have_count(2)
                page.keyboard.press('Escape')
                expect(page.get_by_role('button', name=re.compile(r'^证据 '))).to_be_focused()
                compared = True
                checked('search-to-comparison-collected-only-distinct-swaps-no-save-write')
        saved = json.loads(raw(page))
        assert saved['nodeId'] == 'end' and saved['completed'] == prefix + ['visitors']
        assert saved['archive']['visitors'] == chapter['requiredEvidence']
        checked('full-visitors-route-archives-five-records-and-nine-chapters')
        for puzzle, wrong, failure, retry in [('firstPuzzle', 'takeNumber', 'seatFailure', 'firstPuzzle'), ('finalPuzzle', 'nameVisitor', 'signatureFailure', 'finalPuzzle')]:
            inv = chapter['requiredEvidence'][:3] if puzzle == 'firstPuzzle' else chapter['requiredEvidence']
            failed, failed_context = open_page(seed(puzzle, inv))
            failed.get_by_role('button', name='继续抢修', exact=True).click()
            action(failed, wrong)
            action(failed, failure)
            assert json.loads(raw(failed))['completed'] == prefix
            action(failed, retry)
            assert json.loads(raw(failed))['nodeId'] == puzzle
            failed_context.close()
        checked('both-wrong-deductions-retry-without-completion')
        for width, height in [(1280, 720), (760, 430), (390, 844)]:
            investigation, investigation_context = open_page(seed('firstHub', []), (width, height))
            investigation.get_by_role('button', name='继续抢修', exact=True).click()
            for hotspot in investigation.locator('.scene-hotspot').all():
                hit_test(hotspot)
            if width == 390:
                investigation.screenshot(path='docs/art/visitors-mobile-preview.jpg', type='jpeg', quality=85)
            investigation_context.close()
            responsive, responsive_context = open_page(seed('finalPuzzle', chapter['requiredEvidence']), (width, height))
            responsive.get_by_role('button', name='继续抢修', exact=True).click()
            before = raw(responsive)
            dialog = evidence(responsive)
            dialog.get_by_role('button', name='并排核对', exact=True).click()
            dialog.get_by_label('核对记录一', exact=True).select_option('v03-card')
            dialog.get_by_label('核对记录二', exact=True).select_option('v03-test')
            for control in [dialog.get_by_label('核对记录一', exact=True), dialog.get_by_label('核对记录二', exact=True), dialog.get_by_role('button', name='重听：2019旧档：车还等吗', exact=True)]:
                hit_test(control)
            assert responsive.evaluate('document.documentElement.scrollWidth<=innerWidth')
            assert dialog.evaluate('e=>e.scrollWidth<=e.clientWidth+1')
            assert raw(responsive) == before
            if width in [760, 390]:
                dialog.evaluate('e=>e.scrollTop=0')
                responsive.screenshot(path=f'docs/art/visitors-evidence-{width}x{height}.jpg', type='jpeg', quality=85)
            responsive_context.close()
            checked(f'comparison-readable-and-operable-{width}x{height}')
        offline, offline_context = open_page(seed('finalPuzzle', chapter['requiredEvidence']))
        offline.evaluate('navigator.serviceWorker.ready')
        offline.wait_for_function('navigator.serviceWorker.controller!==null', timeout=30000)
        offline_context.set_offline(True)
        offline.reload(wait_until='networkidle')
        offline.get_by_role('button', name='继续抢修', exact=True).click()
        before = raw(offline)
        dialog = evidence(offline)
        dialog.get_by_role('button', name='并排核对', exact=True).click()
        dialog.get_by_label('核对记录一', exact=True).select_option('v03-card')
        dialog.get_by_role('button', name='重听：2019旧档：车还等吗', exact=True).click()
        offline.wait_for_function("window.__media.some(m=>m.src.includes('q07-xu.mp3')&&!m.paused)".replace('q07-xu.mp3', recordings['q07-xu']))
        dialog.get_by_role('button', name='停止重听', exact=True).click()
        assert raw(offline) == before
        checked('offline-comparison-replays-original-2019-master-without-save-write')
        assert not errors, errors
        checked('no-javascript-errors')
    finally:
        for context in contexts:
            context.close()
        browser.close()

report = dict(version='1.4.0', status='passed', base_url=BASE, checks=checks,
              elapsed_seconds=round(time.monotonic()-began, 2), limitations=['Automated browser checks; physical-device play and human acting review not certified.'])
suffix = 'pages' if '/Circuit' in urlsplit(BASE).path else 'root'
Path(f'docs/evidence/v1.4.0-visitors-{suffix}-browser.json').write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n')
print(json.dumps(report, ensure_ascii=False, indent=2))
