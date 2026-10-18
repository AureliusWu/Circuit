import type { CharacterId } from './characters';

export type VoiceClip = { id: string; character: CharacterId; text: string; src: string; bindings: { chapter: string; node: string }[] };

// Generated from docs/audio/voice-plan.json. See tools/audio/validate_media.py.
export const VOICE_CLIPS: readonly VoiceClip[] = [
  {
    "id": "h13-dispatch",
    "character": "lin",
    "text": "槐荫巷，十二户停电，终端显示十三个在线户号。",
    "bindings": [
      {
        "chapter": "thirteen-households",
        "node": "dispatch"
      }
    ],
    "src": "/audio/voice/h13-dispatch.mp3"
  },
  {
    "id": "h13-call",
    "character": "cheng",
    "text": "在线是通讯状态。有电没电，到了再看。",
    "bindings": [
      {
        "chapter": "thirteen-households",
        "node": "call"
      }
    ],
    "src": "/audio/voice/h13-call.mp3"
  },
  {
    "id": "h13-kit",
    "character": "ji",
    "text": "师傅，照片按户号存，还是按时间？",
    "bindings": [
      {
        "chapter": "thirteen-households",
        "node": "vehicleKit"
      }
    ],
    "src": "/audio/voice/h13-kit.mp3"
  },
  {
    "id": "h13-zhou",
    "character": "zhou",
    "text": "季宁跟着你，别让她一个人往旧宅里钻。",
    "bindings": [
      {
        "chapter": "thirteen-households",
        "node": "zhouCall"
      }
    ],
    "src": "/audio/voice/h13-zhou.mp3"
  },
  {
    "id": "h13-mei",
    "character": "mei",
    "text": "门留着，别替他把路画死。",
    "bindings": [
      {
        "chapter": "thirteen-households",
        "node": "ashMeaning"
      }
    ],
    "src": "/audio/voice/h13-mei.mp3"
  },
  {
    "id": "h13-ticket",
    "character": "zhou",
    "text": "没安排替代，也没让他停下来。后来有人催关单，我就写完成。没核完。",
    "bindings": [
      {
        "chapter": "thirteen-households",
        "node": "ticketSignature"
      }
    ],
    "src": "/audio/voice/h13-ticket.mp3"
  },
  {
    "id": "q07-dispatch",
    "character": "lin",
    "text": "清河里七号院，报了九夜。",
    "bindings": [
      {
        "chapter": "seventh-night",
        "node": "dispatch"
      }
    ],
    "src": "/audio/voice/q07-dispatch.mp3"
  },
  {
    "id": "q07-shen",
    "character": "shen",
    "text": "那年我爸回家了，后来还开了好多年车。",
    "bindings": [
      {
        "chapter": "seventh-night",
        "node": "welcome"
      }
    ],
    "src": "/audio/voice/q07-shen.mp3"
  },
  {
    "id": "q07-ji",
    "character": "ji",
    "text": "沈师傅回家，许师傅没上车。这两行分开。",
    "bindings": [
      {
        "chapter": "seventh-night",
        "node": "recordReceipt"
      }
    ],
    "src": "/audio/voice/q07-ji.mp3"
  },
  {
    "id": "q07-xu",
    "character": "xu",
    "text": "车还等吗？",
    "bindings": [
      {
        "chapter": "seventh-night",
        "node": "fatherMessage"
      }
    ],
    "src": "/audio/voice/q07-xu.mp3"
  },
  {
    "id": "r02-chen",
    "character": "chen",
    "text": "晚上别这么响。",
    "bindings": [
      {
        "chapter": "backfeed",
        "node": "gate"
      }
    ],
    "src": "/audio/voice/r02-chen.mp3"
  },
  {
    "id": "r02-door",
    "character": "chen",
    "text": "我母亲搬家都带旧门牌，说怕认错门。",
    "bindings": [
      {
        "chapter": "backfeed",
        "node": "chen"
      }
    ],
    "src": "/audio/voice/r02-door.mp3"
  },
  {
    "id": "r02-ji",
    "character": "ji",
    "text": "外面零了，里面还有。",
    "bindings": [
      {
        "chapter": "backfeed",
        "node": "relayTest"
      }
    ],
    "src": "/audio/voice/r02-ji.mp3"
  },
  {
    "id": "l03-mei",
    "character": "mei",
    "text": "半夜钥匙碰栏杆，别往楼道里叫。",
    "bindings": [
      {
        "chapter": "everlight",
        "node": "houseRules"
      }
    ],
    "src": "/audio/voice/l03-mei.mp3"
  },
  {
    "id": "l03-keys",
    "character": "mei",
    "text": "轻两下，最后重一下。他钥匙串就那样碰。",
    "bindings": [
      {
        "chapter": "everlight",
        "node": "promise"
      }
    ],
    "src": "/audio/voice/l03-keys.mp3"
  },
  {
    "id": "l03-ji",
    "character": "ji",
    "text": "师傅，刚才你下楼的时候，钥匙响没响？",
    "bindings": [
      {
        "chapter": "everlight",
        "node": "dawn"
      }
    ],
    "src": "/audio/voice/l03-ji.mp3"
  },
  {
    "id": "n04-zhou",
    "character": "zhou",
    "text": "没查齐旁路，也没等到交班，我就写了完成。",
    "bindings": [
      {
        "chapter": "neutral",
        "node": "witness"
      }
    ],
    "src": "/audio/voice/n04-zhou.mp3"
  },
  {
    "id": "n04-shen",
    "character": "shen",
    "text": "你把原话留着，后面他们还会问。",
    "bindings": [
      {
        "chapter": "neutral",
        "node": "debt"
      }
    ],
    "src": "/audio/voice/n04-shen.mp3"
  },
  {
    "id": "c00-ji",
    "character": "ji",
    "text": "也不能照这圈顺序说哪件事先发生。",
    "bindings": [
      {
        "chapter": "closure",
        "node": "mapRecord"
      }
    ],
    "src": "/audio/voice/c00-ji.mp3"
  },
  {
    "id": "c00-cheng",
    "character": "cheng",
    "text": "按页来。",
    "bindings": [
      {
        "chapter": "closure",
        "node": "summon"
      }
    ],
    "src": "/audio/voice/c00-cheng.mp3"
  },
  {
    "id": "c00-mei",
    "character": "mei",
    "text": "灯没再亮，后门也没再响。",
    "bindings": [
      {
        "chapter": "closure",
        "node": "mei"
      }
    ],
    "src": "/audio/voice/c00-mei.mp3"
  },
  {
    "id": "v01-lin",
    "character": "lin",
    "text": "物业说他们听见你了。",
    "bindings": [
      {
        "chapter": "return-visit",
        "node": "dispatch"
      }
    ],
    "src": "/audio/voice/v01-lin.mp3"
  },
  {
    "id": "v01-ji-address",
    "character": "ji",
    "text": "十三号搬来以后还是十三号？",
    "bindings": [
      {
        "chapter": "return-visit",
        "node": "drive"
      }
    ],
    "src": "/audio/voice/v01-ji-address.mp3"
  },
  {
    "id": "v01-arrived",
    "character": "cheng",
    "text": "程砚，已经到场。",
    "bindings": [
      {
        "chapter": "return-visit",
        "node": "arrival"
      },
      {
        "chapter": "return-visit",
        "node": "echo"
      }
    ],
    "src": "/audio/voice/v01-arrived.mp3"
  },
  {
    "id": "v01-luo",
    "character": "luo",
    "text": "我也觉得不对。前两次都说到场，门口一个人没有。",
    "bindings": [
      {
        "chapter": "return-visit",
        "node": "luo"
      }
    ],
    "src": "/audio/voice/v01-luo.mp3"
  },
  {
    "id": "v01-redpaper",
    "character": "luo",
    "text": "朝里贴，说让跟着搬家的认得门。白天就揭，物业总忘。",
    "bindings": [
      {
        "chapter": "return-visit",
        "node": "doorRule"
      }
    ],
    "src": "/audio/voice/v01-redpaper.mp3"
  },
  {
    "id": "v01-wait",
    "character": "ji",
    "text": "先别替它答到。",
    "bindings": [
      {
        "chapter": "return-visit",
        "node": "firstHub"
      }
    ],
    "src": "/audio/voice/v01-wait.mp3"
  },
  {
    "id": "v01-received",
    "character": "ji",
    "text": "季宁，收到。",
    "bindings": [
      {
        "chapter": "return-visit",
        "node": "echo"
      }
    ],
    "src": "/audio/voice/v01-received.mp3"
  },
  {
    "id": "v01-receipt",
    "character": "luo",
    "text": "语音说收到了，我就往后翻。",
    "bindings": [
      {
        "chapter": "return-visit",
        "node": "receipt"
      }
    ],
    "src": "/audio/voice/v01-receipt.mp3"
  },
  {
    "id": "v01-record",
    "character": "ji",
    "text": "季宁，现场记录已交。",
    "bindings": [
      {
        "chapter": "return-visit",
        "node": "approved"
      }
    ],
    "src": "/audio/voice/v01-record.mp3"
  },
  {
    "id": "v01-question",
    "character": "luo",
    "text": "到底谁在后面应我？",
    "bindings": [
      {
        "chapter": "return-visit",
        "node": "quiet"
      }
    ],
    "src": "/audio/voice/v01-question.mp3"
  },
  {
    "id": "v01-confirm",
    "character": "cheng",
    "text": "先别替它确认。",
    "bindings": [
      {
        "chapter": "return-visit",
        "node": "onward"
      },
      {
        "chapter": "return-visit",
        "node": "end"
      }
    ],
    "src": "/audio/voice/v01-confirm.mp3"
  }
];

