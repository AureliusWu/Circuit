# 场景美术与音乐 · v1.6.0已发布 · 2026-10-20

《取号》的 slips 与 paperEdge 进入窗口特写，场景明确标记 eventCg，隐藏立绘。专属配乐使用原音乐总线，配音时压低；离开本章回到旧环境音乐。

## 来源

[新CG原图、提示词、参考与校验](../art/ticket-window-manifest.json)；[原创音乐配方与完整解码](../audio/ticket-window-score-manifest.json)。图像使用内置image_gen；音乐使用原创编配和程序合成，无外部录音或音乐模型。源文件与运行文件分离并随此检查点保存。

## 检查与断点

本地91项逻辑检查、TypeScript/Vite生产构建通过，新图与OGG已进入完整离线缓存。 新增异步播放检查覆盖迟到下载、重复配置、暂停上下文和离开场景；Rain另核对逐句CG切换和素材角色。

当前环境的Chromium下载返回截断包，未完成本轮浏览器交互，也未运行Windows包。仓库CI继续六种尺寸、离线新音频解码、原生源码/包和旧档检查。Rain新原生计划为37用例、498断言、87截图；前缀仍为7/149/33，仅为计划，不能记为已执行。

本轮未找到上一轮聊天所称未提交素材的可复用文件；本次四图四曲是新生成并独立登记的批次，不记作此前18句配音已恢复。真人试听与最终视觉选择待体验。[精确检查点](SCENE-MEDIA-20261020.json)。

## 可复用办法

SceneLoop把本地OGG接到已有音乐总线，异步解码结束后重新核对场景与上下文，避免旧场景迟到开播；同一曲目不重复启动。按作品保留独立编配与CG，只交流工具及制作方法。新增OGG要同时核对实际缓存清单，图片只在对应物品出现后显示，收走后恢复场景。

## 本版发布回读

[本版 Build](https://github.com/AureliusWu/Circuit/actions/runs/39380567388) 的网页完整路线、六尺寸事件 CG、离线 OGG 解码，以及实际 Windows 安装、交互和卸载全部通过；[CI](https://github.com/AureliusWu/Circuit/actions/runs/39380567406) 与 [Pages](https://github.com/AureliusWu/Circuit/actions/runs/39380567343) 成功。[v1.6.0 下载](https://github.com/AureliusWu/Circuit/releases/tag/v1.6.0) 已公开。独立重新下载七项公开附件，文件大小、SHA-256 全部匹配 GitHub 摘要；PWA ZIP CRC 正常，新增 CG 和 OGG 逐字节匹配已测源文件。

较早“本地未执行”保留为本地环境边界；本段记录当前 CI 的实际结果。同源联合检查中，三作的缓存与存档均保留；Rain 网页已到 1.4.0，旧检查却要求桌面正式版 1.3.1，因此失败。检查改为核对 Rain 当前部署的官方 WASM worker 版本，联合结果另行记录。真人试听与美术最终选择仍待体验。
