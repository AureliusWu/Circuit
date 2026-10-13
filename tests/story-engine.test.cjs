const assert = require('node:assert/strict');
const path = require('node:path');
const { test } = require('node:test');

if (!process.env.CIRCUIT_TEST_BUILD) throw new Error('Run the project test script to compile the story engine first.');

const {
  CHAPTERS,
  CHAPTER_ORDER,
  PROLOGUE,
  createInitialState,
  getChapter,
  getUnlockedChapters,
  getAvailableActions,
  isGameState,
  transition,
  validateChapter
} = require(path.join(process.env.CIRCUIT_TEST_BUILD, 'story/engine.js'));

const chapter = getChapter(PROLOGUE);
const allEvidence = ['live-after-cut', 'house-13', 'paper-ash'];

function move(state, actionId) {
  const before = JSON.stringify(state);
  const next = transition(state, actionId);
  assert.ok(next, `Expected action ${actionId} at ${state.nodeId} to succeed`);
  assert.equal(JSON.stringify(state), before, 'Transitions preserve their input');
  assert.ok(isGameState(next));
  return next;
}

function enterInvestigation() {
  return advanceTo(createInitialState(), 'meterbox');
}

function advanceTo(state, nodeId) {
  for (let steps = 0; state.nodeId !== nodeId && steps < 200; steps += 1) {
    const actions = getAvailableActions(state);
    assert.equal(actions.length, 1, `Expected a linear route from ${state.nodeId} to ${nodeId}`);
    state = move(state, actions[0].id);
  }
  assert.equal(state.nodeId, nodeId);
  return state;
}

function permutations(items) {
  if (!items.length) return [[]];
  return items.flatMap((item, index) => permutations(items.filter((_, other) => index !== other)).map((rest) => [item, ...rest]));
}

test('registered chapter has valid references and scene hotspots share investigation actions', () => {
  for (const registeredChapter of Object.values(CHAPTERS)) assert.deepEqual(validateChapter(registeredChapter), []);
  assert.equal(CHAPTERS[PROLOGUE], chapter);
  assert.deepEqual(createInitialState(), { chapterId: PROLOGUE, nodeId: 'dispatch', evidence: [] });
  assert.equal(chapter.nodes.meterbox.kind, 'investigation');
  assert.equal(chapter.nodes.deduction.kind, 'choice');
  const actions = getAvailableActions(enterInvestigation());
  assert.equal(chapter.nodes.meterbox.scene.hotspots.length, 5);
  for (const hotspot of chapter.nodes.meterbox.scene.hotspots) {
    assert.equal(actions.find((action) => action.id === hotspot.actionId).label, hotspot.label);
  }
});

test('chapter unlocks follow completed sequence and reject out-of-order shortcut', () => {
  assert.equal(CHAPTER_ORDER.length, 8);
  assert.equal(new Set(CHAPTER_ORDER).size, 8);
  assert.deepEqual(getUnlockedChapters([]), [PROLOGUE]);
  assert.deepEqual(getUnlockedChapters(['closure']), [PROLOGUE]);
  assert.deepEqual(getUnlockedChapters([PROLOGUE, PROLOGUE]), CHAPTER_ORDER.slice(0, 2));
  for (let count = 0; count <= CHAPTER_ORDER.length; count += 1) {
    assert.deepEqual(getUnlockedChapters(CHAPTER_ORDER.slice(0, count)), CHAPTER_ORDER.slice(0, Math.min(count + 1, CHAPTER_ORDER.length)));
  }
  assert.deepEqual(Object.keys(CHAPTERS), [...CHAPTER_ORDER]);
  for (const [order, chapterId] of CHAPTER_ORDER.entries()) assert.equal(CHAPTERS[chapterId].order, order);
});

test('every playable registered node is reachable and reachable states always offer a valid action', () => {
  for (const registeredChapter of Object.values(CHAPTERS)) {
    const pending = [createInitialState(registeredChapter.id)];
    const visitedStates = new Set();
    const visitedNodes = new Set();
    while (pending.length) {
      const state = pending.pop();
      const key = JSON.stringify([state.nodeId, [...state.evidence].sort()]);
      if (visitedStates.has(key)) continue;
      visitedStates.add(key);
      visitedNodes.add(state.nodeId);
      const actions = getAvailableActions(state);
      assert.ok(actions.length, `${registeredChapter.id}/${state.nodeId} must not strand the player`);
      for (const action of actions) pending.push(move(state, action.id));
    }
    const expectedNodes = Object.entries(registeredChapter.nodes)
      .filter(([, node]) => node.kind !== 'title')
      .map(([id]) => id);
    assert.deepEqual([...visitedNodes].sort(), expectedNodes.sort());
  }
});

