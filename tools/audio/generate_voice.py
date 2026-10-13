#!/usr/bin/env python3
"""Offline Qwen character recordings; recipe adapted from Rain (MIT, third_party/).

The game consumes MP3 only. This authoring tool never runs in the player.
Resume accepts a clip only when the full request fingerprint and file hashes match.
"""
import argparse
import hashlib
import importlib.metadata
import json
from pathlib import Path
import re
import subprocess
import time

ROOT = Path(__file__).resolve().parents[2]


def digest(data):
    return hashlib.sha256(data).hexdigest()


def save_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def normalize(raw, output):
    base = ['ffmpeg', '-nostdin', '-v', 'info', '-y', '-i', str(raw)]
    analysis = subprocess.run(base + ['-af', 'loudnorm=I=-20:TP=-2:LRA=6:print_format=json', '-f', 'null', '-'], capture_output=True, text=True, check=True)
    measured = json.loads(re.search(r'\{\s*"input_i".*?\}', analysis.stderr, re.S).group())
    assert all(measured[k] not in ('-inf', 'inf', 'nan') for k in ('input_i', 'input_tp', 'input_lra', 'input_thresh'))
    filt = ('loudnorm=I=-20:TP=-2:LRA=6:linear=true:'
            f"measured_I={measured['input_i']}:measured_TP={measured['input_tp']}:"
            f"measured_LRA={measured['input_lra']}:measured_thresh={measured['input_thresh']}:offset={measured['target_offset']}")
    subprocess.run(base + ['-af', filt, '-ar', '24000', '-ac', '1', '-c:a', 'pcm_s16le', str(output)], capture_output=True, check=True)
    return measured


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--model-dir', type=Path, required=True)
    parser.add_argument('--only', help='Comma separated clip IDs for a controlled retry')
    args = parser.parse_args()
    plan = json.loads((ROOT / 'docs/audio/voice-plan.json').read_text())
    model_dir = args.model_dir.resolve()
    files = [{'path': p.relative_to(model_dir).as_posix(), 'bytes': p.stat().st_size, 'sha256': digest(p.read_bytes())}
             for p in sorted(model_dir.rglob('*')) if p.is_file() and '.cache' not in p.parts
             and not p.name.startswith('.') and p.suffix in ('.json', '.txt', '.safetensors')]
    provider = {k: plan[k] for k in ('model', 'revision', 'language', 'dtype', 'threads', 'processing')}
    provider.update({'wrapper': 'qwen-tts-' + importlib.metadata.version('qwen-tts'),
                     'torch': importlib.metadata.version('torch'), 'license': 'Apache-2.0', 'snapshotFiles': files,
                     'engine': {'device': 'cpu', 'attention': 'eager', 'maxNewTokens': 512}})
    provider_hash = digest(json.dumps(provider, sort_keys=True).encode())
    save_json(ROOT / 'docs/audio/voice-provider.json', provider)
    manifest_path = ROOT / 'docs/audio/voice-manifest.json'
    old = json.loads(manifest_path.read_text()) if manifest_path.exists() else {'clips': []}
    recordings = {row['id']: row for row in old['clips']}
    import numpy as np
    import soundfile as sf
    import torch
    from qwen_tts import Qwen3TTSModel
    torch.set_num_threads(plan['threads'])
    torch.set_num_interop_threads(1)
    engine = None
    wanted = set(args.only.split(',')) if args.only else None
    for row in plan['lines']:
        if wanted and row['id'] not in wanted:
            continue
        request = {**row, 'providerSha256': provider_hash}
        fingerprint = digest(json.dumps(request, ensure_ascii=False, sort_keys=True).encode())
        previous = recordings.get(row['id'])
        if previous and previous['requestSha256'] == fingerprint and all(
                (ROOT / f['path']).is_file() and digest((ROOT / f['path']).read_bytes()) == f['sha256'] for f in previous['files']):
            print('CACHE', row['id'], flush=True)
            continue
        if engine is None:
            engine = Qwen3TTSModel.from_pretrained(str(model_dir), device_map='cpu', dtype=torch.bfloat16,
                                                  attn_implementation='eager', low_cpu_mem_usage=True)
        started = time.monotonic()
        torch.manual_seed(row['seed'])
        np.random.seed(row['seed'])
        with torch.inference_mode():
            wavs, rate = engine.generate_custom_voice(text=row['text'], language=plan['language'], speaker=row['speaker'],
                                                     instruct=row['instruct'], max_new_tokens=512)
        samples = np.asarray(wavs[0], dtype=np.float32).reshape(-1)
        duration = len(samples) / rate
        assert rate == 24000 and len(wavs) == 1 and np.isfinite(samples).all()
        assert .35 <= duration <= max(8, len(row['text']) * .8), (row['id'], duration)
        raw = ROOT / 'assets_source/audio/v1.2.0' / (row['id'] + '-raw.wav')
        wav = raw.with_name(row['id'] + '.wav')
        mp3 = ROOT / 'public/audio/voice' / (row['id'] + '.mp3')
        for p in (raw, wav, mp3):
            p.parent.mkdir(parents=True, exist_ok=True)
        sf.write(raw, samples, rate, subtype='PCM_16')
        loudness = normalize(raw, wav)
        subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-y', '-i', str(wav), '-c:a', 'libmp3lame', '-b:a', '96k', str(mp3)], check=True)
        record = {**row, 'requestSha256': fingerprint, 'duration': round(duration, 4), 'generationSeconds': round(time.monotonic() - started, 3),
                  'loudnessInput': loudness, 'files': [{'path': p.relative_to(ROOT).as_posix(), 'bytes': p.stat().st_size,
                                                      'sha256': digest(p.read_bytes())} for p in (raw, wav, mp3)]}
        recordings[row['id']] = record
        save_json(manifest_path, {'schemaVersion': 1, 'version': plan['version'], 'providerSha256': provider_hash,
                                 'clips': [recordings[r['id']] for r in plan['lines'] if r['id'] in recordings]})
        print('GENERATED', row['id'], duration, 'seconds;', record['generationSeconds'], 'CPU seconds', flush=True)


if __name__ == '__main__':
    main()
