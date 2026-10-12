const assert = require('node:assert/strict');
const path = require('node:path');
const { test } = require('node:test');
const { SAVE_KEYS, MAX_HISTORY_ENTRIES, validateSavePayload, loadSave, saveGame, clearAutoSave } = require(
  path.join(process.env.CIRCUIT_TEST_BUILD, 'game/saves.js')
);
const { PROLOGUE } = require(path.join(process.env.CIRCUIT_TEST_BUILD, 'story/engine.js'));

const EVIDENCE = ['live-after-cut', 'house-13', 'paper-ash'];
const SAVED_AT = '2026-10-11T02:07:00.000Z';

class MemoryStorage {
  constructor(records = {}) {
    this.records = new Map(Object.entries(records));
    this.writes = [];
    this.removals = [];
  }
  getItem(key) { return this.records.get(key) ?? null; }
  setItem(key, value) {
    this.writes.push([key, value]);
    this.records.set(key, value);
  }
  removeItem(key) {
    this.removals.push(key);
    this.records.delete(key);
  }
}

function payload(overrides = {}) {
  return {
    version: 1,
    chapterId: PROLOGUE,
    nodeId: 'meterbox',
    evidence: ['live-after-cut'],
    history: ['dispatch', 'call', 'alley', 'meterbox', 'inspectCurrent', 'meterbox'],
    savedAt: SAVED_AT,
    ...overrides
  };
}

function state(nodeId = 'meterbox', evidence = ['live-after-cut']) {
  return { chapterId: PROLOGUE, nodeId, evidence };
}

test('valid save snapshots are independent copies of evidence and visit history', () => {
  const input = payload();
  const result = validateSavePayload(input);
  assert.equal(result.status, 'valid');
  assert.deepEqual(result.snapshot.state, state());
  input.evidence.push('house-13');
  input.history.push('inspectLedger');
  assert.deepEqual(result.snapshot.state.evidence, ['live-after-cut']);
  assert.equal(result.snapshot.history.at(-1), 'meterbox');
});

test('reject malformed structures, unsupported versions and unsafe identifiers', () => {
  const cases = [null, [], 'save', 12, {},
    payload({ version: '1' }), payload({ version: 2 }),
    payload({ chapterId: 'unknown' }), payload({ chapterId: '__proto__' }),
    payload({ nodeId: 'constructor', history: ['constructor'] }),
    payload({ nodeId: '__proto__', history: ['__proto__'] }),
    payload({ evidence: 'live-after-cut' }), payload({ evidence: [null] }),
    payload({ evidence: ['unknown'] }), payload({ evidence: ['constructor'] }),
    payload({ evidence: ['live-after-cut', 'live-after-cut'] }),
    payload({ nodeId: 'title', evidence: [], history: ['title'] }),
    Object.create(payload()), new Date()
  ];
  for (const input of cases) assert.equal(validateSavePayload(input).status, 'invalid');
});

test('history is bounded, contains real playable nodes and ends at the saved position', () => {
  const cases = [undefined, {}, [], ['meterbox', 'unknown'], ['constructor', 'meterbox'],
    ['__proto__', 'meterbox'], ['title', 'meterbox'], [1, 'meterbox'], ['dispatch'],
    Array(MAX_HISTORY_ENTRIES + 1).fill('meterbox')];
  for (const history of cases) assert.equal(validateSavePayload(payload({ history })).status, 'invalid');
  const boundary = payload({ history: Array(MAX_HISTORY_ENTRIES).fill('meterbox') });
  assert.equal(validateSavePayload(boundary).status, 'valid');
});

test('saved timestamps are real canonical ISO values', () => {
  for (const savedAt of [null, 123, '', 'yesterday', '2026-02-30T00:00:00.000Z', '2026-10-11', '2026-10-11T02:07:00Z']) {
    assert.equal(validateSavePayload(payload({ savedAt })).status, 'invalid');
  }
});

