#!/usr/bin/env python3
"""Check actual scene music, paused panel gestures and complete offline replay."""
import argparse,json,os,runpy,time
from pathlib import Path
from playwright.sync_api import sync_playwright
from async_browser import wait_async

def run(url):
    authored=runpy.run_path('tests/release-browser.py')['fixtures']()
    tracks=json.loads(Path('docs/audio/original-music-20261024.json').read_text())['tracks']
    report={'status':'passed','scenarios':[],'pageErrors':[]}
    with sync_playwright() as pw:
        browser=pw.chromium.launch(executable_path=os.environ['CIRCUIT_CHROMIUM'],headless=True,args=['--no-sandbox'])
        for width,height in [(1280,720),(412,915)]:
            for index,track in [(0,tracks[0]),(2,tracks[1])]:
                chapter=authored[index]
                save={'version':2,'chapterId':chapter['id'],'nodeId':chapter['initial']['nodeId'],'evidence':chapter['initial']['evidence'],'history':[chapter['initial']['nodeId']],'savedAt':'2026-10-24T14:00:00.000Z','completed':[x['id'] for x in authored[:index]],'archive':{x['id']:x['path'][-1]['evidence'] for x in authored[:index]}}
                settings={'textSpeed':'instant','autoDelay':2,'musicVolume':.15,'ambienceVolume':0,'muted':False,'highContrast':False,'reducedMotion':True,'voiceVolume':0,'effectsVolume':0}
                context=browser.new_context(viewport={'width':width,'height':height})
                initial={'circuit-auto-v100':json.dumps(save),'circuit-settings-v100':json.dumps(settings)}
                context.add_init_script('''window.__originalMusicQA={contexts:[],loops:[]};const Native=window.AudioContext;
window.AudioContext=class extends Native{constructor(options){super(options);window.__originalMusicQA.contexts.push(this);}createBufferSource(){const source=super.createBufferSource(),start=source.start.bind(source);source.start=(...args)=>{if(source.loop&&source.buffer)window.__originalMusicQA.loops.push({loop:source.loop,duration:source.buffer.duration});start(...args);};return source;}};
if(!sessionStorage.getItem('original-music-seeded')){for(const [k,v] of Object.entries('''+json.dumps(initial)+'''))localStorage.setItem(k,v);sessionStorage.setItem('original-music-seeded','1');}''')
                page=context.new_page();page.on('pageerror',lambda e:report['pageErrors'].append(str(e)));page.goto(url)
                page.get_by_role('button',name='继续抢修',exact=True).click()
                def played():return page.evaluate('duration=>window.__originalMusicQA.loops.some(x=>x.loop&&Math.abs(x.duration-duration)<.1)',track['loopDurationSeconds'])
                def wait_played():
                    deadline=time.monotonic()+20
                    while not played():
                        assert time.monotonic()<deadline,'No loop playback: '+track['id']
                        page.wait_for_timeout(100)
                wait_played();before=page.evaluate('localStorage.getItem("circuit-auto-v100")')
                page.get_by_role('button',name='帮助',exact=True).click()
                wait_async(page,'window.__originalMusicQA.contexts.every(x=>x.state==="suspended")')
                page.get_by_role('dialog').get_by_role('heading',level=2).click()
                wait_async(page,'window.__originalMusicQA.contexts.every(x=>x.state==="suspended")')
                page.keyboard.press('Escape');wait_async(page,'window.__originalMusicQA.contexts.some(x=>x.state==="running")')
                assert page.evaluate('localStorage.getItem("circuit-auto-v100")')==before
                wait_async(page,'''async file=>{if(!navigator.serviceWorker.controller)return false;for(const key of await caches.keys()){const cache=await caches.open(key);for(const request of await cache.keys()){if(new URL(request.url).pathname===new URL(file,document.baseURI).pathname&&await cache.match(request))return true;}}return false;}''',track['runtime'].removeprefix('public/'))
                context.set_offline(True);page.reload();page.get_by_role('button',name='继续抢修',exact=True).click();wait_played()
                assert page.evaluate('localStorage.getItem("circuit-auto-v100")')==before
                report['scenarios'].append({'track':track['id'],'chapter':chapter['id'],'viewport':[width,height],'played':True,'panelPauseResume':True,'inPanelGestureStaysPaused':True,'offlinePlayback':True,'saveBytesPreserved':True});context.close()
        browser.close()
    assert not report['pageErrors'],report['pageErrors']
    return report
if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('base_url');args=p.parse_args();print(json.dumps(run(args.base_url),ensure_ascii=False,indent=2))
