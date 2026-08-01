/**
 * Addiblock sound engine.
 *
 * Every sound in the app is synthesised live in the browser with the Web Audio
 * API — there are no recordings, samples or third-party tracks involved, so the
 * ambience and the UI sound effects are original, uncopyrighted and royalty
 * free by construction.
 */

type SfxName =
  | "click"
  | "toggle"
  | "success"
  | "complete"
  | "open"
  | "close"
  | "error"
  | "breath";

const MUSIC_KEY = "addiblock.sound.music";
const SFX_KEY = "addiblock.sound.sfx";

// A gentle F-major-ish pentatonic world: calm, no dissonance, no urgency.
const CHORDS: number[][] = [
  [174.61, 261.63, 349.23], // F3 C4 F4
  [196.0, 293.66, 392.0], // G3 D4 G4
  [220.0, 329.63, 440.0], // A3 E4 A4
  [130.81, 196.0, 261.63], // C3 G3 C4
];
const BELLS = [523.25, 587.33, 698.46, 783.99, 880.0, 1046.5];

class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicNodes: AudioNode[] = [];
  private timers: number[] = [];
  private chordIndex = 0;
  private running = false;

  musicEnabled = false;
  sfxEnabled = true;

  private listeners = new Set<() => void>();

  /** Restore saved preferences (browser only). */
  hydrate() {
    if (typeof window === "undefined") return;
    const music = window.localStorage.getItem(MUSIC_KEY);
    const sfx = window.localStorage.getItem(SFX_KEY);
    this.musicEnabled = music === "on";
    this.sfxEnabled = sfx !== "off";
    this.emit();
  }

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit() {
    this.listeners.forEach((fn) => fn());
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const Ctor: typeof AudioContext | undefined =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0;
      this.musicGain.connect(this.master);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.5;
      this.sfxGain.connect(this.master);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  // ---------------------------------------------------------------- ambience

  private padVoice(freq: number, at: number, dur: number) {
    const ctx = this.ctx!;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(0.16, at + dur * 0.4);
    gain.gain.linearRampToValueAtTime(0, at + dur);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 900;
    filter.Q.value = 0.4;

    gain.connect(filter);
    filter.connect(this.musicGain!);

    [0, 3.5].forEach((detune, i) => {
      const osc = ctx.createOscillator();
      osc.type = i === 0 ? "sine" : "triangle";
      osc.frequency.value = freq;
      osc.detune.value = detune;
      osc.connect(gain);
      osc.start(at);
      osc.stop(at + dur + 0.2);
    });
  }

  private bell(at: number) {
    const ctx = this.ctx!;
    const freq = BELLS[Math.floor(Math.random() * BELLS.length)];
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(0.05, at + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 3.5);
    osc.connect(gain);
    gain.connect(this.musicGain!);
    osc.start(at);
    osc.stop(at + 3.6);
  }

  private scheduleChord = () => {
    if (!this.running || !this.ctx) return;
    const now = this.ctx.currentTime;
    const chord = CHORDS[this.chordIndex % CHORDS.length];
    this.chordIndex += 1;
    chord.forEach((f, i) => this.padVoice(f, now + i * 0.15, 13));
    if (Math.random() > 0.35) this.bell(now + 2 + Math.random() * 6);
  };

  private startMusic() {
    const ctx = this.ensureContext();
    if (!ctx || this.running) return;
    this.running = true;
    this.musicGain!.gain.cancelScheduledValues(ctx.currentTime);
    this.musicGain!.gain.setValueAtTime(this.musicGain!.gain.value, ctx.currentTime);
    this.musicGain!.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 2.5);
    this.scheduleChord();
    this.timers.push(window.setInterval(this.scheduleChord, 11000));
  }

  private stopMusic() {
    if (!this.ctx || !this.musicGain) return;
    const now = this.ctx.currentTime;
    this.musicGain.gain.cancelScheduledValues(now);
    this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, now);
    this.musicGain.gain.linearRampToValueAtTime(0, now + 1.2);
    this.timers.forEach((t) => window.clearInterval(t));
    this.timers = [];
    this.musicNodes = [];
    this.running = false;
  }

  setMusic(on: boolean) {
    this.musicEnabled = on;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(MUSIC_KEY, on ? "on" : "off");
    }
    if (on) this.startMusic();
    else this.stopMusic();
    this.emit();
  }

  setSfx(on: boolean) {
    this.sfxEnabled = on;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SFX_KEY, on ? "on" : "off");
    }
    this.emit();
    if (on) this.play("toggle");
  }

  /** Called on the first user gesture so autoplay policies are respected. */
  resumeIfEnabled() {
    if (this.musicEnabled) this.startMusic();
  }

  // --------------------------------------------------------------------- sfx

  private tone(
    freq: number,
    opts: {
      at?: number;
      dur?: number;
      type?: OscillatorType;
      gain?: number;
      slideTo?: number;
    } = {},
  ) {
    const ctx = this.ctx!;
    const at = ctx.currentTime + (opts.at ?? 0);
    const dur = opts.dur ?? 0.12;
    const osc = ctx.createOscillator();
    osc.type = opts.type ?? "sine";
    osc.frequency.setValueAtTime(freq, at);
    if (opts.slideTo) osc.frequency.exponentialRampToValueAtTime(opts.slideTo, at + dur);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(opts.gain ?? 0.14, at + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    osc.connect(gain);
    gain.connect(this.sfxGain!);
    osc.start(at);
    osc.stop(at + dur + 0.05);
  }

  play(name: SfxName) {
    if (!this.sfxEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    switch (name) {
      case "click":
        this.tone(660, { dur: 0.07, gain: 0.07, type: "sine" });
        break;
      case "toggle":
        this.tone(523.25, { dur: 0.09, gain: 0.08 });
        this.tone(784, { at: 0.05, dur: 0.1, gain: 0.06 });
        break;
      case "success":
        this.tone(587.33, { dur: 0.16, gain: 0.1 });
        this.tone(880, { at: 0.09, dur: 0.22, gain: 0.09 });
        break;
      case "complete":
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
          this.tone(f, { at: i * 0.08, dur: 0.3, gain: 0.09 }),
        );
        break;
      case "open":
        this.tone(392, { dur: 0.18, gain: 0.07, slideTo: 587.33 });
        break;
      case "close":
        this.tone(587.33, { dur: 0.18, gain: 0.06, slideTo: 392 });
        break;
      case "error":
        this.tone(220, { dur: 0.22, gain: 0.08, type: "triangle", slideTo: 174.61 });
        break;
      case "breath":
        this.tone(261.63, { dur: 1.6, gain: 0.05, type: "sine" });
        break;
    }
  }
}

export const sound = new SoundEngine();

export function playSound(name: SfxName) {
  sound.play(name);
}
