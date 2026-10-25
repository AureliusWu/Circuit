import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const build = mkdtempSync(join(tmpdir(), 'circuit-tests-'));
try {
  const compile = spawnSync(process.execPath, [
    resolve('node_modules/typescript/bin/tsc'),
    '--module', 'commonjs', '--moduleResolution', 'node', '--resolveJsonModule', '--esModuleInterop',
    '--target', 'ES2020', '--lib', 'ES2020,DOM', '--strict', '--skipLibCheck',
    '--rootDir', 'src', '--outDir', build,
    'src/story/engine.ts', 'src/game/saves.ts', 'src/game/campaign.ts', 'src/game/preferences.ts', 'src/game/recordedAudio.ts', 'src/game/history.ts', 'src/game/pwa.ts', 'src/game/sceneLoop.ts', 'src/game/score.ts'
  ], { stdio: 'inherit' });
  if (compile.error) throw compile.error;
  if (compile.status !== 0) {
    process.exitCode = compile.status ?? 1;
  } else {
    const files = readdirSync('tests').filter((name) => name.endsWith('.test.cjs')).sort();
    if (files.length === 0) throw new Error('No test files found.');
    const result = spawnSync(process.execPath, ['--test', ...files.map((name) => join('tests', name))], {
      stdio: 'inherit', env: { ...process.env, CIRCUIT_TEST_BUILD: build }
    });
    if (result.error) throw result.error;
    process.exitCode = result.status ?? 1;
  }
} finally {
  rmSync(build, { recursive: true, force: true });
}
