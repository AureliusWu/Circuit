import type { ChapterId } from '../story/types';

/** Stable chapter identities select local music without changing saved progress. */
export function sceneMusicFor(chapter: ChapterId, node = ''): string | null {
  if (chapter === 'signoff') {
    if (['closeDesk', 'window', 'names', 'offDuty', 'end'].includes(node)) return null;
    if (['origin', 'originBoundary', 'bell', 'recordOrigin', 'compareEnd', 'puzzle2', 'wrongSign'].includes(node)) return 'audio/bgm/circuit-thirteen.ogg';
  }
  if (chapter === 'tickets') return 'audio/bgm/ticket-window.ogg';
  if (chapter === 'thirteen-households' || chapter === 'seventh-night') return 'audio/bgm/circuit-thirteen.ogg';
  return 'audio/bgm/circuit-nightshift.ogg';
}

export function sceneAmbienceFor(chapter: ChapterId, node = ''): 'rain' | 'room' | 'quiet' {
  if (chapter !== 'signoff') return 'rain';
  return ['closeDesk', 'window', 'names', 'offDuty', 'end'].includes(node) ? 'quiet' : 'room';
}
