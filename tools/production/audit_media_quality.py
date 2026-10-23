"""Read-only, frozen-release media measurements and a human review queue.

Needs FFmpeg, numpy and Pillow. Does not alter audio/artwork or approve listening.
Run from any checkout with --root <Rain|Healing|NetLove|Circuit>.
"""
import argparse
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
import math
from pathlib import Path
import re
import subprocess
from urllib.parse import quote

import numpy as np
from PIL import Image


SAMPLE_RATE = 24000
POLICY = {
    "silenceDbfs": -45, "windowMs": 20,
    "leadingSilenceSeconds": 0.6, "trailingSilenceSeconds": 0.8,
    "fastCharactersPerSecond": 8.5, "fastMinimumCharacters": 8,
    "asrReviewCer": 0.15, "clippingAmplitude": 1.0,
}
LABELS = {
    "decode_failure": "音频解码失败", "hash_mismatch": "字节与绑定摘要不符",
    "silent_audio": "整段接近静音", "nonfinite_audio": "包含无效采样值",
    "sample_overload": "采样超出 0 dBFS", "leading_silence": "开头静音偏长",
    "trailing_silence": "结尾静音偏长", "fast_delivery": "语速偏快，建议试听",
    "asr_difference": "既有 ASR 文本差异，建议试听",
    "asr_evidence_rejected": "既有 ASR 证据未通过",
    "undeclared_audio_reuse": "不同台词共用音频且未声明重播",
    "image_failure": "图片解码失败", "transparent_image": "图片完全透明",
    "sprite_edge": "透明人物触及画布边缘，建议查看",
}
ERRORS = {"decode_failure", "hash_mismatch", "silent_audio", "nonfinite_audio",
          "asr_evidence_rejected", "image_failure", "transparent_image"}


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def git(root, *args):
    return subprocess.check_output(["git", "-C", str(root), *args], text=True).strip()


def safe_path(root, relative):
    path = (root / relative).resolve()
    if not path.is_relative_to(root.resolve()) or not path.is_file():
        raise ValueError("Missing or unsafe media path: " + str(relative))
    return path


def unique_rows(rows, name):
    index = {row["id"]: row for row in rows}
    if len(index) != len(rows):
        raise ValueError("Duplicate IDs in " + name)
    return index


def dbfs(value):
    return round(20 * math.log10(value), 3) if value > 0 else None


def signal_metrics(samples):
    """Measure decoded mono PCM without altering the shipped file.

    RMS is signal amplitude, not LUFS; sample peak is not true peak.
    The last partial window participates in silence and tail measurements.
    """
    samples = np.asarray(samples, dtype=np.float32)
    if samples.ndim != 1 or not len(samples):
        raise ValueError("No mono audio samples")
    if not np.isfinite(samples).all():
        return {"durationSeconds": len(samples) / SAMPLE_RATE,
                "finite": False}, ["nonfinite_audio"]
    window = int(SAMPLE_RATE * POLICY["windowMs"] / 1000)
    powers = np.square(samples, dtype=np.float64)
    starts = np.arange(0, len(samples), window)
    counts = np.minimum(window, len(samples) - starts)
    levels = np.sqrt(np.add.reduceat(powers, starts) / counts)
    active = np.flatnonzero(levels > 10 ** (POLICY["silenceDbfs"] / 20))
    duration = len(samples) / SAMPLE_RATE
    leading = starts[active[0]] / SAMPLE_RATE if len(active) else duration
    active_end = min(starts[active[-1]] + window, len(samples)) if len(active) else 0
    trailing = (len(samples) - active_end) / SAMPLE_RATE if len(active) else duration
    peak = float(np.max(np.abs(samples)))
    overload = int(np.count_nonzero(np.abs(samples) >= POLICY["clippingAmplitude"]))
    metrics = {
        "finite": True, "durationSeconds": round(duration, 6),
        "samplePeakDbfs": dbfs(peak),
        "rmsDbfs": dbfs(float(np.sqrt(np.mean(powers)))),
        "dcOffset": round(float(np.mean(samples, dtype=np.float64)), 8),
        "overloadSamples": overload,
        "leadingSilenceSeconds": round(leading, 6),
        "trailingSilenceSeconds": round(trailing, 6),
        "activeSpanSeconds": round(max(0, duration - leading - trailing), 6),
    }
    flags = []
    if not len(active):
        flags.append("silent_audio")
    else:
        if leading >= POLICY["leadingSilenceSeconds"]: flags.append("leading_silence")
        if trailing >= POLICY["trailingSilenceSeconds"]: flags.append("trailing_silence")
    if overload: flags.append("sample_overload")
    return metrics, flags


