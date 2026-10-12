import { CHAPTER_ORDER, createInitialState, getChapter } from '../story/engine';
import type { ChapterId, GameState } from '../story/types';
import { loadSave, validateSavePayload, type SaveStorage } from './saves';

export type CampaignSlot = 'auto' | 1 | 2 | 3;
export const CAMPAIGN_KEYS = {
  auto: 'circuit-auto-v100',
  1: 'circuit-slot-v100-1',
  2: 'circuit-slot-v100-2',
  3: 'circuit-slot-v100-3'
} as const;

export type CampaignSession = {
  state: GameState;
  history: string[];
  completed: ChapterId[];
  archive: Partial<Record<ChapterId, string[]>>;
};

export type CampaignSnapshot = CampaignSession & { savedAt: string };
type InvalidCampaign = { status: 'invalid'; reason: string };
type UnavailableCampaign = { status: 'unavailable'; reason: string };
export type CampaignValidationResult = { status: 'valid'; snapshot: CampaignSnapshot } | InvalidCampaign;
export type CampaignLoadResult =
  | { status: 'empty' }
  | { status: 'valid'; snapshot: CampaignSnapshot; source: 'v100' | 'v011' | 'legacy' }
  | InvalidCampaign
  | UnavailableCampaign;
export type CampaignWriteResult = { status: 'saved'; snapshot: CampaignSnapshot } | InvalidCampaign | UnavailableCampaign;

const INVALID_REASON = '存档内容损坏或章节进度不一致，原存档已保留。';
const STORAGE_REASON = '浏览器存储暂不可用，仍可继续游玩。';
const MIGRATION_TIME = '1970-01-01T00:00:00.000Z';
const own = (value: object, key: string) => Object.prototype.hasOwnProperty.call(value, key);
const invalid = (): InvalidCampaign => ({ status: 'invalid', reason: INVALID_REASON });
const unavailable = (): UnavailableCampaign => ({ status: 'unavailable', reason: STORAGE_REASON });
const isCampaignSlot = (value: unknown): value is CampaignSlot => value === 'auto' || value === 1 || value === 2 || value === 3;

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function payloadFromSession(session: CampaignSession, savedAt: string) {
  return {
    version: 2,
    chapterId: session.state.chapterId,
    nodeId: session.state.nodeId,
    evidence: session.state.evidence,
    history: session.history,
    savedAt,
    completed: session.completed,
    archive: session.archive
  };
}

function validatePayload(value: unknown, allowPendingCompletion: boolean): CampaignValidationResult {
  if (!isRecord(value) || value.version !== 2) return invalid();
  if (!['completed', 'archive', 'version'].every((key) => own(value, key))) return invalid();
  const validatedState = validateSavePayload({ ...value, version: 1 });
  if (validatedState.status !== 'valid') return invalid();
  if (!Array.isArray(value.completed) || value.completed.length > CHAPTER_ORDER.length) return invalid();
  for (let index = 0; index < value.completed.length; index += 1) {
    if (value.completed[index] !== CHAPTER_ORDER[index]) return invalid();
  }
  const completed: ChapterId[] = [...value.completed];
  const currentIndex = CHAPTER_ORDER.indexOf(validatedState.snapshot.state.chapterId);
  if (currentIndex < 0 || currentIndex > completed.length || !isRecord(value.archive)) return invalid();
  const archive: Partial<Record<ChapterId, string[]>> = {};
  for (const chapterId of Object.keys(value.archive)) {
    const chapter = getChapter(chapterId);
    const ids = value.archive[chapterId];
    if (!chapter || !completed.includes(chapter.id) || !Array.isArray(ids) || new Set(ids).size !== ids.length) return invalid();
    for (const id of ids) {
      if (typeof id !== 'string' || !own(chapter.evidence, id)) return invalid();
    }
    archive[chapter.id] = [...ids];
  }
  for (const chapterId of completed) {
    const chapter = getChapter(chapterId)!;
    const evidence = archive[chapterId];
    if (!evidence || !chapter.requiredEvidence.every((id) => evidence.includes(id))) return invalid();
  }
  const currentChapter = getChapter(validatedState.snapshot.state.chapterId)!;
  if (!allowPendingCompletion && currentChapter.nodes[validatedState.snapshot.state.nodeId].outcome === 'complete'
    && !completed.includes(currentChapter.id)) return invalid();
  return {
    status: 'valid',
    snapshot: { ...validatedState.snapshot, completed, archive }
  };
}

