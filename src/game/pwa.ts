export type PwaState = {
  status: 'desktop' | 'unsupported' | 'downloading' | 'ready' | 'error';
  online: boolean; installed: boolean; canInstall: boolean;
  updateReady: boolean; checking: boolean; message: string;
};
type InstallEvent = Event & { prompt(): Promise<void>; userChoice: Promise<{ outcome: string }> };

// Readiness belongs to this registration, never navigator.serviceWorker.ready
// (which may refer to another application at a parent scope).
export function createPwaController(base: string, production: boolean, desktop: boolean) {
  const nav = typeof navigator === 'undefined' ? undefined : navigator;
  let registration: ServiceWorkerRegistration | undefined;
  let installEvent: InstallEvent | undefined;
  let started = false;
  const listeners = new Set<() => void>();
  const watched = new WeakSet<ServiceWorker>();
  const owners = new WeakSet<ServiceWorkerRegistration>();
  let state: PwaState = {
    status: desktop ? 'desktop' : !production || !nav?.serviceWorker ? 'unsupported' : 'downloading',
    online: nav?.onLine ?? true, installed: false, canInstall: false,
    updateReady: false, checking: false, message: ''
  };
  const emit = (next: Partial<PwaState>) => {
    state = { ...state, ...next }; listeners.forEach(listener => listener());
  };
  function inspect(owner: ServiceWorkerRegistration) {
    if (owner !== registration) return;
    const ready = owner.active?.state === 'activated';
    const waiting = owner.waiting?.state === 'installed';
    emit({ status: ready ? 'ready' : 'downloading', updateReady: !!waiting && !!ready,
      message: waiting && ready ? '更新已下载。关闭所有本作窗口后，下次打开使用新版。' : '' });
    [owner.installing, owner.waiting, owner.active].forEach(worker => {
      if (!worker || watched.has(worker)) return;
      watched.add(worker);
      worker.addEventListener('statechange', () => {
        if (owner !== registration) return;
        if (worker.state === 'redundant') {
          emit({ status: owner.active?.state === 'activated' ? 'ready' : 'error',
            message: '下载未完成，可重试。已有离线版本继续保留。' });
        } else inspect(owner);
      });
    });
  }
  async function retry() {
    if (state.status === 'desktop' || state.status === 'unsupported' || state.checking) return;
    emit({ checking: true, message: '' });
    try {
      const scope = new URL(base, location.href).href;
      const owner = await nav!.serviceWorker.register(new URL('sw.js', scope).href, { scope });
      if (owner.scope !== scope) throw new Error('scope');
      registration = owner;
      if (!owners.has(owner)) {
        owners.add(owner);
        owner.addEventListener('updatefound', () => inspect(owner));
      }
      inspect(owner);
      await owner.update();
    } catch {
      emit({ status: registration?.active?.state === 'activated' ? 'ready' : 'error',
        message: '暂时无法完成下载或检查更新。联网后可重试。' });
    } finally { emit({ checking: false }); }
  }
  return {
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    getSnapshot: () => state,
    start() {
      if (started) return; started = true;
      if (state.status === 'desktop' || state.status === 'unsupported') return;
      emit({ installed: window.matchMedia('(display-mode: standalone)').matches });
      window.addEventListener('online', () => emit({ online: true }));
      window.addEventListener('offline', () => emit({ online: false }));
      window.addEventListener('beforeinstallprompt', event => {
        event.preventDefault(); installEvent = event as InstallEvent; emit({ canInstall: true });
      });
      window.addEventListener('appinstalled', () => { installEvent = undefined; emit({ installed: true, canInstall: false }); });
      void retry();
    },
    retry,
    async install() {
      const event = installEvent; if (!event) return;
      installEvent = undefined; emit({ canInstall: false });
      try { await event.prompt(); await event.userChoice; }
      catch { emit({ message: '也可以使用浏览器菜单添加到主屏幕。' }); }
    }
  };
}