def inspect_audio(root, row, binding, record):
    item = {"id": row["id"], "sceneId": row["sceneId"],
            "lineId": row.get("lineId"), "lineIndex": row.get("lineIndex"),
            "nodeId": row.get("nodeId"), "speaker": row["speaker"],
            "text": row["text"], "path": binding["runtime"],
            "expectedSha256": binding["sha256"], "flags": [],
            "humanReview": "pending", "replayOf": binding.get("replayOf"),
            "preservedLegacy": binding.get("preservedLegacy", False)}
    evidence = record.get("asr", {})
    item["existingAsr"] = {
        "transcript": evidence.get("transcript"), "cer": evidence.get("cer"),
        "passed": evidence.get("passed") is True,
        "exactTonedHomophones": evidence.get("phoneticReview", {}).get("passed") is True,
        "acceptance": evidence.get("acceptance"),
    }
    if evidence.get("passed") is not True:
        item["flags"].append("asr_evidence_rejected")
    if (evidence.get("cer") or 0) >= POLICY["asrReviewCer"] and not item["existingAsr"]["exactTonedHomophones"]:
        item["flags"].append("asr_difference")
    try:
        path = safe_path(root, binding["runtime"])
        item["sha256"] = sha256(path)
        if item["sha256"] != binding["sha256"]: item["flags"].append("hash_mismatch")
        pcm = subprocess.run([
            "ffmpeg", "-nostdin", "-v", "error", "-xerror", "-i", str(path),
            "-map", "0:a:0", "-vn", "-ac", "1", "-ar", str(SAMPLE_RATE),
            "-f", "f32le", "pipe:1",
        ], check=True, capture_output=True, timeout=60).stdout
        item["signal"], flags = signal_metrics(np.frombuffer(pcm, dtype="<f4"))
        item["flags"].extend(flags)
        characters = len(re.findall(r"[\u3400-\u9fffA-Za-z0-9]", row["text"]))
        span = item["signal"].get("activeSpanSeconds", 0)
        rate = round(characters / span, 3) if span else None
        item["signal"]["charactersPerActiveSecond"] = rate
        if characters >= POLICY["fastMinimumCharacters"] and rate and rate > POLICY["fastCharactersPerSecond"]:
            item["flags"].append("fast_delivery")
    except (OSError, ValueError, subprocess.SubprocessError) as exc:
        item["flags"].append("decode_failure")
        item["error"] = str(exc)[:500]
    return item


def inspect_image(root, relative, expected=None):
    item = {"id": "art:" + relative, "path": relative, "flags": [],
            "humanReview": "pending", "fullMediaAddition": expected is not None}
    try:
        path = safe_path(root, relative)
        item["sha256"] = sha256(path)
        if expected and expected != item["sha256"]: item["flags"].append("hash_mismatch")
        with Image.open(path) as im:
            im.load()
            item.update(width=im.width, height=im.height, mode=im.mode)
            alpha = im.getchannel("A") if "A" in im.getbands() else None
            if alpha is not None:
                bbox = alpha.point(lambda value: 255 if value > 8 else 0).getbbox()
                item["visibleBounds"] = bbox
                if not bbox:
                    item["flags"].append("transparent_image")
                elif any(part in relative for part in ("characters/", "portraits/", "chibi/", "expressions", "turnaround")):
                    item["edgeMargins"] = [bbox[0], bbox[1], im.width - bbox[2], im.height - bbox[3]]
                    if min(item["edgeMargins"]) == 0: item["flags"].append("sprite_edge")
    except (OSError, ValueError) as exc:
        item["flags"].append("image_failure")
        item["error"] = str(exc)[:500]
    return item


def flag_reuse(items):
    groups = defaultdict(list)
    for item in items:
        if item.get("sha256"): groups[item["sha256"]].append(item)
    for group in groups.values():
        texts = {re.sub(r"[\W_]", "", item["text"], flags=re.UNICODE) for item in group}
        if len(texts) > 1:
            # A replay declaration exempts only that row, never unrelated rows.
            originals = [item for item in group if not item.get("replayOf")]
            original_texts = {re.sub(r"[\W_]", "", i["text"], flags=re.UNICODE) for i in originals}
            if len(original_texts) > 1:
                for item in originals: item["flags"].append("undeclared_audio_reuse")


