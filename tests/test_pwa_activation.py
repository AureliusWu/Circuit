"""Exercise slow progress, stalled downloads and foreign registration rejection."""
import unittest

from pwa_activation import wait_activation


SCOPE = 'https://game.test/Circuit/'


class Page:
    def __init__(self, snapshot):
        self.seconds = 0
        self.snapshot = snapshot

    def evaluate(self, expression, scope):
        return self.snapshot(self.seconds)

    def wait_for_timeout(self, milliseconds):
        self.seconds += milliseconds / 1000


def state(cached=0, active=None, scope=SCOPE):
    return dict(scope=scope, active=active, installing='installing', waiting=None, cached=cached)


class ActivationTests(unittest.TestCase):
    def test_progress_beyond_original_deadline_eventually_activates(self):
        page = Page(lambda seconds: state(int(seconds), 'activated' if seconds >= 120 else None))
        result = wait_activation(page, SCOPE, clock=lambda: page.seconds)
        self.assertEqual(result['elapsed_seconds'], 120)

    def test_stalled_download_is_rejected_without_waiting_entire_budget(self):
        page = Page(lambda _: state())
        with self.assertRaisesRegex(TimeoutError, 'did not activate'):
            wait_activation(page, SCOPE, clock=lambda: page.seconds)
        self.assertEqual(page.seconds, 60)

    def test_foreign_active_registration_never_counts_as_ready(self):
        page = Page(lambda seconds: state(int(seconds), 'activated', 'https://game.test/'))
        with self.assertRaises(TimeoutError):
            wait_activation(page, SCOPE, timeout=10000, clock=lambda: page.seconds)

    def test_progress_does_not_remove_total_deadline(self):
        page = Page(lambda seconds: state(int(seconds)))
        with self.assertRaises(TimeoutError):
            wait_activation(page, SCOPE, timeout=10000, clock=lambda: page.seconds)
        self.assertEqual(page.seconds, 10)


if __name__ == '__main__':
    unittest.main()
