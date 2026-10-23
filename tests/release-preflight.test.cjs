const { test } = require('node:test');
const assert = require('node:assert/strict');

const modulePromise = import('../scripts/release-preflight.mjs');
const identity = { repository: 'AureliusWu/Circuit', revision: 'a'.repeat(40), version: '1.4.0' };
const main = { object: { type: 'commit', sha: identity.revision } };

test('a superseded successful build skips release probes and publication', async () => {
  const { publicationDecision } = await modulePromise;
  const calls = [];
  assert.equal(publicationDecision(identity, endpoint => {
    calls.push(endpoint);
    return { object: { type: 'commit', sha: 'b'.repeat(40) } };
  }), 'superseded');
  assert.deepEqual(calls, ['repos/AureliusWu/Circuit/git/ref/heads/main']);
});

test('an existing published version is an immutable successful no-op', async () => {
  const { publicationDecision } = await modulePromise;
  const original = { release: { tag_name: 'v1.4.0', draft: false, assets: [{ name: 'original.exe', digest: 'sha256:original' }] }, tag: { object: { type: 'commit', sha: 'c'.repeat(40) } } };
  const before = JSON.stringify(original);
  const calls = [];
  assert.equal(publicationDecision(identity, endpoint => {
    calls.push(endpoint);
    return endpoint.endsWith('heads/main') ? main : endpoint.includes('/releases/') ? original.release : original.tag;
  }), 'published');
  assert.equal(JSON.stringify(original), before);
  assert.equal(calls.length, 3);
});

test('only an absent release and absent tag allow a new publication', async () => {
  const { publicationDecision } = await modulePromise;
  const probes = [];
  assert.equal(publicationDecision(identity, (endpoint, allowMissing) => {
    if (endpoint.endsWith('heads/main')) return main;
    if (endpoint.includes('/releases?')) return [];
    probes.push(allowMissing); return null;
  }), 'publish');
  assert.deepEqual(probes, [true, true]);
});

test('a private draft on a later authenticated release page blocks duplicate creation even without a tag', async () => {
  const { publicationDecision } = await modulePromise;
  const pages = [];
  assert.throws(() => publicationDecision(identity, endpoint => {
    if (endpoint.endsWith('heads/main')) return main;
    if (endpoint.includes('/releases?')) {
      pages.push(endpoint);
      return pages.length === 1
        ? Array.from({ length: 100 }, (_, i) => ({ tag_name: `v0.0.${i}`, draft: false }))
        : [{ tag_name: 'v1.4.0', draft: true }];
    }
    return null;
  }), /authenticated release list; preserve/);
  assert.deepEqual(pages, ['repos/AureliusWu/Circuit/releases?per_page=100&page=1', 'repos/AureliusWu/Circuit/releases?per_page=100&page=2']);
});

test('malformed or failed authenticated release listing cannot authorize a new release', async () => {
  const { publicationDecision } = await modulePromise;
  for (const list of [null, {}, [null], [{ tag_name: 'v1.3.0' }]]) {
    assert.throws(() => publicationDecision(identity, endpoint => endpoint.endsWith('heads/main') ? main : endpoint.includes('/releases?') ? list : null), /Invalid authenticated release list/);
  }
  assert.throws(() => publicationDecision(identity, endpoint => {
    if (endpoint.endsWith('heads/main')) return main;
    if (endpoint.includes('/releases?')) throw Error('Forbidden (HTTP 403)');
    return null;
  }), /Forbidden/);
});

test('a draft, orphan tag or missing published tag requires explicit recovery', async () => {
  const { publicationDecision } = await modulePromise;
  for (const [release, tag] of [
    [{ tag_name: 'v1.4.0', draft: true }, { object: { sha: 'c'.repeat(40) } }],
    [null, { object: { sha: 'c'.repeat(40) } }],
    [{ tag_name: 'v1.4.0', draft: false }, null],
  ]) {
    assert.throws(() => publicationDecision(identity, endpoint => endpoint.endsWith('heads/main') ? main : endpoint.includes('/releases/') ? release : tag), /preserve it for explicit recovery/);
  }
});

test('authentication errors, rate limits, server errors and malformed responses never mean absent', async () => {
  const { githubApi } = await modulePromise;
  for (const status of [401, 403, 429, 500]) {
    assert.throws(() => githubApi('repos/owner/repo/releases/tags/v1.0.0', true, () => ({ status: 1, stderr: `request failed (HTTP ${status})` })), /GitHub read failed/);
  }
  assert.equal(githubApi('missing', true, () => ({ status: 1, stderr: 'Not Found (HTTP 404)' })), null);
  assert.throws(() => githubApi('main', false, () => ({ status: 1, stderr: 'Not Found (HTTP 404)' })), /GitHub read failed/);
  assert.throws(() => githubApi('bad-json', true, () => ({ status: 0, stdout: '<html>unavailable</html>' })), SyntaxError);
});

test('invalid identities or main refs fail before publication', async () => {
  const { publicationDecision } = await modulePromise;
  assert.throws(() => publicationDecision({ ...identity, revision: '' }, () => { throw Error('must not query'); }), /publication identity/);
  assert.throws(() => publicationDecision(identity, () => ({})), /Invalid main ref/);
});
