#!/usr/bin/env python3
"""Original deterministic foley approximations. No sampled third-party recordings."""
import hashlib
import argparse
import json
from pathlib import Path
import subprocess
import wave
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
RATE = 24000
RNG = np.random.default_rng(120012)


def resonant(seconds, frequencies, decay, noise=.12):
    t = np.arange(round(seconds * RATE)) / RATE
    wave = sum(np.sin(2 * np.pi * f * t + .2 * i) / (i + 1) for i, f in enumerate(frequencies))
    wave += RNG.normal(0, noise, len(t))
    return wave * np.exp(-decay * t) * np.minimum(t * 600, 1)


def pattern(seconds, taps):
    out = np.zeros(round(seconds * RATE))
    for at, wave, gain in taps:
        start = round(at * RATE)
        end = min(len(out), start + len(wave))
        out[start:end] += wave[:end - start] * gain
    return out


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--only', help='Comma separated names; preserve all other recordings')
    parser.add_argument('--version', default=json.loads((ROOT / 'package.json').read_text())['version'])
    args = parser.parse_args()
    wanted = set(args.only.split(',')) if args.only else None
    noise = lambda sec: RNG.normal(0, 1, round(sec * RATE))
    paper = noise(.7)
    paper = np.convolve(paper, np.ones(4) / 4, 'same') * np.sin(np.linspace(0, np.pi, len(paper))) ** 2
    pen = noise(.55) * .15 + np.sin(np.arange(round(.55 * RATE)) * 2 * np.pi * 1250 / RATE) * .012
    pen *= np.sin(np.linspace(0, 4 * np.pi, len(pen))) ** 2
    clips = {
        'door-knock': pattern(1.3, [(a, resonant(.22, [115, 240, 410], 24), .7) for a in (0, .34, .7)]),
        'keys-two-one': pattern(1.9, [(a, resonant(.5, [1970, 2873, 3901, 5200], 12, .22), g) for a, g in [(0, .28), (.28, .28), (.95, .75)]]),
        'iron-gate': resonant(1.1, [82, 173, 311, 873], 4.5, .28),
        'relay-drop': pattern(.6, [(0, resonant(.12, [400, 1600], 65, .4), .5), (.09, resonant(.17, [180, 980], 38, .35), .65)]),
        'switch-off': resonant(.18, [620, 2100], 55, .5),
        'intercom-click': pattern(.35, [(0, resonant(.04, [1600, 3400], 105, .4), .5), (.07, noise(.17) * .1 * np.hanning(round(.17 * RATE)), .8)]),
        'radio-open': pattern(.7, [(0, noise(.25) * np.hanning(round(.25 * RATE)) * .18, 1), (.29, resonant(.12, [1450], 35, .05), .12)]),
        'paper-turn': paper,
        'pen-sign': pen,
        'phone-alert': pattern(1.3, [(a, resonant(.35, [659.25, 987.77], 7, .01), .25) for a in (0, .5)]),
        'cup-set': resonant(.5, [710, 1880, 3070], 15, .06),
    }
    # New effects use their own seed, independent of the existing eleven recipes.
    ring_t = np.arange(round(.48 * RATE)) / RATE
    ring = (np.sin(2 * np.pi * 440 * ring_t) + .65 * np.sin(2 * np.pi * 480 * ring_t))
    ring *= (.45 + .55 * np.sin(2 * np.pi * 24 * ring_t) ** 2) * np.hanning(len(ring))
    clips['telephone-ring'] = pattern(2.65, [(at, ring, .6) for at in (0, .85, 1.7)])
    latch_rng = np.random.default_rng(130013)
    latch_t = np.arange(round(.45 * RATE)) / RATE
    latch = latch_rng.normal(0, .08, len(latch_t)) + np.sin(2 * np.pi * (320 * latch_t + 95 * latch_t ** 2)) * .25
    latch *= np.sin(np.linspace(0, np.pi, len(latch))) ** 2
    clips['latch-turn'] = pattern(1.1, [(0, latch, .6), (.52, latch, .35)])
    # v1.4 effects have a separate stream, leaving every previous master unchanged.
    visitor_rng = np.random.default_rng(140014)
    glass_t = np.arange(round(.32 * RATE)) / RATE
    glass = sum(np.sin(2 * np.pi * f * glass_t) * gain for f, gain in [(780, 1), (2120, .35), (3610, .2)])
    glass *= np.exp(-22 * glass_t) * np.minimum(glass_t * 1200, 1)
    clips['glass-tap'] = pattern(1.7, [(at, glass, .6) for at in (0, .42, .87)])
    tear = visitor_rng.normal(0, .15, round(.7 * RATE))
    tear = np.convolve(tear, [1, -.85], 'same') * np.sin(np.linspace(0, np.pi, len(tear))) ** 2
    tear *= .5 + .5 * np.sin(np.linspace(0, 18 * np.pi, len(tear))) ** 2
    clips['ticket-tear'] = pattern(1.05, [(.1, tear, .8)])
    step_t = np.arange(round(.65 * RATE)) / RATE
    step = (visitor_rng.normal(0, .1, len(step_t)) + np.sin(2 * np.pi * 85 * step_t) * .45)
    step *= np.exp(-9 * step_t) * np.minimum(step_t * 200, 1)
    clips['wet-step'] = pattern(1.2, [(0, step, .7)])
    if wanted and wanted - clips.keys():
        parser.error('Unknown effect names: ' + ', '.join(sorted(wanted - clips.keys())))
    manifest_path = ROOT / 'docs/audio/sfx-manifest.json'
    previous = json.loads(manifest_path.read_text()) if manifest_path.exists() else {'clips': []}
    records = {row['id']: row for row in previous['clips']}
    for name, samples in clips.items():
        if wanted and name not in wanted:
            continue
        samples *= .35 / max(.01, np.max(np.abs(samples)))
        raw = ROOT / ('assets_source/audio/v' + args.version) / ('sfx-' + name + '.wav')
        out = ROOT / 'public/audio/sfx' / (name + '.mp3')
        raw.parent.mkdir(parents=True, exist_ok=True)
        out.parent.mkdir(parents=True, exist_ok=True)
        pcm = (np.clip(samples, -1, 1) * 32767).astype('<i2')
        with wave.open(str(raw), 'wb') as output:
            output.setparams((1, 2, RATE, len(samples), 'NONE', 'not compressed'))
            output.writeframes(pcm.tobytes())
        subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-y', '-i', str(raw), '-af', 'loudnorm=I=-22:TP=-2:LRA=6',
                        '-ar', str(RATE), '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '96k', str(out)], check=True)
        seed = 140014 if name in ('glass-tap', 'ticket-tear', 'wet-step') else 130013 if name == 'latch-turn' else 120012
        records[name] = {'id': name, 'duration': len(samples) / RATE, 'seed': seed, 'creator': 'original procedural foley',
                        'files': [{'path': p.relative_to(ROOT).as_posix(), 'bytes': p.stat().st_size,
                                   'sha256': hashlib.sha256(p.read_bytes()).hexdigest()} for p in (raw, out)]}
    manifest_path.write_text(json.dumps({'schemaVersion': 1, 'version': args.version, 'clips': list(records.values())}, indent=2) + '\n')
    print('Registered', len(records), 'original effects; generated', len(wanted) if wanted else len(clips))


if __name__ == '__main__':
    main()
