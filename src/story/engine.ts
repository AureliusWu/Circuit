import { thirteenHouseholds } from './chapters/thirteen-households';
import { seventhNight } from './chapters/seventh-night';
import { backfeed } from './chapters/backfeed';
import { everlight } from './chapters/everlight';
import { neutral } from './chapters/neutral';
import { closure } from './chapters/closure';
import { returnVisit } from './chapters/return-visit';
import { answering } from './chapters/answering';
import { getCharacter } from '../game/characters';
import type { Chapter, ChapterId, EvidenceId, GameState, StoryAction, StoryNode } from './types';

export const PROLOGUE: ChapterId = 'thirteen-households';
export const CHAPTER_ORDER: readonly ChapterId[] = Object.freeze([
  PROLOGUE, 'seventh-night', 'backfeed', 'everlight', 'neutral', 'closure', 'return-visit', 'answering'
]);

/** Finish the next chapter in sequence; replays remain available. */
export function getUnlockedChapters(completed: readonly ChapterId[]): ChapterId[] {
  const finished = new Set(completed);
  let prefix = 0;
  while (prefix < CHAPTER_ORDER.length && finished.has(CHAPTER_ORDER[prefix])) prefix += 1;
  return CHAPTER_ORDER.slice(0, Math.min(prefix + 1, CHAPTER_ORDER.length));
}

export const CHAPTERS: Readonly<Record<ChapterId, Chapter>> = Object.freeze({
  [PROLOGUE]: thirteenHouseholds,
  'seventh-night': seventhNight,
  backfeed,
  everlight,
  neutral,
  closure,
  'return-visit': returnVisit,
  answering
});

const owns = (record: object, key: string): boolean => Object.prototype.hasOwnProperty.call(record, key);

function matchesInventory(node: StoryNode, evidence: readonly EvidenceId[]): boolean {
  const inventory = new Set(evidence);
  return (node.requiresEvidence ?? []).every((id) => inventory.has(id))
    && (node.excludesEvidence ?? []).every((id) => !inventory.has(id));
}

function actionsFor(node: StoryNode, evidence: readonly EvidenceId[]): readonly StoryAction[] {
  const inventory = new Set(evidence);
  return node.actions.filter((action) =>
    (action.requiresEvidence ?? []).every((id) => inventory.has(id))
    && (!action.hidesWhenCollected || !inventory.has(action.hidesWhenCollected))
  );
}

function applyAction(state: GameState, action: StoryAction): GameState {
  const evidence = action.resetEvidence ? [] : [...state.evidence];
  if (action.collect && !evidence.includes(action.collect)) evidence.push(action.collect);
  return { chapterId: state.chapterId, nodeId: action.next, evidence };
}

export function getChapter(id: unknown): Chapter | null {
  return typeof id === 'string' && owns(CHAPTERS, id) ? CHAPTERS[id as ChapterId] : null;
}

export function createInitialState(chapterId: ChapterId = PROLOGUE): GameState {
  const chapter = getChapter(chapterId);
  if (!chapter) throw new Error('Unknown chapter');
  return { chapterId, nodeId: chapter.entryNode, evidence: [] };
}

export function isGameState(value: unknown): value is GameState {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return false;
  if (!['chapterId', 'nodeId', 'evidence'].every((key) => owns(value, key))) return false;
  const candidate = value as Record<string, unknown>;
  const chapter = getChapter(candidate.chapterId);
  if (!chapter || typeof candidate.nodeId !== 'string' || !owns(chapter.nodes, candidate.nodeId)) return false;
  if (!Array.isArray(candidate.evidence)) return false;
  const evidence: unknown[] = candidate.evidence;
  if (new Set(evidence).size !== evidence.length) return false;
  for (const id of evidence) {
    if (typeof id !== 'string' || !owns(chapter.evidence, id)) return false;
  }

  const node = chapter.nodes[candidate.nodeId as GameState['nodeId']];
  return matchesInventory(node, evidence as EvidenceId[]);
}

export function getAvailableActions(state: GameState): readonly StoryAction[] {
  if (!isGameState(state)) return [];
  const chapter = getChapter(state.chapterId)!;
  return actionsFor(chapter.nodes[state.nodeId], state.evidence);
}

/** Only declared, currently available actions can alter the state. */
export function transition(state: GameState, actionId: string): GameState | null {
  const action = getAvailableActions(state).find((candidate) => candidate.id === actionId);
  if (!action) return null;
  const next = applyAction(state, action);
  return isGameState(next) ? next : null;
}

