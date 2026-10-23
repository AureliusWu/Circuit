import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';

// Read-only: existing releases/tags are never changed by a build retry.
export function publicationDecision({ repository, revision, version }, api) {
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository ?? '') || !/^[a-f0-9]{40}$/.test(revision ?? '') || !/^\d+\.\d+\.\d+$/.test(version ?? '')) {
    throw new Error('Missing or invalid publication identity');
  }
  const root = `repos/${repository}`;
  const main = api(`${root}/git/ref/heads/main`);
  if (main?.object?.type !== 'commit' || !/^[a-f0-9]{40}$/.test(main.object.sha)) throw new Error('Invalid main ref');
  if (main.object.sha !== revision) return 'superseded';

  const tagName = `v${version}`;
  const release = api(`${root}/releases/tags/${tagName}`, true);
  const tag = api(`${root}/git/ref/tags/${tagName}`, true);
  if (release) {
    if (release.tag_name !== tagName || release.draft !== false || !tag?.object?.sha) {
      throw new Error('Existing publication is incomplete; preserve it for explicit recovery');
    }
    return 'published';
  }
  if (tag) throw new Error('Existing tag without a published release; preserve it for explicit recovery');
  // The tag endpoint can omit private drafts, and a draft need not create its
  // tag yet. Inspect the authenticated, paginated release collection as well.
  for (let page = 1; page <= 100; page += 1) {
    const releases = api(`${root}/releases?per_page=100&page=${page}`);
    if (!Array.isArray(releases) || releases.some(item => !item || typeof item.tag_name !== 'string' || typeof item.draft !== 'boolean')) {
      throw new Error('Invalid authenticated release list; preserve existing publications');
    }
    if (releases.some(item => item.tag_name === tagName)) throw new Error('Existing publication in authenticated release list; preserve it for explicit recovery');
    if (releases.length < 100) return 'publish';
  }
  throw new Error('Authenticated release list exceeded pagination limit; preserve existing publications');
}

export function githubApi(endpoint, allowMissing = false, run = spawnSync) {
  const result = run('gh', ['api', endpoint], { encoding: 'utf8' });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    if (allowMissing && /\bHTTP 404\b/.test(result.stderr ?? '')) return null;
    throw new Error(`GitHub read failed for ${endpoint}: ${result.stderr || `exit ${result.status}`}`);
  }
  return JSON.parse(result.stdout);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
    const decision = publicationDecision({ repository: process.env.GITHUB_REPOSITORY, revision: process.env.GITHUB_SHA, version }, githubApi);
    console.error(`Publication decision: ${decision}`);
    console.log(decision);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
