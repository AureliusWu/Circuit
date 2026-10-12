import { useState } from 'react';
import { CHARACTERS, getCharacter, type CharacterId } from '../game/characters';

const asset = (path: string) => import.meta.env.BASE_URL + path.replace(/^\//, '');

export function CharacterGallery() {
  const [selected, setSelected] = useState<CharacterId>('cheng');
  const [view, setView] = useState<'portrait' | 'chibi'>('portrait');
  const character = getCharacter(selected)!;

  return <div className="character-directory">
    <p className="crew-intro">梧城电网有限公司 · 配电运检中心 · 城区抢修班<br />程砚与季宁固定随队，林岚负责值班联络，现场作业依工单安排。</p>
    <div className="character-roster" role="group" aria-label="选择人物">
      {CHARACTERS.map((person) => <button key={person.id} data-character-id={person.id} aria-pressed={selected === person.id} onClick={() => setSelected(person.id)}>
        <img src={asset(person.chibi)} alt="" /><span>{person.name}</span><small>{person.tag}</small>
      </button>)}
    </div>
    <section className="character-profile" aria-label={character.name + '人物档案'} data-character-profile={character.id}>
      <div className="profile-art">
        <img className={view === 'chibi' ? 'profile-chibi' : 'profile-portrait'} src={asset(view === 'chibi' ? character.chibi : character.portraits.neutral)} alt={character.name + (view === 'chibi' ? ' Q版全身形象' : '立绘')} />
        <div className="profile-view" role="group" aria-label="形象视图">
          <button aria-pressed={view === 'portrait'} onClick={() => setView('portrait')}>立绘</button>
          <button aria-pressed={view === 'chibi'} onClick={() => setView('chibi')}>Q版形象</button>
        </div>
      </div>
      <div className="profile-copy"><small>{character.tag}</small><h3>{character.name}<span>{character.age}</span></h3><p className="profile-role">{character.role}</p><p>{character.bio}</p><h4>分工与记录</h4><p>{character.duty}</p></div>
    </section>
    <footer>档案仅供查阅。Q 版形象用于人物目录，故事现场使用立绘、通讯卡和旧档照片。</footer>
  </div>;
}
