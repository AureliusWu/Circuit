import type { Chapter, EvidenceId, StoryNode } from '../types';

const requiredEvidence: readonly EvidenceId[] = ['live-after-cut', 'house-13', 'paper-ash'];
const allEvidence: readonly EvidenceId[] = [...requiredEvidence, 'lost-address', 'bypass-ticket'];
const workOrder = {
  title: '故障工单  2026-10-11 / 00:52',
  lines: ['城西槐荫巷低压停电', '停电用户：12', '在线电表：13']
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
    'live-after-cut': { title: '断开后仍有负荷', detail: '表前开关已经拉开，但钳形表仍读到稳定电流。电流方向像是从用户侧倒送回来。' },
    'house-13': { title: '不存在的13户', detail: '旧台账只有12户，新系统却长期记录着“13号”用电。地址栏为空，户号真实存在。' },
    'paper-ash': { title: '表箱里的纸灰', detail: '烧焦的黄纸卡在封印螺丝后面，灰烬没有受潮。纸上只剩半个手写的“回”字。' },
    'lost-address': { title: '被擦去的门牌', detail: '杨婶保留的交费收据写着“槐荫巷十三号”。旧城改造后，这一家被并入迁出名单，门牌与户名同时从现用台账中消失。' },
    'bypass-ticket': { title: '未归档的旁路票', detail: '老周留下的抢修票复印件记着 H13 临时旁路与许守成的签名。正式归档没有这张附页，也没有写明旁路最终由谁拆除。' }
  },
  nodes: {
    title: {
      kind: 'title', location: '梧城', time: '00:47',
      text: '雨把城市的声音压得很低。远处一排路灯，像一条没有闭合的线。',
      visual: 'blackout', progress: 0, ...opening, scene: { background: '/art/alley.webp' },
      actions: [{ id: 'begin', label: '开始抢修', next: 'dispatch' }]
    },
    dispatch: {
      kind: 'dialogue', location: '梧城供电公司 · 城北供电所', time: '00:52', speaker: '值班员',
      text: '“城西槐荫巷，低压故障。十二户全停，系统却还有一户在走电。你过去看看。”',
      visual: 'dispatch', progress: 3, ...opening, portrait: 'lin', scene: dispatchScene,
      actions: [{ id: 'accept-order', label: '接下工单', next: 'call' }]
    },
    call: {
      kind: 'dialogue', location: '值班室', time: '00:53', speaker: '你',
      text: '我盯着工单看了两遍。停电范围：12户。在线电表：13块。备注里没有新增用户。',
      visual: 'dispatch', progress: 5, ...opening, scene: dispatchScene,
      actions: [{ id: 'depart', label: '出发抢修', next: 'safetyBrief' }]
    },
    safetyBrief: beat('城北供电所 · 出车登记', '00:56', 7,
      '林岚把工单转到我的终端：“用户说是整条巷子灭了。上级出线没有跳闸，先核对停电边界。现场遇到来路不明的电源，别把它当成普通残余电。”她在回访栏留了自己的分机。',
      'vehicleKit', { ...opening, speaker: '林岚', portrait: 'lin', visual: 'dispatch', scene: { background: '/art/dispatch.webp' } }),
    vehicleKit: beat('抢修车', '01:00', 9,
      '我检查验电器的自检、绝缘工具与照明。钳形表、便携功率分析仪都能正常自检，相机时间也和终端对齐。车里另有一册纸质用户台账——老巷子的地址，有时纸上比系统里清楚。',
      'zhouCall', { ...opening, visual: 'dispatch', scene: { background: '/art/dispatch.webp' } }),
    zhouCall: beat('城西路口 · 车载通讯', '01:08', 12,
      '老周接起电话，听见“槐荫巷”后停了一下：“我住得近，过来配合你。那边拆迁时改过线，不能只照新图找开关。先等我到，别一个人往旧宅里钻。”',
      'bypassWarning', { ...opening, speaker: '老周', portrait: 'zhou' }),
    bypassWarning: beat('城西路口', '01:12', 15,
      '“七年前那次停电，有人从旧宅外墙绕过一条临时支路。”老周说，“后来我没参与验收。”他说得很慢，却没有说支路给谁用。我在工单里补上：历史接线边界待核实。',
      'alley', { ...opening, speaker: '老周', portrait: 'zhou' }),
    alley: {
      kind: 'dialogue', location: '城西 · 槐荫巷', time: '01:21',
      text: '整条巷子都黑着，只有尽头一盏老式路灯亮着。雨水沿着架空线往下滴，像有什么东西正顺着线爬。',
      visual: 'alley', progress: 18, ...opening, scene: { background: '/art/alley.webp' },
      actions: [{ id: 'open-meterbox', label: '先查低压表箱', next: 'alleyResidents' }]
    },
    alleyResidents: beat('槐荫巷口', '01:22', 20,
      '十二扇门都开着一点，手电的光落在各家门槛内。有人催着送电，没人肯去敲尽头的门。穿雨披的老妇人把其他人拦下：“师傅要先查，你们别摸箱子。”',
      'meiDoor', { ...opening, portrait: 'mei' }),
    meiDoor: beat('槐荫巷 · 杨婶家门前', '01:23', 22,
      '杨婶报了自家户号，和系统里的十二户逐一对得上。问到旧宅，她把手电转向墙根：“那不是空房子。上次有人说它空着，也是下这样的雨。”我请她先回安全的门内，等排查结束再问。',
      'perimeter', { ...opening, speaker: '杨婶', portrait: 'mei' }),
    perimeter: beat('槐荫巷 · 作业边界', '01:24', 25,
      '老周到场后，我们用围栏隔开积水处和表箱，不让住户靠近裸露接线。先看上级线路、箱体外观与周围可能接入的发电设备，再确认哪些开关真正对应这十二户。',
      'isolateSupply', { ...opening, portrait: 'zhou' }),
    isolateSupply: beat('槐荫巷 · 低压表箱', '01:26', 29,
      '我按工作程序停电、验电，老周复核作业边界。十二户的正常供电支路可以追到上级电源；新换的那一段线却从箱底穿出去，编号朝着巷子尽头。它暂时不能归入任何已知用户。',
      'meterbox', { ...opening, visual: 'meter' }),
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
      text: '总开关断开。验电确认。可钳形表仍有 0.41A，而且电流方向反了——它从巷子深处回来。',
      visual: 'meter', progress: 35, excludesEvidence: ['live-after-cut'], scene: { background: '/art/alley.webp' },
      actions: [{ id: 'record-current', label: '记录：断开后仍有负荷', next: 'currentLimit', collect: 'live-after-cut' }]
    },
    currentLimit: beat('低压表箱 · 仪表复核', '01:30', 35,
      '我换量程复测，确认钳口闭合，没有把相邻导线一起夹进去。钳形表只给出电流大小，倒送方向由便携功率分析仪的相位参照确认。读数仍不能说明电源来自哪里，更不能证明未知支路安全。',
      'currentDirection', { visual: 'meter', requiresEvidence: ['live-after-cut'] }),
    currentDirection: beat('低压表箱 · 接线草图', '01:31', 35,
      '老周照着线号补了一张草图。新线和十二户的支路分开，回流的方向落在旧宅墙根。已知的市电接入点都在另一头，住户也没有报装自备电源。我们把这条线另行标记，不纳入恢复送电范围。',
      'currentContact', { visual: 'meter', speaker: '老周', portrait: 'zhou', requiresEvidence: ['live-after-cut'] }),
    currentContact: beat('槐荫巷 · 调度通讯', '01:32', 35,
      '林岚在上级监测里查不到对应的反送功率：“现场数值先留照片，别用系统没有记录来否定它。”我把开关位置、量程和测点写进工单，备注：未知电源，保持隔离。',
      'meterbox', { speaker: '林岚', portrait: 'lin', requiresEvidence: ['live-after-cut'], actions: [{ id: 'return-meterbox', label: '返回表箱继续排查', next: 'meterbox' }] }),
    inspectLedger: {
      kind: 'evidence', location: '抢修车内', time: '01:33', speaker: '你',
      text: '纸质台账只有1到12号。手机系统里多出一个13号户表，七年前建档，此后每个月只在同一天出现一小段用电。',
      visual: 'meter', progress: 35, excludesEvidence: ['house-13'], scene: { background: '/art/dispatch.webp' },
      actions: [{ id: 'record-ledger', label: '记录：不存在的13户', next: 'ledgerAddress', collect: 'house-13' }]
    },
    ledgerAddress: beat('抢修车 · 用户档案', '01:34', 35,
      '13号的地址栏是空白，户号却能通过校验。我先查迁出、合户和停用记录：十二户各有来处，唯独13号没有正常的销户凭证。它不像新装的表，更像被挪走了地址的一份旧档。',
      'ledgerPattern', { visual: 'dispatch', scene: { background: '/art/dispatch.webp' }, requiresEvidence: ['house-13'] }),
    ledgerPattern: beat('抢修车 · 历史曲线', '01:35', 35,
      '那一小段用电从凌晨零点四十七分开始，只有几分钟。月份变了，日期和时刻一直没变。每次系统都会把它算进在线用户，后面的日累计却仍是零。我截下原始曲线，避免刷新后丢失。',
      'ledgerContact', { visual: 'dispatch', scene: { background: '/art/dispatch.webp' }, requiresEvidence: ['house-13'] }),
    ledgerContact: beat('槐荫巷 · 调度通讯', '01:36', 35,
      '林岚发来建档来源：2019年10月11日旧城改造资料导入。“原始附页不在电子卷里，只有一个 H13 编号。”老周听见这个编号，伸手去摸雨衣内袋，又把手放下了。他说，先把现场查完。',
      'meterbox', { speaker: '林岚', portrait: 'lin', requiresEvidence: ['house-13'], actions: [{ id: 'return-meterbox', label: '返回表箱继续排查', next: 'meterbox' }] }),
    inspectAsh: {
      kind: 'evidence', location: '低压表箱', time: '01:36',
      text: '封印螺丝后面塞着一点黄纸灰。雨下了一夜，它却是干的。残片上能辨出半个“回”字。',
      visual: 'meter', progress: 35, excludesEvidence: ['paper-ash'], scene: { background: '/art/alley.webp' },
      actions: [{ id: 'record-ash', label: '记录：表箱里的纸灰', next: 'ashSeal', collect: 'paper-ash' }]
    },
    ashSeal: beat('低压表箱 · 封印外侧', '01:37', 35,
      '我没有扯开封印。先拍下残片的位置：纸灰被压在螺丝外沿，不在接点之间，附近也没有电弧灼痕。这件东西解释不了接线故障，却说明有人曾在箱外停留，把纸特意塞进了这里。',
      'ashMeaning', { visual: 'meter', requiresEvidence: ['paper-ash'] }),
    ashMeaning: beat('槐荫巷 · 杨婶家门前', '01:38', 35,
      '杨婶远远看见照片，认出残留的字：“不是写给线路的。以前有人每个月来，嘴里念‘回来’。”她没说是在叫谁。我把这句话和现场照片分开记，人的说法不能代替测量，也不能随手删掉。',
      'meterbox', { speaker: '杨婶', portrait: 'mei', requiresEvidence: ['paper-ash'], actions: [{ id: 'return-meterbox', label: '返回表箱继续排查', next: 'meterbox' }] }),
    residentTalk: beat('槐荫巷 · 杨婶家门前', '01:34', 35,
      '杨婶取来一个装票据的铁盒。她先问，今天的工单能不能留下旧门牌。我说可以记录，但地址最终要核实。“那你先写十三号，”她说，“别再写空置。”',
      'residentMemory', { speaker: '杨婶', portrait: 'mei', excludesEvidence: ['lost-address'] }),
    residentMemory: beat('杨婶家 · 门廊', '01:35', 35,
      '七年前，十三号住着做缝补的陈阿姨和她外孙。旧城改造停电那夜，巷子里进了水，他们被困在屋里。许守成从这里借过一把梯子，再也没有回来还。杨婶还记得梯子上缠着的绿布。',
      'residentDebt', { speaker: '杨婶', portrait: 'mei', excludesEvidence: ['lost-address'] }),
    residentDebt: beat('杨婶家 · 旧票据', '01:36', 35,
      '“后来统计迁出的名单，把他们写成早就搬走了。安置款、欠费，哪一项都找不到这户。”杨婶翻出一张交费收据，红印很浅，户号与13号相同。她说，这不是替死人要电，是活人欠了一份能被查到的记录。',
      'residentBoundary', { speaker: '杨婶', portrait: 'mei', excludesEvidence: ['lost-address'] }),
    residentBoundary: beat('杨婶家 · 门廊', '01:37', 35,
      '我说明今天能做的事：把收据拍照附在工单后，申请查原始迁出材料，不擅自改户籍和赔付结论。杨婶点头，把铁盒放回高处：“先让他们的名字有地方放，别再从空白开始找。”',
      'residentRecord', { portrait: 'mei', excludesEvidence: ['lost-address'] }),
    residentRecord: beat('杨婶家 · 票据核验', '01:38', 35,
      '收据上的住址仍是“槐荫巷十三号”。纸背另写着两个联系号码，其中一个和七年前供电所的值班电话一致。可核对的门牌、户号与来往记录，使这户的存在不再只剩一段口述。',
      'meterbox', { kind: 'evidence', excludesEvidence: ['lost-address'], actions: [{ id: 'record-address', label: '记录：被擦去的门牌', next: 'meterbox', collect: 'lost-address' }] }),
    archivedTicket: beat('槐荫巷 · 抢修车旁', '01:35', 35,
      '我请老周解释 H13。他终于从内袋取出一张折了四层的复印件：“这张一直没有进档。我想着等有人问，后来没人再问了。”纸上的时间是七年前的事故夜。',
      'ticketGap', { speaker: '老周', portrait: 'zhou', excludesEvidence: ['bypass-ticket'] }),
    ticketGap: beat('抢修车 · 旧工作票', '01:36', 35,
      '工作票的正页写着“旧城改造临时停电”；附页记着救援照明和十三号临时旁路。正式电子卷只保留了正页，所以看起来那夜没有留下任何额外接线，也没有尚待清理的用户。',
      'ticketSignature', { visual: 'dispatch', scene: { background: '/art/dispatch.webp' }, excludesEvidence: ['bypass-ticket'] }),
    ticketSignature: beat('抢修车 · 签名栏', '01:37', 35,
      '附页的执行人是许守成，监护栏只写到一半。老周指着缺笔的地方：“我当时去另一头疏散住户。回来时已经出事。后来报告把这张当作废页，我没有把复印件交出去。”',
      'ticketRoute', { speaker: '老周', portrait: 'zhou', visual: 'dispatch', scene: { background: '/art/dispatch.webp' }, excludesEvidence: ['bypass-ticket'] }),
    ticketRoute: beat('抢修车 · 接线附图', '01:38', 35,
      '票上的 H13 不只是户号。它指向一条从旧宅外墙接到救援照明的支路，末端还标了城北转接点。图画到巷外就断了，没有注明旁路拆除人，也没有闭合验收日期。',
      'ticketRecord', { visual: 'dispatch', scene: { background: '/art/dispatch.webp' }, excludesEvidence: ['bypass-ticket'] }),
    ticketRecord: beat('抢修车 · 拍照留存', '01:39', 35,
      '老周同意把复印件作为线索附在今天的工单后，并接受后续原件核查。我把票号、签名与缺失的拆除记录分别录入。对他而言，这张纸终于离开内袋；对现场而言，未知接线仍然不能送电。',
      'meterbox', { kind: 'evidence', portrait: 'zhou', excludesEvidence: ['bypass-ticket'], actions: [{ id: 'record-ticket', label: '记录：未归档的旁路票', next: 'meterbox', collect: 'bypass-ticket' }] }),
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
      'houseKnock', { ...afterGate, visual: 'lamp', portrait: 'zhou' }),
    houseKnock: beat('旧宅门前', '01:44', 61,
      '我隔着围栏呼叫，门里没有回应。手机却收到一条用户回访提醒，号码栏空白，备注是“维修未到场”。与此同时，系统把13号的地址补成了这里。它要求的像是一件早该完成、却从未登记的事。',
      'meiAccount', { ...afterGate, visual: 'lamp' }),
    meiAccount: beat('旧宅门前 · 杨婶的叙述', '01:45', 63,
      '杨婶说：“我亲眼看他救出了屋里的人。他说还要回查进水的旧线，之后的事我没看见。”事故之后，有人要求住户确认“十三号已无人居住”。大家签了字，以为只是迁出手续。“后来连他救过哪家都说不清。”',
      'zhouAdmission', { ...afterGate, speaker: '杨婶', portrait: 'mei', visual: 'lamp' }),
    zhouAdmission: beat('旧宅门前 · 老周的叙述', '01:45', 65,
      '老周承认看过那张删掉十三号的名单：“我知道不对，却想抢修报告已经结了，别再添一件事。”他握着手机，没有再替那张报告解释。林岚在通讯里说，会把现有记录和旧卷同时封存，留待核查。',
      'deduction', { ...afterGate, speaker: '老周', portrait: 'zhou', visual: 'lamp' }),
    deduction: {
      kind: 'choice', location: '旧宅门前', time: '01:46', speaker: '你',
      text: '三个异常现在连在了一起：倒送电、13号户、干燥的纸灰。必须先判断它们是不是同一个“故障”。',
      visual: 'lamp', progress: 68, ...afterGate, scene: { background: '/art/alley.webp' },
      actions: [
        { id: 'cut-line', label: '按窃电处理，直接切断异常回路', next: 'wrong' },
        { id: 'trace-source', label: '先追踪倒送电源，再核对“13号”的建档日期', next: 'isolationChoice', tone: 'danger' }
      ]
    },
    wrong: beat('槐荫巷', '01:51', 68,
      '你按普通窃电故障处理，剪断了那根回送线。整条巷子瞬间亮了一次。十二块停着的电表同时向后转了一格。',
      'wrongEcho', { ...afterGate, visual: 'blackout' }),
    wrongEcho: beat('槐荫巷 · 异常告警', '01:51', 68,
      '工单没有关闭，十二户的地址栏反而依次变成空白。杨婶手里的交费收据还是原样，但终端已经查不到她报出的户号。我立即停止后续操作，老周重新确认隔离边界。',
      'wrongWarning', { ...afterGate, visual: 'blackout', portrait: 'mei' }),
    wrongWarning: beat('槐荫巷 · 误判', '01:52', 68,
      '“不知道它从哪里来，就把它当成窃电。”林岚重复了我的处理记录。剪断一根线没有补全那户的资料，只把新的矛盾留给了十二户。现场仍需隔离，故障不能据此销单。\n\n错误结局：删去第十三户。',
      'deduction', { ...afterGate, kind: 'ending', outcome: 'failure', portrait: 'lin', visual: 'blackout', actions: [{ id: 'retry-deduction', label: '回到判断前', next: 'deduction' }] }),
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
    unsafeBypass: beat('低压表箱 · 试送电', '01:48', 71,
      '我试着把旧支路并入正常供电范围。仪表发出连续告警，路灯一下变得刺眼。旧宅窗后映出一道人影，姿势像在举着梯子，而正常用户支路的测量也开始失去稳定。',
      'bypassAlarm', { ...afterGate, visual: 'blackout' }),
    bypassAlarm: beat('槐荫巷 · 停止操作', '01:49', 71,
      '老周要求立即停止试送，按程序恢复隔离。我的终端弹出一份空白验收表，签名栏自动填上许守成，日期却是今天。未知支路没有因此变成安全电源；“看一看会发生什么”也不能成为合闸依据。',
      'bypassFailure', { ...afterGate, speaker: '老周', portrait: 'zhou', visual: 'blackout' }),
    bypassFailure: beat('低压表箱 · 未通过的验收', '01:50', 71,
      '十二户仍在等待，旧工作票多出一项没有人能够确认的操作。林岚撤回试送申请，要求重新核对边界。我没有解决七年前的事故，只几乎重演了它。\n\n错误结局：替旧事故签字。',
      'isolationChoice', { ...afterGate, kind: 'ending', outcome: 'failure', portrait: 'lin', visual: 'blackout', actions: [{ id: 'retry-isolation', label: '重新判断接线边界', next: 'isolationChoice' }] }),
    traceProcedure: beat('槐荫巷 · 边界复核', '01:48', 74,
      '我和老周保持未知支路隔离，按线号从箱外逐段核对接线路径。林岚同时查旧工作票，没有把“找到了13号”当成销单条件。先确认哪些是十二户的正常线路，再处理无法解释的部分。',
      'hiddenBranch', { ...afterGate, visual: 'meter', portrait: 'zhou' }),
    hiddenBranch: beat('旧宅 · 外墙暗线', '01:50', 77,
      '一块松动的检修盖板后露出旧支路的末端。它没有通向住户电器，也没有接到那盏灯的现用电源。盖板内侧夹着防潮袋，袋里是一张折叠的纸。我们没有拆开未知线路，只记录了现场连接。',
      'truth', { ...afterGate, visual: 'lamp' }),
    truth: {
      kind: 'dialogue', location: '槐荫巷 · 13号', time: '01:52',
      text: '你没有剪线。你先把13号户从系统里拉出来，又沿着倒送电流找到旧宅墙内的暗线。电线的尽头没有负载，只有一张七年前的讣告。',
      visual: 'ending', progress: 80, ...afterGate, scene: { background: '/art/alley.webp', inscription: '请勿闭合' },
      actions: [{ id: 'continue', label: '继续', next: 'noticeNames' }]
    },
    noticeNames: beat('旧宅 · 讣告', '01:53', 82,
      '讣告上是许守成的名字，落款却是“槐荫巷十三号及邻里”。后面列着当夜接受救助的人，和旧台账里的户名一一对应。十三号一家没有欠他电费，他们欠的是一句从未出现在正式记录里的证明。',
      'noticeDebt', { ...afterGate, portrait: 'xu', visual: 'ending', scene: { background: '/art/alley.webp' } }),
    noticeDebt: beat('旧宅门前', '01:54', 84,
      '杨婶认出那张纸：“我们想放进所里，不知道交给谁。后来只好留在他最后干活的地方。”烧纸的人不是要把许守成叫回来；她担心连这条巷子也没人再记得他来过。雨把她的尾音压得很低。',
      'linCompare', { ...afterGate, speaker: '杨婶', portrait: 'mei', visual: 'ending' }),
    linCompare: beat('槐荫巷 · 档案对照', '01:56', 87,
      '林岚把新旧档案并排放在终端上：事故记录有许守成，迁出名单没有十三号，工作票没有旁路附页。三个空白拼在一起，才让现场出现了一条“从来没人用过”的线。她建立核查任务，保留每份材料的来源。',
      'recordCrosscheck', { ...afterGate, speaker: '林岚', portrait: 'lin', visual: 'ending' }),
    recordCrosscheck: beat('低压表箱 · 正常支路复核', '01:59', 90,
      '我们不替旧资料下最终结论，也不把未知线路恢复成通电回路。十二户的正常支路另行检查并复核送电条件；旧支路保持隔离，挂牌注明未查明电源与历史接线。今天的工单留下编号、照片和待核查名单。',
      'epilogueCall', { ...afterGate, visual: 'meter' }),
    epilogueCall: beat('槐荫巷 · 回访通讯', '02:02', 92,
      '林岚逐户回访，十二个号码都有人接听。13号的提醒没有再弹出来，但她没有删除核查任务：“曲线停止了，不等于材料齐了。明天我把原始卷调出来，你们的照片留在附件里。”',
      'zhouGoodbye', { ...afterGate, speaker: '林岚', portrait: 'lin' }),
    zhouGoodbye: beat('槐荫巷口', '02:04', 94,
      '老周说会补写自己当夜离开监护位置的经过，把复印件交给档案核查。“写晚了，也是我该写的。”杨婶没有说谢谢，只请我们把十三号的名字拼对。旧路灯在我们离开前暗了下来。',
      'busReveal', { ...afterGate, speaker: '老周', portrait: 'zhou' }),
    busReveal: beat('抢修车 · 待办工单', '02:06', 97,
      '终端上的 H13 变成可检索的历史编号。林岚发现旁路附图的城北转接点，和最近连续跳闸的“七号支线”有一项旧记录相连。她没有把两个故障合成一个答案，只把第二份工单排进了明晚的值班表。',
      'end', { ...afterGate, portrait: 'lin', visual: 'ending', scene: { background: '/art/dispatch.webp' } }),
    end: {
      kind: 'ending', outcome: 'complete', location: '第一回路 · 未闭合', time: '02:07',
      text: '恢复供电后，十二户电表重新走字。系统上的第13块表消失了。你收起工具时，工单自动多了一行从未有人输入的备注：\n\n“请勿闭合。”',
      visual: 'ending', progress: 100, ...afterGate, scene: { background: '/art/alley.webp', inscription: '请勿闭合' },
      actions: [{ id: 'restart', label: '重新开始序章', next: 'dispatch', resetEvidence: true }]
    }
  }
};
