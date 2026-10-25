const assert = require('node:assert/strict');
const path = require('node:path');
const { test } = require('node:test');
const { CAMPAIGN_KEYS, createCampaignSession, validateCampaignPayload, loadCampaign, saveCampaign, completeChapter, canStartChapter, startChapter } = require(
  path.join(process.env.CIRCUIT_TEST_BUILD, 'game/campaign.js')
);
const { CHAPTER_ORDER, getChapter, createInitialState } = require(path.join(process.env.CIRCUIT_TEST_BUILD, 'story/engine.js'));
const { SAVE_KEYS } = require(path.join(process.env.CIRCUIT_TEST_BUILD, 'game/saves.js'));
const SAVED_AT = '2026-10-11T02:07:00.000Z';

class MemoryStorage {
  constructor(records = {}) { this.records = new Map(Object.entries(records)); this.writes = []; this.removals = []; }
  getItem(key) { return this.records.get(key) ?? null; }
  setItem(key, value) { this.writes.push([key, value]); this.records.set(key, value); }
  removeItem(key) { this.removals.push(key); this.records.delete(key); }
}

function sessionAt(index, outcome) {
  const chapterId = CHAPTER_ORDER[index];
  const chapter = getChapter(chapterId);
  const completed = CHAPTER_ORDER.slice(0, index);
  const archive = Object.fromEntries(completed.map((id) => [id, [...getChapter(id).requiredEvidence]]));
  let state = createInitialState(chapterId);
  if (outcome) {
    const [nodeId] = Object.entries(chapter.nodes).find(([, node]) => node.outcome === outcome);
    state = { chapterId, nodeId, evidence: [...chapter.requiredEvidence] };
  }
  return { state, history: [state.nodeId], completed, archive };
}

function payload(session = createCampaignSession(), overrides = {}) {
  return { version: 2, ...session.state, history: session.history, savedAt: SAVED_AT, completed: session.completed, archive: session.archive, ...overrides };
}

function oldPayload(session) {
  return { version: 1, ...session.state, history: session.history, savedAt: SAVED_AT };
}

test('new campaigns start at the first chapter without completion or archive writes', () => {
  const session = createCampaignSession();
  assert.equal(session.state.chapterId, CHAPTER_ORDER[0]);
  assert.deepEqual(session.history, [getChapter(CHAPTER_ORDER[0]).entryNode]);
  assert.deepEqual(session.completed, []);
  assert.deepEqual(session.archive, {});
  assert.equal(validateCampaignPayload(payload(session)).status, 'valid');
});

test('all eleven campaign positions accept an ordered completion prefix with evidence proof', () => {
  assert.equal(CHAPTER_ORDER.length, 11);
  for (let index = 0; index < CHAPTER_ORDER.length; index += 1) {
    assert.equal(validateCampaignPayload(payload(sessionAt(index))).status, 'valid');
  }
  const allComplete = completeChapter(sessionAt(CHAPTER_ORDER.length - 1, 'complete'));
  const result = validateCampaignPayload(payload(allComplete));
  assert.equal(result.status, 'valid');
  assert.deepEqual(result.snapshot.completed, CHAPTER_ORDER);
});

test('a v1.1 six-chapter completion preserves its evidence and unlocks Return Visit', () => {
  const old = completeChapter(sessionAt(5,'complete'));
  const stored = payload(old);
  const restored = validateCampaignPayload(stored);
  assert.equal(restored.status,'valid');
  assert.deepEqual(restored.snapshot.completed,CHAPTER_ORDER.slice(0,6));
  assert.deepEqual(restored.snapshot.archive,old.archive);
  assert.ok(canStartChapter(restored.snapshot,'return-visit'));
  const next = startChapter(restored.snapshot,'return-visit');
  assert.equal(next.state.nodeId,'dispatch');
  assert.deepEqual(next.state.evidence,[]);
  assert.deepEqual(next.archive,old.archive);
});

test('a v1.2 Return Visit completion unlocks Answering without rewriting the old save', () => {
  const old = completeChapter(sessionAt(6, 'complete'));
  const raw = JSON.stringify(payload(old));
  const storage = new MemoryStorage({ [CAMPAIGN_KEYS.auto]: raw });
  const restored = loadCampaign(storage, 'auto');
  assert.equal(restored.status, 'valid');
  assert.deepEqual(restored.snapshot.completed, CHAPTER_ORDER.slice(0, 7));
  assert.ok(canStartChapter(restored.snapshot, 'answering'));
  assert.equal(canStartChapter(sessionAt(6, 'failure'), 'answering'), false);
  const next = startChapter(restored.snapshot, 'answering');
  assert.equal(next.state.nodeId, 'dispatch');
  assert.deepEqual(next.state.evidence, []);
  assert.deepEqual(next.archive, old.archive);
  assert.equal(storage.getItem(CAMPAIGN_KEYS.auto), raw);
  assert.deepEqual(storage.writes, []);
});

