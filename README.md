# 回路 / Circuit

> 城市配电抢修题材的中式民俗悬疑 AVG · v1.0.0 第一部 / 归档闭合

你是梧城供电公司的基层配电运检员。一张七年前的工单，把一次深夜抢修引向被删去的住户、未登记的应急旁路，以及一场没有完整归档的救援。先查清电从何处来，再问谁还在等待。

第一部包含六章：《十三户》《头七》《回送》《长明》《零线》《闭合》。共 268 个剧情节点、30 条现场证据、12 个可重试的错误结局和六个标准章节结局；各分支正文合计约 2.7 万字符。终章回应救援事故与人的责任，未知物理线路保持隔离。尚未以真人游玩测定通关时长。

- 场景热点调查、证据门槛和多步推理；谜题的判断依据来自现场记录。
- 按章节完成顺序解锁，重玩保留城市线路档案。
- 独立自动进度与三个手动槽，JSON 导入/导出；兼容 v0.1.0 / v0.1.1 本地存档。
- 抢修日志、文字速度、自动阅读、音量、静音、高对比与减少动态效果。
- 六幅场景（槐荫巷已升级为图像生成工具制作的半写实背景）、六名成年人物 SVG 立绘，以及实时合成的音乐、雨声、电流声和提示音。
- PWA 离线运行、横竖屏布局和键盘操作；Tauri 2 Windows 桌面封装。

## 在线游玩

GitHub Pages 地址：[https://aureliuswu.github.io/Circuit/](https://aureliuswu.github.io/Circuit/)。`main` 推送后由 `pages.yml` 构建并部署；首次部署会尝试自动启用 Pages。网页使用 `/Circuit/` 资源路径，普通本地构建与桌面构建继续使用根路径。

## 开发与构建

需要 Node.js 20 或更新版本。云环境执行命令前，先 `source /workspace/.circuit-env/activate.sh`。

```bash
npm ci
npm run dev
```

```bash
npm test
npm run build
npm run preview
```

生成包含完整 PWA、说明文件及 SHA-256 的 Web 发行包：

```bash
npm run package:web
```

输出 `artifacts/circuit-web-1.0.0.zip`。解压后使用 HTTP 服务运行，不能直接双击 `index.html`；安装 PWA 需要 HTTPS 或 localhost。首次联网加载并完成缓存后可离线继续游玩。

Windows 原生构建需 Rust、Visual Studio C++ 工具和 WebView2：

```bash
npm run tauri dev
npm run tauri build -- --bundles nsis -- --locked
```

`package-lock.json` 与 `src-tauri/Cargo.lock` 固定依赖。CI 验证 Web 与 Windows 编译；`release.yml` 在手动触发或 `v*` 标签上生成 Web 包与 Windows NSIS 安装器，作为工作流附件供审阅。工作流不自动公开发布，也不配置代码签名。

## 操作与存档

点击场景标记观察，确认后加入现场记录；收齐必要记录才能进入判断。错误结局可重新排查。空格或 Enter 显示全文，随后推进单一对话；Tab 切换控件，Esc 关闭面板。自动阅读停在调查、推理和结局处；打开面板、返回标题或切换标签页时暂停。

每次剧情操作更新自动进度。读取任意槽位只恢复内存，下一次操作才更新自动槽；新开游戏保留三个手动槽。旧存档读取时只做内存迁移，不改写原记录。损坏数据保留并提示，存储不可用时仍可继续游玩。导入仅接受完整校验通过的 v1.0 JSON，并替换自动进度；建议先保存重要进度到手动槽。清除站点数据会删除本地进度，操作前可导出。

历史记录保留本章最近 200 条实际经过。不同端口、浏览器、PWA 与桌面窗口使用各自来源的存储；导出/导入用于转移进度。

## 浏览器回归

需要 Python Playwright 和 Chromium。先启动上述开发服务或生产预览，再执行：

```bash
python3 tests/release-browser.py http://127.0.0.1:5173
python3 tests/release-browser.py http://127.0.0.1:4173 --pwa
python3 tests/reading-browser.py http://127.0.0.1:4173
```

默认使用 `/usr/bin/chromium`，其他安装位置可通过 `CIRCUIT_CHROMIUM` 指定。生产离线检查需完成 `npm run build` 并在 4173 端口启动预览。测试从章节数据计算合法动作路径，再通过真实界面推进六章；内容测试同时穷举节点与证据状态，验证所有结局可达、无死路和跨章节存档证明。

## 文档

- [发行说明与验证记录](docs/RELEASE_v1.0.0.md)
- [章节内容与存档规范](docs/CHAPTER_AUTHORING.md)
- [原创素材说明](docs/ASSETS.md)
- [开发路线](docs/ROADMAP.md)
- [玩法规范](docs/GAME_DESIGN.md)、[世界观](docs/STORY_BIBLE.md)、[美术规范](docs/ART_BIBLE.md)
