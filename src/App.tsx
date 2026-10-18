import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PwaPanel } from './components/PwaPanel';
import { Notebook } from './components/Notebook';
import { RecordSearch } from './components/RecordSearch';
import { CharacterGallery } from './components/CharacterGallery';
import { EvidenceNotebook } from './components/EvidenceNotebook';
import { getCharacter, getPortraitPath } from './game/characters';
import { CHAPTER_ORDER, getAvailableActions, getChapter, transition } from './story/engine';
import type { ChapterId } from './story/types';
import {
  completeChapter, createCampaignSession, loadCampaign, saveCampaign, startChapter,
  validateCampaignPayload, type CampaignLoadResult, type CampaignSession, type CampaignSlot
} from './game/campaign';
import { MAX_HISTORY_ENTRIES, type SaveStorage } from './game/saves';
import { loadPreferences, savePreferences, type Preferences } from './game/preferences';
import { CircuitAudio } from './game/audio';
import { RecordedAudio, voiceBlocksAuto, type VoiceState } from './game/recordedAudio';
import { SCENE_EFFECTS, voicesFor } from './game/mediaCatalog';
import { useReading } from './game/reading';
import { version } from '../package.json';

type Panel = 'evidence' | 'history' | 'chapters' | 'saves' | 'settings' | 'archive' | 'help' | 'characters' | 'pwa';
const PANEL_TITLES: Record<Panel, string> = {
  evidence: '现场记录', history: '抢修日志', chapters: '章节选择', saves: '存档与读取',
  pwa: '安装与离线', settings: '阅读与声音', archive: '城市线路档案', help: '操作与制作记录', characters: '人物与抢修队'
};
const BACKGROUNDS: Record<ChapterId, string> = {
  'thirteen-households': 'alley', 'seventh-night': 'stairwell', backfeed: 'demolition',
  everlight: 'stairwell', neutral: 'substation', closure: 'control-room', 'return-visit': 'resettlement-lobby', answering: 'communications-room', visitors: 'reception-station', tickets: 'receiving-room'
};
const SLOTS: CampaignSlot[] = ['auto', 1, 2, 3];
const asset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
function storage(): SaveStorage | null {
  try { return window.localStorage; } catch { return null; }
}
function readSlots() {
  return Object.fromEntries(SLOTS.map((slot) => [slot, loadCampaign(storage(), slot)])) as Record<CampaignSlot, CampaignLoadResult>;
}
function toSession(snapshot: CampaignSession): CampaignSession {
  return { state: snapshot.state, history: snapshot.history, completed: snapshot.completed, archive: snapshot.archive };
}
function summary(save: CampaignLoadResult) {
  if (save.status !== 'valid') return save.status === 'empty' ? '空槽位' : save.reason;
  const chapter = getChapter(save.snapshot.state.chapterId)!;
  return `${chapter.title} · ${chapter.nodes[save.snapshot.state.nodeId].location} · 已归档 ${save.snapshot.completed.length}/${CHAPTER_ORDER.length} 章`;
}

