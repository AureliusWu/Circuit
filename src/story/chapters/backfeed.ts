import type { Chapter, StoryAction, StoryNode } from '../types';

const firstEvidence = ['r02-direction', 'r02-map', 'r02-names'] as const;
const allEvidence = [...firstEvidence, 'r02-isolation', 'r02-bypass'] as const;
const act = (label: string, next: string, extra: Partial<StoryAction> = {}): StoryAction => ({
  id: next, label, next, ...extra
});
const node = (
  kind: StoryNode['kind'], text: string, progress: number,
  actions: readonly StoryAction[], extra: Partial<StoryNode> = {}
): StoryNode => ({
  kind, location: '梧城 · 城南拆迁区', time: '第三夜 · 22:10', text,
  visual: 'meter', progress, actions,
  scene: { background: '/art/demolition.webp' }, ...extra
});

export const backfeed: Chapter = {
  id: 'backfeed',
  order: 2,
  title: '回送',
  subtitle: '第二章 · 零户仍在走字',
  synopsis: "住户迁走，进线拆了，拆迁区仍有微小反向功率。看守留下十二把钥匙，旧图上那条应急线却走进一堵已经封死的墙。",
  entryNode: 'dispatch',
  requiredEvidence: allEvidence,
  clue: {
    code: 'R02', title: '未登记的二号应急旁路',
    detail: "R02是独立电源供给的临时救援照明，原移交附件缺失。今夜已确认并隔离在运网络边界，封闭旧端仍有残余读数；记录中的次序与原迁出册接近，末段多出临时安置点。",
    x: 63, y: 18
  },
  evidence: {
    'r02-direction': {
      title: '两套仪表确认的反向功率',
      detail: '更换合规仪表、校对方向与历史曲线后，拆迁区边界仍持续向外回送微小功率。现场没有核实到合法电源；不能据此直接判作窃电或安全无电。'
    },
    'r02-map': {
      title: '图纸之外的 R02 支路',
      detail: '现行竣工图把已拆区域删除，现场沿墙仍留有二号应急旁路标识。旧图记录救援临时用途，没有后续移交验收；地块删除不代表现场线路消失。'
    },
    'r02-names': {
      title: '被合并成零户的迁出名单',
      detail: '“零户”指现存住户数量；原始迁出登记仍有十二户和一处临时安置点。汇总时服务记录随地块一并归空，并非居民从未存在，也非所有居民遇难。'
    },
    'r02-isolation': {
      title: '等待确认的隔离标记',
      detail: '旧维护牌的“请勿闭合”指未核明源端和未完交接。现场通过具备条件的人员确认并保持边界隔离；没有任何记录授权把未知源端重新接回在运电网。'
    },
    'r02-bypass': {
      title: '许守成未完成的移交',
      detail: '2019-10-11，许守成借独立供电的临时照明救出住户，返回检查旧线后遇难。物业迁出汇总省略临时安置点，旁路未正式移交，复核记录与维护责任同时悬空。'
    }
  },
  nodes: {
    dispatch: node('dialogue', "拆迁区边界计量连续报反向功率，用户清册却是零。林岚把资料递过来，地块管理方已经约好人开门。\n季宁看完：“零户，还得抢修。”\n“零户不等于没线。”\n“我知道。我是说它这班挺会挑地方。”\n老周拿起旧图，和我们一起出车。", 3, [act('查看区域退出运行资料', 'route')], { location: "梧城电网 · 城区抢修班", time: '21:32', speaker: '林岚', portrait: 'lin', visual: 'dispatch', excludesEvidence: allEvidence,
        scene: { background: '/art/dispatch.webp', document: { title: '拆迁区异常计量 R02', lines: ['现登记住户：0', '正常进线：已拆除', '边界功率：反向，小幅持续', '物业申请：现场核验'] } }, presence: "scene" }),
    route: node('dialogue', "车停在路边等管理方回电，季宁叠起新旧图。新图上一大片灰，旧图还有巷名和楼号。\n她把现用馈线描到另一页，未知区留空。\n“别按地图导航直接走。”我说，“现在可能是墙。”\n“那听谁的？”\n“开门的人。”\n电话还没来，车外有个老人提着钥匙走近了。", 6, [act('前往物业封存区', 'gate')], { location: '抢修车 · 城南大道', time: '21:45', speaker: "季宁", portrait: "ji", excludesEvidence: allEvidence, expression: "neutral", scene: {
            background: "/art/repair-van.webp"
        } }),
    gate: node('dialogue',
      "围挡后有半截悬着的楼梯，墙根一筐拆下的门牌，残墙上贴着一条旧线。\n陈伯来开门，钥匙串上十二把住宅钥匙碰得很响。他只拎出大门那把，没有把其余的交给我们。\n季宁问旧屋钥匙还留着干吗。\n他将钥匙串捏住：“晚上别这么响。”", 9,
      [act('向陈伯确认现场变化', 'chen')],
      { time: '22:02', scene: { background: '/art/demolition.webp' } }),
    chen: node('dialogue',
      "“进线早拆了，它还朝外走。”陈伯说。施工队白天查过临时电源，没找到登记漏项，晚上就不愿再来。\n物业让他把门牌扔掉，他没扔。\n“我母亲搬家都带旧门牌，说怕认错门。”\n“这些又不归你。”\n“是啊。”他看向那筐门牌，“我也想问，现在该拿给谁。”", 12,
      [act('建立现场边界与人员联络', 'boundary')],
      { speaker: '陈伯', portrait: 'chen', time: '22:06' }),
    boundary: node('dialogue', "老周核好作业范围和监护，陈伯带我们进管理方允许的区域，封闭旧房不进去。\n季宁把拆除进线、在运网络和未知段分别标出来。\n“这里没人，里面也按可能带电看？”\n“对。”\n她将图夹稳。陈伯关上大门，十二把钥匙又碰了一下，墙后像也跟着碰了一下。", 15, [act('从计量、线路与住户三处调查', 'firstHub')], { speaker: "程砚（你）", time: '22:10', portrait: "cheng", expression: "focused" }),
    firstHub: node('investigation',
      "边界计量在围栏旁，残墙标识还没剥落，迁出原册放在物业桌上。新资料说零户，旧资料说这里曾经挤过人，仪表却还在回送。\n我让季宁先独立核测量，再对图和清册。\n陈伯搬出一把椅子，放在门牌筐旁边，自己没有坐，等我们选要先看的东西。", 20,
      [
        act('复核边界计量方向', 'meter', { hidesWhenCollected: 'r02-direction' }),
        act('比对现行图纸与残墙标识', 'drawing', { hidesWhenCollected: 'r02-map' }),
        act('核对零户汇总与迁出原件', 'ledger', { hidesWhenCollected: 'r02-names' }),
        act('整理回送源端的初步判断', 'compare', { requiresEvidence: firstEvidence })
      ],
      { objective: { title: '不要把零户当成零风险', detail: '独立核验仪表、图纸与人员档案，完成三组证据。' },
        scene: { background: '/art/demolition.webp', hotspots: [
          { id: 'meter', actionId: 'meter', label: '计量边界', x: 34, y: 30 },
          { id: 'map', actionId: 'drawing', label: '残墙线路', x: 56, y: 43 },
          { id: 'list', actionId: 'ledger', label: '迁出名册', x: 77, y: 32 }
        ] } }),
    meter: node('dialogue',
      "具备条件的同事核对计量方向和设备状态，用独立仪表复测。微小反向功率仍在，幅值不大，持续时间却越来越长。\n老周记“方向已复核”，另一格留着“来源未定位”。\n季宁看了看现用清册，零户两个字很大。她把图盖上去，零户刚好压在未知区的正中央。", 20,
      [act('检查可能的常规供能源', 'natural')],
      { excludesEvidence: ['r02-direction'], time: '22:14' }),
    natural: node('dialogue', "季宁按现场可查范围记下几种可能：临时发电、光伏、遗漏进线和计量方向。专业人员更换仪表，核过相位参照，反向功率仍在。\n管理方没有相应合法电源记录，封闭区尚未查明。\n“能确认它在往外送。”她说。\n陈伯点头：“所以我晚上不关门。”\n我问哪个门，他没指大门。", 20, [act('保留读数与调查范围限制', 'recordFlow')], { excludesEvidence: ['r02-direction'], time: '22:18', speaker: "季宁", portrait: "ji", expression: "concerned" }),
    recordFlow: node('evidence',
      "原始数据留下了，未知源端继续单列，边界保持防护。仪表背光暗下去，箭头仍向外。\n围挡外的市政路灯亮得正常，残墙后响了一下，像旧继电器轻轻碰合。\n季宁报实际时刻，老周看向响声的位置。那里是封闭区，图上还没有房间。", 20,
      [act('记录：独立确认的反向功率', 'firstHub', { id: 'record-direction', collect: 'r02-direction' })],
      { excludesEvidence: ['r02-direction'], time: '22:21' }),
    drawing: node('dialogue',
      "新图把拆除区域涂成灰格，旧底图却有两条铅笔线。一条带验收号，另一条只写“应急02”。\n陈伯说水灾时给安置点拉过独立电源的临时照明。\n季宁沿图看了一遍：“同一条巷子，怎么两张图宽度都不一样？”\n旧图的线拐进角落，新图的角落刚好被裁掉。", 20,
      [act('沿批准调查范围核对现场标识', 'survey')],
      { excludesEvidence: ['r02-map'], time: '22:24',
        scene: { background: '/art/demolition.webp', document: { title: '旧施工底图', lines: ['支路 01：验收登记完整', '应急 02：铅笔补注，无移交号', '现行图：整片地块退出'] } } }),
    survey: node('dialogue', "季宁只把可见并核对过的线号落图，墙后画虚线。R02旧标签属于独立供电的救援照明，与现用馈线分开。\n陈伯找出旧平面图，我们登记出处，申请后续专项查源。\n她把两张纸压在一起，原本在屋外的转弯落进了墙里。\n“这面墙后来砌的？”\n陈伯说是。", 20, [act('记录未入图的应急支路', 'recordMap')], { excludesEvidence: ['r02-map'], time: '22:28', speaker: "季宁", portrait: "ji", expression: "neutral" }),
    recordMap: node('evidence',
      "我登记R02的位置、资料缺口和隔离范围，验收栏没有凭空补号。\n陈伯捡起一块掉出的门牌，背面缠着细红线。\n“搬走那天带过，后来又送回来，说新房子不许挂这个。”\n季宁对照门牌编号，先收好照片。红线穿过两个孔，没系死，留着一个能抽开的结。", 20,
      [act('记录：图纸之外的 R02 支路', 'firstHub', { id: 'record-map', collect: 'r02-map' })],
      { excludesEvidence: ['r02-map'], time: '22:30' }),
    ledger: node('dialogue',
      "迁出原册上十二户都有新地址和签字，汇总表的零户只是现在的登记数。册后还夹着临时安置点借用单，没有转进服务档案。\n陈伯指出两户住哪里、谁上次还来取过东西。\n季宁跟着核名字，忽然发现册子的最后一页，比复印目录多了一页。页码写着十二又二分之一。", 20,
      [act('听陈伯解释名册里的空格', 'voices')],
      { excludesEvidence: ['r02-names'], speaker: '陈伯', portrait: 'chen', time: '22:33' }),
    voices: node('dialogue',
      "原册有一处红线圈着“还有人在里面”，是当年清点救援人数的备注。陈伯说自己签汇总时忙着发新房钥匙，以为原册会一起存。\n季宁问那半页怎么来的。\n“临时加的。”\n“谁加的？”\n他想了很久，说不清。纸上没署名，借用地点却和墙后的拐角能对上。", 20,
      [act('分别记录迁出人数与历史服务对象', 'recordNames')],
      { excludesEvidence: ['r02-names'], speaker: '陈伯', portrait: 'chen', time: '22:37' }),
    recordNames: node('evidence',
      "十二户的新址与签字逐项留存，临时安置点另列。陈伯将钥匙放到桌上，要拿回去时，手停了一下。\n季宁问是不是少了一把。\n“没有，一直十二把。”\n他又数一遍。钥匙都在，桌上的浅锈印却有十三道，最小那道落在册子多出的半页旁。", 20,
      [act('记录：零户背后的迁出名单', 'firstHub', { id: 'record-names', collect: 'r02-names' })],
      { excludesEvidence: ['r02-names'], time: '22:40' }),
    compare: node('dialogue', "反向功率确实存在，旧图也确有应急线，原册留下了汇总时没带走的安置点。三项能说明漏了资料，还不能指出电源。\n季宁在灰格旁写“当前用户零户”。\n陈伯凑过来看：“以前他们只抄前两个字。”\n我翻回残墙照片，问能不能从获准范围追到R02旧标记。", 40, [act('选择下一步调查方向', 'sourcePuzzle')], { requiresEvidence: firstEvidence, time: '22:43' }),
    sourcePuzzle: node('puzzle',
      "陈伯问会不会是哪家留下电源。林岚等结论，好联系后续队伍。\n现有测量证明了方向，没查出具体来源，迁出册也没有哪户私接的证据。\n季宁把结论页递过来，原因栏还空着。围挡后又响了一下，这次更近，却没有新的仪表动作。", 44,
      [
        act('直接写“原住户窃电倒送”，封存名字并结束核查', 'stolen'),
        act('维持隔离，追查 R02 资料与未移交源端', 'trace')
      ],
      { requiresEvidence: firstEvidence, puzzle: { prompt: '反向功率与零户，足以支持哪一种结论？', hint: '功率方向是测量结果，窃电是需要独立证据的责任判断。' }, time: '22:45' }),
    stolen: node('dialogue',
      "我写下原住户窃电倒送，物业很快将原册拿去封存，想尽快交地。\n报告被退回，要求填写涉嫌用户户号。现用清册零户，旧户号又全被删除，必填框一个也选不了。\n季宁按返回，框里忽然多了一项临时户。地址是我们刚站过的那面墙，户名空着。", 44,
      [act('查看草率归责的结果', 'stolenFailure')],
      { requiresEvidence: firstEvidence, location: '物业封存间', time: '23:02' }),
    stolenFailure: node('ending',
      "无依据的归责被退回，源端没找到，原册也暂时拿不回来了。陈伯握着十二把钥匙，去物业间等补手续。\n临时户的空名字开始跳动，输入光标一格一格往前走。\n季宁拔掉网络，光标还在。\n等屏幕熄了，玻璃里映出的物业桌旁，多了一把椅子。\n\n【空白责任人】", 44,
      [act('撤回无依据判断，重新整理证据', 'sourcePuzzle')],
      { outcome: 'failure', requiresEvidence: firstEvidence, visual: 'blackout', time: '次日 · 09:17' }),
    trace: node('dialogue', "陈伯按管理方许可带路，老周确认边界，季宁跟着记房号和回程通道。更深的点位留给专项队伍，我们不越围栏。\n墙上的02一处比一处旧，最后一处几乎剥光。\n“到了。”陈伯说。\n我看向旧图，图上还该有半段巷子。眼前却已经是墙。", 48, [act('查看可见的旧维护牌', 'oldroom')], { requiresEvidence: firstEvidence, time: '23:08' }),
    oldroom: node('dialogue', "旧房封着，我们从许可边界拍照。柜门夹一张纸：源端未明，请勿闭合，待确认。\n字迹是许守成的。\n季宁给旧挂牌另作索引，没有碰设备。她将镜头拉近，纸边多出一条淡灰的线，像从门缝里面擦出来的。\n柜门背后又响一下，现场没人去开。", 51, [act('核对挂牌对应的资料缺口', 'marking')], { requiresEvidence: firstEvidence, time: '23:12', scene: { background: '/art/substation.webp', inscription: '源端未明 · 请勿闭合' } }),
    marking: node('dialogue',
      "维护牌背面印着接收人，空着。\n“工具袋是我拿的，这份票没接。”陈伯说。\n他找出代管收条，日期和旧牌相差几小时。\n季宁问这间旧房什么时候封的，他报了一年。可收条上代管地点仍写这间房，明显晚于封墙日期。我们把两个日期都圈住，让管理方再查。", 54,
      [act('分开核验现场隔离与历史移交', 'secondHub')],
      { requiresEvidence: firstEvidence, speaker: '陈伯', portrait: 'chen', time: '23:16' }),
    secondHub: node('investigation',
      "维护牌先核隔离状态，事故附件再核是谁留下临时设施。陈伯拿出工具袋收条，林岚在档案端找原页。\n季宁将两条线分别夹好，没把一份代管收条当成设备移交。\n我看了一眼旧房，门缝灰线落到地上，折向屋里。可我们一直在屋外。", 58,
      [
        act('核验维护牌与隔离状态', 'relay', { hidesWhenCollected: 'r02-isolation' }),
        act('调阅事故原件与工具袋收条', 'fileRequest', { hidesWhenCollected: 'r02-bypass' }),
        act('还原 R02 的设立与退出过程', 'reconcile', { requiresEvidence: allEvidence })
      ],
      { requiresEvidence: firstEvidence, objective: { title: '补齐源端边界与责任交接', detail: '确认隔离状态，核验事故原始附件；不要把旧挂牌当成送电许可。' }, time: '23:18',
        scene: { background: '/art/substation.webp', hotspots: [
          { id: 'tag', actionId: 'relay', label: '维护牌', x: 34, y: 30 },
          { id: 'archive', actionId: 'fileRequest', label: '事故附件', x: 77, y: 32 }
        ] } }),
    relay: node('dialogue',
      "旧挂牌R02没有恢复运行批准，柜边示意图的箭头从安置点朝外。\n老周让专业人员按现有条件核边界，旧图留作线索。\n季宁在照片里发现牌背有个很淡的“回”字，内框缺一笔。\n我问现场能不能看见。她调高灯光，原牌上只有接收栏，没那个字。", 58,
      [act('接收具备条件人员的隔离确认', 'relayTest')],
      { requiresEvidence: firstEvidence, excludesEvidence: ['r02-isolation'], speaker: '老周', portrait: 'zhou', expression: 'focused', time: '23:22' }),
    relayTest: node('dialogue', "专业人员将未知段与在运网络边界隔离，复核确认后，外送功率归零。\n封闭旧端仍有残余读数，里面没因此放行。季宁分开记结果和确认人。\n“外面零了，里面还有。”她读回。\n电台回一句收到，旧柜里随即轻响。两声前后挨着，没人接着说话。", 58, [act('记录隔离状态与尚待调查的源端', 'recordIsolation')], { requiresEvidence: firstEvidence, excludesEvidence: ['r02-isolation'], time: '23:31', speaker: "季宁", portrait: "ji", expression: "neutral" }),
    recordIsolation: node('evidence',
      "现场隔离结果交接完，附近的正常供电不受旧段牵连。陈伯坐到门边，终于把钥匙串放进口袋。\n“这屋子还不能拆？”\n“源头没查清，管理方得继续留范围。”\n他点头，起身关了物业间的灯。残墙前那条影子没变，仍指着封闭的旧房。", 58,
      [act('记录：等待确认的隔离标记', 'secondHub', { id: 'record-isolation', collect: 'r02-isolation' })],
      { requiresEvidence: firstEvidence, excludesEvidence: ['r02-isolation'], time: '23:34' }),
    fileRequest: node('dialogue', "林岚调到2019年的原始附件。Q07接送单旁是R02临时安置点照明申请，许守成签了，接收栏空着。\n工具袋晚三小时由陈伯代管，收条另列。\n“袋子不是这条线的移交。”季宁说。\n林岚应了一声，报页码。报到最后半页时，她停住，说目录里没有这个页码。", 58, [act('查看救援过程与后续汇总', 'fileReply')], { requiresEvidence: firstEvidence, excludesEvidence: ['r02-bypass'], speaker: '林岚', portrait: 'lin', time: '23:38',
        scene: { background: '/art/substation.webp', document: { title: '原始附件 · 2019-10-11', lines: ['R02：临时安置点应急旁路', '作业人：许守成', '接收 / 验收：空白', '工具袋：物业代管，不构成设备移交'] } }, presence: "radio" }),
    fileReply: node('dialogue', "附页写独立临时电源供给救援照明。许守成送出住户后回查进水旧线，后来遇难，监护与移交材料不全，原因和责任继续复核。\n季宁指向两张图：当年的独立电源，今晚未定位的回流。\n“不是同一份检查。”\n我点头。附页能还原作业，电源仍在封闭区里面等着查。", 58, [act('请陈伯补充自己能负责的事实', 'chenMemory')], { requiresEvidence: firstEvidence, excludesEvidence: ['r02-bypass'], time: '23:42', portrait: "xu", presence: "archive", speaker: "2019 年救援附页" }),
    chenMemory: node('dialogue',
      "陈伯说当年忙着让大家拿新房钥匙，明知少了安置点也签了汇总，想过几天补。\n后来去找许守成，只拿到工具袋。\n“有糖，泡过水，黏在底上。”\n季宁问袋子放哪儿，他指向柜顶。\n柜顶是空的。陈伯张口想说什么，转身去了另一个房间，拿来已经登记保管的袋子。", 58,
      [act('分别保留口述、收条与资料原件', 'recordBypass')],
      { requiresEvidence: firstEvidence, excludesEvidence: ['r02-bypass'], speaker: '陈伯', portrait: 'chen', time: '23:47' }),
    recordBypass: node('evidence', "季宁按来源读回临时照明、获救住户、返回检查和未返程，没证实的仍空着。陈伯在今天的资料接收页签名，工具袋保管另填。\n他写完，问能不能把那半页夹回册后。\n“能，原顺序留着。”\n纸刚合上，封闭旧房又响一下，像有人把另一册也合上了。", 58, [act('记录：许守成未完成的移交', 'secondHub', { id: 'record-bypass', collect: 'r02-bypass' })], { requiresEvidence: firstEvidence, excludesEvidence: ['r02-bypass'], time: '23:51', speaker: "季宁", portrait: "ji", expression: "neutral" }),
    reconcile: node('dialogue', "获救住户迁走了，临时设施的移交却缺着。今天边界隔离有效，旧端和资料分别交后续岗位继续查。\n季宁将两年的照片分开，保留半页原顺序。\n“旧册多半页，收条又晚了一段。得从原件查。”\n我刚应声，独立观察端的读数忽然变了。", 72, [act('观察隔离后的旧端事件', 'nightWatch')], { requiresEvidence: allEvidence, time: '00:03' }),
    nightWatch: node('dialogue',
      "旧端读数分成十二段，间隔有长有短。陈伯看着趋势线，说迁出签字不是按门牌排的。\n季宁拿来原册，只比顺序与时刻，不先往里填人。\n第一项四号，第二项九号。接着几项，也能与签字次序对上。\n围挡外有车经过，灯光扫过墙头，第十二段恰好结束。", 75,
      [act('比对第一个门牌与原始登记', 'houseOne')],
      { requiresEvidence: allEvidence, time: '00:09' }),
    houseOne: node('dialogue',
      "四号那家做早班豆腐，原册上没签名字，按的指印，备注给儿子留钥匙。陈伯找到新址，说父子现在住一起。\n季宁将四号与第一段标成待复核对应。\n“仪表又不知道谁按的指印。”她说。\n我看了一眼那道波形。形状不说明人，顺序却又能对上一项。", 77,
      [act('继续核对第二个门牌', 'houseTwo')],
      { requiresEvidence: allEvidence, time: '00:13' }),
    houseTwo: node('dialogue',
      "九号当年住过陈伯的女儿。她现在还会来接父亲，每次都催他扔旧钥匙。\n季宁核好第二项，让他找当年保留的联系记录。\n陈伯发消息问女儿，没一会儿就得到回复：早搬走了，你怎么还站在里面？\n他把屏幕递给我，说自己没有发定位。", 79,
      [act('核对名册之外的最后一段', 'doorThree')],
      { requiresEvidence: allEvidence, speaker: '陈伯', portrait: 'chen', time: '00:18' }),
    doorThree: node('dialogue',
      "十二段后面又多了一段，很短。\n临时安置借用单就在原册那半页，没有正式门牌。许守成签在作业栏，住户栏没加他。\n季宁将最后一段另存，没给它命名。\n陈伯数完钥匙，再数桌上的旧锈印。他把掌心擦了擦，说今晚数东西总觉得少半个。", 81,
      [act('确认原件里最后的手写提醒', 'handwriting')],
      { requiresEvidence: allEvidence, time: '00:23' }),
    handwriting: node('dialogue',
      "借用单背面写“人走后，线须另交”。下一句被潮气洇掉，剩一个朝外的箭头。\n陈伯搬好门牌筐，老周登记后续维护单位。季宁拍原件，发现箭头旁还有个浅痕，像“勿回”。\n我让她把近照留下。那几个字能读到哪一步，得等原件核对，不能替它添满。", 83,
      [act('决定 R02 最终处置', 'closurePuzzle')],
      { requiresEvidence: allEvidence, time: '00:28', scene: { background: '/art/substation.webp', inscription: '人走后，线须另交' } }),
    closurePuzzle: node('puzzle',
      "在运网络边界已经隔离，旧端读数未明，原册与维护资料都找到了接收岗位。\n有人提议接回旧线看灯，陈伯也问亮起来是不是就能知道里面有没有人。\n我看向借用单。线路没有可靠来源，墙后也还未核，读数与姓名对上几项，依然补不出一个电源。", 85,
      [
        act("提出并入旧段，观察亮灯能否重现记录", 'directFeed', { tone: 'danger' }),
        act("维持隔离，交接维护资料与迁出原册", 'approved')
      ],
      { requiresEvidence: allEvidence, puzzle: { prompt: "R02外送已隔离，旧端仍有读数，下一步该保留什么？", hint: "测量只证明边界隔离有效。原册与设施资料分别接收，未知源端仍需专项核查。" }, time: '00:31' }),
    directFeed: node('dialogue',
      "并入旧段的建议没获批准，老周退回待执行栏，现场不动。\n陈伯却听见了接回去，把收好的门牌又靠到残墙上。\n门牌刚落地，独立观察端的波形重新起了一段。季宁对时，墙后传来拖椅子的声音。\n我们站在围栏外，屋里的位置不在获准范围，谁也没有进去。", 85,
      [act('查看以送电替代交接的结果', 'feedFailure')],
      { requiresEvidence: allEvidence, speaker: '老周', portrait: 'zhou', expression: 'focused', time: '00:35' }),
    feedFailure: node('ending',
      "方案未执行，源端继续隔离，原册移交却停在半路。陈伯坐回门牌筐旁，等管理方重新开收件单。\n季宁比对趋势：还是十二段，接着半段，再从第一段开始。\n第二遍的门牌次序完全一样。围挡外天亮了，旧端记录的时间却停在2019年10月11日。\n\n【错误的回送】", 85,
      [act("返回处置判断，核对测量与原册", 'closurePuzzle')],
      { outcome: 'failure', requiresEvidence: allEvidence, visual: 'blackout', time: '次日 · 06:21' }),
    approved: node('dialogue', "我提交维持隔离与专项查源，值班安排后续队伍，旧照明段不并入正常网络。\n季宁核测量报告和移交清单，确认人报过名字，她才写收到。\n陈伯在旁边听，钥匙握得很紧。\n我问为什么，他说响一声里面就跟一声。老周让他先收起来，等车到了再走。", 89, [act('完成门牌与名册的保管交接', 'memoryTable')], { requiresEvidence: allEvidence, time: '00:47', speaker: "程砚（你）", portrait: "cheng", expression: "focused" }),
    memoryTable: node('dialogue', "陈伯交出门牌清单和原迁出册，姓名继续按正式渠道核实，新住址保留。季宁逐页清点，读到半页时，又对了一遍借用单。\n“这份单独装。”她说。\n原来同一只袋里装不平，分开后倒合上了。陈伯把空筐端起来，底下留下一个湿方印，像刚放过另一块门牌。", 92, [act('填写实际测量与未解决事项', 'report')], { requiresEvidence: allEvidence, speaker: "季宁", portrait: "ji", time: '01:03', expression: "neutral" }),
    report: node('dialogue', "林岚确认收到当班边界隔离、测量和资料，封闭区的源端另交专业岗位。季宁附了不可进入范围，再把半页图放进附件。\n“纸比目录多半页。”她补充。\n林岚说知道，原件目录也要一起核。\n屋后没有新声响，独立观察端却又出现了一次短脉冲。", 94, [act('保留旧端最后一段趋势记录', 'trend')], { requiresEvidence: allEvidence, speaker: '林岚', portrait: 'lin', time: '01:12', presence: "radio" }),
    trend: node('dialogue',
      "旧端反向读数渐小，隔离没有撤。最后一段停在十二与十三之间，刚好对应册后的半页。\n季宁打开维护牌原图，模糊的箭头清楚了一点，朝旧城东侧的楼群。\n她重看前一张，箭头并不在那里。两张图的拍摄条件不同，原始文件都要留，今晚不在现场强行解释。", 96,
      [act('离开封存区', 'emptySeat')],
      { requiresEvidence: allEvidence, time: '01:18', scene: { background: '/art/demolition.webp', inscription: 'R02 · 已转交 / 未投入' } }),
    emptySeat: node('dialogue',
      "陈伯锁好门，旧住宅钥匙装进签收袋，管理方留着后续作业边界。女儿来接他，将冷茶倒了，催他上车。\n他走几步，回头问是不是门锁又响了。\n我们都看见他刚锁好，陈伯手里的大门钥匙也在。围挡里面，又传来一下慢慢转锁的声音。", 97,
      [act("在车上核对下一处地址", 'linger')],
      { requiresEvidence: allEvidence, location: '城南拆迁区 · 围挡外', time: '01:26', scene: { background: '/art/alley.webp' } }),
    linger: node('dialogue', "车停在城南大道，季宁把R02的未知区折在地图外侧。\n“墙砌好了，旧图还当那里能走。”\n“后续得查。”\n她点头，伸直坐了一夜的腿。林岚发来长安里旧灯照片，杨婶的地址在下面。\n季宁看了一眼，再展开地图。照片里的楼梯，正落在那个新变清楚的箭头尽头。", 98, [act('归档第二章', 'end')], { requiresEvidence: allEvidence, location: '抢修车 · 城南大道', time: '01:34', scene: {
            background: "/art/repair-van.webp"
        }, speaker: "季宁", portrait: "ji", expression: "neutral" }),
    end: node('ending',
      "R02边界隔离，原册和缺页资料已经接收，未知电源留给专项队伍。\n陈伯的车开走时，十二把钥匙都在签收袋里。\n季宁把现场最后一张照片放大：筐底的湿方印旁，有半块门牌。\n她问陈伯有没有漏收，他说筐是空的，自己看过。\n照片上那半个号码，只剩“03”。", 100,
      [act('重新调查《回送》', 'dispatch', { id: 'restart', resetEvidence: true })],
      { outcome: 'complete', requiresEvidence: allEvidence, location: '调查归档 · R02', time: '第二章 · 已完成', visual: 'ending',
        scene: { background: '/art/dispatch.webp', inscription: "R02 · 旧端未明，去向L03" } })
  }
};
