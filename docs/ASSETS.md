# 美术资源目录 · v1.2.0「回访」

本轮使用内置图像生成能力新增14项美术：程砚、季宁的基础立绘与表情各一套、老周现场防护立绘、八名角色的 Q 版形象及抢修车场景。v1.0.1重绘的其余场景、人物和应用图标继续使用。

当前26幅游戏插画合计 **3,692,756字节，约3.52 MiB**。背景1600×900，成年立绘640×960，Q版640×640，均以WebP交付。新资源quality 86、alpha quality 100；人物保留真实透明通道，Q版保留全身与完整脚部。

## 场景

| 文件 | 内容与用途 |
| --- | --- |
| public/art/dispatch.webp | 雨夜值班室，接单、人员安排与出车登记 |
| public/art/alley.webp | 槐荫巷雨夜，标题与十三户调查 |
| public/art/substation.webp | 配电院与关闭的电柜，零线调查 |
| public/art/demolition.webp | 城南拆迁围院，旧支路与门牌调查 |
| public/art/stairwell.webp | 老楼道、灯、椅子与继电器，清河里与长安里 |
| public/art/control-room.webp | 旧城技术核对与档案空间 |
| public/art/repair-van.webp | 师徒共同出车、对时、整理资料和回程，新增 |

## 成年人物与变化

| 文件 | 角色与用途 |
| --- | --- |
| public/art/portraits/cheng.webp | 程砚32岁，白盔、系紧下颏带、深蓝与暗橙工服、胸前电台 |
| public/art/portraits/cheng-focused.webp | 程砚专注复核表情，保持同一人物与姿态 |
| public/art/portraits/ji.webp | 季宁23岁，短发、黄盔、平板与现场记录册 |
| public/art/portraits/ji-concerned.webp | 季宁警觉提问表情，保持同一人物、装备和姿态 |
| public/art/portraits/zhou.webp | 老周50岁，灰发、旧工装，档案目录与室内场合 |
| public/art/portraits/zhou-field.webp | 老周现场版，白盔、下颏带、长袖反光雨衣与电台 |
| public/art/portraits/lin.webp | 林岚30岁，值班耳麦与职业夹克，远程或室内联络 |
| public/art/portraits/mei.webp | 杨桂梅60岁，灰发、布围巾与针织衣 |
| public/art/portraits/xu.webp | 许守成2019年35岁，眼镜与旧工服，明确标为旧档照片 |
| public/art/portraits/chen.webp | 陈伯60岁，旧帽、看守夹克与钥匙 |
| public/art/portraits/shen.webp | 沈棠28岁，长外套、灰绿围巾与折纸 |

## Q版人物目录

| 文件 | 人物特征与道具 |
| --- | --- |
| public/art/chibi/cheng.webp | 程砚，白盔、电台与闭合工具箱，统一画风母版 |
| public/art/chibi/ji.webp | 季宁，黄盔、平板和记录册 |
| public/art/chibi/lin.webp | 林岚，耳麦、夹板和笔 |
| public/art/chibi/zhou.webp | 老周，灰发、折叠附页与文件包 |
| public/art/chibi/mei.webp | 杨婶，针织衣、围巾与票据铁盒 |
| public/art/chibi/xu.webp | 许守成，方框眼镜、旧工服与笔记本 |
| public/art/chibi/chen.webp | 陈伯，旧帽、钥匙与卷起的地图 |
| public/art/chibi/shen.webp | 沈棠，长外套、绿灰围巾与旧信 |

Q版沿用程砚母版的比例、眼部处理、纸感笔触和低饱和配色。立绘负责正剧，Q版用于“人物与抢修队”目录；人物选择与视图切换不改变游玩进度。

## 图标

public/icon.png及public/icons/192x192.png、512x512.png延续上一轮断环与暗红闪电；src-tauri/icons/128x128.png和icon.ico使用同源图标。Windows PNG为RGBA，ICO保留多尺寸。无需在人物迭代中重复替换已完成的品牌图形。

## 来源与校验

