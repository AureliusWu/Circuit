#!/usr/bin/env python3
"""Finish V05 from a v1.9 save: deductions, original audio, score and offline."""
import importlib.util
import json
import os
from pathlib import Path
import sys
from playwright.sync_api import expect, sync_playwright
from async_browser import wait_async

spec = importlib.util.spec_from_file_location('release_browser', Path(__file__).with_name('release-browser.py'))
release = importlib.util.module_from_spec(spec)
spec.loader.exec_module(release)
chapters = release.fixtures()
chapter = next(row for row in chapters if row['id'] == 'signoff')
prefix = [row['id'] for row in chapters[:10]]
archive = {row['id']: row['requiredEvidence'] for row in chapters[:10]}
old = dict(version=2, chapterId='tickets', nodeId='end', evidence=chapters[9]['requiredEvidence'],
           history=['end'], completed=prefix, archive=archive, savedAt='2026-10-25T01:00:00.000Z')
url = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:4173'
checks, errors = [], []
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ['CIRCUIT_CHROMIUM'], headless=True, args=['--no-sandbox'])
    context = browser.new_context(viewport={'width': 1280, 'height': 720})
    context.add_init_script('''window.__media=[];window.__loops=[];
const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){window.__media.push(this);return play.apply(this,args);};
const native=AudioContext.prototype.createBufferSource;AudioContext.prototype.createBufferSource=function(){
 const source=native.call(this),start=source.start.bind(source),stop=source.stop.bind(source);
 source.start=(...args)=>{if(source.loop&&source.buffer){source.__duration=source.buffer.duration;window.__loops.push(source);}return start(...args);};
 source.stop=(...args)=>{source.__stopped=true;return stop(...args);};return source;};''')
    context.add_init_script('if(!sessionStorage.getItem("signoff-seeded")){' +
        'localStorage.setItem("circuit-auto-v100",' + json.dumps(json.dumps(old)) + ');' +
        'localStorage.setItem("circuit-settings-v100",' + json.dumps(json.dumps(dict(textSpeed='instant', autoDelay=2,
            voiceEnabled=True, voiceVolume=.5, sfxVolume=.3, musicVolume=.15, ambienceVolume=.1,
            muted=False, highContrast=False, reducedMotion=True))) + ');sessionStorage.setItem("signoff-seeded","yes");}')
    page = context.new_page()
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(url)
    before = page.evaluate('localStorage.getItem("circuit-auto-v100")')
    page.get_by_role('button', name='章节选择', exact=True).click()
    expect(page.locator('[data-chapter-id="signoff"]')).to_be_enabled()
    assert page.evaluate('localStorage.getItem("circuit-auto-v100")') == before
    page.locator('[data-chapter-id="signoff"]').click()
    checks.append('v1.9 completion unlocks final chapter without rewriting old slots')

    def action(identifier):
        page.locator('button[data-action-id=' + json.dumps(identifier) + ']').click()

    def saved():
        return json.loads(page.evaluate('localStorage.getItem("circuit-auto-v100")'))

    for step in chapter['path']:
        if step['nodeId'] == 'correctBorrower':
            action('wrongBorrower')
            assert saved()['completed'] == prefix and len(saved()['evidence']) == 3
            action('compare'); action('puzzle1')
            checks.append('wrong borrower deduction preserves evidence and cannot complete chapter')
        if step['nodeId'] == 'closeDesk':
            action('wrongSign')
            assert saved()['completed'] == prefix and len(saved()['evidence']) == 5
            action('compareEnd'); action('puzzle2')
            checks.append('wrong historical signature retries without changing completed prefix')
        action(step['actionId'])
        if step['nodeId'] == 'drive':
            page.wait_for_function("window.__media.some(a=>a.src.includes('circuit-signoff--drive--')&&!a.paused&&a.readyState>=2)")
            checks.append('new character dialogue actually plays from the final local take')
        if step['nodeId'] == 'firstHub':
            page.wait_for_function("window.__loops.some(a=>!a.__stopped&&Math.abs(a.__duration-91.428)<.1)")
            expect(page.locator('.stage-background img')).to_have_attribute('src', '/art/archive-office.webp')
            for width, height in [(1440, 900), (412, 915), (568, 320), (640, 360), (844, 390), (915, 412)]:
                page.set_viewport_size({'width': width, 'height': height})
                page.wait_for_function("document.querySelector('.stage-background img').naturalWidth===1672")
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
            page.set_viewport_size({'width': 1280, 'height': 720})
        if step['nodeId'] == 'origin':
            page.wait_for_function("window.__loops.some(a=>!a.__stopped&&Math.abs(a.__duration-112.9413)<.1)")
            checks.append('source investigation changes to tension score')
        if step['nodeId'] == 'secondHub' and 'v05-origin' in step['evidence']:
            before = page.evaluate('localStorage.getItem("circuit-auto-v100")')
            page.get_by_role('button', name=__import__('re').compile(r'^证据 ')).click()
            page.get_by_role('button', name='重听：原文件：先别替它确认', exact=True).click()
            original = next(clip for clip in chapter['voices']['origin'] if clip['text'] == '先别替它确认。')['src']
            page.wait_for_function('file=>window.__media.some(a=>a.src.endsWith(file)&&!a.paused&&a.readyState>=2)', arg=original)
            page.keyboard.press('Escape')
            assert page.evaluate('localStorage.getItem("circuit-auto-v100")') == before
            checks.append('collected final evidence replays original bytes without saving')
        if step['nodeId'] == 'closeDesk':
            page.wait_for_function("!window.__loops.some(a=>!a.__stopped&&a.__duration>60)")
            checks.append('final signature fades music into an authored quiet scene')

    assert saved()['completed'] == prefix + ['signoff']
    assert set(saved()['archive']['signoff']) == set(chapter['requiredEvidence'])
    expect(page.locator('.dialogue-text span')).to_contain_text('第二部完结')
    checks.append('all eleven chapters and V05 completion persist with five final records')
    wait_async(page, '''async()=>{if(!navigator.serviceWorker.controller)return false;
      for(const key of await caches.keys()){const c=await caches.open(key);for(const req of await c.keys()){if(new URL(req.url).pathname.endsWith('/art/archive-office.webp')&&await c.match(req))return true;}}return false;}''')
    before = saved()
    context.set_offline(True); page.reload()
    page.get_by_role('button', name='继续抢修', exact=True).click()
    assert saved() == before
    expect(page.locator('.dialogue-text span')).to_contain_text('关灯，走到门外')
    checks.append('true offline reload resumes the finished work without a new cliffhanger')
    assert not errors, errors
    browser.close()
print(json.dumps({'status': 'passed', 'checks': checks, 'errors': errors}, ensure_ascii=False, indent=2))
