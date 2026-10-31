# 回路 / Circuit

<!-- project-badges:start -->
[![Version](https://img.shields.io/github/v/tag/AureliusWu/Circuit?sort=semver&style=flat-square&label=version)](https://github.com/AureliusWu/Circuit/tags) [![Build](https://github.com/AureliusWu/Circuit/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/AureliusWu/Circuit/actions/workflows/ci.yml) [![Last commit](https://img.shields.io/github/last-commit/AureliusWu/Circuit?style=flat-square)](https://github.com/AureliusWu/Circuit/commits/main)
<!-- project-badges:end -->

当前正式版：`1.10.1`。十一章完结，PWA + Windows x64。

城市配电抢修题材的中式民俗悬疑 AVG。梧城电网抢修员程砚与徒弟季宁在夜班中追查“十三号”、头七、旧工单和一场七年前救援留下的异常回路。

[在线游玩](https://aureliuswu.github.io/Circuit/) · [v1.10.1 Release](https://github.com/AureliusWu/Circuit/releases/tag/v1.10.1)

## 当前内容

- 十一章、467 个剧情节点、55 条现场证据，两部故事均已完成结局。
- 场景调查、证据门槛、多步推理与可重试错误结局。
- 角色立绘、场景、CG、离线人物语音与原创场景音效。
- 自动进度、3 个手动槽、城市线路档案与 JSON 存档导入导出。
- PWA 离线运行、横竖屏适配与 Tauri 2 Windows 桌面封装。

## 开发与验证

需要 Node.js 20+：

```bash
npm ci
npm test
npm run build
npm run preview
```

Windows：

```bash
npm run tauri dev
npm run tauri build -- --bundles nsis -- --locked
```

## AI / 维护者入口

修改前先读 [AGENTS.md](AGENTS.md)。

- 游戏设计与故事：`docs/GAME_DESIGN.md`、`docs/STORY_BIBLE.md`。
- 章节创作：`docs/CHAPTER_AUTHORING.md`。
- 当前验收边界：`docs/production/PROJECT-ACCEPTANCE.md`。
- 跨仓制作：`docs/production/VN-WORKFLOW-R1.md`、`.vn/workflow.json`。
- 当前发行与机器证据：GitHub Release 与 `docs/production/`。

调查、证据、推理、章节解锁和存档身份是核心契约。Windows 构建成功、浏览器模拟或素材清单通过都不能冒充真实平台 / 内容验收。历史版本、下载回读和四作共存流水不要重新堆进 README。

许可与素材来源按仓库现有 LICENSE / CREDITS / 来源文档执行。