# 发布重试与主线前移 · 2026-10-17

v1.4.0 的正式程序与公开下载已验收。后续复查 [38912659768](https://github.com/AureliusWu/Circuit/actions/runs/38912659768) 时，Web/PWA 和 Windows 安装、交互、卸载均成功，发布任务却在比较 main 与原构建提交时退出 1：主线已向前推进。旧流程还会把已经公开的同版本重试记为失败。

`scripts/release-preflight.mjs` 在创建发行前只读判断：过期构建返回 `superseded`，已公开且仍有标签的版本返回 `published`，这两种情况成功退出并保留已测工作流附件；只有当前 main 的版本同时没有 Release 与标签时才允许创建。草稿、孤立标签与缺失标签的异常状态仍失败，留给明确的恢复流程。401、403、429、500 和损坏 JSON 均不能被当作“尚未发布”，仅确认的 404 表示不存在。

新增六项回归，随 `npm test` 执行。本轮 83 项全部通过，TypeScript、生产构建与 96 项 PWA 预缓存生成通过。玩家运行文件、存档、剧情、素材和 v1.4.0 标签保持既有字节；本次改动只维护后续发布行为。本地未执行 Windows 安装；原 v1.4.0 的平台结果继续以 [原发布回执](PUBLISHED-v1.4.0.json) 为准。新 main 的远端任务结果另行核对，不用本地逻辑检查替代实际发布执行。

## 当前维护提交的云端结果

提交 `d05b2a4` 的 [CI 39003852573](https://github.com/AureliusWu/Circuit/actions/runs/39003852573)、[双端发行构建 39003852587](https://github.com/AureliusWu/Circuit/actions/runs/39003852587) 和 [Pages 39003852572](https://github.com/AureliusWu/Circuit/actions/runs/39003852572) 全部成功。发布任务实际返回 `published`，正常结束；本轮 Windows NSIS 安装、实际应用交互和卸载同样通过。再次读取正式 Release，原发行 ID 及八个附件的 ID、名称、大小、摘要全部未变。见 [云端回执](RELEASE-PREFLIGHT-20261017.json)。
