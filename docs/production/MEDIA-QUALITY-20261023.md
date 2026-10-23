# 四作发布后素材质检与审阅 · 2026-10-23

四作稳定发行后的新一轮只读质量检查已经完成。实际检查 1,356 条对白绑定、128 张美术，包含完整制作批次的 46 张新图；全部媒体与对应不可变发行提交一致。未发现文件摘要不符、音频 / 图片解码失败、整段静音、无效采样、采样超限或未声明的异文音频复用。

| 作品 / 审阅目录 | 版本 | 对白绑定 | 美术 | ASR 差异优先试听 | 画布边缘优先查看 | 首静音偏长 | 客观错误 |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| [Rain](https://github.com/AureliusWu/Rain/tree/main/docs/production/quality-20261023) | 1.6.0 | 306 | 25 | 16 | 7 | 0 | 0 |
| [Healing](https://github.com/AureliusWu/Healing/tree/main/docs/production/quality-20261023) | 1.4.0 | 427 | 36 | 42 | 1 | 1 | 0 |
| [NetLove](https://github.com/AureliusWu/NetLove/tree/main/docs/production/quality-20261023) | 1.0.0 | 220 | 16 | 15 | 0 | 0 | 0 |
| [Circuit](https://github.com/AureliusWu/Circuit/tree/main/docs/production/quality-20261023) | 1.8.0 | 403 | 51 | 57 | 21 | 0 | 0 |

160 项是审阅线索，未将其认定为错读或美术缺陷。130 项来自录制时 ASR 转写差异；已有逐音节同音复核的情况单独保留。29 张人物图触及画布边缘，缩略总览可见 Rain 及 Circuit 多数为既有半身构图；其是否需要修改仍由实际场景审阅决定。Healing 的 `healing-draft-safe--007`（「我……就是路过。」）在 -45 dBFS / 20 ms 分析窗口下有约 0.82 秒首静音，保留犹豫表演并加入试听队列，未擅自裁切。

## 如何集中审阅

每仓的 `docs/production/quality-20261023/media-review.html` 可在完整仓库中直接打开，不必安装依赖或启动服务器。默认读取本地音频和画面，也可选择联网读取固定发行提交的素材。按人物、场景、关键词、优先项或待审 / 通过 / 需修改筛选；切换条目先停止上一段音频。备注写入独立本机记录，可导出 JSON；导入严格核对作品、版本提交、素材目录摘要和每个素材 ID，拒绝异版记录。

全部条目初始待审。自动化测试使用临时浏览器状态，结束后清除测试标记；它不填写真实人工验收，也不接触游戏存档。真人听感、情绪、场景构图、实体设备、有效阅读计时及最终创作定案保持用户统一后续。

## 本轮实际验证

- `test_media_quality.py`：15 项回归通过，覆盖已知振幅、全静音、无效采样、末尾不足一个窗口的有效声音、首尾静音、隐藏的重复绑定、损坏音频、透明图片、跨目录路径和冻结版本变更拒绝。
- 四作原有 `validate_runtime.py --require-complete` 均通过；本轮另对全部运行配音实际解码、测量信号，并完整解码全部 128 张图。
- Chromium 153.0.8010.0：每作 13 项浏览器检查，共 52 项；实际播放原音频、切项停止、图片加载、筛选、记录持久化、JSON 导出 / 导入及直接打开本地文件通过，页面异常为零。桌面 1440×900 与手机视口 412×915 的实际预览、SHA-256 和检查记录各仓留档。
- 已查看四作全部 128 张美术的缩略总览，并复核审阅工具桌面 / 手机排版。该总览不是逐图最终创作批准。
- 修正 Healing 根更新日志仍指向 1.3.0 的当前版本入口，改为实际已发布的 1.4.0。

测得全分支逐绑定音频合计约 75.22 分钟，其中含分支和重播，不能当作通关时长。采样峰值不等于真峰值，信号 RMS 不等于 LUFS；既有 ASR 未重新识别。母版、运行录音、图片、播放器、剧情、存档与既有发行包保持原字节。

## 复用工具

在装有 FFmpeg、numpy、Pillow 的作者环境中，使用本仓工具读取任意一个作品：

```sh
python tools/production/audit_media_quality.py --root ../Rain --output ../Rain/docs/production/quality-review
python -m unittest discover -s tools/production -p 'test_media_quality.py' -v
```

工具以作品当前 `RELEASE-READINESS-20261022.json` 中的完整运行提交锁定输入；工作区媒体或清单变化时拒绝冒用旧发行身份。输出目录应在运行媒体目录以外。实际浏览器检查需要 Python Playwright 与其 Chromium，可用 `--browser` 指定已安装浏览器：

```sh
python tools/production/review_media_browser.py --root ../Rain
```

`review_media_browser.py` 检查本次固定目录 `quality-20261023`，不启动或发布游戏。后续重建 HTML 会重置生成报告的附录，审阅记录应通过独立 JSON 导出保留。不同作品的专属素材只在各仓使用，通用质检方法集中维护于 Circuit。
