import type { Preferences } from './preferences';
import type { VoiceClip } from './mediaCatalog';

export type VoiceState = { status: 'idle' | 'loading' | 'playing' | 'paused' | 'failed'; clip?: VoiceClip; userPaused: boolean };
export const voiceBlocksAuto = (state: VoiceState) => ['loading', 'playing', 'paused'].includes(state.status);
type AudioFactory = (url: string) => HTMLAudioElement;

/** Bundled recordings only. A scene change invalidates promises and media events. */
export class RecordedAudio {
  private voice: HTMLAudioElement | null = null;
  private effect: HTMLAudioElement | null = null;
  private queue: readonly VoiceClip[] = [];
  private index = 0;
  private generation = 0;
  private attempt = 0;
  private timeout?: ReturnType<typeof setTimeout>;
  private preferences?: Preferences;
  private running = false;
  private visible = true;
  private replayPanel = false;
  private manual = false;
  private disposed = false;
  private listeners = new Set<(state: VoiceState) => void>();
  state: VoiceState = { status: 'idle', userPaused: false };

  constructor(private base: string, private factory: AudioFactory = (url) => new Audio(url)) {}

  subscribe(listener: (state: VoiceState) => void) {
    this.listeners.add(listener);
    listener(this.state);
    return () => { this.listeners.delete(listener); };
  }

  private publish(status: VoiceState['status'], userPaused = false) {
    this.state = { status, clip: this.queue[this.index], userPaused };
    this.listeners.forEach((listener) => listener(this.state));
  }

  private allowed() {
    return !this.disposed && this.visible && (this.running || (this.manual && this.replayPanel))
      && !!this.preferences?.voiceEnabled && !this.preferences.muted;
  }

  private releaseVoice() {
    clearTimeout(this.timeout);
    this.attempt += 1;
    if (!this.voice) return;
    this.voice.onended = this.voice.onerror = null;
    this.voice.pause();
    this.voice.removeAttribute('src');
    this.voice.load();
    this.voice = null;
  }

  configure(preferences: Preferences, running: boolean, visible = true, replayPanel = false) {
    this.preferences = preferences;
    this.running = running;
    this.visible = visible;
    this.replayPanel = replayPanel;
    if (this.voice) this.voice.volume = preferences.voiceVolume;
    if (this.effect) {
      this.effect.volume = preferences.sfxVolume;
      if (!running || !visible || preferences.muted) this.effect.pause();
    }
    if (!preferences.voiceEnabled || preferences.muted) { this.stop(); return; }
    if (!this.allowed() && this.voice && voiceBlocksAuto(this.state)) {
      clearTimeout(this.timeout);
      this.attempt += 1;
      this.voice.pause();
      this.publish('paused', this.state.userPaused);
    } else if (this.allowed() && this.voice && this.state.status === 'paused' && !this.state.userPaused) {
      this.resume();
    }
  }

  enter(clips: readonly VoiceClip[], effect?: string) {
    this.stop();
    this.stopEffect();
    this.queue = clips;
    this.index = 0;
    if (this.allowed() && clips.length) this.startClip();
    if (effect) this.cue(effect);
  }

  replay(clips: readonly VoiceClip[], inPanel = false) {
    this.stop();
    this.manual = inPanel;
    this.queue = clips;
    this.index = 0;
    if (this.allowed() && clips.length) this.startClip();
  }

  private startClip() {
    this.releaseVoice();
    const clip = this.queue[this.index];
    if (!clip) { this.stop(); return; }
    const generation = this.generation;
    let media: HTMLAudioElement;
    try { media = this.factory(this.base + clip.src.replace(/^\//, '')); }
    catch { this.publish('failed'); return; }
    this.voice = media;
    media.preload = 'auto';
    media.volume = this.preferences?.voiceVolume ?? .8;
    media.onended = () => {
      if (this.voice !== media || generation !== this.generation) return;
      this.index += 1;
      this.startClip();
    };
    media.onerror = () => {
      if (this.voice !== media || generation !== this.generation) return;
      clearTimeout(this.timeout);
      this.attempt += 1;
      media.pause();
      this.publish('failed');
    };
    this.publish('paused');
    this.resume();
  }

  resume() {
    const media = this.voice;
    if (!media || !this.allowed() || ['playing', 'loading'].includes(this.state.status)) return;
    const generation = this.generation;
    const attempt = ++this.attempt;
    this.publish('loading');
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      if (this.voice !== media || generation !== this.generation || attempt !== this.attempt) return;
      this.attempt += 1;
      media.pause();
      this.publish('failed');
    }, 12000);
    void media.play().then(() => {
      if (this.voice !== media || generation !== this.generation || attempt !== this.attempt) {
        if (this.voice !== media || !this.allowed() || this.state.userPaused) media.pause();
        return;
      }
      clearTimeout(this.timeout);
      if (!this.allowed()) { media.pause(); this.publish('paused'); return; }
      this.publish('playing');
    }).catch(() => {
      if (this.voice !== media || generation !== this.generation || attempt !== this.attempt) return;
      clearTimeout(this.timeout);
      this.publish('failed');
    });
  }

  pause() {
    if (!this.voice || !voiceBlocksAuto(this.state)) return;
    clearTimeout(this.timeout);
    this.attempt += 1;
    this.voice.pause();
    this.publish('paused', true);
  }

  stop() {
    this.generation += 1;
    this.releaseVoice();
    this.queue = [];
    this.index = 0;
    this.manual = false;
    this.publish('idle');
  }

  cue(src: string) {
    this.stopEffect();
    if (this.disposed || !this.running || !this.visible || this.preferences?.muted || !this.preferences?.sfxVolume) return;
    try {
      const media = this.factory(this.base + src.replace(/^\//, ''));
      this.effect = media;
      media.volume = this.preferences.sfxVolume;
      void media.play().then(() => {
        if (this.effect !== media || !this.running || !this.visible || this.preferences?.muted) media.pause();
      }).catch(() => {});
    } catch { /* A missing effect never blocks the story. */ }
  }

  private stopEffect() {
    this.effect?.pause();
    this.effect?.removeAttribute('src');
    this.effect?.load();
    this.effect = null;
  }

  dispose() {
    this.disposed = true;
    this.stop();
    this.stopEffect();
    this.listeners.clear();
  }
}
