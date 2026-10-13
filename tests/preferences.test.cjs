const assert = require('node:assert/strict');
const path = require('node:path');
const { test } = require('node:test');
const { PREFERENCES_KEY, DEFAULT_PREFERENCES, TEXT_SPEEDS, isPreferences, loadPreferences, savePreferences } = require(
  path.join(process.env.CIRCUIT_TEST_BUILD, 'game/preferences.js')
);

class MemoryStorage {
  constructor(records = {}) { this.records = new Map(Object.entries(records)); this.writes = []; }
  getItem(key) { return this.records.get(key) ?? null; }
  setItem(key, value) { this.writes.push([key, value]); this.records.set(key, value); }
  removeItem(key) { this.records.delete(key); }
}

test('missing settings use independent defaults without writing', () => {
  const storage = new MemoryStorage();
  const first = loadPreferences(storage);
  const second = loadPreferences(storage);
  assert.equal(first.status, 'empty');
  assert.deepEqual(first.preferences, DEFAULT_PREFERENCES);
  first.preferences.musicVolume = 0;
  assert.equal(second.preferences.musicVolume, DEFAULT_PREFERENCES.musicVolume);
  assert.deepEqual(storage.writes, []);
});

test('all text speeds, delay limits and audio boundary values are supported', () => {
  for (const textSpeed of TEXT_SPEEDS) {
    for (const autoDelay of [2, 4.5, 8]) {
      for (const volume of [0, 0.5, 1]) {
        assert.equal(isPreferences({ ...DEFAULT_PREFERENCES, textSpeed, autoDelay, musicVolume: volume, ambienceVolume: volume }), true);
      }
    }
  }
});

test('invalid settings types and out of range values are rejected', () => {
  const cases = [null, [], 3, '', {}, Object.create(DEFAULT_PREFERENCES),
    { ...DEFAULT_PREFERENCES, textSpeed: 'extreme' },
    ...[1, 9, NaN, Infinity, '4', null].map((autoDelay) => ({ ...DEFAULT_PREFERENCES, autoDelay })),
    ...[-0.1, 1.1, NaN, Infinity, '0.5'].flatMap((volume) => [
      { ...DEFAULT_PREFERENCES, musicVolume: volume }, { ...DEFAULT_PREFERENCES, ambienceVolume: volume },
      { ...DEFAULT_PREFERENCES, voiceVolume: volume }, { ...DEFAULT_PREFERENCES, sfxVolume: volume }
    ]),
    ...['muted', 'highContrast', 'reducedMotion', 'voiceEnabled'].flatMap((key) => [
      { ...DEFAULT_PREFERENCES, [key]: 'true' }, { ...DEFAULT_PREFERENCES, [key]: 0 }
    ])
  ];
  for (const value of cases) assert.equal(isPreferences(value), false);
});

test('old settings gain independent voice controls without rewriting the stored record', () => {
  const old = {...DEFAULT_PREFERENCES, musicVolume:.2};
  delete old.voiceVolume; delete old.sfxVolume; delete old.voiceEnabled;
  const raw = JSON.stringify(old);
  const storage = new MemoryStorage({[PREFERENCES_KEY]:raw});
  const loaded = loadPreferences(storage);
  assert.equal(loaded.status,'valid');
  assert.equal(loaded.preferences.voiceVolume,.8);
  assert.equal(loaded.preferences.sfxVolume,.6);
  assert.equal(loaded.preferences.voiceEnabled,true);
  assert.equal(loaded.preferences.musicVolume,.2);
  assert.equal(storage.getItem(PREFERENCES_KEY),raw);
  assert.deepEqual(storage.writes,[]);
  storage.records.set(PREFERENCES_KEY,JSON.stringify({...old,voiceVolume:null}));
  assert.equal(loadPreferences(storage).status,'invalid');
});

test('corrupt settings are preserved while defaults remain playable', () => {
  const storage = new MemoryStorage();
  for (const raw of ['', '{bad', 'null', '[]', JSON.stringify({ ...DEFAULT_PREFERENCES, autoDelay: 99 })]) {
    storage.records.set(PREFERENCES_KEY, raw);
    const loaded = loadPreferences(storage);
    assert.equal(loaded.status, 'invalid');
    assert.deepEqual(loaded.preferences, DEFAULT_PREFERENCES);
    assert.equal(storage.getItem(PREFERENCES_KEY), raw);
  }
  assert.deepEqual(storage.writes, []);
});

test('explicit setting writes preserve unrelated data and strip unknown fields', () => {
  const storage = new MemoryStorage({ 'circuit-auto-v100': 'campaign' });
  const current = { ...DEFAULT_PREFERENCES, muted: true, reducedMotion: true, extra: 'discard' };
  const saved = savePreferences(storage, current);
  assert.equal(saved.status, 'saved');
  assert.equal(storage.getItem('circuit-auto-v100'), 'campaign');
  const persisted = JSON.parse(storage.getItem(PREFERENCES_KEY));
  assert.deepEqual(Object.keys(persisted).sort(), Object.keys(DEFAULT_PREFERENCES).sort());
  assert.equal(persisted.muted, true);
  current.textSpeed = 'instant';
  assert.equal(saved.preferences.textSpeed, 'normal');
  const loaded = loadPreferences(storage);
  assert.equal(loaded.status, 'valid');
  assert.deepEqual(loaded.preferences, saved.preferences);
});

test('invalid writes and storage failures never overwrite settings or throw', () => {
  const storage = new MemoryStorage({ [PREFERENCES_KEY]: 'keep original' });
  assert.equal(savePreferences(storage, { ...DEFAULT_PREFERENCES, musicVolume: 2 }).status, 'invalid');
  assert.equal(storage.getItem(PREFERENCES_KEY), 'keep original');
  assert.deepEqual(storage.writes, []);
  const denied = {
    getItem() { throw new Error('SecurityError'); },
    setItem() { throw new Error('QuotaExceededError'); },
    removeItem() { throw new Error('SecurityError'); }
  };
  for (const unavailable of [null, undefined, denied]) {
    const loaded = loadPreferences(unavailable);
    assert.equal(loaded.status, 'unavailable');
    assert.deepEqual(loaded.preferences, DEFAULT_PREFERENCES);
    assert.equal(savePreferences(unavailable, { ...DEFAULT_PREFERENCES }).status, 'unavailable');
  }
});