for (const order of permutations(['current', 'ledger', 'ash'])) {
  test(`all evidence is required regardless of investigation order: ${order.join(', ')}`, () => {
    let state = enterInvestigation();
    for (const actionId of order) {
      assert.equal(transition(state, 'find-lamp'), null);
      const evidenceBefore = [...state.evidence];
      state = move(state, actionId);
      assert.equal(chapter.nodes[state.nodeId].kind, 'evidence');
      assert.deepEqual(state.evidence, evidenceBefore, 'Observation waits for explicit recording');
      assert.equal(chapter.nodes[state.nodeId].progress, chapter.nodes.meterbox.progress, 'Inspection does not reset chapter progress');
      state = move(state, `record-${actionId}`);
      assert.equal(state.evidence.length, evidenceBefore.length + 1);
      state = advanceTo(state, 'meterbox');
      assert.ok(!getAvailableActions(state).some((action) => action.id === actionId));
      assert.equal(transition(state, actionId), null, 'Collected investigation cannot be repeated');
    }
    assert.deepEqual(new Set(state.evidence), new Set(allEvidence));
    assert.deepEqual(getAvailableActions(state).map((action) => action.id), ['resident', 'archive', 'find-lamp']);
    state = move(state, 'find-lamp');
    state = advanceTo(state, 'deduction');
    state = move(state, 'cut-line');
    assert.equal(state.nodeId, 'wrong');
    state = advanceTo(state, 'wrongWarning');
    assert.equal(chapter.nodes[state.nodeId].outcome, 'failure');
    state = move(state, 'retry-deduction');
    assert.deepEqual(new Set(state.evidence), new Set(allEvidence));
    state = move(state, 'trace-source');
    assert.equal(chapter.nodes[state.nodeId].kind, 'puzzle');
    state = move(state, 'trial-close');
    state = advanceTo(state, 'bypassFailure');
    assert.equal(chapter.nodes[state.nodeId].outcome, 'failure');
    state = move(state, 'retry-isolation');
    state = move(state, 'keep-isolated');
    state = advanceTo(state, 'end');
    assert.equal(state.nodeId, 'end');
    assert.equal(chapter.nodes[state.nodeId].progress, 100);
    state = move(state, 'restart');
    assert.deepEqual(state, createInitialState());
  });
}

test('unrecognized, duplicate and unreachable state is rejected without enabling actions', () => {
  const sparseEvidence = Array(1);
  const validFields = { chapterId: PROLOGUE, nodeId: 'meterbox', evidence: [] };
  const invalidStates = [
    null,
    {},
    Object.create(validFields),
    Object.assign([], validFields),
    Object.assign(new Date(), validFields),
    Object.assign(new (class State {})(), validFields),
    { chapterId: 'constructor', nodeId: 'dispatch', evidence: [] },
    { chapterId: PROLOGUE, nodeId: 'toString', evidence: [] },
    { chapterId: PROLOGUE, nodeId: 'meterbox', evidence: ['unknown'] },
    { chapterId: PROLOGUE, nodeId: 'meterbox', evidence: ['live-after-cut', 'live-after-cut', 'live-after-cut'] },
    { chapterId: PROLOGUE, nodeId: 'meterbox', evidence: sparseEvidence },
    { chapterId: PROLOGUE, nodeId: 'dispatch', evidence: ['paper-ash'] },
    { chapterId: PROLOGUE, nodeId: 'inspectCurrent', evidence: ['live-after-cut'] },
    { chapterId: PROLOGUE, nodeId: 'inspectLedger', evidence: ['house-13'] },
    { chapterId: PROLOGUE, nodeId: 'inspectAsh', evidence: ['paper-ash'] },
    ...['lamp', 'deduction', 'wrong', 'truth', 'end'].map((nodeId) => ({ chapterId: PROLOGUE, nodeId, evidence: ['paper-ash'] }))
  ];
  for (const state of invalidStates) {
    assert.equal(isGameState(state), false);
    assert.deepEqual(getAvailableActions(state), []);
    assert.equal(transition(state, 'continue'), null);
  }
  for (const id of ['__proto__', 'constructor', 'toString', 'missing', null]) assert.equal(getChapter(id), null);
  assert.equal(transition(enterInvestigation(), 'truth'), null, 'Node IDs are not executable actions');
});