export const SCENE_EFFECTS: Readonly<Record<string, string>> = {
  'tickets/hush': '/audio/sfx/return-bell.mp3',
  'tickets/recordClock': '/audio/sfx/return-bell.mp3',
  'tickets/puzzle1': '/audio/sfx/ticket-slide.mp3',
  'tickets/rearMark': '/audio/sfx/return-bell.mp3',
  'tickets/end': '/audio/sfx/rear-lock.mp3',
  "thirteen-households/houseKnock": "/audio/sfx/door-knock.mp3",
  "thirteen-households/archivedTicket": "/audio/sfx/paper-turn.mp3",
  "seventh-night/fatherMessage": "/audio/sfx/radio-open.mp3",
  "seventh-night/recorder": "/audio/sfx/intercom-click.mp3",
  "backfeed/gate": "/audio/sfx/iron-gate.mp3",
  "backfeed/relayTest": "/audio/sfx/relay-drop.mp3",
  "everlight/gate": "/audio/sfx/keys-two-one.mp3",
  "everlight/promise": "/audio/sfx/keys-two-one.mp3",
  "everlight/turnOff": "/audio/sfx/switch-off.mp3",
  "neutral/ticket": "/audio/sfx/paper-turn.mp3",
  "neutral/signed": "/audio/sfx/pen-sign.mp3",
  "closure/meal": "/audio/sfx/cup-set.mp3",
  "closure/end": "/audio/sfx/phone-alert.mp3",
  "return-visit/dispatch": "/audio/sfx/radio-open.mp3",
  "return-visit/arrival": "/audio/sfx/intercom-click.mp3",
  "return-visit/intercom": "/audio/sfx/intercom-click.mp3",
  "return-visit/echo": "/audio/sfx/intercom-click.mp3",
  "return-visit/cabinet": "/audio/sfx/relay-drop.mp3",
  "return-visit/recordReceipt": "/audio/sfx/paper-turn.mp3",
  "return-visit/approved": "/audio/sfx/pen-sign.mp3",
  "return-visit/end": "/audio/sfx/intercom-click.mp3",
  "answering/dispatch": "/audio/sfx/phone-alert.mp3",
  "answering/firstHub": "/audio/sfx/telephone-ring.mp3",
  "answering/lineCheck": "/audio/sfx/telephone-ring.mp3",
  "answering/ring": "/audio/sfx/telephone-ring.mp3",
  "answering/listBack": "/audio/sfx/paper-turn.mp3",
  "answering/recordBatch": "/audio/sfx/intercom-click.mp3",
  "answering/handoff": "/audio/sfx/pen-sign.mp3",
  "answering/doorway": "/audio/sfx/latch-turn.mp3",
  "answering/end": "/audio/sfx/phone-alert.mp3",
  "visitors/dispatch": "/audio/sfx/radio-open.mp3",
  "visitors/knock": "/audio/sfx/glass-tap.mp3",
  "visitors/ticket": "/audio/sfx/ticket-tear.mp3",
  "visitors/takeNumber": "/audio/sfx/ticket-tear.mp3",
  "visitors/sideDoor": "/audio/sfx/latch-turn.mp3",
  "visitors/oldVoice": "/audio/sfx/radio-open.mp3",
  "visitors/recordCard": "/audio/sfx/glass-tap.mp3",
  "visitors/recordTest": "/audio/sfx/glass-tap.mp3",
  "visitors/handoff": "/audio/sfx/pen-sign.mp3",
  "visitors/wetStep": "/audio/sfx/wet-step.mp3"
};

