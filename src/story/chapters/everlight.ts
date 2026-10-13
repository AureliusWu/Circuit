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
  synopsis: "三号楼的人都在等半夜的钥匙声。住宅照明正常，旧灯却不受它控制；空继电器每天00:17轻响，七年前的巡查页写着同一时刻。",
  entryNode: 'dispatch', requiredEvidence,
  clue: { code: 'L03', title: '长明继电记录', detail: "L03巡查约定记在2019年00:17，原接收页缺签名，电子完成状态早于巡查。旧灯与住宅线路分别核查；重复钥匙声与Q07留言的背景声相似，来源未明。", x: 82, y: 47 },
  evidence: {
    'unlisted-feed': { title: '图纸以外的灯', detail: '三号楼有登记的住宅照明回路，旧楼道灯却不属于它。联合检查已知照明回路及备用装置后，旧灯仍亮，封闭竖井内来源未定位；不能把两者作为同一支路送电。' },
    'timed-relay': { title: '零点十七分的空继电器', detail: "昨夜00:10住宅回路隔离，00:17旧箱附近轻响，00:25住宅照明恢复，旧灯都无相应变化。未发现线圈供电证据；巡查旧纸条也记00:17，声音不能单独证明箱内通电。" },
    'occupied-load': { title: '三层仍然有人住', detail: '现住十二户的常规电量、住宅线路和人员记录相符。居民自述失眠与“没有收到巡查交接”的等待有关，不能用整栋停电或异常灯的亮灭代替负荷与人员核查。' },
    'waiting-promise': { title: '杨桂梅的约定', detail: "杨桂梅给夜巡的许守成留灯，他回程会拿钥匙碰栏杆，轻两下，再重一下。她知道许守成遇难，但L03巡查仍无交接消息，旧灯与钥匙声近来再次出现。" },
    'lamp-route': { title: 'L03照明移交页', detail: '旧应急照明移交页记录“长安里三号楼，等候点L03，巡查00:17”。交接人许守成的名字被涂去，备注只剩“待回所”。' }
  },
  nodes: {
    dispatch: node('dialogue', 3, "林岚给我两张报修：物业检修旧灯中止，住宅电正常；另有十二户说昨晚都睡不着。\n“这也报给我们？”季宁问。\n“楼道疑有未登记来电，得联合核边界。失眠先留口述。”\n我看了地址，是杨婶住的长安里。她在回访备注里写：今夜别从后门走。", [next('accept', '接下两张工单', 'consult')], { speaker: '林岚', portrait: 'lin', location: "梧城电网 · 城区抢修班", time: '23:38', visual: 'dispatch', scene: { background: '/art/dispatch.webp', document: { title: '并单报修 L03', lines: ['长安里三号楼 · 十二户', '旧灯检修中止，住宅供电正常', '追加报修：全楼无法入睡'] } }, presence: "scene" }),
    consult: node('dialogue', 6, "物业只查过已知线路，没有定位旧灯的来源。季宁带好新旧两套图，将物业电工的名字写到联系人旁边。\n老周说三楼台阶裂过，到了先看脚下。\n“怎么都这么熟？”她问。\n老周没接这句，拿起茶杯，才发现杯里是空的。他把杯子放下，提前走到车旁等着。", [next('depart', '带上图纸与维修记录', 'arrival')], { speaker: "季宁", portrait: "ji", visual: 'dispatch', scene: { background: '/art/dispatch.webp' }, expression: "concerned" }),
    arrival: node('dialogue', 9, "三号楼夹在两栋新楼中间，门缝都透电视光。有些节目播完了，屏幕还亮。\n拐角旧灯泛黄，下面摆着搪瓷盆，雨水滴进去。\n季宁先报到场，俯身看盆里的台阶影子。\n“风从后门进来，水往这边晃。影子怎么一直朝上？”\n我让她先留照片，等物业人员会合。", [next('gate', '先核对现场与作业边界', 'gate')], { time: '00:04' }),
    gate: node('dialogue', 12, "物业负责楼内设施，我们在获准范围核供电边界。老周对完许可和监护，季宁将正常住宅线路与未知灯路分开画。\n一个年轻人陪母亲坐了两夜，眼里全是血丝。他说下午还睡得着，夜里一听钥匙响就醒。\n“哪家的钥匙？”\n他摇头：“只响，不开门。”", [next('meet', '询问最早报修的住户', 'meetMei')], { speaker: "程砚（你）", portrait: "cheng", expression: "focused" }),
    meetMei: node('dialogue', 15, "开门的是杨婶。她住女儿这里，白天偶尔回槐荫巷帮亲戚，见季宁进来，先让她擦鞋底的水。\n门后两把椅子，一把有灰。\n“卧室没停电。”杨婶说，“昨晚楼道灯没了，那声响倒一直有。”\n我问响几次。她看向第二把椅子：“以前只响一回。”", [next('rules', '请她说明留灯的习惯', 'houseRules')], { speaker: '杨桂梅', portrait: 'mei' }),
    houseRules: node('dialogue', 18, "“半夜钥匙碰栏杆，别往楼道里叫。”杨婶说。\n季宁问为什么。\n“这楼以前都这么讲，喊了，它就知道哪家还醒着。”\n她说完又补一句，真有人叫门当然要应。\n我问这规矩谁定的，杨婶想不起。楼里最年轻那户搬来两年，也知道半夜要把门边那把椅子让开。", [next('stairs', '查看灯下的楼梯', 'stairs')], { speaker: '杨桂梅', portrait: 'mei' }),
    stairs: node('dialogue', 21, "季宁在安全位置拍台阶裂缝和旧反光条，物业接下维修记录。胶带只朝上楼方向反光。\n“贴的人站在下面看过。”她说。\n我看向旧灯，灯影落在搪瓷盆里。\n三楼有人关门，盆里的门影跟着合上；第二把椅子的影子却没跟着挪，仍停在台阶中间。", [next('investigate', '分别调查电源、时间、住户与约定', 'inspection')], { speaker: "季宁", portrait: "ji", expression: "neutral" }),
    inspection: node('investigation', 25, "住宅图夹在板上，物业带来的监听记录还没打开。旧灯电源、响声时刻、十二户负荷和杨婶的约定，都有各自可查的地方。\n我把调查页递给季宁。\n楼上忽然咳了一声，接着是拖鞋走过的响动。她看着已收齐的人员联络表，先把实际时刻写下。", [
      { id: 'feed', label: '核对灯的供电与图纸', next: 'feed', hidesWhenCollected: 'unlisted-feed' },
      { id: 'relay', label: '检查旧继电器与时间记录', next: 'relay', hidesWhenCollected: 'timed-relay' },
      { id: 'load', label: '核对住户负荷与失眠记录', next: 'load', hidesWhenCollected: 'occupied-load' },
      { id: 'promise', label: '询问杨婶的第二把椅子', next: 'promise', hidesWhenCollected: 'waiting-promise' },
      { id: 'review', label: '带四份记录回到楼门口', next: 'meeting', requiresEvidence: requiredEvidence.slice(0, 4) }
    ], { objective: { title: '分清供电与等待', detail: '取得四条现场证据；每条记录都关系到后面的时间与负荷判断。' }, scene: { background: '/art/stairwell.webp', hotspots: [{ id: 'feed', actionId: 'feed', label: '线路图', x: 26, y: 66 }, { id: 'relay', actionId: 'relay', label: '继电器箱', x: 61, y: 33 }, { id: 'load', actionId: 'load', label: '住宅门牌', x: 81, y: 54 }, { id: 'promise', actionId: 'promise', label: '第二把椅子', x: 40, y: 81 }] } }),
    feed: node('dialogue', 27, "联合检查短时隔离正常照明，物业核了已知备用装置、蓄电模块和余辉，旧灯亮度没有对应变化。\n封闭竖井仍有未核部分，那里留给专项排查。正常照明核完即按程序恢复。\n季宁看着楼里先暗后亮的窗，又看旧灯。它像根本没等过这次送电。", [next('feed-note', '对照改造页与现场痕迹', 'feedRecord')]),
    feedRecord: node('evidence', 29, "新图写旧管已拆，现场还露着一截。季宁把封闭竖井画成虚线，注明未核实，另交专业岗位。\n“现在只能说它没跟住宅灯一起变。”\n我点头，她把两份状态分开保存。\n照片里的旧灯罩缺一小块，映在盆里的灯罩却是完整的，她将原图也一起留下。", [{ id: 'collect-feed', label: '记录：图纸以外的灯', next: 'inspection', collect: 'unlisted-feed' }], { excludesEvidence: ['unlisted-feed'], speaker: "季宁", portrait: "ji", expression: "concerned" }),
    relay: node('dialogue', 27, "物业的监听覆盖昨天下午到今夜。00:10住宅回路隔离，旧箱没响；00:17响一次；00:25住宅照明恢复，也没响。\n旧线圈端已断开，记录却写通电吸合。\n季宁把这四个字圈住，重新听了一遍。声音很轻，后面还有一点拖长的尾音，像钥匙擦过栏杆。", [next('relay-note', '把听见的响声与电源状态分开', 'relayRecord')]),
    relayRecord: node('evidence', 29, "“先改成机械轻响。”季宁说。监控、监听和终端时标都核过，00:17不与住宅复电同步，已知线圈端也没供电证据。\n旧箱里一张纸条写：巡查00:17，回来敲栏杆。\n最后一遍笔画破了纸，签名位置被剪去。季宁拍下缺口，剪得很齐，不像被水泡烂。", [{ id: 'collect-relay', label: '记录：零点十七分的空继电器', next: 'inspection', collect: 'timed-relay' }], { excludesEvidence: ['timed-relay'], scene: { background: '/art/stairwell.webp', document: { title: '昨夜时序复核', lines: ['00:10 · 住宅线路隔离 · 旧灯无变化', '00:17 · 空继电器轻响 · 无线圈供电', '00:25 · 恢复住宅照明 · 旧灯无变化', '旧纸条：巡查00:17，回来敲栏杆'] } }, speaker: "季宁", portrait: "ji", expression: "neutral" }),
    load: node('dialogue', 27, "十二户起夜时间不一样，电量与往常接近，没多出统一启用的大负载。\n前年搬来的年轻人说，他不知道旧灯留了多久，夜里却总觉得该下去开门。\n“给谁开？”季宁问。\n“想不起来。”\n他搓了搓眼睛，说到楼道就记得等，回卧室又想不出等什么。", [next('load-note', '核对电量、现住人数与口述', 'loadRecord')]),
    loadRecord: node('evidence', 29, "人员与正常负荷核对得上：冰箱、充电、夜班煮面。住户失眠和开门的念头另记口述，没有塞进线路结论。\n季宁逐户问持续多久，最后那户先说两天，低头看手机后又改口。\n他写在便签上的是七年前的日期。换了一张纸，才写对今天。", [{ id: 'collect-load', label: '记录：三层仍然有人住', next: 'inspection', collect: 'occupied-load' }], { excludesEvidence: ['occupied-load'] }),
    promise: node('dialogue', 27, "七年前改造停电，杨婶在三楼摔过，许守成背她上来。后来夜巡路过，总问灯还亮不亮。\n“我说你忙，回来敲栏杆就行。”\n“几下？”\n“轻两下，最后重一下。他钥匙串就那样碰。”\n季宁从手机里找出Q07获准使用的录音片段，没有马上播放，先给我看了进度条。", [next('promise-note', '询问这次巡查是否有人交接', 'promiseRecord')], { speaker: '杨桂梅', portrait: 'mei' }),
    promiseRecord: node('evidence', 29, "杨婶打开饼干盒，里面是旧灯尺寸和巡查纸条。她知道许守成遇难，L03却一直没给她交接消息。\n“人不来了，怎么这事还挂着他？”\n季宁记下她问的那句，让她保留原纸。\n盒底还有半截褪色红绳，杨婶说母亲留灯时系的，搬家带过来，自己没再系过。", [{ id: 'collect-promise', label: '记录：杨桂梅的约定', next: 'inspection', collect: 'waiting-promise' }], { speaker: '杨桂梅', portrait: 'mei', excludesEvidence: ['waiting-promise'] }),
    meeting: node('dialogue', 38, "老周找出物业照明移交目录，让我们看原页。调阅范围和编号核好，季宁将后来的完成表也取来。\n“这一页是谁提交的？”她问。\n老周报了当年的联络岗位，随后看向我。涉及他本人职责的说明另交独立复核，这份先对原件。他点头，将手从目录上拿开。", [next('notice', '查看七年前的改造通知', 'notice')], { speaker: '老周', portrait: 'zhou', expression: 'focused', requiresEvidence: requiredEvidence.slice(0, 4) }),
    notice: node('dialogue', 41, "打印通知说当夜完成，临时照明由巡查人员移交。各楼都盖章，三号楼原文是待回所。\n电子表后来改成已完成，时间竟早于当夜巡查。\n季宁核了两遍日期，把两份记录并列。\n“他还没上楼，就已经交班了？”\n没人回答。楼道旧箱轻轻响了一下，还没到预计时刻。", [next('ticket', '打开原始照明移交夹', 'oldTicket')]),
    oldTicket: node('dialogue', 44, "物业授权取出复写原页，露着L03和00:17。它是旧救援路线的照明移交页，和我们今天的资产作业票分开。\n纸背能看出许守成的姓和杨婶门牌。\n季宁斜照压痕，签名栏像还有一个被擦过的字。她只拍了能辨出的部分，没把下一笔补成谁的名字。", [next('route-note', '记录原始移交页', 'archiveRecord')], { speaker: "季宁", portrait: "ji", expression: "neutral" }),
    archiveRecord: node('evidence', 46, "L03是旧应急路线的第三个等候点，能与H13和R02的附页对索引，不能按它去找一根跨城导线。\n我登记出处与页码。季宁把接收缺口拍好，纸条和后来的完成表封在不同套里。\n物业监听又播一遍，最后那下尾音，和Q07留言里的第三声很像。", [{ id: 'collect-route', label: '记录：L03照明移交页', next: 'compare', collect: 'lamp-route' }], { excludesEvidence: ['lamp-route'] }),
    compare: node('dialogue', 50, "旧灯不跟住宅回路变，响声却固定落在00:17。十二户正常用电，原巡查页未交，电子表又提前写了完成。\n季宁并排放两份录音，回放要经沈棠允许的片段才用。\n“人是谁能查，灯怎么亮还没查到。”她说。\n我看向三处时标，先把响声与复电的八分钟分开。", [next('time', '先按时序判断触发条件', 'puzzleTime')], { requiresEvidence: requiredEvidence, speaker: "程砚（你）", portrait: "cheng", expression: "focused" }),
    puzzleTime: node('puzzle', 55, "昨夜00:10住宅回路隔离，00:17旧箱轻响，00:25住宅照明恢复。旧纸条也写巡查00:17，回来敲栏杆。\n灯没随隔离或复电变化，声音也没跟两次供电动作走。\n物业等我们写匹配依据。季宁翻到监听页，提醒先看记录，别拿灯亮着反推箱里有电。", [next('supply', '00:25恢复住宅照明，让旧灯重新通电', 'wrongTime'), next('timer', "00:17对应旧巡查约定，不能归到00:25复电", 'timeExplained'), next('ignore', '只要没有读数，就可以按普通定时开关结案', 'wrongTime')], { requiresEvidence: requiredEvidence, puzzle: { prompt: "00:17的响声应与哪一项旧记录匹配？", hint: "住宅隔离在00:10，复电在00:25，旧纸条的巡查约定是00:17。先对时，轻响没有提供线圈通电证据。" } }),
    wrongTime: node('ending', 55, "我把轻响写成普通供电动作，没有解释八分钟。物业按报告换了新定时器，00:17旧箱响了，00:25新箱又响。\n年轻住户开门问，今晚是不是来了两个。\n林岚退回结论，季宁给新旧两段声音另作标记。监听末尾还录到一声很轻的关门，时间没在任何一户的门口监控里。", [next('retry', '重看三条时间记录', 'puzzleTime')], { outcome: 'failure', requiresEvidence: requiredEvidence }),
    timeExplained: node('dialogue', 59, "季宁将00:17对应原巡查约定，00:25留在住宅复电记录里。\n杨婶凑近问是不是那晚没交班。\n“原接收页缺着，完成时间也对不上。”我说。\n她把两张纸翻来覆去看了一遍，问以后能找谁问。季宁写下核查编号，递到她手里，等她自己念完。", [next('load-choice', '判断下一步怎样保留安全边界', 'puzzleLoad')]),
    puzzleLoad: node('puzzle', 63, "十二户负荷正常，旧灯电源还没定位，L03原接收页缺签名。\n住户想今晚睡一会儿，物业也在等灯具调查的下一步。\n我看向住宅图和未知竖井，两个范围分得很清楚。拿整栋停电去等旧灯，或给旧灯接一根住宅线，都没查到它原来的供电路径。", [next('cut-all', '让整栋楼保持断电，直到所有人不再等待', 'wrongCut'), next('join', '把旧灯接入住宅线路，用正常电源维持约定', 'wrongCut'), next('separate', "保障核验过的住宅照明，保持旧灯隔离，查L03原接收页", 'boundary')], { requiresEvidence: requiredEvidence, puzzle: { prompt: "哪种方案有已核实的线路依据？", hint: "住宅负荷正常，旧灯与它不同步。分别处理支路，再查L03接收页。" } }),
    wrongCut: node('ending', 63, "我提交了把住宅线路与旧灯一起处理的方案，林岚退回，现场没照办，原边界留着。\n住户搬椅子坐到门口，问还要等多久。杨婶拿着两张纸，忽然叫季宁看电子表。\n执行人那格多了一个名字，是程砚。原接收栏还是空的，完成时刻仍早于巡查。", [next('retry', '重新区分正常负荷与未知支路', 'puzzleLoad')], { outcome: 'failure', requiresEvidence: requiredEvidence }),
    boundary: node('dialogue', 67, "住宅照明核完按程序恢复，未知旧灯独立隔离，物证留在原位。物业继续接下灯具和竖井核查，我向林岚报清两边状态。\n杨婶坐到桌边，把饼干盒打开又合上。\n“它今晚还响吗？”\n“要继续记。”\n她说那椅子先不搬，我们没让她去碰旧灯。", [next('interview', '向杨婶说明已核实的事实', 'interview')]),
    interview: node('dialogue', 70, "我说明已互证的经过：许守成2019年救出住户后回查旧线遇难，L03原页缺接收，后来完成状态没有完整凭据。\n杨婶看着旧尺寸纸：“他那天说回来量灯，没量。”\n季宁问纸是不是那晚写的，她点头。\n我把出处记录好，将今夜的核查编号放在旁边。", [next('name', "核对钥匙声与反光条的来历", 'name')], { speaker: '杨桂梅', portrait: 'mei' }),
    name: node('dialogue', 73, "季宁问反光胶带是不是许守成贴的，杨婶说见过他蹲在那里，钥匙还刮了一下栏杆。\n她按记忆敲桌面：轻两下，重一下。\n楼道旧箱跟着响了一声。早已过00:17。\n我们都停了，季宁报实际时刻，物业监听仍开着。杨婶的手还落在桌上，没敲第四下。", [next('letter', '把核实结果写成可带走的说明', 'letter')], { speaker: "季宁", portrait: "ji", expression: "neutral" }),
    letter: node('dialogue', 76, "我写下原巡查页缺口、今天确认的供电边界和后续联系人，杨婶核对名字。\n写完，季宁重新听那一下轻响。响声之前的监听里有两声短促擦碰，刚才没人注意。\n“和录音里一样？”她问。\n我让她保留两份原始片段，交后续比对，没把相似直接写成同一个人。", [next('turn-off', "查看门边椅子与楼道", 'turnOff')]),
    turnOff: node('dialogue', 79, "杨婶将门边椅子搬回桌旁，没动灯。她又看了一眼那段反光条。\n“守成，我知道你没回来。”\n话说到这里就停了，没有劝，也没喊。\n季宁收好纸，楼道有人走了一步。我们朝门外看，台阶空着，搪瓷盆里却多了一圈刚落下的水纹。", [next('interval', "保留灯与响声的变化时刻", 'interval')], { speaker: '杨桂梅', portrait: 'mei' }),
    interval: node('dialogue', 82, "旧灯在我们整理材料时就开始暗，椅子挪完后，又闪了一次，熄了。住宅照明没波动，仪表没有新增来源。\n季宁记下每次变化的时刻，隔离照旧留着。\n她把手电转到台阶上，盆里灯影还亮了一瞬，随后也没了。物业同事低头看了一眼监听，设备仍在录。", [next('bedroom', '向住户复核照明与休息情况', 'bedroom')]),
    bedroom: node('dialogue', 85, "十二户的门陆续关上，电视声音少了。年轻住户扶母亲回房，出来说她已经躺下。\n杨婶递了温水，问裂台阶什么时候修。物业给出回访安排，她记在核查单背面。\n我喝完，把杯子放回桌上。第二把椅子靠在旁边，座面上刚才擦掉的灰，留出了一道湿痕。", [next('pause', '再次查看台阶与旧箱', 'pause')]),
    pause: node('dialogue', 88, "物业在裂缝边补警示，登记后续修复。季宁核完接收人，拍下反光条位置。\n老周说是守成贴的，自己当时在楼下等过。\n“那天等多久？”\n“到他下来。”\n“他从哪边下来？”\n老周看向后门，过了很久说不记得。杨婶说当年那边就是封的。", [next('record', '保全L03与原始巡查记录', 'record')], { speaker: '老周', portrait: 'zhou', expression: 'focused' }),
    record: node('dialogue', 91, "工单保留异常来源未明，旧灯与住宅支路分别处理，物业接下台阶维修，原页进入事故核查。\n林岚把L03标到旧路线图。\n季宁检查监听文件，00:17那段没少，最后那次钥匙擦碰也在。文件结束时，楼道又录进一声脚步，听起来在往下走。", [next('delivery', '向杨婶交付后续回访单', 'delivery')], { requiresEvidence: requiredEvidence }),
    delivery: node('dialogue', 94, "杨婶把核查单放进饼干盒，旧纸条原样留着。\n“后门别走。”她又说。\n我问为什么。她只说以前回来的人都走前面，后面那条楼梯封得早。\n季宁看了一眼物业图，后门确实没有回程通道。我们按核好的路线下楼，第二把椅子留在屋里。", [next('dawn', '走出三号楼', 'dawn')], { speaker: '杨桂梅', portrait: 'mei' }),
    dawn: node('dialogue', 97, "车停在楼下，季宁将L03回执和监听索引核完。\n“正常电、旧灯、台阶，都有后续。”\n林岚发来三处金属壳麻感报修，关联许守成追悼会旧名单，老周也在里面。\n季宁放下终端：“师傅，刚才你下楼的时候，钥匙响没响？”\n我摸了摸口袋。钥匙没带，在车上。", [next('finish', '关闭现场工单，保留事故核查', 'end')], { location: '长安里 · 抢修车', visual: 'dispatch', scene: {
            background: "/art/repair-van.webp"
        }, speaker: "季宁", portrait: "ji", expression: "neutral" }),
    end: node('ending', 100, "L03原页接收，住宅照明正常，未知灯路继续隔离。旧灯灭后，楼里的声音也少了，杨婶已经关门。\n我们回看楼道最后一张照片。\n前面的台阶空着，后门玻璃里却映出一个往下走的人，手里像提着钥匙。\n季宁翻开物业图。\n后门楼梯，七年前就拆了。", [{ id: 'restart', label: '重新调查《长明》', next: 'dispatch', resetEvidence: true }], { outcome: 'complete', requiresEvidence: requiredEvidence, scene: { background: '/art/stairwell.webp', inscription: "L03 · 巡查00:17，接收缺页" } })
  }
};
