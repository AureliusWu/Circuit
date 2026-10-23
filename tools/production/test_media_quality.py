"""Signal edge cases, release binding and malformed review data regressions."""
import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
import wave

import numpy as np
from PIL import Image

SPEC = importlib.util.spec_from_file_location("quality", Path(__file__).with_name("audit_media_quality.py"))
quality = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(quality)


class SignalTests(unittest.TestCase):
    def test_silent_dialogue_is_an_error(self):
        metrics, flags = quality.signal_metrics(np.zeros(24000))
        self.assertIn("silent_audio", flags)
        self.assertIsNone(metrics["rmsDbfs"])
        json.dumps(metrics, allow_nan=False)

    def test_partial_final_window_is_not_dropped(self):
        samples = np.zeros(24001)
        samples[-1] = 0.5
        metrics, flags = quality.signal_metrics(samples)
        self.assertNotIn("silent_audio", flags)
        self.assertEqual(metrics["trailingSilenceSeconds"], 0)

    def test_known_amplitude_and_overload(self):
        metrics, flags = quality.signal_metrics(np.full(2400, 0.5))
        self.assertAlmostEqual(metrics["samplePeakDbfs"], -6.021, places=3)
        self.assertNotIn("sample_overload", flags)
        _, flags = quality.signal_metrics(np.full(2400, 1.01))
        self.assertIn("sample_overload", flags)

    def test_long_lead_and_tail_are_review_only(self):
        samples = np.concatenate([np.zeros(16800), np.full(24000, 0.2), np.zeros(21600)])
        metrics, flags = quality.signal_metrics(samples)
        self.assertAlmostEqual(metrics["leadingSilenceSeconds"], 0.7)
        self.assertAlmostEqual(metrics["trailingSilenceSeconds"], 0.9)
        self.assertEqual(set(flags), {"leading_silence", "trailing_silence"})
        self.assertFalse(quality.ERRORS.intersection(flags))

    def test_nonfinite_audio_is_not_silently_accepted(self):
        _, flags = quality.signal_metrics(np.array([0.1, np.nan, np.inf]))
        self.assertIn("nonfinite_audio", flags)

    def test_empty_audio_is_rejected(self):
        with self.assertRaises(ValueError): quality.signal_metrics(np.array([]))


class BindingTests(unittest.TestCase):
    def test_a_declared_replay_does_not_hide_unrelated_reuse(self):
        rows = [{"id": "a", "text": "甲", "sha256": "same", "flags": []},
                {"id": "b", "text": "乙", "sha256": "same", "flags": []},
                {"id": "r", "text": "甲", "sha256": "same", "flags": [], "replayOf": "a"}]
        quality.flag_reuse(rows)
        self.assertIn("undeclared_audio_reuse", rows[0]["flags"])
        self.assertIn("undeclared_audio_reuse", rows[1]["flags"])
        self.assertEqual(rows[2]["flags"], [])

    def test_identical_short_reply_is_not_a_binding_error(self):
        rows = [{"id": "a", "text": "好。", "sha256": "same", "flags": []},
                {"id": "b", "text": "好！", "sha256": "same", "flags": []}]
        quality.flag_reuse(rows)
        self.assertTrue(all(not row["flags"] for row in rows))

    def test_duplicate_ids_are_rejected(self):
        with self.assertRaises(ValueError): quality.unique_rows([{"id": "a"}, {"id": "a"}], "fixture")

    def test_paths_cannot_escape_checkout(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory) / "checkout"
            root.mkdir()
            (Path(directory) / "external.wav").write_bytes(b"x")
            with self.assertRaises(ValueError): quality.safe_path(root, "../external.wav")


class ReleaseFixtureTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.docs = self.root / "docs/production/full-media"
        self.docs.mkdir(parents=True)
        (self.root / "public/art").mkdir(parents=True)
        samples = (np.sin(np.arange(24000) * 2 * np.pi * 440 / 24000) * 6000).astype("<i2")
        with wave.open(str(self.root / "public/voice.wav"), "wb") as wav:
            wav.setparams((1, 2, 24000, 0, "NONE", "not compressed"))
            wav.writeframes(samples.tobytes())
        Image.new("RGB", (32, 18), "pink").save(self.root / "public/art/scene.webp")
        row = {"id": "fixture-1", "sceneId": "opening", "speaker": "甲", "text": "听见了吗？"}
        self.write(self.docs / "dialogue-plan.json", {"project": "Fixture", "semanticSha256": "same", "lines": [row]})
        self.write(self.docs / "runtime-voice.json", {"semanticSha256": "same", "bindings": [{"id": row["id"], "runtime": "public/voice.wav", "sha256": quality.sha256(self.root / "public/voice.wav")}]})
        self.write(self.docs / "runtime-art.json", {"outputs": [{"id": "scene", "output": "public/art/scene.webp", "sha256": quality.sha256(self.root / "public/art/scene.webp")}]})
        self.archive = self.root / "assets_source/voice/continued-20261020/manifest.json"
        self.archive.parent.mkdir(parents=True)
        self.write(self.archive, {"semanticSha256": "same", "records": [{**row, "asr": {"passed": True, "cer": 0, "transcript": row["text"]}}]})
        self.git("init", "-q")
        self.git("add", ".")
        self.git("-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-qm", "Frozen fixture")
        self.ref = self.git("rev-parse", "HEAD")
        self.write(self.root / "docs/production/RELEASE-READINESS-20261022.json", {"runtimeCommit": self.ref, "targetVersion": "1.0.0"})

    def tearDown(self): self.tmp.cleanup()

    def git(self, *args): return quality.git(self.root, *args)

    @staticmethod
    def write(path, value): path.write_text(json.dumps(value, ensure_ascii=False), encoding="utf-8")

    def test_frozen_release_decodes_and_human_review_remains_pending(self):
        report = quality.audit(self.root, 1)
        self.assertEqual(report["summary"]["objectiveErrorItems"], 0)
        self.assertEqual(report["summary"]["dialogueBindings"], 1)
        self.assertEqual(report["summary"]["artworkFiles"], 1)
        self.assertFalse(report["humanListening"])
        self.assertEqual(report["audio"][0]["humanReview"], "pending")
        output = self.root / "report"
        quality.write_outputs(report, output, self.root)
        self.assertTrue((output / "media-review.html").is_file())
        self.assertNotIn("__MEDIA_REVIEW_DATA__", (output / "media-review.html").read_text())

    def test_dirty_media_cannot_borrow_a_published_identity(self):
        (self.root / "public/voice.wav").write_bytes(b"changed")
        with self.assertRaisesRegex(ValueError, "frozen release"): quality.audit(self.root, 1)

    def test_untracked_artwork_cannot_claim_frozen_release_coverage(self):
        Image.new("RGB", (32, 18)).save(self.root / "public/art/new.png")
        with self.assertRaisesRegex(ValueError, "frozen release"): quality.audit(self.root, 1)

    def test_fully_transparent_art_is_detected(self):
        image = self.root / "transparent.png"
        Image.new("RGBA", (12, 12)).save(image)
        item = quality.inspect_image(self.root, "transparent.png")
        self.assertIn("transparent_image", item["flags"])

    def test_corrupted_audio_reports_decode_error(self):
        path = self.root / "broken.ogg"
        path.write_bytes(b"corrupt")
        item = quality.inspect_audio(self.root,
            {"id": "broken", "sceneId": "s", "speaker": "甲", "text": "测试"},
            {"runtime": "broken.ogg", "sha256": quality.sha256(path)},
            {"asr": {"passed": True, "cer": 0}})
        self.assertIn("decode_failure", item["flags"])


if __name__ == "__main__": unittest.main()
