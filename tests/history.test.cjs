const assert = require('node:assert/strict');
const path = require('node:path');
const { test } = require('node:test');
const { filterHistory, historySpeakers } = require(path.join(process.env.CIRCUIT_TEST_BUILD, 'game/history.js'));

test('read-record search normalizes D3 and intersects speaker, text and location without changing identities', () => {
  const rows = [Object.freeze({ text: '钥匙响了。' }), Object.freeze({ speaker: '季宁', text: '三号接收口 Ｄ３', context: '旧通信间', clip: 'original-voice' })];
  assert.equal(filterHistory(rows, ' d3\n旧通信间 ', '季宁')[0], rows[1]);
  assert.deepEqual(filterHistory(rows, 'D3', '旁白'), []);
  assert.deepEqual(historySpeakers(rows), ['旁白', '季宁']);
  assert.deepEqual(filterHistory([rows[0]], '三号'), []);
  assert.deepEqual(filterHistory([rows[1], rows[1]], 'd3'), [rows[1], rows[1]]);
});
