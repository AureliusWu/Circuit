"""Strict publication recovery: immutable identities, idempotency and actual CI fixture."""
import copy
import importlib.util
import json
import os
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('finalize_v140', ROOT / 'scripts/finalize-v140.py')
finalize = importlib.util.module_from_spec(spec)
spec.loader.exec_module(finalize)
AUTH = json.loads((ROOT / 'docs/production/V140-PUBLICATION-AUTH.json').read_text())


class ReleaseStateTests(unittest.TestCase):
    def setUp(self):
        self.notes = (ROOT / 'docs/RELEASE_v1.4.0.md').read_text()
        self.release = dict(id=AUTH['release_id'], tag_name=AUTH['tag'], draft=False, prerelease=False,
                            target_commitish=AUTH['runtime_commit'], body=self.notes,
                            assets=[dict(asset, state='uploaded') for asset in AUTH['assets']])
        self.tag = dict(object=dict(type='commit', sha=AUTH['runtime_commit']))

    def check(self):
        return finalize.release_state(self.release, self.tag, AUTH, self.notes)

    def test_original_seven_and_exact_canonical_are_idempotent(self):
        self.assertEqual(len(self.check()), 7)
        data = finalize.canonical_bytes(AUTH)
        self.assertEqual((len(data), finalize.sha(data)), (625, AUTH['canonical_checksum_sha256']))
        self.release['assets'].append(dict(id=1, name=AUTH['canonical_checksum_name'], size=len(data),
                                           digest='sha256:' + finalize.sha(data), state='uploaded'))
        self.assertEqual(len(self.check()), 8)
        self.assertEqual(len(finalize.checksum_rows(data)), 7)

    def test_same_bytes_with_replaced_original_id_are_rejected(self):
        self.release['assets'][0]['id'] += 1
        with self.assertRaisesRegex(ValueError, 'Original asset changed'):
            self.check()

    def test_unexpected_asset_or_rewritten_digest_is_rejected(self):
        self.release['assets'].append(dict(name='unexpected.txt'))
        with self.assertRaisesRegex(ValueError, 'Unexpected release assets'):
            self.check()
        self.release['assets'].pop()
        self.release['assets'][0]['digest'] = 'sha256:' + '0' * 64
        with self.assertRaisesRegex(ValueError, 'Original asset changed'):
            self.check()

    def test_unknown_body_or_changed_tag_is_rejected(self):
        self.release['body'] = 'external owner edit'
        with self.assertRaisesRegex(ValueError, 'unknown external edit'):
            self.check()
        self.release['body'] = self.notes
        self.tag['object']['sha'] = '0' * 40
        with self.assertRaisesRegex(ValueError, 'Tag changed'):
            self.check()

    def test_existing_wrong_canonical_is_rejected(self):
        self.release['assets'].append(dict(id=1, name=AUTH['canonical_checksum_name'], size=625,
                                           digest='sha256:' + '0' * 64, state='uploaded'))
        with self.assertRaisesRegex(ValueError, 'Existing public checksum file differs'):
            self.check()

    def test_canonical_row_uses_public_names_and_covers_all_original_assets(self):
        rows = finalize.checksum_rows(finalize.canonical_bytes(AUTH))
        self.assertEqual([name for _, name in rows], sorted(asset['name'] for asset in AUTH['assets']))
        self.assertTrue(all(name.isascii() for _, name in rows))
        self.assertNotIn(AUTH['canonical_checksum_name'], [name for _, name in rows])


class ActualPublicationFixtureTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.fixture = Path(os.environ.get('CIRCUIT_FINALIZE_FIXTURE', ROOT / 'artifacts/publication-v1.4.0'))
        if not (cls.fixture / 'verified-summary.json').exists():
            raise unittest.SkipTest('Actual immutable public/CI fixture is unavailable')
        cls.public = {asset['name']: (cls.fixture / asset['name']).read_bytes() for asset in AUTH['assets']}
        cls.archives = {pin['name']: (cls.fixture / f"{pin['name']}-{pin['id']}.zip").read_bytes()
                        for pin in AUTH['artifacts']}

    def test_actual_original_public_bytes_and_native_pwa_evidence_pass(self):
        result = finalize.validate_payload(AUTH, self.public, self.archives)
        self.assertEqual(len(result['ci_files_equal']), 5)
        self.assertTrue(result['canonical_public_names_verified'])
        self.assertEqual(result['canonical_sha256'], AUTH['canonical_checksum_sha256'])

    def test_actual_original_body_is_accepted_without_overwriting_other_edits(self):
        release = json.loads((self.fixture / 'release-api.json').read_text())
        tag = json.loads((self.fixture / 'tag-api.json').read_text())
        self.assertEqual(len(finalize.release_state(release, tag, AUTH,
                             (ROOT / 'docs/RELEASE_v1.4.0.md').read_text())), 7)

    def test_corrupted_public_file_is_rejected(self):
        changed = dict(self.public)
        changed['windows-runtime.json'] += b'\n'
        with self.assertRaisesRegex(ValueError, 'Public bytes changed'):
            finalize.validate_payload(AUTH, changed, self.archives)

    def test_corrupted_ci_artifact_is_rejected(self):
        changed = dict(self.archives)
        changed['circuit-windows-nsis'] += b'\0'
        with self.assertRaisesRegex(ValueError, 'Artifact bytes changed'):
            finalize.validate_payload(AUTH, self.public, changed)

    def test_canonical_checks_real_downloads_directly_without_mapping(self):
        canonical = finalize.canonical_bytes(AUTH)
        finalize.verify_checksums(canonical, self.public, {}, self.public.keys())
        changed = canonical.replace(b'Circuit_1.4.0_x64-setup.exe\n', '回路 Circuit_1.4.0_x64-setup.exe\n'.encode())
        with self.assertRaisesRegex(ValueError, 'Checksum coverage changed'):
            finalize.verify_checksums(changed, self.public, {}, self.public.keys())


if __name__ == '__main__':
    unittest.main()
