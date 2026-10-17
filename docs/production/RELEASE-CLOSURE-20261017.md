# 回路 v1.4.0 更新与推送闭环 — 2026-10-17

当前更新的源码推送、构建、发行附件和网页部署已完成核验，版本为 **v1.4.0（正式版）**。[发行页](https://github.com/AureliusWu/Circuit/releases/tag/v1.4.0) · [在线游玩](https://aureliuswu.github.io/Circuit/) · [机器回执](RELEASE-CLOSURE-20261017.json)。

| 环节 | 核验结果 |
| --- | --- |
| 主线 | 已审计 `main` 提交 `796758d2117e3be5c28b371b564574c91f14bdcb`；无开放 PR，无尚未发布的玩家程序差异 |
| 发行身份 | `v1.4.0` → `a95ed6de62389b8fdbb401e280d956bfdd1dfe58`；公开且非草稿，prerelease 为 `false` |
| 下载 | 全部 8 份附件的字节数、SHA-256 与当前 GitHub digest 一致；13 条 checksum 记录一致 |
| 压缩包 | 1 个 ZIP 完整 CRC、路径和重复项检查通过 |
| 线上 | index.html 与离线 worker 共 2 份文件均为 HTTP 200，字节与已验证构建一致 |

全部附件均匿名重新下载并计算摘要。历史安装器 checksum 中的“回路 Circuit”文件名按实际公开名 Circuit 映射；新增公开名清单的 7 行逐项通过。逐份附件 ID、大小、摘要、检验方法及压缩包条目数保存在机器回执。入口与 worker 对照已成功部署的 Pages 构建回执；本地根路径 Web ZIP 使用不同的 base，单独核验其下载摘要。

本轮及原版本的程序验证：原版本的 Windows NSIS 安装、启动、同档重开及卸载已通过；本轮 83 项单元测试、构建与发布预检回归通过。证据见 [PUBLISHED-v1.4.0.json](PUBLISHED-v1.4.0.json) 和 [本轮实现/复验记录](RELEASE-PREFLIGHT-20261017.md)。

| 必需工作流 | 结论 | 已验证提交 |
| --- | --- | --- |
| [CI](https://github.com/AureliusWu/Circuit/actions/runs/39003852573) | success | `d05b2a43f456` |
| [Build release artifacts](https://github.com/AureliusWu/Circuit/actions/runs/39003852587) | success | `d05b2a43f456` |
| [Deploy playable game to GitHub Pages](https://github.com/AureliusWu/Circuit/actions/runs/39003852572) | success | `d05b2a43f456` |

该回执是在表中已审计主线之后追加的文档提交；原版本 tag、发行附件及玩家程序保持原有身份。闭环范围为本轮工程更新、推送、发行和线上一致性。完整玩家阅读与实体设备体验按原验收范围记录。
