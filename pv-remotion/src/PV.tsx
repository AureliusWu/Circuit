import React from 'react';
import {AbsoluteFill, Easing, Img, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Audio} from '@remotion/media';

type ShotData = {src: string; caption: string; panX?: number; panY?: number};
type SegmentData = {title: string; english: string; kicker: string; accent: string; shots: ShotData[]};
type VoiceCue = {from: number; duration: number; src: string; speaker: string; text: string; accent: string};

const segments: SegmentData[] = [
  {
    title: '雨停之前', english: 'BEFORE THE RAIN STOPS', kicker: '有些话，要赶在雨停之前说完。', accent: '#8fb9d8',
    shots: [
      {src: 'rain/shared-umbrella.png', caption: '同一把伞下，距离从来不只是一场雨。', panX: -18},
      {src: 'rain/old-photo.png', caption: '旧照片把已经过去的人，重新带回眼前。', panX: 20},
      {src: 'rain/unsent-letter.png', caption: '一封没有寄出的信，藏着另一种结局。', panY: -14},
      {src: 'rain/quiet-farewell.png', caption: '告别没有声音，却比任何对白都清楚。', panX: -22},
      {src: 'rain/reunion.png', caption: '雨会停。人也许还能再见。', panY: 12},
    ],
  },
  {
    title: '湿性愈合', english: 'MOIST HEALING', kicker: '伤口被覆盖以后，真相还会留下痕迹。', accent: '#d6b6a8',
    shots: [
      {src: 'healing/bus-stop.webp', caption: '从一个普通的站台开始。', panX: 18},
      {src: 'healing/campus.webp', caption: '熟悉的校园里，细节开始变得不对劲。', panY: -12},
      {src: 'healing/confirmed-proof.webp', caption: '被确认的证据，也可能只是另一层表象。', panX: -18},
      {src: 'healing/window-open.webp', caption: '窗口打开以后，风把遗漏的东西吹了回来。', panX: 20},
      {src: 'healing/unsigned-letter.webp', caption: '没有署名的人，留下了最明确的指向。', panY: 14},
    ],
  },
  {
    title: '网恋', english: 'NET LOVE', kicker: '屏幕另一端的人，究竟离你有多远？', accent: '#d8a7c6',
    shots: [
      {src: 'netlove/balcony.webp', caption: '消息亮起的时候，城市已经安静下来。', panX: -18},
      {src: 'netlove/four-bowls.webp', caption: '四碗热面，把网络里的名字变成真实的人。', panY: -14},
      {src: 'netlove/meeting.webp', caption: '第一次见面，所有预设都需要重新回答。', panX: 20},
      {src: 'netlove/envelope.webp', caption: '信封里装着的，是屏幕无法传达的重量。', panX: -20},
      {src: 'netlove/riverbank.webp', caption: '河岸很长，关系也没有标准答案。', panY: 12},
    ],
  },
  {
    title: '回路', english: 'CIRCUIT', kicker: '每一张工单，都在把你带回同一个夜晚。', accent: '#e0bf73',
    shots: [
      {src: 'circuit/control-room.webp', caption: '值班室里，一切看起来仍然正常。', panX: 18},
      {src: 'circuit/do-not-close.webp', caption: '直到那张写着“请勿闭合”的工单出现。', panY: -12},
      {src: 'circuit/five-tickets.webp', caption: '五张票，五个时间点，一条无法解释的线路。', panX: -20},
      {src: 'circuit/missing-stairs.webp', caption: '楼梯少了一阶。记录却说它从未存在。', panX: 20},
      {src: 'circuit/wet-boots.webp', caption: '门后的湿鞋，证明有人比你更早回来。', panY: 14},
    ],
  },
];

const voiceCues: VoiceCue[] = [
  {from: 16, duration: 3.6, src: 'voice/rain-reunion.ogg', speaker: '她', text: '我知道。你还给照片起了个很长的名字。', accent: '#8fb9d8'},
  {from: 27, duration: 2.4, src: 'voice/rain-letter.ogg', speaker: '她', text: '你不用现在打开。', accent: '#8fb9d8'},
  {from: 38, duration: 5.2, src: 'voice/healing-arrival.ogg', speaker: '贺川', text: '你先把这个愿望留给数学老师。他昨天嗓子哑了，照样给我们讲完了两张卷子。', accent: '#d6b6a8'},
  {from: 52, duration: 3.5, src: 'voice/healing-ask.ogg', speaker: '许棠', text: '可以。照片换成长椅，署名照你的圈改。', accent: '#d6b6a8'},
  {from: 65, duration: 3.2, src: 'voice/netlove-call.ogg', speaker: '谢听禾', text: '能一起听吗？发文件过去，听的时候总不在同一秒。', accent: '#d8a7c6'},
  {from: 78, duration: 3.0, src: 'voice/netlove-tinghe.ogg', speaker: '谢听禾', text: '我也想。可是开学以后，我可能真的很忙。', accent: '#d8a7c6'},
  {from: 89, duration: 3.0, src: 'voice/circuit-ji.mp3', speaker: '季宁', text: '也不能照这圈顺序说哪件事先发生。', accent: '#e0bf73'},
  {from: 99, duration: 6.2, src: 'voice/circuit-ticket.mp3', speaker: '周师傅', text: '没安排替代，也没让他停下来。后来有人催关单，我就写完成。没核完。', accent: '#e0bf73'},
];