- [本轮预览](art/patrol-contact-sheet.jpg)与[生成清单](art/patrol-manifest.json)：14项实际提示词、参考来源、生成源SHA-256、发布文件SHA-256、尺寸、大小与透明信息。
- [上一轮全量预览](art/redraw-contact-sheet.jpg)与[上一轮清单](art/redraw-manifest.json)：原六场景、六人及图标的来源。
- [本轮验证记录](art/patrol-verification.json)：单位测试、浏览器回归、存档结构与离线素材检查。
- [立绘档案界面](art/characters-portrait-preview.jpg)、[Q版档案界面](art/characters-chibi-preview.jpg)。

所有角色、单位和事件均为虚构，没有以真人照片、真实企业标识或第三方素材包为来源，不指定工具未暴露的模型型号。生成清单支持延续设计方向，重新生成不保证逐像素复现。本文件不额外指定素材许可证。

## 接入与离线

角色定义集中在src/game/characters.ts，剧情用角色标识、表情和在场方式选择素材。现场立绘、远程通讯卡和2019旧档照片分别呈现；所有图片由Vite基路径统一解析，兼容根路径、桌面与/Circuit/。

PWA首次联网完成缓存后，26幅插画和应用图标全部可离线解码。精确证据文字、工单、读数、按钮和热点由应用层提供，城市路线图按归档进度由程序绘制。旧SVG与大尺寸生成源不进入发行包。

## v1.2.0 新增6项

| 游戏文件 | 内容 |
| --- | --- |
| public/art/resettlement-lobby.webp | 槐荫新苑门厅，门禁/信箱/门槛调查 |
| public/art/property-office.webp | 物业夜班室，设备来源与原接收页核对 |
| public/art/portraits/cheng-wary.webp | 程砚警觉，保持原装备与身份 |
| public/art/portraits/ji-focused.webp | 季宁专注比较，保持原装备与身份 |
| public/art/portraits/luo.webp | 罗禾29岁，低马尾、值班本与三把钥匙 |
| public/art/chibi/luo.webp | 罗禾Q版，全身透明，延续人物目录画风 |

原始PNG存入assets_source/art/v1.2.0；完整提示词、身份参考、原图与成品SHA-256、尺寸、透明比例和转换配方见[本轮清单](art/return-visit-manifest.json)。背景1600×900、立绘640×960、Q版640×640。当前32幅游戏WebP约4.26 MiB；此前26幅素材保留。

人物语音与原创音效另见[AUDIO_GUIDE](AUDIO_GUIDE.md)，共43个MP3随PWA缓存。

## v1.3.0《应声》新增

新增public/art/communications-room.webp：旧通信间固定门口机位，旧电话、通信柜与搬迁档案盒。内置图像生成以物业夜班室仅作画风参考；原PNG保存在assets_source/art/v1.3.0，1600×900成品及原图校验见[制作清单](art/answering-manifest.json)。目前共33幅WebP、4,666,944字节，约4.45 MiB；新场景201,400字节。

新增三声电话铃与锁芯转动两项程序原创音效，源WAV保存在assets_source/audio/v1.3.0。32段人物配音原文件沿用，5处新节点明确播放同一旧文件；原录音请求与成品哈希不变。当前45个MP3全部进入离线缓存，人物语音和音效详情见[AUDIO_GUIDE](AUDIO_GUIDE.md)。

## v1.4.0《来访》新增

新增旧回迁接待站1600×900背景和罗禾警觉640×960透明立绘，内置图像生成分别参考旧通信间画风和罗禾身份。原PNG保存在assets_source/art/v1.4.0，完整提示词、引用来源、真实alpha比例和哈希见[清单](art/visitors-manifest.json)。目前35幅WebP共5,045,206字节，约4.81 MiB；[新章现场](art/visitors-preview.jpg)与[手机调查](art/visitors-mobile-preview.jpg)来自真实浏览器。

玻璃敲击、取号纸撕裂、湿脚步为三项程序原创拟音，源WAV在assets_source/audio/v1.4.0，配方seed140014。人物录音原字节保持，两处明确重放旧文件；32段语音与16项音效共48个MP3全部进入PWA离线缓存。
