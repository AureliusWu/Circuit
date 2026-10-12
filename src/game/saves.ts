import { getChapter, isGameState, PROLOGUE } from '../story/engine';
import type { GameState } from '../story/types';

export const SAVE_KEYS = {
  manual: 'circuit-save-v011',
  auto: 'circuit-auto-v011',
  legacy: 'circuit-save-v010'
} as const;

export const MAX_HISTORY_ENTRIES = 200;

export type SaveKind = 'manual' | 'auto';

/** Browser storage is supplied by the caller, so denied access never prevents play. */
export type SaveStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export type SaveSnapshot = {
  state: GameState;
  history: string[];
  savedAt: string;
};

type InvalidSave = { status: 'invalid'; reason: string };
type UnavailableStorage = { status: 'unavailable'; reason: string };

export type SaveValidationResult =
  | { status: 'valid'; snapshot: SaveSnapshot }
  | InvalidSave;

export type SaveLoadResult =
  | { status: 'empty' }
  | { status: 'valid'; snapshot: SaveSnapshot; source: 'v011' | 'legacy' }
  | InvalidSave
  | UnavailableStorage;

export type SaveWriteResult =
  | { status: 'saved'; snapshot: SaveSnapshot }
  | InvalidSave
  | UnavailableStorage;

const INVALID_REASON = '存档内容损坏或与当前章节不兼容，原存档已保留。';
const STORAGE_REASON = '浏览器存储暂不可用，仍可继续游玩。';
const LEGACY_TIMESTAMP = '1970-01-01T00:00:00.000Z';

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasOwn(value: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function invalid(): InvalidSave {
  return { status: 'invalid', reason: INVALID_REASON };
}

function unavailable(): UnavailableStorage {
  return { status: 'unavailable', reason: STORAGE_REASON };
}

function isSavedAt(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const timestamp = new Date(value);
  return Number.isFinite(timestamp.getTime()) && timestamp.toISOString() === value;
}

function copyState(state: GameState): GameState {
  return { chapterId: state.chapterId, nodeId: state.nodeId, evidence: [...state.evidence] };
}

/** Validate the complete persisted snapshot, including the story's evidence gates. */
export function validateSavePayload(value: unknown): SaveValidationResult {
  if (!isRecord(value)) return invalid();
  const fields = ['version', 'chapterId', 'nodeId', 'evidence', 'history', 'savedAt'];
  if (!fields.every((field) => hasOwn(value, field)) || value.version !== 1) return invalid();

  const state = {
    chapterId: value.chapterId,
    nodeId: value.nodeId,
    evidence: value.evidence
  };
  if (!isGameState(state)) return invalid();
  const chapter = getChapter(state.chapterId);
  if (!chapter || chapter.nodes[state.nodeId].kind === 'title') return invalid();

  if (!Array.isArray(value.history) || value.history.length === 0 || value.history.length > MAX_HISTORY_ENTRIES) {
    return invalid();
  }
  for (const nodeId of value.history) {
    if (typeof nodeId !== 'string' || !hasOwn(chapter.nodes, nodeId)) {
      return invalid();
    }
    if (chapter.nodes[nodeId as GameState['nodeId']].kind === 'title') return invalid();
  }
  if (value.history[value.history.length - 1] !== state.nodeId || !isSavedAt(value.savedAt)) return invalid();

  return {
    status: 'valid',
    snapshot: { state: copyState(state), history: [...value.history], savedAt: value.savedAt }
  };
}

function validateLegacyPayload(value: unknown): SaveValidationResult {
  if (!isRecord(value) || !hasOwn(value, 'node') || !hasOwn(value, 'evidence')) return invalid();
  return validateSavePayload({
    version: 1,
    chapterId: PROLOGUE,
    nodeId: value.node,
    evidence: value.evidence,
    history: [value.node],
    savedAt: LEGACY_TIMESTAMP
  });
}

/** Reading or migrating a save never changes the player's stored data. */
export function loadSave(storage: SaveStorage | null | undefined, kind: SaveKind): SaveLoadResult {
  if (!storage) return unavailable();
  let raw: string | null;
  let source: 'v011' | 'legacy' = 'v011';
  try {
    raw = storage.getItem(SAVE_KEYS[kind]);
    if (raw === null && kind === 'manual') {
      raw = storage.getItem(SAVE_KEYS.legacy);
      source = 'legacy';
    }
  } catch {
    return unavailable();
  }
  if (raw === null) return { status: 'empty' };
  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return invalid();
  }
  const result = source === 'legacy' ? validateLegacyPayload(payload) : validateSavePayload(payload);
  return result.status === 'valid' ? { ...result, source } : result;
}

/** Manual and automatic saves occupy independent slots; only explicit saves write. */
export function saveGame(
  storage: SaveStorage | null | undefined,
  kind: SaveKind,
  state: GameState,
  history: readonly string[],
  now: Date = new Date()
): SaveWriteResult {
  if (!storage) return unavailable();
  if (!Number.isFinite(now.getTime())) return invalid();
  const payload = {
    version: 1,
    chapterId: state.chapterId,
    nodeId: state.nodeId,
    evidence: state.evidence,
    history,
    savedAt: now.toISOString()
  };
  const validated = validateSavePayload(payload);
  if (validated.status !== 'valid') return validated;

  // Keep exact v0.1.0 compatibility without adding versioned fields to its key.
  const writes: Array<[string, string]> = [[SAVE_KEYS[kind], JSON.stringify(payload)]];
  if (kind === 'manual') {
    writes.push([SAVE_KEYS.legacy, JSON.stringify({ node: state.nodeId, evidence: state.evidence })]);
  }
  const previous: Array<[string, string | null]> = [];
  let written = 0;
  try {
    for (const [key] of writes) previous.push([key, storage.getItem(key)]);
    for (const [key, serialized] of writes) {
      storage.setItem(key, serialized);
      written += 1;
    }
  } catch {
    // Preserve the prior manual pair when its compatibility write fails.
    // Some unavailable storage implementations also reject rollback; play can continue.
    for (let index = written - 1; index >= 0; index -= 1) {
      const [key, oldValue] = previous[index];
      try {
        if (oldValue === null) storage.removeItem(key);
        else storage.setItem(key, oldValue);
      } catch {
        // The read API will still validate any record retained by the browser.
      }
    }
    return unavailable();
  }
  return { status: 'saved', snapshot: validated.snapshot };
}

/** Reserved for an explicit new game; loading a corrupt save never calls this. */
export function clearAutoSave(storage: SaveStorage | null | undefined): { status: 'cleared' } | UnavailableStorage {
  if (!storage) return unavailable();
  try {
    storage.removeItem(SAVE_KEYS.auto);
    return { status: 'cleared' };
  } catch {
    return unavailable();
  }
}