/** Check authored references before a chapter is offered to players. */
export function validateChapter(chapter: Chapter): string[] {
  const errors: string[] = [];
  const hasEvidence = (id: EvidenceId) => owns(chapter.evidence, id);
  if (!owns(chapter.nodes, chapter.entryNode)) errors.push('Chapter entry node does not exist');
  if (!Number.isInteger(chapter.order) || chapter.order < 0) errors.push('Chapter order must be a nonnegative integer');
  if (new Set(chapter.requiredEvidence).size !== chapter.requiredEvidence.length) errors.push('Chapter required evidence contains duplicates');
  for (const id of chapter.requiredEvidence) {
    if (!hasEvidence(id)) errors.push(`Chapter requires unknown evidence ${id}`);
  }
  if (![chapter.clue.x, chapter.clue.y].every((coordinate) => Number.isFinite(coordinate) && coordinate >= 0 && coordinate <= 100)) {
    errors.push('Chapter clue coordinates must be percentages');
  }

  for (const [nodeId, node] of Object.entries(chapter.nodes)) {
    const character = getCharacter(node.portrait);
    if (node.portrait && !character) errors.push(`${nodeId}: unknown character ${node.portrait}`);
    if (node.expression && (!character || !character.portraits[node.expression])) errors.push(`${nodeId}: expression is unavailable for this character`);
    if (node.presence && (!character || !['scene', 'radio', 'archive'].includes(node.presence))) errors.push(`${nodeId}: invalid character presence`);
    if (!Number.isFinite(node.progress) || node.progress < 0 || node.progress > 100) {
      errors.push(`${nodeId}: progress must be between 0 and 100`);
    }
    if (node.outcome && node.kind !== 'ending') errors.push(`${nodeId}: outcomes must belong to an ending`);
    if (node.outcome === 'complete' && !chapter.requiredEvidence.every((id) => node.requiresEvidence?.includes(id))) {
      errors.push(`${nodeId}: completion must require every core evidence item`);
    }
    if (node.kind === 'puzzle' && (!node.puzzle?.prompt.trim() || !node.puzzle?.hint.trim() || node.actions.length < 2)) {
      errors.push(`${nodeId}: puzzle needs a prompt, hint and at least two answers`);
    }
    for (const id of [...(node.requiresEvidence ?? []), ...(node.excludesEvidence ?? [])]) {
      if (!hasEvidence(id)) errors.push(`${nodeId}: unknown evidence ${id}`);
    }
    if ((node.requiresEvidence ?? []).some((id) => node.excludesEvidence?.includes(id))) {
      errors.push(`${nodeId}: evidence is both required and excluded`);
    }

    const actionIds = new Set<string>();
    for (const action of node.actions) {
      if (!action.id || actionIds.has(action.id)) errors.push(`${nodeId}: duplicate or empty action id ${action.id}`);
      actionIds.add(action.id);
      if (!owns(chapter.nodes, action.next)) errors.push(`${nodeId}/${action.id}: target node does not exist`);
      const referencedEvidence = [...(action.requiresEvidence ?? [])];
      if (action.collect) referencedEvidence.push(action.collect);
      if (action.hidesWhenCollected) referencedEvidence.push(action.hidesWhenCollected);
      for (const id of referencedEvidence) {
        if (!hasEvidence(id)) errors.push(`${nodeId}/${action.id}: unknown evidence ${id}`);
      }
      if (action.resetEvidence && action.collect) errors.push(`${nodeId}/${action.id}: reset and collect cannot be combined`);
    }

    const hotspotIds = new Set<string>();
    for (const hotspot of node.scene?.hotspots ?? []) {
      if (!hotspot.id || hotspotIds.has(hotspot.id)) errors.push(`${nodeId}: duplicate or empty hotspot id ${hotspot.id}`);
      hotspotIds.add(hotspot.id);
      if (!actionIds.has(hotspot.actionId)) errors.push(`${nodeId}/${hotspot.id}: hotspot action does not exist`);
      if (!hotspot.label.trim()) errors.push(`${nodeId}/${hotspot.id}: hotspot needs an accessible label`);
      if (![hotspot.x, hotspot.y].every((position) => Number.isFinite(position) && position >= 0 && position <= 100)) {
        errors.push(`${nodeId}/${hotspot.id}: hotspot coordinates must be percentages`);
      }
    }
  }

  // Explore inventories as well as nodes: a gate can be structurally connected
  // yet impossible to open, and an action can strand only one evidence order.
  if (errors.length) return errors;
  const pending: GameState[] = [{ chapterId: chapter.id, nodeId: chapter.entryNode, evidence: [] }];
  const visitedStates = new Set<string>();
  const visitedNodes = new Set<string>();
  const outcomes = new Set<string>();
  while (pending.length) {
    const state = pending.pop()!;
    const key = JSON.stringify([state.nodeId, [...state.evidence].sort()]);
    if (visitedStates.has(key)) continue;
    visitedStates.add(key);
    visitedNodes.add(state.nodeId);
    const node = chapter.nodes[state.nodeId];
    if (!matchesInventory(node, state.evidence)) {
      errors.push(`${state.nodeId}: reachable inventory violates node requirements`);
      continue;
    }
    if (node.outcome) outcomes.add(node.outcome);
    const actions = actionsFor(node, state.evidence);
    if (!actions.length) errors.push(`${state.nodeId}: reachable state has no available action`);
    for (const action of actions) {
      const next = applyAction(state, action);
      if (!matchesInventory(chapter.nodes[next.nodeId], next.evidence)) {
        errors.push(`${state.nodeId}/${action.id}: action violates target inventory requirements`);
      } else {
        pending.push(next);
      }
    }
  }
  for (const [nodeId, node] of Object.entries(chapter.nodes)) {
    if (node.kind !== 'title' && !visitedNodes.has(nodeId)) errors.push(`${nodeId}: node cannot be reached from chapter entry`);
  }
  if (!outcomes.has('complete')) errors.push('Chapter has no reachable standard ending');
  return errors;
}
