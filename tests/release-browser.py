#!/usr/bin/env python3
"""Complete Circuit's authored campaign in Chromium and check responsive/offline play."""
import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from urllib.parse import urlsplit, urljoin

from playwright.sync_api import expect, sync_playwright
from async_browser import wait_async

AUTO = 'circuit-auto-v100'
SETTINGS = 'circuit-settings-v100'
PREFERENCES = dict(textSpeed='instant', autoDelay=2, musicVolume=0, ambienceVolume=0,
                   muted=True, highContrast=False, reducedMotion=True)


def fixtures():
    """Compile the authored engine in a temporary directory and find legal BFS routes."""
    with tempfile.TemporaryDirectory(prefix='circuit-browser-engine-') as temporary:
        command = [shutil.which('node') or 'node', 'node_modules/typescript/bin/tsc',
                   '--module', 'commonjs', '--moduleResolution', 'node', '--resolveJsonModule', '--esModuleInterop', '--target', 'ES2020',
                   '--strict', '--skipLibCheck', '--rootDir', 'src', '--outDir', temporary,
                   'src/story/engine.ts','src/game/mediaCatalog.ts']
        compiled = subprocess.run(command, capture_output=True, text=True)
        if compiled.returncode:
            raise RuntimeError(compiled.stdout + compiled.stderr)
        script = r'''
const e=require(process.argv[1]);
const media=require(require("node:path").join(require("node:path").dirname(process.argv[1]), "../game/mediaCatalog.js"));
const results=e.CHAPTER_ORDER.map(id=>{
 const chapter=e.getChapter(id), initial=e.createInitialState(id);
 const queue=[{state:initial,path:[]}], seen=new Set(); let complete=null, investigation=null;
 for(let h=0;h<queue.length;h++) {
  const current=queue[h], key=JSON.stringify([current.state.nodeId,[...current.state.evidence].sort()]);
  if(seen.has(key)) continue; seen.add(key);
  const node=chapter.nodes[current.state.nodeId];
  if(!investigation && node.kind==='investigation') investigation=current;
  if(node.outcome==='complete' && !complete) complete=current;
  for(const action of e.getAvailableActions(current.state)) {
   const state=e.transition(current.state,action.id);
   if(state) queue.push({state,path:[...current.path,{actionId:action.id,nodeId:state.nodeId,evidence:state.evidence}]});
  }
 }
 if(!complete || !investigation) throw new Error('Missing playable route: '+id);
 return {id,title:chapter.title,initial,path:complete.path,investigation,
  requiredEvidence:chapter.requiredEvidence,nodes:chapter.nodes,evidence:chapter.evidence,voices:Object.fromEntries(Object.keys(chapter.nodes).map(node=>[node,media.voicesFor(id,node)]))};
});
process.stdout.write(JSON.stringify(results));
'''
        result = subprocess.run([shutil.which('node') or 'node', '-e', script,
                                 str(Path(temporary) / 'story/engine.js')], capture_output=True, text=True, check=True)
        return json.loads(result.stdout)


def recording_sources(chapters):
    """Resolve stable evidence IDs to the current verified playback master."""
    sources = {}
    for chapter in chapters:
        for clips in chapter['voices'].values():
            for clip in clips:
                assert clip['id'] not in sources or sources[clip['id']] == clip['src'], 'Inconsistent replay master'
                sources[clip['id']] = clip['src']
    return sources


