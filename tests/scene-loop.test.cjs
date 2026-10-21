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
test('obsolete fetches are aborted before decode, including on disposal', async () => {
  const saved = global.fetch;
  try {
    const requests = []; let decodes = 0;
    global.fetch = (_url, options) => new Promise(resolve => requests.push({ signal: options.signal, resolve }));
    const { loop, context, sources } = setup();
    context.decodeAudioData = async () => { decodes++; return {}; };
    loop.select('/old.ogg'); loop.select('/new.ogg');
    assert.equal(requests[0].signal.aborted, true);
    requests[0].resolve({ ok: true, arrayBuffer: async () => new ArrayBuffer(1) }); await settle();
    assert.equal(decodes, 0);
    loop.dispose(); assert.equal(requests[1].signal.aborted, true);
    requests[1].resolve({ ok: true, arrayBuffer: async () => new ArrayBuffer(1) }); await settle();
    assert.equal(decodes, 0); assert.equal(sources.length, 0);
  } finally { global.fetch = saved; }
});
test('two-track LRU reuses recent music and evicts older decoded buffers', async () => {
  const saved = global.fetch;
  try {
    let requests = 0;
    global.fetch = async () => { requests++; return { ok: true, arrayBuffer: async () => new ArrayBuffer(1) }; };
    const { loop, context } = setup();
    context.decodeAudioData = async () => ({ length: 441000, numberOfChannels: 2 });
    for (const url of ['/a.ogg', '/b.ogg', '/c.ogg', '/b.ogg']) { loop.select(url); await settle(); }
    assert.equal(requests, 3);
    loop.select('/a.ogg'); await settle(); assert.equal(requests, 4);
    loop.dispose();
  } finally { global.fetch = saved; }
});
test('large buffers play but cannot exceed the 32 MiB retained cache budget', async () => {
  const saved = global.fetch;
  try {
    let requests = 0;
    global.fetch = async () => { requests++; return { ok: true, arrayBuffer: async () => new ArrayBuffer(1) }; };
    const { loop, context, sources } = setup();
    context.decodeAudioData = async () => ({ length: 9 * 1024 * 1024, numberOfChannels: 1 });
    loop.select('/large.ogg'); await settle(); assert.equal(sources.length, 1);
    loop.select(undefined); loop.select('/large.ogg'); await settle(); assert.equal(requests, 2);
    loop.dispose();
  } finally { global.fetch = saved; }
});
test('combined PCM memory is bounded even for two individually cacheable tracks', async () => {
  const saved = global.fetch;
  try {
    let requests = 0;
    global.fetch = async () => { requests++; return { ok: true, arrayBuffer: async () => new ArrayBuffer(1) }; };
    const { loop, context } = setup();
    context.decodeAudioData = async () => ({ length: 5 * 1024 * 1024, numberOfChannels: 1 });
    for (const url of ['/a.ogg', '/b.ogg', '/a.ogg']) { loop.select(url); await settle(); }
    assert.equal(requests, 3); loop.dispose();
  } finally { global.fetch = saved; }
});