function App() {
  const [started, setStarted] = useState(false);
  const [session, setSession] = useState(createCampaignSession);
  const sessionRef = useRef(session);
  const [stored, setStored] = useState(readSlots);
  const [initialPreferences] = useState(() => loadPreferences(storage()));
  const [preferences, setPreferences] = useState(initialPreferences.preferences);
  const [panel, setPanel] = useState<Panel | null>(null);
  const panelOpener = useRef<HTMLElement | null>(null);
  const [notice, setNotice] = useState(() => {
    const damaged = SLOTS.map((slot) => stored[slot]).find((save) => save.status === 'invalid' || save.status === 'unavailable');
    return damaged && 'reason' in damaged ? damaged.reason : 'reason' in initialPreferences ? initialPreferences.reason : '';
  });
  const [automatic, setAutomatic] = useState(false);
  const [pageVisible, setPageVisible] = useState(() => !document.hidden);
  const audio = useRef<CircuitAudio | null>(null);
  const recorded = useRef<RecordedAudio | null>(null);
  const [voiceState, setVoiceState] = useState<VoiceState>({ status: 'idle', userPaused: false });
  const [sceneVisit, setSceneVisit] = useState(0);
  const importFile = useRef<HTMLInputElement>(null);
  const closePanel = useCallback(() => setPanel(null), []);
  const { state, history } = session;
  const chapter = getChapter(state.chapterId)!;
  const node = chapter.nodes[state.nodeId];
  const character = getCharacter(node.portrait);
  const portraitPath = getPortraitPath(node.portrait, node.expression);
  const actions = useMemo(() => getAvailableActions(state), [state]);
  const reading = useReading(node.text, `${state.chapterId}/${state.nodeId}/${history.length}`, preferences, !started || !!panel || !pageVisible);
  const menuSession = !started && stored.auto.status === 'valid' ? toSession(stored.auto.snapshot) : session;
  const mapPoints = menuSession.completed.filter((id) => getChapter(id)!.order < 6).map((id) => {
    const clue = getChapter(id)!.clue;
    return `${clue.x},${clue.y}`;
  });
  if (CHAPTER_ORDER.slice(0, 6).every((id) => menuSession.completed.includes(id))) mapPoints.push(mapPoints[0]);
  const currentVoices = voicesFor(state.chapterId, state.nodeId);
  const availableHotspots = (node.scene?.hotspots ?? []).flatMap((hotspot) => {
    const action = actions.find((candidate) => candidate.id === hotspot.actionId);
    return action ? [{ hotspot, action }] : [];
  });
  const hotspotActions = new Set(availableHotspots.map(({ action }) => action.id));
  const dialogueActions = actions.filter((action) => !hotspotActions.has(action.id));
  const requiredCount = chapter.requiredEvidence.filter((id) => state.evidence.includes(id)).length;
  const nextChapter = CHAPTER_ORDER[chapter.order + 1];
  const historyEntries = history.map(id => ({ ...chapter.nodes[id], id, context: `${chapter.nodes[id].location} ${chapter.nodes[id].time}` }));

  useEffect(() => {
    const onVisibility = () => setPageVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);
  useEffect(() => {
    void audio.current?.configure(preferences, started && pageVisible && !panel, voiceState.status === 'playing');
    recorded.current?.configure(preferences, started && !panel, started && pageVisible, panel === 'history' || panel === 'evidence');
  }, [preferences, started, pageVisible, panel, voiceState.status]);
  useEffect(() => {
    if (!started) { recorded.current?.stop(); return; }
    recorded.current?.enter(voicesFor(state.chapterId, state.nodeId), SCENE_EFFECTS[`${state.chapterId}/${state.nodeId}`]);
  }, [started, state.chapterId, state.nodeId, sceneVisit]);
  useEffect(() => () => { audio.current?.dispose(); recorded.current?.dispose(); }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 5500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const enableAudio = () => {
    if (!recorded.current) {
      recorded.current = new RecordedAudio(import.meta.env.BASE_URL);
      recorded.current.subscribe(setVoiceState);
    }
    recorded.current.configure(preferences, true, pageVisible, panel === 'history' || panel === 'evidence');
    if (!audio.current) {
      try { audio.current = new CircuitAudio(); } catch { return; }
    }
    void audio.current.configure(preferences, true);
  };
  const commit = useCallback((next: CampaignSession) => {
    const completed = completeChapter(next);
    sessionRef.current = completed;
    setSession(completed);
    setSceneVisit((visit) => visit + 1);
    setStarted(true);
    const result = saveCampaign(storage(), 'auto', completed);
    if (result.status === 'saved') {
      setStored((previous) => ({ ...previous, auto: { status: 'valid', snapshot: result.snapshot, source: 'v100' } }));
      setNotice('进度已自动保存');
    } else setNotice(result.reason);
    return result;
  }, []);
  const act = useCallback((actionId: string) => {
    const current = sessionRef.current;
    const action = getAvailableActions(current.state).find((candidate) => candidate.id === actionId);
    const next = transition(current.state, actionId);
    if (!action || !next) return;
    const nextHistory = action.resetEvidence ? [next.nodeId] : [...current.history, next.nodeId].slice(-MAX_HISTORY_ENTRIES);
    const destination = getChapter(next.chapterId)!.nodes[next.nodeId];
    if (action.collect) audio.current?.cue('record');
    if (destination.outcome) audio.current?.cue(destination.outcome);
    commit({ ...current, state: next, history: nextHistory });
  }, [commit]);

  useEffect(() => {
    // Auto reading never makes a deduction, collects evidence or restarts a chapter.
    if (!automatic || !started || panel || !pageVisible || !reading.finished || voiceBlocksAuto(voiceState) || node.kind !== 'dialogue'
      || actions.length !== 1 || actions[0].collect || actions[0].resetEvidence) return;
    const timer = window.setTimeout(() => act(actions[0].id), preferences.autoDelay * 1000);
    return () => window.clearTimeout(timer);
  }, [automatic, started, panel, pageVisible, reading.finished, voiceState, node, actions, preferences.autoDelay, act]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!started || panel || event.repeat || ![' ', 'Enter'].includes(event.key)) return;
      const target = event.target;
      if (target instanceof HTMLElement && target.closest('button,input,select,textarea,a,[contenteditable="true"]')) return;
      event.preventDefault();
      if (!reading.finished) reading.reveal();
      else if (node.kind === 'dialogue' && actions.length === 1) act(actions[0].id);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [started, panel, reading, node.kind, actions, act]);

  const openPanel = (kind: Panel, opener: HTMLElement) => {
    panelOpener.current = opener;
    if (kind === 'saves') setStored(readSlots());
    setPanel(kind);
  };
  const launch = () => { enableAudio(); closePanel(); setAutomatic(false); commit(createCampaignSession()); };
  const resume = (slot: CampaignSlot) => {
    const result = loadCampaign(storage(), slot);
    setStored((previous) => ({ ...previous, [slot]: result }));
    if (result.status !== 'valid') { setNotice(result.status === 'empty' ? '此槽位尚无存档。' : result.reason); return; }
    const restored = toSession(result.snapshot);
    sessionRef.current = restored;
    setSession(restored);
    setSceneVisit((visit) => visit + 1);
    setStarted(true);
    setAutomatic(false);
    closePanel();
    enableAudio();
    setNotice(result.source === 'v100' ? '进度已恢复' : '旧版进度已读取，下一次操作将保存为新版');
  };
  const selectChapter = (id: ChapterId) => {
    const next = startChapter(menuSession, id);
    if (!next) return;
    enableAudio(); closePanel(); setAutomatic(false); commit(next);
  };
  const saveSlot = (slot: CampaignSlot) => {
    const result = saveCampaign(storage(), slot, sessionRef.current);
    if (result.status === 'saved') {
      setStored((previous) => ({ ...previous, [slot]: { status: 'valid', snapshot: result.snapshot, source: 'v100' } }));
      setNotice(`已保存到槽 ${slot}`);
    } else setNotice(result.reason);
  };
  const changePreference = <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    const next = { ...preferences, [key]: value };
    setPreferences(next);
    const result = savePreferences(storage(), next);
    if (result.status !== 'saved') setNotice(result.reason);
  };
  const exportSave = () => {
    const current = sessionRef.current;
    const payload = { version: 2, ...current.state, history: current.history, completed: current.completed, archive: current.archive, savedAt: new Date().toISOString() };
    if (validateCampaignPayload(payload).status !== 'valid') { setNotice('当前进度尚不能导出。'); return; }
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url; link.download = `circuit-v${version}-save.json`; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice('进度已导出，请妥善保存 JSON 文件');
  };
  const importSave = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 512 * 1024) { setNotice('存档文件过大，请选择回路导出的 JSON 文件。'); return; }
    try {
      const result = validateCampaignPayload(JSON.parse(await file.text()));
      if (result.status !== 'valid') { setNotice(result.reason); return; }
      const saved = commit(toSession(result.snapshot));
      closePanel(); setAutomatic(false); enableAudio();
      setNotice(saved.status === 'saved' ? '存档已导入，三个手动槽位保留' : `存档已读取到本次游玩。${saved.reason}`);
    } catch { setNotice('无法读取这个存档文件，原进度已保留。'); }
  };
  const fullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
      else setNotice('当前窗口不支持全屏。');
    } catch { setNotice('当前窗口暂时无法进入全屏。'); }
  };
  const panelButton = (kind: Panel, label: string) => (
    <button className="hud-button" onClick={(event) => openPanel(kind, event.currentTarget)} aria-haspopup="dialog">{label}</button>
  );

  return (
    <main className={`game ${started ? `scene-${node.visual}` : 'release-title'}${preferences.highContrast ? ' high-contrast' : ''}${preferences.reducedMotion ? ' reduced-motion' : ''}`}>
      <div className="game-surface" aria-hidden={panel ? true : undefined} {...(panel ? { inert: '' } : {})}>
        <div className="noise" />
        {!started ? (
          <>
            <img className="title-background" src={asset("/art/alley.webp")} alt="雨夜旧城区，线路从住户窗前延伸至远处" />
            <div className="title-layout">
              <section className="title-brand">
                <p className="eyebrow">城市配电 · 民俗悬疑</p><h1>回路</h1><p className="english-title">CIRCUIT</p>
                <p className="tagline">有些线路，断开以后仍然有电。</p>
                <p className="title-synopsis">你是梧城电网城区抢修员程砚，与徒弟季宁一起值夜班。旧工单连着一场少了半页的救援。六章归档之后，回迁楼的门禁叫出你的名字——你昨晚没去，它却说已经到场。</p>
                <p className="title-crew">程砚 / 季宁 · 城区抢修班</p>
                <p className="version">v{version} · 第一部六章 / 第二部《回访》《应声》《来访》</p>
              </section>
              <nav className="title-menu" aria-label="主菜单">
                {stored.auto.status === 'valid' && <button className="primary" onClick={() => resume('auto')}>继续抢修</button>}
                <button className={stored.auto.status === 'valid' ? '' : 'primary'} onClick={launch}>开始抢修</button>
                {(['characters', 'chapters', 'saves', 'archive', 'settings', 'pwa', 'help'] as const).map((kind) => (
                  <button key={kind} onClick={(event) => openPanel(kind, event.currentTarget)} aria-haspopup="dialog">{PANEL_TITLES[kind]}</button>
                ))}
                {stored.auto.status === 'valid' && <p className="continue-summary">{summary(stored.auto)}</p>}
                <p className="menu-footnote">新开抢修会替换自动进度，手动槽位保留。</p>
              </nav>
            </div>
          </>
        ) : (
          <>
            <header className="hud">
              <div><strong>回路 / CIRCUIT</strong><span>{node.location}</span></div>
              <div className="hud-right"><span>{node.time}</span>
                {panelButton('history', '历史')}{panelButton('evidence', `证据 ${state.evidence.length}/${Object.keys(chapter.evidence).length}`)}
                {panelButton('archive', '线路')}{panelButton('saves', '存档')}{panelButton('settings', '设置')}
                <button className="hud-button" onClick={() => { setStarted(false); setAutomatic(false); }}>标题</button>
              </div>
            </header>
            <div className="progress" role="progressbar" aria-label="章节进度" aria-valuemin={0} aria-valuemax={100} aria-valuenow={node.progress}><i style={{ width: `${node.progress}%` }} /></div>
            <section className="stage" aria-label={node.location}>
              <div className="stage-background"><img src={asset(node.scene?.background ?? `/art/${node.visual === 'dispatch' ? 'dispatch' : BACKGROUNDS[state.chapterId]}.webp`)} alt="" /></div>
              <div className="rain" aria-hidden="true" />
              {character && portraitPath && <figure className={'character-portrait presence-' + (node.presence ?? 'scene')} data-presence={node.presence ?? 'scene'}>
                <img src={asset(portraitPath)} alt={character.name + (node.presence === 'radio' ? '通讯头像' : node.presence === 'archive' ? '旧档照片' : '立绘')} />
                <figcaption className="portrait-caption">{node.presence === 'radio' ? '电台联络 · ' : node.presence === 'archive' ? '2019 旧档 · ' : ''}{character.name}</figcaption>
              </figure>}
              {node.scene?.document && <div className="scene-document">{[node.scene.document.title, ...node.scene.document.lines].join('\n')}</div>}
              {node.scene?.inscription && <div className="scene-inscription">{node.scene.inscription}</div>}
              {node.kind === 'investigation' && <>
                <section className="objective-card" aria-label="当前调查目标"><small>FIELD TASK / 现场排查</small>
                  <h2>{node.objective?.title ?? '核对现场异常'}</h2><p>{node.objective?.detail ?? '逐一核对现场标记，将记录留在工单里。'}</p>
                  <span className="objective-progress">必要记录 {requiredCount}/{chapter.requiredEvidence.length} · 已发现 {state.evidence.length} 条</span>
                </section>
                <div className="investigation-hotspots" role="group" aria-label="场景调查">{availableHotspots.map(({ hotspot, action }) => (
                  <button key={hotspot.id} className="scene-hotspot" style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }} data-hotspot-slot={node.scene?.hotspots?.indexOf(hotspot)} data-action-id={action.id} data-evidence={action.hidesWhenCollected} aria-label={action.label} onClick={() => act(action.id)}>
                    <span className="hotspot-marker" aria-hidden="true">＋</span><span className="hotspot-label" aria-hidden="true">{hotspot.label}</span><span className="hotspot-hint" aria-hidden="true">{action.label}</span>
                  </button>
                ))}</div>
                {!!availableHotspots.length && <p className="investigation-help">选择调查标记，核对后记入现场记录。</p>}
              </>}
              {node.puzzle && <section className="puzzle-card" aria-label="推理问题"><small>线路判断</small><h2>{node.puzzle.prompt}</h2><details><summary>查看核对提示</summary><p>{node.puzzle.hint}</p></details></section>}
              {node.outcome && <section className="ending-summary" aria-label="章节结果">
                <small>{node.outcome === 'complete' ? 'WORK ORDER / 已归档' : 'WORK ORDER / 需复核'}</small>
                <h2>{node.outcome === 'complete' ? (state.chapterId === 'closure' ? '第一部完 · 归档闭合' : `${chapter.title} · 记录完成`) : '这条回路仍需重新核对'}</h2>
                <p>{node.outcome === 'complete' ? `${chapter.clue.code} · ${chapter.clue.title}` : '回看现场记录，或从本章重新排查。'}</p>
              </section>}
              <div className="scene-caption">{node.location}</div>
            </section>
            <section className="dialogue-wrap" aria-label="当前叙事"><div className="dialogue">
              <div className="dialogue-head"><span>{chapter.title} · {node.time}</span><div className="playback-controls">
                {!reading.finished && <button onClick={reading.reveal}>显示全文</button>}
                <button aria-pressed={automatic} onClick={() => setAutomatic(!automatic)}>{automatic ? '暂停自动' : '自动阅读'}</button>
                <button aria-pressed={preferences.muted} onClick={() => { enableAudio(); changePreference('muted', !preferences.muted); }}>{preferences.muted ? '开启声音' : '静音'}</button>
                {!!currentVoices.length && <button disabled={!preferences.voiceEnabled || preferences.muted} onClick={() => { enableAudio(); recorded.current?.replay(currentVoices); }}>重听语音</button>}
                {voiceBlocksAuto(voiceState) && <button onClick={() => voiceState.status === 'paused' ? recorded.current?.resume() : recorded.current?.pause()}>{voiceState.status === 'paused' ? '继续语音' : '暂停语音'}</button>}
                <button onClick={(event) => openPanel('characters', event.currentTarget)} aria-haspopup="dialog">人物</button>
              </div></div>
              {node.speaker && <div className="speaker">{node.speaker}</div>}
              {voiceState.clip && <p className="voice-caption" role="status">{getCharacter(voiceState.clip.character)?.name} · {voiceState.status === 'failed' ? '录音暂不可用，可继续阅读或重听' : voiceState.status === 'paused' ? '语音已暂停' : voiceState.status === 'loading' ? '准备语音' : '语音播放中'}{!currentVoices.some((clip) => clip.id === voiceState.clip?.id) && `：${voiceState.clip.text}`}</p>}
              <p className="dialogue-text" aria-label={node.text}><span aria-hidden="true">{reading.text}</span></p>
              <div className="actions"><div className={['choice', 'puzzle'].includes(node.kind) ? 'choice-grid deduction' : 'choice-grid'}>
                {dialogueActions.map((action) => <button key={action.id} data-action-id={action.id} className={action.tone === 'danger' ? 'danger' : ''} onClick={() => act(action.id)}>{action.label}</button>)}
                {node.outcome === 'complete' && nextChapter && <button className="next-chapter primary" onClick={() => selectChapter(nextChapter)}>继续下一章 · {getChapter(nextChapter)!.title}</button>}
                {node.outcome === 'complete' && !nextChapter && <button onClick={(event) => openPanel('archive', event.currentTarget)}>查看完整线路档案</button>}
              </div></div>
            </div></section>
          </>
        )}
      </div>
      <p className={`${started ? 'save-notice' : 'title-notice'}${panel ? ' panel-notice' : ''}`} role="status" aria-live="polite">{notice}</p>
      {panel && <Notebook kind={panel} title={PANEL_TITLES[panel]} returnFocusTo={panelOpener.current} onClose={closePanel}>
        {(panel === 'evidence' || panel === 'history') && voiceState.clip && voiceState.status !== 'idle' && <div className="recording-controls" aria-label="录音重听控制">
          <p role="status" aria-live="polite">{voiceState.status === 'failed' ? '录音暂时无法播放，可继续查阅。' : voiceState.status === 'loading' ? '正在加载录音…' : voiceState.status === 'paused' ? '录音已暂停' : '正在播放录音'} · {voiceState.clip.text}</p>
          {voiceBlocksAuto(voiceState) && <button onClick={() => voiceState.status === 'paused' ? recorded.current?.resume() : recorded.current?.pause()}>{voiceState.status === 'paused' ? '继续录音' : '暂停录音'}</button>}
          <button onClick={() => recorded.current?.stop()}>停止重听</button>
        </div>}
        {panel === 'characters' && <CharacterGallery />}
        {panel === 'evidence' && <EvidenceNotebook key={state.chapterId} evidence={chapter.evidence} collected={state.evidence}
          replayEnabled={preferences.voiceEnabled && !preferences.muted} onReplay={clip => { enableAudio(); recorded.current?.replay([clip], true); }} />}
        {panel === 'history' && <><p className="history-intro">按实际经过保留本章最近 {history.length} 条叙事。</p><RecordSearch entries={historyEntries} ordered renderEntry={entry => {
          const clips = voicesFor(state.chapterId, entry.id);
          return <li className="history-entry"><div className="history-meta"><span>{entry.time}</span><span>{entry.location}</span></div>{entry.speaker && <strong className="history-speaker">{entry.speaker}</strong>}<p>{entry.text}</p>{!!clips.length && <button disabled={!preferences.voiceEnabled || preferences.muted} onClick={() => { enableAudio(); recorded.current?.replay(clips, true); }}>重听这条语音</button>}</li>;
        }} /></>}
        {panel === 'chapters' && <><p>按归档顺序解锁。重玩已解锁章节会从本章开头出发，线路档案保留。</p><div className="chapter-grid">{CHAPTER_ORDER.map((id, index) => {
          const item = getChapter(id)!; const unlocked = index <= menuSession.completed.length;
          return <button className="chapter-card" key={id} disabled={!unlocked} data-chapter-id={id} onClick={() => selectChapter(id)}>
            <img src={asset(`/art/${BACKGROUNDS[id]}.webp`)} alt="" /><span>{String(index + 1).padStart(2, '0')} / {item.title}</span><small>{unlocked ? menuSession.completed.includes(id) ? '已归档 · 可重玩' : '已解锁' : '完成前章后解锁'}</small><p>{item.synopsis}</p>
          </button>;
        })}</div></>}
        {panel === 'saves' && <><p>自动进度随操作更新。读取存档保留当前自动槽，下一次操作才会保存。</p><div className="save-grid">{SLOTS.map((slot) => {
          const save = stored[slot];
          return <section className="save-card" key={slot} data-save-slot={slot}><h3>{slot === 'auto' ? '自动进度' : `槽 ${slot}`}</h3><p>{summary(save)}</p>
            {save.status === 'valid' && <time dateTime={save.snapshot.savedAt}>{new Date(save.snapshot.savedAt).toLocaleString('zh-CN')}</time>}
            <div>{slot !== 'auto' && <button disabled={!started} onClick={() => saveSlot(slot)}>保存到槽 {slot}</button>}<button disabled={save.status !== 'valid'} onClick={() => resume(slot)}>读取{slot === 'auto' ? '自动进度' : `槽 ${slot}`}</button></div>
          </section>;
        })}</div><div className="save-transfer"><button disabled={!started} onClick={exportSave}>导出当前进度</button><button onClick={() => importFile.current?.click()}>导入存档文件</button><input ref={importFile} type="file" accept=".json,application/json" hidden aria-label="选择存档文件" onChange={(event) => { void importSave(event.target.files?.[0]); event.target.value = ''; }} /></div><footer>导入会替换自动进度。建议先将重要进度保存到手动槽位。</footer></>}
        {panel === 'pwa' && <PwaPanel />}
        {panel === 'settings' && <div className="settings-grid">
          <label>文字显示<select value={preferences.textSpeed} onChange={(event) => changePreference('textSpeed', event.target.value as Preferences['textSpeed'])}><option value="instant">即时全文</option><option value="slow">缓慢</option><option value="normal">标准</option><option value="fast">快速</option></select></label>
          <label>自动阅读停留 {preferences.autoDelay} 秒<input type="range" min="2" max="8" step="1" value={preferences.autoDelay} onChange={(event) => changePreference('autoDelay', Number(event.target.value))} /></label>
          <label>音乐音量 {Math.round(preferences.musicVolume * 100)}%<input type="range" min="0" max="1" step=".05" value={preferences.musicVolume} onChange={(event) => changePreference('musicVolume', Number(event.target.value))} /></label>
          <label>环境与提示音 {Math.round(preferences.ambienceVolume * 100)}%<input type="range" min="0" max="1" step=".05" value={preferences.ambienceVolume} onChange={(event) => changePreference('ambienceVolume', Number(event.target.value))} /></label>
          <label>人物语音音量 {Math.round(preferences.voiceVolume * 100)}%<input type="range" min="0" max="1" step=".05" value={preferences.voiceVolume} onChange={(event) => changePreference('voiceVolume', Number(event.target.value))} /></label>
          <label>场景音效音量 {Math.round(preferences.sfxVolume * 100)}%<input type="range" min="0" max="1" step=".05" value={preferences.sfxVolume} onChange={(event) => changePreference('sfxVolume', Number(event.target.value))} /></label>
          <label className="setting-toggle"><input type="checkbox" checked={preferences.voiceEnabled} onChange={(event) => changePreference('voiceEnabled', event.target.checked)} />播放人物语音</label>
          <label className="setting-toggle"><input type="checkbox" checked={preferences.muted} onChange={(event) => changePreference('muted', event.target.checked)} />静音</label>
          <label className="setting-toggle"><input type="checkbox" checked={preferences.highContrast} onChange={(event) => changePreference('highContrast', event.target.checked)} />高对比文字</label>
          <label className="setting-toggle"><input type="checkbox" checked={preferences.reducedMotion} onChange={(event) => changePreference('reducedMotion', event.target.checked)} />减少动态效果 / 即时全文</label>
          <button onClick={(event) => openPanel('pwa', event.currentTarget)}>安装与离线</button><button onClick={() => void fullscreen()}>切换全屏</button><p>自动阅读等本条语音播完，再停留所设秒数。调查和推理等待你的判断。打开面板或切换标签页时暂停；返回标题会停止录音。历史里可重听已经经过的语音。</p>
        </div>}
        {panel === 'archive' && <><p>已归档 {menuSession.completed.length}/{CHAPTER_ORDER.length} 章。第一部连线表示人员与资料核对路径；V01、V02、V03记录新苑回访、旧回拨名单与接待站输入源，另列支线。</p><svg className="city-map" viewBox="0 0 100 100" role="img" aria-label={`城市线路图，已归档 ${menuSession.completed.length} 段`}>
          <path className="city-map-grid" d="M0 25H100M0 50H100M0 75H100M25 0V100M50 0V100M75 0V100" />
          <polyline points={mapPoints.join(' ')} fill="none" className="city-map-route" />
          {menuSession.completed.includes('return-visit') && <polyline points={`${getChapter('closure')!.clue.x},${getChapter('closure')!.clue.y} ${getChapter('return-visit')!.clue.x},${getChapter('return-visit')!.clue.y}`} fill="none" className="city-map-route map-followup" />}
          {menuSession.completed.includes('answering') && <polyline points={`${getChapter('return-visit')!.clue.x},${getChapter('return-visit')!.clue.y} ${getChapter('answering')!.clue.x},${getChapter('answering')!.clue.y}`} fill="none" className="city-map-route map-followup" />}
          {menuSession.completed.includes('visitors') && <polyline points={`${getChapter('answering')!.clue.x},${getChapter('answering')!.clue.y} ${getChapter('visitors')!.clue.x},${getChapter('visitors')!.clue.y}`} fill="none" className="city-map-route map-followup" />}
          {CHAPTER_ORDER.map((id) => { const clue = getChapter(id)!.clue; const done = menuSession.completed.includes(id); return <g key={id} className={done ? 'map-complete' : 'map-locked'}><circle cx={clue.x} cy={clue.y} r="2" /><text x={clue.x + 3} y={clue.y + 1}>{done ? clue.code : '· · ·'}</text></g>; })}
        </svg><div className="archive-list">{CHAPTER_ORDER.map((id) => {
          const item = getChapter(id)!; const done = menuSession.completed.includes(id);
          return <article key={id}><span>{done ? item.clue.code : '—'}</span><div><h3>{done ? item.clue.title : `${item.title} · 待归档`}</h3><p>{done ? item.clue.detail : '完成本章后补入线路记录。'}</p>{done && <details><summary>查阅本章现场记录</summary>{(menuSession.archive[id] ?? []).map((evidence) => <p key={evidence}><strong>{item.evidence[evidence].title}</strong><br />{item.evidence[evidence].detail}</p>)}</details>}</div></article>;
        })}</div></>}
        {panel === 'help' && <div className="help-content"><h3>抢修手册</h3><p>点击调查标记搜集现场记录，取得两条证据后可并排核对，再用证据判断回路。选择错误会进入复核结局，可重新排查本章。</p><p>空格或 Enter 显示全文；全文显示后，可推进单一对话。Tab 在按钮间移动，Enter 确认，Esc 关闭面板。</p><p>十章按顺序解锁。完成第一部可继续《回访》，随后解锁《应声》《来访》和《取号》，旧存档可沿用。三槽存档和 JSON 导出保留不同进度；人物档案可切换立绘与 Q 版。</p><h3>制作记录</h3><p>十二幅场景、九名人物的立绘与 Q 版形象，师徒有专注、警觉表情，罗禾有警觉表情。远程联络使用通讯卡，历史人物使用旧档照片。关键对白采用离线生成的人物录音；门禁、钥匙、继电器等场景音效随包提供。音乐、雨声和电流声实时合成。</p><p>语音系统参考《雨停之前》的离线制作与重听流程，角色与素材为《回路》单独制作。AI 生成美术与人物语音均在项目制作记录中标注。</p><p>本作人物、单位与事件均为虚构。线路判断服务于剧情，现场电气作业须由具备资质的人员依照规程实施。</p><p>回路 / CIRCUIT · v{version}<br />十三户、头七、回送、长明、零线、闭合；第二部：回访、应声、来访、取号。</p></div>}
      </Notebook>}
    </main>
  );
}

export default App;
