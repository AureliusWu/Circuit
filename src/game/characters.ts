export type CharacterId = 'cheng' | 'ji' | 'lin' | 'zhou' | 'mei' | 'xu' | 'chen' | 'shen';
export type CharacterExpression = 'neutral' | 'focused' | 'concerned';
export type CharacterPresence = 'scene' | 'radio' | 'archive';

export type CharacterProfile = {
  id: CharacterId;
  name: string;
  age: string;
  role: string;
  tag: string;
  bio: string;
  duty: string;
  portraits: Partial<Record<CharacterExpression, string>> & { neutral: string };
  chibi: string;
};

const portrait = (id: CharacterId) => '/art/portraits/' + id + '.webp';
const chibi = (id: CharacterId) => '/art/chibi/' + id + '.webp';

export const CHARACTERS: readonly CharacterProfile[] = [
  {
    id: 'cheng', name: '程砚', age: '32 岁', role: '梧城电网 · 城区抢修员', tag: '主角 / 师傅',
    bio: '在梧城电网干了九年，调来城区抢修班两年。熟悉旧城线路，话不多，也会随口吐槽。夜班饭点经常接到工单，习惯看原始记录再下结论。今夜那碗泡面刚加好水，槐荫巷的电话就来了。',
    duty: '承担获准范围内的现场排查，向工作负责人报告边界和风险；带季宁核对记录、练习判断。未知来源的线路交由专责人员复核。',
    portraits: { neutral: portrait('cheng'), focused: '/art/portraits/cheng-focused.webp' }, chibi: chibi('cheng')
  },
  {
    id: 'ji', name: '季宁', age: '23 岁', role: '梧城电网 · 跟班抢修员', tag: '固定队友 / 徒弟',
    bio: '入班八个月，完成岗位培训后跟程砚出车。随身带平板和防水记录册，记时刻、对图纸，也惦记夜班什么时候能吃饭。遇到说不通的地方会继续追问，师傅写错了，她也会拦下来。',
    duty: '负责获准的现场记录、终端核对、照片索引和住户联络。在师傅及工作负责人指导下参与排查，不独立操作未知开关，也不单独承担专责监护。',
    portraits: { neutral: portrait('ji'), concerned: '/art/portraits/ji-concerned.webp' }, chibi: chibi('ji')
  },
  {
    id: 'lin', name: '林岚', age: '30 岁', role: '配电运检中心 · 值班联络', tag: '工单 / 通讯',
    bio: '负责值班联络与工单跟踪，熟悉旧城资料，也熟悉新系统卡在哪一步。说话直接，报编号很快，程砚和季宁大多在电台里听见她。最烦原因不明的重复工单，最近多了一个删不掉的旧席位。',
    duty: '联络调度、工作负责人和档案部门，核对事件时标与工单状态。送电许可和事故认定由相应岗位依职责办理。',
    portraits: { neutral: portrait('lin') }, chibi: chibi('lin')
  },
  {
    id: 'zhou', name: '老周', age: '50 岁', role: '城区抢修班 · 资深工作负责人', tag: '现场支援 / 旧事',
    bio: '程砚进班时的师傅，熟悉改造前的巷子。换过几件雨衣，内袋里那张折了四层的附页却一直带着。问到旧事故会停顿，听见H13编号时，下意识先按住口袋。',
    duty: '经值班安排加入现场，按职责组织和复核作业。涉及自己的历史记录须如实提交，接受独立复核；经验不能代替许可和监护。',
    portraits: { neutral: portrait('zhou'), focused: '/art/portraits/zhou-field.webp' }, chibi: chibi('zhou')
  },
  {
    id: 'mei', name: '杨婶', age: '60 岁', role: '长安里住户 / 槐荫巷旧邻', tag: '灯 / 门牌',
    bio: '本名杨桂梅，住长安里，偶尔回槐荫巷帮亲戚。票据放铁盒，巡查纸条放饼干盒，门牌改过几回也认得。记得借出去那把绿布梯子，给未归的人留灯时，也守着家里传下来的几个讲究。',
    duty: '提供可核对的住户口述和私人票据，由本人决定哪些材料可移交。住户的记忆不能替代电气测量。',
    portraits: { neutral: portrait('mei') }, chibi: chibi('mei')
  },
  {
    id: 'xu', name: '许守成', age: '35 岁 · 2019 年档案', role: '旧城抢修员 / 档案人物', tag: '旧照 / 附页',
    bio: '戴方框眼镜，口袋里有笔，写字最后一笔常拖出格线。夜巡回程习惯用钥匙碰栏杆，两轻一重。2019年救出住户后回查旧线遇难，画面来自旧照片，近几夜听见的响声还没有确认来源。',
    duty: '以原件、证词和历史录音呈现。现场异常与历史事实分别核对，事故原因和责任留给正式调查。',
    portraits: { neutral: portrait('xu') }, chibi: chibi('xu')
  },
  {
    id: 'chen', name: '陈伯', age: '60 岁', role: '城南拆迁区 · 看守人', tag: '旧图 / 钥匙',
    bio: '城南拆迁区的看守人，帽檐压得低，旧钥匙还留十二把。记得住户搬去哪儿，也留着门牌筐和工具袋代管收条。女儿催他回家，他总说锁好门就走，可有时候，里面还会再响一下锁。',
    duty: '在管理权限内提供通行和档案线索，协助核对迁出名单。设备隔离与处置由产权方和专业人员落实。',
    portraits: { neutral: portrait('chen') }, chibi: chibi('chen')
  },
  {
    id: 'shen', name: '沈棠', age: '28 岁', role: '清河里住户 / 沈衡的女儿', tag: '家属 / 接收',
    bio: '父亲沈衡开过公交，2019年接送获救住户后平安回家，今年因病去世。她整理遗物时翻出旧接送单和一段只听过六秒的语音。头七过后，灯没再灭，手机里的通知却开始每天早一分钟。',
    duty: '代表家属提供获准使用的私人材料。丧事、遗愿与电网抢修分开处理，接收副本不等于认可旧工单的完成状态。',
    portraits: { neutral: portrait('shen') }, chibi: chibi('shen')
  }
];

export function getCharacter(id: string | undefined): CharacterProfile | undefined {
  return CHARACTERS.find((character) => character.id === id);
}

export function getPortraitPath(id: string | undefined, expression: CharacterExpression = 'neutral'): string | undefined {
  const character = getCharacter(id);
  return character?.portraits[expression] ?? character?.portraits.neutral;
}
