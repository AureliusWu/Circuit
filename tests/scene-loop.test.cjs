const { test } = require('node:test');
const assert = require('node:assert/strict');
const { join } = require('node:path');
const { SceneLoop } = require(join(process.env.CIRCUIT_TEST_BUILD, 'game/sceneLoop.js'));
const settle = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
function setup() {
  const sources = [];
  const context = { state: 'running', currentTime: 0, decodeAudioData: async () => ({}),
    createBufferSource() { const s = { starts: 0, stops: 0, start() { this.starts++; }, stop() { this.stops++; }, connect(x) { return x; }, disconnect() {} }; sources.push(s); return s; },
    createGain() { return { gain: { setValueAtTime() {}, linearRampToValueAtTime() {}, cancelScheduledValues() {}, setTargetAtTime() {} }, connect() {}, disconnect() {} }; } };
  return { context, sources, loop: new SceneLoop(context, {}) };
}
test('scene exit and disposal reject late downloads; repeated configure starts only one loop', async () => {
  const saved = global.fetch;
  try {
    let finish;
    global.fetch = () => new Promise(resolve => { finish = resolve; });
    const first = setup(); first.loop.select('/old.ogg'); first.loop.select(undefined);
    finish({ ok: true, arrayBuffer: async () => new ArrayBuffer(1) }); await settle();
    assert.equal(first.sources.length, 0);
    global.fetch = async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(1) });
    const next = setup(); next.loop.select('/current.ogg'); next.loop.select('/current.ogg'); await settle();
    assert.equal(next.sources.length, 1); assert.equal(next.sources[0].starts, 1);
    next.context.state = 'suspended'; await next.loop.ensure(); next.context.state = 'running'; await next.loop.ensure();
    assert.equal(next.sources.length, 1); next.loop.dispose(); assert.equal(next.sources[0].stops, 1);
  } finally { global.fetch = saved; }
});