const fontFamily = '"Noto Sans CJK SC", "Microsoft YaHei", sans-serif';
const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

const FilmGrain: React.FC = () => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{pointerEvents: 'none', opacity: 0.045, backgroundImage: `radial-gradient(circle at ${20 + (frame % 9) * 8}% ${15 + (frame % 7) * 11}%, white 0 1px, transparent 1.5px)`, backgroundSize: '9px 9px', mixBlendMode: 'soft-light'}} />;
};

const Shot: React.FC<{shot: ShotData; accent: string}> = ({shot, accent}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const duration = 5 * fps;
  return (
    <AbsoluteFill style={{overflow: 'hidden', backgroundColor: '#050608'}}>
      <Img src={staticFile(shot.src)} style={{position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', opacity: interpolate(frame, [0, 14, duration - 18, duration - 1], [0, 1, 1, 0], clamp), scale: String(interpolate(frame, [0, duration], [1.035, 1.105], {...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1)})), translate: `${interpolate(frame, [0, duration], [0, shot.panX ?? 0], clamp)}px ${interpolate(frame, [0, duration], [0, shot.panY ?? 0], clamp)}px`}} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(3,4,7,0.14) 10%, rgba(3,4,7,0.12) 45%, rgba(3,4,7,0.88) 100%)'}} />
      <div style={{position: 'absolute', left: 120, bottom: 92, width: 1320, fontFamily, fontSize: 38, lineHeight: 1.45, fontWeight: 500, letterSpacing: 1, color: '#f6f3ee', textShadow: '0 3px 24px rgba(0,0,0,0.65)', opacity: interpolate(frame, [14, 30, duration - 34, duration - 12], [0, 0.92, 0.92, 0], clamp)}}>
        <span style={{color: accent, marginRight: 18}}>—</span>{shot.caption}
      </div>
    </AbsoluteFill>
  );
};

const Segment: React.FC<{segment: SegmentData}> = ({segment}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const shotDuration = 5 * fps;
  return (
    <AbsoluteFill style={{backgroundColor: '#050608'}}>
      {segment.shots.map((shot, index) => <Sequence key={shot.src} from={index * shotDuration} durationInFrames={shotDuration} premountFor={fps}><Shot shot={shot} accent={segment.accent} /></Sequence>)}
      <div style={{position: 'absolute', left: 120, top: 84, fontFamily, color: '#fff', opacity: interpolate(frame, [0, 10, 100, 130], [0, 1, 1, 0.18], clamp)}}>
        <div style={{fontSize: 72, fontWeight: 800, letterSpacing: 6}}>{segment.title}</div>
        <div style={{marginTop: 8, fontSize: 22, letterSpacing: 7, color: segment.accent}}>{segment.english}</div>
        <div style={{marginTop: 22, fontSize: 28, color: '#e9e4dc'}}>{segment.kicker}</div>
      </div>
      <div style={{position: 'absolute', right: 80, top: 82, fontFamily, fontSize: 18, letterSpacing: 4, color: segment.accent, opacity: 0.72}}>AURELIUSWU / STORY GAME</div>
      <FilmGrain />
    </AbsoluteFill>
  );
};

const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: '#050608', justifyContent: 'center', alignItems: 'center', fontFamily}}>
      <div style={{fontSize: 30, letterSpacing: 14, color: '#a9a9aa', opacity: interpolate(frame, [0, 18, 2.8 * fps, 3.5 * fps], [0, 1, 1, 0], clamp)}}>FOUR STORIES / ONE NIGHT</div>
      <div style={{marginTop: 26, fontSize: 96, fontWeight: 900, letterSpacing: 10, color: '#f4f1ec', opacity: interpolate(frame, [0.8 * fps, 1.4 * fps, 7.7 * fps, 9 * fps], [0, 1, 1, 0], clamp), scale: String(interpolate(frame, [0.8 * fps, 9 * fps], [0.96, 1.035], clamp))}}>雨夜之后，故事仍在继续</div>
      <div style={{marginTop: 40, display: 'flex', gap: 42, fontSize: 26, letterSpacing: 3, color: '#d5d0c9', opacity: interpolate(frame, [2.2 * fps, 3 * fps, 8 * fps, 9.4 * fps], [0, 1, 1, 0], clamp)}}><span>雨停之前</span><span>湿性愈合</span><span>网恋</span><span>回路</span></div>
      <div style={{marginTop: 28, fontSize: 18, letterSpacing: 5, color: '#777'}}>VOICE CUT · PV v2</div>
      <FilmGrain />
    </AbsoluteFill>
  );
};

