#!/usr/bin/env python3
"""Original deterministic foley approximations. No sampled third-party recordings."""
import hashlib
import json
from pathlib import Path
import subprocess
import numpy as np
import soundfile as sf

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
    records = []
    for name, samples in clips.items():
        samples *= .35 / max(.01, np.max(np.abs(samples)))
        raw = ROOT / 'assets_source/audio/v1.2.0' / ('sfx-' + name + '.wav')
        out = ROOT / 'public/audio/sfx' / (name + '.mp3')
        raw.parent.mkdir(parents=True, exist_ok=True)
        out.parent.mkdir(parents=True, exist_ok=True)
        sf.write(raw, samples, RATE, subtype='PCM_16')
        subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-y', '-i', str(raw), '-af', 'loudnorm=I=-22:TP=-2:LRA=6',
                        '-ar', str(RATE), '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '96k', str(out)], check=True)
        records.append({'id': name, 'duration': len(samples) / RATE, 'seed': 120012, 'creator': 'original procedural foley',
                        'files': [{'path': p.relative_to(ROOT).as_posix(), 'bytes': p.stat().st_size,
                                   'sha256': hashlib.sha256(p.read_bytes()).hexdigest()} for p in (raw, out)]})
    (ROOT / 'docs/audio/sfx-manifest.json').write_text(json.dumps({'schemaVersion': 1, 'version': '1.2.0', 'clips': records}, indent=2) + '\n')
    print('Generated', len(records), 'original effects')


if __name__ == '__main__':
    main()