test('a v1.3 Answering completion unlocks Visitors without rewriting the old save', () => {
  const old = completeChapter(sessionAt(7, 'complete'));
  const raw = JSON.stringify(payload(old));
  const storage = new MemoryStorage({ [CAMPAIGN_KEYS.auto]: raw });
  const restored = loadCampaign(storage, 'auto');
  assert.equal(restored.status, 'valid');
  assert.deepEqual(restored.snapshot.completed, CHAPTER_ORDER.slice(0, 8));
  assert.ok(canStartChapter(restored.snapshot, 'visitors'));
  assert.equal(canStartChapter(sessionAt(7, 'failure'), 'visitors'), false);
  const next = startChapter(restored.snapshot, 'visitors');
  assert.equal(next.state.nodeId, 'dispatch');
  assert.deepEqual(next.state.evidence, []);
  assert.deepEqual(next.archive, old.archive);
  assert.equal(storage.getItem(CAMPAIGN_KEYS.auto), raw);
  assert.deepEqual(storage.writes, []);
});

test('a v1.4 Visitors completion unlocks Tickets without rewriting any old slot', () => {
  const old = completeChapter(sessionAt(8, 'complete'));
  const raw = JSON.stringify(payload(old));
  const storage = new MemoryStorage({ [CAMPAIGN_KEYS.auto]: raw, [CAMPAIGN_KEYS[1]]: raw });
  const restored = loadCampaign(storage, 'auto');
  assert.equal(restored.status, 'valid');
  assert.deepEqual(restored.snapshot.completed, CHAPTER_ORDER.slice(0, 9));
  assert.ok(canStartChapter(restored.snapshot, 'tickets'));
  assert.equal(canStartChapter(sessionAt(8, 'failure'), 'tickets'), false);
  const next = startChapter(restored.snapshot, 'tickets');
  assert.equal(next.state.nodeId, 'dispatch');
  assert.deepEqual(next.state.evidence, []);
  assert.deepEqual(next.archive, old.archive);
  assert.equal(storage.getItem(CAMPAIGN_KEYS.auto), raw);
  assert.deepEqual(storage.writes, []);
});

test('unknown chapters, corrupt state and malformed campaign payloads are rejected', () => {
  const valid = payload();
  for (const value of [null, [], 3, {}, Object.create(valid),
    payload(undefined, { version: 1 }), payload(undefined, { version: 3 }),
    payload(undefined, { chapterId: '__proto__' }), payload(undefined, { nodeId: 'constructor' }),
    payload(undefined, { evidence: ['unknown'] }), payload(undefined, { history: [] }),
    payload(undefined, { savedAt: 'bad time' }), payload(undefined, { completed: null }), payload(undefined, { archive: [] })]) {
    assert.equal(validateCampaignPayload(value).status, 'invalid');
  }
});

test('completion order, current unlock and archive evidence cannot be forged', () => {
  const first = CHAPTER_ORDER[0];
  const second = CHAPTER_ORDER[1];
  const core = [...getChapter(first).requiredEvidence];
  const valid = sessionAt(1);
  const sparseEvidence = [...core];
  sparseEvidence.length += 1;
  const cases = [
    payload(undefined, { completed: [second], archive: { [second]: [...getChapter(second).requiredEvidence] } }),
    payload(undefined, { completed: [first, first], archive: { [first]: core } }),
    payload(valid, { archive: {} }),
    payload(valid, { archive: { [first]: core.slice(1) } }),
    payload(valid, { archive: { [first]: [...core, core[0]] } }),
    payload(valid, { archive: { [first]: [...core, 'unknown'] } }),
    payload(valid, { archive: { [first]: sparseEvidence } }),
    payload(valid, { archive: JSON.parse('{"__proto__":[]}') }),
    payload(undefined, { archive: { [first]: core } }),
    payload(sessionAt(0, 'complete')),
    payload(sessionAt(2), { completed: [first], archive: { [first]: core } })
  ];
  for (const value of cases) assert.equal(validateCampaignPayload(value).status, 'invalid');
});

