# 章节内容、进度与存档规范

六章内容分别位于 `src/story/chapters/`；`engine.ts` 统一读取章节、筛选动作、执行跳转并验证剧情图，React 不按剧情节点名分支。

## 章节结构

`Chapter` 包含 `id / order / title / subtitle / synopsis / entryNode`、章节内的 `evidence / nodes / requiredEvidence`，以及城市线路档案的 `clue`（编号、详情与地图坐标）。节点 ID 和证据 ID 是章节内字符串；章节 ID 是六项联合类型。扩展章节需更新类型和 `CHAPTER_ORDER / CHAPTERS` 注册。

节点 `kind` 为 `title / dialogue / investigation / evidence / choice / puzzle / ending`。`text / location / time / speaker / progress` 描述叙事；`scene.background` 引用本地场景，`portrait` 使用src/game/characters.ts注册的八个人物ID，`expression`选择该角色实际具有的表情或现场版本。`presence`为scene（现场）、radio（远程通讯卡）、archive（2019旧档照片），默认现场；验证器拒绝未知人物、不可用表情或无人物的展示标记。`scene.hotspots` 关联同节点的动作 ID，坐标为场景百分比；文档、题字和调查目标也由节点声明。谜题提供 `puzzle.prompt / hint`，结局提供 `outcome: failure | complete`。

动作通过 `id / label / next` 声明跳转。`collect` 在确认时收集证据，观察本身不收集；`hidesWhenCollected` 隐藏已调查入口，`requiresEvidence` 按具体集合解锁。`resetEvidence` 用于本章重开。节点的 `requiresEvidence / excludesEvidence` 同样约束恢复和跳转状态。标准结局必须要求所有 `requiredEvidence`，序章的两条额外记录不替代三条核心记录。

每章至少包含两条可重试错误结局、一个标准结局，以及有现场依据的推理。谜题中不得要求玩家拥有前置节点尚未提供的信息。任意顺序调查的支线不能提前断言另一路线才核实的事实。

## 跨章节进度

`campaign.ts` 保存当前 `state / history`、已完成章节的有序前缀 `completed`，以及每章证据 `archive`。只有满足必要证据的标准结局能够完成本章并解锁下一章；失败不解锁。重玩清空本章当前调查，保留先前完成证明，并合并额外发现。

人物目录的选择与立绘/Q版切换只影响查阅，不写游玩进度。城市图仅显示已完成章的线索细节。完成证明必须有相应档案证据，不能用跳过章节、未知证据或伪造未来编号生成线路进度。

## 存档格式与兼容

v1.0 / v1.1 使用 `version: 2` 的扁平 JSON：`chapterId / nodeId / evidence / history / savedAt / completed / archive`。

- 自动槽：`circuit-auto-v100`。
- 三个手动槽：`circuit-slot-v100-1 / -2 / -3`。
- 阅读设置：`circuit-settings-v100`。
- 缺少新版自动槽时，读取旧 `circuit-auto-v011`。
- 缺少新版槽 1 时，读取旧 `circuit-save-v011`，再兼容 `circuit-save-v010`。
- 槽 2、3 不回退。新版槽损坏时不偷偷读取另一个旧进度。

旧版模块 `saves.ts` 保留 v0.1.x 校验和迁移逻辑。序章原有节点 ID 与三条核心证据保持兼容，旧标准结局可以在内存中建立完成证明。读取、组件挂载和设置加载都不写存储；明确推进、保存、导入或修改设置才写相应键。损坏记录保留，失败写入不覆盖其他槽位。

历史按实际访问顺序追加，重复经过也记录；本章重开重新记录，最多 200 条，末项必须为当前节点。保存前调用 `completeChapter`，标准结局的持久化载荷必须已包含本章完成证明。

## 内容验证

```bash
npm test
npm run build
```

纯逻辑测试通过库存状态穷举检查引用、门槛、热点、可达性、无死路和六章通关；发行内容测试检查节点数量、正文规模、失败结局、完整结局以及本地资产引用。存档测试覆盖顺序证明、四槽隔离、只读迁移、损坏、配额失败和设置范围。

`tests/release-browser.py` 通过真实界面检查整个战役、菜单、存档、设置、输入、移动布局和生产离线缓存。添加新章节时，应保持图与内容检查，并增加真实通关覆盖。
