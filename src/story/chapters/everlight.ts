import type { Chapter, StoryAction, StoryNode } from '../types';

const requiredEvidence = ['unlisted-feed', 'timed-relay', 'occupied-load', 'waiting-promise', 'lamp-route'] as const;
const next = (id: string, label: string, target: string): StoryAction => ({ id, label, next: target });
const node = (
  kind: StoryNode['kind'], progress: number, text: string, actions: readonly StoryAction[],
  extra: Partial<StoryNode> = {}
): StoryNode => ({
  kind, progress, text, actions, location: '城西 · 长安里三号楼', time: '凌晨', visual: 'lamp',
  scene: { background: '/art/stairwell.svg' }, ...extra
});

export const everlight: Chapter = {
  id: 'everlight', order: 3, title: '长明', subtitle: '第三章 · 留一盏灯',
  synopsis: '没有登记电源的楼道灯熄灭后，整栋楼的人失去了睡眠。你必须分清维持生活的供电与一份没人敢结束的等待。',
  entryNode: 'dispatch', requiredEvidence,
  clue: { code: 'L03', title: '长明继电记录', detail: '旧应急联络路线的第三个等候点。杨桂梅留灯的时间与许守成当夜巡查相同；原照明移交人一栏被空白覆盖。', x: 82, y: 47 },
  evidence: {
    'unlisted-feed': { title: '图纸以外的灯', detail: '三号楼有登记的住宅照明回路，旧楼道灯却不属于它。外部电源隔离后，住户照明熄灭，旧灯仍亮；不能把两者作为同一支路送电。' },
    'timed-relay': { title: '零点十七分的空继电器', detail: '停电、恢复住宅照明、人员往来都没有改变旧灯。没有线圈供电的旧继电器却每天在00:17响一次；这个时间写在七年前的巡查交接页上。' },
    'occupied-load': { title: '三层仍然有人住', detail: '现住十二户的常规电量、住宅线路和人员记录相符。失眠来自“没有听见归来”的等待，不能用整栋停电或异常灯的亮灭代替负荷与人员核查。' },
    'waiting-promise': { title: '杨桂梅的约定', detail: '杨桂梅答应夜巡的许守成留一盏楼道灯，让他回来时看得见台阶。七年前，许守成没有回来；她一直没收到那次工作结束的消息。' },
    'lamp-route': { title: 'L03照明移交页', detail: '旧应急照明移交页记录“长安里三号楼，等候点L03，巡查00:17”。交接人许守成的名字被涂去，备注只剩“待回所”。' }
  },
  nodes: {
    dispatch: node('dialogue', 3, '林岚把两张工单放在一起。第一张是“楼道常明灯，疑似私接电源”，第二张只有一行字：“灯修好以后，全楼睡不着。”修好是昨天下午。报修电话从傍晚打到了现在，十二户人家没有争吵，只轮流问值班室：今夜还会有人上楼吗？', [next('accept', '接下两张工单', 'consult')], { speaker: '林岚', portrait: 'lin', location: '供电所 · 值班室', time: '23:38', visual: 'dispatch', scene: { background: '/art/dispatch.svg', document: { title: '并单报修 L03', lines: ['长安里三号楼 · 十二户', '常明灯已拆除，住宅供电正常', '追加报修：全楼无法入睡'] } } }),
    consult: node('dialogue', 6, '“昨天下午只是把旧灯罩卸下来，没动住宅线路。”林岚复述维修人的记录，“验电显示无外来电源，灯却又自己亮了。他不敢继续，装回去了。”老周听见楼名，手里的茶停了一下。他说这栋楼的台阶有裂缝，别只顾着抬头看灯。', [next('depart', '带上图纸与维修记录', 'arrival')], { speaker: '老周', portrait: 'zhou', visual: 'dispatch', scene: { background: '/art/dispatch.svg' } }),
    arrival: node('dialogue', 9, '三号楼夹在两栋新楼之间，像一册忘了装订的旧纸。每家门缝里都透着电视光，节目已经播完，屏幕仍没人关。三楼拐角那盏灯特别旧，光落在一只搪瓷盆里。雨水滴进去，盆底的影子一直朝着同一个方向。', [next('gate', '先核对现场与作业边界', 'gate')], { time: '00:04' }),
    gate: node('dialogue', 12, '你向物业确认昨天下午的操作范围，围好检修位置，把常规住宅供电与来历不明的旧灯分别标在草图上。门口坐着一个年轻人，眼睛红得厉害。他说母亲一直在等楼梯响，自己陪着她等了两夜，后来才发现所有邻居都在等。', [next('meet', '询问最早报修的住户', 'meetMei')]),
    meetMei: node('dialogue', 15, '开门的是在槐荫巷见过的杨婶，登记名杨桂梅。她白天回槐荫照看旧宅，夜里住女儿在三号楼的家。门后仍有两把椅子。“昨晚不是怕黑，卧室的灯都亮着。”她扶着自己的手，“是楼道太安静。灯一灭，就像有人还站在外头，我们把门锁早了。”', [next('rules', '请她说明留灯的习惯', 'houseRules')], { speaker: '杨桂梅', portrait: 'mei' }),
    houseRules: node('dialogue', 18, '楼里有条规矩：半夜听见钥匙碰栏杆，不出门催；灯亮着，就留一段台阶给迟归的人。杨婶说，规矩没有写过通知，也没人挨家教过，住久了便都知道。你问迟归的是谁。她指了指第二把椅子，没有回答，先把上面那层薄灰擦掉。', [next('stairs', '查看灯下的楼梯', 'stairs')], { speaker: '杨桂梅', portrait: 'mei' }),
    stairs: node('dialogue', 21, '第三层的灯罩有一道黑边，下面的墙面却干净。裂开的台阶边贴着一条褪色反光胶带，只有从下往上走才容易看见。你想起老周的提醒。它不像祭坛，倒像一个人知道这里危险，随手留了个标记，此后再也没机会回来更换。', [next('investigate', '分别调查电源、时间、住户与约定', 'inspection')]),
    inspection: node('investigation', 25, '你把住宅线路图夹在板上。现在需要四种互不替代的记录：旧灯属于哪条线路、何时发生变化、住宅负荷是否正常，以及是谁一直在等。先把事实写下来，不能因为一盏灯违反常识，就把整栋楼的生活也算成异常。', [
      { id: 'feed', label: '核对灯的供电与图纸', next: 'feed', hidesWhenCollected: 'unlisted-feed' },
      { id: 'relay', label: '检查旧继电器与时间记录', next: 'relay', hidesWhenCollected: 'timed-relay' },
      { id: 'load', label: '核对住户负荷与失眠记录', next: 'load', hidesWhenCollected: 'occupied-load' },
      { id: 'promise', label: '询问杨婶的第二把椅子', next: 'promise', hidesWhenCollected: 'waiting-promise' },
      { id: 'review', label: '带四份记录回到楼门口', next: 'meeting', requiresEvidence: requiredEvidence.slice(0, 4) }
    ], { objective: { title: '分清供电与等待', detail: '取得四条现场证据；每条记录都关系到后面的时间与负荷判断。' }, scene: { background: '/art/stairwell.svg', hotspots: [{ id: 'feed', actionId: 'feed', label: '线路图', x: 26, y: 66 }, { id: 'relay', actionId: 'relay', label: '继电器箱', x: 61, y: 33 }, { id: 'load', actionId: 'load', label: '住宅门牌', x: 81, y: 54 }, { id: 'promise', actionId: 'promise', label: '第二把椅子', x: 40, y: 81 }] } }),
    feed: node('dialogue', 27, '常规电源按作业许可隔离后，住宅走廊的新灯全部熄灭，旧灯保持原来的亮度。你确认仪表状态，换一个测点复核，没有把那点暗黄误认成应急照明。图纸上这一层只有一处照明端点，而墙里的旧管线在改造页上被标成了“已拆”。', [next('feed-note', '对照改造页与现场痕迹', 'feedRecord')]),
    feedRecord: node('evidence', 29, '旧灯的安装日期早于现在的表箱。墙里那条金属管绕过住宅线路，进入已经封住的竖井；不能仅凭没有读数认定它安全，也不能假定合上新回路就能解释它。你在草图上给旧灯单独画框。框内写“来源未明，保持隔离”，框外仍是十二户的正常供电。', [{ id: 'collect-feed', label: '记录：图纸以外的灯', next: 'inspection', collect: 'unlisted-feed' }], { excludesEvidence: ['unlisted-feed'] }),
    relay: node('dialogue', 27, '物业留下的监听记录覆盖了昨天下午到今夜。楼道继电器每天00:17轻响一次，听起来像钥匙碰了一下铁栏杆。00:10住宅回路隔离时没有响；00:25恢复时也没有响。箱内的线圈端已经断开，物业仍把那声响记成“通电吸合”。', [next('relay-note', '把听见的响声与电源状态分开', 'relayRecord')]),
    relayRecord: node('evidence', 29, '你修正记录：这是发生在旧继电器附近的机械响声，没有证据证明线圈通电。维修人的手表、楼道监控和林岚的值班时间彼此一致。再看箱盖上的纸条，“巡查00:17，回来敲栏杆”写了两遍，第二遍的笔尖划破了纸。下面的签名被人剪掉了。', [{ id: 'collect-relay', label: '记录：零点十七分的空继电器', next: 'inspection', collect: 'timed-relay' }], { excludesEvidence: ['timed-relay'], scene: { background: '/art/stairwell.svg', document: { title: '昨夜时序复核', lines: ['00:10 · 住宅线路隔离 · 旧灯无变化', '00:17 · 空继电器轻响 · 无线圈供电', '00:25 · 恢复住宅照明 · 旧灯无变化', '旧纸条：巡查00:17，回来敲栏杆'] } } }),
    load: node('dialogue', 27, '住户把近两天的时间写在便签上。有的人躺到凌晨，有的人起来给家人热饭。起夜时间并不相同，也没有集体用大功率电器。楼里的电量曲线与改造前相差不大。最年轻的住户前年才搬来，他甚至不知道旧灯存在了多久，却也在等一个上楼的声音。', [next('load-note', '核对电量、现住人数与口述', 'loadRecord')]),
    loadRecord: node('evidence', 29, '你得到的是十二户真实生活的记录：冰箱启停，手机充电，夜班回来的人煮了面。没有隐藏的大负载，也没有一户凭空增加。有人把“灯不灭就能睡”写在报修备注里，你划出问号。能睡的条件也许不是光，而是他们以为有人替整栋楼守着那一段台阶。', [{ id: 'collect-load', label: '记录：三层仍然有人住', next: 'inspection', collect: 'occupied-load' }], { excludesEvidence: ['occupied-load'] }),
    promise: node('dialogue', 27, '杨婶终于说出第二把椅子的来历。七年前改造停电，她摔过一次，夜巡的许守成背她上了三楼。后来他每次经过都问一句灯亮不亮。“我说，你忙你的，我给你留着。回来不必叫门，敲一下栏杆就知道是你。”她把那句话说得很慢，像在重新确认当天真的说过。', [next('promise-note', '询问这次巡查是否有人交接', 'promiseRecord')], { speaker: '杨桂梅', portrait: 'mei' }),
    promiseRecord: node('evidence', 29, '“后来都说他调走了。我问去哪个所，谁都不答。”杨婶拿出装着旧纸条的饼干盒。邻居劝过她别等，她却反问：工作没交接，怎么能替他关灯？你没有顺着她说“他快回来了”。你把许守成三个字完整写下，告诉她，这一次会去查清那份没有交回的记录。', [{ id: 'collect-promise', label: '记录：杨桂梅的约定', next: 'inspection', collect: 'waiting-promise' }], { speaker: '杨桂梅', portrait: 'mei', excludesEvidence: ['waiting-promise'] }),
    meeting: node('dialogue', 38, '你在楼门口与老周通话。他没有再说台阶，而是让你去找物业留存的照明移交夹。“别只看打印件。原件里面应该有一张手写的。”电话那头传来抽屉滑动的声音，随后他补了一句：“找到名字以后别先念给全楼听，先把事情核实，老人已经等得够久了。”', [next('notice', '查看七年前的改造通知', 'notice')], { speaker: '老周', portrait: 'zhou', requiresEvidence: requiredEvidence.slice(0, 4) }),
    notice: node('dialogue', 41, '通知说改造会在当夜完成，楼道临时照明由巡查人员确认移交。打印纸上每栋楼都盖了章，唯独三号楼写着“待回所”。后来的电子表把这句话改成“已完成”，时间却早于当夜最后一次巡查。你在报告里并列保留两份记录，没有替任何一份补上它缺失的过程。', [next('ticket', '打开原始照明移交夹', 'oldTicket')]),
    oldTicket: node('dialogue', 44, '旧夹里一张蓝色复写纸粘着另一张纸。揭开时，露出“L03”与“00:17”。交接人一栏被涂得很平，纸背的压痕仍留下许守成的姓。杨婶的门牌写在备注里，旁边是“楼梯缺口，留灯”。它不是用来保佑亡人的符号，是一条尚未结束的工作提醒。', [next('route-note', '记录原始移交页', 'archiveRecord')]),
    archiveRecord: node('evidence', 46, '你将原件拍照，标注出处与页码。L03不是新系统里的线路号，而是旧应急路线的第三个等候点。它与槐荫巷的空户号、拆迁区的旧路线都属于改造前的记录。目前没有证据能把灯解释成远处某个电源；能够复核的异常范围，只在这盏灯、这张交接页和一次未完成的等待之间。', [{ id: 'collect-route', label: '记录：L03照明移交页', next: 'compare', collect: 'lamp-route' }], { excludesEvidence: ['lamp-route'] }),
    compare: node('dialogue', 50, '五条记录摆在工具箱上。住宅供电变化不控制旧灯，00:17却始终出现同一种声响；十二户没有额外负荷，却共同继承了等候的习惯。你可以解释电气边界，仍不能解释灯怎样发光。现在需要的判断不是给它起一个神秘名字，而是找出哪些变化真正相关。', [next('time', '先按时序判断触发条件', 'puzzleTime')], { requiresEvidence: requiredEvidence }),
    puzzleTime: node('puzzle', 55, '维修记录：00:10住宅线路隔离；00:17空继电器轻响；00:25住宅照明恢复。旧纸条：巡查00:17，回来敲栏杆。哪一项最能解释响声与居民的等待，且没有把未经证实的现象当成电源？', [next('supply', '00:25恢复住宅照明，让旧灯重新通电', 'wrongTime'), next('timer', '00:17属于未交接的巡查约定，与供电变化无关', 'timeExplained'), next('ignore', '只要没有读数，就可以按普通定时开关结案', 'wrongTime')], { requiresEvidence: requiredEvidence, puzzle: { prompt: '将三次时间记录与旧纸条匹配', hint: '先比较旧灯对隔离与恢复供电的反应。记录中的响声并不等于继电器获得了电源。' } }),
    wrongTime: node('ending', 55, '你没有解释时间差异，就给旧箱写下普通电气故障的结论。物业照着错误报告更换新定时器，00:17旧箱仍响了，新箱在00:25又响了一次。楼里的人以为来的是两个不同的人，谁也不敢睡。林岚退回报告：你需要解释那八分钟，不能让一张错表替居民制造更多等待。', [next('retry', '重看三条时间记录', 'puzzleTime')], { outcome: 'failure', requiresEvidence: requiredEvidence }),
    timeExplained: node('dialogue', 59, '你将00:17圈在“待回所”旁边。旧箱记录的是巡查还没有结束，不是住宅线路的送电时刻。杨婶看着两个圈，问许守成是不是忘了下班。你说：“不是忘了。有人把结束的那一页拿走了。我现在还没有全部答案，但不会再用一盏灯替代那个答案。”', [next('load-choice', '判断下一步怎样保留安全边界', 'puzzleLoad')]),
    puzzleLoad: node('puzzle', 63, '现住十二户的负荷正常；来历未明的旧灯独立于住宅回路；居民在等待巡查的结束。你应怎样处理这三件事，才能既不把异常接进电网，也不继续替杨婶编造归来的承诺？', [next('cut-all', '让整栋楼保持断电，直到所有人不再等待', 'wrongCut'), next('join', '把旧灯接入住宅线路，用正常电源维持约定', 'wrongCut'), next('separate', '恢复经核验的住宅照明，隔离旧灯，并核实交接人的下落', 'boundary')], { requiresEvidence: requiredEvidence, puzzle: { prompt: '选择能够同时成立的电气与人情处理方案', hint: '负荷正常的住户不该承担未知支路的风险。等待需要明确的事实，不需要另一条供电旁路。' } }),
    wrongCut: node('ending', 63, '你的方案把十二户的正常生活与未知旧灯绑在一起：不是拿住宅停电迫使人结束等待，就是拿住宅电源替等待续上一条线。林岚退回方案，维持原安全边界。住户仍搬着椅子坐到门外，等你们说明为何不能各自处理。杨婶问：“是不是我们还没等够？”你必须改正这个没有证据的决定。', [next('retry', '重新区分正常负荷与未知支路', 'puzzleLoad')], { outcome: 'failure', requiresEvidence: requiredEvidence }),
    boundary: node('dialogue', 67, '经复核的住宅照明恢复，未明支路保留独立隔离与醒目标识。物业不能按旧灯仍亮着宣布检修完成，也不能擅自拆掉保全中的物证。你给林岚报清两部分状态，再请杨婶坐下来。她的手终于松开了饼干盒，像等到了一个不会转身走掉的人。', [next('interview', '向杨婶说明已核实的事实', 'interview')]),
    interview: node('dialogue', 70, '你只告诉她能够证实的部分：许守成那夜参与旧城抢修，之后没有完成交接；名字从原件中被涂去，不是正常调岗。剩下的事故档案仍在核对。杨婶沉默很久，说自己不是不知道有事，她只是怕一问，就连最后那句“给你留着”也变成不值钱的傻话。', [next('name', '请她保留自己的原始记忆', 'name')], { speaker: '杨桂梅', portrait: 'mei' }),
    name: node('dialogue', 73, '“那句话没有错。”你指着反光胶带，“他知道你走夜路容易摔，你记得给他留灯。有人没有交代他的下落，不是你留灯留错了。”杨婶第一次叫出完整的名字。楼道没有回应，灯罩里也没有出现人影。只有继电器轻响了一次，比原定时刻迟了很久。', [next('letter', '把核实结果写成可带走的说明', 'letter')]),
    letter: node('dialogue', 76, '你没有替事故写一个仓促的结论。纸上分成三栏：现已确认、仍待核查、后续联系人。杨婶的名字与许守成的名字都留在页上。她可以把这张纸拿给邻居看，也可以拿来追问供电所。以前所有人都说再等等，这一次有了一个明确会回答她的人。', [next('turn-off', '让杨婶决定怎样结束今晚的等待', 'turnOff')]),
    turnOff: node('dialogue', 79, '杨婶把第二把椅子挪回桌旁，说今晚不摆在门口了。她没有去碰灯，也没有念任何口诀，只对楼道说了一句：“守成，今天有人替你把事记下了。后面的我会问清楚，你不用在这儿守着我。”这不是她批准事故结案，只是允许自己先回屋睡一觉。', [next('interval', '记录旧灯的变化', 'interval')], { speaker: '杨桂梅', portrait: 'mei' }),
    interval: node('dialogue', 82, '旧灯先暗了一点，像积了许久的灰终于落进灯罩。随后它熄了。住宅照明没有波动，仪表也没有出现新的电流来源。你保持原来的安全边界，将先后顺序写进记录，没有把一次变化推广成所有异常的规律。远处有人轻轻关掉了电视。', [next('bedroom', '向住户复核照明与休息情况', 'bedroom')]),
    bedroom: node('dialogue', 85, '年轻住户扶母亲回到床边，回来向你说谢谢，声音压得很低，怕把她吵醒。十二户的门陆续关上，楼道不再像一个共同候车室。杨婶留给你一杯温水，杯沿有一道她总也擦不掉的裂纹。她说以后有夜巡的人来，坏台阶还是要记得修。', [next('pause', '再次查看台阶与旧箱', 'pause')]),
    pause: node('dialogue', 88, '你在裂缝边补贴临时警示，把后续维修写进物业移交单。旧灯熄灭不是台阶变安全的证明，也不是居民不再需要照明的理由。老周在电话那头听完，说那段胶带原来是许守成贴的。他一直以为这些小事早被新楼吞掉了，没想到有人还记得。', [next('record', '保全L03与原始巡查记录', 'record')], { speaker: '老周', portrait: 'zhou' }),
    record: node('dialogue', 91, '你的工单保留“异常来源未明”，没有改写成灯具故障。附件注明旧支路继续隔离，原件进入事故档案核对，住宅照明与台阶维修分别有人负责。林岚把L03加入城市旧路线图。那是一个等候点，不能当作需要重新接通的电气节点。', [next('delivery', '向杨婶交付后续回访单', 'delivery')], { requiresEvidence: requiredEvidence }),
    delivery: node('dialogue', 94, '杨婶把回访单折进饼干盒，旧纸条仍放在里面。她没有把许守成的名字烧掉，也没扔掉第二把椅子，只把盒盖盖好。“我还会等你们的消息，”她说，“但不用让全楼陪我一夜一夜等了。”你答应的是核查与答复，终于不是某个人会回来的谎话。', [next('dawn', '走出三号楼', 'dawn')], { speaker: '杨桂梅', portrait: 'mei' }),
    dawn: node('dialogue', 97, '天亮以前，楼道第一次安静得像普通住宅。你在车里看L03的扫描件，纸背还有一个被压住的“N”字。林岚来电：明天要核对一批金属外壳带电的报修，投诉人都在同一份旧名单上。名单标题是许守成的追悼会，出席人里面有老周。', [next('finish', '关闭现场工单，保留事故核查', 'end')], { location: '长安里 · 抢修车', visual: 'dispatch', scene: { background: '/art/dispatch.svg' } }),
    end: node('ending', 100, '第三回路记录完成。住宅照明恢复，未知灯路隔离，L03原始移交页保全。杨桂梅第一次不必用整夜醒着证明自己没有忘记一个人。灯灭了，许守成的名字没有灭。\n\n你知道接下来该查的不是怎样让灯再亮，而是谁把一个未交班的人从记录里移走了。', [{ id: 'restart', label: '重新调查《长明》', next: 'dispatch', resetEvidence: true }], { outcome: 'complete', requiresEvidence: requiredEvidence, scene: { background: '/art/stairwell.svg', inscription: 'L03 · 留下名字，结束等待' } })
  }
};
