import { useMemo, useState } from 'react';

type EvidenceId = 'live-after-cut' | 'house-13' | 'paper-ash';

type StoryNode = {
  location: string;
  time: string;
  speaker?: string;
  text: string;
  visual: 'dispatch' | 'alley' | 'meter' | 'lamp' | 'blackout' | 'ending';
};

type SaveData = {
  node: string;
  evidence: EvidenceId[];
};

const SAVE_KEY = 'circuit-save-v010';

const evidenceInfo: Record<EvidenceId, { title: string; detail: string }> = {
  'live-after-cut': {
    title: '断开后仍有负荷',
    detail: '表前开关已经拉开，但钳形表仍读到稳定电流。电流方向像是从用户侧倒送回来。'
  },
  'house-13': {
    title: '不存在的13户',
    detail: '旧台账只有12户，新系统却长期记录着“13号”用电。地址栏为空，户号真实存在。'
  },
  'paper-ash': {
    title: '表箱里的纸灰',
    detail: '烧焦的黄纸卡在封印螺丝后面，灰烬没有受潮。纸上只剩半个手写的“回”字。'
  }
};

const nodes: Record<string, StoryNode> = {
  title: {
    location: '梧城',
    time: '00:47',
    text: '雨把城市的声音压得很低。远处一排路灯，像一条没有闭合的线。',
    visual: 'blackout'
  },
  dispatch: {
    location: '梧城供电公司 · 城北供电所',
    time: '00:52',
    speaker: '值班员',
    text: '“城西槐荫巷，低压故障。十二户全停，系统却还有一户在走电。你过去看看。”',
    visual: 'dispatch'
  },
  call: {
    location: '值班室',
    time: '00:53',
    speaker: '你',
    text: '我盯着工单看了两遍。停电范围：12户。在线电表：13块。备注里没有新增用户。',
    visual: 'dispatch'
  },
  alley: {
    location: '城西 · 槐荫巷',
    time: '01:21',
    text: '整条巷子都黑着，只有尽头一盏老式路灯亮着。雨水沿着架空线往下滴，像有什么东西正顺着线爬。',
    visual: 'alley'
  },
  meterbox: {
    location: '槐荫巷 · 低压表箱',
    time: '01:27',
    text: '表箱锈得厉害。十二块机械表都停了，最下方却留着一段新换过的导线。现在要把“正常故障”排干净。',
    visual: 'meter'
  },
  inspectCurrent: {
    location: '低压表箱',
    time: '01:29',
    speaker: '你',
    text: '总开关断开。验电确认。可钳形表仍有 0.41A，而且电流方向反了——它从巷子深处回来。',
    visual: 'meter'
  },
  inspectLedger: {
    location: '抢修车内',
    time: '01:33',
    speaker: '你',
    text: '纸质台账只有1到12号。手机系统里多出一个13号户表，七年前建档，此后每个月只在同一天出现一小段用电。',
    visual: 'meter'
  },
  inspectAsh: {
    location: '低压表箱',
    time: '01:36',
    text: '封印螺丝后面塞着一点黄纸灰。雨下了一夜，它却是干的。残片上能辨出半个“回”字。',
    visual: 'meter'
  },
  lamp: {
    location: '槐荫巷尽头',
    time: '01:42',
    text: '那盏路灯没有接在现有图纸的任何支路上。灯杆后是一栋封死的旧宅，门牌被拆了，只留下两颗钉子。',
    visual: 'lamp'
  },
  deduction: {
    location: '旧宅门前',
    time: '01:46',
    speaker: '你',
    text: '三个异常现在连在了一起：倒送电、13号户、干燥的纸灰。必须先判断它们是不是同一个“故障”。',
    visual: 'lamp'
  },
  wrong: {
    location: '槐荫巷',
    time: '01:51',
    text: '你按普通窃电故障处理，剪断了那根回送线。整条巷子瞬间亮了一次。十二块停着的电表同时向后转了一格。',
    visual: 'blackout'
  },
  truth: {
    location: '槐荫巷 · 13号',
    time: '01:52',
    text: '你没有剪线。你先把13号户从系统里拉出来，又沿着倒送电流找到旧宅墙内的暗线。电线的尽头没有负载，只有一张七年前的讣告。',
    visual: 'ending'
  },
  end: {
    location: '第一回路 · 未闭合',
    time: '02:07',
    text: '恢复供电后，十二户电表重新走字。系统上的第13块表消失了。你收起工具时，工单自动多了一行从未有人输入的备注：\n\n“请勿闭合。”',
    visual: 'ending'
  }
};

