import type { Chapter, StoryAction, StoryNode } from '../types';

const requiredEvidence = ['five-point-map', 'last-radio', 'rescue-testimony', 'isolation-boundary', 'restored-register'] as const;
const next = (id: string, label: string, target: string): StoryAction => ({ id, label, next: target });
const node = (
  kind: StoryNode['kind'], progress: number, text: string, actions: readonly StoryAction[],
  extra: Partial<StoryNode> = {}
): StoryNode => ({
  kind, progress, text, actions, location: '梧城供电公司 · 旧城事故档案室', time: '凌晨', visual: 'dispatch',
  scene: { background: '/art/control-room.webp' }, ...extra
});

export const closure: Chapter = {
  id: 'closure', order: 5, title: '闭合', subtitle: '终章 · 把名字接回来',
  synopsis: '五份被删去的记录在旧城图上围成一圈。最后的选择，是合上来历不明的开关，还是让七年前那次救援终于有可追问的终点。',
  entryNode: 'dispatch', requiredEvidence,
  clue: { code: 'C00', title: '归档闭合', detail: '五份原始记录、获救住户与许守成的名字回到事故档案，责任与后续事项分别签收。已核验供电恢复，未知回路继续隔离；闭合的是交接与记忆。', x: 33, y: 82 },
  evidence: {
    'five-point-map': { title: '五点应急路线图', detail: 'H13西侧临时服务户→Q07西北联络与接送等待→R02东北应急旁路→L03东侧留灯等候→N04南侧原票交回。原图的虚线是救援与交接路线，穿越不同供电分区，不是一根可合闸的导线。' },
    'last-radio': { title: '00:47的联络与缺页', detail: '2019-10-11 00:47为许守成最后一次联络。录音索引、纸质班报与巡查时间一致；后续七日复核页未完整归档。事故发生于救人后返回检查旧线的阶段，不能用一段联络证明他安全回所。' },
    'rescue-testimony': { title: '被删除的获救住户', detail: '13号陈阿姨与外孙等住户被救出，许守成使用未登记应急旁路与借来的绿布缠边梯子。老周离开监护位置去疏散，许守成回查进水旧线时死亡。获救人的证词与现场附页互相印证，死亡不是一次可以重放的开关操作。' },
    'isolation-boundary': { title: '仍然有效的隔离边界', detail: '已核验的住宅线路与未登记旧旁路必须分别处理。旧旁路缺少可靠来源、完整走向与处置记录，不具备送电条件；归档或道歉均不能替代现场核验与许可。' },
    'restored-register': { title: '名字与接收人的恢复清册', detail: '许守成、陈阿姨与外孙、相关住户和原交接责任人逐项恢复到事故档案。保留原始缺页与更正日期，家属说明、独立复核、住户回访分别有人接收，不能假造七年前的完成记录。' }
  },
  nodes: {
    dispatch: node('dialogue', 2, '林岚把旧城线路图挂在白板上，没有在五个点之间画线。她说先前每张工单都能单独关闭，五张放在一起，却有同一个交接人消失了。今夜没有新的停电电话，只有档案室的灯开着。老周站在门边，带来皮包里剩下的那张附页，手里已经没有红夹。', [next('summon', '确认本次事故核查的范围', 'summon')], { speaker: '林岚', portrait: 'lin', time: '23:40', scene: { background: '/art/dispatch.webp' } }),
    summon: node('dialogue', 4, '你们不是要用五次异常拼出一道能唤回死者的程序。许守成已经在七年前那次抢修中死亡，这是不能用希望覆盖的事实。本次要查明应急旁路、救援经过、台账删户与虚假完成状态怎样连在一起，并把仍未明的线路留在隔离范围内。林岚将这段范围说明读给所有接收人。', [next('door', '进入原始档案保存区', 'archiveDoor')], { speaker: '林岚', portrait: 'lin' }),
    archiveDoor: node('dialogue', 6, '档案门用的是普通钥匙，打开时没有多出来的楼层。柜里有返潮的纸味，地面留着搬箱子的划痕。管理员按目录调出改造前后的两套资料，并在调阅单上签字。你注意到，所有异常最难解释的那一段，往往发生在某个人没有接收、没有答复、没有留下名字的地方。', [next('bench', '建立并列核对的档案桌', 'archiveBench')]),
    archiveBench: node('dialogue', 8, '你把五个编号写在不同颜色的便签上：H13、Q07、R02、L03、N04。桌边留出一张空接收单，编号C00。它不是第六个故障点，而是今夜所有原件最后要去的地方。旧纸上的空白不能被涂平，新接收单上却不能再留“以后补”而没有接收人。', [next('investigate', '核对地图、联络、救援、隔离与清册', 'inspection')]),
    inspection: node('investigation', 12, '五项核对缺一不可。地图说明路线性质，联络说明时间，救援证词说明发生了什么；隔离边界决定今夜能否送电，恢复清册决定哪些人终于进入记录。前几章的线索可以在城市档案中复看，这张桌上还必须形成一套能正式接收的本地证据，不能只靠你记得。', [
      { id: 'map', label: '对照五个编号与原图图例', next: 'mapIndex', hidesWhenCollected: 'five-point-map' },
      { id: 'radio', label: '核对00:47联络与七日复核', next: 'radioIndex', hidesWhenCollected: 'last-radio' },
      { id: 'rescue', label: '核对获救人证词与旁路附页', next: 'rescueIndex', hidesWhenCollected: 'rescue-testimony' },
      { id: 'permit', label: '复查现存支路的隔离边界', next: 'permitIndex', hidesWhenCollected: 'isolation-boundary' },
      { id: 'names', label: '恢复被删去的名字与接收栏', next: 'namesIndex', hidesWhenCollected: 'restored-register' },
      { id: 'assemble', label: '将五项证据并列复核', next: 'reassemble', requiresEvidence: requiredEvidence }
    ], { objective: { title: '准备完整的事故交接', detail: '取得五条本地证据，再完成路线、送电边界与归档选择。' }, scene: { background: '/art/control-room.webp', hotspots: [{ id: 'map', actionId: 'map', label: '旧城原图', x: 17, y: 41 }, { id: 'radio', actionId: 'radio', label: '联络索引', x: 36, y: 76 }, { id: 'rescue', actionId: 'rescue', label: '证词与附页', x: 51, y: 60 }, { id: 'permit', actionId: 'permit', label: '隔离记录', x: 75, y: 42 }, { id: 'names', actionId: 'names', label: '恢复清册', x: 81, y: 77 }] } }),
    mapIndex: node('dialogue', 14, '原图有两种线：实线记录配电关系，灰色虚线记录停电改造时的巡查、救援与资料交回路径。五个编号都落在虚线上，穿过的实线分别属于不同供电分区。后来电子图保留了设备，丢掉了人员与服务户的标记，看起来便只剩几个互不相干的旧点。', [next('map-note', '记录路线顺序与图例', 'mapRecord')]),
    mapRecord: node('evidence', 16, '图注从西侧临时服务户出发，依次经过西北联络点、东北旁路、东侧等候楼道，回到南侧工作票交回点。H13、Q07、R02、L03、N04恰好逐个对应。这条圈曾让人走出去、让资料带回来。最后那个交回没有发生，它才变成了看上去已经闭合、其实无人接收的图形。', [{ id: 'collect-map', label: '记录：五点应急路线图', next: 'inspection', collect: 'five-point-map' }], { excludesEvidence: ['five-point-map'], scene: { background: '/art/control-room.webp', document: { title: '旧应急路线 · 原图图注', lines: ['实线：配电线路；灰虚线：人员与资料路线', '西 H13 · 临时服务户', '西北 Q07 · 巡查联络', '东北 R02 · 应急旁路', '东 L03 · 留灯等候', '南 N04 · 工作票交回'] } } }),
    radioIndex: node('dialogue', 14, 'Q07提供了最后联络的索引，班报上保留同一时间：2019年10月11日00:47。你对照索引、值班人的手写记录与已有巡查材料，没有凭某个断裂声音补造一句完整遗言。能够确认的是：许守成当时仍在工作范围内，并未完成回所交班。', [next('radio-note', '核对00:47之后的记录缺口', 'radioRecord')]),
    radioRecord: node('evidence', 16, '后一页应记录处置和人员返回，那里缺了页码。七日复核也没有把原票附页纳入事故材料。工单完成时间早于正式核实，不能证明许守成曾安全离开。凌晨每次提前的报修，指向这段始终被推迟的复核；它没有改变2019年发生的事，也没有制造另一次可以重来的现场。', [{ id: 'collect-radio', label: '记录：00:47的联络与缺页', next: 'inspection', collect: 'last-radio' }], { excludesEvidence: ['last-radio'] }),
    rescueIndex: node('dialogue', 14, '陈阿姨的口述、邻居留下的讣告与H13旁路附页，都指向同一晚。改造后被删除的13号并非不存在的居民：她和外孙从进水的旧屋里出来，后来住进了安置房。许守成借杨婶绿布缠边的梯子，通过未登记应急旁路参与救援。那些人确实获救，不能因为手续缺失就从经过里删掉。', [next('rescue-note', '将证词与原始附页相互核对', 'rescueRecord')]),
    rescueRecord: node('evidence', 16, '老周当时离开监护位置去疏散住户，许守成随后返回检查进水旧线，在未被完整确认的停电边界内遇险死亡。救援需要、旁路未登记、边界混乱与监护缺位叠在同一次事故里。现有材料支持这个经过，具体责任仍需独立复核；不能把他的死亡写成没有缘由的宿命，更不能拿获救的人证明风险合理。', [{ id: 'collect-rescue', label: '记录：被删除的获救住户', next: 'inspection', collect: 'rescue-testimony' }], { excludesEvidence: ['rescue-testimony'] }),
    permitIndex: node('dialogue', 14, '你让现场同事读回当前隔离记录。居民使用的是后来经核验的正常线路，旧旁路的来源、完整走向与处置过程仍有缺口。图上的五点靠人的路线相连，不意味着这些旧设备现在可以连成电气回路。任何“试一下就知道”的建议，都得先回答电从哪里来、会到哪里去。', [next('permit-note', '保留已知线路与未知旁路的分界', 'permitRecord')]),
    permitRecord: node('evidence', 16, '隔离边界没有因故事讲清楚就失效。你在C00附件里明确：正常供电按已核验范围保持，未明支路继续隔离，后续现场核查另行办理。许守成的名字不是送电许可，他曾救过人也不是重走一次危险边界的理由。今夜可以完成的，是记录交回，而非未知电源的试送。', [{ id: 'collect-permit', label: '记录：仍然有效的隔离边界', next: 'inspection', collect: 'isolation-boundary' }], { excludesEvidence: ['isolation-boundary'], scene: { background: '/art/control-room.webp', document: { title: 'C00 · 现状边界', lines: ['经核验住宅支路：保持正常供电', '未登记旧旁路：来源、走向、处置待核', '未知支路：继续隔离，不做试送电', '事故记录交回 ≠ 现场送电许可'] } } }),
    namesIndex: node('dialogue', 14, '新台账把旧住户迁出，却没有保留他们曾在这片服务范围里获救的关系。汇总卷没有许守成完整的作业关系：一些未归档附页仍有他的签名，一些移交栏被涂空。你和管理员逐项恢复原始服务户与材料的对应，保留现有安置地址，不把已经往前走的生活重新锁进七年前的门牌。', [next('names-note', '为每份材料指定真实接收人', 'namesRecord')]),
    namesRecord: node('evidence', 16, '恢复清册同时留下原件、更正依据与今天的日期。许家说明、住户回访、责任复核、旧线核查分别写明接收部门与联系人，不能用一个笼统“完成”吞掉所有未完事项。你给许守成的那一栏补上姓名与参与事项，没有为他伪造一个回所时间。他没有回来，但记录可以回来。', [{ id: 'collect-names', label: '记录：名字与接收人的恢复清册', next: 'inspection', collect: 'restored-register' }], { excludesEvidence: ['restored-register'] }),
    reassemble: node('dialogue', 25, '五份证据终于能放在同一个桌面。你看见的不是一张城市鬼阵，而是一段救援被拆成不相认的资料：用户、时间、旁路、等候、工作票。异常抓住的每个缺口都很小，正因为没人把它们一起接收，才像覆盖了整个旧城。你仍不能解释全部现象的来源，已经足以拒绝一个没有证据的合闸。', [next('route', '按图例匹配五个点的路线', 'puzzleRoute')], { requiresEvidence: requiredEvidence }),
    puzzleRoute: node('puzzle', 30, '原图要求：西侧临时服务户→西北巡查联络→东北旁路→东侧留灯等候→南侧工作票交回。已知H13在西、Q07在西北、R02在东北、L03在东、N04在南。选择正确的核对顺序，并说明这条线的性质。', [next('power', 'H13→N04→L03→R02→Q07：沿旧设备依次合闸', 'routeReview'), next('memory', 'H13→Q07→R02→L03→N04：核对人员与资料的交接路线', 'routeMatched'), next('date', 'Q07→L03→H13→N04→R02：按编号大小恢复供电', 'routeReview')], { requiresEvidence: requiredEvidence, puzzle: { prompt: '匹配地点方位、编号含义和原图图例', hint: '虚线穿过不同供电分区。把五条章节线索放回各自对应的职责，而不是寻找合闸顺序。' } }),
    routeReview: node('dialogue', 30, '你指向两点之间，林岚将不同分区的实线画给你看。它们没有那样的供电关系。编号不是开关顺序：H13是户，Q07是第七接送等候点，关联联络与未完复核，R02是旁路，L03是留灯等候，N04是票。这次判断可以重做，现场没有因此收到任何送电指令。', [next('retry', '重看地图上的方位与图例', 'puzzleRoute')], { speaker: '林岚', portrait: 'lin', requiresEvidence: requiredEvidence }),
    routeMatched: node('dialogue', 34, '你将虚线顺序读出来，最后停在N04，而不是从N04画一根新导线回H13。线路图上的闭圈，只能证明旧城那次行动有去程、有回程；真正少掉的是回程带回的事实。C00需要接收这些事实，不能替一条未知旁路下达合闸指令。', [next('reconstruction', '按五份材料还原事故经过', 'reconstruction')]),
    reconstruction: node('dialogue', 37, '2019年10月11日，旧城改造停电范围与实际住户并未完全对应。被漏掉的13号有人留在进水旧屋里。许守成使用未登记应急旁路参与救援，借来的梯子将人带出危险处。后来获救户从新系统迁走，应急记录没有随迁移保留，像那一晚从来没有为他们发生过。', [next('electrician', '继续核对救援后的工作状态', 'electrician')]),
    electrician: node('dialogue', 40, '人救出来后，许守成没有获得完整的边界确认。他返回查看进水旧线，老周已经离开原来的监护位置去疏散其他住户。两个人做的都不是凭空出现的邪恶决定，却在旁路未登记、处置记录不完整的现场叠成了致命风险。理解当时为什么着急，不能把缺失的保护写成不需要。', [next('last', '确认那一夜没有可以重放的终点', 'lastMinute')]),
    lastMinute: node('dialogue', 43, '00:47留下了最后一次联络，之后许守成没有回所。事故不是因为有人没点够七夜的灯，也不是因为居民忘了规矩。他死于那次救援后的电气事故。恐惧、回避与省略让死亡经过迟迟不能被完整接收；以后出现的异常将这些省略显现出来，并没有赋予你改变死亡的办法。', [next('zhou', '请老周把自己的选择说清楚', 'oldZhou')]),
    oldZhou: node('dialogue', 46, '老周说他当时以为先把人疏散出去，再回来补旁路票也不迟。后来听见守成出事，他想起的第一件事竟是票没有填完。“我这些年总说是上面让关单。那是真的，但我签了字也是真的。我能说明他们说过什么，不能再拿那些话替自己把名字擦掉。”', [next('households', '核对获救住户的后续经历', 'households')], { speaker: '老周', portrait: 'zhou' }),
    households: node('dialogue', 49, '陈阿姨住进安置房，外孙已经能独自来签收材料；接送司机沈衡继续开过夜班，退休后仍给未归的人留饭；杨婶一直给夜归的人留着灯，陈伯保管门牌与工具袋。他们的经历并不相同，不能当成一群没有名字的“十三户”。你恢复每个人的记录，也尊重他们后来真实拥有过的日子。', [next('family', '将确认经过与待查责任向许家区分', 'family')]),
    family: node('dialogue', 52, '许家同意接收书面说明，暂时不参加现场会议。你们按他们的意愿寄送有编号的副本，注明哪些经过已得到互证，哪些责任仍待独立复核。老周没有要求转告“希望原谅”。这份说明不能把悲伤结案，也不该把许守成变成只用来装饰报告的英雄称号。', [next('boundary', '回到今夜需要决定的现场边界', 'permitBoundary')]),
    permitBoundary: node('dialogue', 55, '控制屏上正常线路都处于已核验的状态。另有一处旧联络开关，关联R02的未登记旁路，资料栏仍缺来源与完整走向。有人说五份记录既然凑齐，就可以试着让它完成一次。你知道这是把一个纸面上的圆误认为送电许可，也是七年前那句“后面再补”的另一种说法。', [next('choose', '作出最终的线路处理决定', 'puzzleBoundary')], { requiresEvidence: requiredEvidence }),
    puzzleBoundary: node('puzzle', 59, '五份记录已经核对，旧旁路却仍没有可靠来源、完整走向与处置记录。最终闭合应发生在哪里？', [next('close', '闭合未知联络开关，让五个点真正通电成环', 'wrongClose'), next('separate', '已核验供电保持正常；未知支路继续隔离，在档案中完成交接', 'safePlan')], { requiresEvidence: requiredEvidence, puzzle: { prompt: '区分纸面交接与现场送电条件', hint: '所有名字齐全，也不会自动产生一份合格的送电许可。R02的来源与走向仍待核。' } }),
    wrongClose: node('ending', 59, '你把未核验的旧联络当作答案，发出合闸指令。保护随即动作，相关正常支路也受到影响；控制屏上的户号闪过旧编号，住户又回到停电里。现场人员撤回操作，林岚终止你的指令。你没让许守成回来，只让曾经救出的人再次承担了未知线路的风险。这个决定必须重做。', [next('retry', '撤回决定，重新确认隔离边界', 'puzzleBoundary')], { outcome: 'failure', requiresEvidence: requiredEvidence, visual: 'blackout', scene: { background: '/art/control-room.webp', inscription: '未知支路不具备送电条件' } }),
    safePlan: node('dialogue', 63, '你拒绝试送电，要求现场维持既定隔离。已核验线路继续服务居民，旧旁路进入另行核查清单，不因一晚故事完整就被宣布安全。控制室没有响起庆祝的蜂鸣，只有林岚读回指令的声音。你们终于用一条明确边界结束了“先做再补”的习惯。', [next('archive', '决定怎样写入最后的事故接收单', 'puzzleArchive')]),
    puzzleArchive: node('puzzle', 67, 'C00接收单需要保存什么？原票存在空白，老周签过虚假完成状态，服务户曾被删除，许家尚有未获答复的问题。档案的闭合怎样才不是再次把事情盖住？', [next('erase', '删掉住户与旁路细节，写“意外已处理”，不再追问责任', 'wrongErase'), next('restore', '保留原件与更正日期，恢复每个人的名字，分别签收后续责任', 'register')], { requiresEvidence: requiredEvidence, puzzle: { prompt: '让记录有终点，也让未完事项可继续追问', hint: '闭合交接不等于所有问题已经解决。名字、事实、缺口与明确接收人必须同时留下。' } }),
    wrongErase: node('ending', 67, '一份整洁报告替所有人写了“已经处理”。13号再次从名单消失，许守成又只剩“意外死亡”，老周的签字被一层新纸遮住。办公室的灯没有立刻熄灭，档案目录却又多出一个没有接收人的附件。你重复了最初的删除，下一次报修将仍然找不到那个被问的人。', [next('retry', '撤回覆盖，保留原件与真实责任', 'puzzleArchive')], { outcome: 'failure', requiresEvidence: requiredEvidence, scene: { background: '/art/control-room.webp', inscription: '空白不能以删除填补' } }),
    register: node('dialogue', 71, 'C00第一页列出五个来源与原件编号，第二页列名字、更正依据和接收人。老周签下自己的说明，管理员签收原件，负责复核的部门接下仍待调查的部分。你们没有把每个空白填成“完成”，只是保证再问到它时，能够找到一个应当回答的人。', [next('readback', '逐项读回接收内容', 'readback')], { requiresEvidence: requiredEvidence }),
    readback: node('dialogue', 74, '林岚读回：许守成参与应急救援，事故发生于返回检查阶段；13号陈阿姨与外孙等服务户记录恢复；旧旁路继续隔离；原完成状态及未归档材料进入责任复核；许家和住户分别接收说明。每一项都有人答“收到”。这一次没有人用沉默代替同意。', [next('release', '确认现场与档案分别交接', 'release')], { speaker: '林岚', portrait: 'lin' }),
    release: node('dialogue', 77, '现场同事报告住宅供电稳定，没有新增倒送记录。档案员报告纸质原件归位，电子目录保留更正历史。两份状态同时成立，却没有谁证明谁：灯亮不代表责任消失，记录完整也不代表未知线路安全。它们各自有自己的边界，终于可以不再互相顶替。', [next('quiet', '查看旧异常点的回访反馈', 'quiet')]),
    quiet: node('dialogue', 80, '槐荫巷没有再出现空地址在线表，七夜报修的时间没有继续提前，拆迁区回送记录暂未新增。长安里的住户正在睡，南桥街的旧铁柜仍留着04号。你将回访窗口继续保留，不把今夜的安静写成一条放之四海皆准的驱除法。能够确认的是，这组被抹去的关系有了出处。', [next('mei', '接听杨婶的回访电话', 'mei')]),
    mei: node('dialogue', 83, '杨婶醒得早，问许师傅的名字是不是已经写回去了。林岚把接收编号念给她，她拿笔认真记了两遍。杨婶没有再问他几点回来，只问能否留一份复印件在楼里：“以后新搬来的人不知道那块反光胶带是谁贴的，也该知道这里有人认真走过。”', [next('shen', '确认沈棠已经收到送达凭据', 'shen')], { speaker: '杨桂梅', portrait: 'mei', scene: { background: '/art/stairwell.webp' }, visual: 'lamp' }),
    shen: node('dialogue', 85, '沈棠在消息里发来送达凭据，下面只有一句：父亲等过的人，终于在接送名单里有名字了。你看着这句话，知道不是所有欠下的东西都有等价的偿还。那顿留给夜班的饭没有等到许守成，但司机与未归的人不必再被同一句“任务结束”抹去。让证词留存，是活着的人可以真正做的事。', [next('zhou-return', '在供电所门口等老周', 'zhouReturn')], { speaker: '沈棠', portrait: 'shen' }),
    zhouReturn: node('dialogue', 88, '老周从控制室出来，手里只剩值班用的钥匙。他说以后回访还会来，责任复核需要什么也会交。他没有向你讨一句“当年也是没办法”。你们在门口站了一会儿，天还没亮，旧皮包轻了许多。人没有因此变得清白，至少不再把重量藏在别人找不到的夹层里。', [next('meal', '陪他回值班室坐一会儿', 'meal')], { speaker: '老周', portrait: 'zhou' }),
    meal: node('dialogue', 90, '值班室微波炉里热着早饭。老周把两个馒头分开，忽然说守成嫌凉的馒头噎，总先找水。林岚递来杯子，没有把它摆在空椅子前。你们各自坐下，吃一点热的。许守成不会从门口推着工具车进来，这个事实第一次没有被一盏灯、一段噪声或一张假完成单遮住。', [next('archive-end', '查看C00正式归档状态', 'archiveEnd')], { scene: { background: '/art/dispatch.webp' } }),
    archiveEnd: node('dialogue', 92, 'C00显示“原始材料已接收，责任复核持续进行”，不是“无事发生”。许守成的名字连着工作、死亡与被救的人，也连着那些没来得及吃的早饭、贴过的胶带、借过的梯子。你没有把一段生活全变成事故说明，但至少让说明不再把那段生活删除。', [next('city', '打开门，看看恢复常态的旧城', 'city')]),
    city: node('dialogue', 94, '早班公交从南桥街驶过，车里有人靠窗补觉。长安里住户买菜，槐荫巷的门重新有人进出。旧城没有因为一份档案重写地貌，雨后的电线也还是需要日常巡查。你终于可以把这些普通声音听成普通声音，而不必每次都猜它是不是有人求着回家。', [next('next-network', '收下管理员送来的另一页索引', 'network')], { scene: { background: '/art/alley.webp' }, visual: 'alley', location: '供电所门口 · 天亮' }),
    network: node('dialogue', 96, '管理员给你一张待转交的市政索引。旧供水改造表也有一处空地址，与供电档案的删户年代相近。它目前只是一条值得核实的记录，不能说明所有网络都遵守同一种规律。你把它放进下一次调阅清单，先把C00的接收副本交到该去的人手里。', [next('last-order', '完成今夜最后一次交接', 'lastOrder')]),
    lastOrder: node('dialogue', 98, '林岚问这轮工单的结束语写什么。你说：已核验供电正常，未知支路保持隔离；原始记录交回，人员与责任恢复，后续事项已指定接收人。她把整段读了一遍，没有省成“闭合完成”。屏幕下方是许守成的姓名，旁边不再有一个永远等人补上的空格。', [next('finish', '结束《回路》第一部', 'end')], { speaker: '林岚', portrait: 'lin', requiresEvidence: requiredEvidence }),
    end: node('ending', 100, '第一部 · 闭合。\n\n七年前，许守成借未登记应急旁路救出了旧城住户，在返回检查进水旧线时死亡。被删除的服务记录、没有交回的工作票和被隐瞒的责任，让他的最后一班工作迟迟没有终点。今夜，那些名字与事实回到了档案；老周将继续接受复核，许家终于能得到可追问的说明，获救的人可以继续自己的生活。\n\n未知回路仍然隔离。许守成没有回来，也不必再靠一盏无人敢关的灯证明他来过。你收起工具，接班的人已经站在门口。这一次，你把工单交到他手里，听见了清楚的一声：“收到。”', [{ id: 'restart', label: '重新调查终章《闭合》', next: 'dispatch', resetEvidence: true }], { outcome: 'complete', requiresEvidence: requiredEvidence, visual: 'ending', scene: { background: '/art/dispatch.webp', inscription: 'C00 · 名字已归档，未知支路未闭合' } })
  }
};
