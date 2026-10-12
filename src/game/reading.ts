import { useEffect, useState } from 'react';
import type { Preferences } from './preferences';

export function useReading(text: string, identity: string, preferences: Preferences, paused: boolean) {
  const characters = Array.from(text);
  const immediate = preferences.textSpeed === 'instant' || preferences.reducedMotion;
  const [reading, setReading] = useState({ identity, count: immediate ? characters.length : 0 });
  const count = reading.identity === identity ? reading.count : 0;
  const finished = immediate || count >= characters.length;
  useEffect(() => {
    if (paused || finished) return;
    const delay = preferences.textSpeed === 'slow' ? 55 : preferences.textSpeed === 'fast' ? 10 : 24;
    const timer = window.setTimeout(() => setReading((previous) => ({
      identity, count: previous.identity === identity ? previous.count + 1 : 1
    })), delay);
    return () => window.clearTimeout(timer);
  }, [identity, count, paused, finished, preferences.textSpeed]);
  return {
    text: finished ? text : characters.slice(0, count).join(''),
    finished,
    reveal: () => setReading({ identity, count: characters.length })
  };
}
