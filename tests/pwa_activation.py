"""Bound first-install waits by both total time and observable cache progress."""
import time


SNAPSHOT = '''async scope => {
  const registration = await navigator.serviceWorker.getRegistration(scope);
  const names = (await caches.keys()).filter(name => name.includes(scope));
  const counts = await Promise.all(names.map(async name => (await (await caches.open(name)).keys()).length));
  return {scope: registration?.scope ?? null,
    active: registration?.active?.state ?? null,
    installing: registration?.installing?.state ?? null,
    waiting: registration?.waiting?.state ?? null,
    cached: counts.reduce((sum, count) => sum + count, 0)};
}'''


def wait_activation(page, scope, *, timeout=300000, stall_timeout=60000, polling=1000,
                    clock=time.monotonic, observe=None):
    # Workbox installs precache entries sequentially. Hundreds of dialogue files
    # can keep making progress beyond the old 90-second total deadline on Pages.
    # An active worker is still mandatory; a stalled or failed install cannot pass.
    began = last_progress = clock()
    previous, state = None, None
    while True:
        state = page.evaluate(SNAPSHOT, scope)
        now = clock()
        if observe:
            observe({**state, 'elapsed_seconds': round(now - began, 2)})
        if state['scope'] == scope and state['active'] == 'activated':
            return {**state, 'elapsed_seconds': round(now - began, 2)}
        progress = (state['scope'], state['active'], state['installing'], state['waiting'], state['cached'])
        if progress != previous:
            last_progress, previous = now, progress
        if now - began >= timeout / 1000 or now - last_progress >= stall_timeout / 1000:
            raise TimeoutError(f'Service Worker installation did not activate: {state}; elapsed={now - began:.1f}s')
        page.wait_for_timeout(polling)