test('saved state enforces investigation prerequisites rather than allowing known-node jumps', () => {
  for (const nodeId of ['dispatch', 'call', 'alley']) {
    assert.equal(validateSavePayload(payload({ nodeId, history: [nodeId] })).status, 'invalid');
    assert.equal(validateSavePayload(payload({ nodeId, evidence: [], history: [nodeId] })).status, 'valid');
  }
  const inspections = [
    ['inspectCurrent', 'live-after-cut'],
    ['inspectLedger', 'house-13'],
    ['inspectAsh', 'paper-ash']
  ];
  for (const [nodeId, ownEvidence] of inspections) {
    assert.equal(validateSavePayload(payload({ nodeId, evidence: [ownEvidence], history: [nodeId] })).status, 'invalid');
    assert.equal(validateSavePayload(payload({ nodeId, evidence: EVIDENCE.filter((id) => id !== ownEvidence), history: [nodeId] })).status, 'valid');
  }
  for (const nodeId of ['lamp', 'deduction', 'wrong', 'truth', 'end']) {
    assert.equal(validateSavePayload(payload({ nodeId, history: [nodeId] })).status, 'invalid');
    assert.equal(validateSavePayload(payload({ nodeId, evidence: EVIDENCE, history: [nodeId] })).status, 'valid');
  }
  for (let mask = 0; mask < 8; mask += 1) {
    const evidence = EVIDENCE.filter((_, index) => mask & (1 << index));
    assert.equal(validateSavePayload(payload({ evidence })).status, 'valid');
  }
});

test('empty and corrupt slots return distinct outcomes without changing storage', () => {
  const storage = new MemoryStorage();
  assert.equal(loadSave(storage, 'manual').status, 'empty');
  assert.equal(loadSave(storage, 'auto').status, 'empty');
  for (const raw of ['', '{bad json', 'null', '[]', JSON.stringify(payload({ version: 99 }))]) {
    storage.records.set(SAVE_KEYS.manual, raw);
    assert.equal(loadSave(storage, 'manual').status, 'invalid');
    assert.equal(storage.getItem(SAVE_KEYS.manual), raw);
  }
  assert.deepEqual(storage.writes, []);
  assert.deepEqual(storage.removals, []);
});

test('legacy manual saves migrate in memory only and require a reachable inventory', () => {
  const raw = JSON.stringify({ node: 'deduction', evidence: EVIDENCE });
  const storage = new MemoryStorage({ [SAVE_KEYS.legacy]: raw });
  const result = loadSave(storage, 'manual');
  assert.equal(result.status, 'valid');
  assert.equal(result.source, 'legacy');
  assert.deepEqual(result.snapshot.state, state('deduction', EVIDENCE));
  assert.deepEqual(result.snapshot.history, ['deduction']);
  assert.equal(result.snapshot.savedAt, '1970-01-01T00:00:00.000Z');
  assert.equal(storage.getItem(SAVE_KEYS.legacy), raw);
  assert.equal(storage.getItem(SAVE_KEYS.manual), null);
  assert.deepEqual(storage.writes, []);
  assert.deepEqual(storage.removals, []);
  for (const legacy of [{ node: 'lamp', evidence: [] }, { node: 'meterbox' }, { node: '__proto__', evidence: [] }]) {
    storage.records.set(SAVE_KEYS.legacy, JSON.stringify(legacy));
    assert.equal(loadSave(storage, 'manual').status, 'invalid');
  }
});

test('new manual slots take precedence and corruption does not silently load legacy or autosave', () => {
  const storage = new MemoryStorage({
    [SAVE_KEYS.manual]: JSON.stringify(payload()),
    [SAVE_KEYS.legacy]: JSON.stringify({ node: 'end', evidence: EVIDENCE }),
    [SAVE_KEYS.auto]: JSON.stringify(payload({ nodeId: 'end', evidence: EVIDENCE, history: ['end'] }))
  });
  const result = loadSave(storage, 'manual');
  assert.equal(result.status, 'valid');
  assert.equal(result.source, 'v011');
  assert.equal(result.snapshot.state.nodeId, 'meterbox');
  storage.records.set(SAVE_KEYS.manual, 'broken');
  assert.equal(loadSave(storage, 'manual').status, 'invalid');
  assert.equal(loadSave(storage, 'auto').snapshot.state.nodeId, 'end');
});

test('autosave reads only its own slot even when a legacy manual save exists', () => {
  const storage = new MemoryStorage({ [SAVE_KEYS.legacy]: JSON.stringify({ node: 'meterbox', evidence: [] }) });
  assert.equal(loadSave(storage, 'auto').status, 'empty');
  assert.equal(loadSave(storage, 'manual').status, 'valid');
});

