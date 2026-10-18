const { test } = require('node:test');
const assert = require('node:assert/strict');
const { join } = require('node:path');
const { createPwaController } = require(join(process.env.CIRCUIT_TEST_BUILD, 'game/pwa.js'));
function setup(active = null, failure = false) {
  const service = new EventTarget(); let calls = 0;
  const owner = Object.assign(new EventTarget(), { scope: 'https://game.test/Circuit/', active, waiting: null, installing: null, update: async () => {} });
  service.register = async () => { calls++; if (failure) throw Error('network'); return owner; };
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { serviceWorker: service, onLine: true } });
  globalThis.location = { href: 'https://game.test/Circuit/' };
  globalThis.window = Object.assign(new EventTarget(), { matchMedia: () => ({ matches: false }) });
  return { owner, service, calls: () => calls, fail: value => { failure = value; } };
}
function worker(state) { return Object.assign(new EventTarget(), { state }); }
const settle = () => new Promise(resolve => setImmediate(resolve));
test('a parent service worker does not establish readiness', async () => {
  const mock = setup(); mock.service.ready = Promise.resolve({ active: worker('activated') });
  const pwa = createPwaController('/Circuit/', true, false); pwa.start(); await settle();
  assert.equal(pwa.getSnapshot().status, 'downloading');
  mock.owner.active = worker('activated'); mock.owner.dispatchEvent(new Event('updatefound'));
  assert.equal(pwa.getSnapshot().status, 'ready'); assert.equal(mock.calls(), 1);
});
test('failed first installation can retry and only reports complete after activation', async () => {
  const mock = setup(null, true); const pwa = createPwaController('/Circuit/', true, false);
  pwa.start(); await settle(); assert.equal(pwa.getSnapshot().status, 'error');
  mock.fail(false); mock.owner.installing = worker('installing'); await pwa.retry();
  assert.equal(pwa.getSnapshot().status, 'downloading');
  const next = mock.owner.installing; next.state = 'redundant'; next.dispatchEvent(new Event('statechange'));
  assert.equal(pwa.getSnapshot().status, 'error');
  mock.owner.active = worker('activated'); await pwa.retry(); assert.equal(pwa.getSnapshot().status, 'ready');
});
test('waiting updates preserve the current active reader and never request skipWaiting', async () => {
  const mock = setup(worker('activated')); const next = worker('installed');
  next.postMessage = () => assert.fail('must not interrupt active windows'); mock.owner.waiting = next;
  const pwa = createPwaController('/Circuit/', true, false); pwa.start(); await settle();
  assert.equal(pwa.getSnapshot().status, 'ready'); assert.equal(pwa.getSnapshot().updateReady, true);
  mock.owner.update = async () => { throw Error('offline'); }; await pwa.retry();
  assert.equal(pwa.getSnapshot().status, 'ready'); assert.match(pwa.getSnapshot().message, /重试/);
});
test('installation and online state do not imply completed offline resources', async () => {
  setup(); const pwa = createPwaController('/Circuit/', true, false); pwa.start(); await settle();
  window.dispatchEvent(new Event('appinstalled')); window.dispatchEvent(new Event('offline'));
  assert.equal(pwa.getSnapshot().installed, true); assert.equal(pwa.getSnapshot().online, false);
  assert.equal(pwa.getSnapshot().status, 'downloading');
});
test('desktop and development sessions do not register a service worker', async () => {
  const mock = setup(); const desktop = createPwaController('/', true, true); desktop.start();
  const dev = createPwaController('/', false, false); dev.start(); await settle();
  assert.equal(desktop.getSnapshot().status, 'desktop'); assert.equal(dev.getSnapshot().status, 'unsupported'); assert.equal(mock.calls(), 0);
});
