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
  synopsis: '连续七夜的定时跳闸，在守丧结束后开始逐夜提前。你要分清老化的定时器、被省略的抢修记录，以及一通没有等到回复的电话。',
  entryNode: 'dispatch',
  requiredEvidence: allEvidence,
  clue: {
    code: 'Q07', title: '清河里等待点',
    detail: '许守成最后一次 00:47 通话关联的第七等待点。接送未签收，事故后的七日复核也缺失；正常工单关闭后，旧调度队列仍留着请求。',
    x: 32, y: 25
  },
  evidence: {
    'q07-times': {
      title: '七次 00:47，两次提前',
      detail: '首七夜本地跳闸记录均为 00:47；第八夜为 00:46，第九夜预告为 00:45。时间来自两套独立记录，不能只用手机时钟误差解释。'
    },
    'q07-load': {
      title: '老化保温器与两种事件',
      detail: '业主电工确认的定时保温器绝缘缺陷与院内共用保护配置解释前七夜实际停电；保温器撤下、故障支路隔离后，旧系统仍出现提前的事件。实物故障与历史告警必须分别处理。'
    },
    'q07-seven-meals': {
      title: '父亲留给夜班的第七碗饭',
      detail: '沈棠按父亲习惯，在凌晨给“夜里还在干活的人”留饭。第七夜收去空碗后，异常时间开始提前。饭碗对应一次未能完成的等待，并非送电条件。'
    },
    'q07-receipt': {
      title: 'Q07 未签收接送单',
      detail: '七年前旧城事故期间，司机沈衡在清河里等配电工许守成一同撤离。接送单只有“等抢修员”，没有返程签收；后来的汇总把这行当作重复请求删除。'
    },
    'q07-last-call': {
      title: '00:47 的最后留言',
      detail: '沈衡留给女儿的话是“把夜里回来的人也算进去”，不是催她赶回家。沈棠保存着留言，却七年没听完；父亲也始终没有说明自己在等谁。'
    }
  },
  nodes: {
    dispatch: node('dialogue', "林岚把反复退回的工单交到城区抢修班。清河里七号院报了九夜，前七夜都在 00:47，第八夜提前一分钟。季宁接过终端：“这次把灯灭、保护动作和收到通知分开记。”我给她看出车单，老周按值班安排继续负责现场组织。", 3, [act('查看重复报修记录', 'handover')], { location: "梧城电网 · 城区抢修班", time: '23:38', speaker: '林岚', portrait: 'lin', visual: 'dispatch', excludesEvidence: allEvidence,
        scene: { background: '/art/dispatch.webp', document: { title: '重复故障 Q07', lines: ['范围：清河里七号院 · 6 户', '既往：7 次同刻跳闸 / 1 次提前', '本次要求：不要再只复位'] } }, presence: "scene" }),
    handover: node('dialogue', "季宁把前两班的白天检查列到时间线上，提醒我夜里定时负荷还没被直接核对。老周翻到天气栏：“相同时刻可能有不同原因。”她给事件记录器和相机对时，在空白处画了三栏：实物动作、终端报文、人的说法。", 5, [act('带齐记录设备并联系报修人', 'depart')], { location: '城北抢修驻点 · 车库', time: '23:44', speaker: "季宁", portrait: "ji", visual: 'dispatch', excludesEvidence: allEvidence,
        scene: { background: '/art/dispatch.webp' }, expression: "neutral" }),
    depart: node('dialogue', "停车接听时，沈棠问：“今天如果没有跳闸，还能知道通知是谁发的吗？”我说明会先核对电网侧供电，屋内故障联系产权方的合格人员。季宁记好联系人和回访时间，等车重新开动才收起平板。挡风玻璃外，旧路牌只剩半个“清”字。", 7, [act('到清河里七号院', 'lane')], { location: '抢修车 · 清河路', time: '23:58', speaker: "程砚（你）", portrait: "cheng", excludesEvidence: allEvidence, scene: {
            background: "/art/repair-van.webp"
        } }),
    lane: node('dialogue',
      '院里六户的窗都亮着，雨棚下却摆了一张不靠墙的空椅子。椅背挂着干净的公交司机制服，袖口向外翻。沈棠先把衣服收进屋，才让你看表箱：“父亲走了九天。邻居不愿再等到那个点，所以今天都没睡。”', 9,
      [act('询问今晚的用电安排', 'welcome')],
      { time: '00:04', scene: { background: '/art/alley.webp' } }),
    welcome: node('dialogue', "沈棠的父亲沈衡是退休公交司机，九天前去世，家里刚过头七。他曾在2019年接送获救住户，自己平安回家，又生活了七年。前七晚留饭时确有跳闸；第八晚收碗后收到更早的通知。她怕没做好告别，我先记清两个年份，没有把父亲与旧事故的死者混在一起。", 11, [act('先建立安全边界', 'boundary')], { speaker: '沈棠', portrait: 'shen', time: '00:07' }),
    boundary: node('dialogue', "我们与产权方核对界面：电网侧进线由抢修班排查，院内共用保护和厨房设备由业主安排合格电工检查。老周落实本队许可与监护，季宁负责记录和住户联络。老人用独立充电灯照明，正常支路获准恢复；有缺陷的器具先停用，调查无需让全院继续停电。", 13, [act('开始核对三组现场线索', 'firstHub')], { speaker: '你', time: '00:10' }),
    firstHub: node('investigation',
      '表箱门打开后，里面没有黑色手印，只有历次复位的粉笔日期。沈棠拿着笔记本站在门槛内，厨房桌上那只白碗扣着布。你需要把时刻、实际负荷与守夜安排分别记录，免得一个听起来完整的故事，把三个不同事实包起来。', 18,
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
          { id: 'meal', actionId: 'offering', label: '第七碗饭', x: 77, y: 32 }
        ] } }),
    logbook: node('dialogue',
      '本子里每一天都用蓝笔写着 00:47，最后两页换成了黑笔：00:46、预计 00:45。沈棠说蓝笔是父亲以前记车班用的，墨水昨晚用尽了。你问她记录的是灯灭还是手机收到通知；她把二者分成两列，才发现第八夜只有通知，灯没有灭。', 18,
      [act('与独立事件记录逐项校对', 'logAudit')],
      { speaker: '沈棠', portrait: 'shen', excludesEvidence: ['q07-times'], time: '00:13' }),
    logAudit: node('dialogue', "季宁把前七夜本地保护记录和六户口述对上；第八夜只有手机通知，没有灯灭和保护动作。她请林岚核对时区、校时记录、报文接收时间和历史队列，新系统没有有效故障工单对应。“写同一个时间的事，原来不一定是同一个事。”她将原截图另存，保留原始说法。", 18, [act('整理时间差异', 'recordTime')], { speaker: "季宁", portrait: "ji", excludesEvidence: ['q07-times'], time: '00:15',
        scene: { background: '/art/stairwell.webp', document: { title: '本地动作 / 旧户号通知', lines: ['第 1—7 夜：00:47 / 00:47', '第 8 夜：无动作 / 00:46', '第 9 夜：等待监测 / 预计 00:45'] } }, expression: "concerned" }),
    recordTime: node('evidence',
      '你把第八夜的“停电”改为“旧户号告警”，保留原始说法作附件。沈棠看着那一行改动，声音低下来：“所以昨天不是他把灯弄灭的。”你说现在只能确认灯没灭；那个通知是谁发的，还需要找到来源。', 18,
      [act('记录：七次同刻，两次提前', 'firstHub', { id: 'record-times', collect: 'q07-times' })],
      { excludesEvidence: ['q07-times'], time: '00:16' }),
    breaker: node('dialogue', "厨房里有只用了多年的定时保温器，沈衡上夜班时靠它暖饭。我们记录外观和住户说法，不拆用户家电。业主请来的合格电工接收器具，另查院内保护配置；老周要求将实测结果形成移交记录，再与电网侧供电状态比对。", 18, [act('安排受控检查并停用旧设备', 'testPlan')], { speaker: '老周', portrait: 'zhou', expression: 'focused', excludesEvidence: ['q07-load'], time: '00:18' }),
    testPlan: node('dialogue', "业主电工在获准范围内检查故障器具和院内保护，隔离有缺陷的支路。我们核对进线、记录器和正常用户供电，季宁登记检查人员与结果来源。沈棠把碗上的布揭开，里面只有白饭。保温器的检修和饭碗的去留，各有自己的决定人。", 18, [act('接收检修与历史负荷结果', 'testResult')], { speaker: '你', excludesEvidence: ['q07-load'], time: '00:21' }),
    testResult: node('dialogue', "检修记录确认保温器绝缘缺陷，定时加热触发院内保护；共用保护配置老旧，扩大了停电范围。产权方安排整改，这能解释前七夜。第八夜器具已拔下，也没有真实跳闸，旧户号通知仍要查。季宁用横线将设备缺陷与历史告警分开，避免一起销单。", 18, [act('记录设备结论与剩余矛盾', 'recordCurve')], { excludesEvidence: ['q07-load'], time: '00:23' }),
    recordCurve: node('evidence',
      '老周收好故障设备的移交标签。“找到一个真毛病，不等于每件事都有答案。”充电灯把他的影子照在表箱门上，影子没有异常；异常的是林岚终端上那条地址为空的旧户号，它的预计故障时间刚刚自行改成了 00:45。', 18,
      [act('记录：实际负荷与历史告警是两种事件', 'firstHub', { id: 'record-load', collect: 'q07-load' })],
      { speaker: '老周', portrait: 'zhou', expression: 'focused', excludesEvidence: ['q07-load'], time: '00:24' }),
    offering: node('dialogue',
      '桌上不是成套的祭品，只有一只边缘磕掉的饭碗、一副竹筷和公交钥匙。沈棠说父亲不爱谈忌讳，却一定给夜班留饭。她七年没在这时回来过，父亲去世后才第一次接手；她母亲以为这饭是给她的，她也一直这么以为。', 18,
      [act('问清第七夜发生了什么变化', 'sevenMeals')],
      { speaker: '沈棠', portrait: 'shen', excludesEvidence: ['q07-seven-meals'], time: '00:26' }),
    sevenMeals: node('dialogue',
      '第七夜亲戚说可以收碗了。沈棠收的时候，在碗底摸到父亲用铅笔写的一个“等”字。她没告诉母亲，只把碗洗得更干净。昨天通知提前一分钟，她便把饭重新盛满。你问有没有人真正吃过，她想了很久：“父亲每天早上都说，差一个。”', 18,
      [act('保存习惯与时间变化的口述', 'recordWake')],
      { speaker: '沈棠', portrait: 'shen', excludesEvidence: ['q07-seven-meals'], time: '00:28' }),
    recordWake: node('evidence',
      '你在记录里写“留饭给未返人员”，并注明这是家属口述，不是故障判据。沈棠看见你没有写“迷信”，愿意再拿出父亲的东西。她说衣服口袋有张很旧的接送单，先前来检查的人忙着恢复供电，她没找到机会问。', 18,
      [act('记录：第七碗饭与未完成的等待', 'firstHub', { id: 'record-meals', collect: 'q07-seven-meals' })],
      { excludesEvidence: ['q07-seven-meals'], time: '00:29' }),
    compare: node('dialogue', "季宁把七次跳闸、一次通知和家属守夜排成时间线。设备缺陷有了检查记录，提前的历史通知还没有来源。我让她给每个判断写一个能被新观测推翻的条件。“如果今晚灯没灭，就不能再叫第九次跳闸。”她把这句留在页边。", 39, [act('建立可验证的下一步判断', 'timelinePuzzle')], { requiresEvidence: firstEvidence, time: '00:31', speaker: "程砚（你）", portrait: "cheng", expression: "focused" }),
    timelinePuzzle: node('puzzle',
      '若定时器每天固定运行，它不会在已停用后自行把时间改早。若有人每天动过时钟，独立记录也应留下改时痕迹。接下来能观察的不是“父亲何时回来”，而是故障支路保持隔离后，旧户号是否仍会按提前的时间报出事件。', 43,
      [
        act('全部归为定时器故障，撤掉监测后销单', 'timerTheory'),
        act('分开两类事件，保持隔离并独立观察旧户号', 'interval')
      ],
      { requiresEvidence: firstEvidence, puzzle: { prompt: '什么判断同时解释了前七夜，又允许验证第八夜的矛盾？', hint: '比较“实际跳闸”与“收到通知”；不要把同一时间当成同一种事件。' }, time: '00:32' }),
    timerTheory: node('dialogue',
      '你把九次报修都归到保温器名下。沈棠签了字，因为母亲终于能安心睡觉。回程时林岚却收到一条告警：旧户号在 00:45 标记“等待人员未到”。你已经撤掉现场记录器，无法再区分今晚的灯、保护器和那条消息。一个真故障替另一个问题盖了章。', 43,
      [act('查看这个判断留下的结果', 'timerFailure')],
      { requiresEvidence: firstEvidence, location: '抢修车 · 清河路', time: '00:46' }),
    timerFailure: node('ending',
      '【误结工单】设备故障得到处理，旧记录却仍沿用“定时跳闸”的名义。下一班接到的还是同一张退回工单。沈棠没再提饭碗，她怕解释得越多，你们越不会听见。缺失的那个人，又被一次合理结论藏了起来。', 43,
      [act('重新比较两种事件', 'timelinePuzzle')],
      { outcome: 'failure', requiresEvidence: firstEvidence, location: '城北抢修驻点 · 退回工单', time: '次日 · 08:06', visual: 'blackout' }),
    interval: node('dialogue',
      '你告诉沈棠，厨房设备故障已有处理方案，今晚不靠继续供电重现异常。她第一次离开那只碗，坐到门边。老周把对讲机音量调低，林岚保留旧户号的原始事件流。院里一户开始打呼噜，另一户的电视还在播没有声音的天气预报。', 47,
      [act('接入独立记录并等待预计时刻', 'recorder')],
      { requiresEvidence: firstEvidence, time: '00:35' }),
    recorder: node('dialogue', "季宁在指定位置核对三种记录：供电正常，故障器具已交业主电工，相关缺陷支路保持隔离。她不用身体或反复合闸重现异常。沈棠将2019年的接送单铺在闭合的工具箱上。纸背的 Q07 与记录器上的当前日期相隔整整七年，墨迹却像刚写过。", 49, [act('等到 00:45', 'waiting')], { requiresEvidence: firstEvidence, time: '00:41', speaker: "季宁", portrait: "ji", expression: "neutral" }),
    waiting: node('dialogue', "00:45，院灯保持亮着，保护器没动作，记录器也没有对应事件。先响的是沈棠手机，随后是林岚终端，两边都报“Q07，等待超时”。季宁核对接收时标，发送端却是早已停用的旧调度席位。她站在我身旁低声问：“是谁还在用这个位置？”", 52, [act('确认现场与通知的差异', 'earlyTrip')], { requiresEvidence: firstEvidence, time: '00:45', scene: { background: '/art/stairwell.webp', inscription: 'Q07 · 等待超时' }, speaker: "季宁", portrait: "ji", expression: "concerned" }),
    earlyTrip: node('dialogue',
      '你在终端上写：现场无新故障，异常为历史队列事件。消息下方多出一行只有沈棠看得到的字：“最后一班，少一人。”她没有往院门跑，反而把手里的钥匙递给你：“这不是我父亲的口气。他从来先数人，再发车。”', 55,
      [act('查看父亲留下的记录', 'secondHub')],
      { requiresEvidence: firstEvidence, speaker: '沈棠', portrait: 'shen', time: '00:46' }),
    secondHub: node('investigation',
      '现场供电状态没有改变，你获得了继续查记录的时间。制服口袋的接送单，和沈棠七年来不肯听完的语音，可能分别说明是谁在等、为什么没有结束。老周把手机放在桌上，联系事故档案值守；他没有催家属把伤心事说快一点。', 58,
      [
        act('核验制服口袋的接送单', 'receipt', { hidesWhenCollected: 'q07-receipt' }),
        act('听完留给女儿的最后留言', 'conversation', { hidesWhenCollected: 'q07-last-call' }),
        act('将技术结论与未签收记录核对', 'reconcile', { requiresEvidence: allEvidence })
      ],
      { requiresEvidence: firstEvidence, objective: { title: '找到等待的对象', detail: '分别核验接送单与家庭留言，避免以家属记忆替代事故档案。' }, time: '00:49',
        scene: { background: '/art/stairwell.webp', hotspots: [
          { id: 'receipt', actionId: 'receipt', label: '旧接送单', x: 34, y: 30 },
          { id: 'message', actionId: 'conversation', label: '最后留言', x: 77, y: 32 }
        ] } }),
    receipt: node('dialogue',
      '纸单是七年前的，标题写“旧城临时接送”，第七格被反复擦过。司机栏是沈衡，站点是清河里，乘车人一栏只写“等抢修员”。纸背有个小小的 Q07。它不是丧事用品；七年前和九天前，两个日期之间隔着父亲始终没解释的七年。', 58,
      [act('请求核对原始事故接送附件', 'archiveRequest')],
      { requiresEvidence: firstEvidence, excludesEvidence: ['q07-receipt'], time: '00:51',
        scene: { background: '/art/stairwell.webp', document: { title: '旧城临时接送 · 原件', lines: ['司机：沈衡', '等待点：清河里 / Q07', '返程人数：——', '备注：等抢修员'] } } }),
    archiveRequest: node('dialogue', "林岚经授权请档案人员调出接送附件。老周认出旧席位，说明许守成先送出被困住户，后来返回检查进水旧线，再没有返程。季宁将口述和检索结果分栏，事故原因与责任仍待正式复核，不能凭一个空格推断死者是谁。", 58, [act('比对原件与汇总表', 'archiveReply')], { requiresEvidence: firstEvidence, excludesEvidence: ['q07-receipt'], speaker: '老周', portrait: 'zhou', expression: 'focused', time: '00:55' }),
    archiveReply: node('dialogue', "附件日期是2019年10月11日：许守成使用独立供电的临时救援照明，00:47留下最后联络，救出住户后回查旧线遇难。返程表记了居民，未说明许守成的去向，事故七日复核页也不齐。沈衡当年要求补签，得到的是“车辆任务已结束”。他一直活到今年，等过的人却从未被正式接收。", 58, [act('保留未签收接送单的档案对应', 'recordReceipt')], { requiresEvidence: firstEvidence, excludesEvidence: ['q07-receipt'], speaker: "2019 年档案", portrait: "xu", time: '00:58', presence: "archive" }),
    recordReceipt: node('evidence', "季宁将原件照片、档案索引和取得权限一起附上，圈出仍缺的返程记录。“沈师傅活着回过家，许师傅没返程，这里要分开。”沈棠摸着空白格，说父亲这七年每天早上都留一份饭。老周表示会正式提交复核，不再让一声“我记得”顶替手续。", 58, [act('记录：Q07 未签收接送单', 'secondHub', { id: 'record-receipt', collect: 'q07-receipt' })], { requiresEvidence: firstEvidence, excludesEvidence: ['q07-receipt'], time: '01:02', speaker: "季宁", portrait: "ji", expression: "neutral" }),
    conversation: node('dialogue',
      '沈棠手机里那段语音被收藏了七年，时间戳是 2019 年 10 月 11 日 00:47，却只播放过前六秒。开头是父亲问她吃没吃饭，然后一阵急促的雨声。她以为后面又是劝她回家，因此每次都关掉。父亲去世后，她试过删除，系统却提醒：这一条没有听完。', 58,
      [act('由沈棠决定是否听完留言', 'fatherMessage')],
      { requiresEvidence: firstEvidence, excludesEvidence: ['q07-last-call'], speaker: '沈棠', portrait: 'shen', time: '01:04' }),
    fatherMessage: node('dialogue',
      '她自己按下播放。雨声后，沈衡说：“今晚接回来的人都吃过了。还有一个在里面干活，别把他忘了。你有空，把夜里回来的人也算进去。”随后有个很轻的陌生男声问“车还等吗”，父亲回答“等”。这句话不长，沈棠却用了七年才听见。', 58,
      [act('听沈棠把另一半话说出来', 'daughterReply')],
      { requiresEvidence: firstEvidence, excludesEvidence: ['q07-last-call'], time: '01:06' }),
    daughterReply: node('dialogue',
      '“我那时觉得他总在等别人，没有空陪我。”沈棠把手机放到桌上，“他也从没告诉我，他一直在等谁。”她没请你证明父亲还在，只问记录补上以后，能不能让活着的人知道他为什么留饭。你说可以把事实交给该收到它的人，但不能许诺一条消息永远不再来。', 58,
      [act('经本人确认记录留言含义', 'recordStatement')],
      { requiresEvidence: firstEvidence, excludesEvidence: ['q07-last-call'], speaker: '沈棠', portrait: 'shen', time: '01:08' }),
    recordStatement: node('evidence',
      '沈棠同意保留与事件有关的片段，私人的部分不进工单。她给母亲发消息：爸的话是在惦记夜里干活的人，不是要我们每天守到凌晨。母亲没有立刻回复。过了一会儿，厨房里的空椅子被挪回饭桌边，碗仍留着，人却终于坐下了。', 58,
      [act('记录：00:47 的最后留言', 'secondHub', { id: 'record-statement', collect: 'q07-last-call' })],
      { requiresEvidence: firstEvidence, excludesEvidence: ['q07-last-call'], time: '01:10' }),
    reconcile: node('dialogue', "保温器与院内保护缺陷解释了前七夜的真实停电，产权方负责修复；电网侧正常供电已经核验。沈衡近日去世后的守夜，使旧作息与2019年的等待重新重叠。报文为何提前仍有未解部分，工单里保留这个限度。季宁没有把一句家属口述写成电气因果。", 76, [act('决定怎样关闭这次工单', 'closingPuzzle')], { requiresEvidence: allEvidence, time: '01:14' }),
    closingPuzzle: node('puzzle',
      '林岚问是否把 Q07 一并清除。老周提醒，删掉告警很容易，签收记录要有依据。沈棠看着隔离标识，没有再要求保温器通电。现在要处理的是两份任务：让居民获得合规可靠的供电，让那一行被省略的人有一条可以追查的记录。', 80,
      [
        act('为维持守夜习惯，要求重新投入未查明的原支路', 'override', { tone: 'danger' }),
        act('按批准方案恢复安全供电，另立档案复核并保留 Q07', 'approvedPlan')
      ],
      { requiresEvidence: allEvidence, puzzle: { prompt: '怎样恢复居民生活，又不把缺失记录重新藏起来？', hint: '设备检修、供电批准、档案签收属于不同责任；不要用通电完成仪式。' }, time: '01:16' }),
    override: node('dialogue',
      '你把“保持原样等一夜”写成处理意见。老周没有执行，立即停止这项不具备安全条件的安排。沈棠听见争论，误以为只要她坚持留饭，你们就能找到父亲。对讲机里又响起 Q07 的提示，现场没有合闸，却已经有人把希望押在一个危险的开关上。', 80,
      [act('查看这个决定的后果', 'overrideFailure')],
      { requiresEvidence: allEvidence, speaker: '老周', portrait: 'zhou', expression: 'focused', time: '01:18' }),
    overrideFailure: node('ending',
      '【责任错接】不合规方案被监护人阻止，供电恢复转交下一班。记录被保住了，沈棠却以为告别必须靠你们重新接电。你把家属的愿望写进了设备处置，反而让她更难离开那一刻。没有受伤的人；也没有真正结束的等待。', 80,
      [act('重新区分两份任务', 'closingPuzzle')],
      { outcome: 'failure', requiresEvidence: allEvidence, visual: 'blackout', time: '01:24' }),
    approvedPlan: node('dialogue', "产权方完成器具与院内保护整改，经核验的正常供电恢复。林岚协助将 Q07 历史异常单列移交档案复核，许守成的姓名与未签收单一并保留。季宁记录实际完成时间，分别让设备处置、供电回访和档案接收找到负责人，旧单的空白仍原样保存。", 85, [act('把选择交还给沈棠一家', 'familyChoice')], { requiresEvidence: allEvidence, speaker: '你', time: '01:32' }),
    familyChoice: node('dialogue',
      '沈棠给母亲热了晚饭，用的是检修确认可用的普通设备。她把第七碗饭盛成两份，留一份在桌上，另一份吃掉。“不是说不等了，”她说，“是不让等的人把我们也扣在夜里。”你没有在工单里记录饭碗怎么摆，那不是供电所应当批准的事。', 89,
      [act('确认恢复后的现场状态', 'clockOff')],
      { requiresEvidence: allEvidence, speaker: '沈棠', portrait: 'shen', time: '01:41' }),
    clockOff: node('dialogue', "季宁逐户回访六户，确认没有新保护动作，才合上现场记录。“我差点把通知写成跳闸。”我说能发现并改正，下一班就少猜一次。沈棠伸手调准快了一分钟的厨房钟。普通的时钟照常往前走，旧返程单留在封好的材料袋里。", 92, [act('查看工单关闭前的最后一条事件', 'zeroMinute')], { requiresEvidence: allEvidence, speaker: "季宁", portrait: "ji", time: '01:49', expression: "neutral" }),
    zeroMinute: node('dialogue', '林岚报告，Q07 的预计时刻已经停止提前。原来的“等待超时”消失，改成了“转交：未完接送”。没有人声，也没有屏幕上的感谢。记录器里留着正常的一分钟。偏偏在工单附件的预览图上，那个空白返程格像被雨水洇过，出现了半个“回”字。', 94, [act('保留附件并填写实际结论', 'recordClosure')], { requiresEvidence: allEvidence, speaker: '林岚', portrait: 'lin', time: '01:53', scene: { background: '/art/stairwell.webp', inscription: 'Q07 · 转交：未完接送' }, presence: "radio" }),
    recordClosure: node('dialogue',
      '你写明设备缺陷、处置和复核编号，把不确定的旧事件单列，既没有写“驱除成功”，也没有写“住户误报”。沈棠在用户确认栏签下名字。签完以后她问许家这些年收到过完整说明吗，老周说会由正式渠道核查、联系，不能让她再替别人守一个没有消息的夜。', 96,
      [act('离开七号院', 'linger')],
      { requiresEvidence: allEvidence, time: '02:03' }),
    linger: node('dialogue', "抢修车停在路口，季宁将本夜交接读回：“供电核验完成，Q07另项接收。未完接送没有写成已返程。”林岚把下一张拆迁区工单发来。她问我夜班还吃不吃饭，我递给她一包饼干：“先把这份也算上。”车窗外，院门口的公交制服已经收回屋里。", 98, [act('归档第一章', 'end')], { requiresEvidence: allEvidence, location: '抢修车 · 清河路口', time: '02:11', scene: {
            background: "/art/repair-van.webp"
        }, speaker: "季宁", portrait: "ji", expression: "neutral" }),
    end: node('ending',
      '【第一章完成】清河里的灯正常亮着，旧队列停止倒数。沈棠仍会给夜班留饭，但不再把每天过早的一分钟当作父亲的责备。调查板上留下 Q07：一张被判定“任务已结束”的接送单，和一个没有被算进返程的人。下一条线指向拆迁区。', 100,
      [act('重新调查《头七》', 'dispatch', { id: 'restart', resetEvidence: true })],
      { outcome: 'complete', requiresEvidence: allEvidence, location: '调查归档 · Q07', time: '第一章 · 已完成', visual: 'ending',
        scene: { background: '/art/dispatch.webp', inscription: 'Q07 · 先把人算进去' } })
  }
};
