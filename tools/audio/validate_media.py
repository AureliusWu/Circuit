#!/usr/bin/env python3
"""Validate source fingerprints, hashes, decode and the bundled voice request plan."""
import hashlib
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[2]


def digest(data):
    return hashlib.sha256(data).hexdigest()


def main():
    plan = json.loads((ROOT / 'docs/audio/voice-plan.json').read_text())
    provider = json.loads((ROOT / 'docs/audio/voice-provider.json').read_text())
    voices = json.loads((ROOT / 'docs/audio/voice-manifest.json').read_text())
    effects = json.loads((ROOT / 'docs/audio/sfx-manifest.json').read_text())
    archive = json.loads((ROOT / 'docs/audio/voice-first-pass.json').read_text())
    provider_sha = digest(json.dumps(provider, sort_keys=True).encode())
    assert provider_sha == voices['providerSha256']
    assert len(plan['lines']) == len(voices['clips']) == 32 and len(effects['clips']) == 11
    requests = {row['id']: row for row in plan['lines']}
    decoded = []
    for row, current in [(row, True) for row in voices['clips'] + effects['clips']] + [(row, False) for row in archive['clips']]:
        if current and row['id'] in requests:
            request = requests[row['id']]
            for k, value in request.items():
                assert row[k] == value, (row['id'], k)
            fingerprint = digest(json.dumps({**request, 'providerSha256': provider_sha}, ensure_ascii=False, sort_keys=True).encode())
            assert row['requestSha256'] == fingerprint, row['id']
        for file in row['files']:
            path = ROOT / file['path']
            assert path.resolve().is_relative_to(ROOT)
            data = path.read_bytes()
            assert len(data) == file['bytes'] and digest(data) == file['sha256'], file['path']
            # Decode every sample, including authoring sources, not just container headers.
            result = subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-i', str(path), '-f', 'null', '-'], capture_output=True, check=True)
            assert not result.stderr, file['path']
            if path.suffix == '.mp3':
                probe = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration:stream=channels,sample_rate', '-of', 'json', str(path)], capture_output=True, text=True, check=True).stdout)
                stream = probe['streams'][0]
                duration = float(probe['format']['duration'])
                assert stream['channels'] == 1 and stream['sample_rate'] == '24000'
                assert abs(duration - row['duration']) < .2, (row['id'], duration)
                if current:
                    decoded.append({'id': row['id'], 'path': file['path'], 'duration': duration, 'sha256': file['sha256']})
    report = {'schemaVersion': 1, 'version': '1.2.0', 'status': 'passed', 'voiceCount': len(voices['clips']), 'sfxCount': len(effects['clips']),
              'decodedFiles': sum(len(r['files']) for r in voices['clips'] + effects['clips'] + archive['clips']),
              'currentFiles': sum(len(r['files']) for r in voices['clips'] + effects['clips']), 'archivedFiles': sum(len(r['files']) for r in archive['clips']),
              'voiceSeconds': round(sum(r['duration'] for r in voices['clips']), 3),
              'voiceGenerationSeconds': round(sum(r['generationSeconds'] for r in voices['clips']), 3), 'shippingFiles': decoded,
              'limitations': ['Signal and request checks do not certify acting or pronunciation; human listening remains pending.']}
    (ROOT / 'docs/audio/media-verification.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print('Media verified:', report['decodedFiles'], 'full decodes;', report['voiceCount'], 'voices;', report['sfxCount'], 'effects')


if __name__ == '__main__':
    main()