test('standard completion unlocks exactly one next chapter; failure and intermediate nodes do not', () => {
  const normal = sessionAt(0, 'complete');
  const completed = completeChapter(normal);
  assert.deepEqual(normal.completed, []);
  assert.deepEqual(normal.archive, {});
  assert.deepEqual(completed.completed, [CHAPTER_ORDER[0]]);
  assert.deepEqual(completed.archive[CHAPTER_ORDER[0]], getChapter(CHAPTER_ORDER[0]).requiredEvidence);
  assert.equal(canStartChapter(completed, CHAPTER_ORDER[1]), true);
  assert.equal(canStartChapter(completed, CHAPTER_ORDER[2]), false);
  const failure = sessionAt(0, 'failure');
  assert.equal(completeChapter(failure), failure);
  const intermediate = createCampaignSession();
  assert.equal(completeChapter(intermediate), intermediate);
  const skipped = sessionAt(2, 'complete');
  skipped.completed = [];
  skipped.archive = {};
  assert.equal(completeChapter(skipped), skipped);
});

test('replaying a completed chapter preserves its prefix and optional archived discoveries', () => {
  const normal = sessionAt(0, 'complete');
  const chapter = getChapter(normal.state.chapterId);
  const optional = Object.keys(chapter.evidence).find((id) => !chapter.requiredEvidence.includes(id));
  assert.ok(optional, 'the prologue has optional evidence');
  normal.state.evidence.push(optional);
  const firstClear = completeChapter(normal);
  const replay = startChapter(firstClear, CHAPTER_ORDER[0]);
  assert.ok(replay);
  assert.deepEqual(replay.state.evidence, []);
  replay.state = sessionAt(0, 'complete').state;
  replay.history = [replay.state.nodeId];
  const secondClear = completeChapter(replay);
  assert.deepEqual(secondClear.completed, [CHAPTER_ORDER[0]]);
  assert.equal(secondClear.archive[CHAPTER_ORDER[0]].includes(optional), true);
  assert.equal(secondClear.archive[CHAPTER_ORDER[0]].filter((id) => id === optional).length, 1);
});

test('chapter selection resets local history and evidence but copies proven campaign progress', () => {
  const cleared = completeChapter(sessionAt(0, 'complete'));
  const next = startChapter(cleared, CHAPTER_ORDER[1]);
  assert.ok(next);
  assert.equal(next.state.chapterId, CHAPTER_ORDER[1]);
  assert.deepEqual(next.history, [next.state.nodeId]);
  assert.deepEqual(next.state.evidence, []);
  next.archive[CHAPTER_ORDER[0]].push('mutation');
  assert.equal(cleared.archive[CHAPTER_ORDER[0]].includes('mutation'), false);
  assert.equal(startChapter(cleared, CHAPTER_ORDER[2]), null);
  assert.equal(canStartChapter(cleared, '__proto__'), false);
});

test('autosave and all three manual slots replace only their selected record', () => {
  const storage = new MemoryStorage({ [SAVE_KEYS.manual]: 'old manual', [SAVE_KEYS.legacy]: 'legacy', [SAVE_KEYS.auto]: 'old auto' });
  const initial = createCampaignSession();
  for (const slot of ['auto', 1, 2, 3]) {
    assert.equal(saveCampaign(storage, slot, initial, new Date(SAVED_AT)).status, 'saved');
  }
  const before = Object.fromEntries(storage.records);
  const completed = completeChapter(sessionAt(0, 'complete'));
  const saved = saveCampaign(storage, 2, completed, new Date(SAVED_AT));
  assert.equal(saved.status, 'saved');
  for (const [key, raw] of Object.entries(before)) {
    if (key !== CAMPAIGN_KEYS[2]) assert.equal(storage.getItem(key), raw);
  }
  assert.equal(JSON.parse(storage.getItem(CAMPAIGN_KEYS[2])).version, 2);
  assert.equal(loadCampaign(storage, 2).source, 'v100');
  completed.state.evidence.push('mutation');
  completed.archive[CHAPTER_ORDER[0]].push('mutation');
  assert.equal(saved.snapshot.state.evidence.includes('mutation'), false);
  assert.equal(saved.snapshot.archive[CHAPTER_ORDER[0]].includes('mutation'), false);
});

