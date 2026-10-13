const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { createHash } = require('node:crypto');
const path = require('node:path');
const { test } = require('node:test');
const { CHARACTERS, getCharacter, getPortraitPath } = require(path.join(process.env.CIRCUIT_TEST_BUILD, 'game/characters.js'));
const { getChapter, validateChapter } = require(path.join(process.env.CIRCUIT_TEST_BUILD, 'story/engine.js'));

test('every cast member and expression resolves to a shipping WebP, including nine Q avatars', () => {
  assert.equal(CHARACTERS.length, 9);
  assert.equal(new Set(CHARACTERS.map(person => person.id)).size, 9);
  for (const person of CHARACTERS) {
    for (const asset of [person.chibi, ...Object.values(person.portraits)]) {
      assert.ok(asset.startsWith('/art/') && !asset.includes('..'));
      const bytes = readFileSync(path.join('public', asset.slice(1)));
      assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
      assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
      assert.ok(bytes.length > 1000);
    }
  }
  assert.equal(getCharacter('cheng').name, '程砚');
  assert.equal(getCharacter('ji').name, '季宁');
  assert.equal(getCharacter('missing'), undefined);
  assert.equal(getPortraitPath('missing'), undefined);
  assert.equal(getPortraitPath('cheng', 'focused'), '/art/portraits/cheng-focused.webp');
  assert.equal(getPortraitPath('zhou', 'concerned'), '/art/portraits/zhou.webp');
});

test('chapter validation rejects unknown sprites, unavailable expressions and invalid presence', () => {
  const original = getChapter('thirteen-households');
  for (const [fields, error] of [
    [{ portrait: 'missing' }, 'unknown character'],
    [{ expression: 'focused' }, 'expression is unavailable'],
    [{ presence: 'teleport' }, 'invalid character presence']
  ]) {
    const candidate = { ...original, nodes: { ...original.nodes, dispatch: { ...original.nodes.dispatch, ...fields } } };
    assert.ok(validateChapter(candidate).some(message => message.includes(error)));
    assert.deepEqual(validateChapter(original), []);
  }
});

test('patrol art bytes match the reviewed image-generation manifest', () => {
  const manifest = JSON.parse(readFileSync('docs/art/patrol-manifest.json', 'utf8'));
  assert.equal(manifest.assets.length, 14);
  for (const asset of manifest.assets) {
    const bytes = readFileSync(asset.output);
    assert.equal(bytes.length, asset.bytes, asset.id);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256, asset.id);
    assert.ok(asset.prompt && asset.source_sha256 && asset.references.length, asset.id);
  }
});

test('Return Visit sources, portraits and scene outputs match their generation manifest', () => {
  const manifest = JSON.parse(readFileSync('docs/art/return-visit-manifest.json','utf8'));
  assert.equal(manifest.assets.length,6);
  for (const asset of manifest.assets) {
    for (const [file,sha,bytes] of [[asset.source,asset.sourceSha256,asset.sourceBytes],[asset.output,asset.sha256,asset.bytes]]) {
      const data=readFileSync(file);
      assert.equal(data.length,bytes,asset.id);
      assert.equal(createHash('sha256').update(data).digest('hex'),sha,asset.id);
    }
    assert.ok(asset.prompt && asset.references.length,asset.id);
    if (asset.output.includes('/portraits/') || asset.output.includes('/chibi/')) assert.ok(asset.transparentFraction>.15,asset.id);
  }
});
