# 2026-10-31 Pages 安装等待修复

失败运行 `41169181813`：源码 `20ecf6910614acd6faaee7f381eb0853eb10cb3b`。
构建和 Pages 发布成功，线上入口及 Worker 与构建逐字节一致；首屏在等待当前注册 activated 时用尽固定 90 秒。

当前生产构建有 496 条预缓存、约 25.4 MiB。锁定的 Workbox `PrecacheController.install` 逐个请求条目，不能把固定 90 秒认作资源安装上限。

复验现在记录当前 scope 的 Worker 状态与缓存条目进度，最多等 300 秒，连续 60 秒无进展即失败。必须实际 activated；随后仍验证当前 Worker 控制、全部离线音频、三种视口的实际游玩、存档、断网重开与解码。HTTP 错误和请求失败随报告保留。部署 job 最多 20 分钟，容纳三个独立浏览器 profile 的完整首次安装。

未修改玩家源码、Worker、缓存身份、版本或存档。未用 skipWaiting、清除缓存或绕过离线门槛。

本地：4 项激活等待回归通过，Python 编译与 `git diff --check` 通过；`CIRCUIT_BASE_PATH=/Circuit/ npm run build` 成功。源码快照的 npm 全量检查最初因未检出的 `assets_source` 失败，此项以远端完整 checkout 的 npm test 为准。实际线上复验结果以本修复提交的 Pages 工作流为准。
