import { useState } from 'react';
import { getVoiceClip, type VoiceClip } from '../game/mediaCatalog';
import type { Evidence, EvidenceId } from '../story/types';
import { RecordSearch } from './RecordSearch';

type Props = {
  evidence: Record<EvidenceId, Evidence>;
  collected: readonly EvidenceId[];
  replayEnabled: boolean;
  onReplay: (clip: VoiceClip) => void;
};

/** Viewing and comparing records never changes the campaign inventory or saves. */
export function EvidenceNotebook({ evidence, collected, replayEnabled, onReplay }: Props) {
  const [comparing, setComparing] = useState(false);
  const [pair, setPair] = useState<readonly string[]>([]);
  const left = collected.includes(pair[0]) ? pair[0] : collected[0];
  const right = collected.includes(pair[1]) && pair[1] !== left ? pair[1] : collected.find(id => id !== left);
  const select = (side: number, id: string) => {
    const current = [left, right ?? left];
    // Choosing the other column's item swaps columns, keeping distinct records.
    if (id === current[1 - side]) current[1 - side] = current[side];
    current[side] = id;
    setPair(current);
  };
  const record = (id: string, index: number) => <article key={id} data-evidence-id={id}>
    <span>{String(index + 1).padStart(2, '0')}</span><div>
      <h3>{evidence[id].title}</h3><p>{evidence[id].detail}</p>
      {evidence[id].recordings?.map(sample => {
        const clip = getVoiceClip(sample.clipId);
        return clip && <button key={sample.clipId} disabled={!replayEnabled} onClick={() => onReplay(clip)}>重听：{sample.label}</button>;
      })}
    </div>
  </article>;

  return <>
    {!collected.length ? <p className="empty">尚未记录异常。先按标准故障流程排查。</p> : <>
      <div className="evidence-view-controls">
        <button aria-pressed={!comparing} onClick={() => setComparing(false)}>全部记录</button>
        <button aria-pressed={comparing} disabled={collected.length < 2} onClick={() => setComparing(true)}>并排核对</button>
        {collected.length < 2 && <small>取得两条记录后可并排核对。</small>}
      </div>
      {comparing && right ? <div className="evidence-comparison" aria-label="两条现场记录并排核对">
        {[left, right].map((id, side) => <section key={side}>
          <label>记录{side === 0 ? '一' : '二'}
            <select aria-label={`核对记录${side === 0 ? '一' : '二'}`} value={id} onChange={event => select(side, event.target.value)}>
              {collected.map(item => <option key={item} value={item}>{evidence[item].title}</option>)}
            </select>
          </label>
          {record(id, collected.indexOf(id))}
        </section>)}
      </div> : <RecordSearch entries={collected.map((id, index) => ({ id, index, text: evidence[id].detail, context: evidence[id].title }))}
        queryLabel="搜索现场记录" showSpeakers={false} listClassName="evidence-records"
        renderEntry={({ id, index }) => record(id, index)} />}
    </>}
    <footer>原则：先排除电气故障，再解释剩下的东西。</footer>
  </>;
}
