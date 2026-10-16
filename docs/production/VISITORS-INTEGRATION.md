# Circuit v1.4.0 · 来访与回看检索集成

2026-10-15。集成基线 `2c5ef615977141f40064b292706a4bbc10d0d35e`；《来访》来自 `a6e30763d10f2841cfdf13b899a928b8c0ac0036` 上的原制作检查点。

第九章《来访》39节点、5条证据、两轮推理及两个可重试错误结局恢复接入，沿用原背景、罗禾警觉立绘、三项音效和录音绑定；原素材与参考字节均通过既有清单哈希核验。本批次未重新生成美术、语音或剧情。

现场记录的列表保留 v1.3.1 关键词检索；取得两条记录后可并排核对。两种视图均只接收本章已取得的证据，记录重听沿用原声源。抢修日志继续按关键词、人物、地点与时间检索。战役存档版本、自动槽和手动槽身份沿用。

## 当前集成验证

当前树已重新执行 77 项逻辑测试、TypeScript/Vite 生产构建、152 份音频源/成品全量解码。旧字体遗漏《来访》20个汉字，本批次以原 URL 和相同 SHA-256 的 Noto Sans SC 源字重建；[字体记录](VISITORS-FONT.json)保留新字节哈希，原 HISTORY-FONT.json 保持不变。CI 新增只读 `python scripts/subset-font.py --check`，随正文扩写检查字库覆盖。

当前横屏面板修复及85项浏览器执行范围见 [PANEL-REVIEW.md](PANEL-REVIEW.md)，中断前验证与恢复后检查分别记录。`docs/evidence/v1.4.0-*` 原报告来自2026-10-13检查点，保留为历史制作证据；不作为本批次通过证明。Windows 编译、公开 PWA、真人计时与试听均以各自实际执行结果为准。

## 正式发布回执

2026-10-16，v1.4.0《来访》已发布。[正式构建](https://github.com/AureliusWu/Circuit/actions/runs/38912659768)的 Windows/Web 门禁已通过；[同源完整 CI](https://github.com/AureliusWu/Circuit/actions/runs/38912659414) 和 [公开站点验收](https://github.com/AureliusWu/Circuit/actions/runs/38912659619) 均成功。真实 Windows NSIS 安装、已安装窗口交互、两次正常关闭、同档重开、WebView2 全部相关进程自然退出、临时 profile 严格清理与卸载已完成；桌面、手机竖屏和短横屏公开 PWA 离线恢复与语音解码通过。8 个公开附件均已匿名下载且与 GitHub 摘要一致；其中安装器、Web 包、两个 sidecar 与原运行记录这五份原文件同原正式构建逐字节一致；新增 SHA256SUMS-public.txt 的七行按实际公开文件名直接通过 GNU 校验。原发行构建的 Windows/Web 门禁通过，末尾旧文件名校验失败已由独立[发布收尾](https://github.com/AureliusWu/Circuit/actions/runs/38914869819)完成，原标签与七个附件的 ID/字节均保留。完整提交、附件字节和实际运行记录见 [PUBLISHED-v1.4.0.json](PUBLISHED-v1.4.0.json)。实体手机体验、真人计时与试听、历史原生版本安装升级仍单独待验。