const Finale: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: '#050608', justifyContent: 'center', alignItems: 'center', fontFamily}}>
      <div style={{fontSize: 72, fontWeight: 900, letterSpacing: 8, color: '#f7f3ee', opacity: interpolate(frame, [0, 20, 8.2 * fps, 9.5 * fps], [0, 1, 1, 0], clamp)}}>四部独立叙事游戏</div>
      <div style={{display: 'flex', gap: 36, marginTop: 38, fontSize: 28, letterSpacing: 2, color: '#c8c4bd'}}>{segments.map((segment, index) => <span key={segment.title} style={{color: segment.accent, opacity: interpolate(frame, [(1 + index * 0.45) * fps, (1.6 + index * 0.45) * fps], [0, 1], clamp)}}>{segment.title}</span>)}</div>
      <div style={{marginTop: 54, fontSize: 24, letterSpacing: 5, color: '#8f9094', opacity: interpolate(frame, [4 * fps, 4.8 * fps, 8.5 * fps, 9.5 * fps], [0, 1, 1, 0], clamp)}}>CREATED BY AURELIUSWU · WINDOWS / WEB</div>
      <FilmGrain />
    </AbsoluteFill>
  );
};

const VoiceCard: React.FC<{cue: VoiceCue}> = ({cue}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const duration = cue.duration * fps;
  const opacity = interpolate(frame, [0, 8, duration - 10, duration], [0, 1, 1, 0], clamp);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{position: 'absolute', left: 94, right: 94, bottom: 58, padding: '24px 30px 26px', borderLeft: `5px solid ${cue.accent}`, background: 'linear-gradient(90deg, rgba(6,7,10,0.88), rgba(6,7,10,0.70) 72%, rgba(6,7,10,0.10))', backdropFilter: 'blur(6px)', fontFamily, opacity}}>
        <div style={{fontSize: 22, fontWeight: 800, letterSpacing: 3, color: cue.accent, marginBottom: 10}}>{cue.speaker}</div>
        <div style={{fontSize: 40, lineHeight: 1.42, fontWeight: 650, color: '#fff', textShadow: '0 2px 16px rgba(0,0,0,.8)'}}>“{cue.text}”</div>
      </div>
    </AbsoluteFill>
  );
};

const VoiceTrack: React.FC = () => {
  const {fps} = useVideoConfig();
  return <>{voiceCues.map((cue) => <Sequence key={cue.src} from={Math.round(cue.from * fps)} durationInFrames={Math.round(cue.duration * fps)} premountFor={fps}><Audio src={staticFile(cue.src)} volume={1} /><VoiceCard cue={cue} /></Sequence>)}</>;
};

const TransitionSfx: React.FC = () => {
  const {fps} = useVideoConfig();
  const points = [10, 35, 60, 85, 110];
  const sources = ['audio/paper-turn.mp3', 'audio/phone-alert.mp3', 'audio/return-bell.mp3', 'audio/intercom-click.mp3', 'audio/return-bell.mp3'];
  return <>{points.map((second, index) => <Sequence key={`${second}-${sources[index]}`} from={second * fps} durationInFrames={3 * fps} premountFor={fps}><Audio src={staticFile(sources[index])} volume={0.42} /></Sequence>)}</>;
};

const musicVolume = (frame: number, fps: number) => {
  const t = frame / fps;
  let factor = 1;
  for (const cue of voiceCues) {
    const fadeIn = cue.from - 0.35;
    const fadeOut = cue.from + cue.duration + 0.45;
    if (t >= fadeIn && t < cue.from) factor = Math.min(factor, interpolate(t, [fadeIn, cue.from], [1, 0.28], clamp));
    else if (t >= cue.from && t <= cue.from + cue.duration) factor = Math.min(factor, 0.28);
    else if (t > cue.from + cue.duration && t <= fadeOut) factor = Math.min(factor, interpolate(t, [cue.from + cue.duration, fadeOut], [0.28, 1], clamp));
  }
  return 0.40 * factor;
};

export const FourGamesPV: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: '#050608'}}>
      <Audio src={staticFile('audio/ticket-window.ogg')} loop volume={musicVolume(frame, fps)} premountFor={fps} />
      <Sequence from={0} durationInFrames={10 * fps} premountFor={fps}><Intro /></Sequence>
      {segments.map((segment, index) => <Sequence key={segment.title} from={(10 + index * 25) * fps} durationInFrames={25 * fps} premountFor={fps}><Segment segment={segment} /></Sequence>)}
      <Sequence from={110 * fps} durationInFrames={10 * fps} premountFor={fps}><Finale /></Sequence>
      <TransitionSfx />
      <VoiceTrack />
    </AbsoluteFill>
  );
};