function App() {
  const [started, setStarted] = useState(false);
  const [nodeId, setNodeId] = useState('title');
  const [evidence, setEvidence] = useState<EvidenceId[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);

  const node = nodes[nodeId];
  const canContinueInvestigation = evidence.length === 3;

  const progress = useMemo(() => {
    const order = ['title', 'dispatch', 'call', 'alley', 'meterbox', 'lamp', 'deduction', 'truth', 'end'];
    const index = Math.max(0, order.indexOf(nodeId));
    return Math.min(100, Math.round((index / (order.length - 1)) * 100));
  }, [nodeId]);

  const go = (next: string) => setNodeId(next);

  const collect = (id: EvidenceId, next: string) => {
    setEvidence((current) => (current.includes(id) ? current : [...current, id]));
    go(next);
  };

  const save = () => {
    const data: SaveData = { node: nodeId, evidence };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  };

  const load = () => {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    try {
      const data = JSON.parse(raw) as SaveData;
      if (!nodes[data.node]) return;
      setNodeId(data.node);
      setEvidence(data.evidence ?? []);
      setStarted(true);
    } catch {
      localStorage.removeItem(SAVE_KEY);
    }
  };

  const restart = () => {
    setNodeId('dispatch');
    setEvidence([]);
    setStarted(true);
  };

  const renderActions = () => {
    if (nodeId === 'dispatch') return <button onClick={() => go('call')}>接下工单</button>;
    if (nodeId === 'call') return <button onClick={() => go('alley')}>出发抢修</button>;
    if (nodeId === 'alley') return <button onClick={() => go('meterbox')}>先查低压表箱</button>;

    if (nodeId === 'meterbox') {
      return (
        <div className="choice-grid">
          {!evidence.includes('live-after-cut') && <button onClick={() => go('inspectCurrent')}>测电流方向</button>}
          {!evidence.includes('house-13') && <button onClick={() => go('inspectLedger')}>核对用户台账</button>}
          {!evidence.includes('paper-ash') && <button onClick={() => go('inspectAsh')}>检查封印与接线</button>}
          {canContinueInvestigation && <button className="danger" onClick={() => go('lamp')}>去找唯一亮着的路灯</button>}
        </div>
      );
    }

    if (nodeId === 'inspectCurrent') return <button onClick={() => collect('live-after-cut', 'meterbox')}>记录：断开后仍有负荷</button>;
    if (nodeId === 'inspectLedger') return <button onClick={() => collect('house-13', 'meterbox')}>记录：不存在的13户</button>;
    if (nodeId === 'inspectAsh') return <button onClick={() => collect('paper-ash', 'meterbox')}>记录：表箱里的纸灰</button>;
    if (nodeId === 'lamp') return <button onClick={() => go('deduction')}>整理证据</button>;

    if (nodeId === 'deduction') {
      return (
        <div className="choice-grid deduction">
          <button onClick={() => go('wrong')}>按窃电处理，直接切断异常回路</button>
          <button className="danger" onClick={() => go('truth')}>先追踪倒送电源，再核对“13号”的建档日期</button>
        </div>
      );
    }

    if (nodeId === 'wrong') return <button onClick={() => go('deduction')}>回到判断前</button>;
    if (nodeId === 'truth') return <button onClick={() => go('end')}>继续</button>;
    if (nodeId === 'end') return <button onClick={restart}>重新开始序章</button>;
    return null;
  };

  if (!started) {
    return (
      <main className="title-screen scene-blackout">
        <div className="noise" />
        <div className="powerline" aria-hidden="true"><span /><span /><span /></div>
        <section className="title-card">
          <p className="eyebrow">A CHINESE FOLK HORROR STORY</p>
          <h1>回路</h1>
          <div className="english-title">CIRCUIT</div>
          <p className="tagline">有些线路，断开以后仍然有电。</p>
          <div className="title-actions">
            <button className="primary" onClick={() => { setStarted(true); setNodeId('dispatch'); }}>开始抢修</button>
            <button onClick={load}>读取存档</button>
          </div>
          <p className="version">v0.1.0 · 闭合前</p>
        </section>
      </main>
    );
  }

  return (
    <main className={`game scene-${node.visual}`}>
      <div className="noise" />
      <header className="hud">
        <div>
          <strong>回路 / CIRCUIT</strong>
          <span>{node.location}</span>
        </div>
        <div className="hud-right">
          <span>{node.time}</span>
          <button className="hud-button" onClick={() => setPanelOpen(!panelOpen)}>证据 {evidence.length}/3</button>
          <button className="hud-button" onClick={save}>存档</button>
        </div>
      </header>

      <div className="progress"><i style={{ width: `${progress}%` }} /></div>

      <section className="stage" aria-label={node.location}>
        <div className="rain" />
        <div className="stage-object meter-box" />
        <div className="stage-object street-lamp"><i /></div>
        <div className="stage-object old-house"><i /><i /></div>
        <div className="scene-caption">{node.location}</div>
      </section>

      <section className="dialogue-wrap">
        <div className="dialogue">
          {node.speaker && <div className="speaker">{node.speaker}</div>}
          <p>{node.text}</p>
          <div className="actions">{renderActions()}</div>
        </div>
      </section>

      <aside className={`evidence-panel ${panelOpen ? 'open' : ''}`}>
        <div className="panel-head">
          <div><small>FIELD RECORD</small><h2>现场记录</h2></div>
          <button onClick={() => setPanelOpen(false)}>×</button>
        </div>
        {evidence.length === 0 ? (
          <p className="empty">尚未记录异常。先按标准故障流程排查。</p>
        ) : (
          evidence.map((id, index) => (
            <article key={id}>
              <span>0{index + 1}</span>
              <div><h3>{evidenceInfo[id].title}</h3><p>{evidenceInfo[id].detail}</p></div>
            </article>
          ))
        )}
        <footer>原则：先排除电气故障，再解释剩下的东西。</footer>
      </aside>
    </main>
  );
}

export default App;
