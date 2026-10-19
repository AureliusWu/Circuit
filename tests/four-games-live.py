#!/usr/bin/env python3
"""Check four published PWAs in one fresh browser profile and one offline session.

This supplements each game's route, save migration and platform tests. It never
uses the user's browser profile or changes an existing save.
"""
import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path

from playwright.sync_api import expect, sync_playwright

ORIGIN = 'https://aureliuswu.github.io'
GAMES = ('Circuit', 'NetLove', 'Healing', 'Rain')


def cache_inventory(page):
    return page.evaluate('''async () => {
      const result = {};
      for (const name of (await caches.keys()).sort()) {
        result[name] = (await (await caches.open(name)).keys()).map(r => r.url).sort();
      }
      return result;
    }''')


def progress(page):
    return page.evaluate('''() => Object.fromEntries(Object.keys(localStorage)
      .filter(k => k === 'circuit-auto-v100' || /^(netlove|moist-healing):v1:save:/.test(k))
      .sort().map(k => [k, JSON.parse(localStorage.getItem(k))]))''')


def states(values):
    # React autosaves may refresh savedAt on an explicit Continue. Route state
    # and archived proof must stay intact; byte-preserving import is separate.
    return {key: {field: value for field, value in record.items() if field != 'savedAt'}
            for key, record in values.items()}


def boot(page, game, version):
    if game == 'Rain':
        page.wait_for_function('() => window.rainOfflineReady === true && typeof window.renpy_get === "function"', timeout=120000)
        page.wait_for_function('() => !document.getElementById("presplash")', timeout=120000)
        assert page.evaluate('() => window.renpy_get("config.version")') == version
        page.wait_for_function('() => window.renpy_get(\'bool(renpy.get_screen("main_menu"))\')', timeout=60000)
        expect(page.locator('#canvas')).to_be_visible()
    else:
        expect(page.get_by_role('heading', level=1)).to_contain_text({'Circuit': '回路', 'NetLove': '网', 'Healing': '湿性愈合'}[game], timeout=30000)
        expect(page.locator('.version' if game == 'Circuit' else '.title-footer')).to_contain_text('v' + version)
    # Function predicates preserve the players' CSP; expression strings use eval.
    page.wait_for_function('() => Boolean(navigator.serviceWorker.controller)', timeout=120000)
    expected = f'{ORIGIN}/{game}/'
    owner = page.evaluate('''async () => {
      const r = await navigator.serviceWorker.getRegistration(location.href);
      return {scope:r?.scope, active:r?.active?.scriptURL, controller:navigator.serviceWorker.controller?.scriptURL};
    }''')
    script = 'service-worker.js' if game == 'Rain' else 'sw.js'
    assert owner == dict(scope=expected, active=expected + script, controller=expected + script), owner
    return owner


def read_and_save(page, game):
    if game == 'Rain':
        return  # The pinned native/Web pipeline tests real Ren'Py Save/Load.
    page.get_by_role('button', name='开始抢修' if game == 'Circuit' else '开始阅读', exact=True).click()
    if game == 'Circuit':
        expect(page.locator('.hud')).to_be_visible()
        page.locator('button[data-action-id]').first.click()
        key = 'circuit-auto-v100'
    else:
        expect(page.locator('.game-screen')).to_have_attribute('data-line', '0')
        if game == 'Healing':
            page.get_by_role('button', name='显示下一段', exact=True).click()
        else:
            page.locator('.dialogue-text').click()
        expect(page.locator('.game-screen')).to_have_attribute('data-line', '1')
        key = ('netlove' if game == 'NetLove' else 'moist-healing') + ':v1:save:auto'
    page.wait_for_function('key => localStorage.getItem(key) !== null', arg=key)


