import { useSyncExternalStore } from 'react';
import { pwa } from '../pwa';
import { version } from '../../package.json';
export function PwaPanel() {
  const state = useSyncExternalStore(pwa.subscribe, pwa.getSnapshot);
  return <div className="help-content" aria-label="安装与离线状态">
    <h3>回路 v{version}</h3>
    {state.status === 'desktop' ? <p>当前为桌面客户端，游戏资源已随客户端提供。</p> : <>
      <p role="status">{state.status === 'ready' ? '离线资源已就绪' : state.status === 'downloading' ? '正在下载离线资源，请保持联网' : state.status === 'error' ? '离线下载未完成' : '当前环境不支持离线安装'}</p>
      <p>{state.online ? '当前在线' : '当前离线'} · {state.installed ? '已以应用窗口打开' : '浏览器窗口'}</p>
      <p>首次缓存完成后可断网重开。安装到桌面与离线资源下载分别完成；浏览器清理站点数据后需要重新下载。</p>
      {state.canInstall && <button onClick={() => void pwa.install()}>安装到桌面</button>}
      {!state.canInstall && !state.installed && <p>支持安装的浏览器可从菜单添加到主屏幕或桌面。</p>}
      <button disabled={state.checking || !state.online || state.status === 'unsupported'} onClick={() => void pwa.retry()}>{state.checking ? '正在检查' : state.status === 'error' ? '重试下载' : '检查更新'}</button>
      <p>{state.message || '新版本下载完成后，关闭所有本作窗口，再次打开即可使用。'}</p>
    </>}
  </div>;
}