def run(url, pwa):
    cg_dimensions = {Path(a['output']).name: (a['width'], a['height'])
                     for a in json.loads(Path('docs/production/full-media/recovered-cg.json').read_text())['assets']}
    began = time.monotonic()
    phase = 'compile-legal-routes'
    completed, errors, console_errors, http_errors = [], [], [], []
    pages, contexts = [], []
    current_page = None
    summary = dict(base_url=url, pwa_requested=pwa)
    qa_fonts = Path(os.environ['CIRCUIT_QA_FONT_DIR']) if os.environ.get('CIRCUIT_QA_FONT_DIR') else None
    if qa_fonts:
        qa_css = (qa_fonts / 'index.css').read_text().replace('./files/', '/_qa-fonts/')
        qa_css += "\n*{font-family:'Noto Serif SC Variable',serif !important;}"
        summary['font_qa'] = 'Local CJK font injected for layout testing only'

    def raw(page):
        return page.evaluate('localStorage.getItem(' + json.dumps(AUTO) + ')')

    def snapshot(page):
        return json.loads(raw(page))

    def click(page, name):
        page.get_by_role('button', name=name, exact=True).click()

    def hit_test(button):
        expect(button).to_be_visible()
        measured = button.evaluate('''element => {
          const r=element.getBoundingClientRect();
          return {label:element.getAttribute('aria-label')||element.textContent,
            rect:{x:r.x,y:r.y,width:r.width,height:r.height},
            contained:r.x>=-1&&r.y>=-1&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1,
            hits:[[r.x+r.width/2,r.y+r.height/2],[r.x+4,r.y+4],[r.right-4,r.bottom-4]].map(([x,y])=>{
              const hit=document.elementFromPoint(x,y);return hit===element||element.contains(hit);
            })};
        }''')
        assert measured['contained'] and all(measured['hits']), measured

    def notebook(page, label, title):
        before = raw(page)
        opener = page.get_by_role('button', name=label, exact=True)
        opener.focus()
        opener.click()
        dialog = page.get_by_role('dialog', name=title, exact=True)
        expect(dialog).to_be_visible()
        assert page.locator('.game-surface').evaluate('el=>el.inert')
        for key in ['Tab', 'Shift+Tab']:
            page.keyboard.press(key)
            assert dialog.evaluate('el=>el.contains(document.activeElement)'), 'Focus left notebook'
        page.keyboard.press('Escape')
        expect(dialog).to_have_count(0)
        expect(opener).to_be_focused()
        assert raw(page) == before, 'Reading a notebook wrote progress'

    def character_directory(page, label):
        before = raw(page)
        opener = page.get_by_role('button', name=label, exact=True)
        opener.click()
        dialog = page.get_by_role('dialog', name='人物与抢修队', exact=True)
        expect(dialog).to_be_visible()
        expect(dialog.locator('[data-character-id]')).to_have_count(15)
        for person in dialog.locator('[data-character-id]').all():
            identifier = person.get_attribute('data-character-id')
            person.click()
            profile = dialog.locator('[data-character-profile]')
            expect(profile).to_have_attribute('data-character-profile', identifier)
            legacy = identifier in {'cheng','ji','lin','zhou','mei','xu','chen','shen','luo'}
            expect(dialog.get_by_role('button', name='Q版形象', exact=True)).to_have_count(1 if legacy else 0)
            views = [('立绘', 'portraits')] + ([('Q版形象', 'chibi')] if legacy else [])
            for view, directory in views:
                control = dialog.get_by_role('button', name=view, exact=True)
                control.scroll_into_view_if_needed()
                hit_test(control)
                control.click()
                image = profile.locator('.profile-art > img')
                expect(image).to_have_attribute('src', urljoin(url.rstrip('/') + '/', f'art/{directory}/{identifier}.webp').replace(urlsplit(url).scheme + '://' + urlsplit(url).netloc, ''))
                image.evaluate('async img => { await img.decode(); }')
        page.keyboard.press('Escape')
        expect(dialog).to_have_count(0)
        expect(opener).to_be_focused()
        assert raw(page) == before, 'Character gallery changed automatic progress'

    try:
        authored = fixtures()
        order = [chapter['id'] for chapter in authored]
        summary['routes'] = {chapter['id']: len(chapter['path']) for chapter in authored}
        with sync_playwright() as playwright:
            executable = os.environ.get('CIRCUIT_CHROMIUM') or shutil.which('chromium') or shutil.which('chromium-browser')
            if not executable:
                raise RuntimeError('Set CIRCUIT_CHROMIUM or install system Chromium')
            browser = playwright.chromium.launch(executable_path=executable, headless=True, args=['--no-sandbox'])

            def new_page(seed=None, viewport=(1280, 720), deny_read=False, deny_write=False):
                nonlocal current_page
                context = browser.new_context(viewport=dict(width=viewport[0], height=viewport[1]))
                contexts.append(context)
                if qa_fonts:
                    context.route('**/_qa-fonts/*', lambda route: route.fulfill(
                        path=str(qa_fonts / 'files' / Path(urlsplit(route.request.url).path).name), content_type='font/woff2'))
                    context.add_init_script('document.addEventListener("DOMContentLoaded",()=>{const style=document.createElement("style");style.textContent=' + json.dumps(qa_css) + ';document.head.appendChild(style);},{once:true});')
                initial = {SETTINGS: json.dumps(PREFERENCES), **(seed or {})}
                script = 'if (!sessionStorage.getItem("release-smoke-seeded")) {'
                script += 'for(const [key,value] of Object.entries(' + json.dumps(initial) + '))localStorage.setItem(key,value);'
                script += 'sessionStorage.setItem("release-smoke-seeded","1");}'
                if deny_read:
                    script += 'Storage.prototype.getItem=function(){throw new DOMException("Denied","SecurityError")};'
                if deny_write:
                    script += 'Storage.prototype.setItem=function(){throw new DOMException("Full","QuotaExceededError")};'
                context.add_init_script(script)
                page = context.new_page()
                pages.append(page)
                current_page = page
                page.set_default_timeout(8000)
                page.on('pageerror', lambda error: errors.append(str(error)))
                page.on('console', lambda msg: console_errors.append(dict(message=msg.text, url=msg.location.get('url', '')))
                        if msg.type == 'error' else None)
                page.on('response', lambda response: http_errors.append(dict(url=response.url, status=response.status))
                        if response.status >= 400 else None)
                # The release workflow can start this test immediately after launching preview.
                for attempt in range(40):
                    try:
                        response = context.request.get(url, timeout=1000)
                        if response.ok:
                            break
                    except Exception:
                        pass
                    if attempt == 39:
                        raise RuntimeError('Server did not become available: ' + url)
                    time.sleep(.25)
                page.goto(url, wait_until='domcontentloaded')
                expect(page.get_by_role('heading', name='回路', exact=True)).to_be_visible()
                if qa_fonts:
                    page.evaluate('document.fonts.ready')
                return page

            try:
                phase = 'initial-chapter-locks'
                page = new_page()
                character_directory(page, '人物与抢修队')
                click(page, '章节选择')
                for index, chapter in enumerate(authored):
                    button = page.locator(f'[data-chapter-id="{chapter["id"]}"]')
                    expect(button).to_be_enabled() if index == 0 else expect(button).to_be_disabled()
                page.keyboard.press('Escape')
                click(page, '开始抢修')
                completed.append(phase)

                for index, chapter in enumerate(authored):
                    phase = 'complete-chapter:' + chapter['id']
                    assert snapshot(page)['chapterId'] == chapter['id']
                    for step in chapter['path']:
                        button = page.locator('button[data-action-id=' + json.dumps(step['actionId']) + ']')
                        button.click()
                        saved = snapshot(page)
                        assert saved['chapterId'] == chapter['id'] and saved['nodeId'] == step['nodeId'], saved
                        assert saved['evidence'] == step['evidence'], saved
                        assert saved['history'][-1] == step['nodeId'], saved
                        authored_node = chapter['nodes'][step['nodeId']]
                        if authored_node.get('scene', {}).get('eventCg'):
                            expect(page.locator('.character-portrait')).to_have_count(0)
                        elif authored_node.get('portrait'):
                            figure = page.locator('.character-portrait')
                            expect(figure).to_have_attribute('data-presence', authored_node.get('presence', 'scene'))
                            figure.locator('img').evaluate('async img => { await img.decode(); }')
                            if authored_node.get('presence') in ['radio', 'archive']:
                                caption = figure.locator('figcaption').bounding_box()
                                dialogue = page.locator('.dialogue').bounding_box()
                                assert caption and dialogue and caption['y'] + caption['height'] <= dialogue['y'] + 1, (caption, dialogue)
                        # Resume once in each chapter while a clue has been observed but not recorded.
                        if chapter['nodes'][step['nodeId']]['kind'] == 'evidence' and not saved['evidence']:
                            before = raw(page)
                            page.reload(wait_until='domcontentloaded')
                            click(page, '继续抢修')
                            assert raw(page) == before, 'Mid-investigation resume overwrote automatic progress'
                            assert page.locator('.dialogue-text').get_attribute('aria-label') == chapter['nodes'][step['nodeId']]['text']
                    saved = snapshot(page)
                    assert saved['completed'] == order[:index + 1], saved
                    assert all(clue in saved['archive'][chapter['id']] for clue in chapter['requiredEvidence']), saved
                    assert page.get_by_role('progressbar', name='章节进度').get_attribute('aria-valuenow') == '100'
                    notebook(page, '历史', '抢修日志')
                    click(page, '线路')
                    dialog = page.get_by_role('dialog', name='城市线路档案')
                    expect(dialog.locator('.map-complete')).to_have_count(index + 1)
                    if index == len(authored) - 1:
                        points = dialog.locator('.city-map-route:not(.map-followup)').get_attribute('points').split()
                        assert len(points) == 7 and points[0] == points[-1], 'Completed city route does not close its circuit'
                    page.keyboard.press('Escape')
                    click(page, '标题')
                    click(page, '章节选择')
                    for position, item in enumerate(authored):
                        button = page.locator(f'[data-chapter-id="{item["id"]}"]')
                        expect(button).to_be_enabled() if position <= index + 1 else expect(button).to_be_disabled()
                    page.keyboard.press('Escape')
                    click(page, '继续抢修')
                    assert raw(page) == json.dumps(saved, ensure_ascii=False, separators=(',', ':')) or snapshot(page) == saved
                    completed.append(phase)
                    if index + 1 < len(authored):
                        page.locator('.next-chapter').click()

                phase = 'responsive-hotspots-and-keyboard'
                investigation = authored[0]['investigation']['state']
                payload = dict(version=2, **investigation, history=[investigation['nodeId']], completed=[], archive={},
                               savedAt='2026-10-11T00:00:00.000Z')
                for viewport in [(1280, 720), (960, 540), (760, 430), (390, 844)]:
                    phase = f'responsive-hotspots:{viewport[0]}x{viewport[1]}'
                    small = new_page({AUTO: json.dumps(payload)}, viewport)
                    click(small, '继续抢修')
                    frame = small.locator('.game-surface').bounding_box()
                    assert frame and frame['x'] >= -1 and frame['y'] >= -1 and frame['height'] > 0, frame
                    for control in small.locator('.hud button, .scene-hotspot').all():
                        hit_test(control)
                    assert small.locator('.scene-hotspot').count() >= 3
                    notebook(small, '历史', '抢修日志')
                    character_directory(small, '人物')
                    first = small.locator('.scene-hotspot').first
                    first.focus()
                    small.keyboard.press('Enter')
                    assert snapshot(small)['nodeId'] != investigation['nodeId'], 'Enter did not activate hotspot'
                    completed.append(phase)
                    small.context.close()
                    contexts.remove(small.context)

                    for node_id, evidence, presence in [
                        ('currentContact', ['live-after-cut'], 'radio'),
                        ('truth', authored[0]['requiredEvidence'], 'archive')
                    ]:
                        portrait_save = dict(version=2, chapterId=order[0], nodeId=node_id, evidence=evidence,
                                             history=[node_id], completed=[], archive={}, savedAt=payload['savedAt'])
                        portrait_page = new_page({AUTO: json.dumps(portrait_save)}, viewport)
                        click(portrait_page, '继续抢修')
                        figure = portrait_page.locator('.character-portrait')
                        expect(figure).to_have_attribute('data-presence', presence)
                        figure.locator('img').evaluate('async img => { await img.decode(); }')
                        caption = figure.locator('figcaption').bounding_box()
                        dialogue = portrait_page.locator('.dialogue').bounding_box()
                        assert caption and dialogue and 0 <= caption['y'] < dialogue['y'], (viewport, caption, dialogue)
                        assert caption['y'] + caption['height'] <= dialogue['y'] + 1, (viewport, caption, dialogue)
                        portrait_page.context.close()
                        contexts.remove(portrait_page.context)

                phase = 'denied-storage-remains-playable'
                for read, write in [(True, False), (False, True)]:
                    denied = new_page(deny_read=read, deny_write=write)
                    if read:
                        expect(denied.locator('.title-notice')).to_contain_text('浏览器存储暂不可用')
                    click(denied, '开始抢修')
                    if write:
                        expect(denied.locator('.save-notice')).to_contain_text('浏览器存储暂不可用')
                    denied.locator('button[data-action-id]').first.click()
                    expect(denied.locator('.dialogue-text')).to_be_visible()
                    denied.context.close()
                    contexts.remove(denied.context)
                completed.append(phase)

                if pwa:
                    phase = 'pwa-manifest-service-worker'
                    current_page = page
                    context = page.context
                    manifest = context.request.get(url.rstrip('/') + '/manifest.webmanifest')
                    assert manifest.ok
                    assert manifest.json()['display'] == 'standalone'
                    assert manifest.json()['lang'] == 'zh-CN'
                    assert manifest.json()['orientation'] == 'any', 'Release PWA must support both portrait and landscape'
                    icons = manifest.json()['icons']
                    assert {'192x192', '512x512'} <= {icon['sizes'] for icon in icons}, 'Installable PWA icons missing'
                    for icon in icons:
                        assert context.request.get(urljoin(url.rstrip('/') + '/', icon['src'])).ok, icon
                    wait_async(page, 'async()=>Boolean((await navigator.serviceWorker.ready).active)', timeout=15000)
                    page.reload(wait_until='domcontentloaded')
                    page.wait_for_function('Boolean(navigator.serviceWorker.controller)', timeout=15000)
                    summary['service_worker'] = page.evaluate('navigator.serviceWorker.controller.scriptURL')
                    completed.append(phase)
                    phase = 'offline-campaign-resume-and-replay'
                    saved = snapshot(page)
                    before = raw(page)
                    context.set_offline(True)
                    page.reload(wait_until='load')
                    click(page, '继续抢修')
                    assert raw(page) == before
                    assert saved['completed'] == order
                    phase = 'offline-all-generated-art'
                    artwork = sorted({'/' + str(path.relative_to('public')).replace(os.sep, '/')
                                      for path in Path('public/art').rglob('*.webp')} | {'/icon.png'})
                    images = page.evaluate('''async paths => Promise.all(paths.map(async path => {
                      const image = new Image(); image.src = path;
                      await image.decode();
                      const canvas = document.createElement('canvas');
                      canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
                      const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0);
                      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
                      let transparent = 0;
                      for (let i = 3; i < pixels.length; i += 4) if (pixels[i] === 0) transparent++;
                      return {path, width: image.naturalWidth, height: image.naturalHeight,
                        transparent: transparent / (canvas.width * canvas.height)};
                    }))''', [urljoin(url.rstrip('/') + '/', asset.lstrip('/')) for asset in artwork])
                    assert len(images) == len(artwork), images
                    for image in images:
                        if '/portraits/' in image['path']:
                            assert (image['width'], image['height']) == (640, 960), image
                            assert .15 < image['transparent'] < .8, image
                        elif '/chibi/' in image['path']:
                            assert (image['width'], image['height']) == (640, 640), image
                            assert .15 < image['transparent'] < .9, image
                        elif '/art/' in image['path']:
                            assert (image['width'], image['height']) == cg_dimensions.get(Path(urlsplit(image['path']).path).name, (1600, 900)), image
                        else:
                            assert (image['width'], image['height']) == (512, 512), image
                    summary['offline_art'] = images
                    character_directory(page, '人物')
                    completed.append(phase)
                    phase = 'offline-all-voice-and-scene-audio'
                    audio_paths = sorted('/' + str(path.relative_to('public')).replace(os.sep, '/') for path in Path('public/audio').rglob('*.mp3'))
                    decoded = page.evaluate('''async paths => {
                      const context = new OfflineAudioContext(1, 24000, 24000);
                      const results = [];
                      for (const path of paths) {
                        const response = await fetch(path);
                        if (!response.ok) throw new Error('Offline audio missing: ' + path);
                        const buffer = await context.decodeAudioData(await response.arrayBuffer());
                        if (!buffer.length || !Number.isFinite(buffer.duration)) throw new Error('Invalid audio: ' + path);
                        results.push({path, duration: buffer.duration, channels: buffer.numberOfChannels});
                      }
                      return results;
                    }''', [urljoin(url.rstrip('/') + '/', path.lstrip('/')) for path in audio_paths])
                    assert len(decoded) == 51, decoded
                    assert all(row['duration'] > .05 and row['channels'] == 1 for row in decoded), decoded
                    summary['offline_audio'] = decoded
                    completed.append(phase)
                    phase = 'offline-campaign-resume-and-replay'
                    click(page, '线路')
                    expect(page.get_by_role('dialog', name='城市线路档案').locator('.map-complete')).to_have_count(len(order))
                    page.keyboard.press('Escape')
                    click(page, '标题')
                    click(page, '章节选择')
                    page.locator('[data-chapter-id="seventh-night"]').click()
                    page.locator('button[data-action-id]').first.click()
                    assert snapshot(page)['completed'] == order
                    context.set_offline(False)
                    completed.append(phase)

                phase = 'browser-runtime-errors'
                assert not errors, errors
                assert not [item for item in console_errors if urlsplit(item['url']).path != '/favicon.ico'], console_errors
                assert not [item for item in http_errors if urlsplit(item['url']).path != '/favicon.ico'], http_errors
                completed.append(phase)
                summary['status'] = 'passed'
            except Exception as error:
                summary.update(status='failed', failed_phase=phase, error=str(error))
                if current_page and not current_page.is_closed():
                    summary['diagnostics'] = dict(url=current_page.url,
                        buttons=current_page.locator('button:visible').all_text_contents(),
                        notices=current_page.locator('[role="status"]').all_text_contents())
            finally:
                for context in contexts:
                    context.close()
                browser.close()
    except Exception as error:
        summary.update(status='failed', failed_phase=phase, error=str(error))
    summary.update(completed_checks=completed, completed_count=len(completed), page_errors=errors,
                   console_errors=console_errors, http_errors=http_errors, duration_seconds=round(time.monotonic() - began, 2))
    return summary


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('base_url', nargs='?', default='http://127.0.0.1:5173')
    parser.add_argument('--pwa', action='store_true')
    options = parser.parse_args()
    result = run(options.base_url, options.pwa)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    sys.exit(0 if result['status'] == 'passed' else 1)
