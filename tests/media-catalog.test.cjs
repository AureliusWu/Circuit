const assert = require('node:assert/strict');
const path = require('node:path');
const { readFileSync } = require('node:fs');
const { createHash } = require('node:crypto');
const { test } = require('node:test');
const { VOICE_CLIPS, VOICE_REPLAYS, SCENE_EFFECTS, voicesFor, getVoiceClip } = require(path.join(process.env.CIRCUIT_TEST_BUILD,'game/mediaCatalog.js'));
const { getChapter, CHAPTER_ORDER, createInitialState, getAvailableActions, transition } = require(path.join(process.env.CIRCUIT_TEST_BUILD,'story/engine.js'));
const { getCharacter } = require(path.join(process.env.CIRCUIT_TEST_BUILD,'game/characters.js'));

test('every voice is an exact authored excerpt, has a valid character and is bound to existing scenes',()=>{
  const plan=JSON.parse(readFileSync('docs/audio/voice-plan.json','utf8'));
  assert.equal(VOICE_CLIPS.length,32);
  assert.equal(new Set(VOICE_CLIPS.map(c=>c.character)).size,9);
  assert.equal(new Set(VOICE_CLIPS.map(c=>c.id)).size,VOICE_CLIPS.length);
  for(const clip of VOICE_CLIPS) {
    const request=plan.lines.find(c=>c.id===clip.id);
    assert.equal(clip.text,request.text); assert.equal(clip.character,request.character);
    assert.deepEqual(clip.bindings,request.bindings);
    assert.ok(getCharacter(clip.character));
    assert.match(clip.src,/^\/audio\/voice\/[a-z0-9-]+\.mp3$/);
    for(const bind of clip.bindings) assert.ok(getChapter(bind.chapter)?.nodes[bind.node]?.text.includes(clip.text),`${clip.id}/${bind.node}`);
  }
  assert.deepEqual(voicesFor('return-visit','echo').map(c=>c.id),['v01-arrived','v01-received']);
  assert.deepEqual(voicesFor('missing','missing'),[]);
});

test('Second-part scenes replay the original masters without altering their generation requests', () => {
  const plan = JSON.parse(readFileSync('docs/audio/voice-plan.json', 'utf8'));
  assert.equal(VOICE_REPLAYS.length, 8);
  assert.equal(new Set(VOICE_REPLAYS.map(binding => `${binding.chapter}/${binding.node}`)).size, 8);
  for (const binding of VOICE_REPLAYS) {
    const clip = getVoiceClip(binding.clipId);
    assert.ok(clip, binding.clipId);
    assert.ok(getChapter(binding.chapter)?.nodes[binding.node]?.text.includes(clip.text));
    assert.strictEqual(voicesFor(binding.chapter, binding.node)[0], clip);
    assert.deepEqual(clip.bindings, plan.lines.find(row => row.id === clip.id).bindings);
    assert.ok(clip.bindings.every(row => !['answering', 'visitors'].includes(row.chapter)));
  }
  assert.equal(getVoiceClip('missing'), undefined);
});

test('evidence recordings are encountered on every legal path before the evidence unlocks', () => {
  for (const chapterId of CHAPTER_ORDER) {
    const chapter = getChapter(chapterId);
    if (!Object.values(chapter.evidence).some(item => item.recordings?.length)) continue;
    const queue = [{ state: createInitialState(chapterId), heard: [] }];
    const seen = new Set();
    for (let head = 0; head < queue.length; head++) {
      const { state, heard } = queue[head];
      const available = [...new Set([...heard, ...voicesFor(chapterId, state.nodeId).map(clip => clip.id)])].sort();
      const key = JSON.stringify([state.nodeId, [...state.evidence].sort(), available]);
      if (seen.has(key)) continue;
      seen.add(key);
      for (const id of state.evidence) {
        const recordings = chapter.evidence[id].recordings ?? [];
        assert.equal(new Set(recordings.map(sample => sample.clipId)).size, recordings.length);
        for (const sample of recordings) {
          assert.ok(sample.label.trim());
          assert.ok(getVoiceClip(sample.clipId), `${chapterId}/${id}: unknown recording`);
          assert.ok(available.includes(sample.clipId), `${chapterId}/${id}: unheard recording would be revealed`);
        }
      }
      for (const action of getAvailableActions(state)) {
        queue.push({ state: transition(state, action.id), heard: available });
      }
      assert.ok(seen.size < 50000);
    }
  }
});

test('all shipping recordings, sources and scene effect bindings have verified hashes',()=>{
  const voices=JSON.parse(readFileSync('docs/audio/voice-manifest.json','utf8'));
  const effects=JSON.parse(readFileSync('docs/audio/sfx-manifest.json','utf8'));
  const archived=JSON.parse(readFileSync('docs/audio/voice-first-pass.json','utf8'));
  assert.equal(voices.clips.length,32); assert.equal(effects.clips.length,19);
  assert.equal(archived.clips.length,8);
  for(const clip of [...voices.clips,...effects.clips,...archived.clips]) {
    assert.ok(clip.duration>.05);
    for(const file of clip.files) {
      const bytes=readFileSync(file.path); assert.equal(bytes.length,file.bytes,file.path);
      assert.equal(createHash('sha256').update(bytes).digest('hex'),file.sha256,file.path);
    }
  }
  for(const [key,src]of Object.entries(SCENE_EFFECTS)) {
    const [chapter,node]=key.split('/');assert.ok(getChapter(chapter)?.nodes[node],key);
    assert.ok(effects.clips.some(c=>c.files.some(f=>'/'+f.path.replace(/^public\//,'')===src)),src);
  }
});


test('all 403 produced dialogue bindings resolve to local runtime audio and the authored scene', () => {
  const { FULL_VOICE_CLIPS } = require(path.join(process.env.CIRCUIT_TEST_BUILD, 'game/mediaCatalog.js'));
  assert.equal(FULL_VOICE_CLIPS.length, 403);
  assert.equal(new Set(FULL_VOICE_CLIPS.map(c => c.productionId)).size, 403);
  for (const clip of FULL_VOICE_CLIPS) {
    assert.ok(readFileSync(path.join('public', clip.src.slice(1))).length > 1000, clip.productionId);
    for (const binding of clip.bindings) {
      const node = getChapter(binding.chapter).nodes[binding.node];
      assert.ok(node.text.includes(clip.text), clip.productionId);
      assert.ok(voicesFor(binding.chapter, binding.node).some(c => c.src === clip.src), clip.productionId);
    }
  }
});

test('new scene CGs and supporting portraits preserve authored nodes and real local assets', () => {
  const { ALL_CHARACTERS } = require(path.join(process.env.CIRCUIT_TEST_BUILD, 'game/characters.js'));
  assert.equal(ALL_CHARACTERS.length, 15);
  const art = JSON.parse(readFileSync('docs/production/full-media/runtime-art.json', 'utf8'));
  for (const item of art.outputs) {
    const bytes = readFileSync(item.output);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), item.sha256);
  }
  for (const [chapter, node] of [['thirteen-households','end'], ['seventh-night','sevenMeals'], ['backfeed','end'], ['everlight','end'], ['neutral','receive'], ['closure','end'], ['answering','end'], ['tickets','recordPaper']]) {
    const scene = getChapter(chapter).nodes[node].scene;
    assert.equal(scene.eventCg, true);
    assert.ok(readFileSync(path.join('public',scene.background.slice(1))).length > 1000);
  }
});
