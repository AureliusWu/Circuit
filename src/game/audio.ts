import type { Preferences } from './preferences';
import { SceneLoop } from './sceneLoop';

/** Original procedural score: low drones, transformer hum and filtered rain. */
export class CircuitAudio {
  private context: AudioContext;
  private music: GainNode;
  private droneBus: GainNode;
  private sceneLoop: SceneLoop;
  private ambience: GainNode;
  private humLevel: GainNode;
  private rainLevel: GainNode;
  private output: GainNode;
  private sources: AudioScheduledSourceNode[] = [];

  constructor() {
    this.context = new AudioContext();
    this.output = this.context.createGain();
    this.output.gain.value = 0;
    this.output.connect(this.context.destination);
    this.music = this.context.createGain();
    this.ambience = this.context.createGain();
    this.music.connect(this.output);
    this.droneBus = this.context.createGain();
    this.droneBus.connect(this.music);
    this.sceneLoop = new SceneLoop(this.context, this.music);
    this.ambience.connect(this.output);
    for (const frequency of [43.65, 65.41, 87.3]) {
      const drone = this.context.createOscillator();
      const quiet = this.context.createGain();
      drone.type = 'sine';
      drone.frequency.value = frequency;
      quiet.gain.value = .035;
      drone.connect(quiet).connect(this.droneBus);
      drone.start();
      this.sources.push(drone);
    }
    const hum = this.context.createOscillator();
    const humGain = this.context.createGain();
    this.humLevel = humGain;
    hum.frequency.value = 50;
    humGain.gain.value = .024;
    hum.connect(humGain).connect(this.ambience);
    hum.start();
    this.sources.push(hum);
    const rain = this.context.createBufferSource();
    const buffer = this.context.createBuffer(1, this.context.sampleRate * 4, this.context.sampleRate);
    const samples = buffer.getChannelData(0);
    let previous = 0;
    for (let index = 0; index < samples.length; index += 1) {
      previous = (previous + (Math.random() * 2 - 1) * .035) / 1.02;
      samples[index] = previous * .14;
    }
    const filter = this.context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 650;
    this.rainLevel = this.context.createGain();
    rain.buffer = buffer;
    rain.loop = true;
    rain.connect(filter).connect(this.rainLevel).connect(this.ambience);
    rain.start();
    this.sources.push(rain);
  }

  async configure(preferences: Preferences, running: boolean, speaking = false, sceneMusic?: string | null,
    ambienceMode: 'rain' | 'room' | 'quiet' = 'rain') {
    if (this.context.state === 'closed') return;
    const now = this.context.currentTime;
    // null is an authored rest, while undefined retains the procedural fallback.
    this.droneBus.gain.setTargetAtTime(sceneMusic === undefined ? 1 : 0, now, .3);
    this.sceneLoop.select(sceneMusic ?? undefined);
    this.rainLevel.gain.setTargetAtTime(ambienceMode === 'rain' ? 1 : 0, now, .3);
    this.humLevel.gain.setTargetAtTime(ambienceMode === 'quiet' ? 0 : .024, now, .3);
    this.music.gain.setTargetAtTime(preferences.musicVolume * (speaking ? .35 : 1), now, .12);
    this.ambience.gain.setTargetAtTime(preferences.ambienceVolume * (speaking ? .6 : 1), now, .12);
    this.output.gain.setTargetAtTime(preferences.muted ? 0 : 1, now, .12);
    try {
      if (running && !preferences.muted) { await this.context.resume(); await this.sceneLoop.ensure(); }
      else await this.context.suspend();
    } catch { /* Audio availability never blocks reading or saving. */ }
  }

  cue(kind: 'record' | 'failure' | 'complete') {
    if (this.context.state !== 'running') return;
    const tone = this.context.createOscillator();
    const gain = this.context.createGain();
    const now = this.context.currentTime;
    tone.type = 'sine';
    tone.frequency.setValueAtTime(kind === 'failure' ? 75 : kind === 'complete' ? 392 : 240, now);
    tone.frequency.exponentialRampToValueAtTime(kind === 'failure' ? 42 : 196, now + .25);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(.055, now + .02);
    gain.gain.exponentialRampToValueAtTime(.001, now + .35);
    tone.connect(gain).connect(this.ambience);
    tone.start();
    tone.stop(now + .4);
    tone.onended = () => { tone.disconnect(); gain.disconnect(); };
  }

  dispose() {
    this.sceneLoop.dispose();
    this.sources.forEach((source) => source.stop());
    this.sources = [];
    void this.context.close().catch(() => {});
  }
}
