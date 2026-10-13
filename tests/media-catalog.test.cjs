const assert = require('node:assert/strict');
const path = require('node:path');
const { readFileSync } = require('node:fs');
const { createHash } = require('node:crypto');
const { test } = require('node:test');
const { VOICE_CLIPS, SCENE_EFFECTS, voicesFor } = require(path.join(process.env.CIRCUIT_TEST_BUILD,'game/mediaCatalog.js'));
const { getChapter } = require(path.join(process.env.CIRCUIT_TEST_BUILD,'story/engine.js'));
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

test('all shipping recordings, sources and scene effect bindings have verified hashes',()=>{
  const voices=JSON.parse(readFileSync('docs/audio/voice-manifest.json','utf8'));
  const effects=JSON.parse(readFileSync('docs/audio/sfx-manifest.json','utf8'));
  const archived=JSON.parse(readFileSync('docs/audio/voice-first-pass.json','utf8'));
  assert.equal(voices.clips.length,32); assert.equal(effects.clips.length,11);
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
