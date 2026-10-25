import type { Chapter, StoryAction, StoryNode } from '../types';

const first = ['v05-loan', 'v05-session', 'v05-return'] as const;
const all = [...first, 'v05-origin', 'v05-handover'] as const;
const office = { background: '/art/archive-office.webp' };
const room = { background: '/art/archive-office.webp' };
const van = { background: '/art/repair-van.webp' };
const act = (label: string, next: string, extra: Partial<StoryAction> = {}): StoryAction => ({ id: next, label, next, ...extra });
const node = (text: string, progress: number, next: string, extra: Partial<StoryNode> = {}): StoryNode => ({
  kind: 'dialogue', location: '城北 · 退号台保管室', time: '次日下午', text, progress,
  visual: 'dispatch', scene: office, actions: [act('继续', next)], ...extra
});

export const signoff: Chapter = {
  id: 'signoff', order: 10, title: '销号', subtitle: '第二部终章 · 下班的人从正门走',
  synopsis: '外借页终于翻开。借走机器的人、送出文件的任务和最先开口的声音，落在三张不同的纸上。',
  entryNode: 'dispatch', requiredEvidence: all,
  clue: { code: 'V05', title: '退号台封存与当日接收', x: 64, y: 22, detail: '资产32由物业借用于旧档迁移，罗禾代领、保管单位收回；临时服务任务自动转送至17/D3。新句子可追至32的原始输入块，未发现对应人工录制入口，异常另案保全。陈家原号218是延期取物，后续领取已有原收据。旧空号和接收席冻结，当日材料由实际岗位签收，师徒未被补入旧名单。第二部调查结束。' },
  evidence: {
    'v05-loan': { title: '外借原页与归还封签', detail: '资产32于九月三十日由物业为旧档迁移借用，罗禾签代领栏；当日归还由保管单位签收。附件、库存序列号、进出登记和双方原联互证。代领证明保管流转，不证明她录制程砚的新句子；归还后启用的定时服务账号也不是她的个人账号。' },
    'v05-session': { title: '自动转送与原始输入块', detail: '获准调阅的原任务记录将资产32的输入块、临时导出、资产17与D3接收逐项连通。夜间任务由迁移服务账号按旧规则执行，无人工交互会话；输入块保留无剪接的程砚句子和独有车锁声。该记录能确定最早保全载体及传送链，不能把服务账号当作说话人或录制者。' },
    'v05-return': { title: '二一八号的延期与领取', detail: '陈家原退号联为218，原因是有物品未搬齐。保管单位原册、后续领取收据与陈伯获准提供的原件互证：物品数日后已领，接收地点是新址，门号只作送达用途。退号不等于人员失踪，000不索引一个待返程者，今日不能补填2019旧接收席。' },
    'v05-origin': { title: '第一次输入的异常边界', detail: '封存副本中，资产32的原始输入块与下游新句子逐样本一致，重听使用同一文件。保管室原封、无人工会话和当夜记录排除了已知的现场录制入口；通信人员确认既有采集、回拨和转送均停用。无法解释的输入与停机后声响作为独立异常保全，不指认为许守成、沈衡、罗禾或任何原接收人。', recordings: [{ clipId: 'v01-confirm', label: '原文件：先别替它确认' }] },
    'v05-handover': { title: '冻结旧席与当日回执', detail: '保管单位接收原始输入块、设备与封签；物业接收迁移纠错；值班接收供电复核与异常索引。旧任务、空号和接收席冻结，不删原件，不冒签旧日期，不以新试音补缺。三方当日签收各有编号，师徒姓名只在本次协作和交接栏。正常报修渠道保持，七日回访另记实际结果。' }
  },
  nodes: {
    dispatch: node('我睡醒时，手机压在枕头下面，调阅回复已经来了。\n林岚把下午的协作安排发进当班群：城北保管室反映旧终端断开后指示灯仍亮，产权方在场，先核供电边界。借用附件也已获准开柜。\n季宁在车边等我，手里两杯豆浆，都没插吸管。', 2, 'drive', { scene: van, location: '城区抢修班 · 出车登记', time: '次日 · 13:40', portrait: 'lin', presence: 'radio', speaker: '林岚', excludesEvidence: all }),
    drive: node('她递来一杯，先让我看盖上的字。\n“甜的在右边，这杯归我。”\n我拿走有糖的。她把另一杯拎回去，翻开昨夜那张调阅单，圈住外借附件四个字。\n车开到城北时，雨已经停了。旧台子还在保管室，办事的窗口早搬去了街对面。', 4, 'boundary', { scene: van, portrait: 'ji', speaker: '季宁', excludesEvidence: all }),
    boundary: node('管理方、物业和通信人员都到了，桌上分开摆着三本登记。陈伯带来的原联装在自己的文件袋里，没有先塞进旧册。\n产权方核出指示灯由内置电池供电；外接供电正常，充电部分另交设备维护。\n我签完获准范围内的复核，才坐到调阅桌旁。没有谁因为那盏灯，又把旧站写成停电。', 7, 'borrower', { portrait: 'manager', speaker: '管理方人员', excludesEvidence: all }),
    borrower: node('外借页在装订缝里，管理方垫了块透明板，终于把折进去的半行露出来。借用单位是新苑物业，代领栏写罗禾。\n她把自己的那联拿出来，手指停在名字上。\n“九月底借的。只搬过一次，下午就还了。你们问三十二号，我真不知道它是这台。”\n旧登记写的品名是临时语音终端。', 10, 'firstHub', { portrait: 'luo', speaker: '罗禾', expression: 'wary', excludesEvidence: all }),
    firstHub: node('罗禾的名字、夜间导出和陈家的旧号，各有原件。季宁把豆浆移去窗台，免得又弄湿一张。\n保管员翻开柜里的附件，通信人员准备好获准查看的副本。\n得先查她借走了什么、机器后来做了什么，再看那张退号联究竟退的是哪件事。', 13, 'compare', { kind: 'investigation', objective: { title: '核对借用、任务与原号', detail: '取得外借原页、原任务记录和陈家的后续领取证明。姓名相同、声音相同，都不能省掉其中一步。' }, actions: [act('核外借与归还原联', 'loan', { hidesWhenCollected: 'v05-loan' }), act('查原导出任务与输入块', 'session', { hidesWhenCollected: 'v05-session' }), act('核二一八号后续去向', 'returnPaper', { hidesWhenCollected: 'v05-return' }), act('核对三份记录', 'compare', { requiresEvidence: first })], scene: { ...office, hotspots: [{ id: 'loan', actionId: 'loan', label: '外借附件', x: 26, y: 48 }, { id: 'session', actionId: 'session', label: '原任务', x: 52, y: 43 }, { id: 'returnPaper', actionId: 'returnPaper', label: '退号原联', x: 75, y: 53 }] } }),
    loan: node('物业借的是三十二号整机，给迁移人员核旧语音目录；罗禾负责领还，不负责导入。她那联有领用时刻，保管单位那联有归还时刻，库存序列号对得上。\n归还之后，保管员按维修要求给外壳和已停用的录音接口贴了封签。原照片里纸边翘了一点，今天还在同一个地方。', 16, 'loanDesk', { excludesEvidence: ['v05-loan'] }),
    loanDesk: node('借用事项的末栏没有抹掉，另附归还单。季宁将两张并排放，我差点先把借出那张收走，她用笔帽压住。\n“借走和还回来都得留。”\n罗禾拿手机找那天的接收消息。没有夜里的登录提示，她也没有终端服务账号的口令。个人手机和机器账号分别登记。', 18, 'recordLoan', { portrait: 'ji', speaker: '季宁', expression: 'focused', excludesEvidence: ['v05-loan'] }),
    recordLoan: node('九月三十日，物业借用，罗禾代领，当日归还。两方原联和封签照片放在一起。\n她的名字确实有用：能找到这次流转的人。可这页没有写谁在昨夜录音。\n我请她核过本次口述，她看完才签今天的附件，没在原页上添字。', 20, 'firstHub', { kind: 'evidence', excludesEvidence: ['v05-loan'], actions: [act('记录：外借原页与归还封签', 'firstHub', { id: 'record-loan', collect: 'v05-loan' })] }),
    session: node('通信人员打开保全副本，不是昨夜那份只到转送回执的表格。\n三十二号留着原始输入块；临时导出任务从这里取，十七号随后收进目录，再由D3送到新苑。三处文件摘要依次对上。\n执行账号后面写迁移服务，任务按旧规则定时运行。', 16, 'sessionClock', { excludesEvidence: ['v05-session'] }),
    sessionClock: node('原日志没有当夜人工会话。通信人员把登录页、服务任务和输入页分开，没把同一个账号打印三遍当三个人签名。\n输入块里有一句我的话，后面跟了车门落锁的短响。季宁抬起头，那声音她昨夜坐旁边听过。\n页面的钟仍未经独立校准，我们只保留原顺序和接收时标，不用它宣布声音早于我开口。', 18, 'recordSession', { excludesEvidence: ['v05-session'], scene: { ...office, document: { title: '保全副本 · 任务与输入', lines: ['资产32：原始输入块', '迁移服务：临时自动导出', '资产17：后续采集目录', 'D3：新苑接收入口', '当夜人工交互会话：无', '设备显示时刻不作最初录音时间'] } } }),
    recordSession: node('季宁画完四格，没在最左边添一个拿话筒的人。\n任务怎样把文件送到新苑，查到了；第一份输入怎样得到车里的声音，还没在这些页里。\n我把这两个问题分行写。通信人员看过，保全目录加上原始输入块，原机没为核对再启动一次。', 20, 'firstHub', { kind: 'evidence', excludesEvidence: ['v05-session'], actions: [act('记录：自动转送与原始输入块', 'firstHub', { id: 'record-session', collect: 'v05-session' })] }),
    returnPaper: node('陈伯把原号联从袋里拿出来。二一八，旁边记着两件没搬完的东西：木箱，旧灯。\n“我妈那回没办完，不是没回家。”\n保管员按页码找后续。几天后，两件东西领清，另有一张新址送达的收据，陈家的旧门号留在附注。', 16, 'returnReceipt', { portrait: 'chen', speaker: '陈伯', excludesEvidence: ['v05-return'] }),
    returnReceipt: node('领取单和原退号联的物品编号能接上，陈伯带来的家存联也一样。他母亲写字时把箱字左边拉得很长，三张上都是。\n他用指腹压住那一笔，没来回摩挲。\n背面的铅笔字记从后门搬物，不是让人在窗口守到今天。新门号是送达地址，也不是又派给谁的一张回访单。', 18, 'recordReturn', { excludesEvidence: ['v05-return'], scene: { ...office, document: { title: '陈家原联 · 经本人许可核对', lines: ['原号：218', '退号原因：物品未搬齐', '后续：木箱、旧灯已领', '新门号：送达用途', '今日不补填旧接收栏'] } } }),
    recordReturn: node('陈伯把家存联收回，给我们留获准用的副本。他说原件还放旧门牌旁边，回去给女儿看。\n零号没有多出一个人；二一八号也没有少掉一个人。\n季宁在复核页写上物品已领，请保管员核对来源，没把退号改写成七年未归。', 20, 'firstHub', { kind: 'evidence', excludesEvidence: ['v05-return'], actions: [act('记录：二一八号的延期与领取', 'firstHub', { id: 'record-return', collect: 'v05-return' })] }),
    compare: node('三份记录摆齐。罗禾代领过终端，整机当日归还；夜间转送由服务任务执行。陈家的物品后来领清，原号没有等着谁补一个名字。\n罗禾坐在桌子外侧，眼下的青色比昨夜还明显。她抬手想指屏幕，又放下，等我们问。', 25, 'puzzle1', { requiresEvidence: first }),
    puzzle1: node('登记里找到了真人姓名，正好也听到她的声音。可一张代领页和一条输入记录之间，还缺直接录制的证据。\n管理方的笔停在待核事项栏，没替我们把两条并成一条。', 28, 'correctBorrower', { kind: 'puzzle', requiresEvidence: first, puzzle: { prompt: '罗禾代领过资产32，能否据此认定她录制了程砚的新句子？', hint: '领还原联、个人登录与自动任务是不同来源。原始输入存在，不等于代领者亲手录制。' }, actions: [act('不能。流转已核，原始输入另查', 'correctBorrower'), act('代领人就是最初录制者', 'wrongBorrower', { tone: 'danger' })] }),
    wrongBorrower: node('我把两栏连上。罗禾没辩解，指了归还时刻，再指当夜任务。\n季宁把线擦掉，留下两个浅浅的笔坑。我们有她领机器的证明，没有她录车内声音的证明。\n【复核：把代领当录制】三份记录保留，回到判断处。', 28, 'compare', { kind: 'ending', outcome: 'failure', requiresEvidence: first, actions: [act('保留记录，重新判断录音来源', 'compare')] }),
    correctBorrower: node('罗禾只确认自己做过的事。借用页和昨夜值班记录附在不同位置，谁也没让她照录音再说一遍收到。\n她把钥匙放回包里。\n“那台东西不用我再带回去了吧？”\n管理方给她看接收编号。设备留在这里，她只带自己的那联走。', 32, 'emptyDesk', { requiresEvidence: first, portrait: 'luo', speaker: '罗禾' }),
    emptyDesk: node('保管室里还留着一张旧窗口桌。木桌下面的呼铃断线、锈死，维护记录早几年就写报废。\n通信人员核完当前入口，指了指原封：录音接口停用，既有通道也没有新的采集任务。\n我将昨夜在车上那句写进现场说明，不让罗禾替我回忆。季宁在旁边核她亲耳听见的部分。', 35, 'secondHub', { requiresEvidence: first, scene: room }),
    secondHub: node('现在要核的只剩两项：最早保全的声音究竟到哪一步，今天的材料究竟由谁接。\n管理方给我们留出桌面，旧册收在另一端。\n窗外的公交车停了一站。人从前门上，后门下，没有人在车门边等着答号。', 38, 'compareEnd', { kind: 'investigation', requiresEvidence: first, scene: { ...room, hotspots: [{ id: 'origin', actionId: 'origin', label: '原始输入副本', x: 35, y: 46 }, { id: 'handover', actionId: 'handover', label: '当日接收单', x: 70, y: 49 }] }, objective: { title: '核清原声与最后接收', detail: '保全第一次输入，核停用边界，并按今日实际职责接收材料。旧空白不由新声音补签。' }, actions: [act('核最早输入与停用边界', 'origin', { hidesWhenCollected: 'v05-origin' }), act('核当日签收与旧席冻结', 'handover', { hidesWhenCollected: 'v05-handover' }), act('核对最终处置', 'compareEnd', { requiresEvidence: all })] }),
    origin: node('通信人员只播放已保全的同一份原文件。\n“先别替它确认。”\n是我。车锁声落在句尾，轻的一下之后还有重的一下，昨夜我们以为第二下来自后门。\n原始输入块和下游文件逐样本一致，没有从旧对白里拼字的痕迹。第一次保全载体已经找到，已知录制入口却接不上它。', 42, 'originBoundary', { requiresEvidence: first, excludesEvidence: ['v05-origin'], scene: room }),
    originBoundary: node('保管员核过当夜封存和出入记录，没人进这间屋；未封存的外部接口也没有对应新输入。通信人员签下核过的范围，没有在不能解释的地方写设备老化。\n许守成原录音仍有2019移交索引。我的新文件没有。两份留在不同目录，不拿像谁的声音认谁回来了。', 45, 'bell', { requiresEvidence: first, excludesEvidence: ['v05-origin'], scene: room }),
    bell: node('桌下响了一声。\n这回大家都听清了。不是电脑，电脑音量已经归零；报废呼铃的舌头仍锈在原处。罗禾没答，陈伯扶住椅背，又慢慢松开。\n我看了一遍在场的人，照今天的登记数。人数没变，谁也没有跑去后门找一位应该签字的人。', 48, 'recordOrigin', { requiresEvidence: first, excludesEvidence: ['v05-origin'], scene: room }),
    recordOrigin: node('原始输入和停机声响并列保全。通道怎样送文件，有实据；没有人能说明的第一次输入，也不再冒充漏掉的一项普通设备故障。\n我签自己的现场说明，季宁签她听见的部分。\n纸上没有指定亡者，也没有把罗禾或陈伯补成录制者。', 51, 'secondHub', { kind: 'evidence', requiresEvidence: first, excludesEvidence: ['v05-origin'], scene: room, actions: [act('记录：第一次输入的异常边界', 'secondHub', { id: 'record-origin', collect: 'v05-origin' })] }),
    handover: node('三方把材料分开。原始输入、设备和封签由保管单位收，迁移错列由物业收，供电复核和异常索引交当班值班。\n每份都有今天的接收人和编号。旧册里的接收席保留原样，另附冻结说明，不再等一个声音替它答到。', 42, 'retire', { requiresEvidence: first, excludesEvidence: ['v05-handover'], scene: room }),
    retire: node('管理方提出清掉测试目录，通信人员摇头，先把原件接收清单往前推。\n季宁把冻结、保全两个词圈在不同位置。旧任务不再跑，原件也不能跟着消失。\n原空号退出活动队列，旧接收席停止派单，正常来访与报修用各自现行渠道。不是删掉一切就算完成。', 45, 'today', { requiresEvidence: first, excludesEvidence: ['v05-handover'], portrait: 'ji', speaker: '季宁', expression: 'focused', scene: room }),
    today: node('表上有一栏要我们确认。不是确认2019接收，也不是确认异常已消失，只确认本次协作事项和材料去向。\n我逐项看完，把复核范围写全。季宁先检查我名字里的砚字，写对了才把表推过来。\n管理方接住，给我们当日回执。', 48, 'recordHandover', { requiresEvidence: first, excludesEvidence: ['v05-handover'], scene: { ...room, document: { title: '当日接收 · 各自签认', lines: ['保管单位：原件、设备与封签', '物业：迁移纠错与现行联络', '值班：供电复核、异常索引', '旧空号与接收席：冻结', '历史原件：保留，不回填', '师徒：本次协作，不代旧席'] } } }),
    recordHandover: node('接收联少了一张。保管员数完，发现还夹在自己掌下，忙抽出来递给罗禾。\n她没笑，先看清自己的名字和日期，才折进包里。\n季宁把我们那张收好，这次没让它跟旧册挨着。今天的事情，有今天到场的人接。', 51, 'secondHub', { kind: 'evidence', requiresEvidence: first, excludesEvidence: ['v05-handover'], scene: room, actions: [act('记录：冻结旧席与当日回执', 'secondHub', { id: 'record-handover', collect: 'v05-handover' })] }),
    compareEnd: node('资产流转、自动任务、陈家后续、原始输入和当日接收都已核完。剩下的未知被写在它实际出现的位置，没有散到每一本旧册里。\n桌下又轻响一声，像有人等笔尖落下。\n我把写完的回执放到近处。另一头，是2019年仍然空着的那一格。', 58, 'puzzle2', { requiresEvidence: all, scene: room }),
    puzzle2: node('旧席位等一个接收人，喇叭里恰好有我的声音。只要把名字写进去，桌面上的几张纸就能接成一圈。\n季宁站在我身边，手里拿的是今天的登记。\n这最后一步，得由我自己看清签在哪里。', 62, 'closeDesk', { kind: 'puzzle', requiresEvidence: all, scene: room, puzzle: { prompt: '怎样结束这次调查，并处理仍无解释的声音？', hint: '本次责任有真人接收；历史空栏与未知输入保留，旧任务冻结。录音不能任命一位旧接收人。' }, actions: [act('按当日范围签收，冻结旧席，保全异常原件', 'closeDesk'), act('用程砚的声音补旧接收席，再恢复任务验证', 'wrongSign', { tone: 'danger' })] }),
    wrongSign: node('我把笔伸向旧册。季宁没有抢，只把今天的回执放到笔下。\n那一格写2019，我那年不在这里。机器里的声音也不能让我去过。通信人员拒绝恢复任务，管理方收回旧册。\n【复核：替旧席签名】五份记录保留，回到最终判断。', 62, 'compareEnd', { kind: 'ending', outcome: 'failure', requiresEvidence: all, scene: room, actions: [act('保留记录，重新核对最后签名', 'compareEnd')] }),
    closeDesk: node('笔落在今天的页上。\n保管员核收原件，关掉现行页面里的旧接收席。原页另存，封存编号读给在场的人听。通信人员确认旧任务仍停用，物业读回正常报修的联系人。\n桌下没有再响。我们等完这一项核验，谁也没拿安静替未解现象盖一个全部正常的章。', 68, 'window', { requiresEvidence: all, scene: room }),
    window: node('陈伯站在旧窗口里面，看了一会儿那把椅子。他把帽子戴上，没坐。\n“我妈那两件东西，早拿回去了。”\n保管员点头，把原收据还给他。他自己放进袋里，和今天的陪同联隔开。\n门开着，他从正门出来。我们在外面等，没有叫他留下来收最后一张纸。', 73, 'names', { requiresEvidence: all, portrait: 'chen', speaker: '陈伯', scene: room }),
    names: node('管理方按今天的登记点人。到罗禾，她先看了看对方的脸，才抬手。轮到季宁，她答得很响。\n最后叫我。\n“程砚。”\n我看着拿本子的活人，答了一声。\n保管员划完最后一格，把门锁好。没有隔着墙再叫一次。', 78, 'driveHome', { requiresEvidence: all, scene: office }),
    driveHome: node('回程的豆浆已经不热了。季宁问还喝不喝，我揭开盖，甜得齁嗓子。\n“师傅，下次自己拿。”\n她把没糖那杯转给我，自己背过身笑。今天没有去追第二声锁，我们核过车门，按正常路线开回班里。\n后座只放工具箱和一袋该晾的雨衣。', 82, 'followup', { requiresEvidence: all, portrait: 'ji', speaker: '季宁', scene: van, location: '抢修车 · 回班路上' }),
    followup: node('接下来七天，物业按约回访。正常报修有地址、有联系人；冒名到场和空地址回访没有再进来。原始输入留在封存材料里，没人拿一个猜出的名字把它改成已解释。\n陈伯发来家里收好的木箱照片，旧灯在旁边，插着现在正常使用的电源。照片只发给了获准看的人。\n罗禾最后一条回复是交班完成，后面没有引用哪段录音。', 87, 'firstBook', { requiresEvidence: all, scene: office, time: '七日后 · 回访核对' }),
    firstBook: node('第一部移交的2019材料仍走独立复核。许守成的事故、老周的说明和沈衡后来的生活，没有因为这次退号又换一遍结论。\n新的五处记录另成一册，最后放当日回执。第一部那条圈没被拉来替第二部凑闭合。\n季宁检查目录，把待补的接收编号添全。她合上本子，这回真没夹住东西。', 91, 'offDuty', { requiresEvidence: all, scene: office, time: '七日后 · 回访核对' }),
    offDuty: node('我换下工作服，手机留在桌上充电。到下班的点，季宁在门口等自己的车，没有等我先说可以走。\n她伸手指了一下本子。\n“这回写哪一栏？”\n“交班。今天的。”\n她点头，拉好背包，从亮着的正门出去。', 96, 'end', { requiresEvidence: all, scene: { background: '/art/dispatch.webp' }, portrait: 'ji', speaker: '季宁', time: '同日 · 交班后', location: '城区抢修班 · 正门' }),
    end: node('【第二部完结 · 销号】外借、转送与原号去向已核；原始异常保全，旧接收席冻结，当日材料有人接。七日回访未再出现冒名通知。\n门外的车来了。季宁隔着玻璃朝我举了一下手，我也抬手，没有听见第二个她在屋里应声。\n我收起已经签好的交班本，关灯，走到门外。', 100, 'dispatch', { kind: 'ending', outcome: 'complete', requiresEvidence: all, scene: { background: '/art/dispatch.webp', inscription: 'V05 · 当日交班 / 两部完结' }, location: '调查归档 · V05', time: '完', actions: [act('重新调查《销号》', 'dispatch', { id: 'restart', resetEvidence: true })] })
  }
};