/** Completion is a proven ordered prefix; invented future map clues are rejected. */
export function validateCampaignPayload(value: unknown): CampaignValidationResult {
  return validatePayload(value, false);
}

export function createCampaignSession(): CampaignSession {
  const state = createInitialState();
  return { state, history: [state.nodeId], completed: [], archive: {} };
}

function validatedSession(session: CampaignSession): CampaignSession | null {
  if (!isRecord(session) || !isRecord(session.state)) return null;
  const result = validatePayload(payloadFromSession(session, MIGRATION_TIME), true);
  if (result.status !== 'valid') return null;
  const { state, history, completed, archive } = result.snapshot;
  return { state, history, completed, archive };
}

/** Safe to call after every action: a failed ending grants neither progress nor clues. */
export function completeChapter(session: CampaignSession): CampaignSession {
  const valid = validatedSession(session);
  if (!valid) return session;
  const chapter = getChapter(valid.state.chapterId)!;
  const node = chapter.nodes[valid.state.nodeId];
  if (node.outcome !== 'complete' || !chapter.requiredEvidence.every((id) => valid.state.evidence.includes(id))) return session;
  const chapterIndex = CHAPTER_ORDER.indexOf(chapter.id);
  const completed = [...valid.completed];
  if (chapterIndex === completed.length) completed.push(chapter.id);
  else if (!completed.includes(chapter.id)) return session;
  const archivedEvidence = [...new Set([...(valid.archive[chapter.id] ?? []), ...valid.state.evidence])];
  return { ...valid, completed, archive: { ...valid.archive, [chapter.id]: archivedEvidence } };
}

export function canStartChapter(session: CampaignSession, chapterId: unknown): chapterId is ChapterId {
  const chapter = getChapter(chapterId);
  if (!chapter || !validatedSession(session)) return false;
  const index = CHAPTER_ORDER.indexOf(chapter.id);
  return index >= 0 && index <= session.completed.length;
}

/** Starting an unlocked chapter resets its local investigation and keeps proven campaign progress. */
export function startChapter(session: CampaignSession, chapterId: ChapterId): CampaignSession | null {
  if (!canStartChapter(session, chapterId)) return null;
  const previous = validatedSession(session)!;
  const state = createInitialState(chapterId);
  return { state, history: [state.nodeId], completed: previous.completed, archive: previous.archive };
}

function migrateOldSave(old: ReturnType<typeof loadSave>): CampaignLoadResult {
  if (old.status !== 'valid') return old;
  const migrated = completeChapter({
    state: old.snapshot.state,
    history: old.snapshot.history,
    completed: [],
    archive: {}
  });
  const result = validateCampaignPayload(payloadFromSession(migrated, old.snapshot.savedAt));
  return result.status === 'valid' ? { ...result, source: old.source } : result;
}

/** New-format corruption does not silently fall back; old saves migrate without any writes. */
export function loadCampaign(storage: SaveStorage | null | undefined, slot: CampaignSlot): CampaignLoadResult {
  if (!isCampaignSlot(slot)) return invalid();
  if (!storage) return unavailable();
  let raw: string | null;
  try {
    raw = storage.getItem(CAMPAIGN_KEYS[slot]);
  } catch {
    return unavailable();
  }
  if (raw === null) {
    if (slot === 'auto') return migrateOldSave(loadSave(storage, 'auto'));
    if (slot === 1) return migrateOldSave(loadSave(storage, 'manual'));
    return { status: 'empty' };
  }
  try {
    const result = validateCampaignPayload(JSON.parse(raw));
    return result.status === 'valid' ? { ...result, source: 'v100' } : result;
  } catch {
    return invalid();
  }
}

/** Each explicit write replaces only the selected campaign slot. */
export function saveCampaign(
  storage: SaveStorage | null | undefined,
  slot: CampaignSlot,
  session: CampaignSession,
  now: Date = new Date()
): CampaignWriteResult {
  if (!isCampaignSlot(slot)) return invalid();
  if (!storage) return unavailable();
  if (!isRecord(session) || !isRecord(session.state)) return invalid();
  if (!Number.isFinite(now.getTime())) return invalid();
  const result = validateCampaignPayload(payloadFromSession(session, now.toISOString()));
  if (result.status !== 'valid') return result;
  try {
    storage.setItem(CAMPAIGN_KEYS[slot], JSON.stringify(payloadFromSession(result.snapshot, result.snapshot.savedAt)));
    return { status: 'saved', snapshot: result.snapshot };
  } catch {
    return unavailable();
  }
}