test('manual save writes a versioned snapshot and exact old-format compatibility record', () => {
  const storage = new MemoryStorage({ [SAVE_KEYS.auto]: 'existing auto' });
  const current = state();
  const history = ['dispatch', 'meterbox'];
  const result = saveGame(storage, 'manual', current, history, new Date(SAVED_AT));
  assert.equal(result.status, 'saved');
  assert.deepEqual(JSON.parse(storage.getItem(SAVE_KEYS.manual)), payload({ history }));
  assert.deepEqual(JSON.parse(storage.getItem(SAVE_KEYS.legacy)), { node: 'meterbox', evidence: ['live-after-cut'] });
  assert.equal(storage.getItem(SAVE_KEYS.auto), 'existing auto');
  current.evidence.push('house-13');
  history.push('inspectLedger');
  assert.deepEqual(result.snapshot.state.evidence, ['live-after-cut']);
  assert.deepEqual(result.snapshot.history, ['dispatch', 'meterbox']);
});

test('automatic save leaves both manual records untouched', () => {
  const storage = new MemoryStorage({ [SAVE_KEYS.manual]: 'manual', [SAVE_KEYS.legacy]: 'legacy' });
  assert.equal(saveGame(storage, 'auto', state(), ['meterbox'], new Date(SAVED_AT)).status, 'saved');
  assert.equal(storage.getItem(SAVE_KEYS.manual), 'manual');
  assert.equal(storage.getItem(SAVE_KEYS.legacy), 'legacy');
  assert.equal(loadSave(storage, 'auto').status, 'valid');
  assert.deepEqual(storage.writes.map(([key]) => key), [SAVE_KEYS.auto]);
});

test('invalid save requests preserve all existing records', () => {
  const storage = new MemoryStorage({ [SAVE_KEYS.manual]: 'keep manual' });
  assert.equal(saveGame(storage, 'manual', state('lamp', []), ['lamp']).status, 'invalid');
  assert.equal(saveGame(storage, 'manual', state(), [], new Date(SAVED_AT)).status, 'invalid');
  assert.equal(saveGame(storage, 'manual', state(), ['meterbox'], new Date('invalid')).status, 'invalid');
  assert.equal(storage.getItem(SAVE_KEYS.manual), 'keep manual');
  assert.deepEqual(storage.writes, []);
});

test('denied reads, quota failures and missing storage are recoverable outcomes', () => {
  const denied = {
    getItem() { throw new Error('SecurityError'); },
    setItem() { throw new Error('QuotaExceededError'); },
    removeItem() { throw new Error('SecurityError'); }
  };
  for (const storage of [null, undefined, denied]) {
    assert.equal(loadSave(storage, 'manual').status, 'unavailable');
    assert.equal(loadSave(storage, 'auto').status, 'unavailable');
    assert.equal(saveGame(storage, 'manual', state(), ['meterbox']).status, 'unavailable');
    assert.equal(clearAutoSave(storage).status, 'unavailable');
  }
  const full = new MemoryStorage({ [SAVE_KEYS.manual]: 'previous manual' });
  full.setItem = () => { throw new Error('QuotaExceededError'); };
  assert.equal(saveGame(full, 'manual', state(), ['meterbox']).status, 'unavailable');
  assert.equal(full.getItem(SAVE_KEYS.manual), 'previous manual');
});

test('failed compatibility writes restore the previous manual snapshot', () => {
  for (const previousManual of [null, 'previous manual']) {
    const storage = new MemoryStorage({ [SAVE_KEYS.legacy]: 'previous legacy' });
    if (previousManual !== null) storage.records.set(SAVE_KEYS.manual, previousManual);
    const originalSet = storage.setItem.bind(storage);
    storage.setItem = (key, value) => {
      if (key === SAVE_KEYS.legacy) throw new Error('QuotaExceededError');
      originalSet(key, value);
    };
    assert.equal(saveGame(storage, 'manual', state(), ['meterbox']).status, 'unavailable');
    assert.equal(storage.getItem(SAVE_KEYS.manual), previousManual);
    assert.equal(storage.getItem(SAVE_KEYS.legacy), 'previous legacy');
  }
});

test('explicit autosave clearing retains manual and legacy data', () => {
  const storage = new MemoryStorage({ [SAVE_KEYS.manual]: 'manual', [SAVE_KEYS.legacy]: 'legacy', [SAVE_KEYS.auto]: 'auto' });
  assert.equal(clearAutoSave(storage).status, 'cleared');
  assert.equal(storage.getItem(SAVE_KEYS.auto), null);
  assert.equal(storage.getItem(SAVE_KEYS.manual), 'manual');
  assert.equal(storage.getItem(SAVE_KEYS.legacy), 'legacy');
  assert.deepEqual(storage.removals, [SAVE_KEYS.auto]);
});
