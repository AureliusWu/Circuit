import type { Chapter, StoryAction, StoryNode } from '../types';

const requiredEvidence = ['normal-readings', 'funeral-seats', 'return-ticket', 'undelivered-copy', 'signed-status'] as const;
const next = (id: string, label: string, target: string): StoryAction => ({ id, label, next: target });
const node = (
  kind: StoryNode['kind'], progress: number, text: string, actions: readonly StoryAction[],
  extra: Partial<StoryNode> = {}
): StoryNode => ({
  kind, progress, text, actions, location: '旧城 · 南桥街', time: '夜间', visual: 'meter',
  scene: { background: '/art/substation.webp' }, ...extra
});

export const neutral: Chapter = {
  id: 'neutral', order: 4, title: '零线', subtitle: '第四章 · 没有归还的那一页',
  synopsis: '金属外壳仿佛带电，所有测量却正常。共同参加过一场葬礼的人，各自保管着一份无人接收的责任。',
  entryNode: 'dispatch', requiredEvidence,
  clue: { code: 'N04', title: '零线票据', detail: '2019-10-11的04号中性线检修票没有归档。葬礼上分散的工作票、住户名单与事故复印件，最终由原交接人签收为同一份待查记录。', x: 60, y: 76 },
  evidence: {
    'normal-readings': { title: '正常读数与相同刻字', detail: '经规范检查，报修设备没有复现漏电，保护与常规接线记录未见异常；不能据此否定不适。三处报修旧箱都残留04号标记，症状在谈到旧事故“结案”时出现。' },
    'funeral-seats': { title: '四席位与四份东西', detail: '西：老周，红色工作票夹，办理工作交接；东：杨桂梅，蓝色住户名单；南：沈棠，事故复印件；北：许家，白色信封。只有西席持有工作票原件与交接职责。' },
    'return-ticket': { title: '未交回的N04原票', detail: '04号中性线检修票于2019-10-11 00:31开出，终止与交回栏均为空。临时旁路和用户清单应当随票交回，不能用一张复印件替代完整归档。' },
    'undelivered-copy': { title: '沈棠没有送出的复印件', detail: '许家收到的是慰问与手续通知，没有收到救援经过。沈棠曾承诺送达完整说明，但她只有缺少现场签字的复印件，被告知“结案后再取”。' },
    'signed-status': { title: '老周承认的虚假完成状态', detail: '老周曾签署“工作已结束”，实际既未交回N04，也未对许家与获救住户说明真相。他将未明支路保持隔离，在原记录上补签责任与待查状态，没有用送电验证代替交接。' }
  },
  nodes: {
    dispatch: node('dialogue', 3, "南桥街三位住户报金属箱壳有麻感。林岚安排电网侧现场排查，物业负责联系合格人员检查用户侧设备。我与季宁接单，老周随队处理自己带来的历史原票；这份历史材料的责任由独立复核岗位接收。工单不能提前写成“零线故障”，也不能因为此前有怪事就略过常规检查。", [next('scope', '核对前两次检查的范围', 'scope')], { speaker: '林岚', portrait: 'lin', location: "梧城电网 · 城区抢修班", time: '22:26', visual: 'dispatch', scene: { background: '/art/dispatch.webp', document: { title: '关联报修 N04', lines: ['南桥街及周边 · 三处金属外壳不适', '既有检查：未复现故障，不等于排除所有风险', '共同事项：七年前许守成追悼会'] } }, presence: "scene" }),
    scope: node('dialogue', 6, "季宁给三处设备登记产权和联系人，一处是供电侧箱体，一处是用户电器，还有早已不用的铁柜。“共同症状不代表同一条供电线路。”我让她先记录症状发生时的活动与环境，配合专业人员检查，居民不必再次用手触摸来证明自己。", [next('approach', '与老周前往南桥街', 'approach')], { speaker: "季宁", portrait: "ji", visual: 'dispatch', scene: { background: '/art/dispatch.webp' }, expression: "neutral" }),
    approach: node('dialogue', 9, '雨已经停了，路边铁门上的水还在往下走。沈棠站在报修人家门外，拿着一叠用塑料袋包住的纸。她不是屋主，只是接到老人的电话就来了。老人说自己把门推开了，又像没有推开，掌心一直记着一阵麻。沈棠没有让他再试一次，先给你让出检修的位置。', [next('boundary', '建立现场安全边界', 'touchBoundary')], { time: '23:05', scene: { background: '/art/alley.webp' }, visual: 'alley' }),
    touchBoundary: node('dialogue', 12, "我按现场安排报告边界，由相应岗位落实停用、许可和监护，居民离开检修区域。用户电器交产权方的合格人员处理，电网侧箱体按工单检查。季宁保存原始报修和测量来源，没有把暂未定位的现象写成误报。我们不请任何人用身体重复麻感。", [next('meet', '了解沈棠为何认识这些报修人', 'meetShen')], { speaker: "程砚（你）", portrait: "cheng", expression: "focused" }),
    meetShen: node('dialogue', 15, '“他们七年前都来过许师傅的追悼会。”沈棠把塑料袋抚平，“我父亲沈衡那晚开接送车，带走获救住户，在清河里等许师傅返程。我替家里送过材料。父亲刚去世，他们还会来问我，电工到底怎样走的。”她说自己也问过，得到的答案却总是“已经结案”。这四个字她如今不敢再说。', [next('funeral', '请她还原当年的交接场面', 'funeral')], { speaker: '沈棠', portrait: 'shen' }),
    funeral: node('dialogue', 18, '追悼会没有多余仪式，桌上放着花与许守成的照片。有人带来工作票，有人带住户名单，有人拿着复印件等签字。大家都觉得不该在那种地方追问，所以东西传了一圈，又各自拿回去。直到七年后，报修人提起“事情应该结束了”，金属壳上的麻才开始出现。', [next('investigate', '核对读数、席位、原票与未送达材料', 'inspection')], { speaker: '沈棠', portrait: 'shen' }),
    inspection: node('investigation', 23, '你把现场与旧材料分成四个待核项。一个正常读数不能代替一个人的口述，一场葬礼也不能代替工作交接。弄清当年的每份纸是什么、谁能接收它，才可能知道现在大家究竟在等哪一种结束。老周坐在配电房门口，旧皮包仍压在膝盖上。', [
      { id: 'reading', label: '复核设备与04号刻字', next: 'readings', hidesWhenCollected: 'normal-readings' },
      { id: 'seats', label: '还原葬礼四个席位', next: 'seats', hidesWhenCollected: 'funeral-seats' },
      { id: 'ticket', label: '查看老周带来的原工作票', next: 'ticket', hidesWhenCollected: 'return-ticket' },
      { id: 'copy', label: '检查沈棠没有送出的复印件', next: 'copy', hidesWhenCollected: 'undelivered-copy' },
      { id: 'compare', label: '对照四份调查结果', next: 'compare', requiresEvidence: requiredEvidence.slice(0, 4) }
    ], { objective: { title: '寻找没有接收人的交接', detail: '四项现场与档案核查完成后，按席位、物件和职责推理。' }, scene: { background: '/art/substation.webp', hotspots: [{ id: 'reading', actionId: 'reading', label: '报修旧箱', x: 24, y: 54 }, { id: 'seats', actionId: 'seats', label: '席位草图', x: 47, y: 72 }, { id: 'ticket', actionId: 'ticket', label: '旧工作票夹', x: 75, y: 43 }, { id: 'copy', actionId: 'copy', label: '塑料袋里的纸', x: 65, y: 83 }] } }),
    readings: node('dialogue', 25, '三处报修设备按各自状态完成检查，没有找到共同的现实供电支路。你让检修同事继续按规定处理设备安全，不把未明现象归到“零线断了”就算解释完。现场唯一的共同痕迹是一枚旧编号“04”，有的刻在箱门，有的写在后来被挪作杂物柜的铁柜背面。', [next('reading-note', '记录测量的结论与限度', 'readingRecord')]),
    readingRecord: node('evidence', 27, "季宁将铁柜照片和仪表报告并列：柜内没有接线，居民的麻感与供电状态也未建立关系。电气安全仍按各自设备检查结论判断；口述另有共同点，几人都在提到旧事故“已经结案”后不适。她注明这是局部观察，不能当验电办法，也不能据此复电。", [{ id: 'collect-reading', label: '记录：正常读数与相同刻字', next: 'inspection', collect: 'normal-readings' }], { excludesEvidence: ['normal-readings'], speaker: "季宁", portrait: "ji", expression: "concerned" }),
    seats: node('dialogue', 25, '沈棠画下追悼会那张桌子。照片面向北，许家坐北侧；杨桂梅在东侧，带来蓝色住户册；她自己坐南侧，用塑料袋装着复印件。老周坐在西侧，红夹里是现场工作票，只有他被安排办理工作交接。其他人能补充事实，但没有人能代替他的现场签字。', [next('seats-note', '核对照片与席位便签', 'seatsRecord')], { speaker: '沈棠', portrait: 'shen' }),
    seatsRecord: node('evidence', 27, "季宁把桌边席位和材料持有人分别画出来。“家属收说明，住户提供名单，现场工作票另有人负责交回。”她问谁具有原职责，谁只是带来证词。我让她按当年的授权和原件继续核对，座位朝向只能帮助还原口述，不能让仪式替人决定责任。", [{ id: 'collect-seats', label: '记录：四席位与四份东西', next: 'inspection', collect: 'funeral-seats' }], { excludesEvidence: ['funeral-seats'], scene: { background: '/art/substation.webp', document: { title: '2019年追悼会 · 席位核对', lines: ['西 · 老周 · 红色工作票夹 · 工作交接', '东 · 杨桂梅 · 蓝色住户册 · 住户情况', '南 · 沈棠 · 塑料袋复印件 · 材料送达', '北 · 许家 · 白色信封 · 等待事故说明'] } }, speaker: "季宁", portrait: "ji", expression: "neutral" }),
    ticket: node('dialogue', 25, "N04中性线检修票在2019年10月11日00:31开出，终止和交回栏仍空白。老周带来的是原件，附页另画独立电源的临时救援照明路径，沿途涉及漏登住户。季宁给票据登记原页顺序，先保存缺页状态，没有照着现在的记忆补写当年的许可。", [next('ticket-note', '对照原件与系统完成状态', 'ticketRecord')], { speaker: '老周', portrait: 'zhou', expression: 'focused' }),
    ticketRecord: node('evidence', 27, '电子系统说工作已经结束，原票却没有写清旁路的处置与人员返回情况。你问老周是不是同一份。他点头：“是我那一班的，没错。”这张纸不是凭一个名字就能解决的诅咒，也不是重新送电的许可。它记录的是一次未经核实就被关掉的事故处理过程。', [{ id: 'collect-ticket', label: '记录：未交回的N04原票', next: 'inspection', collect: 'return-ticket' }], { excludesEvidence: ['return-ticket'], scene: { background: '/art/substation.webp', document: { title: 'N04 · 原始检修工作票', lines: ['开票：2019-10-11 00:31', '项目：04号中性线及临时联络检查', '终止、交回：空白', '附件：临时旁路示意、用户清单均未归档'] } } }),
    copy: node('dialogue', 25, '沈棠的材料里有一份救援经过复印件，最后半页被黑边遮住。她父亲沈衡在车边听见许守成说先把老人带走，抢修员稍后返程。沈棠答应许家把父亲这段证词和相关记录一起送到，却被告知没有原现场人的签字不能入档。“他们让我等正式结论。我以为等几天就行。”', [next('copy-note', '核对家属实际收到的内容', 'copyRecord')], { speaker: '沈棠', portrait: 'shen' }),
    copyRecord: node('evidence', 27, "沈棠的复印件缺了一页，原件也没有最终接收凭据。季宁逐项登记来源与缺页：“寄出去和收到了，要两份证据。”她请家属确定可提供的私人材料，完整副本由正式渠道递送。我看见她把“待回复”后面空出的名字补成具体接收岗位，而没有填过去的完成日期。", [{ id: 'collect-copy', label: '记录：沈棠没有送出的复印件', next: 'inspection', collect: 'undelivered-copy' }], { excludesEvidence: ['undelivered-copy'], speaker: "季宁", portrait: "ji", expression: "neutral" }),
    compare: node('dialogue', 36, "我让季宁将设备检查、追悼会口述、原票和送达记录四项读回。设备是否安全由专业检查决定，原票由有职责的人提交，家属有权等待可核查的说明。她将“麻感减轻”留在观察栏，没有把它当成某个人终于无罪的信号。", [next('grid', '按席位、物件与职责匹配交接人', 'puzzleSeats')], { requiresEvidence: requiredEvidence.slice(0, 4), speaker: "程砚（你）", portrait: "cheng", expression: "focused" }),
    puzzleSeats: node('puzzle', 41, '已核实的席位：西侧红夹装工作票原件；东侧杨桂梅持住户册；南侧沈棠只有复印件；北侧许家等待说明。西侧的人承担工作交接。要补回N04的终止与交回核查，应先请谁说明原票为何留在自己手里？', [next('family', '北侧许家，收到信封就应承担结案责任', 'wrongBlame'), next('copy', '南侧沈棠，复印件与原件具有相同交接效力', 'wrongBlame'), next('west', '西侧老周，他持原票且承担工作交接', 'west')], { requiresEvidence: requiredEvidence.slice(0, 4), puzzle: { prompt: '找出原件与交接职责同时成立的席位', hint: '收取慰问信封和送达复印件都不能代替现场工作票交回。不要把位置当仪式，检查职责。' } }),
    wrongBlame: node('ending', 41, '你把待说明的记录推给了等待说明的人。沈棠又要去找许家签字，许家又被要求证明自己理解那半页没有收到的经过。红夹仍留在老周膝上，一纸“结案”越过所有空白。铁门上的麻感没有退去，因为你重复了当年同一种没有接收人的交接。', [next('retry', '重看谁持原件、谁负责交接', 'puzzleSeats')], { outcome: 'failure', requiresEvidence: requiredEvidence.slice(0, 4) }),
    west: node('dialogue', 45, '你请老周把原票放在桌面，问的是交接过程，没有替他回答动机。他盯着空白栏，过了很久才说：“那天有人让我先把工单关掉，后面再补。守成没回来，我怕事情一摊开，整班人都被拖进去。我也怕许家问我，为什么偏偏是他。”', [next('witness', '追问完成状态是谁确认的', 'witness')], { speaker: '老周', portrait: 'zhou', expression: 'focused' }),
    witness: node('dialogue', 48, '“完成状态是我签的。”老周没有把那句话推回给别人，“我明知道旁路没查清，也知道他没有交班。”原件仍可核对上级通知与其他人员责任，不能用一句忏悔代替调查。你告诉他：把知道的写出来，未知的保持未知；承认自己的签字，也不能把所有人的证词改成一样。', [next('radio', '核对最后一次联络与附件缺口', 'radio')], { speaker: '老周', portrait: 'zhou', expression: 'focused' }),
    radio: node('dialogue', 51, '旧联络记录最后一条在00:47：许守成报告临时通路已经送出人，请求核查后续处置。后来那条录音没有接入工单附件，七日复核页也失去了去向。老周只能证明自己听见过，不能靠记忆重造完整录音。你联系林岚，请她把这项缺失与已经查到的Q07并列。', [next('return', '确认补交应保留哪些内容', 'puzzleReturn')], { requiresEvidence: requiredEvidence.slice(0, 4) }),
    puzzleReturn: node('puzzle', 56, '现在的读数正常，但原工作票未交回，旁路来源与事故处置仍待核查。老周愿意补签。应怎样处理N04，才算承担责任，而不是用新的空白覆盖旧的空白？', [next('erase', '删去旁路和死亡经过，只补“检查正常，结案”', 'wrongErase'), next('archive', '保留原始空白与附件，签明事实和责任，未知支路继续隔离', 'signed')], { requiresEvidence: requiredEvidence.slice(0, 4), puzzle: { prompt: '选择能够保全事实与现场边界的补交方案', hint: '补交不是补造。没有来源的支路不因一个人的道歉获得送电许可。' } }),
    wrongErase: node('ending', 56, '新的“检查正常”盖住了事故与空白栏。老周把红夹递出去，接收人却只能得到一份没有任何问题的文件。住户重新按上旧铁门，手又停在那里，像抓着一句没人肯承认的话。你无法用今天的正常读数证明七年前发生的事，也无法用未知线路的送电试验取得一个结论。', [next('retry', '回到原件保全与隔离判断', 'puzzleReturn')], { outcome: 'failure', requiresEvidence: requiredEvidence.slice(0, 4) }),
    signed: node('evidence', 60, "老周在今天的责任说明上签字：离开监护岗位、未经核完确认完成、附页和原票未及时提交，分别说明经过。季宁问：“接收这张纸，是替过去完成背书吗？”我指给她看日期和范围：“我们接收原件与说明，原来的空白保留。调查结论由复核部门作出。”", [{ id: 'collect-signature', label: '记录：老周承认的虚假完成状态', next: 'handover', collect: 'signed-status' }], { portrait: "ji", speaker: "季宁", excludesEvidence: ['signed-status'], expression: "concerned" }),
    handover: node('dialogue', 64, "林岚通过电台读回收件编号和页码，确认原件由档案员保管，责任说明交独立复核。她不在现场，也没有替事故宣布结案。季宁逐项勾选“已接收”。沈棠问老周，父亲沈衡当年明明回了家，为什么许师傅的返程一直没有交代。", [next('debt', '让老周回应这份未偿还的说明', 'debt')], { speaker: '林岚', portrait: 'lin', requiresEvidence: requiredEvidence, presence: "radio" }),
    debt: node('dialogue', 68, "老周承认自己的离岗和虚假完成，愿意提供核查需要的材料。沈棠没有替许家说原谅，只说父亲沈衡生前总记得接送单缺一个人。季宁把这两句话分别登记。承认有了接收人，事实和责任仍要核；今天的签名不让任何人自动成为清白的人。", [next('courier', '补齐沈棠的送达记录', 'courier')], { speaker: '沈棠', portrait: 'shen' }),
    courier: node('dialogue', 71, '沈棠将复印件的来源、缺页与未送达原因逐项写清。许家是否愿意见面由他们决定，事故核查却不能因此停下。你给她一份收件凭据，让她以后不用再守在办公室门外等“正式结案”。她把旧塑料袋折好，里面那些纸终于有了另一个不会消失的位置。', [next('neighbors', '向报修住户说明现有结论', 'neighbors')], { portrait: 'shen' }),
    neighbors: node('dialogue', 74, '你告诉住户，现场检查尚未复现漏电，相关设备仍由检修人员完成必要处置，任何新的不适都继续报告。旧事故材料已经进入明确的核查流程，没有人再需要为了催一个答案而冒险握住铁门。老人把手从裤缝里伸出来，摊开看了看，像确认它又只是自己的手。', [next('measure', '复核现场状态，不要求身体试验', 'measure')]),
    measure: node('dialogue', 77, "复测数字没有突然变成“真相”。季宁分别登记测量结果和居民自述：麻感逐渐减轻，时间接近 N04 材料接收，但关联还不能解释全部原因。我让她保留回访窗口，用户设备的缺陷继续由产权方处理，旧物的观察也不替代设备安全判断。", [next('naming', '检查04号旧标记的来源', 'naming')], { speaker: "季宁", portrait: "ji", expression: "neutral" }),
    naming: node('dialogue', 80, '旧箱上的04来自当年的检修分段，不是所有金属外壳共有的秘密数字。工作票中的中性线确实有电气功能，不能因为人们欠一段交代，就说人情能充当导体。你将“归还记录”与“恢复线路”写成两件事：前者需要名字、事实与责任，后者仍需要完整的核验与许可。', [next('visit', '询问老周是否愿意参加后续说明', 'visit')]),
    visit: node('dialogue', 83, '老周答应去见许家，但先问能不能让他自己打电话。他知道那不会是一场简单的道歉，也知道已经迟了七年。你把许家保留的联系方式交给负责回访的同事，由对方询问意愿。老周收起空下来的皮包，没有把那份原票再拿回去。', [next('file', '将N04归入城市旧路线图', 'file')], { speaker: '老周', portrait: 'zhou', expression: 'focused' }),
    file: node('dialogue', 86, 'N04与L03终于接在同一套纸质档案里：一个是没有交回的工作票，一个是没有结束的巡查等待。它们在地图上相邻，电气上却不是让你逐点合闸的指令。林岚说五个缺口已经全部找齐，下一步要拿原图对照，而不是猜那个圈想要什么。', [next('night', '结束南桥街现场核查', 'night')], { speaker: '林岚', portrait: 'lin', requiresEvidence: requiredEvidence, presence: "radio" }),
    night: node('dialogue', 89, "沈棠送我们到巷口，说父亲沈衡2019年平安回家，之后继续开夜班，退休后在今年因病去世。季宁把两个死亡事件分开记：许守成死于那次救援后的事故，司机又活过真实的七年。获救住户后来买菜、上班、吵架，并没有全变成旧巷里的影子。", [next('oldZhou', '再听老周补充一件小事', 'oldZhou')], { speaker: '沈棠', portrait: 'shen', visual: 'alley', scene: { background: '/art/alley.webp' } }),
    oldZhou: node('dialogue', 92, "老周说守成带过两个馒头，分给了等候的人，自己没吃。季宁问能不能记进证词。我说可以注明是谁亲见、谁转述，不把小事写成免责理由。她把“馒头”留在生活片段栏，责任说明留在另一页。人值得被记住，职责也需要继续追问。", [next('receive', '确认原件接收完成', 'receive')], { speaker: "季宁", portrait: "ji", expression: "neutral" }),
    receive: node('dialogue', 96, "我们回到车上，季宁收到 N04 三项回执：原票、老周责任说明、沈棠送达材料各有编号。“这次谁接了，能找到。”她读回一遍才收起终端。我给她一杯还温着的水。五处旧记录已经汇齐，下一班安排的是获准调阅和技术核对，现场未知支路仍隔离。", [next('finish', '将零线工单转入事故核查', 'end')], { visual: 'dispatch', location: '抢修车 · 返回供电所', scene: {
            background: "/art/repair-van.webp"
        }, speaker: "季宁", portrait: "ji", expression: "neutral" }),
    end: node('ending', 100, '第四回路记录完成。设备检查与人的经历分别保留，未知支路继续隔离，N04原票及补充责任说明进入档案。老周没有获得一句轻巧的原谅，但他第一次准备把自己签过的字讲给应当听见的人。\n\n地图上的五个缺口连成一圈。你将去确认：它原本是怎样一条救人的路，又是怎样变成了无人归还的记录。', [{ id: 'restart', label: '重新调查《零线》', next: 'dispatch', resetEvidence: true }], { outcome: 'complete', requiresEvidence: requiredEvidence, scene: { background: '/art/substation.webp', inscription: 'N04 · 原件交回，责任不再悬空' } })
  }
};