def run(versions, output):
    output.parent.mkdir(parents=True, exist_ok=True)
    report = dict(schema=1, checked_at=datetime.now(timezone.utc).isoformat(),
                  expected_versions=versions, status='running', installs=[], offline=[], page_errors=[],
                  scope='Fresh Chromium profile; same-origin caches, real React autosaves and offline startup. Native Save/Load, Windows and physical devices are separate checks.')
    phase = 'launch'
    try:
        with sync_playwright() as playwright:
            options = dict(headless=True, args=['--no-sandbox', '--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader'])
            if os.environ.get('CIRCUIT_CHROMIUM'):
                options['executable_path'] = os.environ['CIRCUIT_CHROMIUM']
            browser = playwright.chromium.launch(**options)
            try:
                report['browser_version'] = browser.version
                context = browser.new_context(viewport=dict(width=1440, height=900))
                context.add_init_script(r'''(() => {
                  if (!location.hostname.endsWith('github.io')) return;
                  if (location.pathname.startsWith('/Circuit/')) {
                    localStorage.setItem('circuit-settings-v100', JSON.stringify({textSpeed:'instant',autoDelay:2,musicVolume:0,ambienceVolume:0,voiceVolume:0,sfxVolume:0,voiceEnabled:false,muted:true,highContrast:false,reducedMotion:true}));
                  } else if (/^\/(NetLove|Healing)\//.test(location.pathname)) {
                    const prefix = location.pathname.startsWith('/NetLove/') ? 'netlove' : 'moist-healing';
                    localStorage.setItem(prefix+':v1:settings', JSON.stringify({textSpeed:0,music:false,voiceEnabled:false,reducedMotion:true}));
                  }
                })();''')
                pages, previous_caches, previous_progress = {}, {}, {}
                for game in GAMES:
                    phase = game + ':install'
                    page = context.new_page()
                    pages[game] = page
                    page.on('pageerror', lambda error, game=game: report['page_errors'].append(dict(game=game, error=str(error))))
                    response = page.goto(f'{ORIGIN}/{game}/', wait_until='domcontentloaded', timeout=120000)
                    assert response and response.ok, game + ': public page unavailable'
                    owner = boot(page, game, versions[game])
                    if game != 'Rain':
                        page.get_by_role('button', name='安装与离线', exact=True).click()
                        if game == 'Circuit':
                            expect(page.get_by_role('status')).to_contain_text('离线资源已就绪', timeout=120000)
                            page.get_by_role('button', name='关闭安装与离线', exact=True).click()
                        else:
                            expect(page.get_by_role('heading', name='可以离线阅读', exact=True)).to_be_visible(timeout=120000)
                            page.get_by_role('button', name='关闭', exact=True).click()
                    inventory = cache_inventory(page)
                    assert all(inventory.get(key) == value for key, value in previous_caches.items()), game + ': removed or modified another game cache'
                    assert states(progress(page)) == states(previous_progress), game + ': changed another game save'
                    added = {key: value for key, value in inventory.items() if key not in previous_caches}
                    assert added and all(added.values()), game + ': no completed own cache'
                    assert all(url.startswith(f'{ORIGIN}/{game}/') for urls in added.values() for url in urls), game + ': cached outside own scope'
                    read_and_save(page, game)
                    previous_progress = progress(page)
                    previous_caches = inventory
                    report['installs'].append(dict(game=game, version=versions[game], worker=owner,
                        own_cache_entries={key:len(value) for key,value in added.items()}, prior_caches_preserved=True, prior_save_states_preserved=True))
                    page.screenshot(path=str(output.parent / f'{game}-online.png'))
                phase = 'joint-offline'
                context.set_offline(True)
                for game, page in pages.items():
                    phase = game + ':offline-reopen'
                    page.reload(wait_until='domcontentloaded', timeout=120000)
                    owner = boot(page, game, versions[game])
                    assert states(progress(page)) == states(previous_progress), game + ': offline reload changed saved route'
                    if game != 'Rain':
                        page.get_by_role('button', name='继续抢修' if game == 'Circuit' else '继续上次的故事', exact=True).click()
                        expect(page.locator('.hud' if game == 'Circuit' else '.game-screen')).to_be_visible()
                        assert states(progress(page)) == states(previous_progress), game + ': Continue changed saved route'
                        page.wait_for_function('() => Array.from(document.images).every(image => image.complete && image.naturalWidth > 0)')
                    assert cache_inventory(page) == previous_caches, game + ': offline startup changed cache inventory'
                    assert page.evaluate('() => navigator.onLine') is False
                    page.screenshot(path=str(output.parent / f'{game}-offline.png'))
                    report['offline'].append(dict(game=game, version=versions[game], worker=owner, cache_inventory_preserved=True, react_save_states_preserved=True))
                assert report['page_errors'] == [], report['page_errors']
                inventory_bytes = json.dumps(previous_caches, sort_keys=True).encode()
                report.update(status='passed', cache_inventory_sha256=hashlib.sha256(inventory_bytes).hexdigest(),
                              registrations=sorted(page.evaluate('() => navigator.serviceWorker.getRegistrations().then(rs => rs.map(r => r.scope))')),
                              total_cached_files=sum(map(len, previous_caches.values())))
                assert report['registrations'] == sorted(f'{ORIGIN}/{game}/' for game in GAMES)
                context.close()
            finally:
                browser.close()
    except Exception as error:
        report.update(status='failed', failed_phase=phase, error=str(error))
    finally:
        output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    return report


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    for game in GAMES:
        parser.add_argument('--' + game.lower() + '-version', required=True)
    parser.add_argument('--output', type=Path, default=Path('artifacts/four-games-live/result.json'))
    args = parser.parse_args()
    result = run({game:getattr(args, game.lower() + '_version') for game in GAMES}, args.output)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    raise SystemExit(0 if result['status'] == 'passed' else 1)
