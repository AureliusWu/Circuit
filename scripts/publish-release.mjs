import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { githubApi, publicationDecision } from './release-preflight.mjs';

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const sameNames = (actual, expected) => JSON.stringify([...actual].sort()) === JSON.stringify([...expected].sort());

export function prepareAssets(directory, identity) {
  const exe = `Circuit_${identity.version}_x64-setup.exe`;
  const zip = `circuit-web-${identity.version}.zip`;
  const names = [exe, `${exe}.sha256`, zip, `${zip}.sha256`, 'release.json', 'windows-runtime.json'];
  const actual = readdirSync(directory).filter(name => name !== 'SHA256SUMS.txt');
  if (!sameNames(actual, names)) throw new Error('Missing or unexpected release assets');
  const files = names.sort().map(name => {
    const path = join(directory, name);
    const stat = lstatSync(path);
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`Invalid asset: ${name}`);
    const bytes = readFileSync(path);
    if (!bytes.length) throw new Error(`Empty asset: ${name}`);
    return { name, path, bytes, size: bytes.length, digest: sha256(bytes) };
  });
  for (const name of [exe, zip]) {
    const binary = files.find(file => file.name === name);
    const checksum = files.find(file => file.name === `${name}.sha256`);
    if (checksum.bytes.toString().trim() !== `${binary.digest}  ${name}`) throw new Error(`Stale checksum: ${name}`);
  }
  const runtime = JSON.parse(files.find(file => file.name === 'windows-runtime.json').bytes);
  const release = JSON.parse(files.find(file => file.name === 'release.json').bytes);
  if (runtime.status !== 'passed' || runtime.commit !== identity.revision || runtime.version !== identity.version
    || !Array.isArray(runtime.checks) || !runtime.checks.length || runtime.checks.some(check => typeof check !== 'string')
    || release.commit !== identity.revision || release.version !== identity.version
    || JSON.stringify(runtime.checks) !== JSON.stringify(release.nativeChecks)) throw new Error('Native evidence mismatch');
  const bytes = Buffer.from(files.map(file => `${file.digest}  ${file.name}\n`).join(''));
  const path = join(directory, 'SHA256SUMS.txt');
  writeFileSync(path, bytes);
  return [...files, { name: 'SHA256SUMS.txt', path, bytes, size: bytes.length, digest: sha256(bytes) }];
}

function validateDraft(release, identity, id, files) {
  if (release?.id !== id || release.tag_name !== `v${identity.version}` || release.draft !== true
    || release.prerelease !== false || release.target_commitish !== identity.revision) throw new Error('Draft identity mismatch');
  if (!Array.isArray(release.assets) || !sameNames(release.assets.map(asset => asset.name), files.map(file => file.name))) {
    throw new Error('Draft asset set mismatch');
  }
  const ids = new Set();
  for (const file of files) {
    const asset = release.assets.find(candidate => candidate.name === file.name);
    if (!Number.isSafeInteger(asset.id) || ids.has(asset.id) || asset.state !== 'uploaded' || asset.size !== file.size
      || (asset.digest && asset.digest !== `sha256:${file.digest}`)) throw new Error(`Draft asset metadata mismatch: ${file.name}`);
    ids.add(asset.id);
  }
}

// A failure deliberately leaves a private draft for explicit recovery. No path
// edits/deletes a prior release, overwrites an asset or moves an existing tag.
export function publishRelease(identity, files, transport, notes) {
  const decision = publicationDecision(identity, transport.api);
  if (decision !== 'publish') return decision;
  const draft = transport.createDraft(identity, notes);
  if (!Number.isSafeInteger(draft?.id) || draft.draft !== true) throw new Error('Draft creation failed');
  transport.upload(`v${identity.version}`, files);
  const root = `repos/${identity.repository}`;
  const uploaded = transport.api(`${root}/releases/${draft.id}`);
  validateDraft(uploaded, identity, draft.id, files);
  for (const file of files) {
    const asset = uploaded.assets.find(candidate => candidate.name === file.name);
    const downloaded = transport.download(asset.id);
    if (!Buffer.isBuffer(downloaded) || !downloaded.equals(file.bytes)) throw new Error(`Draft byte mismatch: ${file.name}`);
  }
  const main = transport.api(`${root}/git/ref/heads/main`);
  if (main?.object?.type !== 'commit' || main.object.sha !== identity.revision) throw new Error('Build superseded before publication; draft preserved');
  // Re-read after all downloads so changed/partial assets never become public.
  const verified = transport.api(`${root}/releases/${draft.id}`);
  validateDraft(verified, identity, draft.id, files);
  for (const file of files) {
    const before = uploaded.assets.find(asset => asset.name === file.name);
    const after = verified.assets.find(asset => asset.name === file.name);
    if (after.id !== before.id || after.updated_at !== before.updated_at) throw new Error('Draft changed during verification');
  }
  const published = transport.publish(draft.id);
  if (published?.id !== draft.id || published.draft !== false || published.prerelease !== false
    || published.tag_name !== `v${identity.version}` || published.target_commitish !== identity.revision) throw new Error('Publication response mismatch');
  return 'published-new';
}

export function githubTransport(identity, run = spawnSync) {
  const root = `repos/${identity.repository}`;
  const command = (args, input) => {
    const result = run('gh', args, { input, maxBuffer: 256 * 1024 * 1024 });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`GitHub operation failed: ${result.stderr?.toString() || result.status}`);
    return result.stdout;
  };
  const mutation = (endpoint, method, body) => JSON.parse(command(['api', endpoint, '--method', method, '--input', '-'], JSON.stringify(body)));
  return {
    api: (endpoint, allowMissing) => githubApi(endpoint, allowMissing, run),
    createDraft: (id, notes) => mutation(`${root}/releases`, 'POST', {
      tag_name: `v${id.version}`, target_commitish: id.revision, draft: true, prerelease: false,
      name: notes.title, body: notes.body,
    }),
    upload: (tag, files) => command(['release', 'upload', tag, ...files.map(file => file.path), '--repo', identity.repository]),
    download: id => command(['api', `${root}/releases/assets/${id}`, '-H', 'Accept: application/octet-stream']),
    publish: id => mutation(`${root}/releases/${id}`, 'PATCH', { draft: false, prerelease: false, make_latest: 'true' }),
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
    const identity = { repository: process.env.GITHUB_REPOSITORY, revision: process.env.GITHUB_SHA, version };
    const body = readFileSync(new URL(`../docs/RELEASE_v${version}.md`, import.meta.url), 'utf8');
    const files = prepareAssets(resolve(process.argv[2] ?? 'release-assets'), identity);
    console.log(publishRelease(identity, files, githubTransport(identity), { title: body.split('\n')[0].replace(/^#\s*/, ''), body }));
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