def audit(root, workers=4):
    root = root.resolve()
    docs = root / "docs/production/full-media"
    read = lambda path: json.loads(path.read_text(encoding="utf-8"))
    readiness = read(root / "docs/production/RELEASE-READINESS-20261022.json")
    ref = readiness["runtimeCommit"]
    if not re.fullmatch(r"[a-f0-9]{40}", ref): raise ValueError("Unpinned runtime commit")
    plan = read(docs / "dialogue-plan.json")
    bindings = read(docs / "runtime-voice.json")
    archive_path = root / "assets_source/voice/continued-20261020/manifest.json"
    archive = read(archive_path)
    art = read(docs / "runtime-art.json")
    runtime_dir = "game" if plan["project"] == "Rain" else "public"
    audited_paths = [runtime_dir, "docs/production/full-media/dialogue-plan.json",
                     "docs/production/full-media/runtime-voice.json",
                     "docs/production/full-media/runtime-art.json",
                     "assets_source/voice/continued-20261020/manifest.json"]
    changed = git(root, "diff", "--name-only", ref, "--", *audited_paths)
    untracked = git(root, "ls-files", "--others", "--exclude-standard", "--", *audited_paths)
    if changed or untracked:
        raise ValueError("Media differs from the frozen release:\n" + changed + "\n" + untracked)
    rows = unique_rows(plan["lines"], "dialogue plan")
    records = unique_rows(archive["records"], "recording archive")
    bound = unique_rows(bindings["bindings"], "runtime bindings")
    if set(rows) != set(records) or set(rows) != set(bound): raise ValueError("Incomplete media IDs")
    if not (plan["semanticSha256"] == archive["semanticSha256"] == bindings["semanticSha256"]):
        raise ValueError("Changed dialogue identity")
    with ThreadPoolExecutor(max_workers=workers) as pool:
        audio = list(pool.map(lambda id: inspect_audio(root, rows[id], bound[id], records[id]), rows))
    flag_reuse(audio)
    expected = {item["output"]: item["sha256"] for item in art["outputs"]}
    art_dirs = [root / "game" / sub for sub in ("backgrounds", "characters", "cg")] if runtime_dir == "game" else [root / "public/art"]
    images = sorted({p.relative_to(root).as_posix() for folder in art_dirs for p in folder.rglob("*")
                     if p.suffix.lower() in {".png", ".webp", ".jpg", ".jpeg"}} | set(expected))
    artwork = [inspect_image(root, path, expected.get(path)) for path in images]
    items = audio + artwork
    counts = Counter(flag for item in items for flag in item["flags"])
    errors = [item["id"] for item in items if ERRORS.intersection(item["flags"])]
    total_seconds = sum(item.get("signal", {}).get("durationSeconds", 0) for item in audio)
    catalog = [(item["id"], item.get("sha256")) for item in items]
    identity = hashlib.sha256(json.dumps(catalog, separators=(",", ":"), ensure_ascii=False).encode()).hexdigest()
    return {
        "schema": 1, "project": plan["project"], "version": readiness["targetVersion"],
        "runtimeCommit": ref, "checkoutCommit": git(root, "rev-parse", "HEAD"),
        "catalogSha256": identity, "policy": POLICY, "flagLabels": LABELS,
        "errorFlags": sorted(ERRORS), "summary": {
            "dialogueBindings": len(audio), "uniqueAudioFiles": len({i.get("sha256") for i in audio}),
            "artworkFiles": len(artwork), "fullMediaNewImages": len(expected),
            "audioDurationSeconds": round(total_seconds, 3),
            "reviewPriorityItems": sum(bool(item["flags"]) for item in items),
            "objectiveErrorItems": len(errors), "flags": dict(sorted(counts.items())),
        }, "status": "objective-errors-found" if errors else "measurements-complete",
        "humanListening": False, "humanVisualApproval": False,
        "limitations": [
            "ASR fields are retained recording evidence; no new recognition was performed.",
            "RMS and sample peak are not LUFS or true-peak measurements.",
            "Rate, silence, ASR differences and edge flags are review priorities, not confirmed creative defects.",
            "Artwork inventory includes retained reference sheets; actual scene composition remains a separate check.",
            "Duration sums every binding, including branches/replays; it is not player completion time.",
            "No audio, artwork, story, save format, release tag or published binary was changed.",
        ], "audio": audio, "artwork": artwork,
    }


