#!/usr/bin/env python3
"""Real v1.4 continuation, both failed deductions, original replay and offline V04."""
import importlib.util
import json
import os
from pathlib import Path
import re
import sys
from playwright.sync_api import expect, sync_playwright

spec = importlib.util.spec_from_file_location('release_browser', Path(__file__).with_name('release-browser.py'))
release = importlib.util.module_from_spec(spec)
spec.loader.exec_module(release)
chapters = release.fixtures()
chapter = next(row for row in chapters if row['id'] == 'tickets')
prefix = [row['id'] for row in chapters[:9]]
archive = {row['id']: row['requiredEvidence'] for row in chapters[:9]}
old = dict(version=2, chapterId='visitors', nodeId='end', evidence=chapters[8]['requiredEvidence'],
           history=['end'], completed=prefix, archive=archive, savedAt='2026-10-17T02:00:00.000Z')
url = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:4173'
checks, errors = [], []
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ['CIRCUIT_CHROMIUM'], headless=True, args=['--no-sandbox'])
    context = browser.new_context(viewport={'width': 1280, 'height': 720})
    context.add_init_script('''
      window.__media=[];
      const nativePlay=HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play=function(...args){
        if(!window.__media.includes(this))window.__media.push(this);
        return nativePlay.apply(this,args);
      };
    ''')
    context.add_init_script('if(!sessionStorage.getItem("tickets-seeded")){' +
        'localStorage.setItem("circuit-auto-v100",' + json.dumps(json.dumps(old)) + ');' +
        'localStorage.setItem("circuit-settings-v100",' + json.dumps(json.dumps(dict(textSpeed='instant',
            autoDelay=2, voiceEnabled=True, voiceVolume=.7, sfxVolume=.5, musicVolume=0,
            ambienceVolume=0, muted=False, highContrast=False, reducedMotion=True))) + ');' +
        'sessionStorage.setItem("tickets-seeded","yes");}')
    page = context.new_page()
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(url)
    before = page.evaluate('localStorage.getItem("circuit-auto-v100")')
    page.get_by_role('button', name='章节选择', exact=True).click()
    expect(page.locator('[data-chapter-id="tickets"]')).to_be_enabled()
    assert page.evaluate('localStorage.getItem("circuit-auto-v100")') == before
    page.locator('[data-chapter-id="tickets"]').click()
    checks.append('v1.4 completed save unlocks V04 without read-time mutation')

    def action(identifier):
        page.locator('button[data-action-id=' + json.dumps(identifier) + ']').click()

    def saved():
        return json.loads(page.evaluate('localStorage.getItem("circuit-auto-v100")'))

    for step in chapter['path']:
        if step['nodeId'] == 'correctSide':
            action('wrongSeat')
            assert saved()['completed'] == prefix
            action('compare')
            action('puzzle1')
            checks.append('wrong receiving-seat deduction retries with all records preserved')
        if step['nodeId'] == 'stopped':
            action('wrongWriter')
            assert saved()['completed'] == prefix
            action('compareSource')
            action('puzzle2')
            checks.append('wrong writer deduction retries without future unlock')
        action(step['actionId'])
        if saved()['nodeId'] == 'slips':
            expect(page.locator('.stage-background img')).to_have_attribute('src', re.compile(r'cg-ticket-window\.webp$'))
            expect(page.locator('.character-portrait')).to_have_count(0)
            for width, height in [(1440, 900), (412, 915), (568, 320), (640, 360), (844, 390), (915, 412)]:
                page.set_viewport_size({'width': width, 'height': height})
                page.wait_for_function("document.querySelector('.stage-background img').naturalWidth === 1600")
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
            page.set_viewport_size({'width': 1280, 'height': 720})
            checks.append('window CG uses no portrait overlay and fits six viewports')
        if step['nodeId'] == 'emptyChair':
            page.wait_for_function("Array.from(document.querySelectorAll('.stage img')).every(i=>i.complete&&i.naturalWidth>0)")
            expect(page.locator('.dialogue-text span')).to_have_text(chapter['nodes']['emptyChair']['text'])
            page.wait_for_function("!Array.from(document.querySelectorAll('[role=status]')).some(e=>e.textContent.includes('进度已自动保存'))")
            Path('docs/art').mkdir(exist_ok=True)
            page.screenshot(path='docs/art/tickets-preview.jpg', type='jpeg', quality=85)
        if step['nodeId'] == 'secondHub' and 'v04-source' in step['evidence']:
            before = page.evaluate('localStorage.getItem("circuit-auto-v100")')
            page.get_by_role('button', name=re.compile(r'^证据 ')).click()
            page.get_by_role('button', name='重听：原文件：先别替它确认', exact=True).click()
            page.wait_for_function("window.__media.some(a=>a.src.endsWith('/v01-confirm.mp3')&&!a.paused&&a.readyState>=2)")
            page.keyboard.press('Escape')
            assert page.evaluate('localStorage.getItem("circuit-auto-v100")') == before
            checks.append('collected source plays the original recording without saving')
    assert saved()['completed'] == prefix + ['tickets']
    assert saved()['archive']['tickets'] == chapter['requiredEvidence']
    checks.append('V04 completion and five evidence records persist')
    page.wait_for_function('navigator.serviceWorker.controller !== null')
    context.set_offline(True)
    page.reload()
    page.get_by_role('button', name='继续抢修', exact=True).click()
    assert saved()['nodeId'] == 'end'
    checks.append('complete V04 reopens offline with unchanged position')
    duration = page.evaluate("""async () => {
      const audio = new AudioContext();
      try { return (await audio.decodeAudioData(await (await fetch('./audio/bgm/ticket-window.ogg')).arrayBuffer())).duration; }
      finally { await audio.close(); }
    }""")
    assert 63 < duration < 65
    checks.append('new 64-second scene score decodes from the actual offline cache')
    assert not errors, errors
    browser.close()
print(json.dumps({'status': 'passed', 'checks': checks, 'errors': errors}, ensure_ascii=False, indent=2))
