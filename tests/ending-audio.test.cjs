const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { CircuitAudio } = require(path.join(process.env.CIRCUIT_TEST_BUILD, 'game/audio.js'));
const { sceneMusicFor, sceneAmbienceFor } = require(path.join(process.env.CIRCUIT_TEST_BUILD, 'game/score.js'));
const { DEFAULT_PREFERENCES } = require(path.join(process.env.CIRCUIT_TEST_BUILD, 'game/preferences.js'));

class Context {
  state = 'suspended'; currentTime = 0; sampleRate = 24000; destination = {};
  createGain() { return { gain: { value: 1, setTargetAtTime(value) { this.value = value; } }, connect(next) { return next; } }; }
  createOscillator() { return { frequency: { value: 0 }, connect(next) { return next; }, start() {}, stop() {} }; }
  createBufferSource() { return { connect(next) { return next; }, start() {}, stop() {} }; }
  createBuffer(channels, size) { return { getChannelData: () => new Float32Array(size) }; }
  createBiquadFilter() { return { frequency: { value: 0 }, connect(next) { return next; } }; }
  async suspend() { this.state = 'suspended'; }
  async close() { this.state = 'closed'; }
}

test('an authored quiet ending silences fallback drone, rain and hum without muting UI bus', async () => {
  const previous = global.AudioContext; global.AudioContext = Context;
  const audio = new CircuitAudio();
  try {
    await audio.configure(DEFAULT_PREFERENCES, false, false, null, 'quiet');
    assert.equal(audio.droneBus.gain.value, 0, 'Silence must not start fallback music');
    assert.equal(audio.rainLevel.gain.value, 0); assert.equal(audio.humLevel.gain.value, 0);
    assert.equal(audio.ambience.gain.value, DEFAULT_PREFERENCES.ambienceVolume, 'UI cues keep their configured bus');
    await audio.configure(DEFAULT_PREFERENCES, false, false, undefined, 'room');
    assert.equal(audio.droneBus.gain.value, 1, 'Legacy fallback remains available');
    assert.equal(audio.rainLevel.gain.value, 0); assert.ok(audio.humLevel.gain.value > 0);
    await audio.configure(DEFAULT_PREFERENCES, false);
    assert.equal(audio.rainLevel.gain.value, 1, 'Existing rainy chapters retain weather');
  } finally { audio.dispose(); global.AudioContext = previous; }
});

test('final investigation changes score and leaves quiet after the final signature', () => {
  assert.notEqual(sceneMusicFor('signoff', 'firstHub'), sceneMusicFor('signoff', 'origin'));
  assert.equal(sceneMusicFor('signoff', 'closeDesk'), null);
  assert.equal(sceneMusicFor('signoff', 'end'), null);
  assert.equal(sceneAmbienceFor('signoff', 'firstHub'), 'room');
  assert.equal(sceneAmbienceFor('signoff', 'end'), 'quiet');
});
