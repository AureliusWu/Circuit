#!/usr/bin/env python3
"""Verify the deployed game at three sizes, including a real offline reload."""
import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import time
from urllib.parse import urljoin

from playwright.sync_api import expect, sync_playwright

AUTO = 'circuit-auto-v100'
SETTINGS = 'circuit-settings-v100'
PREFERENCES = dict(textSpeed='instant', autoDelay=2, musicVolume=0, ambienceVolume=0,
                   voiceVolume=0.8, sfxVolume=0.6, voiceEnabled=False, muted=True,
                   highContrast=False, reducedMotion=True)
VIEWPORTS = [(1280, 720), (390, 844), (760, 430)]


def storage(page):
    return page.evaluate('Object.fromEntries(Object.keys(localStorage).map(key=>[key,localStorage.getItem(key)]))')


def hit_test(button):
    expect(button).to_be_visible()
    measured = button.evaluate('''element => {
      const r=element.getBoundingClientRect();
      return {label:element.getAttribute('aria-label')||element.textContent,
        contained:r.x>=-1&&r.y>=-1&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1,
        hits:[[r.x+r.width/2,r.y+r.height/2],[r.x+4,r.y+4],[r.right-4,r.bottom-4]].map(([x,y])=>{
          const hit=document.elementFromPoint(x,y);return hit===element||element.contains(hit);
        })};
    }''')
    assert measured['contained'] and all(measured['hits']), measured


def read_history(page):
    before = storage(page)
    opener = page.get_by_role('button', name='历史', exact=True)
    hit_test(opener)
    opener.click()
    dialog = page.get_by_role('dialog', name='抢修日志', exact=True)
    expect(dialog).to_be_visible()
    for key in ['Tab', 'Shift+Tab']:
        page.keyboard.press(key)
        assert dialog.evaluate('element=>element.contains(document.activeElement)'), 'History lost keyboard focus'
    page.keyboard.press('Escape')
    expect(dialog).to_have_count(0)
    expect(opener).to_be_focused()
    assert storage(page) == before, 'Reading history wrote stored data'


def settled_title(page, version):
    expect(page.get_by_role('heading', name='回路', exact=True)).to_be_visible(timeout=30000)
    expect(page.locator('.version')).to_contain_text(f'v{version}')
    page.evaluate('document.fonts.ready')
    assert page.evaluate('document.fonts.check("16px \'Circuit Sans\'")'), 'Bundled Chinese font is unavailable'


def published_files(context, url, expected):
    verified = []
    for name, digest in expected.items():
        address = urljoin(url, name)
        response = context.request.get(address, timeout=15000, headers={'Cache-Control': 'no-cache'})
        assert response.ok, f'Published {name}: HTTP {response.status}'
        body = response.body()
        actual = hashlib.sha256(body).hexdigest()
        assert actual == digest, f'Published {name} differs from this build: expected {digest}, received {actual}'
        verified.append(dict(url=address, sha256=actual, bytes=len(body)))
    return verified