test('reads preserve corrupt v100 data and do not silently load older unrelated progress', () => {
  const old = oldPayload(sessionAt(0, 'complete'));
  const storage = new MemoryStorage({ [SAVE_KEYS.manual]: JSON.stringify(old), [SAVE_KEYS.auto]: JSON.stringify(old) });
  assert.equal(loadCampaign(storage, 2).status, 'empty');
  assert.equal(loadCampaign(storage, 3).status, 'empty');
  for (const slot of ['auto', 1]) {
    for (const raw of ['', '{bad', 'null', JSON.stringify(payload(undefined, { version: 99 }))]) {
      storage.records.set(CAMPAIGN_KEYS[slot], raw);
      assert.equal(loadCampaign(storage, slot).status, 'invalid');
      assert.equal(storage.getItem(CAMPAIGN_KEYS[slot]), raw);
    }
  }
  assert.deepEqual(storage.writes, []);
  assert.deepEqual(storage.removals, []);
});

test('v011 and legacy prologue completions migrate with proof entirely in memory', () => {
  const end = sessionAt(0, 'complete');
  const storage = new MemoryStorage({ [SAVE_KEYS.auto]: JSON.stringify(oldPayload(end)), [SAVE_KEYS.manual]: JSON.stringify(oldPayload(end)) });
  const before = [...storage.records];
  for (const slot of ['auto', 1]) {
    const migrated = loadCampaign(storage, slot);
    assert.equal(migrated.status, 'valid');
    assert.equal(migrated.source, 'v011');
    assert.deepEqual(migrated.snapshot.completed, [CHAPTER_ORDER[0]]);
    assert.deepEqual(migrated.snapshot.archive[CHAPTER_ORDER[0]], end.state.evidence);
    assert.equal(migrated.snapshot.savedAt, SAVED_AT);
  }
  assert.deepEqual([...storage.records], before);
  storage.records.delete(SAVE_KEYS.manual);
  storage.records.set(SAVE_KEYS.legacy, JSON.stringify({ node: 'end', evidence: [...getChapter(CHAPTER_ORDER[0]).requiredEvidence] }));
  const legacy = loadCampaign(storage, 1);
  assert.equal(legacy.status, 'valid');
  assert.equal(legacy.source, 'legacy');
  assert.deepEqual(legacy.snapshot.completed, [CHAPTER_ORDER[0]]);
  assert.deepEqual(legacy.snapshot.history, ['end']);
  assert.equal(storage.getItem(CAMPAIGN_KEYS[1]), null);
  assert.deepEqual(storage.writes, []);
  assert.deepEqual(storage.removals, []);
});

test('old failures and unfinished investigations grant no completion; later-chapter old saves cannot skip the prefix', () => {
  for (const session of [createCampaignSession(), sessionAt(0, 'failure')]) {
    const storage = new MemoryStorage({ [SAVE_KEYS.auto]: JSON.stringify(oldPayload(session)) });
    const loaded = loadCampaign(storage, 'auto');
    assert.equal(loaded.status, 'valid');
    assert.deepEqual(loaded.snapshot.completed, []);
    assert.deepEqual(loaded.snapshot.archive, {});
  }
  const storage = new MemoryStorage({ [SAVE_KEYS.auto]: JSON.stringify(oldPayload(sessionAt(1))) });
  assert.equal(loadCampaign(storage, 'auto').status, 'invalid');
});

test('storage failures and invalid writes are recoverable and preserve existing slots', () => {
  const storage = new MemoryStorage({ [CAMPAIGN_KEYS[1]]: 'keep manual' });
  const invalid = sessionAt(2);
  invalid.completed = [];
  invalid.archive = {};
  assert.equal(saveCampaign(storage, 1, invalid).status, 'invalid');
  assert.equal(saveCampaign(storage, 1, createCampaignSession(), new Date('invalid')).status, 'invalid');
  for (const slot of ['constructor', '__proto__', 0, 4, '1']) {
    assert.equal(saveCampaign(storage, slot, createCampaignSession()).status, 'invalid');
    assert.equal(loadCampaign(storage, slot).status, 'invalid');
  }
  assert.equal(storage.getItem(CAMPAIGN_KEYS[1]), 'keep manual');
  assert.deepEqual(storage.writes, []);
  const denied = {
    getItem() { throw new Error('SecurityError'); },
    setItem() { throw new Error('QuotaExceededError'); },
    removeItem() { throw new Error('SecurityError'); }
  };
  for (const unavailable of [null, undefined, denied]) {
    assert.equal(loadCampaign(unavailable, 'auto').status, 'unavailable');
    assert.equal(saveCampaign(unavailable, 1, createCampaignSession()).status, 'unavailable');
  }
  storage.setItem = () => { throw new Error('QuotaExceededError'); };
  assert.equal(saveCampaign(storage, 1, createCampaignSession()).status, 'unavailable');
  assert.equal(storage.getItem(CAMPAIGN_KEYS[1]), 'keep manual');
});
