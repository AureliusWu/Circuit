import type { SaveStorage } from './saves';

export const PREFERENCES_KEY = 'circuit-settings-v100';
export const TEXT_SPEEDS = ['instant', 'slow', 'normal', 'fast'] as const;

export type Preferences = {
  textSpeed: typeof TEXT_SPEEDS[number];
  autoDelay: number;
  musicVolume: number;
  ambienceVolume: number;
  muted: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
};

export const DEFAULT_PREFERENCES: Readonly<Preferences> = Object.freeze({
  textSpeed: 'normal',
  autoDelay: 4,
  musicVolume: 0.35,
  ambienceVolume: 0.55,
  muted: false,
  highContrast: false,
  reducedMotion: false
});

export type PreferencesLoadResult =
  | { status: 'valid' | 'empty'; preferences: Preferences }
  | { status: 'invalid' | 'unavailable'; preferences: Preferences; reason: string };

export type PreferencesWriteResult =
  | { status: 'saved'; preferences: Preferences }
  | { status: 'invalid' | 'unavailable'; reason: string };

const INVALID_REASON = '设置内容无效，已使用默认设置；原设置已保留。';
const STORAGE_REASON = '浏览器暂时无法保存设置，本次游玩仍可使用当前设置。';
const own = (value: object, key: string) => Object.prototype.hasOwnProperty.call(value, key);

export function isPreferences(value: unknown): value is Preferences {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return false;
  const candidate = value as Record<string, unknown>;
  if (!Object.keys(DEFAULT_PREFERENCES).every((key) => own(candidate, key))) return false;
  if (typeof candidate.textSpeed !== 'string' || !TEXT_SPEEDS.some((speed) => speed === candidate.textSpeed)) return false;
  if (typeof candidate.autoDelay !== 'number' || !Number.isFinite(candidate.autoDelay) || candidate.autoDelay < 2 || candidate.autoDelay > 8) return false;
  for (const key of ['musicVolume', 'ambienceVolume']) {
    const volume = candidate[key];
    if (typeof volume !== 'number' || !Number.isFinite(volume) || volume < 0 || volume > 1) return false;
  }
  return ['muted', 'highContrast', 'reducedMotion'].every((key) => typeof candidate[key] === 'boolean');
}

function copyPreferences(preferences: Readonly<Preferences>): Preferences {
  return {
    textSpeed: preferences.textSpeed,
    autoDelay: preferences.autoDelay,
    musicVolume: preferences.musicVolume,
    ambienceVolume: preferences.ambienceVolume,
    muted: preferences.muted,
    highContrast: preferences.highContrast,
    reducedMotion: preferences.reducedMotion
  };
}

/** Missing, denied or damaged settings never prevent a new game. Reads never write. */
export function loadPreferences(storage: SaveStorage | null | undefined): PreferencesLoadResult {
  const defaults = copyPreferences(DEFAULT_PREFERENCES);
  if (!storage) return { status: 'unavailable', preferences: defaults, reason: STORAGE_REASON };
  let raw: string | null;
  try {
    raw = storage.getItem(PREFERENCES_KEY);
  } catch {
    return { status: 'unavailable', preferences: defaults, reason: STORAGE_REASON };
  }
  if (raw === null) return { status: 'empty', preferences: defaults };
  try {
    const parsed: unknown = JSON.parse(raw);
    return isPreferences(parsed)
      ? { status: 'valid', preferences: copyPreferences(parsed) }
      : { status: 'invalid', preferences: defaults, reason: INVALID_REASON };
  } catch {
    return { status: 'invalid', preferences: defaults, reason: INVALID_REASON };
  }
}

export function savePreferences(storage: SaveStorage | null | undefined, preferences: Preferences): PreferencesWriteResult {
  if (!isPreferences(preferences)) return { status: 'invalid', reason: INVALID_REASON };
  if (!storage) return { status: 'unavailable', reason: STORAGE_REASON };
  const copied = copyPreferences(preferences);
  try {
    storage.setItem(PREFERENCES_KEY, JSON.stringify(copied));
    return { status: 'saved', preferences: copied };
  } catch {
    return { status: 'unavailable', reason: STORAGE_REASON };
  }
}
