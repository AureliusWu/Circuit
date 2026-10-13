import type { CharacterExpression, CharacterId, CharacterPresence } from '../game/characters';

export type ChapterId = 'thirteen-households' | 'seventh-night' | 'backfeed' | 'everlight' | 'neutral' | 'closure' | 'return-visit';

/** Node and evidence identifiers belong to their chapter, not to the whole campaign. */
export type StoryNodeId = string;
export type EvidenceId = string;

export type GameState = {
  chapterId: ChapterId;
  nodeId: StoryNodeId;
  evidence: EvidenceId[];
};

export type Evidence = {
  title: string;
  detail: string;
};

export type StoryAction = {
  id: string;
  label: string;
  next: StoryNodeId;
  collect?: EvidenceId;
  requiresEvidence?: readonly EvidenceId[];
  hidesWhenCollected?: EvidenceId;
  tone?: 'danger';
  resetEvidence?: boolean;
};

export type SceneHotspot = {
  id: string;
  actionId: string;
  label: string;
  /** Position within the scene, in percentages from the top-left corner. */
  x: number;
  y: number;
};

export type StoryNode = {
  kind: 'title' | 'dialogue' | 'investigation' | 'evidence' | 'choice' | 'ending' | 'puzzle';
  location: string;
  time: string;
  speaker?: string;
  text: string;
  visual: 'dispatch' | 'alley' | 'meter' | 'lamp' | 'blackout' | 'ending';
  progress: number;
  actions: readonly StoryAction[];
  outcome?: 'failure' | 'complete';
  puzzle?: { prompt: string; hint: string };
  portrait?: CharacterId;
  expression?: CharacterExpression;
  /** Remote calls and historical photographs have their own presentation. */
  presence?: CharacterPresence;
  /** Inventory constraints also protect restores from skipping investigation. */
  requiresEvidence?: readonly EvidenceId[];
  excludesEvidence?: readonly EvidenceId[];
  objective?: { title: string; detail: string };
  scene?: {
    background?: string;
    hotspots?: readonly SceneHotspot[];
    document?: { title: string; lines: readonly string[] };
    inscription?: string;
  };
};

export type Chapter = {
  id: ChapterId;
  order: number;
  title: string;
  subtitle: string;
  synopsis: string;
  entryNode: StoryNodeId;
  nodes: Record<StoryNodeId, StoryNode>;
  evidence: Record<EvidenceId, Evidence>;
  requiredEvidence: readonly EvidenceId[];
  clue: { code: string; title: string; detail: string; x: number; y: number };
};
