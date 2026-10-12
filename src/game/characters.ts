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
    bio: '在梧城电网工作九年，早年在城东运检，近两年调入城区抢修班。记线路，也记敲过的门。话不多，遇到催送电的住户会先给一个明确答复。今夜，你以他的身份接下槐荫巷的工单。',
    duty: '承担获准范围内的现场排查，向工作负责人报告边界和风险；带季宁核对记录、练习判断。未知来源的线路交由专责人员复核。',
    portraits: { neutral: portrait('cheng'), focused: '/art/portraits/cheng-focused.webp' }, chibi: chibi('cheng')
  },
  {
    id: 'ji', name: '季宁', age: '23 岁', role: '梧城电网 · 跟班抢修员', tag: '固定队友 / 徒弟',
    bio: '入班八个月，已完成岗位培训，正在程砚指导下跟班。随身带平板和一本防水记录册，擅长把口述、时刻和现场图放在一起核对。习惯在交接前再问一句：谁收到了？',
    duty: '负责获准的现场记录、终端核对、照片索引和住户联络。在师傅及工作负责人指导下参与排查，不独立操作未知开关，也不单独承担专责监护。',
    portraits: { neutral: portrait('ji'), concerned: '/art/portraits/ji-concerned.webp' }, chibi: chibi('ji')
  },
  {
    id: 'lin', name: '林岚', age: '30 岁', role: '配电运检中心 · 值班联络', tag: '工单 / 通讯',
    bio: '负责把停电电话变成有人接收的工单，并跟踪现场回报。熟悉旧城资料的目录和新系统的脾气。大多数时候，她的声音从车载电台里传来。',
    duty: '联络调度、工作负责人和档案部门，核对事件时标与工单状态。送电许可和事故认定由相应岗位依职责办理。',
    portraits: { neutral: portrait('lin') }, chibi: chibi('lin')
  },
  {
    id: 'zhou', name: '老周', age: '50 岁', role: '城区抢修班 · 资深工作负责人', tag: '现场支援 / 旧事',
    bio: '程砚刚进班时的师傅。熟悉改造前的巷子和没有进图的墙根。一张折了四层的旧附页，被他留在雨衣内袋很多年。',
    duty: '经值班安排加入现场，按职责组织和复核作业。涉及自己的历史记录须如实提交，接受独立复核；经验不能代替许可和监护。',
    portraits: { neutral: portrait('zhou'), focused: '/art/portraits/zhou-field.webp' }, chibi: chibi('zhou')
  },
  {
    id: 'mei', name: '杨婶', age: '60 岁', role: '长安里住户 / 槐荫巷旧邻', tag: '灯 / 门牌',
    bio: '本名杨桂梅，搬到长安里后仍会回旧巷照看亲戚。认得许多被改过的门牌，也记得借出去那把梯子的绿布。票据收在铁盒里，雨夜的灯一直留着。',
    duty: '提供可核对的住户口述和私人票据，由本人决定哪些材料可移交。住户的记忆不能替代电气测量。',
    portraits: { neutral: portrait('mei') }, chibi: chibi('mei')
  },
  {
    id: 'xu', name: '许守成', age: '35 岁 · 2019 年档案', role: '旧城抢修员 / 档案人物', tag: '旧照 / 附页',
    bio: '戴方框眼镜，旧工作服口袋里总有一支笔。他的姓名反复出现在旧城救援的附页和录音索引里。画面中的他来自七年前的照片。',
    duty: '以原件、证词和历史录音呈现。现场异常与历史事实分别核对，事故原因和责任留给正式调查。',
    portraits: { neutral: portrait('xu') }, chibi: chibi('xu')
  },
  {
    id: 'chen', name: '陈伯', age: '60 岁', role: '城南拆迁区 · 看守人', tag: '旧图 / 钥匙',
    bio: '帽檐总压得很低，钥匙串却能一把不差地找到。看着住户搬走，也看着图纸把整片地块变成空白。保留旧门牌，是怕后来的人找错门。',
    duty: '在管理权限内提供通行和档案线索，协助核对迁出名单。设备隔离与处置由产权方和专业人员落实。',
    portraits: { neutral: portrait('chen') }, chibi: chibi('chen')
  },
  {
    id: 'shen', name: '沈棠', age: '28 岁', role: '清河里住户 / 沈衡的女儿', tag: '家属 / 接收',
    bio: '父亲沈衡曾是公交司机，七年前参与接送获救住户，近日去世。她在整理遗物时找到旧录音和交接单，想让父亲等过的那个人得到一次答复。',
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
