"""Identify this WebView2 profile without confusing reused Windows process IDs."""


def track_profile_processes(processes, profile_paths, observed):
    webviews = {int(row['ProcessId']): row for row in processes
                if row['Name'].casefold() == 'msedgewebview2.exe'}
    tracked = {pid for pid, old in observed.items() if pid in webviews
               and old.get('CreationDate') is not None
               and old['CreationDate'] == webviews[pid].get('CreationDate')}
    tracked.update(pid for pid, row in webviews.items()
                   if any(path in (row['CommandLine'] or '').replace('/', '\\').casefold()
                          for path in profile_paths))
    while True:
        descendants = {pid for pid, row in webviews.items() if int(row['ParentProcessId']) in tracked}
        if descendants <= tracked:
            break
        tracked.update(descendants)
    remaining = [row for pid, row in webviews.items() if pid in tracked]
    if any(row.get('CreationDate') is None for row in remaining):
        raise ValueError('Tracked WebView2 process has no creation identity')
    observed.update((int(row['ProcessId']), row) for row in remaining)
    return remaining
