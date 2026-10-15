#!/usr/bin/env python3
"""Build the self-hosted 400-weight Circuit Sans from a licensed Noto Sans SC TTF.

Requires fonttools[woff] and brotli. The source TTF stays outside the repository.
"""
import argparse
from pathlib import Path
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', nargs='?', type=Path)
    parser.add_argument('--output', type=Path, default=Path('public/fonts/circuit-sans.woff2'))
    parser.add_argument('--check', action='store_true', help='Read-only coverage check of the existing output; no source font is needed.')
    args = parser.parse_args()
    text = ''.join(p.read_text(encoding='utf-8') for p in sorted(Path('src').rglob('*')) if p.suffix in ('.ts', '.tsx', '.css', '.json'))
    if args.check:
        check_coverage(args.output, text)
        return
    if args.source is None:
        parser.error('source is required unless --check is used')
    with TTFont(args.source) as font:
        if 'fvar' in font:
            instantiateVariableFont(font, {'wght': 400}, inplace=True)
        options = subset.Options()
        options.flavor = 'woff2'
        builder = subset.Subsetter(options=options)
        builder.populate(text=text)
        builder.subset(font)
        font.flavor = 'woff2'
        args.output.parent.mkdir(parents=True, exist_ok=True)
        font.save(args.output)
    check_coverage(args.output, text)


def check_coverage(path, text):
    with TTFont(path) as output:
        missing = sorted({ord(c) for c in text if '\u3400' <= c <= '\u9fff'} - set(output.getBestCmap()))
        if missing:
            raise SystemExit('Missing CJK glyphs: ' + ''.join(chr(c) for c in missing))
    print(f'FONT_SUBSET_OK {path}: {path.stat().st_size} bytes, source CJK coverage complete')


if __name__ == '__main__':
    main()