def markdown(report):
    s = report["summary"]
    title = f'# {report["project"]} v{report["version"]} 素材客观质检与试听定位\n\n'
    text = title + f'冻结运行提交 `{report["runtimeCommit"]}`；素材目录摘要 `{report["catalogSha256"]}`。\n\n'
    text += (f'本轮实际测量 {s["dialogueBindings"]} 条对白绑定、{s["uniqueAudioFiles"]} 份不同音频与 '
             f'{s["artworkFiles"]} 张美术（含全量制作新增 {s["fullMediaNewImages"]} 张）。'
             f'全分支逐绑定音频合计 {s["audioDurationSeconds"] / 60:.2f} 分钟，不能当作通关时长。'
             f'客观错误 {s["objectiveErrorItems"]} 项；建议优先审阅 {s["reviewPriorityItems"]} 项。\n\n')
    text += '## 统计\n\n| 标记 | 项数 |\n| --- | ---: |\n'
    for code, count in s["flags"].items(): text += f'| {LABELS[code]} | {count} |\n'
    if not s["flags"]: text += '| 无触发标记 | 0 |\n'
    text += '\n## 优先定位\n\n每项仍需结合台词试听或查看；自动标记不等于错读、截音或人物错误。\n\n'
    for item in report["audio"] + report["artwork"]:
        if not item["flags"]: continue
        url = f'https://github.com/AureliusWu/{report["project"]}/blob/{report["runtimeCommit"]}/{quote(item["path"], safe="/")}'
        text += f'- [`{item["id"]}`]({url})：' + '；'.join(LABELS[f] for f in item["flags"]) + '。'
        if "text" in item: text += f' {item["speaker"]}：{item["text"]}'
        text += '\n'
    if not s["reviewPriorityItems"]: text += '未触发优先标记；全部素材仍保留人工审阅状态。\n'
    text += '\n## 使用与边界\n\n'
    text += '本目录 `media-review.html` 可在完整仓库内直接打开，按场景、人物、关键词与标记筛选。在线素材模式读取固定提交的原始素材；本地模式使用当前仓库。试听、通过/需修改标记及备注只写入本工具独立的本机记录，可导出 JSON；它们不修改游戏存档或自动改写人工验收。导入拒绝版本、目录摘要或素材 ID 不一致的记录。\n\n'
    text += 'ASR 沿用录制时的证据，未重新识别；精确同音复核单独显示，避免把同音字当作错读。信号 RMS、采样峰值不等于 LUFS / 真峰值。透明边缘、静音与语速仅用于审阅排序。全部背景、CG、角色图与保留参考图逐文件解码和测量；真实场景构图、情绪、混音、实体设备和有效阅读计时继续集中待用户操作。\n\n'
    text += '工具来源：[Circuit 质检工具](https://github.com/AureliusWu/Circuit/blob/main/tools/production/audit_media_quality.py)。报告为发布后只读质量检查，不替代原版 Windows / PWA 运行凭据。\n'
    return text


def write_outputs(report, output, root):
    output.mkdir(parents=True, exist_ok=True)
    (output / "media-quality.json").write_text(json.dumps(report, ensure_ascii=False, indent=2, allow_nan=False) + "\n", encoding="utf-8")
    (output / "README.md").write_text(markdown(report), encoding="utf-8")
    import os
    data = dict(report)
    data["localPrefix"] = os.path.relpath(root, output).replace("\\", "/") + "/"
    encoded = json.dumps(data, ensure_ascii=False, separators=(",", ":"), allow_nan=False).replace("<", "\\u003c")
    template = Path(__file__).with_name("media_review.html").read_text(encoding="utf-8")
    (output / "media-review.html").write_text(template.replace("__MEDIA_REVIEW_DATA__", encoded), encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path.cwd())
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--workers", type=int, default=4, choices=range(1, 9))
    args = parser.parse_args()
    report = audit(args.root, args.workers)
    write_outputs(report, args.output, args.root.resolve())
    print(json.dumps({"project": report["project"], **report["summary"], "status": report["status"]}, ensure_ascii=False))
    return 1 if report["summary"]["objectiveErrorItems"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
