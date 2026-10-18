const assert = require('node:assert/strict');
const { existsSync, readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

if (!process.env.CIRCUIT_TEST_BUILD) throw new Error('Run npm test to compile the release content first.');
const engine = require(path.join(process.env.CIRCUIT_TEST_BUILD, 'story/engine.js'));
const campaign = require(path.join(process.env.CIRCUIT_TEST_BUILD, 'game/campaign.js'));
const characterCatalog = require(path.join(process.env.CIRCUIT_TEST_BUILD, 'game/characters.js'));
const ORDER = ['thirteen-households', 'seventh-night', 'backfeed', 'everlight', 'neutral', 'closure', 'return-visit', 'answering', 'visitors', 'tickets'];
const graphs = new Map();

function explore(chapterId) {
  if (graphs.has(chapterId)) return graphs.get(chapterId);
  const initial = engine.createInitialState(chapterId);
  const queue = [{ state: initial, route: [] }];
  const seen = new Set();
  const nodes = new Set();
  const outcomes = new Map();
  for (let head = 0; head < queue.length; head++) {
    const { state, route } = queue[head];
    const key = JSON.stringify([state.nodeId, [...state.evidence].sort()]);
    if (seen.has(key)) continue;
    seen.add(key);
    nodes.add(state.nodeId);
    const node = engine.getChapter(chapterId).nodes[state.nodeId];
    if (node.outcome && !outcomes.has(state.nodeId)) outcomes.set(state.nodeId, { state, route, outcome: node.outcome });
    const actions = engine.getAvailableActions(state);
    assert.ok(actions.length || node.outcome === 'complete', `${chapterId}/${state.nodeId}: reachable dead end`);
    for (const action of actions) {
      const before = JSON.stringify(state);
      const next = engine.transition(state, action.id);
      assert.ok(next, `${chapterId}/${state.nodeId}: declared action ${action.id} cannot execute`);
      assert.equal(JSON.stringify(state), before, 'Story transitions must not mutate input');
      queue.push({ state: next, route: [...route, action.id] });
    }
    assert.ok(seen.size < 50000, `${chapterId}: graph exploration exceeded expected finite state space`);
  }
  const graph = { nodes, outcomes, stateCount: seen.size };
  graphs.set(chapterId, graph);
  return graph;
}

test('release registers ten chapters in the authored campaign order', () => {
  assert.deepEqual(engine.CHAPTER_ORDER, ORDER);
  assert.deepEqual(Object.keys(engine.CHAPTERS).sort(), [...ORDER].sort());
  const codes = ORDER.map((id) => engine.getChapter(id).clue.code);
  assert.equal(new Set(codes).size, ORDER.length, 'Every chapter leaves its own map clue');
});

for (const [index, chapterId] of ORDER.entries()) {
  test(`${chapterId}: complete authored chapter, valid graph, reachable endings and local assets`, () => {
    const chapter = engine.getChapter(chapterId);
    assert.ok(chapter, `${chapterId} is not registered`);
    assert.equal(chapter.order, index);
    assert.deepEqual(engine.validateChapter(chapter), []);
    const playable = Object.entries(chapter.nodes).filter(([, node]) => node.kind !== 'title');
    assert.ok(playable.length >= 30, `${chapterId}: only ${playable.length} playable nodes; need >=30`);
    const characters = Array.from(playable.map(([, node]) => node.text).join('').replace(/\s/g, '')).length;
    assert.ok(characters >= 2500, `${chapterId}: only ${characters} narrative characters; need >=2500`);
    assert.ok(chapter.requiredEvidence.length >= 3, `${chapterId}: insufficient required investigation`);
    assert.equal(new Set(chapter.requiredEvidence).size, chapter.requiredEvidence.length);
    for (const evidenceId of chapter.requiredEvidence) assert.ok(Object.hasOwn(chapter.evidence, evidenceId));

    const graph = explore(chapterId);
    assert.deepEqual([...graph.nodes].sort(), playable.map(([id]) => id).sort(), 'Every playable node must be reachable with legal evidence');
    const failures = [...graph.outcomes.values()].filter((ending) => ending.outcome === 'failure');
    const completed = [...graph.outcomes.values()].filter((ending) => ending.outcome === 'complete');
    assert.ok(failures.length >= 2, `${chapterId}: need two distinct reachable failed deductions`);
    assert.ok(completed.length >= 1, `${chapterId}: no reachable standard completion`);
    for (const ending of completed) {
      assert.equal(chapter.nodes[ending.state.nodeId].progress, 100);
      assert.ok(chapter.requiredEvidence.every((id) => ending.state.evidence.includes(id)));
    }

    let backgroundCount = 0;
    for (const [nodeId, node] of playable) {
      assert.ok(node.text.trim(), `${chapterId}/${nodeId}: empty narrative`);
      if (node.scene?.background) backgroundCount++;
      for (const asset of [node.scene?.background, characterCatalog.getPortraitPath(node.portrait, node.expression)].filter(Boolean)) {
        assert.ok(asset.startsWith('/art/') && !asset.includes('..'), `Unsupported release asset path: ${asset}`);
        const file = path.resolve('public', asset.slice(1));
        assert.ok(existsSync(file), `${chapterId}/${nodeId}: missing asset ${asset}`);
        const contents = readFileSync(file);
        assert.ok(contents.length > 0, `${asset} is empty`);
        assert.equal(contents.toString('ascii', 0, 4), 'RIFF', `${asset} is not WebP`);
        assert.equal(contents.toString('ascii', 8, 12), 'WEBP', `${asset} is not WebP`);
      }
      if (node.kind === 'puzzle') {
        assert.ok(node.puzzle?.prompt && node.puzzle?.hint, `${chapterId}/${nodeId}: puzzle lacks player-facing guidance`);
        assert.ok(node.actions.length >= 2, `${chapterId}/${nodeId}: puzzle must permit a decision`);
      }
    }
    assert.ok(backgroundCount > 0, `${chapterId}: no authored backgrounds`);
  });
}

test('campaign can be completed through all ten legal chapter routes with persistent city clues', () => {
  let session = campaign.createCampaignSession();
  for (const [index, chapterId] of ORDER.entries()) {
    assert.ok(campaign.canStartChapter(session, chapterId));
    for (const locked of ORDER.slice(index + 1)) assert.equal(campaign.canStartChapter(session, locked), false);
    session = campaign.startChapter(session, chapterId);
    const ending = [...explore(chapterId).outcomes.values()].find((candidate) => candidate.outcome === 'complete');
    assert.ok(ending);
    for (const actionId of ending.route) {
      const next = engine.transition(session.state, actionId);
      assert.ok(next);
      session = campaign.completeChapter({ ...session, state: next, history: [...session.history, next.nodeId].slice(-200) });
    }
    assert.deepEqual(session.completed, ORDER.slice(0, index + 1));
    assert.ok(engine.getChapter(chapterId).requiredEvidence.every((id) => session.archive[chapterId].includes(id)));
    for (const unlocked of ORDER.slice(0, Math.min(index + 2, ORDER.length))) assert.ok(campaign.canStartChapter(session, unlocked));
    const values = new Map();
    const storage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
    assert.equal(campaign.saveCampaign(storage, 'auto', session).status, 'saved');
    const restored = campaign.loadCampaign(storage, 'auto');
    assert.equal(restored.status, 'valid');
    assert.deepEqual(restored.snapshot.completed, session.completed);
    assert.deepEqual(restored.snapshot.archive, session.archive);
    for (const failure of [...explore(chapterId).outcomes.values()].filter((ending) => ending.outcome === 'failure')) {
      const replay = campaign.startChapter(session, chapterId);
      let failed = replay;
      for (const actionId of failure.route) {
        const state = engine.transition(failed.state, actionId);
        assert.ok(state);
        failed = campaign.completeChapter({ ...failed, state, history: [...failed.history, state.nodeId] });
      }
      assert.deepEqual(failed.completed, session.completed, 'Failed replay must not remove proven progress');
      assert.deepEqual(failed.archive, session.archive, 'Failed replay must not invent additional city clues');
    }
  }
  assert.deepEqual(session.completed, ORDER);
  assert.equal(Object.keys(session.archive).length, 10);
});
