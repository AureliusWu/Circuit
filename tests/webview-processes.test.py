import unittest
from webview_processes import track_profile_processes


def process(pid, parent, name='msedgewebview2.exe', creation='first', command=''):
    return dict(ProcessId=pid, ParentProcessId=parent, Name=name, CreationDate=creation, CommandLine=command)


class WebViewProcessTrackingTests(unittest.TestCase):
    def test_keeps_real_orphaned_children_after_the_browser_parent_exits(self):
        observed = {}
        paths = {r'c:\temp\profile'}
        rows = [process(10, 1, command=r'--user-data-dir=C:\temp\profile'), process(20, 10), process(30, 20)]
        self.assertEqual(len(track_profile_processes(rows, paths, observed)), 3)
        self.assertEqual([row['ProcessId'] for row in track_profile_processes(rows[1:], paths, observed)], [20, 30])

    def test_excludes_polling_shells_and_webviews_with_reused_pid(self):
        observed = {10: process(10, 1), 20: process(20, 10)}
        reused = [process(10, 1, name='powershell.exe', creation='later'),
                  process(20, 10, creation='later'), process(30, 10, name='conhost.exe')]
        self.assertEqual(track_profile_processes(reused, {r'c:\temp\profile'}, observed), [])

    def test_matches_short_profile_alias_and_does_not_absorb_another_profile(self):
        observed = {}
        rows = [process(10, 1, command=r'--user-data-dir=C:\Users\RUNNER~1\Temp\profile'),
                process(20, 1, command=r'--user-data-dir=C:\Users\other\profile')]
        aliases = {r'c:\users\runner~1\temp\profile', r'c:\users\runneradmin\temp\profile'}
        self.assertEqual([row['ProcessId'] for row in track_profile_processes(rows, aliases, observed)], [10])

    def test_missing_identity_does_not_turn_a_live_profile_into_success(self):
        with self.assertRaises(ValueError):
            track_profile_processes([process(10, 1, creation=None, command=r'--user-data-dir=C:\temp\profile')],
                                    {r'c:\temp\profile'}, {})


if __name__ == '__main__':
    unittest.main()
