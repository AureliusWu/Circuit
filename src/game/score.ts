import type { ChapterId } from '../story/types';

/** Stable chapter identities select local music without changing saved progress. */
export function sceneMusicFor(chapter: ChapterId): string {
  if (chapter === 'tickets') return 'audio/bgm/ticket-window.ogg';
  if (chapter === 'thirteen-households' || chapter === 'seventh-night') return 'audio/bgm/circuit-thirteen.ogg';
  return 'audio/bgm/circuit-nightshift.ogg';
}
