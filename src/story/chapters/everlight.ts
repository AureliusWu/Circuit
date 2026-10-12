import type { Chapter, StoryAction, StoryNode } from '../types';

const requiredEvidence = ['unlisted-feed', 'timed-relay', 'occupied-load', 'waiting-promise', 'lamp-route'] as const;
const next = (id: string, label: string, target: string): StoryAction => ({ id, label, next: target });
const node = (
  kind: StoryNode['kind'], progress: number, text: string, actions: readonly StoryAction[],
  extra: Partial<StoryNode> = {}
): StoryNode => ({
  kind, progress, text, actions, location: '城西 · 长安里三号楼', time: '凌晨', visual: 'lamp',
  scene: { background: '/art/stairwell.webp' }, ...extra
});

export const everlight: Chapter = {
  id: 'everlight', order: 3, title: '长明', subtitle: '第三章 · 留一盏灯',
  synopsis: '没有登记电源的楼道灯熄灭后，整栋楼的人失去了睡眠。你必须分清维持生活的供电与一份没人敢结束的等待。',
  entryNode: 'dispatch', requiredEvidence,
  clue: { code: 'L03', title: '长明继电记录', detail: '旧应急联络路线的第三个等候点。杨桂梅留灯的时间与许守成当夜巡查相同；原照明移交人一栏被空白覆盖。', x: 82, y: 47 },
  evidence: {
    'unlisted-feed': { title: '图纸以外的灯', detail: '三号楼有登记的住宅照明回路，旧楼道灯却不属于它。联合检查已知照明回路及备用装置后，旧灯仍亮，封闭竖井内来源未定位；不能把两者作为同一支路送电。' },
    'timed-relay': { title: '零点十七分的空继电器', detail: '停电、恢复住宅照明、人员往来都没有改变旧灯。未发现线圈供电证据的旧继电器附近，每天00:17有一次机械轻响；这个时间写在七年前的巡查交接页上。' },
    'occupied-load': { title: '三层仍然有人住', detail: '现住十二户的常规电量、住宅线路和人员记录相符。居民自述失眠与“没有收到巡查交接”的等待有关，不能用整栋停电或异常灯的亮灭代替负荷与人员核查。' },
    'waiting-promise': { title: '杨桂梅的约定', detail: '杨桂梅答应夜巡的许守成留一盏楼道灯，让他回来时看得见台阶。七年前，许守成没有回来；她一直没收到那次工作结束的消息。' },
    'lamp-route': { title: 'L03照明移交页', detail: '旧应急照明移交页记录“长安里三号楼，等候点L03，巡查00:17”。交接人许守成的名字被涂去，备注只剩“待回所”。' }
  },
  nodes: {
    dispatch: node('dialogue', 3, "林岚把物业报来的两项记录交给抢修班：楼道旧灯疑有未登记来电，昨天下午物业检修后，住户说整夜睡不着。电网侧接入边界需要联合核对，灯具和台阶由物业负责。我和季宁接单，现场人员按值班安排到齐。十二户轮流来电，问的都是今夜还会不会有人上楼。", [next('accept', '接下两张工单', 'consult')], { speaker: '林岚', portrait: 'lin', location: "梧城电网 · 城区抢修班", time: '23:38', visual: 'dispatch', scene: { background: '/art/dispatch.webp', document: { title: '并单报修 L03', lines: ['长安里三号楼 · 十二户', '常明灯已拆除，住宅供电正常', '追加报修：全楼无法入睡'] } }, presence: "scene" }),
    consult: node('dialogue', 6, "季宁复述物业记录：“他们停下检修，封闭旧灯作业点，住宅用电没有持续停掉。‘没有查到电源’只适用于已经检查的范围。”我让她带上两套图纸。老周把茶放下，说三楼有段裂开的台阶，到了先看脚下。她在联系人旁边添了物业电工的名字。", [next('depart', '带上图纸与维修记录', 'arrival')], { speaker: "季宁", portrait: "ji", visual: 'dispatch', scene: { background: '/art/dispatch.webp' }, expression: "concerned" }),
    arrival: node('dialogue', 9, '三号楼夹在两栋新楼之间，像一册忘了装订的旧纸。每家门缝里都透着电视光，节目已经播完，屏幕仍没人关。三楼拐角那盏灯特别旧，光落在一只搪瓷盆里。雨水滴进去，盆底的影子一直朝着同一个方向。', [next('gate', '先核对现场与作业边界', 'gate')], { time: '00:04' }),
    gate: node('dialogue', 12, "物业合格人员负责楼内设施，本队在获准范围核对电网侧供电边界，工作负责人落实许可与监护。季宁把正常住宅线路和未知旧灯各画一框，记录共同确认人。门口年轻人陪母亲坐了两夜，眼睛红得厉害；我先告诉他正常供电的处置安排，再问报修经过。", [next('meet', '询问最早报修的住户', 'meetMei')], { speaker: "程砚（你）", portrait: "cheng", expression: "focused" }),
    meetMei: node('dialogue', 15, "开门的是杨桂梅，槐荫巷的杨婶。她早搬到女儿在长安里的住处，白天偶尔回旧巷帮亲戚。她认得我们，叫季宁把鞋底的雨水擦干。“卧室的灯一直亮着，”她说，“楼道安静下来，倒觉得他最后走过的那段台阶没人接了。”门后两把椅子，一把落着薄灰。", [next('rules', '请她说明留灯的习惯', 'houseRules')], { speaker: '杨桂梅', portrait: 'mei' }),
    houseRules: node('dialogue', 18, '楼里有条规矩：半夜听见钥匙碰栏杆，不出门催；灯亮着，就留一段台阶给迟归的人。杨婶说，规矩没有写过通知，也没人挨家教过，住久了便都知道。你问迟归的是谁。她指了指第二把椅子，没有回答，先把上面那层薄灰擦掉。', [next('stairs', '查看灯下的楼梯', 'stairs')], { speaker: '杨桂梅', portrait: 'mei' }),
    stairs: node('dialogue', 21, "季宁将裂缝和褪色胶带拍进物业移交页。反光条只在从下往上走时醒目，她蹲在安全区域看了一会儿：“贴的人是替上楼的人看的。”我示意她别靠近旧灯检修点。那盏暗黄的灯落在搪瓷盆里，雨水一圈圈打碎台阶的影子。", [next('investigate', '分别调查电源、时间、住户与约定', 'inspection')], { speaker: "季宁", portrait: "ji", expression: "neutral" }),
    inspection: node('investigation', 25, '你把住宅线路图夹在板上。现在需要四种互不替代的记录：旧灯属于哪条线路、何时发生变化、住宅负荷是否正常，以及是谁一直在等。先把事实写下来，不能因为一盏灯违反常识，就把整栋楼的生活也算成异常。', [
      { id: 'feed', label: '核对灯的供电与图纸', next: 'feed', hidesWhenCollected: 'unlisted-feed' },
      { id: 'relay', label: '检查旧继电器与时间记录', next: 'relay', hidesWhenCollected: 'timed-relay' },
      { id: 'load', label: '核对住户负荷与失眠记录', next: 'load', hidesWhenCollected: 'occupied-load' },
      { id: 'promise', label: '询问杨婶的第二把椅子', next: 'promise', hidesWhenCollected: 'waiting-promise' },
      { id: 'review', label: '带四份记录回到楼门口', next: 'meeting', requiresEvidence: requiredEvidence.slice(0, 4) }
    ], { objective: { title: '分清供电与等待', detail: '取得四条现场证据；每条记录都关系到后面的时间与负荷判断。' }, scene: { background: '/art/stairwell.webp', hotspots: [{ id: 'feed', actionId: 'feed', label: '线路图', x: 26, y: 66 }, { id: 'relay', actionId: 'relay', label: '继电器箱', x: 61, y: 33 }, { id: 'load', actionId: 'load', label: '住宅门牌', x: 81, y: 54 }, { id: 'promise', actionId: 'promise', label: '第二把椅子', x: 40, y: 81 }] } }),
    feed: node('dialogue', 27, "联合检查时，正常照明支路按许可短时隔离，物业核对已知备用装置、蓄电模块和余辉现象，旧灯亮度没有对应变化。可查范围里找不到与它相符的供电路径，封闭竖井内部仍待专项排查。正常支路检查完成便按程序恢复，住户不用陪我们继续停电。", [next('feed-note', '对照改造页与现场痕迹', 'feedRecord')]),
    feedRecord: node('evidence', 29, "季宁给封闭竖井画虚线，旁边标“未核实，禁止越界作业”。旧管早于现用表箱，图上“已拆”与现场可见物不一致，不能凭一个无读数结论放行。她将联合检查的范围与未知部分交给专业岗位，住宅供电和旧灯调查各有一份状态。", [{ id: 'collect-feed', label: '记录：图纸以外的灯', next: 'inspection', collect: 'unlisted-feed' }], { excludesEvidence: ['unlisted-feed'], speaker: "季宁", portrait: "ji", expression: "concerned" }),
    relay: node('dialogue', 27, '物业留下的监听记录覆盖了昨天下午到今夜。楼道继电器每天00:17轻响一次，听起来像钥匙碰了一下铁栏杆。00:10住宅回路隔离时没有响；00:25恢复时也没有响。箱内的线圈端已经断开，物业仍把那声响记成“通电吸合”。', [next('relay-note', '把听见的响声与电源状态分开', 'relayRecord')]),
    relayRecord: node('evidence', 29, "“这里听到轻响，但不能写通电吸合。”季宁核对监控、物业监听和终端时标，修正描述。00:17的声响与00:25的住宅复电不同步，已知线圈端也没供电证据。旧箱纸条写着“巡查00:17，回来敲栏杆”，第二遍笔尖划破了纸，签名被剪去。", [{ id: 'collect-relay', label: '记录：零点十七分的空继电器', next: 'inspection', collect: 'timed-relay' }], { excludesEvidence: ['timed-relay'], scene: { background: '/art/stairwell.webp', document: { title: '昨夜时序复核', lines: ['00:10 · 住宅线路隔离 · 旧灯无变化', '00:17 · 空继电器轻响 · 无线圈供电', '00:25 · 恢复住宅照明 · 旧灯无变化', '旧纸条：巡查00:17，回来敲栏杆'] } }, speaker: "季宁", portrait: "ji", expression: "neutral" }),
    load: node('dialogue', 27, '住户把近两天的时间写在便签上。有的人躺到凌晨，有的人起来给家人热饭。起夜时间并不相同，也没有集体用大功率电器。楼里的电量曲线与改造前相差不大。最年轻的住户前年才搬来，他甚至不知道旧灯存在了多久，却也在等一个上楼的声音。', [next('load-note', '核对电量、现住人数与口述', 'loadRecord')]),
    loadRecord: node('evidence', 29, "十二户的正常用电对应真实生活：冰箱启停，手机充电，夜班回来的人煮面。没有额外大负载，也没有凭空增加的用户。季宁登记住户自述的失眠与等待，不把它写成已经证明的线路规律。年轻人说只想让母亲睡一晚，我确认正常供电照常保障。", [{ id: 'collect-load', label: '记录：三层仍然有人住', next: 'inspection', collect: 'occupied-load' }], { excludesEvidence: ['occupied-load'] }),
    promise: node('dialogue', 27, '杨婶终于说出第二把椅子的来历。七年前改造停电，她摔过一次，夜巡的许守成背她上了三楼。后来他每次经过都问一句灯亮不亮。“我说，你忙你的，我给你留着。回来不必叫门，敲一下栏杆就知道是你。”她把那句话说得很慢，像在重新确认当天真的说过。', [next('promise-note', '询问这次巡查是否有人交接', 'promiseRecord')], { speaker: '杨桂梅', portrait: 'mei' }),
    promiseRecord: node('evidence', 29, "“槐荫巷那天我已经知道守成遇难。”杨婶打开饼干盒，“可这边还写他巡查未交。总觉得关灯，就把他留的最后一件事也关没了。”季宁把旧纸条平放在桌上，告诉她会核对交接去向。悲伤有自己的时刻，工作记录也需要一个明确接收人。", [{ id: 'collect-promise', label: '记录：杨桂梅的约定', next: 'inspection', collect: 'waiting-promise' }], { speaker: '杨桂梅', portrait: 'mei', excludesEvidence: ['waiting-promise'] }),
    meeting: node('dialogue', 38, "楼门口，老周拿出物业联络的照明移交目录，指给我们看原件所在页。“别只看后来打印的完成表。”季宁向物业确认调阅范围和编号。我提醒他涉及当年自己职责的说明要另行提交，正式事故复核仍由独立岗位办理。他点头，没有再把那张附页塞回内袋。", [next('notice', '查看七年前的改造通知', 'notice')], { speaker: '老周', portrait: 'zhou', expression: 'focused', requiresEvidence: requiredEvidence.slice(0, 4) }),
    notice: node('dialogue', 41, '通知说改造会在当夜完成，楼道临时照明由巡查人员确认移交。打印纸上每栋楼都盖了章，唯独三号楼写着“待回所”。后来的电子表把这句话改成“已完成”，时间却早于当夜最后一次巡查。你在报告里并列保留两份记录，没有替任何一份补上它缺失的过程。', [next('ticket', '打开原始照明移交夹', 'oldTicket')]),
    oldTicket: node('dialogue', 44, "经物业授权调阅的复写纸露出“L03 / 00:17”。它来自旧城联合救援的临时照明移交，不是本队今天对楼内资产的操作票。季宁读出纸背压痕里许守成的姓和杨婶门牌，拍好页码：“待回所被改成完成，原接收凭据在哪里？”", [next('route-note', '记录原始移交页', 'archiveRecord')], { speaker: "季宁", portrait: "ji", expression: "neutral" }),
    archiveRecord: node('evidence', 46, '你将原件拍照，标注出处与页码。L03不是新系统里的线路号，而是旧应急路线的第三个等候点。它与槐荫巷的空户号、拆迁区的旧路线都属于改造前的记录。目前没有证据能把灯解释成远处某个电源；能够复核的异常范围，只在这盏灯、这张交接页和一次未完成的等待之间。', [{ id: 'collect-route', label: '记录：L03照明移交页', next: 'compare', collect: 'lamp-route' }], { excludesEvidence: ['lamp-route'] }),
    compare: node('dialogue', 50, "季宁摆出五条记录：住宅供电不控制旧灯，00:17却留下同一种声响；十二户负荷正常，住户将等待同一段巡查联系起来。我让她把电气测量和口述再读一遍。我们能确定联合检查的边界，灯怎样发光仍未定位，不能用一个动人的故事越过这个空白。", [next('time', '先按时序判断触发条件', 'puzzleTime')], { requiresEvidence: requiredEvidence, speaker: "程砚（你）", portrait: "cheng", expression: "focused" }),
    puzzleTime: node('puzzle', 55, '维修记录：00:10住宅线路隔离；00:17空继电器轻响；00:25住宅照明恢复。旧纸条：巡查00:17，回来敲栏杆。哪一项最能解释响声与居民的等待，且没有把未经证实的现象当成电源？', [next('supply', '00:25恢复住宅照明，让旧灯重新通电', 'wrongTime'), next('timer', '00:17属于未交接的巡查约定，与供电变化无关', 'timeExplained'), next('ignore', '只要没有读数，就可以按普通定时开关结案', 'wrongTime')], { requiresEvidence: requiredEvidence, puzzle: { prompt: '将三次时间记录与旧纸条匹配', hint: '先比较旧灯对隔离与恢复供电的反应。记录中的响声并不等于继电器获得了电源。' } }),
    wrongTime: node('ending', 55, '你没有解释时间差异，就给旧箱写下普通电气故障的结论。物业照着错误报告更换新定时器，00:17旧箱仍响了，新箱在00:25又响了一次。楼里的人以为来的是两个不同的人，谁也不敢睡。林岚退回报告：你需要解释那八分钟，不能让一张错表替居民制造更多等待。', [next('retry', '重看三条时间记录', 'puzzleTime')], { outcome: 'failure', requiresEvidence: requiredEvidence }),
    timeExplained: node('dialogue', 59, "季宁将00:17圈在原巡查记录旁，00:25圈在本次正常照明复电旁。“两段时间要分别留下。”杨婶问是不是以前工作没有交完。我告诉她，原件和后来完成状态存在缺口，今天会将证据交给明确的核查人，不拿轻响替代答复。", [next('load-choice', '判断下一步怎样保留安全边界', 'puzzleLoad')]),
    puzzleLoad: node('puzzle', 63, '现住十二户的负荷正常；来历未明的旧灯独立于住宅回路；居民在等待巡查的结束。你应怎样处理这三件事，才能既不把异常接进电网，也不继续替杨婶编造归来的承诺？', [next('cut-all', '让整栋楼保持断电，直到所有人不再等待', 'wrongCut'), next('join', '把旧灯接入住宅线路，用正常电源维持约定', 'wrongCut'), next('separate', '恢复经核验的住宅照明，隔离旧灯，并核实交接人的下落', 'boundary')], { requiresEvidence: requiredEvidence, puzzle: { prompt: '选择能够同时成立的电气与人情处理方案', hint: '负荷正常的住户不该承担未知支路的风险。等待需要明确的事实，不需要另一条供电旁路。' } }),
    wrongCut: node('ending', 63, '你的方案把十二户的正常生活与未知旧灯绑在一起：不是拿住宅停电迫使人结束等待，就是拿住宅电源替等待续上一条线。林岚退回方案，维持原安全边界。住户仍搬着椅子坐到门外，等你们说明为何不能各自处理。杨婶问：“是不是我们还没等够？”你必须改正这个没有证据的决定。', [next('retry', '重新区分正常负荷与未知支路', 'puzzleLoad')], { outcome: 'failure', requiresEvidence: requiredEvidence }),
    boundary: node('dialogue', 67, '经复核的住宅照明恢复，未明支路保留独立隔离与醒目标识。物业不能按旧灯仍亮着宣布检修完成，也不能擅自拆掉保全中的物证。你给林岚报清两部分状态，再请杨婶坐下来。她的手终于松开了饼干盒，像等到了一个不会转身走掉的人。', [next('interview', '向杨婶说明已核实的事实', 'interview')]),
    interview: node('dialogue', 70, "我与季宁说明已有依据：许守成在2019年救出住户后回查旧线遇难；L03原件缺接收签名，后来的完成状态没有完整凭据。杨婶说这些年知道人不会再来，却怕他的工作也没人认。我给她看今天的编号、联系人和后续答复安排。", [next('name', '请她保留自己的原始记忆', 'name')], { speaker: '杨桂梅', portrait: 'mei' }),
    name: node('dialogue', 73, "季宁把纸页翻到反光胶带的照片：“台阶有人认真照看过，这件事可以留在住户口述里。”杨婶叫出许守成的全名，说盒里还存着他写的灯具尺寸。楼道没有人影，旧箱却轻响了一次，已经远过00:17。她和我一起记录实际时刻，没有把它叫作回应。", [next('letter', '把核实结果写成可带走的说明', 'letter')], { speaker: "季宁", portrait: "ji", expression: "neutral" }),
    letter: node('dialogue', 76, '你没有替事故写一个仓促的结论。纸上分成三栏：现已确认、仍待核查、后续联系人。杨婶的名字与许守成的名字都留在页上。她可以把这张纸拿给邻居看，也可以拿来追问供电所。以前所有人都说再等等，这一次有了一个明确会回答她的人。', [next('turn-off', '让杨婶决定怎样结束今晚的等待', 'turnOff')]),
    turnOff: node('dialogue', 79, '杨婶把第二把椅子挪回桌旁，说今晚不摆在门口了。她没有去碰灯，也没有念任何口诀，只对楼道说了一句：“守成，今天有人替你把事记下了。后面的我会问清楚，你不用在这儿守着我。”这不是她批准事故结案，只是允许自己先回屋睡一觉。', [next('interval', '记录旧灯的变化', 'interval')], { speaker: '杨桂梅', portrait: 'mei' }),
    interval: node('dialogue', 82, '旧灯先暗了一点，像积了许久的灰终于落进灯罩。随后它熄了。住宅照明没有波动，仪表也没有出现新的电流来源。你保持原来的安全边界，将先后顺序写进记录，没有把一次变化推广成所有异常的规律。远处有人轻轻关掉了电视。', [next('bedroom', '向住户复核照明与休息情况', 'bedroom')]),
    bedroom: node('dialogue', 85, '年轻住户扶母亲回到床边，回来向你说谢谢，声音压得很低，怕把她吵醒。十二户的门陆续关上，楼道不再像一个共同候车室。杨婶留给你一杯温水，杯沿有一道她总也擦不掉的裂纹。她说以后有夜巡的人来，坏台阶还是要记得修。', [next('pause', '再次查看台阶与旧箱', 'pause')]),
    pause: node('dialogue', 88, "物业在裂缝边补上临时警示，安排正规修复；季宁确认接收人和回访节点。旧灯熄灭没有使台阶自动安全。老周站在楼门口，看着反光条说那是守成贴的。我请他将出处写进证词，和自己的责任说明分别保留。小事值得记，调查也继续。", [next('record', '保全L03与原始巡查记录', 'record')], { speaker: '老周', portrait: 'zhou', expression: 'focused' }),
    record: node('dialogue', 91, '你的工单保留“异常来源未明”，没有改写成灯具故障。附件注明旧支路继续隔离，原件进入事故档案核对，住宅照明与台阶维修分别有人负责。林岚把L03加入城市旧路线图。那是一个等候点，不能当作需要重新接通的电气节点。', [next('delivery', '向杨婶交付后续回访单', 'delivery')], { requiresEvidence: requiredEvidence }),
    delivery: node('dialogue', 94, '杨婶把回访单折进饼干盒，旧纸条仍放在里面。她没有把许守成的名字烧掉，也没扔掉第二把椅子，只把盒盖盖好。“我还会等你们的消息，”她说，“但不用让全楼陪我一夜一夜等了。”你答应的是核查与答复，终于不是某个人会回来的谎话。', [next('dawn', '走出三号楼', 'dawn')], { speaker: '杨桂梅', portrait: 'mei' }),
    dawn: node('dialogue', 97, "天亮前，季宁在停稳的车里核对 L03 移交回执。“灯具归物业，未知管线待专项核查，原件有人接收。”我让她把窗外逐渐亮起的住宅也拍一张作为回访附件。林岚发来下一批金属壳麻感报修，关联许守成追悼会的旧名单；老周的名字在其中。", [next('finish', '关闭现场工单，保留事故核查', 'end')], { location: '长安里 · 抢修车', visual: 'dispatch', scene: {
            background: "/art/repair-van.webp"
        }, speaker: "季宁", portrait: "ji", expression: "neutral" }),
    end: node('ending', 100, '第三回路记录完成。住宅照明恢复，未知灯路隔离，L03原始移交页保全。杨桂梅第一次不必用整夜醒着证明自己没有忘记一个人。灯灭了，许守成的名字没有灭。\n\n你知道接下来该查的不是怎样让灯再亮，而是谁把一个未交班的人从记录里移走了。', [{ id: 'restart', label: '重新调查《长明》', next: 'dispatch', resetEvidence: true }], { outcome: 'complete', requiresEvidence: requiredEvidence, scene: { background: '/art/stairwell.webp', inscription: 'L03 · 留下名字，结束等待' } })
  }
};
