const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, writeFileSync, readFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { createHash } = require('node:crypto');
const modulePromise = import('../scripts/publish-release.mjs');
const identity = { repository: 'AureliusWu/Circuit', revision: 'a'.repeat(40), version: '1.8.0' };
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

function fixture() {
  const directory = mkdtempSync(join(tmpdir(), 'circuit-release-'));
  for (const name of ['Circuit_1.8.0_x64-setup.exe', 'circuit-web-1.8.0.zip']) {
    const bytes = Buffer.from([0, 255, 13, 10, 42]);
    writeFileSync(join(directory, name), bytes);
    writeFileSync(join(directory, `${name}.sha256`), `${hash(bytes)}  ${name}\n`);
  }
  const checks = ['installed', 'saved', 'reopened'];
  writeFileSync(join(directory, 'windows-runtime.json'), JSON.stringify({ status: 'passed', version: identity.version, commit: identity.revision, checks }));
  writeFileSync(join(directory, 'release.json'), JSON.stringify({ version: identity.version, commit: identity.revision, nativeChecks: checks }));
  return directory;
}

function transport(files, overrides = {}) {
  const calls = [];
  let publicRelease = false, mainReads = 0, draftReads = 0;
  const draft = { id: 321, tag_name: 'v1.8.0', target_commitish: identity.revision, draft: true, prerelease: false,
    assets: files.map((file, index) => ({ id: index + 1, name: file.name, state: 'uploaded', size: file.size, digest: `sha256:${file.digest}`, updated_at: '2026-10-23T00:00:00Z' })) };
  const api = {
    api: endpoint => {
      calls.push(endpoint);
      if (endpoint.endsWith('heads/main')) {
        mainReads += 1;
        return { object: { type: 'commit', sha: overrides.superseded && mainReads > 1 ? 'b'.repeat(40) : identity.revision } };
      }
      if (endpoint.includes('/releases/tags/')) return overrides.existing ?? null;
      if (endpoint.includes('/git/ref/tags/')) return overrides.existingTag ?? null;
      assert.equal(endpoint, 'repos/AureliusWu/Circuit/releases/321');
      draftReads += 1;
      const copy = structuredClone(draft);
      overrides.changeDraft?.(copy, draftReads);
      return copy;
    },
    createDraft: () => { calls.push('create-draft'); return { id: draft.id, draft: true }; },
    upload: () => { calls.push('upload'); if (overrides.uploadError) throw Error('Upload failed'); },
    download: id => {
      calls.push(`download:${id}`);
      if (overrides.downloadError) throw Error('Download failed');
      return overrides.corrupt ? Buffer.from('corrupt') : files[id - 1].bytes;
    },
    publish: () => {
      calls.push('publish');
      publicRelease = true;
      return { ...draft, draft: false };
    },
  };
  return { api, calls, public: () => publicRelease };
}