test('optional resident and archive routes collect distinct records without changing the core gate', () => {
  let state = enterInvestigation();
  state = move(state, 'resident');
  state = advanceTo(state, 'residentRecord');
  state = move(state, 'record-address');
  assert.deepEqual(state.evidence, ['lost-address']);
  assert.equal(transition(state, 'resident'), null);
  state = move(state, 'archive');
  state = advanceTo(state, 'ticketRecord');
  state = move(state, 'record-ticket');
  assert.deepEqual(state.evidence, ['lost-address', 'bypass-ticket']);
  assert.equal(transition(state, 'find-lamp'), null);
  for (const actionId of ['current', 'ledger', 'ash']) {
    state = move(state, actionId);
    state = move(state, `record-${actionId}`);
    state = advanceTo(state, 'meterbox');
  }
  assert.deepEqual(getAvailableActions(state).map((action) => action.id), ['find-lamp']);
  assert.equal(state.evidence.length, 5);
});

test('v0.1.1 chapter-local saves retain original node and three-core-evidence compatibility', () => {
  for (const nodeId of ['title', 'dispatch', 'call', 'alley', 'meterbox']) {
    assert.ok(isGameState({ chapterId: PROLOGUE, nodeId, evidence: [] }));
  }
  for (const nodeId of ['lamp', 'deduction', 'wrong', 'truth', 'end']) {
    assert.ok(isGameState({ chapterId: PROLOGUE, nodeId, evidence: allEvidence }));
  }
  assert.ok(isGameState({ chapterId: PROLOGUE, nodeId: 'inspectCurrent', evidence: ['house-13', 'paper-ash'] }));
  assert.equal(chapter.nodes.end.outcome, 'complete');
  assert.deepEqual(chapter.requiredEvidence, allEvidence);
});

test('graph validation detects impossible inventories and orphan content', () => {
  const broken = JSON.parse(JSON.stringify(chapter));
  delete broken.nodes.inspectCurrent.actions[0].collect;
  broken.nodes.orphan = JSON.parse(JSON.stringify(broken.nodes.end));
  const errors = validateChapter(broken);
  assert.ok(errors.some((error) => error.includes('violates target inventory')));
  assert.ok(errors.some((error) => error.includes('orphan: node cannot be reached')));
  assert.ok(errors.some((error) => error.includes('no reachable standard ending')));
});

test('chapter validation diagnoses broken graph references and ambiguous hotspots', () => {
  const broken = JSON.parse(JSON.stringify(chapter));
  broken.entryNode = 'missing';
  broken.nodes.meterbox.actions.push({ id: 'current', label: 'broken', next: 'missing', collect: 'unknown' });
  broken.nodes.meterbox.scene.hotspots.push({ id: 'current', actionId: 'missing', label: '', x: -1, y: 101 });
  broken.nodes.lamp.progress = 101;
  broken.nodes.lamp.excludesEvidence = ['paper-ash'];
  const errors = validateChapter(broken);
  assert.ok(errors.some((error) => error.includes('entry node')));
  assert.ok(errors.some((error) => error.includes('duplicate or empty action')));
  assert.ok(errors.some((error) => error.includes('target node')));
  assert.ok(errors.some((error) => error.includes('unknown evidence')));
  assert.ok(errors.some((error) => error.includes('duplicate or empty hotspot')));
  assert.ok(errors.some((error) => error.includes('hotspot action')));
  assert.ok(errors.some((error) => error.includes('accessible label')));
  assert.ok(errors.some((error) => error.includes('coordinates')));
  assert.ok(errors.some((error) => error.includes('progress')));
  assert.ok(errors.some((error) => error.includes('both required and excluded')));
});
