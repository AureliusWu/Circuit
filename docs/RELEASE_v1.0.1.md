# v1.0.1 · 全量美术重绘

六幅场景、六名人物与应用图标全部使用内置图像生成能力重绘。背景保留既有场景机位与调查对象，统一中国旧城夜间抢修的材质和低照度光影；人物采用半写实手绘成年比例，各自保留年龄、服装与识别特征。

- 以 1600 × 900 WebP 背景与 640 × 960 透明 WebP 立绘替换发布用 SVG，12 幅插画合计约 2.38 MiB。
- 标题、剧情、章节缩略图与人物立绘直接引用新资源；网页、PWA 与 Windows 图标来自同一个新图标源。
- PWA 缓存加入 WebP，保留根路径与 GitHub Pages 子路径适配。
- 版本号同步到 npm、Tauri 与 Rust；存档结构、剧情节点和章节顺序维持既有格式。
- [预览全部美术](art/redraw-contact-sheet.jpg)，[查看提示词与来源](art/redraw-manifest.json)，[素材规格](ASSETS.md)。

## 验证记录

- `npm test`：55 项通过，0 失败。
- 生产构建与 GitHub Pages `/Circuit/` 构建通过，PWA 预缓存约 3.55 MiB。
- Chromium 六章、响应式、存储异常与离线回归：根路径 16 项通过，`/Circuit/` 子路径 16 项通过。
- 全部 13 项新美术在断网状态下解码通过；六名人物保持实际透明像素，未出现黑底图片。
- 阅读、自动播放、键盘、设置、存档导入导出与旧档迁移：19 项通过。
- 成品 SHA-256、尺寸、图片解码、单文件缓存预算、Windows RGBA PNG 与多尺寸 ICO 校验通过。
- 画面复核覆盖 1280 × 720、960 × 540、760 × 430 与 390 × 844。

完整检查摘要保存在 [verification.json](art/verification.json)。Windows 原生编译由 GitHub Actions 的 Windows 作业验证，本地环境不具备 Windows 构建工具链。
