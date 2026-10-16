#!/usr/bin/env python3
"""Complete the immutable v1.4.0 publication with a public-filename checksum table."""
import argparse
from datetime import datetime, timezone
import hashlib
import io
import json
import os
from pathlib import Path
import re
import subprocess
import traceback
import urllib.request
import zipfile


def need(condition, message):
    if not condition:
        raise ValueError(message)


def sha(data):
    return hashlib.sha256(data).hexdigest()


def run(arguments, **kwargs):
    return subprocess.run(arguments, check=True, capture_output=True, **kwargs).stdout


def api(endpoint, method='GET', payload=None):
    arguments = ['gh', 'api', endpoint, '--method', method]
    if payload is not None:
        arguments += ['--input', '-']
    return json.loads(run(arguments, input=None if payload is None else json.dumps(payload).encode()))


def collection(endpoint, key):
    rows, page = [], 1
    while True:
        response = api(f'{endpoint}{"&" if "?" in endpoint else "?"}per_page=100&page={page}')
        rows.extend(response[key])
        if len(response[key]) < 100:
            need(len(rows) == response['total_count'], f'Incomplete API collection: {endpoint}')
            return rows
        page += 1


def anonymous(url):
    need(url.startswith('https://'), 'Public downloads require HTTPS')
    request = urllib.request.Request(url, headers={'User-Agent': 'Circuit-v140-publication-readback'})
    with urllib.request.urlopen(request, timeout=60) as response:
        need(response.status == 200, f'Public download failed: {url}')
        return response.read()


def canonical_bytes(auth):
    data = ''.join(f"{asset['digest'].removeprefix('sha256:')}  {asset['name']}\n"
                   for asset in sorted(auth['assets'], key=lambda item: item['name'])).encode()
    need(len(data) == auth['canonical_checksum_size'] and sha(data) == auth['canonical_checksum_sha256'],
         'Canonical checksum authorization changed')
    return data


def release_state(release, tag, auth, notes):
    need(release['id'] == auth['release_id'] and release['tag_name'] == auth['tag'], 'Release identity changed')
    need(release['draft'] is False and release['prerelease'] is False, 'Release state changed')
    need(release['target_commitish'] == auth['runtime_commit'], 'Release target changed')
    need(tag['object']['type'] == 'commit' and tag['object']['sha'] == auth['runtime_commit'], 'Tag changed')
    need(release['body'] == notes or sha(release['body'].encode()) == auth['original_body_sha256'],
         'Release notes have an unknown external edit')
    assets = {asset['name']: asset for asset in release['assets']}
    need(len(assets) == len(release['assets']), 'Duplicate asset names')
    expected = {asset['name'] for asset in auth['assets']}
    need(set(assets) in (expected, expected | {auth['canonical_checksum_name']}), 'Unexpected release assets')
    for pinned in auth['assets']:
        actual = assets[pinned['name']]
        need(all(actual[key] == pinned[key] for key in ('id', 'name', 'size', 'digest')),
             f'Original asset changed: {pinned["name"]}')
        need(actual['state'] == 'uploaded', 'Original upload is incomplete')
    if auth['canonical_checksum_name'] in assets:
        actual = assets[auth['canonical_checksum_name']]
        expected_bytes = canonical_bytes(auth)
        need(actual['state'] == 'uploaded' and actual['size'] == len(expected_bytes)
             and actual['digest'] == 'sha256:' + sha(expected_bytes),
             'Existing public checksum file differs')
    return assets


def checked_zip(data, pin):
    need(len(data) == pin['size_in_bytes'] and 'sha256:' + sha(data) == pin['digest'],
         f'Artifact bytes changed: {pin["name"]}')
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        need(archive.testzip() is None, 'Artifact CRC failure')
        names = archive.namelist()
        need(len(names) == len(set(names)), 'Duplicate ZIP entries')
        need(all(not name.startswith('/') and '..' not in name.split('/') for name in names), 'Unsafe ZIP path')
        return {name: archive.read(name) for name in names if not name.endswith('/')}


def checksum_rows(data):
    rows = []
    for line in data.decode('utf-8-sig').splitlines():
        match = re.fullmatch(r'([0-9a-f]{64})  (.+)', line)
        need(match is not None, 'Invalid checksum row')
        rows.append(match.groups())
    need(len({name for _, name in rows}) == len(rows), 'Duplicate checksum row')
    return rows


def verify_checksums(data, public, mapping, names):
    rows = checksum_rows(data)
    need({name for _, name in rows} == set(names), 'Checksum coverage changed')
    for digest, name in rows:
        need(sha(public[mapping.get(name, name)]) == digest, f'Checksum mismatch: {name}')


