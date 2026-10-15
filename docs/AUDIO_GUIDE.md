# 人物语音与场景音效 · v1.3.0

游戏随包提供32段关键对白、13项场景音效。程砚、季宁、林岚、老周、杨婶、许守成、陈伯、沈棠和罗禾均有录音。正文仍按原节点显示，未配音部分照常阅读。

## 阅读时的控制

人物语音与场景音效各有音量；可单独关闭配音，也可全静音。当前节点支持重听、暂停和继续，历史中只显示实际经过节点的录音。自动阅读等当前录音队列结束，再按设置停留；调查、推理与结局仍由玩家操作。

打开面板会暂停当前录音；历史和已取得的声音证据可在面板中重听、暂停、继续与停止，页面隐藏时也暂停。换节点或返回标题停止旧录音并使迟到回调失效。文件不可用或浏览器拒绝播放时提示重听，正文、判断和存档继续可用。语音播放期间自动压低背景音乐与环境声。

## 制作来源

v1.2.0制作参考 [Rain离线语音实现](https://github.com/AureliusWu/Rain/tree/36504476c7cde3fcc0a8052db3c8fa67962d5a39/tools/audio_process)。配方来源MIT署名保留在third_party/Rain-MIT-LICENSE.txt。使用Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice，固定revision `0c0e3051f131929182e2c023b9537f8b1c68adfe`，qwen-tts0.1.1、torch2.9.1+cpu、CPU4线程、bfloat16、eager attention；每段记录speaker、角色、指令和seed。模型按其Apache-2.0许可使用，玩家包不含权重或Python。

| 人物 | 预设 | 演出方向 |
| --- | --- | --- |
| 程砚 | Dylan | 克制、普通话、正常夜班口语 |
| 季宁 | Vivian | 清楚轻快，提问和报记录 |
| 林岚 | Serena | 调度通话，利落报信息 |
| 老周 / 陈伯 | Uncle_Fu | 分别用中年与老年指令，低声说话 |
| 杨婶 / 沈棠 | Serena | 分别为老人嘱咐、年轻家属疲惫口语 |
| 许守成 | Dylan | 历史录音的短句询问 |
| 罗禾 | Vivian | 物业夜班，谨慎、偏低的声调 |

9名角色使用4个预设，通过各自指令、文本与seed区分，录音来自v1.2.0离线合成。年龄与人物身份仍由剧情、立绘和档案明确呈现，演技与名称读音待真人试听。

## 可复现的文件链

- docs/audio/voice-plan.json：唯一录音请求源，绑定chapter/node和正文精确片段。
- voice-provider.json：实际模型文件哈希、固定revision、wrapper、dtype和生成参数。provider-provenance-correction.json记录一次目录来源纠正，音频字节未改变。
- voice-manifest.json：每段请求SHA-256、时长、生成耗时、原始WAV/处理WAV/MP3的哈希与字节数。
- assets_source/audio/v1.2.0：原始与两遍EBU R128处理的24kHz单声道WAV，语音目标-20 LUFS / -2 dBTP / LRA6；游戏成品public/audio/voice使用96kbps MP3。
- 8段发音/停顿校准前的源录音保留在review-candidates，记录于voice-first-pass.json；初次独立转写也保留。
- tools/audio/generate_voice.py：离线作者生成器，只有完整请求指纹和全部文件哈希都匹配才复用缓存；--only用于明确指定重做片段。

门禁的“程砚，已经到场”在两个节点重用同一成品；“季宁，收到”排在第二段，自动阅读等待整段队列。车上的“先别替它确认”在结局再次出现，同样复用成品，保持剧情中描述的重复。

## 原创音效

13项为程序原创拟音：敲门、钥匙两轻一重、铁门、继电器断开、开关、门禁开麦、电台开麦、翻纸、落笔、来电、杯子落桌、三声旧电话铃与锁芯转动。固定seed与配方在tools/audio/generate_sfx.py，源WAV与游戏MP3分别保存；sfx-manifest.json记录出处和哈希，sfx-bindings.json对应实际剧情节点。音乐、雨声、电流声及原记录提示继续实时合成。

## 作者运行

```bash
# 作者环境；模型目录先下载固定revision，玩家无需执行。
python tools/audio/generate_voice.py --model-dir /absolute/path/to/qwen-custom
python tools/audio/generate_sfx.py --only telephone-ring,latch-turn --version 1.3.0
python tools/audio/validate_media.py
python tools/audio/check_asr.py --model-dir /absolute/path/to/faster-whisper-large-v3
npm test
```

依赖版本见tools/audio/requirements.txt；torch/torchaudio CPU构建从官方CPU索引安装。FFmpeg必需；ASR使用独立large-v3、CPU int8，不提供正文提示或hotwords。中阿拉伯数字先统一写法，原转写、字符误差和否定词计数逐条保留；标记review的片段需要进一步复听，自动结果不能判定演技或代替真人批准。

122份当前源/成品音频与24份校准前存档完整解码；PWA断网后逐个解码45份MP3。浏览器回归检查真实play/ended、暂停、重听、切页、音量、缺文件和自动阅读等待。实际记录见docs/audio各验证JSON；普通扬声器、手机设备与真人读音评审分别保留待校准。

本轮独立转写：32段中28段通过，4段标记review，分别为门禁程砚报到、罗禾说明红纸、季宁答到嘱咐及门禁季宁收到。转写存在姓名与同音字差异，原字句与音频均保留；不将自动转写标记视作演员表演已获批准。

## v1.3.0 重复片段与证据查阅

本轮新增两项程序音效，源WAV在assets_source/audio/v1.3.0；旧32段配音及其请求、模型清单、处理源和MP3保持原字节。`VOICE_REPLAYS`把五个既有片段接到《应声》：柜边程砚声音、罗禾旧问题、电话第一声与第二声、离场前季宁播放的答到嘱咐。新章节里的重放引用原成品，未宣称生成新演员录音。

《回访》两条、《应声》两条声音证据有重听按钮，《应声》的回拨导入证据包含两个样本。只有完成对应调查并确认收集才显示；原录音先在正文出现，听觉受限时可用已给出的字幕与时标解题。声音判断不要求音高辨识或耳机定位。暂停与停止控制同时出现在证据与历史面板，静音和关闭配音时按钮禁用。

本轮未重做ASR；原32段的读音校准结果仍见原报告。两项新程序拟音验证完整解码和哈希，重听的实际MP3通过浏览器及PWA断网检查。

## v1.4.0《来访》

新增玻璃敲击、取号纸撕裂、湿脚步三项程序原创拟音，使用独立seed140014，原13项源WAV和MP3不变。作者可执行`python tools/audio/generate_sfx.py --only glass-tap,ticket-tear,wet-step --version 1.4.0`。现32段配音与16项音效，128份当前源/成品和24份校准前存档共152份完整解码；48个MP3全部离线解码通过。

《来访》在oldVoice重放q07-xu，在newVoice重放v01-confirm，原演员生成请求与成品保持原字节；许守成片段明确为2019移交旧档，不表示今晚真人在场。输入卡证据收集后可重听这两段，列表与并排核对都使用原录音控制、静音及切页暂停。文本提供同样的年份、导入时刻与文件对照，解谜不要求听辨音色。

本轮没有重生成32段配音或重跑ASR，原四段读音review标记继续保留。浏览器实际播放与断网重听通过；演技、真实扬声器及手机听感仍待人工校准。