/** Replay the identical mastered file; the original generation request stays immutable. */
export const VOICE_REPLAYS: readonly { clipId: string; chapter: string; node: string }[] = [
  { clipId: 'v01-confirm', chapter: 'answering', node: 'sealedVoice' },
  { clipId: 'v01-question', chapter: 'answering', node: 'luo' },
  { clipId: 'v01-arrived', chapter: 'answering', node: 'incomingName' },
  { clipId: 'v01-received', chapter: 'answering', node: 'emptyReply' },
  { clipId: 'v01-wait', chapter: 'answering', node: 'doorway' },
  { clipId: 'v01-confirm', chapter: 'tickets', node: 'oldFile' },
  { clipId: 'q07-xu', chapter: 'visitors', node: 'oldVoice' },
  { clipId: 'v01-confirm', chapter: 'visitors', node: 'newVoice' }
];

export const getVoiceClip = (id: string) => VOICE_CLIPS.find(clip => clip.id === id);

export const voicesFor = (chapter: string, node: string) => {
  const original = VOICE_CLIPS.filter(clip => clip.bindings.some(binding => binding.chapter === chapter && binding.node === node));
  const replays = VOICE_REPLAYS.filter(binding => binding.chapter === chapter && binding.node === node)
    .flatMap(binding => { const clip = getVoiceClip(binding.clipId); return clip ? [clip] : []; });
  return [...original, ...replays];
};