def run(url, output, expected_build):
    began = time.monotonic()
    url = url.rstrip('/') + '/'
    root = Path(__file__).resolve().parents[1]
    version = json.loads((root / 'package.json').read_text(encoding='utf-8'))['version']
    expected = {name: hashlib.sha256((expected_build / name).read_bytes()).hexdigest()
                for name in ['index.html', 'sw.js']}
    audio = sorted(urljoin(url, path.relative_to(root / 'public').as_posix())
                   for path in (root / 'public/audio').rglob('*.mp3'))
    assert len(audio) == 51, f'Expected all 51 release MP3s, found {len(audio)}'
    samples = [urljoin(url, path) for path in ['audio/voice/h13-dispatch.mp3', 'audio/sfx/glass-tap.mp3']]
    assert all(path in audio for path in samples)
    output.parent.mkdir(parents=True, exist_ok=True)
    summary = dict(base_url=url, version=version, commit=os.environ.get('GITHUB_SHA'),
                   checked_at=datetime.now(timezone.utc).isoformat(), published_files=[],
                   viewports=[], page_errors=[], status='running')
    phase, page = 'launch-browser', None
    try:
        with sync_playwright() as playwright:
            options = dict(headless=True, args=['--no-sandbox'])
            if os.environ.get('CIRCUIT_CHROMIUM'):
                options['executable_path'] = os.environ['CIRCUIT_CHROMIUM']
            browser = playwright.chromium.launch(**options)
            try:
                for width, height in VIEWPORTS:
                    label = f'{width}x{height}'
                    phase = label + ':online-title'
                    context = browser.new_context(viewport=dict(width=width, height=height))
                    try:
                        # Only reading preferences are seeded; all progress comes from real UI actions.
                        context.add_init_script('''if(location.protocol.startsWith('http')&&!sessionStorage.getItem('live-preferences')){
                          localStorage.setItem(SETTINGS,JSON.stringify(PREFERENCES));
                          sessionStorage.setItem('live-preferences','1');
                        }'''.replace('SETTINGS', json.dumps(SETTINGS)).replace('PREFERENCES', json.dumps(PREFERENCES)))
                        page = context.new_page()
                        page.set_default_timeout(15000)
                        page.on('pageerror', lambda error: summary['page_errors'].append(str(error)))
                        # Pages propagation is external to game startup. Give each request a real network timeout.
                        deadline, last_error = time.monotonic() + 90, None
                        while time.monotonic() < deadline:
                            try:
                                response = context.request.get(url, timeout=15000, headers={'Cache-Control': 'no-cache'})
                                if response.ok:
                                    if not summary['published_files']:
                                        summary['published_files'] = published_files(context, url, expected)
                                    break
                                last_error = f'HTTP {response.status}'
                            except Exception as error:
                                last_error = str(error)
                            page.wait_for_timeout(1000)
                        else:
                            raise AssertionError(f'Deployed entrypoint unavailable: {last_error}')
                        response = page.goto(url, wait_until='load', timeout=60000)
                        assert response and response.ok, 'Deployed document failed'
                        settled_title(page, version)
                        phase = label + ':service-worker-cache'
                        page.wait_for_function('async()=>Boolean((await navigator.serviceWorker.getRegistration())?.active)', timeout=90000)
                        # Precache installation precedes activation. An initial page may still need an online reload to be controlled.
                        if not page.evaluate('Boolean(navigator.serviceWorker.controller)'):
                            page.reload(wait_until='load', timeout=60000)
                            settled_title(page, version)
                        page.wait_for_function('Boolean(navigator.serviceWorker.controller)', timeout=30000)
                        page.wait_for_function('''async paths => {
                          const matches=await Promise.all(paths.map(path=>caches.match(path,{ignoreSearch:true})));
                          return matches.every(response=>response&&response.ok);
                        }''', arg=audio, timeout=90000, polling=250)
                        row = dict(viewport=dict(width=width, height=height), document_url=page.url,
                                   service_worker=page.evaluate('navigator.serviceWorker.controller.scriptURL'),
                                   cached_audio_count=len(audio))
                        phase = label + ':online-gameplay-and-history'
                        start = page.get_by_role('button', name='开始抢修', exact=True)
                        start.scroll_into_view_if_needed()
                        hit_test(start)
                        start.click()
                        expect(page.locator('.hud')).to_be_visible()
                        page.wait_for_function('localStorage.getItem(' + json.dumps(AUTO) + ')!==null')
                        initial = storage(page)[AUTO]
                        for control in page.locator('.hud button').all():
                            hit_test(control)
                        action = page.locator('button[data-action-id]').first
                        action.scroll_into_view_if_needed()
                        hit_test(action)
                        action.click()
                        page.wait_for_function('args=>localStorage.getItem(args.key)!==args.previous',
                                               arg=dict(key=AUTO, previous=initial))
                        before = storage(page)
                        assert before[AUTO] != initial, 'UI action did not advance the automatic save'
                        read_history(page)
                        page.screenshot(path=str(output.parent / f'{label}-online.png'))
                        row['save_sha256'] = hashlib.sha256(before[AUTO].encode()).hexdigest()
                        phase = label + ':offline-reload-and-resume'
                        context.set_offline(True)
                        page.reload(wait_until='load', timeout=30000)
                        settled_title(page, version)
                        assert not page.evaluate('navigator.onLine'), 'Browser did not enter offline mode'
                        assert storage(page) == before, 'Offline reload rewrote stored progress'
                        page.get_by_role('button', name='继续抢修', exact=True).click()
                        expect(page.locator('.hud')).to_be_visible()
                        expect(page.locator('.dialogue-text')).to_be_visible()
                        assert storage(page) == before, 'Offline continue rewrote stored progress'
                        read_history(page)
                        phase = label + ':offline-audio-decode'
                        row['offline_audio'] = page.evaluate('''async paths => {
                          const audio=new OfflineAudioContext(1,24000,24000), results=[];
                          for(const path of paths){
                            const response=await fetch(path);
                            if(!response.ok)throw new Error('Offline audio missing: '+path);
                            const buffer=await audio.decodeAudioData(await response.arrayBuffer());
                            results.push({path,duration:buffer.duration,channels:buffer.numberOfChannels});
                          }
                          return results;
                        }''', samples)
                        assert all(item['duration'] > .05 and item['channels'] == 1 for item in row['offline_audio']), row
                        assert not summary['page_errors'], summary['page_errors']
                        page.screenshot(path=str(output.parent / f'{label}-offline.png'))
                        row['status'] = 'passed'
                        summary['viewports'].append(row)
                    except Exception:
                        if page and not page.is_closed():
                            try:
                                page.screenshot(path=str(output.parent / f'{label}-failure.png'))
                                summary['diagnostic'] = dict(url=page.url,
                                    buttons=page.locator('button:visible').all_text_contents(),
                                    notices=page.locator('[role="status"]').all_text_contents())
                            except Exception as diagnostic_error:
                                summary['diagnostic_error'] = str(diagnostic_error)
                        raise
                    finally:
                        context.close()
                        page = None
                assert not summary['page_errors'], summary['page_errors']
                summary['status'] = 'passed'
            finally:
                browser.close()
    except Exception as error:
        summary.update(status='failed', failed_phase=phase, error=str(error))
    finally:
        summary['duration_seconds'] = round(time.monotonic() - began, 2)
        output.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    return summary


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('base_url')
    parser.add_argument('--output', type=Path, default=Path('artifacts/pages-live/live-browser.json'))
    parser.add_argument('--expected-build', type=Path, required=True)
    args = parser.parse_args()
    result = run(args.base_url, args.output, args.expected_build)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    raise SystemExit(0 if result['status'] == 'passed' else 1)