test('every original draft byte, checksum sidecar and manifest is verified before making a stable release public', async () => {
  const { prepareAssets, publishRelease } = await modulePromise;
  const directory = fixture();
  try {
    const files = prepareAssets(directory, identity);
    assert.equal(files.length, 7);
    const manifest = readFileSync(join(directory, 'SHA256SUMS.txt'), 'utf8').trim().split('\n');
    assert.equal(manifest.length, 6);
    for (const file of files.filter(file => file.name !== 'SHA256SUMS.txt')) assert.ok(manifest.includes(`${file.digest}  ${file.name}`));
    const remote = transport(files);
    assert.equal(publishRelease(identity, files, remote.api, {}), 'published-new');
    assert.equal(remote.public(), true);
    assert.ok(remote.calls.indexOf('create-draft') < remote.calls.indexOf('upload'));
    assert.equal(remote.calls.filter(call => call.startsWith('download:')).length, files.length);
    assert.equal(remote.calls.at(-1), 'publish');
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('partial uploads, download errors, corrupt bytes and a superseding build leave the release private', async () => {
  const { prepareAssets, publishRelease } = await modulePromise;
  const directory = fixture();
  try {
    const files = prepareAssets(directory, identity);
    for (const fault of [{ uploadError: true }, { downloadError: true }, { corrupt: true }, { superseded: true }]) {
      const remote = transport(files, fault);
      assert.throws(() => publishRelease(identity, files, remote.api, {}), /failed|mismatch|superseded/);
      assert.equal(remote.public(), false);
      assert.ok(!remote.calls.includes('publish'));
    }
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('missing, extra, renamed, duplicate, unuploaded and changed draft assets block publication', async () => {
  const { prepareAssets, publishRelease } = await modulePromise;
  const directory = fixture();
  try {
    const files = prepareAssets(directory, identity);
    const changes = [
      draft => draft.assets.pop(),
      draft => draft.assets.push({ ...draft.assets[0], id: 99, name: 'unexpected.exe' }),
      draft => { draft.assets[0].name = 'renamed.exe'; },
      draft => { draft.assets[0].id = draft.assets[1].id; },
      draft => { draft.assets[0].state = 'new'; },
      draft => { draft.assets[0].size += 1; },
      draft => { draft.assets[0].digest = `sha256:${'0'.repeat(64)}`; },
      (draft, read) => { if (read > 1) draft.assets[0].updated_at = 'changed'; },
      (draft, read) => { if (read > 1) draft.assets[0].id = 100; },
      draft => { draft.target_commitish = 'main'; },
      draft => { draft.draft = false; },
      draft => { draft.prerelease = true; },
    ];
    for (const changeDraft of changes) {
      const remote = transport(files, { changeDraft });
      assert.throws(() => publishRelease(identity, files, remote.api, {}), /mismatch|changed/);
      assert.equal(remote.public(), false);
    }
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('existing public releases are immutable and preexisting drafts or tags require explicit recovery', async () => {
  const { prepareAssets, publishRelease } = await modulePromise;
  const directory = fixture();
  try {
    const files = prepareAssets(directory, identity);
    const release = { tag_name: 'v1.8.0', draft: false };
    const tag = { object: { type: 'commit', sha: 'c'.repeat(40) } };
    const remote = transport(files, { existing: release, existingTag: tag });
    assert.equal(publishRelease(identity, files, remote.api, {}), 'published');
    assert.ok(!remote.calls.includes('create-draft'));
    assert.deepEqual(release, { tag_name: 'v1.8.0', draft: false });
    for (const fault of [{ existing: { ...release, draft: true } }, { existingTag: tag }]) {
      const blocked = transport(files, fault);
      assert.throws(() => publishRelease(identity, files, blocked.api, {}), /preserve/);
      assert.ok(!blocked.calls.includes('create-draft'));
    }
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('local asset identity and independent original checksums must match before any upload', async () => {
  const { prepareAssets } = await modulePromise;
  for (const breakFixture of [
    directory => writeFileSync(join(directory, 'Circuit_1.8.0_x64-setup.exe'), 'changed'),
    directory => writeFileSync(join(directory, 'windows-runtime.json'), JSON.stringify({ status: 'failed', ...identity })),
    directory => writeFileSync(join(directory, 'release.json'), JSON.stringify({ version: '1.7.0', commit: identity.revision })),
    directory => writeFileSync(join(directory, 'unexpected.json'), '{}'),
    directory => rmSync(join(directory, 'circuit-web-1.8.0.zip')),
  ]) {
    const directory = fixture();
    try {
      breakFixture(directory);
      assert.throws(() => prepareAssets(directory, identity), /checksum|evidence|assets/);
    } finally { rmSync(directory, { recursive: true, force: true }); }
  }
});

test('GitHub transport creates drafts explicitly, never clobbers uploads, and downloads binary bytes', async () => {
  const { githubTransport } = await modulePromise;
  const calls = [];
  const raw = Buffer.from([0, 255, 10]);
  const remote = githubTransport(identity, (command, args, options) => {
    calls.push({ command, args, options });
    return { status: 0, stdout: args.includes('Accept: application/octet-stream') ? raw : Buffer.from('{}') };
  });
  remote.createDraft(identity, { title: 'Circuit', body: 'Release notes\nwith lines' });
  const body = JSON.parse(calls.at(-1).options.input);
  assert.equal(body.draft, true);
  assert.equal(body.prerelease, false);
  assert.equal(body.target_commitish, identity.revision);
  remote.upload('v1.8.0', [{ path: '/tmp/original.exe' }]);
  assert.ok(!calls.at(-1).args.includes('--clobber'));
  assert.deepEqual(remote.download(1), raw);
  assert.equal(calls.at(-1).options.encoding, undefined);
  remote.publish(321);
  assert.deepEqual(JSON.parse(calls.at(-1).options.input), { draft: false, prerelease: false, make_latest: 'true' });
});
