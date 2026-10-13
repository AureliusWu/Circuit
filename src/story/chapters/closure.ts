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
  id: 'closure', order: 5, title: '闭合', subtitle: "终章 · 请勿闭合",
  synopsis: "五处旧记录终于摊到同一张桌上。救援经过能查清，缺页与虚假完成能找到出处，旧席位却仍在00:47等待一次没有人发出的答复。",
  entryNode: 'dispatch', requiredEvidence,
  clue: { code: 'C00', title: "C00原件接收", detail: "五处材料互证许守成救人后回查旧线遇难，以及后来的漏登、缺页与虚假完成。原件、今日说明和后续职责分别接收，未知源端继续隔离。旧请求暂时停止，未能确认发送者。", x: 33, y: 82 },
  evidence: {
    'five-point-map': { title: '五点应急路线图', detail: "原图灰虚线依次标H13临时服务户、Q07接送联络、R02应急照明、L03巡查等候、N04原票交回。它是资料与人员核对路线，跨不同供电分区；编号顺序不是事故发生的时间顺序。" },
    'last-radio': { title: '00:47的联络与缺页', detail: "原索引、班报与巡查材料互证2019年10月11日00:47最后联络。后续返回记录与七日复核有缺页，完成状态早于正式核实；Q07现存旧队列沿用等待超时，未定位当夜新通知的实际来源。" },
    'rescue-testimony': { title: '被删除的获救住户', detail: '13号陈阿姨与外孙等住户被救出，许守成使用独立供电的临时救援照明与绿布缠边梯子。老周离开监护位置去疏散，许守成回查进水旧线时死亡。获救人的证词与现场附页互相印证，死亡不是一次可以重放的开关操作。' },
    'isolation-boundary': { title: '仍然有效的隔离边界', detail: '已核验的住宅线路与未登记旧旁路必须分别处理。旧旁路缺少可靠来源、完整走向与处置记录，不具备送电条件；归档或道歉均不能替代现场核验与许可。' },
    'restored-register': { title: '名字与接收人的恢复清册', detail: '许守成、陈阿姨与外孙、相关住户和原交接责任人逐项恢复到事故档案。保留原始缺页与更正日期，家属说明、独立复核、住户回访分别有人接收，不能假造七年前的完成记录。' }
  },
  nodes: {
    dispatch: node('dialogue', 2, "今晚没有新停电，我们按值班安排来核旧城资料，现场另有班组接续。林岚挂好五点图，季宁将回执摊到桌上。\n老周带来剩余原件，责任材料由独立岗位接收。\n“这次不用等它报修？”季宁问。\n林岚指着终端。旧席位已经开着，状态是待回所。", [next('summon', '确认本次事故核查的范围', 'summon')], { speaker: '林岚', portrait: 'lin', time: '23:40', scene: { background: '/art/dispatch.webp' }, location: "梧城电网 · 旧城技术核对室", presence: "scene" }),
    summon: node('dialogue', 4, "获准范围是原图、救援附件、删户与交接记录。事故原因和责任交正式独立复核，现场未知线仍隔离。\n我核好调阅单，季宁给今天的材料另起索引。\n墙上的钟快到零点，她把设备时标对了一遍。\n“00:47之前能看完吗？”\n“按页来。”\n老周在旁边把自己的手表摘了。", [next('door', '进入原始档案保存区', 'archiveDoor')], { speaker: "程砚（你）", portrait: "cheng", expression: "focused" }),
    archiveDoor: node('dialogue', 6, "管理员按权限开柜，普通钥匙，普通锁。柜门一开，纸箱里却有很重的雨衣味。\n季宁先拍目录和缺页标记，再登记借阅去向。\n她问有没有漏水，管理员说库房修过了，箱子今天才从另一间搬来。箱底是干的，最上面那张照片却有一道湿手指印，指着槐荫巷。", [next('bench', '建立并列核对的档案桌', 'archiveBench')], { speaker: "季宁", portrait: "ji", expression: "neutral" }),
    archiveBench: node('dialogue', 8, "H13、Q07、R02、L03、N04分成五套，今天的接收单另写C00。\n季宁将原空白拍好，更正日期填今天。她做这些已经不用我提醒。\n我看了一眼她第一次出车那页，面汤渍还在文件夹名下面。她翻过去，把旧席位窗口缩到边上，没关。", [next('investigate', '核对地图、联络、救援、隔离与清册', 'inspection')], { speaker: "季宁", portrait: "ji", expression: "neutral" }),
    inspection: node('investigation', 12, "原图查路线，联络查时刻，证词查救援，隔离报告查现场，清册查每份材料该落在哪里。\n五套都要与原件对，不靠前几夜的记忆往空格里填。\n季宁将照片、录音和纸张分开编号。电台开着，正常网络的回报偶尔进来，那个旧席位始终没响。", [
      { id: 'map', label: '对照五个编号与原图图例', next: 'mapIndex', hidesWhenCollected: 'five-point-map' },
      { id: 'radio', label: '核对00:47联络与七日复核', next: 'radioIndex', hidesWhenCollected: 'last-radio' },
      { id: 'rescue', label: '核对获救人证词与旁路附页', next: 'rescueIndex', hidesWhenCollected: 'rescue-testimony' },
      { id: 'permit', label: '复查现存支路的隔离边界', next: 'permitIndex', hidesWhenCollected: 'isolation-boundary' },
      { id: 'names', label: '恢复被删去的名字与接收栏', next: 'namesIndex', hidesWhenCollected: 'restored-register' },
      { id: 'assemble', label: '将五项证据并列复核', next: 'reassemble', requiresEvidence: requiredEvidence }
    ], { objective: { title: '准备完整的事故交接', detail: '取得五条本地证据，再完成路线、送电边界与归档选择。' }, scene: { background: '/art/control-room.webp', hotspots: [{ id: 'map', actionId: 'map', label: '旧城原图', x: 17, y: 41 }, { id: 'radio', actionId: 'radio', label: '联络索引', x: 36, y: 76 }, { id: 'rescue', actionId: 'rescue', label: '证词与附页', x: 51, y: 60 }, { id: 'permit', actionId: 'permit', label: '隔离记录', x: 75, y: 42 }, { id: 'names', actionId: 'names', label: '恢复清册', x: 81, y: 77 }] } }),
    mapIndex: node('dialogue', 14, "原图实线是配电关系，灰虚线是人员巡查、救援和资料交回路径。五个编号落在虚线上，实线分属不同供电区。\n后来的电子图只留设备，人员与服务户标记没带过来。\n季宁拿两张图对边角，R02墙后的转弯终于接上了。接的是一条旧巷子，今天那段已经封死。", [next('map-note', '记录路线顺序与图例', 'mapRecord')]),
    mapRecord: node('evidence', 16, "季宁给副本补图例，原图不改。R02照明用独立临时电源，五个点不能拼成一根城市导线。\n“也不能照这圈顺序说哪件事先发生。”她补一句。\n我对了00:17、00:31和00:47，果然得另排时序。她在虚线旁写资料核对路径，又留好原页索引。", [{ id: 'collect-map', label: '记录：五点应急路线图', next: 'inspection', collect: 'five-point-map' }], { excludesEvidence: ['five-point-map'], scene: { background: '/art/control-room.webp', document: { title: '旧应急路线 · 原图图注', lines: ['实线：配电线路；灰虚线：人员与资料路线', '西 H13 · 临时服务户', '西北 Q07 · 巡查联络', '东北 R02 · 应急旁路', '东 L03 · 留灯等候', '南 N04 · 工作票交回'] } }, speaker: "季宁", portrait: "ji", expression: "neutral" }),
    radioIndex: node('dialogue', 14, "Q07索引与班报都记2019年10月11日00:47。巡查材料能对上许守成仍在现场，没完成回所交班。\n录音后半段不齐，我们不靠一声杂音给他添一句遗言。\n季宁重听获准片段，三声钥匙碰栏杆之后，有一段长到不像普通呼吸的空白。文件本身没有断开。", [next('radio-note', '核对00:47之后的记录缺口', 'radioRecord')]),
    radioRecord: node('evidence', 16, "下一页应有处置与返回，页码缺了；七日复核也没带原票附页。完成状态早于核实，证明不了许守成离开过。\n季宁将原页与迁移记录并列。旧队列沿用了等待超时，近几夜才有新提醒。\n“旧名单能解释它认谁。”她说，“今天是谁又按了发送，还没有。”", [{ id: 'collect-radio', label: '记录：00:47的联络与缺页', next: 'inspection', collect: 'last-radio' }], { excludesEvidence: ['last-radio'] }),
    rescueIndex: node('dialogue', 14, "陈阿姨口述、邻里讣告与H13附页对上同一夜。她和外孙确实从进水旧屋出来，后来住进安置房。\n许守成借缠绿布的梯子，沿独立供电的临时照明救人。\n管理员拿来获准使用的旧照片，梯子就在墙边，绿布一头垂在水里。图旁有人写了两个人的新地址。", [next('rescue-note', '将证词与原始附页相互核对', 'rescueRecord')]),
    rescueRecord: node('evidence', 16, "老周离开监护位置去疏散，没有落实替代或暂停；许守成又返回查进水旧线，在边界未完整确认的阶段遇难。\n救援记录和附页能互证这段经过，具体事故原因与责任继续独立复核。\n季宁圈住第二次返回的索引。第一次送人出去有多个记录，第二次只剩最后联络。", [{ id: 'collect-rescue', label: '记录：被删除的获救住户', next: 'inspection', collect: 'rescue-testimony' }], { excludesEvidence: ['rescue-testimony'] }),
    permitIndex: node('dialogue', 14, "现场同事读回：正常网络稳定，旧支路隔离有效，封闭区源端还没定位。\n我将当前状态放到桌边，原图压在另一侧。\n季宁看旧图那条圈，又看现在的断开边界。\n“纸能连到一起，线还是断着。”\n“对。”\n我记下回报人的名字，这份不跟原事故票合并。", [next('permit-note', '保留已知线路与未知旁路的分界', 'permitRecord')]),
    permitRecord: node('evidence', 16, "C00附件写清当前边界和后续查源岗位，已核验住宅照常供电，未知段不做试送。\n管理员收走一份副本，现场记录继续留在工单里。\n季宁拍完隔离页，旧席位忽然闪了一下，像收到操作申请。她检查发送记录，今晚谁都没发过。我们将那一下的时标也留下。", [{ id: 'collect-permit', label: '记录：仍然有效的隔离边界', next: 'inspection', collect: 'isolation-boundary' }], { excludesEvidence: ['isolation-boundary'], scene: { background: '/art/control-room.webp', document: { title: 'C00 · 现状边界', lines: ['经核验住宅支路：保持正常供电', '未登记旧旁路：来源、走向、处置待核', '未知支路：继续隔离，不做试送电', '事故记录交回 ≠ 现场送电许可'] } } }),
    namesIndex: node('dialogue', 14, "迁出表删去旧户关联，汇总卷漏掉许守成的完整作业关系，原附页却还有签名。管理员按来源恢复对应，住户的新地址保留。\n季宁核到陈家外孙，原清册只有孩子，现有联系材料已经是成年人。\n“七年啊。”她说。\n老周低头翻说明，没有接她这句话。", [next('names-note', '为每份材料指定真实接收人', 'namesRecord')]),
    namesRecord: node('evidence', 16, "原件、更正依据和今日日期分别列好。家属说明、住户回访、责任复核与旧线核查都有接收岗位。\n许守成那栏记实际作业和死亡经过，没有补回所时间。\n季宁写到未返程，笔停了。终端侧窗也跳出这三个字，几秒后消失。她看了看自己刚写的纸，继续核下一栏。", [{ id: 'collect-names', label: '记录：名字与接收人的恢复清册', next: 'inspection', collect: 'restored-register' }], { excludesEvidence: ['restored-register'] }),
    reassemble: node('dialogue', 25, "五套对齐。迁出表提前写空，附页没交，工作又未经核完确认完成。原图保留的路线，在后来的系统里被拆成互不相干的点。\n季宁将每个判断连回来源，没证实的另画虚线。\n我看了她一遍：“按图例再走一次。”\n她从H13开始，没去碰旧席位窗口。", [next('route', '按图例匹配五个点的路线', 'puzzleRoute')], { requiresEvidence: requiredEvidence, speaker: "季宁", portrait: "ji", expression: "concerned" }),
    puzzleRoute: node('puzzle', 30, "副本上标着西H13、西北Q07、东北R02、东L03、南N04。灰虚线依这个次序核人员与资料，实线另属各供电区。\n我们要选的是原图核对路径，不是合闸次序，也不是事故时序。\n季宁把图例压在最上面，五份档案还在桌上，编号一个没少。", [next('power', 'H13→N04→L03→R02→Q07：沿旧设备依次合闸', 'routeReview'), next('memory', 'H13→Q07→R02→L03→N04：核对人员与资料的交接路线', 'routeMatched'), next('date', 'Q07→L03→H13→N04→R02：按编号大小恢复供电', 'routeReview')], { requiresEvidence: requiredEvidence, puzzle: { prompt: "按原图图例，选择资料与人员的核对路径", hint: "五点在灰虚线上，实线跨不同供电区。各事件的实际时刻需要另排。" } }),
    routeReview: node('dialogue', 30, "林岚沿我选的两点画出实线，分区对不上。\n“H13是户，Q07是接送等候点，R02是临时照明，L03是巡查等候，N04是原票交回。”\n她将图例移近。现场没收到操作指令，只是我们在桌上排错了路线。季宁把那段连线擦掉，纸底原虚线仍在。", [next('retry', '重看地图上的方位与图例', 'puzzleRoute')], { speaker: '林岚', portrait: 'lin', requiresEvidence: requiredEvidence, presence: "scene" }),
    routeMatched: node('dialogue', 34, "H13、Q07、R02、L03、N04。季宁读到原票交回位置就停了，C00接收这五处材料与当前后续职责。\n“它画的是让人和纸走一遍。”\n我点头，再将实际时刻另排。\n她在副本旁补了今夜回程箭头，箭头只到值班室。旧席位的待回所还亮着。", [next('reconstruction', '按五份材料还原事故经过', 'reconstruction')], { speaker: "程砚（你）", portrait: "cheng", expression: "focused" }),
    reconstruction: node('dialogue', 37, "2019年10月11日，旧城清册漏了还住在十三号的陈家。许守成借梯子救出住户，沿途使用独立电源的临时照明。\n获救者由沈衡接走，许守成再次返回查进水旧线，没能返程。\n季宁把进屋、救人、返回分成三项，后续那一项连着00:47和事故记录。", [next('electrician', '继续核对救援后的工作状态', 'electrician')]),
    electrician: node('dialogue', 40, "老周离岗没有落实替代或暂停，旧线停电边界未确认，风险叠在返回检查阶段。后来没核完确认完成，原票未交、附页未归，又把可追查的经过拆开了。\n季宁给自己的推断留了出处，原因和责任仍交独立复核。\n老周核到自己的签字，说这一笔没认错，就是他写的。", [next('last', "核对许守成与沈衡的两条时间线", 'lastMinute')]),
    lastMinute: node('dialogue', 43, "00:47是许守成的最后联络。随后电气事故致死，原班报与档案能对上。沈衡当夜带住户返程，之后又生活七年，今年因病去世。\n两次死亡分开，获救的人有后来的生活。\n季宁问旧通知为什么最近又开始催。\n我看向那张待回所：“先查它沿用了谁的请求。”", [next('zhou', "核对老周今日提交的说明", 'oldZhou')], { speaker: "旧档核对 · 许守成", portrait: "xu", presence: "archive" }),
    oldZhou: node('dialogue', 46, "老周念今日说明：离岗是自己，未经核完确认完成也是自己，催关单的联络按记得和有记录的分别写。\n念完，独立复核岗位收下，原票空白照旧保留。\n“以前总想别提了。”他说。\n季宁核页码，没有替他接话。窗外起风，库房门轻轻碰了一下，管理员把门挡挪过去。", [next('households', '核对获救住户的后续经历', 'households')], { speaker: '老周', portrait: 'zhou' }),
    households: node('dialogue', 49, "陈阿姨与外孙迁入安置房，沈衡后来继续开夜班，杨婶住长安里，陈伯还保管旧门牌。来源一项项列出来，没人凭一块门牌被写成死者。\n季宁翻到最近的住户回访，几人都说记得那个抢修员。\n旧清册的十三号下却没有他，他始终在作业人栏里。", [next('family', '将确认经过与待查责任向许家区分', 'family')], { speaker: "季宁", portrait: "ji", expression: "neutral" }),
    family: node('dialogue', 52, "许家愿意收书面说明，暂不参加会议。回访岗位按他们意愿正式递送有编号副本，区分已互证经过和待核责任。\n老周没附别的话，只核自己那份说明。\n季宁封好袋子，忽然问是不是少了一页。\n管理员重数，页码都齐，她自己也重数一遍，才把袋口压平。", [next('boundary', '回到今夜需要决定的现场边界', 'permitBoundary')]),
    permitBoundary: node('dialogue', 55, "现场又报正常网络稳定，R02关联旧段仍隔离，源端和完整走向继续专项核查。\n季宁把材料接收与现场状态分开读回。\n旧席位却自动打开验收预览，执行人许守成，监护栏空。\n我让她保存报文，别关窗口。纸都齐了，那张表仍像在等我们替它补字。", [next('choose', '作出最终的线路处理决定', 'puzzleBoundary')], { requiresEvidence: requiredEvidence, speaker: "程砚（你）", portrait: "cheng", expression: "focused" }),
    puzzleBoundary: node('puzzle', 59, "五套记录已核，旧旁路没有可靠源端和完整走向，现场隔离仍有效。旧席位的验收预览不是现行许可。\n这次要决定的是当前线路处置。\n我看向回报单，值班同事还在线。纸上的圈已经能说明经过，现场却没多出一个允许合闸的条件。", [next('close', "提出闭合旧联络，沿五点验证未知回路", 'wrongClose'), next('separate', "维持现场隔离，另完成原件接收", 'safePlan')], { requiresEvidence: requiredEvidence, puzzle: { prompt: "原件齐了，现场是否已具备闭合旧段的条件？", hint: "当前回报仍写源端与完整走向未明。旧席位预览没有替代现行许可。" } }),
    wrongClose: node('ending', 59, "我提出闭合旧联络，现行值班岗位退回，现场没有执行。\n旧席位却显示申请已受理。五个户号沿屏幕依次亮起，最后是C00，执行栏多出程砚。\n季宁从原始发送记录确认没有操作指令，保存异常预览。\n我们撤回建议，那张表仍往下滚，监护栏正等另一个名字。", [next('retry', '撤回决定，重新确认隔离边界', 'puzzleBoundary')], { outcome: 'failure', requiresEvidence: requiredEvidence, visual: 'blackout', scene: { background: '/art/control-room.webp', inscription: '未知支路不具备送电条件' } }),
    safePlan: node('dialogue', 63, "季宁读出方案：正常网络照常，旧段维持隔离，产权方和专业队伍继续查源。相应值班岗位确认接续，林岚记联络编号。\n她没跳过未知源端那行，我复核签当班意见。\n旧验收预览还在，没有变成真实工作票。她把窗口缩回侧边，原始报文另存。", [next('archive', '决定怎样写入最后的事故接收单', 'puzzleArchive')], { speaker: "季宁", portrait: "ji", expression: "neutral" }),
    puzzleArchive: node('puzzle', 67, "C00接收原件与今日说明，旧票还有空白，老周签过虚假完成，住户关联也曾被删。\n若只写一行已处理，刚找回的五处又只剩五个编号。\n管理员等我们确认交件清单，季宁将原页顺序递过去。后续复核、查源与回访都还开着，需要各自接收。", [next('erase', '删掉住户与旁路细节，写“意外已处理”，不再追问责任', 'wrongErase'), next('restore', "保留原件、缺页与更正日期，分别接收后续事项", 'register')], { requiresEvidence: requiredEvidence, puzzle: { prompt: "C00接收单怎样保留五处已经查出的差异？", hint: "原件和今日说明分别收，旧缺页与虚假完成保留，当前查源和回访另接续。" } }),
    wrongErase: node('ending', 67, "我用意外已处理盖住细节。整洁的新报告送出，附件目录却又少了H13住户和N04原票关联。\n旧席位立即出现等待超时，时刻回到00:47。\n季宁拿着原清单去核，资料仍在，电子关系却与2019年的迁移结果一模一样。\n我们保存差异，撤回覆盖，原件还没有交错。", [next('retry', '撤回覆盖，保留原件与真实责任', 'puzzleArchive')], { outcome: 'failure', requiresEvidence: requiredEvidence, scene: { background: '/art/control-room.webp', inscription: "00:47 · 等待超时" } }),
    register: node('dialogue', 71, "C00第一页列来源和原件编号，第二页列核实姓名、更正依据和今日接收人。旧空白拍好保留，档案收原件，独立复核收责任说明，其余事项分别接续。\n季宁逐项勾选，管理员逐页点收。\n她把最后半页单列时，侧窗的待回所忽然灭了，电台传来一小段雨声。", [next('readback', '逐项读回接收内容', 'readback')], { requiresEvidence: requiredEvidence, speaker: "季宁", portrait: "ji", expression: "neutral" }),
    readback: node('dialogue', 74, "季宁读完救援经过、原票缺页、虚假完成和当前隔离，各接收岗位都答收到。\n读到本轮现场记录，我报程砚，收到。\n旧席位也响了一下。\n不是人声，是两短一长，像钥匙碰栏杆。季宁没替它回话，将本地接收记录与那段声音分别保存。", [next('release', '确认现场与档案分别交接', 'release')], { speaker: "季宁", portrait: "ji", expression: "neutral" }),
    release: node('dialogue', 77, "在运网络稳定，旧段隔离有效，封闭区仍待查源。档案原件归位，目录保留更正历史，家属材料按正式渠道递送。\n季宁分别核现场和收件回报，没把两项缩成一行完成。\n我问她数过几遍纸。\n“三遍。”\n她看了一眼侧窗，“这次没有少半页。”", [next('quiet', '查看旧异常点的回访反馈', 'quiet')]),
    quiet: node('dialogue', 80, "H13空地址提醒没新增，Q07不再提前，R02回送暂时没新记录，L03住户已经休息，N04仍留回访。\n这些都是截止当前的反馈，后续窗口还开着。\n季宁看原始事件流，最后一项没有用户号，也没有故障类型。\n状态只写了一句：本班已接。发送者仍是旧席位。", [next('mei', '接听杨婶的回访电话', 'mei')]),
    mei: node('dialogue', 83, "杨婶醒得早，问L03那页是不是收了。林岚报编号，她在电话那端写了两遍。\n“灯没再亮，后门也没再响。”\n她问能不能留一份复印件，林岚说明取得方式。电话快挂时，杨婶又叫住我们：昨晚那张旧椅子底下，有人落了一点泥，自己还没扫。", [next('shen', '确认沈棠已经收到送达凭据', 'shen')], { speaker: '杨桂梅', portrait: 'mei', scene: { background: '/art/stairwell.webp' }, visual: 'lamp' }),
    shen: node('dialogue', 85, "沈棠发来材料送达凭据，说接送名单已经有许守成的名字，未返程仍留着。母亲今早没再摆制服。\n季宁问门槛灰后来怎样，沈棠回了一张照片：已经扫干净。\n紧接着又来一句，不是她扫的。\n母亲说一早起来就这样，饭碗也挪回了原来的柜子里。", [next('zhou-return', '在供电所门口等老周', 'zhouReturn')], { speaker: '沈棠', portrait: 'shen' }),
    zhouReturn: node('dialogue', 88, "老周从核对室出来，皮包空着，只剩今天值班钥匙。独立复核需要的材料他会继续交，回访也等正式安排。\n他在门口摸了两次内袋。\n“习惯了。”\n我没接话。季宁走在后面，忽然回头。库房灯已关，门玻璃里像还坐着一个人，手边没有红夹。", [next('meal', '陪他回值班室坐一会儿', 'meal')], { speaker: '老周', portrait: 'zhou' }),
    meal: node('dialogue', 90, "值班室热着早饭，季宁端来两个饭盒，先把一个推给我。\n“这回能吃了吧？”\n我看了眼电台，没有新工单。\n“吃。”\n她立即掀盖，发现筷子忘拿，又站起来。老周说许守成也总这样，饭带了，筷子不带。林岚翻开抽屉，里面只有三副，我们今晚正好三个人。", [next('archive-end', "核对C00与旧席位的当前状态", 'archiveEnd')], { scene: { background: '/art/dispatch.webp' }, speaker: "季宁", portrait: "ji", expression: "neutral" }),
    archiveEnd: node('dialogue', 92, "C00显示原始材料已接收，责任复核继续。\n那晚发生了什么、谁改过完成状态、哪几份纸没交，都有了可往下查的出处。近几夜的新提醒、纸上多出的笔画与未知回流，却还没找到来源。\n季宁关掉验收预览，旧席位消失了。系统没有显示卸载或停用，就像窗口本来没开过。", [next('city', "离开值班室", 'city')]),
    city: node('dialogue', 94, "早班公交经过南桥街，车里有人靠窗补觉。粉面店掀起卷闸门，老板先把湿凳子擦了，才招呼人坐。\n雨后的架空线还滴水，城区今天照旧有日常巡查。\n我和季宁走到车旁，她伸了个懒腰，问下午还要不要查图。我说看值班安排，她终于没有再翻平板。", [next('next-network', "查看管理员找到的另一份旧索引", 'network')], { scene: { background: '/art/alley.webp' }, visual: 'alley', location: '供电所门口 · 天亮' }),
    network: node('dialogue', 96, "管理员追出来，给我们看另一张旧索引，同年代供水改造也有一处空地址。\n我让他按职责交市政资料接收岗位，留移交编号，我们先核完电网这班。\n季宁拍到索引角落：施工单位写梧城，地址栏却只剩一个回字。\n她抬头问管理员是哪年补的。他说从没补过。", [next('last-order', '完成今夜最后一次交接', 'lastOrder')]),
    lastOrder: node('dialogue', 98, "交班前，季宁读今天完成与未完成的项目，接续班逐项答收到。我复核后签当班记录，工具和工单一并交过去。\n她把记录册收进包，走到门口又折回来，拿忘在桌上的水杯。\n电台很安静。墙上的钟已经指向天亮，旧班报照片里的钟，仍停在00:47。", [next('finish', '结束《回路》第一部', 'end')], { speaker: "程砚（你）", portrait: "cheng", requiresEvidence: requiredEvidence, expression: "neutral" }),
    end: node('ending', 100, "第一部 · 闭合。\n\n七年前，许守成救出十三号住户，返回查进水旧线时遇难。老周离岗、虚假确认完成，原票未交，住户关联和附页在汇总迁移中失散。原件现已接收，责任继续独立复核，未知源端仍隔离。\n\n我们交完班，季宁问今晚去哪片城区。我说按值班表。\n她刚转身，我的手机响了。\n一张没有发单人的回访单，地址空白，预计到场00:47。\n随队人员：程砚、季宁。\n我将它留给值班核查，没点接单。\n屏幕却自己跳到下一页。\n维修未到场。", [{ id: 'restart', label: '重新调查终章《闭合》', next: 'dispatch', resetEvidence: true }], { outcome: 'complete', requiresEvidence: requiredEvidence, visual: 'ending', scene: { background: '/art/dispatch.webp', inscription: "C00 · 请勿闭合" }, speaker: "季宁", portrait: "ji", expression: "neutral" })
  }
};
