import type { Chapter, EvidenceId, StoryNode } from '../types';

const requiredEvidence: readonly EvidenceId[] = ['live-after-cut', 'house-13', 'paper-ash'];
const allEvidence: readonly EvidenceId[] = [...requiredEvidence, 'lost-address', 'bypass-ticket'];
const workOrder = {
  title: '故障工单  2026-10-11 / 00:52',
  lines: ['城西槐荫巷低压停电', '停电用户：12 / 在线提示：13', '人员：程砚、季宁；工作负责人：老周', '范围：电网侧供电 / 在线状态待现场核对']
};

function beat(location: string, time: string, progress: number, text: string, next: string, extra: Partial<StoryNode> = {}): StoryNode {
  return {
    kind: 'dialogue', location, time, progress, text, visual: 'alley',
    scene: { background: '/art/alley.webp' },
    actions: [{ id: 'continue', label: '继续', next }],
    ...extra
  };
}

const opening = { excludesEvidence: allEvidence };
const afterGate = { requiresEvidence: requiredEvidence };
const dispatchScene = { background: '/art/dispatch.webp', document: workOrder };

export const thirteenHouseholds: Chapter = {
  id: 'thirteen-households',
  order: 0,
  title: '十三户',
  subtitle: '序章 · 闭合前',
  synopsis: "十二户报停电，终端却多了一个十三号。巷子尽头留着一盏灯，封死的旧宅还在催人上门。",
  entryNode: 'dispatch',
  requiredEvidence,
  clue: {
    code: 'H13', title: '槐荫巷 · 被删去的用户',
    detail: "H13旧附页记着槐荫巷十三号的救援。住户已获救迁走，销户凭据和临时照明移交却有缺页；今夜的回流来源仍未查明。",
    x: 18, y: 58
  },
  evidence: {
    'live-after-cut': { title: '断开后仍有负荷', detail: '正常供电接入点隔离后，未知支路仍有0.41A。钳形表记录大小，带相位参照的功率分析仪另行确认反向功率；源端仍未定位，支路保持隔离。' },
    'house-13': { title: "多出来的十三号", detail: "现用台账只有十二户。十三号来自2019年的历史队列，无有效采集表计对应，销户凭据缺失；它在每月十一日00:47留下几分钟记录，日累计却始终为零。" },
    'paper-ash': { title: '表箱里的纸灰', detail: "封印螺丝外沿压着干燥的黄纸灰，附近没有电弧灼痕。残片只剩半个手写的“回”字，位置与接线故障分开记录。" },
    'lost-address': { title: '被擦去的门牌', detail: '杨婶保留的交费收据写着“槐荫巷十三号”。旧城改造后，这一家被并入迁出名单，门牌与户名同时从现用台账中消失。' },
    'bypass-ticket': { title: '未归档的旁路票', detail: 'H13附页记录独立供电的临时救援照明与许守成的签名。原监护、移交记录不齐，老周说明离岗及虚假完成；今日接收说明不补写2019年的空白。' }
  },
  nodes: {
    title: {
      kind: 'title', location: '梧城', time: '00:47',
      text: "雨下到后半夜，梧城的路灯灭了一排。巷子尽头还有一盏亮着，灯下没人。",
      visual: 'blackout', progress: 0, ...opening, scene: { background: '/art/alley.webp' },
      actions: [{ id: 'begin', label: '开始抢修', next: 'dispatch' }]
    },
    dispatch: {
        kind: 'dialogue', location: "梧城电网 · 城区抢修班", time: '00:52', speaker: "林岚",
        text: "泡面刚加好水，林岚把一张工单推过来。\n“槐荫巷，十二户停电，终端显示十三个在线户号。老周已经往那边去了。”\n季宁低头看了看面，又看了看我。\n“带走？”\n“回来再吃。”\n墙上的日历还停在二〇二六年十月十一日。",
        visual: 'dispatch', progress: 3, ...opening, portrait: 'lin', scene: dispatchScene,
        actions: [{ id: 'accept-order', label: '接下工单', next: 'call' }],
        presence: "scene"
    },
    call: {
        kind: 'dialogue', location: "城区抢修班 · 值班室", time: '00:53', speaker: "程砚（你）",
        text: "我叫程砚，在梧城电网干了九年，调来城区抢修班两年。季宁跟我八个月，基本已经学会在饭点接工单。\n她放大那个十三号：“还有一家没停？”\n“在线是通讯状态。有电没电，到了再看。”\n“哦。它地址怎么是空的？”\n我也看了一眼。确实空着。",
        visual: 'dispatch', progress: 5, ...opening, scene: dispatchScene,
        actions: [{ id: 'depart', label: '出发抢修', next: 'safetyBrief' }],
        portrait: "cheng",
        expression: "neutral"
    },
    safetyBrief: beat('城北抢修驻点 · 出车登记', '00:56', 7, "林岚在出车单上点了点老周的名字：“他负责现场，你们到巷口会合。电网侧归我们，屋里的问题联系产权方。”\n季宁拿走纸质台账，林岚又叫住她。\n“十三号先留着。刚才我想查它，系统让我填销户日期。”\n“填多少？”\n“我要是知道，就不用喊你们了。”", 'vehicleKit', { ...opening, speaker: '林岚', portrait: 'lin', visual: 'dispatch', scene: { background: '/art/dispatch.webp' }, location: "城北抢修驻点 · 出车登记", presence: "scene" }),
    vehicleKit: beat('抢修车', '01:00', 9, "车里一股雨衣没晾干的味道。季宁核完工具清单和仪表标识，把记录册塞进防水袋，又拿相机和终端对时。\n“师傅，照片按户号存，还是按时间？”\n“都留。别到时候只记得拍过，不知道拍的是哪家。”\n她给文件夹起好名字，顺手把我的泡面也拍了进去。", 'zhouCall', { ...opening, visual: 'dispatch', scene: {
            background: "/art/repair-van.webp"
        }, speaker: "季宁", portrait: "ji", expression: "neutral" }),
    zhouCall: beat('城西路口 · 车载通讯', '01:08', 12, "老周的声音从电台里出来，夹着雨声：“我到巷口了，你们还有多久？”\n“十来分钟。”\n“季宁跟着你，别让她一个人往旧宅里钻。”\n季宁把电台拿近：“周师傅，我听见了。”\n那边静了一会儿，才回一句：“听见就好。”老周是我进班时的师傅，平时很少把同一句话说两遍。", 'bypassWarning', { ...opening, speaker: '老周', portrait: 'zhou', expression: 'focused', presence: "radio", scene: {
            background: "/art/repair-van.webp"
        } }),
    bypassWarning: beat('城西路口', '01:12', 15, "“那边有条旧旁路。”老周说。\n我问是哪一版图上的。他报了个七年前的日期，接着补了一句：救援时用独立电源拉的临时照明，当年的附页这么叫，不能照名字接回市电。\n季宁在图边写下“独立照明”。\n“后来拆了吗？”\n电台里只有一下短促的杂音。\n“记录没齐。到了看。”", 'alley', { ...opening, speaker: '老周', portrait: 'zhou', expression: 'focused', presence: 'radio', scene: { background: '/art/repair-van.webp' } }),
    alley: {
        kind: 'dialogue', location: '城西 · 槐荫巷', time: '01:21',
        text: "槐荫巷比地图上窄，两辆车会车都费劲。季宁报完到场，沿着门牌数了十二户。最里面一扇门封着，门上的号码没了。\n雨沿架空线往下滴，尽头的旧灯却亮得很稳。\n“这盏归哪家？”她问。\n我还没翻到图，老周的车灯就照了过来。他下车先看了一眼那扇门。",
        visual: 'alley', progress: 18, ...opening, scene: { background: '/art/alley.webp' },
        actions: [{ id: 'open-meterbox', label: '先查低压表箱', next: 'alleyResidents' }],
        speaker: "季宁",
        portrait: "ji",
        expression: "neutral"
    },
    alleyResidents: beat('槐荫巷口', '01:22', 20,
      "十二扇门都开了一条缝，手电光照着湿门槛。有个男人催送电，另一个说冰箱里的鱼要化了。没人去叫尽头那家。\n穿雨披的老妇人把他们拦到屋檐下：“别围着箱子，给师傅腾点地方。”\n季宁问十三号在哪，她的手停在半空，过了一会儿才往巷尾指。",
      'meiDoor', { ...opening, portrait: 'mei' }),
    meiDoor: beat('槐荫巷 · 杨婶亲戚家门前', '01:23', 22, "老妇人姓杨，早搬去了长安里，今晚在亲戚家。她把十二户的名字报得很熟，轮到十三号却说：“以前是做缝补的陈家。”\n“现在呢？”\n“人搬走了。”\n她的手电照到墙根，两颗卸掉门牌的钉子泛着白光。\n“上次有人说里面没人，也是这种雨。”\n季宁把手电朝下，问她有没有留下旧票据。", 'perimeter', { ...opening, speaker: '杨婶', portrait: 'mei', location: "槐荫巷 · 杨婶亲戚家门前" }),
    perimeter: beat('槐荫巷 · 作业边界', '01:24', 25, "老周围开表箱旁的积水，按工单安排现场作业。进线接头受潮烧蚀，十二户停电有了着落。\n箱底另有一根新线，编号磨掉半截，往巷子里面去。\n“这根呢？”季宁在指定位置拍照。\n老周看了几秒：“单列。”\n他的鞋踩进浅水里，水面晃了一下，巷尾的灯影没动。", 'isolateSupply', { ...opening, portrait: 'zhou', expression: 'focused' }),
    isolateSupply: beat('槐荫巷 · 低压表箱', '01:26', 29, "许可和监护落实后，我们核清正常支路的停电边界。十二户的进线都能追到上级电源，箱底那根却对不上。\n季宁将它圈在草图外面。\n“巷子都停了，这根也不算在里面？”\n“来路没找到，还是按可能带电看。”\n她把圈画大一点。线从圈里出去，终点还是空白。", 'meterbox', { ...opening, visual: 'meter', speaker: "程砚（你）", portrait: "cheng", expression: "focused" }),
    meterbox: {
      kind: 'investigation', location: '槐荫巷 · 低压表箱', time: '01:27',
      text: "表箱锈得厉害，十二块旧表都停了。箱底的新导线颜色很浅，像刚换过。台账夹在工具箱上，封印螺丝后面还有一点黄纸灰。\n我把手电照稳。先看电流，再核户号；杨婶和旧抢修票也都在，缺哪一项就去问哪一项。",
      visual: 'meter', progress: 35,
      objective: { title: '排除常规故障', detail: '电流、台账与封印是必查项目。也可以走访住户、核对旧抢修票。' },
      actions: [
        { id: 'current', label: '测电流方向', next: 'inspectCurrent', hidesWhenCollected: 'live-after-cut' },
        { id: 'ledger', label: '核对用户台账', next: 'inspectLedger', hidesWhenCollected: 'house-13' },
        { id: 'ash', label: '检查封印与接线', next: 'inspectAsh', hidesWhenCollected: 'paper-ash' },
        { id: 'resident', label: '走访杨婶', next: 'residentTalk', hidesWhenCollected: 'lost-address' },
        { id: 'archive', label: '调取旧抢修票', next: 'archivedTicket', hidesWhenCollected: 'bypass-ticket' },
        { id: 'find-lamp', label: '去找唯一亮着的路灯', next: 'lamp', requiresEvidence: requiredEvidence, tone: 'danger' }
      ],
      scene: {
        background: '/art/alley.webp',
        hotspots: [
          { id: 'current', actionId: 'current', label: '测电流方向', x: 34, y: 30 },
          { id: 'ledger', actionId: 'ledger', label: '核对用户台账', x: 56, y: 43 },
          { id: 'ash', actionId: 'ash', label: '检查封印与接线', x: 77, y: 32 },
          { id: 'resident', actionId: 'resident', label: '走访杨婶', x: 18, y: 57 },
          { id: 'archive', actionId: 'archive', label: '调取旧抢修票', x: 83, y: 60 }
        ]
      }
    },
    inspectCurrent: {
        kind: 'evidence', location: '低压表箱', time: '01:29', speaker: '你',
        text: "测点核实后，钳形表读出0.41A。数字很小，稳定得有些烦人。\n正常供电接入点已经隔离，它还在走。季宁记下测点、量程和时刻，把屏幕拍了两遍。\n“先写有电流。”我说。\n她刚写了一个“回”字，听见这句，又把字划掉，留着旁边的原始读数。",
        visual: 'meter', progress: 35, excludesEvidence: ['live-after-cut'], scene: { background: '/art/alley.webp' },
        actions: [{ id: 'record-current', label: '记录：断开后仍有负荷', next: 'currentLimit', collect: 'live-after-cut' }]
    },
    currentLimit: beat('低压表箱 · 仪表复核', '01:30', 35, "“这表只看大小，方向还得另测。”季宁说。\n我点头。具备资格的同事用带相位参照的功率仪复核，两次都是旧支路往外回送。\n她翻到新一页，重新写下那个“回”字。\n“它从哪儿来？”\n没人能答。老周把未知源端标在图外，仍旧没有给那根线放行。", 'currentDirection', { visual: 'meter', requiresEvidence: ['live-after-cut'], speaker: "季宁", portrait: "ji", expression: "neutral" }),
    currentDirection: beat('低压表箱 · 接线草图', '01:31', 35, "老周把看得见的线号补到草图上。十二户各有去向，未知线独自走向旧宅。\n住户没报自备电源，上级监测暂时也没找到对应来源，旧宅里面还没查。\n季宁沿外墙画了一段虚线，标“未核区”。\n我看了一眼老周。他一直盯着图上的墙角，像那里原本还该有一样东西。", 'currentContact', { visual: 'meter', speaker: '老周', portrait: 'zhou', expression: 'focused', requiresEvidence: ['live-after-cut'] }),
    currentContact: beat('槐荫巷 · 调度通讯', '01:32', 35, "林岚那边查不到相应的反送功率。\n“现场照片给我，测量条件也带上。”她说，“系统没看见，不能当它没有。”\n我发去原始记录，备注未知电源，保持隔离。电台刚安静下来，季宁问她听没听见敲门声。\n林岚说没有。巷子里也没人承认刚才敲过门。", 'meterbox', { speaker: '林岚', portrait: 'lin', requiresEvidence: ['live-after-cut'], actions: [{ id: 'return-meterbox', label: '返回表箱继续排查', next: 'meterbox' }], presence: "radio" }),
    inspectLedger: {
        kind: 'evidence', location: '抢修车内', time: '01:33', speaker: "季宁",
        text: "抢修车停稳后，季宁将纸质台账和终端并排放好。纸上十二户，电子档多出一个十三号，建档时间是七年前。\n她点开在线来源：历史队列。现用采集系统找不到有效表计。\n“它连块表都没有，挺积极。”\n我让她把历史曲线另存。电台和车顶上的雨声，忽然都显得很近。",
        visual: 'meter', progress: 35, excludesEvidence: ['house-13'], scene: {
            background: "/art/repair-van.webp"
        },
        actions: [{ id: 'record-ledger', label: "记录：多出来的十三号", next: 'ledgerAddress', collect: 'house-13' }],
        portrait: "ji"
    },
    ledgerAddress: beat('抢修车 · 用户档案', '01:34', 35, "十三号能通过旧户号校验，地址栏却空着。迁出、合户、停用都有对应表，只有它少一份销户凭据。\n季宁用手电斜照纸质台账，擦过的地方还能看出“十三”两个字。\n“擦了，没擦干净。”\n我让她拍下压痕，申请查原档。终端光照着纸，那块被擦薄的位置透得尤其亮。", 'ledgerPattern', { visual: 'dispatch', scene: {
            background: "/art/repair-van.webp"
        }, requiresEvidence: ['house-13'] }),
    ledgerPattern: beat('抢修车 · 历史曲线', '01:35', 35, "季宁先查改时和迁移批次，再排重复报文。十三号每月十一日00:47都有几分钟记录，日累计却是零。\n“每个月都挑这时候上线？”\n“先留原时标。”\n她回到今晚的数据，发现记录开始于我们接单前。\n车窗外的旧灯暗了一下。她看向窗外，再低头，没有把两件事直接接在一起。", 'ledgerContact', { visual: 'dispatch', scene: {
            background: "/art/repair-van.webp"
        }, requiresEvidence: ['house-13'], speaker: "季宁", portrait: "ji", expression: "concerned" }),
    ledgerContact: beat('槐荫巷 · 调度通讯', '01:36', 35, "林岚查到建档批次：2019年10月11日旧城资料迁移。\n“H13，原附页我请档案那边调。”\n听到编号，老周隔着雨衣按了一下内袋。\n季宁看见了，却先问林岚有没有原文件的索引。电台报出一串号码，她一位一位写完，才抬头看老周。老周把手放开了。", 'meterbox', { speaker: '林岚', portrait: 'lin', requiresEvidence: ['house-13'], actions: [{ id: 'return-meterbox', label: '返回表箱继续排查', next: 'meterbox' }], presence: "radio" }),
    inspectAsh: {
      kind: 'evidence', location: '低压表箱', time: '01:36',
      text: "封印螺丝的外沿压着一点黄纸灰。箱门淌水，螺丝也湿，灰却没散。\n残片上剩半个手写的“回”字，内框少了一笔。\n我调整手电角度，季宁拍下它的位置。她翻了翻刚才的照片，照片里也是半个字，灰的边缘连缺口都一样。",
      visual: 'meter', progress: 35, excludesEvidence: ['paper-ash'], scene: { background: '/art/alley.webp' },
      actions: [{ id: 'record-ash', label: '记录：表箱里的纸灰', next: 'ashSeal', collect: 'paper-ash' }]
    },
    ashSeal: beat('低压表箱 · 封印外侧', '01:37', 35,
      "我没动封印，先看残片和接点的位置。纸在螺丝外沿，附近没有电弧灼痕，烧蚀接头在另一侧。\n“有人从外面塞的。”季宁说。\n“看位置是这样。”\n她把照片放大。灰下面露出一小截黄纸，边缘折得整齐，像烧到这里时，被人特意掐灭了。",
      'ashMeaning', { visual: 'meter', requiresEvidence: ['paper-ash'] }),
    ashMeaning: beat('槐荫巷 · 杨婶亲戚家门前', '01:38', 35,
      "杨婶看了一眼照片，问是谁碰过那片灰。\n“没碰。”\n她松开雨披领口：“我们家给没回来的人烧纸，写到这个字就停笔。门留着，别替他把路画死。”\n季宁问是谁教的，她说小时候听母亲讲的。\n“这里也这样？”\n杨婶没答，只把手电转向巷尾。",
      'meterbox', { speaker: '杨婶', portrait: 'mei', requiresEvidence: ['paper-ash'], actions: [{ id: 'return-meterbox', label: '返回表箱继续排查', next: 'meterbox' }] }),
    residentTalk: beat('槐荫巷 · 杨婶亲戚家门前', '01:34', 35,
      "杨婶拿来一个铁盒，先掀开上面几张超市小票，再取出一叠发黄的收据。\n“你们今天写不写旧门牌？”\n“可以附上，要核原件。”\n“那就写十三号。”她把一张纸压到最上面，“上次写空置，后来就没人来问了。”\n盒底有几粒樟脑丸，味道盖过了雨衣的潮气。",
      'residentMemory', { speaker: '杨婶', portrait: 'mei', excludesEvidence: ['lost-address'] }),
    residentMemory: beat('亲戚家 · 门廊', '01:35', 35, "七年前，十三号住着陈阿姨和外孙。雨水进屋，许守成从杨婶这里借走一把缠绿布的梯子，把人带出来，后来又回去查旧线。\n“我看着他第二次进去。”杨婶说，“出来没有，我没看见。”\n季宁分别记下亲见和转述。\n杨婶一直捏着那张收据，指甲压在户号上。", 'residentDebt', { speaker: '杨婶', portrait: 'mei', excludesEvidence: ['lost-address'] }),
    residentDebt: beat('亲戚家 · 旧票据', '01:36', 35,
      "收据上红印很浅，户号仍能和十三号对上。杨婶又翻出一张迁出表，陈家被写成事故前就搬走了。\n“表这样写，救人的时候他进的是哪家？”\n我核了两个日期，确实打架。\n她把纸拿近：“陈家外孙都长大了，不信可以去问。别光问这张表。”",
      'residentBoundary', { speaker: '杨婶', portrait: 'mei', excludesEvidence: ['lost-address'] }),
    residentBoundary: beat('亲戚家 · 门廊', '01:37', 35,
      "我把收据翻过来，向杨婶确认照片能不能附进核查材料。她说能，原件还得放在自己盒里。\n季宁给她写下回访编号，手机号码让她念了两遍。\n“他们搬去了城东？”\n“对。门牌新换了，姓没换。”\n她看我写完，才把收据抽回去，按原来的折痕叠好。",
      'residentRecord', { portrait: 'mei', excludesEvidence: ['lost-address'] }),
    residentRecord: beat('亲戚家 · 票据核验', '01:38', 35,
      "收据正面是“槐荫巷十三号”，背面有两个号码，其中一个是旧供电所值班电话。旧户号、门牌和日期能互相对上。\n季宁把照片编号读给我听。杨婶忽然指着一处铅笔印：“这笔不是我的，守成写的。”\n上面只有一句：梯子还在里面。",
      'meterbox', { kind: 'evidence', excludesEvidence: ['lost-address'], actions: [{ id: 'record-address', label: '记录：被擦去的门牌', next: 'meterbox', collect: 'lost-address' }] }),
    archivedTicket: beat('槐荫巷 · 抢修车旁', '01:35', 35,
      "我问老周H13是什么，他从雨衣内袋拿出一张折了四层的复印件。\n“没进档。”\n“你一直带着？”\n“换雨衣也带着。”\n纸角已经磨毛，最里面那道折痕却还很硬。季宁把平板移开，给他腾出地方。他把纸压平，掌心停在签名栏上，没有马上拿开。",
      'ticketGap', { speaker: '老周', portrait: 'zhou', expression: 'focused', excludesEvidence: ['bypass-ticket'] }),
    ticketGap: beat('抢修车 · 旧工作票', '01:36', 35, "正页是旧城改造停电，附页另列十三号通行和独立电源的临时照明。当年管这套东西叫旁路，图里的电源与在运网络分开。\n电子卷里没有附页。\n季宁拍下页码和折痕：“这儿原来还夹过一张？”\n老周说记不清了。订书孔有两排，只有一排还带着锈印。", 'ticketSignature', { visual: 'dispatch', scene: {
            background: "/art/repair-van.webp"
        }, excludesEvidence: ['bypass-ticket'] }),
    ticketSignature: beat('抢修车 · 签名栏', '01:37', 35, "执行栏是许守成，监护栏没写完。\n“我去疏散了。”老周说，“没安排替代，也没让他停下来。后来有人催关单，我就写完成。没核完。”\n季宁的笔停了一下。\n“这几件都要写？”\n“都写。”\n我记下他今天提交说明的时间，旧票上那几块空白没动。", 'ticketRoute', { speaker: '老周', portrait: 'zhou', expression: 'focused', visual: 'dispatch', scene: {
            background: "/art/repair-van.webp"
        }, excludesEvidence: ['bypass-ticket'] }),
    ticketRoute: beat('抢修车 · 接线附图', '01:38', 35,
      "附图上，临时照明沿旧宅外墙出去，巷外标了转接点。拆除人和移交日期都空着。\n季宁沿纸边看了看：“这不是没画完，是另一页不在。”\n纸上虚线到了装订边就断了，断口旁有个很小的箭头。箭头下面被折痕压着，只看得出一个“七”字。",
      'ticketRecord', { visual: 'dispatch', scene: { background: '/art/dispatch.webp' }, excludesEvidence: ['bypass-ticket'] }),
    ticketRecord: beat('抢修车 · 拍照留存', '01:39', 35,
      "老周同意把复印件留作线索，原件另查。季宁给每个空栏拍了近照，又在通讯里确认档案接收编号。\n我把纸装进材料袋，老周的手跟着移过来，停了一下，最终没有拿回去。\n“外面那根线呢？”他问。\n“继续隔离。”\n他点头，转身去看现场。",
      'meterbox', { kind: 'evidence', portrait: 'zhou', expression: 'focused', excludesEvidence: ['bypass-ticket'], actions: [{ id: 'record-ticket', label: '记录：未归档的旁路票', next: 'meterbox', collect: 'bypass-ticket' }] }),
    lamp: {
      kind: 'dialogue', location: '槐荫巷尽头', time: '01:42',
      text: "旧灯立在巷子尽头，新图上找不到它的支路。灯杆后就是封死的十三号，门板中间钉着一片褪色红纸。\n门牌拆了，两颗钉子还在。\n我站在围栏外，能闻见旧木头泡水的味道。灯下很安静，巷口催送电的声音传到这里，只剩一团模糊的嗡声。",
      visual: 'lamp', progress: 55, ...afterGate, scene: { background: '/art/alley.webp' },
      actions: [{ id: 'organize-evidence', label: '整理证据', next: 'lampCheck' }]
    },
    lampCheck: beat('旧路灯 · 安全距离外', '01:43', 57,
      "我在安全位置看灯杆外观，没碰未知线。灯每隔几秒暗一次，节奏与十三号的历史曲线接近。\n箱底的新线往这边绕，新图没有终点。\n季宁把两份记录并排，问是不是巧合。\n“再找一项能对上的。”\n她抬头望了望灯，又看向灯后的门。",
      'houseApproach', { ...afterGate, visual: 'lamp' }),
    houseApproach: beat('旧宅 · 外墙', '01:44', 59,
      "封门的木板比墙新，墙缝里露出一截旧绝缘护套。旧图走向到这里，后面没画。\n老周拦在围栏边：“里面没核清，别进去。”\n我停下，季宁的手电照过木板。\n红纸边缘朝外翻，下面积了一道灰。她说门缝里像有鞋，我再照过去，却只见一条湿木纹。",
      'houseKnock', { ...afterGate, visual: 'lamp', portrait: 'zhou', expression: 'focused' }),
    houseKnock: beat('旧宅门前', '01:44', 61,
      "我隔着围栏喊了一声，有没有人。门里没回话，手机先振了。\n用户回访提醒，号码空白，备注“维修未到场”。十三号的地址也补上了。\n季宁盯着到场照片：“我们一点二十一就报了。”\n我按下返回，提醒仍在。木板里面传来很轻的一声，像有人把椅子往门口拖了一点。",
      'meiAccount', { ...afterGate, visual: 'lamp' }),
    meiAccount: beat('旧宅门前 · 杨婶的叙述', '01:45', 63,
      "杨婶站在屋檐下，说当年许守成把陈家人救出来后，又回去查旧线。她只看见这些。\n事故后有人拿来一张表，说签了就能办迁出。表上写十三号无人居住，大家都签了。\n“我以为说的是签字这天。”她看着那扇门，“后来他们说，出事那晚这里就没人。”",
      'zhouAdmission', { ...afterGate, speaker: '杨婶', portrait: 'mei', visual: 'lamp' }),
    zhouAdmission: beat('旧宅门前 · 老周的叙述', '01:45', 65,
      "老周也看过那张表。\n“我知道不对。”他说。\n季宁问为什么没退回。\n“报告结了，怕再翻出来。”\n林岚在电台里确认封存旧卷，我报完编号，老周的手机忽然亮了。来电没有号码。\n他没接，屏幕一直亮到铃声结束。季宁把那个时刻记在页边。",
      'deduction', { ...afterGate, speaker: '老周', portrait: 'zhou', expression: 'focused', visual: 'lamp' }),
    deduction: {
        kind: 'choice', location: '旧宅门前', time: '01:46', speaker: "季宁",
        text: "季宁在纸上分开画了三处：仪表的回流，档案的十三号，螺丝后的纸灰。\n“有联系，还缺来源。”她说。\n十二户的正常故障已有安排，我看向旧宅。按窃电销掉它，能省很多手续，可我们连电从哪里来都没找到。\n“别急着替它起名字。”我说，“先追。”",
        visual: 'lamp', progress: 68, ...afterGate, scene: { background: '/art/alley.webp' },
        actions: [
            { id: 'cut-line', label: '按窃电处理，直接切断异常回路', next: 'wrong' },
            { id: 'trace-source', label: '先追踪倒送电源，再核对“13号”的建档日期', next: 'isolationChoice', tone: 'danger' }
        ],
        portrait: "ji",
        expression: "concerned"
    },
    wrong: beat('槐荫巷', '01:51', 68, "我提出按窃电处理，删去十三号，剪断未知线。老周把方案退了回来，现场没动。\n终端预览却开始空白，一个地址接着一个地址，十二户都没了。季宁立即按住提交键。\n“师傅，你看下面。”\n用户数变成十三。刚才还空着的那一行，填上了我们抢修班的地址。", 'wrongEcho', { ...afterGate, visual: 'blackout' }),
    wrongEcho: beat('槐荫巷 · 异常告警', '01:51', 68, "纸台账上十二户都在，巷口的住户也还在催。变化只出现在终端预览里。\n季宁按纸逐个读户号，我撤回错误分类，让林岚查原始数据。\n读到最后，电台里多了一声“到”。\n林岚问谁说的。老周和我都没开口，季宁看着被删掉的第十三行，没有继续往下念。", 'wrongWarning', { ...afterGate, visual: 'blackout', portrait: 'mei' }),
    wrongWarning: beat('槐荫巷 · 误判', '01:52', 68, "林岚退回结论：没有窃电证据，源端也没定位。原户号仍留在历史检索里。\n季宁将纸台账夹回板上，终端里的十二个地址恢复了。新多出来的那一行也消失，只剩保存失败的提示。\n提示的时间是2019年10月11日00:47。\n\n错误结局：删去第十三户。", 'deduction', { ...afterGate, kind: 'ending', outcome: 'failure', portrait: 'lin', visual: 'blackout', actions: [{ id: 'retry-deduction', label: '回到判断前', next: 'deduction' }], presence: "radio" }),
    isolationChoice: beat('旧宅门前 · 接线边界判断', '01:47', 71,
      "十三号建档于事故夜，未知线还没有电源出处。十二户能按已核清的线路复电，这一根得继续分开。\n老周等我报下一步。季宁将工作票夹在图旁，边界刚好压在那段断掉的虚线上。\n可以留住隔离去查原票，也可以提出试送，让一块表替我们回答。",
      'traceProcedure', {
        ...afterGate, kind: 'puzzle', visual: 'lamp',
        puzzle: { prompt: "怎样核实未知支路，又不把它接进已确认的线路？", hint: "十三号有建档记录，旧线却还没有电源出处。先查原票和物理边界。" },
        actions: [
          { id: 'trial-close', label: '临时合闸，靠电表转动确认旧支路', next: 'unsafeBypass' },
          { id: 'keep-isolated', label: '保持旧支路隔离，核对工作票与接线边界', next: 'traceProcedure', tone: 'danger' }
        ]
      }),
    unsafeBypass: beat('低压表箱 · 试送电', '01:48', 71, "我提出把未知支路并入正常供电试验。老周当即退回，季宁没录入操作申请。\n现场没合闸，终端却弹出一张今天的空白验收表。执行栏自己填上了许守成。\n季宁小声叫我看窗户。\n窗后有个人举着梯子，车灯扫过去，只剩雨。表上的日期仍是今天。", 'bypassAlarm', { ...afterGate, visual: 'blackout' }),
    bypassAlarm: beat('槐荫巷 · 停止操作', '01:49', 71, "老周把退回理由记好：“不能靠试送找电源。”\n正常线路没有新动作，异常验收表只是预览，我们保存原始报文，保持隔离。\n季宁把表往下滑，监护栏还是空的。执行人的签名却出现了第二遍，压在第一遍上，最后一笔把格线都拖穿了。", 'bypassFailure', { ...afterGate, speaker: '老周', portrait: 'zhou', expression: 'focused', visual: 'blackout' }),
    bypassFailure: beat('低压表箱 · 未通过的验收', '01:50', 71, "季宁问今天这张票谁能接。\n我没答上来。方案被退回，试送没有执行，核验得重新做。她关掉预览，照片里那扇窗也没有人。\n材料袋里的复印件却湿了一个角。湿痕停在监护栏，像有人隔着纸，一直按在那里。\n\n错误结局：替旧事故签字。", 'isolationChoice', { ...afterGate, kind: 'ending', outcome: 'failure', portrait: 'lin', visual: 'blackout', actions: [{ id: 'retry-isolation', label: '重新判断接线边界', next: 'isolationChoice' }], presence: "radio" }),
    traceProcedure: beat('槐荫巷 · 边界复核', '01:48', 74, "十二户的进线修复，核验并获准复电。巷口有人喊灯亮了，冰箱也重新响起来。\n我们另查未知支路，管理方按获准范围带路，旧宅内部仍封闭。\n季宁在草图上补回正常供电的箭头，把未知线留在外面。\n她刚写好日期，巷尾的旧灯又暗了一次。", 'hiddenBranch', { ...afterGate, visual: 'meter', portrait: "cheng", speaker: "程砚（你）", expression: "focused" }),
    hiddenBranch: beat('旧宅 · 外墙暗线', '01:50', 77, "管理方打开许可范围内的检修口，盖板内侧夹着一个防潮袋。可见接线仍在隔离边界内，专业人员拍照核对，没往墙后继续拆。\n季宁照亮纸袋背面。\n“贴在板上，没接到线。”\n袋口封得很旧，封条上却没有灰。她拍完原位，抬头看了我一眼。", 'truth', { ...afterGate, visual: 'lamp' }),
    truth: {
        kind: 'dialogue', location: '槐荫巷 · 13号', time: '01:52',
        text: "袋里是一张七年前的讣告，死者许守成。他的事故通报我在培训里见过，落款的住户附页却没见过。\n可见支路末端没有住户负载，回流还得继续找源。季宁拍下纸袋两面，忽然把一处字放大。\n讣告边上，铅笔写着“请勿闭合”。字比正文新，笔尖压破了一点纸。",
        visual: 'ending', progress: 80, ...afterGate, scene: { background: '/art/alley.webp', inscription: '请勿闭合' },
        actions: [{ id: 'continue', label: '继续', next: 'noticeNames' }],
        portrait: "xu",
        presence: "archive",
        speaker: "旧档 · 许守成"
    },
    noticeNames: beat('旧宅 · 讣告', '01:53', 82, "落款写“槐荫巷十三号及邻里”。季宁把几个名字念给杨婶听，她说陈阿姨和外孙都活着搬走了，能找到人。\n我翻回迁出表，表上那户却被提前删掉。\n“人出来了，签名也在。”季宁说，“那张表为什么非得让屋子先空？”\n老周看着纸，没有回答。", 'noticeDebt', { ...afterGate, portrait: "ji", visual: 'ending', scene: { background: '/art/alley.webp' }, speaker: "季宁", expression: "neutral" }),
    noticeDebt: beat('旧宅门前', '01:54', 84,
      "“这张是我们放的。”杨婶说，“袋子也是。怕雨。”\n我问边上的字，她凑近，摇头。\n“我写不了这么小。烧纸留半个字是我母亲的讲究，这张纸我没落过笔。”\n她又看了一遍，声音放低：“守成以前写票，最后一笔总是拖到格子外面。”",
      'linCompare', { ...afterGate, speaker: '杨婶', portrait: 'mei', visual: 'ending' }),
    linCompare: beat('槐荫巷 · 档案对照', '01:56', 87, "林岚在终端上并排打开三份材料。事故记录有许守成，迁出表把十三号提前写空，工作票少了临时照明附页。\n“是三处改动，不是一页掉了。”季宁说。\n林岚报出封存编号，我逐项核对。旧宅催维修的提醒还挂着，这三份纸只能说明有人改过记录，解释不了门里的声音。", 'recordCrosscheck', { ...afterGate, speaker: '林岚', portrait: 'lin', visual: 'ending', presence: "radio" }),
    recordCrosscheck: beat('低压表箱 · 正常支路复核', '01:59', 90, "十二户回访和电量正常，未知支路继续隔离，H13材料另交核查。老周提交自己离岗和虚假确认完成的说明。\n季宁把今天日期写在新表上，停笔问我旧票怎么办。\n“原样交。”\n她收好两份纸。电台里林岚说收到，这一回，后面没有多出第二个声音。", 'epilogueCall', { ...afterGate, visual: 'meter' }),
    epilogueCall: beat('槐荫巷 · 回访通讯', '02:02', 92, "林岚打完十二个回访电话，每家都有人接。十三号的提醒暂时不再弹。\n“历史检索还在，明天查原卷。”她说。\n季宁收相机时，空号码忽然又出现在通话记录里。来电时长一秒，没有录音。她把截图发走，信号满格，发送却转了很久。", 'zhouGoodbye', { ...afterGate, speaker: '林岚', portrait: 'lin', presence: "radio" }),
    zhouGoodbye: beat('槐荫巷口', '02:04', 94,
      "老周说会把当年经过写清楚。杨婶问十三号的名字有没有拼对，季宁念给她听，她才合上铁盒。\n我们收工具，旧路灯暗了下来。\n巷口有人喊早点铺开门了，老周没接话，转头又看了一次十三号。门板干干净净，刚才那片红纸似乎被雨卷走了。",
      'busReveal', { ...afterGate, speaker: '老周', portrait: 'zhou', expression: 'focused' }),
    busReveal: beat('抢修车 · 待办工单', '02:06', 97, "林岚查到附图断口后的索引，通往清河里Q07。那边连续七夜跳闸，第八夜报了更早的通知，下一班正在核查。\n季宁把两个编号抄在一起，没有连线。\n车发动后，十三号的材料袋里传来一下轻响。她拿起袋子，只有纸，拉链也没开。老周坐在前排，一直没回头。", 'end', { ...afterGate, portrait: 'lin', visual: 'ending', scene: { background: '/art/dispatch.webp' }, presence: "radio" }),
    end: {
        kind: 'ending', outcome: 'complete', location: '第一回路 · 未闭合', time: '02:07',
        text: "十二户有电了。未知线还隔着，十三号转入历史核查，我们准备交班。\n季宁关掉工单预览，又打开。\n“这行谁写的？”\n最下面多出四个字：请勿闭合。\n字的内框缺了一笔，和纸灰上的半个“回”一样。\n我让她留图。车窗外，巷尾已经黑了，那扇封住的门，却有人从里面敲了三下。",
        visual: 'ending', progress: 100, ...afterGate, scene: { background: '/art/alley.webp', inscription: '请勿闭合' },
        actions: [{ id: 'restart', label: '重新开始序章', next: 'dispatch', resetEvidence: true }],
        speaker: "季宁",
        portrait: "ji",
        expression: "concerned"
    }
  }
};
