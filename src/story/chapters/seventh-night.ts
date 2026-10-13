import type { Chapter, StoryAction, StoryNode } from '../types';

const firstEvidence = ['q07-times', 'q07-load', 'q07-seven-meals'] as const;
const allEvidence = [...firstEvidence, 'q07-receipt', 'q07-last-call'] as const;
const act = (label: string, next: string, extra: Partial<StoryAction> = {}): StoryAction => ({
  id: next, label, next, ...extra
});
const node = (
  kind: StoryNode['kind'], text: string, progress: number,
  actions: readonly StoryAction[], extra: Partial<StoryNode> = {}
): StoryNode => ({
  kind, location: '梧城 · 清河里七号院', time: '第九夜 · 00:12', text,
  visual: 'alley', progress, actions,
  scene: { background: '/art/stairwell.webp' }, ...extra
});

export const seventhNight: Chapter = {
  id: 'seventh-night',
  order: 1,
  title: '头七',
  subtitle: '第一章 · 比昨天早一分钟',
  synopsis: "头七过后，保温器已经停用，旧通知却每天提前一分钟。院门口的空椅子等着司机，七年前的接送单还少一个返程人。",
  entryNode: 'dispatch',
  requiredEvidence: allEvidence,
  clue: {
    code: 'Q07', title: '清河里等待点',
    detail: "清河里Q07是2019年的接送等候点。沈衡当年平安返程，许守成未返；今年沈衡去世后，旧席位重新报出等待超时，通知暂时转向R02。",
    x: 32, y: 25
  },
  evidence: {
    'q07-times': {
      title: '七次 00:47，两次提前',
      detail: "前七夜保护确在00:47动作；第八夜00:46只有通知，第九夜预计00:45。两套时标分别核验，时钟误差无法单独解释提前；新系统无相应有效故障工单。"
    },
    'q07-load': {
      title: '老化保温器与两种事件',
      detail: '业主电工确认的定时保温器绝缘缺陷与院内共用保护配置解释前七夜实际停电；保温器撤下、故障支路隔离后，旧系统仍出现提前的事件。实物故障与历史告警必须分别处理。'
    },
    'q07-seven-meals': {
      title: "头七夜收起的饭碗",
      detail: "沈家七夜留饭，头七后收碗，次夜开始收到提前的通知。碗底有沈衡写的“等”字，门槛灰中曾出现朝屋内的浅印；时间先后与家属说法分别保存，尚未证明因果。"
    },
    'q07-receipt': {
      title: 'Q07 未签收接送单',
      detail: '七年前旧城事故期间，司机沈衡在清河里等配电工许守成一同撤离。接送单只有“等抢修员”，没有返程签收；后来的汇总把这行当作重复请求删除。'
    },
    'q07-last-call': {
      title: "00:47的夜班留言",
      detail: "2019年10月11日00:47，沈衡在旧城接送时给女儿留言，说尚有一名抢修员未返。背景男声问“车还等吗”，随后有三声碰栏杆的轻响；沈棠同意提供这一段，原始文件保留。"
    }
  },
  nodes: {
    dispatch: node('dialogue', "林岚把一张反复退回的工单夹到最前面：“清河里七号院，报了九夜。前七夜零点四十七，昨晚早一分钟，今晚预计还早。”\n季宁刚拿到终端，就问预计是谁写的。\n“我没写。”\n我看了看老周的名字，仍在出车单上。那栏备注只有一句：不要再只复位。", 3, [act('查看重复报修记录', 'handover')], { location: "梧城电网 · 城区抢修班", time: '23:38', speaker: '林岚', portrait: 'lin', visual: 'dispatch', excludesEvidence: allEvidence,
        scene: { background: '/art/dispatch.webp', document: { title: '重复故障 Q07', lines: ['范围：清河里七号院 · 6 户', '既往：7 次同刻跳闸 / 1 次提前', '本次要求：不要再只复位'] } }, presence: "scene" }),
    handover: node('dialogue', "前两班白天去过，没等到夜里的定时负荷。季宁沿报修时间画了几条线，给记录器和相机对时。\n“住户说停电，系统也说停电，就这么往下抄了九次？”\n“今晚自己看。”我说。\n她划出三栏：灯、保护器、通知。写到通知时，终端的预计时间闪了一下，又回到00:45。", 5, [act('带齐记录设备并联系报修人', 'depart')], { location: '城北抢修驻点 · 车库', time: '23:44', speaker: "季宁", portrait: "ji", visual: 'dispatch', excludesEvidence: allEvidence,
        scene: { background: '/art/dispatch.webp' }, expression: "neutral" }),
    depart: node('dialogue', "在路边停稳车，沈棠的电话打进来。\n“今天不跳的话，你们还查吗？”\n“查。先看我们这边的进线，屋里联系电工。”\n她说人已经到了，接着问几点能来。我报了大概时间，季宁记下。\n重新开动车时，路牌上的“清”字被一片树枝挡住，后半条路没几辆车。", 7, [act('到清河里七号院', 'lane')], { location: '抢修车 · 清河路', time: '23:58', speaker: "程砚（你）", portrait: "cheng", excludesEvidence: allEvidence, scene: {
            background: "/art/repair-van.webp"
        } }),
    lane: node('dialogue',
      "院里六户的窗都亮着。雨棚下有张空椅子，没靠墙，椅背挂着公交司机制服，两个袖口朝外翻。\n沈棠先把衣服收了，才带我们看表箱。\n“亲戚说头七让他认门，就这么摆。都过了两天了。”\n她看了一眼空椅子。邻居也看着，没人去坐。", 9,
      [act('询问今晚的用电安排', 'welcome')],
      { time: '00:04', scene: { background: '/art/alley.webp' } }),
    welcome: node('dialogue', "沈衡退休前开公交，九天前因病去世。沈棠说前七晚留饭，到了00:47院里就灭灯。第八晚收了碗，通知早一分钟，灯却没灭。\n老周问起2019年的接送，她点头：“那年我爸回家了，后来还开了好多年车。”\n她说完，又看向门口：“这回没回来的是谁？”", 11, [act('先建立安全边界', 'boundary')], { speaker: '沈棠', portrait: 'shen', time: '00:07' }),
    boundary: node('dialogue', "产权方请的电工已经在厨房等着，院内共用保护和器具交给他，我们查电网侧进线。老周核好许可与监护，季宁把两边联系人记在同一页。\n有缺陷的器具停用，正常支路按核验结果恢复。\n屋里老人提着充电灯出来，问能不能先看电视。我说能，他立即回去了。", 13, [act('开始核对三组现场线索', 'firstHub')], { speaker: '你', time: '00:10' }),
    firstHub: node('investigation',
      "表箱里只有几次复位留下的粉笔日期。沈棠拿着报修本，厨房桌上的白碗扣着布，门槛内还有一层没扫完的细灰。\n我让季宁先查时刻和实际负荷，留饭的事另外问。\n六户都把门留着，几台电视声音叠在一起，表箱前反倒听不清哪家在说话。", 18,
      [
        act('对照报修本与本地事件表', 'logbook', { hidesWhenCollected: 'q07-times' }),
        act('检查保护记录与厨房负荷', 'breaker', { hidesWhenCollected: 'q07-load' }),
        act('询问七夜留饭的习惯', 'offering', { hidesWhenCollected: 'q07-seven-meals' }),
        act('把三组证据放在同一条时间线上', 'compare', { requiresEvidence: firstEvidence })
      ],
      { objective: { title: '分开时间、设备与习惯', detail: '调查三处热点，记录客观事件与沈棠的守夜安排。' },
        scene: { background: '/art/stairwell.webp', hotspots: [
          { id: 'log', actionId: 'logbook', label: '报修本', x: 34, y: 30 },
          { id: 'load', actionId: 'breaker', label: '保护记录', x: 56, y: 43 },
          { id: 'meal', actionId: 'offering', label: '头七饭碗', x: 77, y: 32 }
        ] } }),
    logbook: node('dialogue',
      "前七页用蓝笔记00:47，后两页是黑笔，写00:46和预计00:45。蓝笔是父亲记车班用的，昨晚没墨了。\n我问写的是灯灭还是通知到，沈棠拿笔分成两列。\n写到第八夜，她停住：“灯一直亮着。”\n季宁翻回原页。原来那个“停”字，连着抄了九遍。", 18,
      [act('与独立事件记录逐项校对', 'logAudit')],
      { speaker: '沈棠', portrait: 'shen', excludesEvidence: ['q07-times'], time: '00:13' }),
    logAudit: node('dialogue', "前七夜的本地保护记录能与六户口述对上，第八夜没有动作。季宁请林岚核对校时、发送和接收时标，又查历史队列。\n新系统找不到对应的有效故障工单。\n“它只是按时通知你。”季宁说。\n沈棠问通知什么。季宁把截图转过来，故障类型的位置空着，只有旧户号。", 18, [act('整理时间差异', 'recordTime')], { speaker: "季宁", portrait: "ji", excludesEvidence: ['q07-times'], time: '00:15',
        scene: { background: '/art/stairwell.webp', document: { title: '本地动作 / 旧户号通知', lines: ['第 1—7 夜：00:47 / 00:47', '第 8 夜：无动作 / 00:46', '第 9 夜：等待监测 / 预计 00:45'] } }, expression: "concerned" }),
    recordTime: node('evidence',
      "我把第八夜记成旧户号告警，原来的报修说法留作附件。\n沈棠盯着两列时间：“所以昨晚没人把灯关掉。”\n“能确定昨晚灯没灭。”\n她把黑笔盖上。门口风吹过，空椅子的腿碰到地砖，声音很轻。她抬头看了一眼，笔盖没扣住，滚进了桌底。", 18,
      [act('记录：七次同刻，两次提前', 'firstHub', { id: 'record-times', collect: 'q07-times' })],
      { excludesEvidence: ['q07-times'], time: '00:16' }),
    breaker: node('dialogue', "厨房那只保温器用了很多年，外壳黄得厉害。沈衡上夜班时拿它暖饭，凌晨定时加热。\n我们记下住户说法，器具交业主电工检查，院内保护也由他核。\n季宁看着定时旋钮：“前七夜都用了？”\n“用了。昨天拔了。”沈棠说，“我还把插头收进抽屉，怕母亲再插。”", 18, [act('安排受控检查并停用旧设备', 'testPlan')], { speaker: '老周', portrait: 'zhou', expression: 'focused', excludesEvidence: ['q07-load'], time: '00:18' }),
    testPlan: node('dialogue', "业主电工检查器具和院内保护，先将缺陷支路隔离。我们核对进线与记录器，季宁登记结果来源。\n沈棠揭开碗上的布，是一碗白饭，边缘已经干了。\n电工把保温器贴好标签，她立刻问：“这个留不住饭了？”\n“先别用了。”\n她把布重新盖回去，没再问修多久。", 18, [act('接收检修与历史负荷结果', 'testResult')], { speaker: '你', excludesEvidence: ['q07-load'], time: '00:21' }),
    testResult: node('dialogue', "检修记录确认器具绝缘缺陷，定时加热触发院内保护；配置老旧，连带六户停电。产权方安排整改，前七夜的事能对上。\n第八夜器具拔下，保护也没动作。\n季宁在两种事件之间画了一条横线：“坏了一个东西，不用它也会来的消息，得另找。”\n她把00:46留在线下面。", 18, [act('记录设备结论与剩余矛盾', 'recordCurve')], { excludesEvidence: ['q07-load'], time: '00:23' }),
    recordCurve: node('evidence',
      "老周收好器具移交标签，厨房电工继续核对整改。\n林岚发来新截图，地址为空的旧户号把预计时刻改成00:45。季宁照着截图记录，又去看本地表。\n本地表什么也没动。\n老周把电台声音调小。我问怎么了，他说这里晚上不需要听这么响。", 18,
      [act('记录：实际负荷与历史告警是两种事件', 'firstHub', { id: 'record-load', collect: 'q07-load' })],
      { speaker: '老周', portrait: 'zhou', expression: 'focused', excludesEvidence: ['q07-load'], time: '00:24' }),
    offering: node('dialogue',
      "饭碗缺了一个小口，旁边是竹筷和公交钥匙。沈棠说父亲夜班回家，总给没赶上饭点的人留一份。\n父亲去世后，她按家里的讲究留满七夜，又在门槛里撒了细灰。\n“说看见印子就知道他认过门。”\n“看见了吗？”季宁问。\n她看向门槛：“你们自己看吧。”", 18,
      [act('问清第七夜发生了什么变化', 'sevenMeals')],
      { speaker: '沈棠', portrait: 'shen', excludesEvidence: ['q07-seven-meals'], time: '00:26' }),
    sevenMeals: node('dialogue',
      "头七过后亲戚让收碗，沈棠在碗底摸到铅笔写的“等”字。门槛灰里有两道浅印，朝屋内，隔得很近。\n亲戚说不是父亲的鞋，她没再问，拍照后扫掉大半。\n次夜通知提前，她又盛了饭。\n“我爸每次数人都说差一个。”\n季宁看着照片，没有问她今天还差谁。", 18,
      [act('保存习惯与时间变化的口述', 'recordWake')],
      { speaker: '沈棠', portrait: 'shen', excludesEvidence: ['q07-seven-meals'], time: '00:28' }),
    recordWake: node('evidence',
      "季宁记下收碗和通知提前的顺序，把门槛照片也附上。她问灰是谁撒的、有没有人夜里经过，沈棠逐项答了。\n“这样能查？”\n“先把发生过的留齐。”\n沈棠拉开椅子，翻出制服口袋里的旧单。\n“那这张也看看。我爸一直说不能扔，不是今年的。”", 18,
      [act("记录：头七夜收起的饭碗", 'firstHub', { id: 'record-meals', collect: 'q07-seven-meals' })],
      { excludesEvidence: ['q07-seven-meals'], time: '00:29' }),
    compare: node('dialogue', "三组记录摆到一起：七次真跳闸，一次只有通知，留饭与收碗的时间。设备能解释前七夜，后面的提醒找不到发送人。\n季宁给今晚留了一行。\n“灯不灭，也得记，对吧？”\n我点头。\n她把笔放下：“要是通知准时来，灯也不灭，那它喊的就不是停电。”", 39, [act('建立可验证的下一步判断', 'timelinePuzzle')], { requiresEvidence: firstEvidence, time: '00:31', speaker: "程砚（你）", portrait: "cheng", expression: "focused" }),
    timelinePuzzle: node('puzzle',
      "旧保温器已经停用，两套记录也没有相应的改时痕迹。今晚预计00:45，我们能在院里同时看灯、保护器和通知。\n林岚等着回报，老周问要不要撤掉监测。\n我看了一眼厨房。缺口饭碗盖着布，插头还在抽屉里，两个东西都没动。", 43,
      [
        act('全部归为定时器故障，撤掉监测后销单', 'timerTheory'),
        act('分开两类事件，保持隔离并独立观察旧户号', 'interval')
      ],
      { requiresEvidence: firstEvidence, puzzle: { prompt: "第八夜没有跳闸，哪项判断还需要留在现场验证？", hint: "比较灯灭、保护动作和通知到达的时刻。停用器具已经解释前七夜，没解释提前的消息。" }, time: '00:32' }),
    timerTheory: node('dialogue',
      "我把全部报修归到保温器，撤掉现场记录器，准备销单。\n车刚开出去，林岚报来00:45的旧告警：“等待人员未到。”\n季宁回头看院口，已经看不见那六扇窗。\n“今晚灯灭没灭？”她问。\n没人能答。终端的告警还在，时间开始改向明天。", 43,
      [act('查看这个判断留下的结果', 'timerFailure')],
      { requiresEvidence: firstEvidence, location: '抢修车 · 清河路', time: '00:46' }),
    timerFailure: node('ending',
      "天亮后，同一张工单又退回来了。原因栏被我们写成定时器故障，新附件却是一个早已停用的调度席位。\n沈棠没再拿饭碗出来，她问下一班还来不来。\n季宁把昨晚00:45那一格划空，旁边写“未观察”。消息上的字变了：最后一班。\n\n【误结工单】", 43,
      [act('重新比较两种事件', 'timelinePuzzle')],
      { outcome: 'failure', requiresEvidence: firstEvidence, location: '城北抢修驻点 · 退回工单', time: '次日 · 08:06', visual: 'blackout' }),
    interval: node('dialogue',
      "器具停用，正常供电留着，我们在院里等预计时刻。沈棠搬凳子坐到门边，老周将电台放在桌上。\n一户已经打起呼噜，另一户的电视静音播天气。\n季宁压低声音：“反正我也睡不着，算陪监测了。”\n我看她一眼，她把嘴闭上，继续盯记录器。", 47,
      [act('接入独立记录并等待预计时刻', 'recorder')],
      { requiresEvidence: firstEvidence, time: '00:35' }),
    recorder: node('dialogue', "季宁确认三处状态：进线正常，缺陷支路隔离，器具已经交给电工。她对完记录器，沈棠将旧接送单铺到闭合的工具箱上。\n纸背有Q07，日期2019年10月11日。\n我问她为什么现在拿出来。\n“刚才听见你们叫这个编号。我爸以前也叫过。”", 49, [act('等到 00:45', 'waiting')], { requiresEvidence: firstEvidence, time: '00:41', speaker: "季宁", portrait: "ji", expression: "neutral" }),
    waiting: node('dialogue', "00:45。灯没灭，保护器没动，本地记录器没有新事件。\n先响的是沈棠手机，再是林岚终端。\nQ07，等待超时。\n季宁把接收时标念完，发送端显示早已停用的旧席位。\n“那地方还有机器吗？”\n林岚说要查。门槛剩下的灰忽然凹了一点，没人从那里走过。", 52, [act('确认现场与通知的差异', 'earlyTrip')], { requiresEvidence: firstEvidence, time: '00:45', scene: { background: '/art/stairwell.webp', inscription: 'Q07 · 等待超时' }, speaker: "季宁", portrait: "ji", expression: "concerned" }),
    earlyTrip: node('dialogue',
      "我报现场无新故障，保留旧队列事件。沈棠盯着手机，问是不是别人也能看到“最后一班，少一人”。\n我们的屏幕都没有这行。\n她把公交钥匙放到桌上：“我爸不是这么说的。他先数人，再说能不能走。”\n季宁拍下她的屏幕，照片里只有等待超时。", 55,
      [act('查看父亲留下的记录', 'secondHub')],
      { requiresEvidence: firstEvidence, speaker: '沈棠', portrait: 'shen', time: '00:46' }),
    secondHub: node('investigation',
      "灯还亮着，接送单和七年前的语音放在桌上。纸能查等的是谁，语音也许能说明当夜发生过什么。\n老周联系档案值守，沈棠给手机充上电。\n季宁把门槛灰的照片另存，没去补那两道印子。屋里那把空椅子已经推回桌边，椅背朝着我们。", 58,
      [
        act('核验制服口袋的接送单', 'receipt', { hidesWhenCollected: 'q07-receipt' }),
        act("听完七年前的夜班留言", 'conversation', { hidesWhenCollected: 'q07-last-call' }),
        act('将技术结论与未签收记录核对', 'reconcile', { requiresEvidence: allEvidence })
      ],
      { requiresEvidence: firstEvidence, objective: { title: '找到等待的对象', detail: '分别核验接送单与家庭留言，避免以家属记忆替代事故档案。' }, time: '00:49',
        scene: { background: '/art/stairwell.webp', hotspots: [
          { id: 'receipt', actionId: 'receipt', label: '旧接送单', x: 34, y: 30 },
          { id: 'message', actionId: 'conversation', label: '夜班留言', x: 77, y: 32 }
        ] } }),
    receipt: node('dialogue',
      "单子写旧城临时接送，司机沈衡，等待点清河里Q07。第七格擦过几次，乘车人只剩“等抢修员”。返程人数没填。\n“我爸当年回了家。”沈棠说，“这格怎么空着？”\n我翻到背面，铅笔在空格边上点过三个点，最后一个穿了纸。", 58,
      [act('请求核对原始事故接送附件', 'archiveRequest')],
      { requiresEvidence: firstEvidence, excludesEvidence: ['q07-receipt'], time: '00:51',
        scene: { background: '/art/stairwell.webp', document: { title: '旧城临时接送 · 原件', lines: ['司机：沈衡', '等待点：清河里 / Q07', '返程人数：——', '备注：等抢修员'] } } }),
    archiveRequest: node('dialogue', "林岚请档案人员按授权调出接送附件。老周认出那处旧席位，说许守成送出住户后又回去查进水的旧线，没有上返程车。\n“电话里叫的是他？”\n“我听到的，叫守成。”\n季宁将老周的原话另记一栏，又请林岚报原件页码。电台里纸张翻动的声音很清楚。", 58, [act('比对原件与汇总表', 'archiveReply')], { requiresEvidence: firstEvidence, excludesEvidence: ['q07-receipt'], speaker: '老周', portrait: 'zhou', expression: 'focused', time: '00:55' }),
    archiveReply: node('dialogue', "附件日期是2019年10月11日，临时照明用独立电源，许守成00:47留下最后联络，救人后返回检查旧线时遇难。\n返程表记了获救居民，没交代他，七日复核页也不齐。沈衡当年要求补签，回函只有“车辆任务已结束”。\n季宁翻到末页：“结束的只是车。”", 58, [act('保留未签收接送单的档案对应', 'recordReceipt')], { requiresEvidence: firstEvidence, excludesEvidence: ['q07-receipt'], speaker: "2019 年档案", portrait: "xu", time: '00:58', presence: "archive" }),
    recordReceipt: node('evidence', "季宁将原件索引和照片附上，圈住空着的返程格。\n“沈师傅回家，许师傅没上车。这两行分开。”\n沈棠用指腹擦了擦格边：“我爸说，起点点一遍，终点再点一遍。这次没点齐。”\n老周确认提交复核。我收起照片，原件上那三个铅笔点仍留着。", 58, [act('记录：Q07 未签收接送单', 'secondHub', { id: 'record-receipt', collect: 'q07-receipt' })], { requiresEvidence: firstEvidence, excludesEvidence: ['q07-receipt'], time: '01:02', speaker: "季宁", portrait: "ji", expression: "neutral" }),
    conversation: node('dialogue',
      "语音收藏了七年，时间戳2019年10月11日00:47。沈棠说自己听过前六秒：父亲问吃饭没有，后面全是雨声，她以为又要催她回家。\n今年整理遗物时，列表忽然多了个未听完的标记。\n“以前没有。”\n我让她自己决定是否播放。她把音量开到一半。", 58,
      [act("听2019年的夜班留言", 'fatherMessage')],
      { requiresEvidence: firstEvidence, excludesEvidence: ['q07-last-call'], speaker: '沈棠', portrait: 'shen', time: '01:04' }),
    fatherMessage: node('dialogue',
      "雨声里，沈衡说：“接出来的都吃过了。还有一个在里面干活，别收，给他留着。”\n随后一个很轻的男声问：“车还等吗？”\n“等。”\n三声短响，像钥匙碰过铁栏杆，录音就断了。\n沈棠按回去，重新听那三声。季宁坐到我旁边，手里的笔已经停下。", 58,
      [act('听沈棠把另一半话说出来', 'daughterReply')],
      { requiresEvidence: firstEvidence, excludesEvidence: ['q07-last-call'], time: '01:06' }),
    daughterReply: node('dialogue',
      "“他说的原来不是我。”沈棠盯着进度条，“我那时候嫌他天天加班，又催我吃饭。”\n她把后半段另存，问能不能拿来对接送单。\n“可以，你同意提供哪一段，就留哪一段。”\n她点头，把文件名改成父亲的名字和日期，没动前六秒。", 58,
      [act('经本人确认记录留言含义', 'recordStatement')],
      { requiresEvidence: firstEvidence, excludesEvidence: ['q07-last-call'], speaker: '沈棠', portrait: 'shen', time: '01:08' }),
    recordStatement: node('evidence',
      "沈棠同意把接送相关片段留下，原文件自己保管。季宁记录取得方式，重放了一次后三声。\n我看着工具箱上的旧单，等人那栏仍是空的。\n厨房里有人把碗挪开，桌面发出很短的擦响。录音已经停了，沈棠却又低头看了一眼播放键。", 58,
      [act("记录：00:47的夜班留言", 'secondHub', { id: 'record-statement', collect: 'q07-last-call' })],
      { requiresEvidence: firstEvidence, excludesEvidence: ['q07-last-call'], time: '01:10' }),
    reconcile: node('dialogue', "前七夜的停电找到了器具和保护缺陷，后两夜的通知来自旧席位。2019年缺一个返程人，今年守丧又碰上了那张单。\n季宁用铅笔连了一条虚线。\n“收碗后开始催，但收碗是不是原因，还不知道。”\n我看着每天少掉的一分钟：“它像在等发车，等得越来越不耐烦。”", 76, [act('决定怎样关闭这次工单', 'closingPuzzle')], { requiresEvidence: allEvidence, time: '01:14' }),
    closingPuzzle: node('puzzle',
      "林岚问Q07怎么报，电工那边已交来整改结果。老周看了一眼接送单，让我们把缺的附件留着。\n沈棠问旧支路要不要恢复原样，好等下一夜。\n我看向插头和饭碗。前者有检修结果，后者摆了七夜，接送单却从来没有完整签收过。该处理的东西得分开。", 80,
      [
        act('为维持守夜习惯，要求重新投入未查明的原支路', 'override', { tone: 'danger' }),
        act('按批准方案恢复安全供电，另立档案复核并保留 Q07', 'approvedPlan')
      ],
      { requiresEvidence: allEvidence, puzzle: { prompt: "正常供电已能核验，Q07的旧等待该怎样继续查？", hint: "通知来自旧席位，返程单仍缺一行。恢复未知支路不能补出这一行记录。" }, time: '01:16' }),
    override: node('dialogue',
      "我把恢复原支路、再等一夜写进建议。老周退回，现场没有执行。\n沈棠把刚盖好的碗重新打开，问这样是不是就能等到人。\n还没到下一分钟，电台响了。\nQ07，等待人员未到。\n季宁看着接收时间：“它这次没按刚才的预计走。”厨房门外有人轻轻拉了一下椅子。", 80,
      [act('查看这个决定的后果', 'overrideFailure')],
      { requiresEvidence: allEvidence, speaker: '老周', portrait: 'zhou', expression: 'focused', time: '01:18' }),
    overrideFailure: node('ending',
      "方案被退回，正常供电核验另交接续班组。沈棠仍坐在碗边，旧单没有多一个返程签名。\n消息反复催同一句，间隔从一分钟变成几秒。\n我想撤掉建议，终端却要求填写等候人数。原来空着的格子里多了三个铅笔点，和我们今晚到场的人数一样。\n\n【责任错接】", 80,
      [act('重新区分两份任务', 'closingPuzzle')],
      { outcome: 'failure', requiresEvidence: allEvidence, visual: 'blackout', time: '01:24' }),
    approvedPlan: node('dialogue', "产权方完成器具和院内保护整改，正常供电按核验结果恢复。Q07与未签收接送单另交档案复核。\n季宁写今天的完成时刻，把旧单原有空格留着。林岚报接收编号，她读回一遍。\n我们刚核完，催人的提醒换了个状态：转交中。发送端还是那个旧席位。", 85, [act("等待六户的回访结果", 'familyChoice')], { requiresEvidence: allEvidence, speaker: '你', time: '01:32' }),
    familyChoice: node('dialogue',
      "沈棠用确认可用的设备给母亲热饭，自己也盛了一碗。桌上原来那份还盖着布。\n“我再问问当年开车的人。”她说，“看谁还记得。”\n母亲应了一声，夹走碗里的咸菜。\n季宁闻着饭味看了我一眼。我让她先做完回访，她叹气，把终端拿回来。", 89,
      [act("核对供电回访和厨房时钟", 'clockOff')],
      { requiresEvidence: allEvidence, speaker: '沈棠', portrait: 'shen', time: '01:41' }),
    clockOff: node('dialogue', "季宁回访六户，没有新保护动作。沈棠将厨房快了一分钟的钟拨正，秒针照常走。\n“这个以前就快，跟我爸走的时候一样。”她说。\n季宁将钟差也记下，随后对本地记录器。\n两边对齐了，旧通知的发送时刻却仍旧早一分钟。她把那一栏留在核查里。", 92, [act('查看工单关闭前的最后一条事件', 'zeroMinute')], { requiresEvidence: allEvidence, speaker: "季宁", portrait: "ji", time: '01:49', expression: "neutral" }),
    zeroMinute: node('dialogue', "Q07停止提前，状态换成“转交：未完接送”。\n林岚发来附件预览。返程格像被水洇开，浮着半个“回”字，内框缺一笔。\n我让沈棠拿原件对。原件还是空白。\n季宁盯了几秒：“槐荫巷那个字也是这样。”\n她没有补笔，将预览和纸分别拍下。", 94, [act('保留附件并填写实际结论', 'recordClosure')], { requiresEvidence: allEvidence, speaker: '林岚', portrait: 'lin', time: '01:53', scene: { background: '/art/stairwell.webp', inscription: 'Q07 · 转交：未完接送' }, presence: "radio" }),
    recordClosure: node('dialogue',
      "我写明设备缺陷和处置，旧队列与纸张变化另存。沈棠签用户确认栏，签完看见我们还在核接送单。\n“许家有这张吗？”\n林岚说要核收件记录，老周也同意提交原件。\n沈棠把制服叠好。最里层口袋翻出来，有一点细灰，她没拍，先叫我来看。", 96,
      [act('离开七号院', 'linger')],
      { requiresEvidence: allEvidence, time: '02:03' }),
    linger: node('dialogue', "车停在清河路口，季宁读完两项交接，林岚又发来拆迁区工单。\n“饭点是不是也能提前一分钟？”季宁问。\n我递给她一包饼干：“这个现在就能。”\n她撕到一半，电台又响一声。两人都看过去。\n只是接续班报到。她把饼干分给我，袋子还在轻轻响。", 98, [act('归档第一章', 'end')], { requiresEvidence: allEvidence, location: '抢修车 · 清河路口', time: '02:11', scene: {
            background: "/art/repair-van.webp"
        }, speaker: "季宁", portrait: "ji", expression: "neutral" }),
    end: node('ending',
      "清河里的灯正常亮着，保温器停用，Q07暂时不再催。接送单留下了一个名字：许守成，未返程。\n我们离开后，沈棠发来两张照片。\n第一张是空椅子，已经收进屋。第二张是门槛，扫过的灰里又多了两道浅印。\n印子朝里。\n她问今晚是不是有人折回去取东西。我们三个人都没有。", 100,
      [act('重新调查《头七》', 'dispatch', { id: 'restart', resetEvidence: true })],
      { outcome: 'complete', requiresEvidence: allEvidence, location: '调查归档 · Q07', time: '第一章 · 已完成', visual: 'ending',
        scene: { background: '/art/dispatch.webp', inscription: "Q07 · 许守成：未返程" } })
  }
};
