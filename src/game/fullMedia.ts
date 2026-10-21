import type { Chapter, StoryNode } from '../story/types';
import type { CharacterId, CharacterPresence } from './characters';
const portraits: Record<string, {portrait: CharacterId; presence: CharacterPresence}> = {
  "seventh-night/fatherMessage": {
    "portrait": "shen-father",
    "presence": "archive"
  },
  "everlight/gate": {
    "portrait": "resident-gate",
    "presence": "scene"
  },
  "everlight/load": {
    "portrait": "resident-young",
    "presence": "scene"
  },
  "neutral/approach": {
    "portrait": "resident-cabinet",
    "presence": "scene"
  },
  "neutral/readingRecord": {
    "portrait": "resident-cabinet",
    "presence": "scene"
  },
  "neutral/neighbors": {
    "portrait": "resident-cabinet",
    "presence": "scene"
  },
  "tickets/breakfast": {
    "portrait": "breakfast-owner",
    "presence": "scene"
  },
  "tickets/wrongWriter": {
    "portrait": "manager",
    "presence": "scene"
  },
  "tickets/handoff": {
    "portrait": "manager",
    "presence": "scene"
  }
};
const pictures: Record<string, string> = {
  "thirteen-households/end": "/art/cg-do-not-close.webp",
  "seventh-night/sevenMeals": "/art/cg-threshold-ash.webp",
  "backfeed/end": "/art/cg-plate-03.webp",
  "everlight/end": "/art/cg-missing-stairs.webp",
  "neutral/receive": "/art/cg-old-ticket.webp",
  "closure/end": "/art/cg-blank-order.webp",
  "answering/end": "/art/cg-wet-boots.webp",
  "tickets/recordPaper": "/art/cg-five-tickets.webp"
};

export function withFullMedia(chapter: Chapter): Chapter {
  return { ...chapter, nodes: Object.fromEntries(Object.entries(chapter.nodes).map(([id, node]) => {
    const key = chapter.id + '/' + id;
    const portrait = !node.portrait ? portraits[key] : undefined;
    const picture = pictures[key];
    const next: StoryNode = { ...node, ...portrait, ...(picture ? {scene: { ...node.scene, background: picture, eventCg: true }} : {}) };
    return [id, next];
  })) };
}
