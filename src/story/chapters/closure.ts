import type { Chapter, StoryAction, StoryNode } from '../types';

const requiredEvidence = ['five-point-map', 'last-radio', 'rescue-testimony', 'isolation-boundary', 'restored-register'] as const;
const next = (id: string, label: string, target: string): StoryAction => ({ id, label, next: target });
const node = (
  kind: StoryNode['kind'], progress: number, text: string, actions: readonly StoryAction[],
  extra: Partial<StoryNode> = {}
): StoryNode => ({
  kind, progress, text, actions, location: '梧城电网有限公司 · 旧城事故档案室', time: '凌晨', visual: 'dispatch',
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
    'rescue-testimony': { title: '被删除的获救住户', detail: '13号陈阿姨与外孙等住户被救出，许守成使用独立供电的临时救援照明与绿布缠边梯子。老周离开监护位置去疏散，许守成回查进水旧线时死亡。获救人的证词与现场附页互相印证，死亡不是一次可以重放的开关操作。' },
    'isolation-boundary': { title: '仍然有效的隔离边界', detail: '已核验的住宅线路与未登记旧旁路必须分别处理。旧旁路缺少可靠来源、完整走向与处置记录，不具备送电条件；归档或道歉均不能替代现场核验与许可。' },
    'restored-register': { title: '名字与接收人的恢复清册', detail: '许守成、陈阿姨与外孙、相关住户和原交接责任人逐项恢复到事故档案。保留原始缺页与更正日期，家属说明、独立复核、住户回访分别有人接收，不能假造七年前的完成记录。' }
  },
  nodes: {
    dispatch: node('dialogue', 2, "今夜没有新停电，城区抢修班按值班安排参加旧城技术核对。林岚在会议室挂起五点图，季宁将现场回执逐份摊开。老周带来剩余原件，他涉及的历史责任由独立复核岗位处理。我确认当班现场另有人接续，获准调阅的范围也登记清楚。", [next('summon', '确认本次事故核查的范围', 'summon')], { speaker: '林岚', portrait: 'lin', time: '23:40', scene: { background: '/art/dispatch.webp' }, location: "梧城电网 · 旧城技术核对室", presence: "scene" }),
    summon: node('dialogue', 4, "本次核对查清的是旧设施资料、救援路线、台账删户和交接状态，我和季宁提供本轮抢修的现场记录。许守成2019年遇难，具体事故原因和责任由正式调查复核。档案部门接收原件，未知支路仍由专业岗位保持隔离；会议室的一套材料不能给现场补出送电许可。", [next('door', '进入原始档案保存区', 'archiveDoor')], { speaker: "程砚（你）", portrait: "cheng", expression: "focused" }),
    archiveDoor: node('dialogue', 6, "季宁跟我在调阅单上登记，管理员按权限取出原始卷。她没有把返潮的纸页翻得太快，先拍目录和已有缺页标记。“这次另一班也能按索引找回来。”我让她把借阅去向写齐。钥匙是普通钥匙，柜门打开后，一阵很久没散去的雨衣味从纸箱里涌出来。", [next('bench', '建立并列核对的档案桌', 'archiveBench')], { speaker: "季宁", portrait: "ji", expression: "neutral" }),
    archiveBench: node('dialogue', 8, "季宁把 H13、Q07、R02、L03、N04 分成五种便签，再给今天的接收单留出 C00。“原来空的地方仍要拍下来，更正要写今天。”我看着她第一次出车时那本防水册，名字、时刻、来源和接收人已不用再提醒。桌外留着未知支路的隔离状态回报。", [next('investigate', '核对地图、联络、救援、隔离与清册', 'inspection')], { speaker: "季宁", portrait: "ji", expression: "neutral" }),
    inspection: node('investigation', 12, '五项核对缺一不可。地图说明路线性质，联络说明时间，救援证词说明发生了什么；隔离边界决定今夜能否送电，恢复清册决定哪些人终于进入记录。前几章的线索可以在城市档案中复看，这张桌上还必须形成一套能正式接收的本地证据，不能只靠你记得。', [
      { id: 'map', label: '对照五个编号与原图图例', next: 'mapIndex', hidesWhenCollected: 'five-point-map' },
      { id: 'radio', label: '核对00:47联络与七日复核', next: 'radioIndex', hidesWhenCollected: 'last-radio' },
      { id: 'rescue', label: '核对获救人证词与旁路附页', next: 'rescueIndex', hidesWhenCollected: 'rescue-testimony' },
      { id: 'permit', label: '复查现存支路的隔离边界', next: 'permitIndex', hidesWhenCollected: 'isolation-boundary' },
      { id: 'names', label: '恢复被删去的名字与接收栏', next: 'namesIndex', hidesWhenCollected: 'restored-register' },
      { id: 'assemble', label: '将五项证据并列复核', next: 'reassemble', requiresEvidence: requiredEvidence }
    ], { objective: { title: '准备完整的事故交接', detail: '取得五条本地证据，再完成路线、送电边界与归档选择。' }, scene: { background: '/art/control-room.webp', hotspots: [{ id: 'map', actionId: 'map', label: '旧城原图', x: 17, y: 41 }, { id: 'radio', actionId: 'radio', label: '联络索引', x: 36, y: 76 }, { id: 'rescue', actionId: 'rescue', label: '证词与附页', x: 51, y: 60 }, { id: 'permit', actionId: 'permit', label: '隔离记录', x: 75, y: 42 }, { id: 'names', actionId: 'names', label: '恢复清册', x: 81, y: 77 }] } }),
    mapIndex: node('dialogue', 14, '原图有两种线：实线记录配电关系，灰色虚线记录停电改造时的巡查、救援与资料交回路径。五个编号都落在虚线上，穿过的实线分别属于不同供电分区。后来电子图保留了设备，丢掉了人员与服务户的标记，看起来便只剩几个互不相干的旧点。', [next('map-note', '记录路线顺序与图例', 'mapRecord')]),
    mapRecord: node('evidence', 16, "季宁对照原图图例，发现虚线连的是救援、等候和交接地点，跨越不同供电分区。R02临时照明有自己的独立电源，不能拿五个编号拼成一根城市导线。她给今天的路线副本补上图例，原图和原有缺页保持原样，等管理员签收。", [{ id: 'collect-map', label: '记录：五点应急路线图', next: 'inspection', collect: 'five-point-map' }], { excludesEvidence: ['five-point-map'], scene: { background: '/art/control-room.webp', document: { title: '旧应急路线 · 原图图注', lines: ['实线：配电线路；灰虚线：人员与资料路线', '西 H13 · 临时服务户', '西北 Q07 · 巡查联络', '东北 R02 · 应急旁路', '东 L03 · 留灯等候', '南 N04 · 工作票交回'] } }, speaker: "季宁", portrait: "ji", expression: "neutral" }),
    radioIndex: node('dialogue', 14, 'Q07提供了最后联络的索引，班报上保留同一时间：2019年10月11日00:47。你对照索引、值班人的手写记录与已有巡查材料，没有凭某个断裂声音补造一句完整遗言。能够确认的是：许守成当时仍在工作范围内，并未完成回所交班。', [next('radio-note', '核对00:47之后的记录缺口', 'radioRecord')]),
    radioRecord: node('evidence', 16, '后一页应记录处置和人员返回，那里缺了页码。七日复核也没有把原票附页纳入事故材料。工单完成时间早于正式核实，不能证明许守成曾安全离开。凌晨每次提前的报修，指向这段始终被推迟的复核；它没有改变2019年发生的事，也没有制造另一次可以重来的现场。', [{ id: 'collect-radio', label: '记录：00:47的联络与缺页', next: 'inspection', collect: 'last-radio' }], { excludesEvidence: ['last-radio'] }),
    rescueIndex: node('dialogue', 14, '陈阿姨的口述、邻居留下的讣告与H13旁路附页，都指向同一晚。改造后被删除的13号并非不存在的居民：她和外孙从进水的旧屋里出来，后来住进了安置房。许守成借杨婶绿布缠边的梯子，通过未登记应急旁路参与救援。那些人确实获救，不能因为手续缺失就从经过里删掉。', [next('rescue-note', '将证词与原始附页相互核对', 'rescueRecord')]),
    rescueRecord: node('evidence', 16, '老周当时离开监护位置去疏散住户，许守成随后返回检查进水旧线，在未被完整确认的停电边界内遇险死亡。救援需要、旁路未登记、边界混乱与监护缺位叠在同一次事故里。现有材料支持这个经过，具体责任仍需独立复核；不能把他的死亡写成没有缘由的宿命，更不能拿获救的人证明风险合理。', [{ id: 'collect-rescue', label: '记录：被删除的获救住户', next: 'inspection', collect: 'rescue-testimony' }], { excludesEvidence: ['rescue-testimony'] }),
    permitIndex: node('dialogue', 14, '你让现场同事读回当前隔离记录。居民使用的是后来经核验的正常线路，旧旁路的来源、完整走向与处置过程仍有缺口。图上的五点靠人的路线相连，不意味着这些旧设备现在可以连成电气回路。任何“试一下就知道”的建议，都得先回答电从哪里来、会到哪里去。', [next('permit-note', '保留已知线路与未知旁路的分界', 'permitRecord')]),
    permitRecord: node('evidence', 16, '隔离边界没有因故事讲清楚就失效。你在C00附件里明确：正常供电按已核验范围保持，未明支路继续隔离，后续现场核查另行办理。许守成的名字不是送电许可，他曾救过人也不是重走一次危险边界的理由。今夜可以完成的，是记录交回，而非未知电源的试送。', [{ id: 'collect-permit', label: '记录：仍然有效的隔离边界', next: 'inspection', collect: 'isolation-boundary' }], { excludesEvidence: ['isolation-boundary'], scene: { background: '/art/control-room.webp', document: { title: 'C00 · 现状边界', lines: ['经核验住宅支路：保持正常供电', '未登记旧旁路：来源、走向、处置待核', '未知支路：继续隔离，不做试送电', '事故记录交回 ≠ 现场送电许可'] } } }),
    namesIndex: node('dialogue', 14, '新台账把旧住户迁出，却没有保留他们曾在这片服务范围里获救的关系。汇总卷没有许守成完整的作业关系：一些未归档附页仍有他的签名，一些移交栏被涂空。你和管理员逐项恢复原始服务户与材料的对应，保留现有安置地址，不把已经往前走的生活重新锁进七年前的门牌。', [next('names-note', '为每份材料指定真实接收人', 'namesRecord')]),
    namesRecord: node('evidence', 16, '恢复清册同时留下原件、更正依据与今天的日期。许家说明、住户回访、责任复核、旧线核查分别写明接收部门与联系人，不能用一个笼统“完成”吞掉所有未完事项。你给许守成的那一栏补上姓名与参与事项，没有为他伪造一个回所时间。他没有回来，但记录可以回来。', [{ id: 'collect-names', label: '记录：名字与接收人的恢复清册', next: 'inspection', collect: 'restored-register' }], { excludesEvidence: ['restored-register'] }),
    reassemble: node('dialogue', 25, "地图说明路线，录音说明时刻，证词与附页说明救援，隔离报告说明当前边界，清册说明资料去向。季宁逐份读回：“我不能用其中一份，替另外四份签完成。”我点头，她把未核实处留空，却给后续接收岗位逐一写了名字。", [next('route', '按图例匹配五个点的路线', 'puzzleRoute')], { requiresEvidence: requiredEvidence, speaker: "季宁", portrait: "ji", expression: "concerned" }),
    puzzleRoute: node('puzzle', 30, '原图要求：西侧临时服务户→西北巡查联络→东北旁路→东侧留灯等候→南侧工作票交回。已知H13在西、Q07在西北、R02在东北、L03在东、N04在南。选择正确的核对顺序，并说明这条线的性质。', [next('power', 'H13→N04→L03→R02→Q07：沿旧设备依次合闸', 'routeReview'), next('memory', 'H13→Q07→R02→L03→N04：核对人员与资料的交接路线', 'routeMatched'), next('date', 'Q07→L03→H13→N04→R02：按编号大小恢复供电', 'routeReview')], { requiresEvidence: requiredEvidence, puzzle: { prompt: '匹配地点方位、编号含义和原图图例', hint: '虚线穿过不同供电分区。把五条章节线索放回各自对应的职责，而不是寻找合闸顺序。' } }),
    routeReview: node('dialogue', 30, '你指向两点之间，林岚将不同分区的实线画给你看。它们没有那样的供电关系。编号不是开关顺序：H13是户，Q07是第七接送等候点，关联联络与未完复核，R02是旁路，L03是留灯等候，N04是票。这次判断可以重做，现场没有因此收到任何送电指令。', [next('retry', '重看地图上的方位与图例', 'puzzleRoute')], { speaker: '林岚', portrait: 'lin', requiresEvidence: requiredEvidence, presence: "scene" }),
    routeMatched: node('dialogue', 34, "我与季宁按虚线读到 N04，停在原票交回的位置。H13到Q07是居民接送，R02是救援照明的记录，L03留着巡查等候，N04需要交回原件。C00接收的是事实和后续责任。路线跨不同供电分区，不向开关发指令；她在副本旁画下两个人的回程箭头。", [next('reconstruction', '按五份材料还原事故经过', 'reconstruction')], { speaker: "程砚（你）", portrait: "cheng", expression: "focused" }),
    reconstruction: node('dialogue', 37, "2019年10月11日，旧城改造清册漏了仍住在十三号的人。许守成借绿布缠边的梯子，将陈阿姨和外孙等住户救出，沿途使用独立电源供给的临时照明。后来他返回查看进水旧线，未能返程。获救的人迁入新生活，临时设施、接送和事故附页没有完整移交。", [next('electrician', '继续核对救援后的工作状态', 'electrician')]),
    electrician: node('dialogue', 40, "老周当年离开监护位置，没有落实替代监护或暂停安排；许守成在边界未确认的情况下返回旧线，叠加成严重风险。后来虚假确认完成、原票未交与附页被隐瞒，又妨碍追查。抢时间和救人背景都需要写清，任何背景也不能免去职责。具体原因和责任交正式独立复核。", [next('last', '确认那一夜没有可以重放的终点', 'lastMinute')]),
    lastMinute: node('dialogue', 43, "原班报与档案记载00:47为最后联络，许守成随后在返回检查阶段发生电气事故死亡。沈衡带获救住户平安返程，又生活了七年，今年因病去世。季宁把两个时间分开读回。灯、饭和纸灰能承载记忆，无法改变死亡；我们能做的是不再省略可查的经过。", [next('zhou', '请老周把自己的选择说清楚', 'oldZhou')], { speaker: "旧档核对 · 许守成", portrait: "xu", presence: "archive" }),
    oldZhou: node('dialogue', 46, "老周把今天的说明念完：“离岗是我，没核完就确认完成也是我。有人催关单，我会写明当时的联络，但不能拿催促把自己签的字擦掉。”季宁标出附件来源，不替他评价是否值得原谅。说明按日期接收，旧票上的缺字仍然看得见。", [next('households', '核对获救住户的后续经历', 'households')], { speaker: '老周', portrait: 'zhou' }),
    households: node('dialogue', 49, "季宁读回住户清册：陈阿姨与外孙迁入安置房，沈衡继续开过夜班后退休，杨桂梅住在长安里仍照看旧邻，陈伯保留门牌。她逐项注明核对来源，没有把获救的人编成一群死者。“十三户里有后来继续生活的人。”我让她把这句写进口述索引。", [next('family', '将确认经过与待查责任向许家区分', 'family')], { speaker: "季宁", portrait: "ji", expression: "neutral" }),
    family: node('dialogue', 52, '许家同意接收书面说明，暂时不参加现场会议。你们按他们的意愿寄送有编号的副本，注明哪些经过已得到互证，哪些责任仍待独立复核。老周没有要求转告“希望原谅”。这份说明不能把悲伤结案，也不该把许守成变成只用来装饰报告的英雄称号。', [next('boundary', '回到今夜需要决定的现场边界', 'permitBoundary')]),
    permitBoundary: node('dialogue', 55, "现场状态另由值班回报：正常网络稳定，R02关联的旧支路源端与完整走向仍待专项查明。会议室的资料已经汇齐，现场送电条件却没有因此变齐。季宁将“材料已接收”和“旧支路禁止并入”分别高亮，等我读回。纸面路线不能给未知设备解锁。", [next('choose', '作出最终的线路处理决定', 'puzzleBoundary')], { requiresEvidence: requiredEvidence, speaker: "程砚（你）", portrait: "cheng", expression: "focused" }),
    puzzleBoundary: node('puzzle', 59, '五份记录已经核对，旧旁路却仍没有可靠来源、完整走向与处置记录。最终闭合应发生在哪里？', [next('close', '闭合未知联络开关，让五个点真正通电成环', 'wrongClose'), next('separate', '已核验供电保持正常；未知支路继续隔离，在档案中完成交接', 'safePlan')], { requiresEvidence: requiredEvidence, puzzle: { prompt: '区分纸面交接与现场送电条件', hint: '所有名字齐全，也不会自动产生一份合格的送电许可。R02的来源与走向仍待核。' } }),
    wrongClose: node('ending', 59, '你把未核验的旧联络当作答案，发出合闸指令。保护随即动作，相关正常支路也受到影响；控制屏上的户号闪过旧编号，住户又回到停电里。现场人员撤回操作，林岚终止你的指令。你没让许守成回来，只让曾经救出的人再次承担了未知线路的风险。这个决定必须重做。', [next('retry', '撤回决定，重新确认隔离边界', 'puzzleBoundary')], { outcome: 'failure', requiresEvidence: requiredEvidence, visual: 'blackout', scene: { background: '/art/control-room.webp', inscription: '未知支路不具备送电条件' } }),
    safePlan: node('dialogue', 63, "季宁先读出我的处理意见：正常网络照常服务，未知支路维持既定隔离，产权方与专业队伍继续查源。相应值班岗位确认后续接收，林岚登记联络编号。她又读了一遍未完成事项，没有略过那个“未知”。本次没有试送电，现场执行仍依正式许可。", [next('archive', '决定怎样写入最后的事故接收单', 'puzzleArchive')], { speaker: "季宁", portrait: "ji", expression: "neutral" }),
    puzzleArchive: node('puzzle', 67, 'C00接收单需要保存什么？原票存在空白，老周签过虚假完成状态，服务户曾被删除，许家尚有未获答复的问题。档案的闭合怎样才不是再次把事情盖住？', [next('erase', '删掉住户与旁路细节，写“意外已处理”，不再追问责任', 'wrongErase'), next('restore', '保留原件与更正日期，恢复每个人的名字，分别签收后续责任', 'register')], { requiresEvidence: requiredEvidence, puzzle: { prompt: '让记录有终点，也让未完事项可继续追问', hint: '闭合交接不等于所有问题已经解决。名字、事实、缺口与明确接收人必须同时留下。' } }),
    wrongErase: node('ending', 67, '一份整洁报告替所有人写了“已经处理”。13号再次从名单消失，许守成又只剩“意外死亡”，老周的签字被一层新纸遮住。办公室的灯没有立刻熄灭，档案目录却又多出一个没有接收人的附件。你重复了最初的删除，下一次报修将仍然找不到那个被问的人。', [next('retry', '撤回覆盖，保留原件与真实责任', 'puzzleArchive')], { outcome: 'failure', requiresEvidence: requiredEvidence, scene: { background: '/art/control-room.webp', inscription: '空白不能以删除填补' } }),
    register: node('dialogue', 71, "C00第一页列原件编号与来源，第二页列核实的姓名、更正依据和今天的接收人。季宁把2019年的空白保留下来，管理员接收原件，独立复核岗位接收责任材料，家属与住户回访各有去向。她没让“后面再补”单独留在任何一栏。", [next('readback', '逐项读回接收内容', 'readback')], { requiresEvidence: requiredEvidence, speaker: "季宁", portrait: "ji", expression: "neutral" }),
    readback: node('dialogue', 74, "季宁最后一次读回：许守成救人后返回检查阶段遇难；住户记录按依据恢复；旧旁路继续隔离；原完成状态和未交材料进入独立复核；家属说明由正式渠道接收。每一项都有人答“收到”。读到本轮抢修记录时，我说：“程砚，收到。”她才把笔盖合上。", [next('release', '确认现场与档案分别交接', 'release')], { speaker: "季宁", portrait: "ji", expression: "neutral" }),
    release: node('dialogue', 77, "现场值班报告在运网络稳定，旧支路隔离有效，封闭区查源仍开着。档案员确认原件归位，电子目录保留更正历史。季宁将两份回报分开保存。供电正常与材料接收各有核验依据，谁也不能替另一项作结；回访窗口继续保留。", [next('quiet', '查看旧异常点的回访反馈', 'quiet')]),
    quiet: node('dialogue', 80, '槐荫巷没有再出现空地址在线表，七夜报修的时间没有继续提前，拆迁区回送记录暂未新增。长安里的住户正在睡，南桥街的旧铁柜仍留着04号。你将回访窗口继续保留，不把今夜的安静写成一条放之四海皆准的驱除法。能够确认的是，这组被抹去的关系有了出处。', [next('mei', '接听杨婶的回访电话', 'mei')]),
    mei: node('dialogue', 83, '杨婶醒得早，问许师傅的名字是不是已经写回去了。林岚把接收编号念给她，她拿笔认真记了两遍。杨婶没有再问他几点回来，只问能否留一份复印件在楼里：“以后新搬来的人不知道那块反光胶带是谁贴的，也该知道这里有人认真走过。”', [next('shen', '确认沈棠已经收到送达凭据', 'shen')], { speaker: '杨桂梅', portrait: 'mei', scene: { background: '/art/stairwell.webp' }, visual: 'lamp' }),
    shen: node('dialogue', 85, '沈棠在消息里发来送达凭据，下面只有一句：父亲等过的人，终于在接送名单里有名字了。你看着这句话，知道不是所有欠下的东西都有等价的偿还。那顿留给夜班的饭没有等到许守成，但司机与未归的人不必再被同一句“任务结束”抹去。让证词留存，是活着的人可以真正做的事。', [next('zhou-return', '在供电所门口等老周', 'zhouReturn')], { speaker: '沈棠', portrait: 'shen' }),
    zhouReturn: node('dialogue', 88, '老周从控制室出来，手里只剩值班用的钥匙。他说以后回访还会来，责任复核需要什么也会交。他没有向你讨一句“当年也是没办法”。你们在门口站了一会儿，天还没亮，旧皮包轻了许多。人没有因此变得清白，至少不再把重量藏在别人找不到的夹层里。', [next('meal', '陪他回值班室坐一会儿', 'meal')], { speaker: '老周', portrait: 'zhou' }),
    meal: node('dialogue', 90, "值班室微波炉里热着早饭，季宁把两个饭盒放在桌上。“师傅，两份都算进去了。”我接过温水，让她先吃，值班交接已经有人接续。老周提起守成嫌凉馒头噎，林岚安静听着。空椅子前没有摆杯子，许守成留在可追问的记录和大家记得的日子里。", [next('archive-end', '查看C00正式归档状态', 'archiveEnd')], { scene: { background: '/art/dispatch.webp' }, speaker: "季宁", portrait: "ji", expression: "neutral" }),
    archiveEnd: node('dialogue', 92, 'C00显示“原始材料已接收，责任复核持续进行”，不是“无事发生”。许守成的名字连着工作、死亡与被救的人，也连着那些没来得及吃的早饭、贴过的胶带、借过的梯子。你没有把一段生活全变成事故说明，但至少让说明不再把那段生活删除。', [next('city', '打开门，看看恢复常态的旧城', 'city')]),
    city: node('dialogue', 94, '早班公交从南桥街驶过，车里有人靠窗补觉。长安里住户买菜，槐荫巷的门重新有人进出。旧城没有因为一份档案重写地貌，雨后的电线也还是需要日常巡查。你终于可以把这些普通声音听成普通声音，而不必每次都猜它是不是有人求着回家。', [next('next-network', '收下管理员送来的另一页索引', 'network')], { scene: { background: '/art/alley.webp' }, visual: 'alley', location: '供电所门口 · 天亮' }),
    network: node('dialogue', 96, "管理员找到一张旧供水改造索引，同年代也有空地址。季宁问是否仍由我们查，我请她按职责转给市政资料接收岗位，留下移交编号。它只是下一条值得核对的线索，不能推出全城设施都服从同一规则。我们先完成电网这轮交接，再等待相应部门的反馈。", [next('last-order', '完成今夜最后一次交接', 'lastOrder')]),
    lastOrder: node('dialogue', 98, "林岚问本轮工单结束语。季宁先读出初稿：已核验供电正常，未知支路保持隔离；原始材料接收，姓名与依据恢复，历史责任独立复核，后续事项各有接收人。我复核后签名，她签当班记录。句子很长，这一回没有缩成一行模糊的“全部完成”。", [next('finish', '结束《回路》第一部', 'end')], { speaker: "程砚（你）", portrait: "cheng", requiresEvidence: requiredEvidence, expression: "neutral" }),
    end: node('ending', 100, "第一部 · 闭合。\n\n七年前，许守成救出了旧城住户，在返回检查进水旧线时遇难。被删的姓名、未交的原票和虚假完成状态，如今连着来源与接收人回到档案。历史责任继续独立复核，家属得到可追问的说明，获救的人也保有后来真实走过的日子。\n\n未知支路仍隔离。天亮时，我与季宁将工具和当班工单一起交给接班同事。她先读回未完成事项，对方答“收到”。出了值班室，她叫我师傅，问今晚还去不去城区。我说：“按值班表，咱们一起。”", [{ id: 'restart', label: '重新调查终章《闭合》', next: 'dispatch', resetEvidence: true }], { outcome: 'complete', requiresEvidence: requiredEvidence, visual: 'ending', scene: { background: '/art/dispatch.webp', inscription: 'C00 · 名字已归档，未知支路未闭合' }, speaker: "季宁", portrait: "ji", expression: "neutral" })
  }
};
