const assert = require('node:assert/strict');
const path = require('node:path');
const { test } = require('node:test');
const { RecordedAudio, voiceBlocksAuto } = require(path.join(process.env.CIRCUIT_TEST_BUILD, 'game/recordedAudio.js'));
const { DEFAULT_PREFERENCES } = require(path.join(process.env.CIRCUIT_TEST_BUILD, 'game/preferences.js'));
const clip = (id) => ({id, character: 'ji', text: id, src: `/audio/voice/${id}.mp3`, bindings: []});
const settle = () => new Promise(resolve => setImmediate(resolve));

function fixture() {
  const elements = [];
  const player = new RecordedAudio('/Circuit/', url => {
    const element = {url, volume: 1, paused: true, calls: 0, onended: null, onerror: null,
      play() { this.calls++; this.paused=false; return new Promise((resolve,reject) => {this.resolve=resolve;this.reject=reject;}); },
      pause() {this.paused=true;}, removeAttribute() {}, load() {}};
    elements.push(element); return element;
  });
  player.configure({...DEFAULT_PREFERENCES}, true);
  return {player, elements};
}

test('sequential scene voices wait through loading and playback, then unblock auto', async () => {
  const {player,elements} = fixture();
  try {
    player.enter([clip('one'),clip('two')]);
    assert.equal(elements[0].url, '/Circuit/audio/voice/one.mp3');
    assert.equal(voiceBlocksAuto(player.state), true);
    elements[0].resolve(); await settle();
    assert.equal(player.state.status,'playing');
    elements[0].onended();
    assert.equal(player.state.clip.id,'two');
    assert.equal(player.state.status,'loading');
    elements[1].resolve(); await settle();
    elements[1].onended();
    assert.equal(player.state.status,'idle');
    assert.equal(voiceBlocksAuto(player.state),false);
  } finally {player.dispose();}
});

test('old promises and ended callbacks cannot change the newly entered scene', async () => {
  const {player,elements} = fixture();
  try {
    player.enter([clip('old')]); const oldEnded=elements[0].onended;
    player.enter([clip('new')]);
    elements[0].resolve(); oldEnded(); await settle();
    assert.equal(player.state.clip.id,'new');
    assert.equal(player.state.status,'loading');
    assert.equal(elements[0].paused,true);
    elements[1].resolve(); await settle();
    assert.equal(player.state.status,'playing');
  } finally {player.dispose();}
});

test('panels and hidden pages suspend the position; user pause survives configure', async () => {
  const {player,elements} = fixture();
  try {
    player.enter([clip('one')]); elements[0].resolve(); await settle();
    player.configure({...DEFAULT_PREFERENCES}, false);
    assert.equal(player.state.status,'paused'); assert.equal(elements[0].paused,true);
    player.configure({...DEFAULT_PREFERENCES}, true);
    elements[0].resolve(); await settle();
    player.pause();
    const calls=elements[0].calls;
    player.configure({...DEFAULT_PREFERENCES}, true);
    assert.equal(player.state.userPaused,true);
    assert.equal(elements[0].calls,calls);
    player.resume(); elements[0].resolve(); await settle();
    assert.equal(player.state.status,'playing');
    player.configure({...DEFAULT_PREFERENCES},true,false);
    assert.equal(player.state.status,'paused');
  } finally {player.dispose();}
});

test('pending play cannot undo a manual pause; rejection and decode errors unblock auto', async () => {
  const {player,elements} = fixture();
  try {
    player.enter([clip('one')]); player.pause();
    elements[0].resolve(); await settle();
    assert.equal(player.state.status,'paused'); assert.equal(elements[0].paused,true);
    player.resume(); elements[0].reject(new Error('autoplay denied')); await settle();
    assert.equal(player.state.status,'failed'); assert.equal(voiceBlocksAuto(player.state),false);
    player.replay([clip('one')]); elements[1].onerror(); elements[1].resolve(); await settle();
    assert.equal(player.state.status,'failed');
  } finally {player.dispose();}
});

test('mute and voice disable cancel voices; effects have an independent volume', async () => {
  const {player,elements} = fixture();
  try {
    player.configure({...DEFAULT_PREFERENCES,voiceVolume:.2,sfxVolume:.4},true);
    player.enter([clip('one')],'/audio/sfx/keys.mp3');
    assert.equal(elements[0].volume,.2); assert.equal(elements[1].volume,.4);
    elements[1].resolve();
    player.configure({...DEFAULT_PREFERENCES,muted:true},true);
    assert.equal(player.state.status,'idle'); assert.equal(elements[0].paused,true); assert.equal(elements[1].paused,true);
    player.configure({...DEFAULT_PREFERENCES,voiceEnabled:false},true);
    player.enter([clip('two')]); assert.equal(elements.length,2);
  } finally {player.dispose();}
});

test('history replay works in a visible panel but pauses when its page is hidden', async () => {
  const {player,elements} = fixture();
  try {
    player.configure({...DEFAULT_PREFERENCES},false,true,true);
    player.replay([clip('visited')],true);
    elements[0].resolve(); await settle(); assert.equal(player.state.status,'playing');
    player.configure({...DEFAULT_PREFERENCES},true,true,false);
    assert.equal(player.state.status,'playing');
    player.configure({...DEFAULT_PREFERENCES},false,true,false);
    assert.equal(player.state.status,'paused','A history replay must suspend in a different panel');
    player.configure({...DEFAULT_PREFERENCES},false,true,true);
    elements[0].resolve(); await settle(); assert.equal(player.state.status,'playing');
    player.configure({...DEFAULT_PREFERENCES},false,false,true);
    assert.equal(player.state.status,'paused');
    player.dispose(); elements[0].resolve(); await settle();
    assert.equal(player.state.status,'idle');
  } finally {player.dispose();}
});
