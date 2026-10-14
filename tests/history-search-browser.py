#!/usr/bin/env python3
"""Already-read logs/evidence, original voice binding and offline search."""
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
chapter = chapters[-1]
index = max(i for i, step in enumerate(chapter['path']) if 2 <= len(step['evidence']) < len(chapter['requiredEvidence']))
moves = chapter['path'][:index + 1]
seen = [chapter['initial']['nodeId']] + [step['nodeId'] for step in moves]
seed = dict(version=2, chapterId=chapter['id'], nodeId=moves[-1]['nodeId'], evidence=moves[-1]['evidence'], history=seen,
            completed=[row['id'] for row in chapters[:-1]], archive={row['id']: row['requiredEvidence'] for row in chapters[:-1]},
            savedAt='2026-10-14T02:00:00.000Z')
clip, binding = next((clip, dict(node=node)) for node in seen for clip in chapter['voices'][node])
entry = chapter['nodes'][binding['node']]
query = entry['text'][:8]
preferences = dict(release.PREFERENCES, voiceEnabled=True, voiceVolume=.8, muted=False)
checks, errors = [], []
output = Path('artifacts/history-search'); output.mkdir(parents=True, exist_ok=True)

def checked(name):
    checks.append(name); print('PASS', name, flush=True)

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(executable_path=os.environ['CIRCUIT_CHROMIUM'], headless=True, args=['--no-sandbox'])
    for width, height in [(1440, 900), (412, 915), (568, 320)]:
        context = browser.new_context(viewport=dict(width=width, height=height))
        context.add_init_script('''window.__media=[];const nativePlay=HTMLMediaElement.prototype.play;
        HTMLMediaElement.prototype.play=function(...args){if(!window.__media.includes(this))window.__media.push(this);if(this.src.includes('/voice/'))this.playbackRate=.3;return nativePlay.apply(this,args);};''')
        context.add_init_script('if(!sessionStorage.getItem("history-qa")){localStorage.setItem(' + json.dumps(release.AUTO) + ',' + json.dumps(json.dumps(seed)) + ');localStorage.setItem(' + json.dumps(release.SETTINGS) + ',' + json.dumps(json.dumps(preferences)) + ');sessionStorage.setItem("history-qa","1");}')
        page = context.new_page(); page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(sys.argv[1], wait_until='networkidle')
        assert page.evaluate("""document.fonts.ready.then(()=>document.fonts.check('14px \"Circuit Sans\"'))""")
        page.get_by_role('button', name='继续抢修', exact=True).click()
        before = page.evaluate('localStorage.getItem(' + json.dumps(release.AUTO) + ')')
        page.get_by_role('button', name='历史', exact=True).click()
        dialog = page.get_by_role('dialog', name='抢修日志', exact=True)
        expect(dialog.locator('.history-entry')).to_have_count(len(seen))
        dialog.get_by_role('searchbox').fill('未读XYZ a h l s')
        expect(dialog.locator('.history-entry')).to_have_count(0)
        expect(dialog).to_contain_text('没有找到这条记录')
        dialog.get_by_role('button', name='清除筛选', exact=True).click()
        dialog.get_by_label('说话人', exact=True).select_option(entry.get('speaker') or '旁白')
        dialog.get_by_role('searchbox').fill(query)
        row = dialog.locator('.history-entry').filter(has_text=entry['text'])
        row.get_by_role('button', name='重听这条语音', exact=True).click()
        page.wait_for_function('src=>window.__media.some(media=>media.src.endsWith(src)&&!media.paused)', arg=clip['src'])
        dialog.get_by_role('button', name='暂停录音', exact=True).click()
        expect(dialog.get_by_role('button', name='继续录音', exact=True)).to_be_visible()
        page.screenshot(path=str(output / f'log-{width}.png'))
        dialog.get_by_role('button', name='关闭抢修日志', exact=True).click()
        assert page.evaluate('localStorage.getItem(' + json.dumps(release.AUTO) + ')') == before
        checked(f'{width}x{height}: read-log filtering, original voice, pause and unchanged save')
        page.get_by_role('button', name=re.compile(r'^证据 ')).click()
        dialog = page.get_by_role('dialog', name='现场记录', exact=True)
        unseen = next(identity for identity in chapter['evidence'] if identity not in seed['evidence'])
        dialog.get_by_role('searchbox').fill(chapter['evidence'][unseen]['title'])
        expect(dialog.locator('article')).to_have_count(0)
        identity = next(identity for identity in seed['evidence'] if chapter['evidence'][identity].get('recordings'))
        detail = chapter['evidence'][identity]
        dialog.get_by_role('searchbox').fill(detail['title'])
        expect(dialog.locator('article')).to_have_count(1)
        dialog.get_by_role('button', name='重听：' + detail['recordings'][0]['label'], exact=True).click()
        expect(dialog.get_by_role('button', name='暂停录音', exact=True)).to_be_visible()
        dialog.get_by_role('button', name='停止重听', exact=True).click()
        page.screenshot(path=str(output / f'evidence-{width}.png'))
        dialog.get_by_role('button', name='清除筛选', exact=True).click()
        expect(dialog.locator('article')).to_have_count(len(seed['evidence']))
        dialog.get_by_role('button', name='关闭现场记录', exact=True).click()
        assert page.evaluate('localStorage.getItem(' + json.dumps(release.AUTO) + ')') == before
        checked(f'{width}x{height}: acquired-only evidence search and original recording controls')
        page.evaluate('navigator.serviceWorker.ready.then(()=>true)')
        context.set_offline(True); page.reload()
        page.get_by_role('button', name='继续抢修', exact=True).click()
        page.get_by_role('button', name='历史', exact=True).click()
        page.get_by_role('searchbox').fill(query)
        expect(page.locator('.history-entry').filter(has_text=entry['text'])).to_be_visible()
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
        checked(f'{width}x{height}: offline reload retains searchable read route')
        context.close()
    browser.close()
assert not errors, errors
(output / 'acceptance.json').write_text(json.dumps(dict(status='passed', checks=checks, errors=errors, real_windows_execution=False), ensure_ascii=False, indent=2) + '\n')