def validate_payload(auth, public, archives):
    need(set(public) == {asset['name'] for asset in auth['assets']}, 'Original downloads incomplete')
    for asset in auth['assets']:
        data = public[asset['name']]
        need(len(data) == asset['size'] and 'sha256:' + sha(data) == asset['digest'], 'Public bytes changed')
    unpacked = {pin['name']: checked_zip(archives[pin['name']], pin) for pin in auth['artifacts']}
    compared = []
    for artifact_name in ('circuit-web', 'circuit-windows-nsis', 'circuit-windows-runtime'):
        for name, data in unpacked[artifact_name].items():
            public_name = auth['name_mapping'].get(name, name)
            if public_name in public:
                need(data == public[public_name], f'Public/CI bytes differ: {name}')
                compared.append(public_name)
    need(set(compared) == set(public) - {'release.json', 'SHA256SUMS.txt'}, 'Missing original CI files')
    mapping = auth['name_mapping']
    verify_checksums(public['SHA256SUMS.txt'], public, mapping,
                     ['回路 Circuit_1.4.0_x64-setup.exe', 'circuit-web-1.4.0.zip', 'release.json', 'windows-runtime.json'])
    verify_checksums(public['Circuit_1.4.0_x64-setup.exe.sha256'], public, mapping,
                     ['回路 Circuit_1.4.0_x64-setup.exe'])
    verify_checksums(public['circuit-web-1.4.0.zip.sha256'], public, mapping, ['circuit-web-1.4.0.zip'])
    with zipfile.ZipFile(io.BytesIO(public['circuit-web-1.4.0.zip'])) as archive:
        need(archive.testzip() is None, 'Web package CRC failure')
        names = archive.namelist()
        need(len(names) == len(set(names)) == 96, 'Web package manifest changed')
        need({'index.html', 'sw.js', 'manifest.webmanifest', 'README.txt'} <= set(names), 'Incomplete PWA')
        need(len([name for name in names if name.startswith('audio/') and name.endswith('.mp3')]) == 48,
             'PWA recordings incomplete')
    runtime = json.loads(public['windows-runtime.json'])
    metadata = json.loads(public['release.json'])
    need(runtime['commit'] == metadata['commit'] == auth['runtime_commit'], 'Runtime source changed')
    need(runtime['version'] == metadata['version'] == auth['version'], 'Runtime version changed')
    need(metadata['runId'] == str(auth['source_run']), 'Original run changed')
    need(runtime['status'] == 'passed' and runtime['page_errors'] == [], 'Native runtime failed')
    need(runtime['document_url'] == 'http://tauri.localhost/', 'Native test used a web preview')
    need(runtime['checks'] == metadata['nativeChecks'] == auth['native_checks'], 'Native gates changed')
    need(runtime['temporary_profile_removed'] is True, 'Temporary UDF cleanup missing')
    need(runtime['executable_sha256'] == auth['installed_executable_sha256'], 'Installed executable changed')
    native = unpacked['circuit-windows-runtime']
    diagnostics = {}
    for attempt in ('first', 'reopen'):
        row = json.loads(native[f'{attempt}-diagnostic.json'])
        need(row['exit_code'] == 0 and not row.get('error') and not row.get('shutdown_error'), 'Abnormal native exit')
        need(row['closed_native_windows'] and all(window['visible'] and window['classname'] == 'Tauri Window'
             and 'Circuit' in window['title'] for window in row['closed_native_windows']), 'Native close was not observed')
        shutdown = row['webview_shutdown']
        need(shutdown['observed_pids'] and shutdown['remaining_pids'] == []
             and 0 <= shutdown['elapsed_seconds'] <= 30 and shutdown['profile_aliases'], 'WebView2 shutdown failed')
        need(shutdown == runtime['webview_shutdown'][attempt], 'Native runtime/diagnostic mismatch')
        diagnostics[attempt] = dict(exit_code=row['exit_code'], webview_shutdown=shutdown)
    live = json.loads(unpacked['circuit-pages-live']['live-browser.json'])
    need(live['status'] == 'passed' and live['commit'] == auth['runtime_commit'] and live['page_errors'] == [],
         'Public PWA evidence failed')
    need([(row['viewport']['width'], row['viewport']['height']) for row in live['viewports']]
         == [(1280, 720), (390, 844), (760, 430)], 'Public viewport evidence incomplete')
    for row in live['viewports']:
        need(row['status'] == 'passed' and row['cached_audio_count'] == 48 and len(row['offline_audio']) == 2,
             'Public offline evidence failed')
    canonical = canonical_bytes(auth)
    verify_checksums(canonical, public, {}, public.keys())
    return dict(runtime=runtime, release_metadata=metadata, native_diagnostics=diagnostics,
                public_live=live, ci_files_equal=sorted(compared), old_checksum_mapping_verified=True,
                canonical_public_names_verified=True, canonical_sha256=sha(canonical), canonical_bytes=len(canonical))


