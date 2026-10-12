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
  synopsis: '十二户停电，十三块表在线。槐荫巷的一条旧抢修支路，把七年前被删掉的户名送回工单。',
  entryNode: 'dispatch',
  requiredEvidence,
  clue: {
    code: 'H13', title: '槐荫巷 · 被删去的用户',
    detail: '2019年10月11日旧城改造停电事故从槐荫巷十三号的救援开始。H13 附页上的临时服务记录，连接着许守成与被删掉的户名。',
    x: 18, y: 58
  },
  evidence: {
    'live-after-cut': { title: '断开后仍有负荷', detail: '正常供电接入点隔离后，未知支路仍有0.41A。钳形表记录大小，带相位参照的功率分析仪另行确认反向功率；源端仍未定位，支路保持隔离。' },
    'house-13': { title: '不存在的13户', detail: '纸质台账有12户，历史队列另留13号旧户号。现用采集系统无有效表计对应，在线提示与实时带电分开核对；原销户凭据缺失，H13作为历史索引保留。' },
    'paper-ash': { title: '表箱里的纸灰', detail: '烧焦的黄纸卡在封印螺丝后面，灰烬没有受潮。纸上只剩半个手写的“回”字。' },
    'lost-address': { title: '被擦去的门牌', detail: '杨婶保留的交费收据写着“槐荫巷十三号”。旧城改造后，这一家被并入迁出名单，门牌与户名同时从现用台账中消失。' },
    'bypass-ticket': { title: '未归档的旁路票', detail: 'H13附页记录独立供电的临时救援照明与许守成的签名。原监护、移交记录不齐，老周说明离岗及虚假完成；今日接收说明不补写2019年的空白。' }
  },
  nodes: {
    title: {
      kind: 'title', location: '梧城', time: '00:47',
      text: '雨把城市的声音压得很低。远处一排路灯，像一条没有闭合的线。',
      visual: 'blackout', progress: 0, ...opening, scene: { background: '/art/alley.webp' },
      actions: [{ id: 'begin', label: '开始抢修', next: 'dispatch' }]
    },
    dispatch: {
        kind: 'dialogue', location: "梧城电网 · 城区抢修班", time: '00:52', speaker: "林岚",
        text: "“程砚，槐荫巷十二户报停电。终端多出一个在线户号，现场状态待核。你和季宁接单，老周按值班安排赶去会合。”林岚把出车单递过来。雨声压着值班室的钟，今天是二〇二六年十月十一日。",
        visual: 'dispatch', progress: 3, ...opening, portrait: 'lin', scene: dispatchScene,
        actions: [{ id: 'accept-order', label: '接下工单', next: 'call' }],
        presence: "scene"
    },
    call: {
        kind: 'dialogue', location: "城区抢修班 · 值班室", time: '00:53', speaker: "程砚（你）",
        text: "我叫程砚，在梧城电网干了九年，早年做城东运检，调来城区抢修班两年。季宁跟我八个月，今晚照旧随队。她指着“在线电表：13”问是否还有一家有电。我把故障工单放大：“在线先说明通讯状态，灯亮不亮、线路带不带电，都得另查。”",
        visual: 'dispatch', progress: 5, ...opening, scene: dispatchScene,
        actions: [{ id: 'depart', label: '出发抢修', next: 'safetyBrief' }],
        portrait: "cheng",
        expression: "neutral"
    },
    safetyBrief: beat('城北抢修驻点 · 出车登记', '00:56', 7, "林岚确认人员和联络方式：我、季宁、负责现场组织的老周。报修涉及电网侧低压供电；用户屋内设备由产权方安排检查。“先报告边界，按许可开展作业。来路不明的电源单列，住户恢复用电和旧档核查各有接收人。”", 'vehicleKit', { ...opening, speaker: '林岚', portrait: 'lin', visual: 'dispatch', scene: { background: '/art/dispatch.webp' }, location: "城北抢修驻点 · 出车登记", presence: "scene" }),
    vehicleKit: beat('抢修车', '01:00', 9, "季宁把平板、防水记录册和纸质台账放到车上，逐项核对工具清单、检验标识和电量。我复核仪表状态，她将相机与终端对时。“师傅，照片按户号还是时间存？”“都留。以后要让另一班找得到。”她在第一页写下我们两人的名字。", 'zhouCall', { ...opening, visual: 'dispatch', scene: {
            background: "/art/repair-van.webp"
        }, speaker: "季宁", portrait: "ji", expression: "neutral" }),
    zhouCall: beat('城西路口 · 车载通讯', '01:08', 12, "电台里传来老周的声音：“值班已经把我列入这张工单。我先到巷口，和你们一起核对旧图。程砚，季宁跟着你做记录，别让她一个人进旧宅找线。”他是我入班时的师傅，今晚又在同一张出车单上。", 'bypassWarning', { ...opening, speaker: '老周', portrait: 'zhou', expression: 'focused', presence: "radio", scene: {
            background: "/art/repair-van.webp"
        } }),
    bypassWarning: beat('城西路口', '01:12', 15, "“七年前救援时借道旧宅，拉过一套独立电源供给的临时照明线，附页叫它旁路。”老周说，“后续拆除和移交记录没有齐。”季宁圈出“独立照明”，防止把它理解成绕过保护的市电接法。我记下：历史设施边界待核实。", 'alley', { ...opening, speaker: '老周', portrait: 'zhou', expression: 'focused', presence: 'radio', scene: { background: '/art/repair-van.webp' } }),
    alley: {
        kind: 'dialogue', location: '城西 · 槐荫巷', time: '01:21',
        text: "季宁将现场位置回报林岚，接着数门牌：“十二户都在这边。尽头那盏灯得另找供电记录。”雨沿架空线滴到围栏外。她没有把亮灯写成安全证明，先拍了街景和巷口的时间。老周的车灯从后面照来，我们三人在入口会合。",
        visual: 'alley', progress: 18, ...opening, scene: { background: '/art/alley.webp' },
        actions: [{ id: 'open-meterbox', label: '先查低压表箱', next: 'alleyResidents' }],
        speaker: "季宁",
        portrait: "ji",
        expression: "neutral"
    },
    alleyResidents: beat('槐荫巷口', '01:22', 20,
      '十二扇门都开着一点，手电的光落在各家门槛内。有人催着送电，没人肯去敲尽头的门。穿雨披的老妇人把其他人拦下：“师傅要先查，你们别摸箱子。”',
      'meiDoor', { ...opening, portrait: 'mei' }),
    meiDoor: beat('槐荫巷 · 杨婶亲戚家门前', '01:23', 22, "杨婶报出亲戚家的户号，和十二户逐一对上。她早搬到长安里，今晚回来帮旧邻找票据。问到十三号，她把手电转向墙根：“上次有人说里面早搬空了，也是下这样的雨。”季宁请她回门廊等，记下旧居与现住址，免得下一次回访找错门。", 'perimeter', { ...opening, speaker: '杨婶', portrait: 'mei', location: "槐荫巷 · 杨婶亲戚家门前" }),
    perimeter: beat('槐荫巷 · 作业边界', '01:24', 25, "老周按获准范围组织现场，围开积水和表箱。已知低压进线接头受潮烧蚀，能解释十二户的停电；另外那条新线没有归属。专业操作按工作安排执行，季宁站在指定区域记录回报和住户需求。我提醒她：找到了真故障，也要把未知线单列。", 'isolateSupply', { ...opening, portrait: 'zhou', expression: 'focused' }),
    isolateSupply: beat('槐荫巷 · 低压表箱', '01:26', 29, "在工作许可和相应监护落实后，我们核对正常支路的停电边界，完成规定检查。十二户的正常进线可以追到上级电源；箱底另一根编号模糊的新线朝巷子尽头去。它不在已确认的范围里，继续按可能带电管理，不能因为附近已经停电就触碰。", 'meterbox', { ...opening, visual: 'meter', speaker: "程砚（你）", portrait: "cheng", expression: "focused" }),
    meterbox: {
      kind: 'investigation', location: '槐荫巷 · 低压表箱', time: '01:27',
      text: '表箱锈得厉害。十二块机械表都停了，最下方却留着一段新换过的导线。现在要把“正常故障”排干净。',
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
        text: "在许可范围内完成测点准备后，合规钳形表读到未知支路有 0.41A。季宁记录测点、量程和时间，先写“电流仍在”，没有写方向。正常供电接入点已经隔离，这个读数仍需要另一套仪表和接线记录复核。",
        visual: 'meter', progress: 35, excludesEvidence: ['live-after-cut'], scene: { background: '/art/alley.webp' },
        actions: [{ id: 'record-current', label: '记录：断开后仍有负荷', next: 'currentLimit', collect: 'live-after-cut' }]
    },
    currentLimit: beat('低压表箱 · 仪表复核', '01:30', 35, "“钳形表只能告诉我大小，对吗？”季宁指着读数。我让她先核对量程和测点，再由具备资格的人员用带相位参照的功率分析仪确认方向。两次结果一致：微小功率从旧支路回送。她另起一行写明，测到回流还不能推出它的来源，更不能证明线路安全。", 'currentDirection', { visual: 'meter', requiresEvidence: ['live-after-cut'], speaker: "季宁", portrait: "ji", expression: "neutral" }),
    currentDirection: beat('低压表箱 · 接线草图', '01:31', 35, "老周照着可确认的线号补图，未知支路与十二户的正常线路分开标记。住户未报自备电源，上级监测暂未定位反送来源，排查范围还不能覆盖旧宅内部。季宁给图添上“未核区”，避免把没有查到误写成不存在。", 'currentContact', { visual: 'meter', speaker: '老周', portrait: 'zhou', expression: 'focused', requiresEvidence: ['live-after-cut'] }),
    currentContact: beat('槐荫巷 · 调度通讯', '01:32', 35, '林岚在上级监测里查不到对应的反送功率：“现场数值先留照片，别用系统没有记录来否定它。”我把开关位置、量程和测点写进工单，备注：未知电源，保持隔离。', 'meterbox', { speaker: '林岚', portrait: 'lin', requiresEvidence: ['live-after-cut'], actions: [{ id: 'return-meterbox', label: '返回表箱继续排查', next: 'meterbox' }], presence: "radio" }),
    inspectLedger: {
        kind: 'evidence', location: '抢修车内', time: '01:33', speaker: "季宁",
        text: "在停稳的抢修车里，季宁把纸质台账和终端并排。纸上只有十二户，电子档另有一个七年前建档的十三号。所谓“在线”来自历史队列，现用采集系统没有有效表计对应；电量曲线与实时测量得分开保存。",
        visual: 'meter', progress: 35, excludesEvidence: ['house-13'], scene: {
            background: "/art/repair-van.webp"
        },
        actions: [{ id: 'record-ledger', label: '记录：不存在的13户', next: 'ledgerAddress', collect: 'house-13' }],
        portrait: "ji"
    },
    ledgerAddress: beat('抢修车 · 用户档案', '01:34', 35, "十三号地址空白，旧户号能通过校验。迁出、合户、停用各有对应表，唯独这里缺销户凭证。季宁从纸质台账找到被铅笔擦过的门牌，和我核对后标成“档案待补”，没有擅自把住户加回现用供电清册。", 'ledgerPattern', { visual: 'dispatch', scene: {
            background: "/art/repair-van.webp"
        }, requiresEvidence: ['house-13'] }),
    ledgerPattern: beat('抢修车 · 历史曲线', '01:35', 35, "季宁导出原始时标，先查改时、迁移批次和重复报文。十三号每月同一天的 00:47 都多出几分钟记录，日累计却是零。历史队列可以解释“在线”这三个字的来处，暂时解释不了今夜实测的回流。她把两个文件夹分开命名，保留检索条件。", 'ledgerContact', { visual: 'dispatch', scene: {
            background: "/art/repair-van.webp"
        }, requiresEvidence: ['house-13'], speaker: "季宁", portrait: "ji", expression: "concerned" }),
    ledgerContact: beat('槐荫巷 · 调度通讯', '01:36', 35, "林岚回报建档来源：2019年10月11日旧城资料迁移。“我已把重复报文和有效采集事件分开；H13 的原附页要经档案部门调阅。”老周听见编号，摸了一下雨衣内袋。季宁保存通讯索引，没有把他的沉默当成证词。", 'meterbox', { speaker: '林岚', portrait: 'lin', requiresEvidence: ['house-13'], actions: [{ id: 'return-meterbox', label: '返回表箱继续排查', next: 'meterbox' }], presence: "radio" }),
    inspectAsh: {
      kind: 'evidence', location: '低压表箱', time: '01:36',
      text: '封印螺丝后面塞着一点黄纸灰。雨下了一夜，它却是干的。残片上能辨出半个“回”字。',
      visual: 'meter', progress: 35, excludesEvidence: ['paper-ash'], scene: { background: '/art/alley.webp' },
      actions: [{ id: 'record-ash', label: '记录：表箱里的纸灰', next: 'ashSeal', collect: 'paper-ash' }]
    },
    ashSeal: beat('低压表箱 · 封印外侧', '01:37', 35,
      '我没有扯开封印。先拍下残片的位置：纸灰被压在螺丝外沿，不在接点之间，附近也没有电弧灼痕。这件东西解释不了接线故障，却说明有人曾在箱外停留，把纸特意塞进了这里。',
      'ashMeaning', { visual: 'meter', requiresEvidence: ['paper-ash'] }),
    ashMeaning: beat('槐荫巷 · 杨婶亲戚家门前', '01:38', 35,
      '杨婶远远看见照片，认出残留的字：“不是写给线路的。以前有人每个月来，嘴里念‘回来’。”她没说是在叫谁。我把这句话和现场照片分开记，人的说法不能代替测量，也不能随手删掉。',
      'meterbox', { speaker: '杨婶', portrait: 'mei', requiresEvidence: ['paper-ash'], actions: [{ id: 'return-meterbox', label: '返回表箱继续排查', next: 'meterbox' }] }),
    residentTalk: beat('槐荫巷 · 杨婶亲戚家门前', '01:34', 35,
      '杨婶取来一个装票据的铁盒。她先问，今天的工单能不能留下旧门牌。我说可以记录，但地址最终要核实。“那你先写十三号，”她说，“别再写空置。”',
      'residentMemory', { speaker: '杨婶', portrait: 'mei', excludesEvidence: ['lost-address'] }),
    residentMemory: beat('亲戚家 · 门廊', '01:35', 35, "七年前，十三号住着做缝补的陈阿姨和她外孙。进水那夜，许守成从杨婶手里借走一把缠着绿布的梯子，将人带出来；之后又回去检查旧线。杨婶只见到他第二次进去。季宁问清哪些是亲眼所见，哪些是后来听说，分别记在两栏。", 'residentDebt', { speaker: '杨婶', portrait: 'mei', excludesEvidence: ['lost-address'] }),
    residentDebt: beat('亲戚家 · 旧票据', '01:36', 35,
      '“后来统计迁出的名单，把他们写成早就搬走了。安置款、欠费，哪一项都找不到这户。”杨婶翻出一张交费收据，红印很浅，户号与13号相同。她说，这不是替死人要电，是活人欠了一份能被查到的记录。',
      'residentBoundary', { speaker: '杨婶', portrait: 'mei', excludesEvidence: ['lost-address'] }),
    residentBoundary: beat('亲戚家 · 门廊', '01:37', 35,
      '我说明今天能做的事：把收据拍照附在工单后，申请查原始迁出材料，不擅自改户籍和赔付结论。杨婶点头，把铁盒放回高处：“先让他们的名字有地方放，别再从空白开始找。”',
      'residentRecord', { portrait: 'mei', excludesEvidence: ['lost-address'] }),
    residentRecord: beat('亲戚家 · 票据核验', '01:38', 35,
      '收据上的住址仍是“槐荫巷十三号”。纸背另写着两个联系号码，其中一个和七年前供电所的值班电话一致。可核对的门牌、户号与来往记录，使这户的存在不再只剩一段口述。',
      'meterbox', { kind: 'evidence', excludesEvidence: ['lost-address'], actions: [{ id: 'record-address', label: '记录：被擦去的门牌', next: 'meterbox', collect: 'lost-address' }] }),
    archivedTicket: beat('槐荫巷 · 抢修车旁', '01:35', 35,
      '我请老周解释 H13。他终于从内袋取出一张折了四层的复印件：“这张一直没有进档。我想着等有人问，后来没人再问了。”纸上的时间是七年前的事故夜。',
      'ticketGap', { speaker: '老周', portrait: 'zhou', expression: 'focused', excludesEvidence: ['bypass-ticket'] }),
    ticketGap: beat('抢修车 · 旧工作票', '01:36', 35, "正页记着旧城改造停电，救援附页另列独立电源的临时照明和十三号通行路线。“旁路”是那年纸上的简称，不能据此认定如今还能接入市电。正式电子卷没有这张附页，季宁拍下整页、编号和折痕，保留原有空白。", 'ticketSignature', { visual: 'dispatch', scene: {
            background: "/art/repair-van.webp"
        }, excludesEvidence: ['bypass-ticket'] }),
    ticketSignature: beat('抢修车 · 签名栏', '01:37', 35, "执行栏是许守成，监护栏没有写完。老周说：“我离开岗位去疏散，没有落实替代和暂停安排；后来又把没有核完的事项写成完成。复印件也没交。这些都要查我的责任。”季宁停了笔，等他说完。我把原话和今天的提交时间同时记下，原票不补旧日期。", 'ticketRoute', { speaker: '老周', portrait: 'zhou', expression: 'focused', visual: 'dispatch', scene: {
            background: "/art/repair-van.webp"
        }, excludesEvidence: ['bypass-ticket'] }),
    ticketRoute: beat('抢修车 · 接线附图', '01:38', 35,
      '票上的 H13 不只是户号。它指向一条从旧宅外墙接到救援照明的支路，末端还标了城北转接点。图画到巷外就断了，没有注明旁路拆除人，也没有闭合验收日期。',
      'ticketRecord', { visual: 'dispatch', scene: { background: '/art/dispatch.webp' }, excludesEvidence: ['bypass-ticket'] }),
    ticketRecord: beat('抢修车 · 拍照留存', '01:39', 35,
      '老周同意把复印件作为线索附在今天的工单后，并接受后续原件核查。我把票号、签名与缺失的拆除记录分别录入。对他而言，这张纸终于离开内袋；对现场而言，未知接线仍然不能送电。',
      'meterbox', { kind: 'evidence', portrait: 'zhou', expression: 'focused', excludesEvidence: ['bypass-ticket'], actions: [{ id: 'record-ticket', label: '记录：未归档的旁路票', next: 'meterbox', collect: 'bypass-ticket' }] }),
    lamp: {
      kind: 'dialogue', location: '槐荫巷尽头', time: '01:42',
      text: '那盏路灯没有接在现有图纸的任何支路上。灯杆后是一栋封死的旧宅，门牌被拆了，只留下两颗钉子。',
      visual: 'lamp', progress: 55, ...afterGate, scene: { background: '/art/alley.webp' },
      actions: [{ id: 'organize-evidence', label: '整理证据', next: 'lampCheck' }]
    },
    lampCheck: beat('旧路灯 · 安全距离外', '01:43', 57,
      '我只在可确认的安全位置检查灯杆外观，不碰未知线路。灯亮得很弱，每隔几秒暗一下，节奏和13号那段曲线相同。箱底的新线绕到这里，却在新图上没有任何终点。',
      'houseApproach', { ...afterGate, visual: 'lamp' }),
    houseApproach: beat('旧宅 · 外墙', '01:44', 59,
      '封门的木板比墙上的钉子新。墙缝里夹着一段旧绝缘护套，纸质接线图的走向也到这里。老周拦住我：“先别进去。这个屋子的边界，直到今天都没有人重新确认过。”',
      'houseKnock', { ...afterGate, visual: 'lamp', portrait: 'zhou', expression: 'focused' }),
    houseKnock: beat('旧宅门前', '01:44', 61,
      '我隔着围栏呼叫，门里没有回应。手机却收到一条用户回访提醒，号码栏空白，备注是“维修未到场”。与此同时，系统把13号的地址补成了这里。它要求的像是一件早该完成、却从未登记的事。',
      'meiAccount', { ...afterGate, visual: 'lamp' }),
    meiAccount: beat('旧宅门前 · 杨婶的叙述', '01:45', 63,
      '杨婶说：“我亲眼看他救出了屋里的人。他说还要回查进水的旧线，之后的事我没看见。”事故之后，有人要求住户确认“十三号已无人居住”。大家签了字，以为只是迁出手续。“后来连他救过哪家都说不清。”',
      'zhouAdmission', { ...afterGate, speaker: '杨婶', portrait: 'mei', visual: 'lamp' }),
    zhouAdmission: beat('旧宅门前 · 老周的叙述', '01:45', 65,
      '老周承认看过那张删掉十三号的名单：“我知道不对，却想抢修报告已经结了，别再添一件事。”他握着手机，没有再替那张报告解释。林岚在通讯里说，会把现有记录和旧卷同时封存，留待核查。',
      'deduction', { ...afterGate, speaker: '老周', portrait: 'zhou', expression: 'focused', visual: 'lamp' }),
    deduction: {
        kind: 'choice', location: '旧宅门前', time: '01:46', speaker: "季宁",
        text: "季宁把三个文件放在一起：“回流是仪表记录，十三号是档案缺口，纸灰是现场物件。它们时间相近，证据性质不同。”我同意先找可检验的联系。常规故障已按流程处置，十二户的复电核验有人负责；留下来的未知线不能靠一个猜测销单。",
        visual: 'lamp', progress: 68, ...afterGate, scene: { background: '/art/alley.webp' },
        actions: [
            { id: 'cut-line', label: '按窃电处理，直接切断异常回路', next: 'wrong' },
            { id: 'trace-source', label: '先追踪倒送电源，再核对“13号”的建档日期', next: 'isolationChoice', tone: 'danger' }
        ],
        portrait: "ji",
        expression: "concerned"
    },
    wrong: beat('槐荫巷', '01:51', 68, "我提出按窃电删去十三号并剪断未知线。老周拒绝执行，季宁把判断停在“待复核”。开关和线路都没有动，终端预览里的十二个地址却依次空白，像删户动作先落到了活人身上。纸质台账仍在她手里，名字一个也没有少。", 'wrongEcho', { ...afterGate, visual: 'blackout' }),
    wrongEcho: beat('槐荫巷 · 异常告警', '01:51', 68, "“没有定位电源，也没有窃电证据。”季宁把纸质户号逐一读回，阻止错误分类提交。我撤回处理意见，记录这次判断失误。十二户的正常抢修另行完成，未知支路保持隔离；终端预览的空白被截图，不能再当成现场停电或删户结果。", 'wrongWarning', { ...afterGate, visual: 'blackout', portrait: 'mei' }),
    wrongWarning: beat('槐荫巷 · 误判', '01:52', 68, "林岚核对原始工单，十三号仍在历史检索中。“先给它取了罪名，再想把线剪掉，材料没有因此变完整。”季宁合上台账，我承认这次判断不能成立，申请复核。\n\n错误结局：删去第十三户。", 'deduction', { ...afterGate, kind: 'ending', outcome: 'failure', portrait: 'lin', visual: 'blackout', actions: [{ id: 'retry-deduction', label: '回到判断前', next: 'deduction' }], presence: "radio" }),
    isolationChoice: beat('旧宅门前 · 接线边界判断', '01:47', 71,
      '建档日期与事故夜相同，但这仍不足以确定旧线的电源。现在要选择验证方法。十二户需要恢复供电，未知支路也不能被顺手接进同一回路。',
      'traceProcedure', {
        ...afterGate, kind: 'puzzle', visual: 'lamp',
        puzzle: { prompt: '哪一种验证方式能保留线索，同时守住现场的供电边界？', hint: '电流来源未确认时，合闸试探会把未知风险带进已知支路。先核对记录与物理连接。' },
        actions: [
          { id: 'trial-close', label: '临时合闸，靠电表转动确认旧支路', next: 'unsafeBypass' },
          { id: 'keep-isolated', label: '保持旧支路隔离，核对工作票与接线边界', next: 'traceProcedure', tone: 'danger' }
        ]
      }),
    unsafeBypass: beat('低压表箱 · 试送电', '01:48', 71, "我提出将未知支路并入正常供电试验。老周立即退回方案，季宁也没有录入操作申请。现场未合闸，终端却弹出一张日期为今天的空白验收表，执行栏自动填上许守成。窗后有一道举梯子的影子，车灯扫过去时又只剩雨。", 'bypassAlarm', { ...afterGate, visual: 'blackout' }),
    bypassAlarm: beat('槐荫巷 · 停止操作', '01:49', 71, "“试着送电不能用来寻找未知电源。”老周把退回理由写进记录。季宁检查仪表，正常线路状态稳定，异常只留在验收表预览里。我们保持隔离，保存原始报文，撤回这项不具备安全条件的建议。那张自动填字的表没有成为真实工作票。", 'bypassFailure', { ...afterGate, speaker: '老周', portrait: 'zhou', expression: 'focused', visual: 'blackout' }),
    bypassFailure: beat('低压表箱 · 未通过的验收', '01:50', 71, "季宁问：“让一个七年前的人签今天的字，谁来接这张票？”我没有答案。方案被退回，未执行任何试送，后续核验转入重新排查。错的判断差点把记录里的许守成，又一次推向未知线路。\n\n错误结局：替旧事故签字。", 'isolationChoice', { ...afterGate, kind: 'ending', outcome: 'failure', portrait: 'lin', visual: 'blackout', actions: [{ id: 'retry-isolation', label: '重新判断接线边界', next: 'isolationChoice' }], presence: "radio" }),
    traceProcedure: beat('槐荫巷 · 边界复核', '01:48', 74, "十二户的正常进线修复后，按程序核验并获准恢复供电，季宁逐户确认照明。我们另开未知支路核查，在产权管理方配合和获准范围内对照箱外线号。旧宅未确认区域继续封闭，林岚联络专责人员；今晚的材料不能替代后续源端排查。", 'hiddenBranch', { ...afterGate, visual: 'meter', portrait: "cheng", speaker: "程砚（你）", expression: "focused" }),
    hiddenBranch: beat('旧宅 · 外墙暗线', '01:50', 77, "管理方带我们到已列入许可范围的检修口。盖板内侧夹着一个防潮袋，未知支路末端仍在隔离边界内。专业人员记录可见接线，未越界拆墙或触碰未核线路。季宁在照片上标出位置：纸袋贴在盖板上，没有接在线路上。", 'truth', { ...afterGate, visual: 'lamp' }),
    truth: {
        kind: 'dialogue', location: '槐荫巷 · 13号', time: '01:52',
        text: "防潮袋里是一张七年前的讣告。许守成的事故通报我在安全培训中见过，完整的住户附页却从未调阅。可见支路末端没有接到住户负载，纸张夹在旁边的盖板内侧，来路未明的回流仍留待专项复核。我让季宁拍下袋子原位和展开后的两面。找到一份纸，不能让我们在工单里编出一个电源。",
        visual: 'ending', progress: 80, ...afterGate, scene: { background: '/art/alley.webp', inscription: '请勿闭合' },
        actions: [{ id: 'continue', label: '继续', next: 'noticeNames' }],
        portrait: "xu",
        presence: "archive",
        speaker: "旧档 · 许守成"
    },
    noticeNames: beat('旧宅 · 讣告', '01:53', 82, "季宁读出许守成的姓名，又把讣告落款“槐荫巷十三号及邻里”逐户核对。当夜获救的陈阿姨和外孙都活着迁走了，杨婶给出能联系到他们的线索。“这些名字不能写成空户。”她给每一条注明来源，准备经正式渠道核实。", 'noticeDebt', { ...afterGate, portrait: "ji", visual: 'ending', scene: { background: '/art/alley.webp' }, speaker: "季宁", expression: "neutral" }),
    noticeDebt: beat('旧宅门前', '01:54', 84,
      '杨婶认出那张纸：“我们想放进所里，不知道交给谁。后来只好留在他最后干活的地方。”烧纸的人不是要把许守成叫回来；她担心连这条巷子也没人再记得他来过。雨把她的尾音压得很低。',
      'linCompare', { ...afterGate, speaker: '杨婶', portrait: 'mei', visual: 'ending' }),
    linCompare: beat('槐荫巷 · 档案对照', '01:56', 87, '林岚把新旧档案并排放在终端上：事故记录有许守成，迁出名单没有十三号，工作票没有旁路附页。三个空白拼在一起，才让现场出现了一条“从来没人用过”的线。她建立核查任务，保留每份材料的来源。', 'recordCrosscheck', { ...afterGate, speaker: '林岚', portrait: 'lin', visual: 'ending', presence: "radio" }),
    recordCrosscheck: beat('低压表箱 · 正常支路复核', '01:59', 90, "十二户恢复后的电量和回访状态正常。未知支路继续隔离，处置责任交给相应专业岗位；历史材料以 H13 为索引移交独立核查。老周另行提交离岗、虚假完成和保留附页的说明。我和季宁签的是今天实际完成的工作，不给七年前的空格补签。", 'epilogueCall', { ...afterGate, visual: 'meter' }),
    epilogueCall: beat('槐荫巷 · 回访通讯', '02:02', 92, '林岚逐户回访，十二个号码都有人接听。13号的提醒没有再弹出来，但她没有删除核查任务：“曲线停止了，不等于材料齐了。明天我把原始卷调出来，你们的照片留在附件里。”', 'zhouGoodbye', { ...afterGate, speaker: '林岚', portrait: 'lin', presence: "radio" }),
    zhouGoodbye: beat('槐荫巷口', '02:04', 94,
      '老周说会补写自己当夜离开监护位置的经过，把复印件交给档案核查。“写晚了，也是我该写的。”杨婶没有说谢谢，只请我们把十三号的名字拼对。旧路灯在我们离开前暗了下来。',
      'busReveal', { ...afterGate, speaker: '老周', portrait: 'zhou', expression: 'focused' }),
    busReveal: beat('抢修车 · 待办工单', '02:06', 97, '终端上的 H13 变成可检索的历史编号。林岚发现旁路附图的城北转接点，和最近连续跳闸的“七号支线”有一项旧记录相连。她没有把两个故障合成一个答案，只把第二份工单排进了明晚的值班表。', 'end', { ...afterGate, portrait: 'lin', visual: 'ending', scene: { background: '/art/dispatch.webp' }, presence: "radio" }),
    end: {
        kind: 'ending', outcome: 'complete', location: '第一回路 · 未闭合', time: '02:07',
        text: "收工具前，季宁又数了一遍十二户的回访勾选。“十三号呢？”“转成历史核查，原记录保留。”她没有删掉那个名字。终端的在线提醒停止了，H13 仍可检索。工单预览忽然多出一行没人输入的字：“请勿闭合。”她看向我，我们一起把这行也留在附件里。",
        visual: 'ending', progress: 100, ...afterGate, scene: { background: '/art/alley.webp', inscription: '请勿闭合' },
        actions: [{ id: 'restart', label: '重新开始序章', next: 'dispatch', resetEvidence: true }],
        speaker: "季宁",
        portrait: "ji",
        expression: "concerned"
    }
  }
};
