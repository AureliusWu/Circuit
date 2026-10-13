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
  synopsis: "三处旧金属壳都报麻感，却找不到共同的供电支路。报修人都参加过同一场追悼会，桌上四份纸传了一圈，原工作票最后又回到老周手里。",
  entryNode: 'dispatch', requiredEvidence,
  clue: { code: 'N04', title: '零线票据', detail: "N04于2019年00:31开票，终止、交回栏仍空。老周承认未经核完确认完成；今天只签责任说明，原空白保留。四席位帮助核对持有人，不能替代原件和当年职责。", x: 60, y: 76 },
  evidence: {
    'normal-readings': { title: '正常读数与相同刻字', detail: '经规范检查，报修设备没有复现漏电，保护与常规接线记录未见异常；不能据此否定不适。三处报修旧箱都残留04号标记，症状在谈到旧事故“结案”时出现。' },
    'funeral-seats': { title: '四席位与四份东西', detail: '西：老周，红色工作票夹，办理工作交接；东：杨桂梅，蓝色住户名单；南：沈棠，事故复印件；北：许家，白色信封。只有西席持有工作票原件与交接职责。' },
    'return-ticket': { title: '未交回的N04原票', detail: '04号中性线检修票于2019-10-11 00:31开出，终止与交回栏均为空。临时旁路和用户清单应当随票交回，不能用一张复印件替代完整归档。' },
    'undelivered-copy': { title: '沈棠没有送出的复印件', detail: '许家收到的是慰问与手续通知，没有收到救援经过。沈棠曾承诺送达完整说明，但她只有缺少现场签字的复印件，被告知“结案后再取”。' },
    'signed-status': { title: '老周承认的虚假完成状态', detail: "老周承认离开监护位置、未核完确认完成、原票及附页未及时提交，签的是今日责任说明。N04原票空白与更正日期一并保留，原件和说明分别由档案、独立复核岗位接收。" }
  },
  nodes: {
    dispatch: node('dialogue', 3, "南桥街三处报金属外壳麻手，两次检查没复现故障。林岚安排电网侧与产权方分别排查，将一张旧追悼会名单附过来。\n老周带着原票到班上，今天不负责复核自己的旧事。\n季宁看名单，抬头问他：“这张你也留着？”\n“名单不是我留的，票是。”他把皮包放到桌边。", [next('scope', '核对前两次检查的范围', 'scope')], { speaker: '林岚', portrait: 'lin', location: "梧城电网 · 城区抢修班", time: '22:26', visual: 'dispatch', scene: { background: '/art/dispatch.webp', document: { title: '关联报修 N04', lines: ['南桥街及周边 · 三处金属外壳不适', '既有检查：未复现故障，不等于排除所有风险', '共同事项：七年前许守成追悼会'] } }, presence: "scene" }),
    scope: node('dialogue', 6, "三处东西各不相同：供电侧箱体、用户电器、早不用的铁柜。季宁分别记产权和联系人。\n“一个没接线的柜子也报麻？”\n“照口述留着，设备各自查。”\n我让她核症状发生时的活动和环境，不用再让报修人摸一遍。她把这句转告回访同事，合上平板，拿起相机。", [next('approach', '与老周前往南桥街', 'approach')], { speaker: "季宁", portrait: "ji", visual: 'dispatch', scene: { background: '/art/dispatch.webp' }, expression: "neutral" }),
    approach: node('dialogue', 9, "雨停了，铁门上的水还往下走。沈棠站在报修人家门外，抱着塑料袋装的纸。\n老人说推门时掌心发麻，现在还像握着什么。沈棠拦着没让他重试，先把检修位置腾出来。\n季宁问刚才在聊什么。\n“许师傅那件事。”老人说，“我说都结案了，就这么一下。”", [next('boundary', '建立现场安全边界', 'touchBoundary')], { time: '23:05', scene: { background: '/art/alley.webp' }, visual: 'alley' }),
    touchBoundary: node('dialogue', 12, "相应岗位按设备状态落实停用、许可和监护，用户器具交产权方电工，电网侧箱体另按工单检查。\n季宁保存原始报修，不让人用手重现麻感。\n老人坐到屋里，翻出旧药盒，问是不是自己年纪大了。我们继续核环境和测量，他的那句怀疑也原样留在口述里。", [next('meet', '了解沈棠为何认识这些报修人', 'meetShen')], { speaker: "程砚（你）", portrait: "cheng", expression: "focused" }),
    meetShen: node('dialogue', 15, "“他们都来过许师傅的追悼会。”沈棠说。她当年代家里送材料，父亲沈衡在事故夜开接送车，后来平安回家，直到今年才去世。\n老人问过许守成怎么走的，得到的总是已经结案。\n沈棠把塑料袋抚平：“这几天谁说这句话，谁就去摸那几个旧箱。”", [next('funeral', '请她还原当年的交接场面', 'funeral')], { speaker: '沈棠', portrait: 'shen' }),
    funeral: node('dialogue', 18, "追悼会上有香、花和许守成的照片。老人说送人的纸得落到桌上，别再带回去，家里那年也听过这个讲究。\n可工作票、名单和复印件传了一圈，谁都觉得不该在席上追问，最后又各自收回。\n季宁问收回的是哪份。沈棠拿笔画桌子，说位置记得，人也记得。", [next('investigate', '核对读数、席位、原票与未送达材料', 'inspection')], { speaker: '沈棠', portrait: 'shen' }),
    inspection: node('investigation', 23, "设备报告、席位草图、老周的原票和沈棠的复印件放到一张桌上。四份东西，来历各不相同。\n老周坐在配电房门口，皮包压在膝上，红夹的一角露在外面。\n我将检修结果放在右侧，让季宁先核材料。屋外的铁柜没有接线，柜门却一直关不严。", [
      { id: 'reading', label: '复核设备与04号刻字', next: 'readings', hidesWhenCollected: 'normal-readings' },
      { id: 'seats', label: '还原葬礼四个席位', next: 'seats', hidesWhenCollected: 'funeral-seats' },
      { id: 'ticket', label: '查看老周带来的原工作票', next: 'ticket', hidesWhenCollected: 'return-ticket' },
      { id: 'copy', label: '检查沈棠没有送出的复印件', next: 'copy', hidesWhenCollected: 'undelivered-copy' },
      { id: 'compare', label: '对照四份调查结果', next: 'compare', requiresEvidence: requiredEvidence.slice(0, 4) }
    ], { objective: { title: '寻找没有接收人的交接', detail: '四项现场与档案核查完成后，按席位、物件和职责推理。' }, scene: { background: '/art/substation.webp', hotspots: [{ id: 'reading', actionId: 'reading', label: '报修旧箱', x: 24, y: 54 }, { id: 'seats', actionId: 'seats', label: '席位草图', x: 47, y: 72 }, { id: 'ticket', actionId: 'ticket', label: '旧工作票夹', x: 75, y: 43 }, { id: 'copy', actionId: 'copy', label: '塑料袋里的纸', x: 65, y: 83 }] } }),
    readings: node('dialogue', 25, "三处设备按各自状态检查，未找到共同的现实供电支路。设备处置由相应专业人员继续核，麻感暂时没复现。\n旧标记倒一样，都是04。有的刻在箱门，有的在杂物铁柜背面。\n季宁问哪年挪的柜，管理方翻旧照片，照片里的编号旁边，还多了一行已经擦掉的字。", [next('reading-note', '记录测量的结论与限度', 'readingRecord')]),
    readingRecord: node('evidence', 27, "铁柜里没有接线，现场测量没能与居民麻感建立供电关系。季宁将报告和照片分开留，口述里共同出现的那句已结案也单列。\n“字能看出什么吗？”老人问。\n原照片不够清楚，季宁申请调原图，没猜。铁柜门朝外张着一道缝，里面很黑，连雨水都没滴进去。", [{ id: 'collect-reading', label: '记录：正常读数与相同刻字', next: 'inspection', collect: 'normal-readings' }], { excludesEvidence: ['normal-readings'], speaker: "季宁", portrait: "ji", expression: "concerned" }),
    seats: node('dialogue', 25, "沈棠画下桌子：许家坐北，拿白信封；杨婶在东，带蓝色住户册；她在南，塑料袋里是复印件；老周在西，红夹装现场原票。\n西侧那位承担原工作交接，其他人提供名单、送材料或等说明。\n季宁核完持有人，问有没有当年的照片。沈棠说有，桌下的鞋也都拍到了。", [next('seats-note', '核对照片与席位便签', 'seatsRecord')], { speaker: '沈棠', portrait: 'shen' }),
    seatsRecord: node('evidence', 27, "当年照片能对上四席和材料颜色，红夹始终在西侧。季宁在草图旁标原件与各自职责，照片只是核位置。\n她放大桌下，发现西侧椅子往后挪了一点，像刚有人站起来。\n沈棠说拍照后老周就出去接电话，回来收走了红夹。\n我们记下这段，没有按四方的位置替谁定责。", [{ id: 'collect-seats', label: '记录：四席位与四份东西', next: 'inspection', collect: 'funeral-seats' }], { excludesEvidence: ['funeral-seats'], scene: { background: '/art/substation.webp', document: { title: '2019年追悼会 · 席位核对', lines: ['西 · 老周 · 红色工作票夹 · 工作交接', '东 · 杨桂梅 · 蓝色住户册 · 住户情况', '南 · 沈棠 · 塑料袋复印件 · 材料送达', '北 · 许家 · 白色信封 · 等待事故说明'] } }, speaker: "季宁", portrait: "ji", expression: "neutral" }),
    ticket: node('dialogue', 25, "老周打开红夹，N04原票在2019年10月11日00:31开出，终止与交回栏仍空。附页画独立供电的临时救援照明，沿途有漏登住户。\n季宁按原页顺序拍照，停在页边：“这里少一张？”\n“少过。”\n“谁拿的？”\n老周摇头，说要再查当时传过票的人。", [next('ticket-note', '对照原件与系统完成状态', 'ticketRecord')], { speaker: '老周', portrait: 'zhou', expression: 'focused' }),
    ticketRecord: node('evidence', 27, "原票缺旁路处置和人员返回，电子系统却写已完成。\n我问是不是老周那班的，他说是，编号也没错。\n季宁将票与系统状态并排，没动空栏。红夹内页有一道旧水印，停在执行栏外面。许守成的名字在上面，最后一笔拖出格线，和十三号那张纸上的字很像。", [{ id: 'collect-ticket', label: '记录：未交回的N04原票', next: 'inspection', collect: 'return-ticket' }], { excludesEvidence: ['return-ticket'], scene: { background: '/art/substation.webp', document: { title: 'N04 · 原始检修工作票', lines: ['开票：2019-10-11 00:31', '项目：04号中性线及临时联络检查', '终止、交回：空白', '附件：临时旁路示意、用户清单均未归档'] } } }),
    copy: node('dialogue', 25, "沈棠手里是救援经过复印件，末半页压着黑边。父亲在车边听见许守成说先送老人，他稍后返程。\n她答应把证词和材料送许家，后来被告知缺原现场签字，要等正式结论。\n“我才二十一，以为等几天就行。”\n她把黑边折开，后面还印着另一页的半个页码。", [next('copy-note', '核对家属实际收到的内容', 'copyRecord')], { speaker: '沈棠', portrait: 'shen' }),
    copyRecord: node('evidence', 27, "家属实际收件与沈棠保留的清单对不上，有一页没送达，原件也缺最终接收凭据。季宁登记出处、缺页和正式递送去向。\n沈棠拿出当年退件短信，下面写待回所。\n“和长安里那页一样。”季宁说。\n我让她先核两个编号，文字相同，也得找到各自的原页。", [{ id: 'collect-copy', label: '记录：沈棠没有送出的复印件', next: 'inspection', collect: 'undelivered-copy' }], { excludesEvidence: ['undelivered-copy'], speaker: "季宁", portrait: "ji", expression: "neutral" }),
    compare: node('dialogue', 36, "设备检测留在一侧，追悼会照片、原票和送达记录摊在另一侧。西侧红夹是原票，南侧塑料袋只有复印件，许家等的是说明。\n季宁把四席连到四份纸，没有把麻感写进责任判断。\n老周打开皮包，手指压在空着的交回栏上。现在能先问的，是谁把原票带回去了。", [next('grid', '按席位、物件与职责匹配交接人', 'puzzleSeats')], { requiresEvidence: requiredEvidence.slice(0, 4), speaker: "程砚（你）", portrait: "cheng", expression: "focused" }),
    puzzleSeats: node('puzzle', 41, "照片与口述都对上了：西侧老周持红夹原票，承担当年的工作交接；东侧杨婶带住户册；南侧沈棠带复印件；北侧许家收白信封，等事故说明。\n要查N04为什么没交回，必须先找到原件和原职责同时在的人。席位能帮助认人，签字还得看他当时做了什么。", [next('family', '北侧许家，收到信封就应承担结案责任', 'wrongBlame'), next('copy', '南侧沈棠，复印件与原件具有相同交接效力', 'wrongBlame'), next('west', '西侧老周，他持原票且承担工作交接', 'west')], { requiresEvidence: requiredEvidence.slice(0, 4), puzzle: { prompt: "谁同时持N04原件，并承担当年的工作交接？", hint: "四席记录已写明持有人与职责。许家收信封，沈棠只有复印件，红夹原票留在西侧。" } }),
    wrongBlame: node('ending', 41, "我让等说明的人先签结案。沈棠又得去找许家，红夹却还压在老周膝上。\n发出去的表很快退回：原工作票未交。\n季宁重看追悼会照片，白信封和塑料袋的位置对调了，红夹仍在西。她打开原始备份，两张也不同。桌下那把椅子，离桌又远了一点。", [next('retry', '重看谁持原件、谁负责交接', 'puzzleSeats')], { outcome: 'failure', requiresEvidence: requiredEvidence.slice(0, 4) }),
    west: node('dialogue', 45, "我请老周把原票放平，问为什么最后带走。\n“有人让我先关单，材料后补。”他说，“守成没回来，我怕翻开之后，班上谁都躲不过。”\n季宁问完成状态是谁确认。\n他盯着空栏，屋外铁柜门忽然碰了一下。\n“我。”\n他没有再看那道门缝。", [next('witness', '追问完成状态是谁确认的', 'witness')], { speaker: '老周', portrait: 'zhou', expression: 'focused' }),
    witness: node('dialogue', 48, "“没查齐旁路，也没等到交班，我就写了完成。”老周说。\n我让他分开写自己的动作、收到的联络和记不清的部分，相关责任另作独立复核。\n季宁问当年催关单的通知有没有原始记录。\n老周报了一处索引。她抄完，翻到下一行，纸还没写字，红夹背面先压出一个笔尖印。", [next('radio', '核对最后一次联络与附件缺口', 'radio')], { speaker: '老周', portrait: 'zhou', expression: 'focused' }),
    radio: node('dialogue', 51, "旧联络最后一条在00:47：许守成报告临时通路已经送出人，请求核后续处置。录音没完整进入工单，七日复核页也缺着。\n老周只能证明听过，不能靠记忆补全。我请林岚按Q07索引继续找。\n季宁将已完成时间与00:47对齐，时间先后对不上，旁边还有一次批量迁移的记录。", [next('return', '确认补交应保留哪些内容', 'puzzleReturn')], { requiresEvidence: requiredEvidence.slice(0, 4) }),
    puzzleReturn: node('puzzle', 56, "现场读数暂时正常，N04却没有交回，旧旁路来源与事故处置仍待核。老周愿意签说明。\n桌上摆着原票和新表，新表日期是今天。若把旧空格补成当年完成，缺页就又消失一遍；留下原状，才能继续核他那夜的实际动作。", [next('erase', '删去旁路和死亡经过，只补“检查正常，结案”', 'wrongErase'), next('archive', '保留原始空白与附件，签明事实和责任，未知支路继续隔离', 'signed')], { requiresEvidence: requiredEvidence.slice(0, 4), puzzle: { prompt: "老周今天签什么，才能继续核对那晚的事实？", hint: "原票已有空白，新表日期是今天。留住原件与缺页状态，另签当前说明。" } }),
    wrongErase: node('ending', 56, "我只补检查正常，删去旁路与事故经过。接收端收到一份没有缺项的新表，却退回原件核验。\n老周把红夹合上，夹口又露出一页空纸。\n季宁抽出来，上面是新的N04，日期2019年10月11日，执行栏已经写好。交回栏空着，等签字的笔尖印还湿。", [next('retry', '回到原件保全与隔离判断', 'puzzleReturn')], { outcome: 'failure', requiresEvidence: requiredEvidence.slice(0, 4) }),
    signed: node('evidence', 60, "老周签今天的责任说明，分别写离岗、未核完确认完成和附页未交。原票空白保留。\n季宁核日期和接收范围：“原件交档案，说明交独立复核，是这两份？”\n我逐项对好，她才封袋。\n红夹上的笔尖印干了，旧票缺字仍看得见，没有谁替许守成补返程时间。", [{ id: 'collect-signature', label: '记录：老周承认的虚假完成状态', next: 'handover', collect: 'signed-status' }], { portrait: "ji", speaker: "季宁", excludesEvidence: ['signed-status'], expression: "concerned" }),
    handover: node('dialogue', 64, "林岚通过电台报原件页码、收件编号与责任材料去向。季宁读回，三项都勾上。\n沈棠问老周：“我爸那年明明回家了，为什么许师傅那行不写？”\n老周把空下来的夹子放到桌边，过了很久才说，自己当时不想再看那一行。", [next('debt', "请老周说明原票的空白", 'debt')], { speaker: '林岚', portrait: 'lin', requiresEvidence: requiredEvidence, presence: "radio" }),
    debt: node('dialogue', 68, "沈棠听完，没有替许家说话。\n“你把原话留着，后面他们还会问。”\n老周点头，补了一页当年的联络经过，写不清的地方划了标记。\n季宁核附件来源，我看他的笔停在完成两个字旁，最后没去涂。他今天签过的日期落在新页最下面。", [next('courier', "登记沈棠的材料来源与递送状态", 'courier')], { speaker: '沈棠', portrait: 'shen' }),
    courier: node('dialogue', 71, "沈棠写好复印件来源和未送达原因，许家是否愿意见面由回访岗位去问，材料继续正式递送。\n她收下收件凭据，折好旧塑料袋。\n“每次带过去都下雨。”她说。\n季宁帮她压平袋角，两人发现夹层还有一点纸屑。页码刚好缺在复印件的黑边后面，我们另装保存。", [next('neighbors', '向报修住户说明现有结论', 'neighbors')], { portrait: 'shen' }),
    neighbors: node('dialogue', 74, "我将当前检查结果和回访方式交给住户，新的不适照样报告，设备继续按各自状态处理，不再让人试摸。\n老人点头，换了个木头门挡，把铁柜门顶好。\n“你们这回留哪张纸？”\n我给他看回访单。他把纸放到桌边，掌心贴着裤子揉了揉，没再靠近铁门。", [next('measure', '复核现场状态，不要求身体试验', 'measure')]),
    measure: node('dialogue', 77, "复测数值与先前一样，几名住户自述麻感减轻。季宁分别记，时间接近材料接收，还不足以确定因果。\n她将回访窗口留着，设备缺陷按产权继续处理。\n老人问是不是签字就好了，她指向检修报告，让他继续照设备处置安排做。柜门这次被木挡撑住，没有再响。", [next('naming', '检查04号旧标记的来源', 'naming')], { speaker: "季宁", portrait: "ji", expression: "neutral" }),
    naming: node('dialogue', 80, "04是当年的检修分段，几件旧物后来被挪过。管理方调来原图，编号旁被擦掉的字终于能看清：待交回。\n季宁核过图号，原件归档，现存设备另查。\n我拍下那四个字，又看住户的铁柜。柜背只有04，细灰里却留下同样的横向擦痕，像刚有人擦过一行字。", [next('visit', '询问老周是否愿意参加后续说明', 'visit')]),
    visit: node('dialogue', 83, "老周同意配合后续说明，回访同事先联系许家，询问是否愿意见面。\n他没把原票拿回去，空皮包终于能合上。\n“纸都交了？”他问。\n季宁给他读页码。\n读完，他摸了一下内袋。那里原来放着H13复印件，现在只剩一条被折痕压出的白印。", [next('file', '将N04归入城市旧路线图', 'file')], { speaker: '老周', portrait: 'zhou', expression: 'focused' }),
    file: node('dialogue', 86, "林岚把N04与L03放到同一套索引，五处缺口都有原件或取得依据。下一班获准调阅原图，逐项对照。\n季宁在地图上画出五点，没发任何操作指令。\n她问原路线究竟从哪里开始。\n林岚说看图例，虚线记录人员和资料，不能拿节点顺序当事故的时间顺序。", [next('night', '结束南桥街现场核查', 'night')], { speaker: '林岚', portrait: 'lin', requiresEvidence: requiredEvidence, presence: "radio" }),
    night: node('dialogue', 89, "沈棠送我们到巷口，说父亲2019年回家时，鞋里全是水，后来照常开车，退休，今年因病去世。\n“我还替他换过袜子，怎么会记错。”\n季宁把这句原话留下。早班豆腐店开始搬桌子，一个伙计喊另一个来吃饭。沈棠转头看了一眼，没有往声音那边走。", [next('oldZhou', '再听老周补充一件小事', 'oldZhou')], { speaker: '沈棠', portrait: 'shen', visual: 'alley', scene: { background: '/art/alley.webp' } }),
    oldZhou: node('dialogue', 92, "老周说许守成那夜带了两个馒头，分给等候的人，自己没吃。\n季宁问是谁看见，他说自己。她注明来源，没把这句塞进责任说明。\n我问工具袋里的糖是谁收的，老周说陈伯。\n两件物品、两处证词，各自能往前查，包里有没有那张少掉的纸，还得问当年的人。", [next('receive', "核对原件与说明的接收回执", 'receive')], { speaker: "季宁", portrait: "ji", expression: "neutral" }),
    receive: node('dialogue', 96, "车停稳，季宁核N04三份回执：原票、今日责任说明、沈棠送达材料。编号都能查。\n她拿过温水，喝了两口，翻到当年追悼会照片。\n“师傅，西边那把椅子，是不是每张都离桌更远？”\n我让她把原始备份封好。老周在前排，一直看着自己的空皮包。", [next('finish', '将零线工单转入事故核查', 'end')], { visual: 'dispatch', location: '抢修车 · 返回供电所', scene: {
            background: "/art/repair-van.webp"
        }, speaker: "季宁", portrait: "ji", expression: "neutral" }),
    end: node('ending', 100, "N04原票交回，今日说明进入独立复核，设备检查和住户口述分别留存。五处资料汇齐，下一班去核原图。\n车准备走时，林岚发来刚扫描的票。\n终止、交回栏仍是空白，格线下却多了一点浅印：还。\n季宁拿原位照片对，原来没有。\n老周看了一眼，说这不是自己的笔迹。", [{ id: 'restart', label: '重新调查《零线》', next: 'dispatch', resetEvidence: true }], { outcome: 'complete', requiresEvidence: requiredEvidence, scene: { background: '/art/substation.webp', inscription: "N04 · 原票空白保留，今日另签" } })
  }
};
