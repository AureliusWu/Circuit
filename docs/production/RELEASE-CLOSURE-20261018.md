# 2026-10-18 · v1.4.1 发布回读

运行提交 `4804ef978e1932243c838cf296d77769f70d8d89` 已发布，公开版本和既有资产保持不可覆盖。[发行与下载](https://github.com/AureliusWu/Circuit/releases/tag/v1.4.1) · [在线游玩](https://aureliuswu.github.io/Circuit/)。

[Build 39104183135](https://github.com/AureliusWu/Circuit/actions/runs/39104183135)、[CI 39104837356](https://github.com/AureliusWu/Circuit/actions/runs/39104837356)、[Pages 39104837207](https://github.com/AureliusWu/Circuit/actions/runs/39104837207) 均成功。逻辑 88 项；浏览器 PWA 6 groups plus full existing campaign/reading/voice regression。Windows 范围：NSIS installed executable and native Tauri checks passed in release workflow。

本轮在工作流之外匿名读取所有 7 份公开附件，实测字节数和 SHA-256 与服务端 digest 一致，校验表逐行相符，PWA ZIP 全项 CRC 通过。下载 ZIP 适用于根路径，线上构建适用于 /Circuit/；Pages 工作流已将线上入口、worker 与同部署参数重建的产物逐字节核对。测试补充提交 `73001eb` 只改变回归脚本，完整 CI 通过，不移动已公开的运行标签。

逐项附件摘要及线上入口/worker 摘要保存在 [发布凭据](PUBLISHED-v1.4.1.json)。v1.5.0《取号》剧情、美术和音效仍待制作。