def verify_workflows(auth, endpoint):
    source = auth['runtime_commit']
    original = api(f"{endpoint}/actions/runs/{auth['source_run']}/attempts/{auth['source_attempt']}")
    need(original['id'] == auth['source_run'] and original['head_sha'] == source
         and original['event'] == 'push' and original['head_branch'] == 'main' and original['status'] == 'completed',
         'Original run is not the tested main push')
    jobs = collection(f"{endpoint}/actions/runs/{auth['source_run']}/attempts/1/jobs", 'jobs')
    selected = []
    for pinned in auth['source_jobs']:
        job = next((job for job in jobs if job['id'] == pinned['id']), None)
        need(job and job['name'] == pinned['name'] and job['conclusion'] == 'success', 'Original native/web job failed')
        for step_name in auth['required_source_steps'][pinned['name']]:
            need(any(step['name'] == step_name and step['conclusion'] == 'success' for step in job['steps']),
                 f'Required native/web step failed: {step_name}')
        selected.append(job)
    other_runs = []
    for pin in auth['other_runs']:
        row = api(f"{endpoint}/actions/runs/{pin['id']}")
        need(row['head_sha'] == source and row['status'] == 'completed' and row['conclusion'] == 'success',
             'Same-source CI/Pages run failed')
        run_jobs = collection(f"{endpoint}/actions/runs/{pin['id']}/jobs", 'jobs')
        need({job['name']: job['id'] for job in run_jobs} == pin['jobs'], 'Same-source jobs changed')
        need(all(job['conclusion'] == 'success' for job in run_jobs), 'Same-source checks failed')
        other_runs.append(dict(id=row['id'], conclusion=row['conclusion'], jobs=run_jobs))
    all_artifacts = collection(f"{endpoint}/actions/runs/{auth['source_run']}/artifacts", 'artifacts')
    pages_run = auth['other_runs'][1]['id']
    all_artifacts += collection(f'{endpoint}/actions/runs/{pages_run}/artifacts', 'artifacts')
    for pin in auth['artifacts']:
        actual = next((item for item in all_artifacts if item['id'] == pin['id']), None)
        need(actual and all(actual[key] == pin[key] for key in ('name', 'size_in_bytes', 'digest'))
             and actual['expired'] is False and actual['workflow_run']['head_sha'] == source, 'Original artifact changed')
        if pin['name'] != 'circuit-pages-live':
            need(actual['workflow_run']['id'] == auth['source_run'], 'Artifact from another run')
            job_name = 'Web / PWA archive' if pin['name'] == 'circuit-web' else 'Windows NSIS installer'
            job = next(item for item in selected if item['name'] == job_name)
            need(job['started_at'] <= actual['created_at'] <= job['completed_at'], 'Artifact outside successful native/web job')
        else:
            need(actual['workflow_run']['id'] == pages_run, 'Public evidence from another Pages run')
    return dict(original_run=original, original_successful_jobs=selected, other_successful_runs=other_runs)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--auth', type=Path, default=Path('docs/production/V140-PUBLICATION-AUTH.json'))
    parser.add_argument('--output', type=Path, default=Path('artifacts/finalize-v140'))
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    report = dict(status='running', checked_at=datetime.now(timezone.utc).isoformat())
    try:
        auth = json.loads(args.auth.read_text())
        endpoint = 'repos/' + auth['repository']
        need(auth['repository'] == os.environ['GITHUB_REPOSITORY'] == 'AureliusWu/Circuit', 'Wrong repository')
        run(['git', 'diff', '--quiet'])
        run(['git', 'diff', '--cached', '--quiet'])
        head = run(['git', 'rev-parse', 'HEAD'], text=True).strip()
        need(head == os.environ['GITHUB_SHA'], 'Completion checkout mismatch')
        run(['git', 'merge-base', '--is-ancestor', auth['runtime_commit'], head])
        changed = run(['git', 'diff', '--name-only', auth['runtime_commit'], head], text=True).splitlines()
        need(changed and set(changed) <= set(auth['allowed_metadata_paths']), 'Completion changes player/runtime paths')
        need(api(f'{endpoint}/git/ref/heads/main')['object']['sha'] == head, 'Completion main moved')
        event = json.loads(Path(os.environ['GITHUB_EVENT_PATH']).read_text())
        if os.environ['GITHUB_EVENT_NAME'] == 'workflow_run':
            trigger = event['workflow_run']
            need(trigger['id'] == auth['source_run'] and trigger['head_sha'] == auth['runtime_commit']
                 and trigger['status'] == 'completed' and trigger['name'] == 'Build release artifacts', 'Wrong completion trigger')
        else:
            need(os.environ['GITHUB_EVENT_NAME'] == 'workflow_dispatch', 'Unexpected event')
        notes = Path('docs/RELEASE_v1.4.0.md').read_text()
        workflows = verify_workflows(auth, endpoint)
        before = api(f"{endpoint}/releases/{auth['release_id']}")
        tag = api(f"{endpoint}/git/ref/tags/{auth['tag']}")
        assets = release_state(before, tag, auth, notes)
        (args.output / 'release-before.json').write_text(json.dumps(before, ensure_ascii=False, indent=2) + '\n')
        public = {pin['name']: anonymous(assets[pin['name']]['browser_download_url']) for pin in auth['assets']}
        archives = {pin['name']: run(['gh', 'api', f"{endpoint}/actions/artifacts/{pin['id']}/zip"])
                    for pin in auth['artifacts']}
        verified = validate_payload(auth, public, archives)
        for row in verified['public_live']['published_files']:
            data = anonymous(row['url'])
            need(len(data) == row['bytes'] and sha(data) == row['sha256'], 'Current public PWA bytes differ')
        canonical = canonical_bytes(auth)
        canonical_name = auth['canonical_checksum_name']
        if canonical_name in assets:
            need(anonymous(assets[canonical_name]['browser_download_url']) == canonical, 'Existing canonical bytes differ')
        # All immutable source, native, PWA and download checks finish before any write.
        fresh = api(f"{endpoint}/releases/{auth['release_id']}")
        fresh_assets = release_state(fresh, api(f"{endpoint}/git/ref/tags/{auth['tag']}"), auth, notes)
        need(api(f'{endpoint}/git/ref/heads/main')['object']['sha'] == head, 'Main moved before finalization')
        canonical_path = args.output / canonical_name
        canonical_path.write_bytes(canonical)
        if canonical_name not in fresh_assets:
            run(['gh', 'release', 'upload', auth['tag'], str(canonical_path), '--repo', auth['repository']])
        else:
            need(anonymous(fresh_assets[canonical_name]['browser_download_url']) == canonical, 'Concurrent canonical changed')
        latest = api(f"{endpoint}/releases/{auth['release_id']}")
        latest_assets = release_state(latest, api(f"{endpoint}/git/ref/tags/{auth['tag']}"), auth, notes)
        need(canonical_name in latest_assets, 'Canonical upload missing')
        canonical_id = latest_assets[canonical_name]['id']
        if latest['body'] != notes:
            api(f"{endpoint}/releases/{auth['release_id']}", 'PATCH', dict(body=notes))
        after = api(f"{endpoint}/releases/{auth['release_id']}")
        final_assets = release_state(after, api(f"{endpoint}/git/ref/tags/{auth['tag']}"), auth, notes)
        need(after['body'] == notes and len(final_assets) == 8, 'Final release metadata differs')
        need(final_assets[canonical_name]['id'] == canonical_id, 'Canonical asset changed during finalization')
        after_bytes = {name: anonymous(asset['browser_download_url']) for name, asset in final_assets.items()}
        for name, asset in final_assets.items():
            need(len(after_bytes[name]) == asset['size'] and 'sha256:' + sha(after_bytes[name]) == asset['digest'],
                 'Final public bytes/API digest mismatch')
        need(all(after_bytes[name] == data for name, data in public.items()), 'Original bytes changed during completion')
        need(after_bytes[canonical_name] == canonical, 'Canonical readback differs')
        verify_checksums(after_bytes[canonical_name], after_bytes, {}, public.keys())
        (args.output / 'release-after.json').write_text(json.dumps(after, ensure_ascii=False, indent=2) + '\n')
        report.update(status='passed', runtime_commit=auth['runtime_commit'], completion_commit=head,
                      completion_run=os.environ['GITHUB_RUN_ID'], changed_metadata_paths=changed,
                      workflows=workflows, verification=verified, original_assets_unchanged=True,
                      tag_unchanged=True, release_body_matches_notes=True, public_asset_count=8,
                      canonical_seven_rows_directly_verified=True,
                      public_assets=[dict(id=asset['id'], name=name, bytes=asset['size'], sha256=sha(after_bytes[name]))
                                     for name, asset in final_assets.items()])
        print(json.dumps(dict(status='passed', completion_commit=head, assets=8, canonical_sha256=sha(canonical))))
    except BaseException as error:
        report.update(status='failed', error=str(error), traceback=traceback.format_exc())
        raise
    finally:
        (args.output / 'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')


if __name__ == '__main__':
    main()
