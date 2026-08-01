/**
 * Addiblock sound engine.
 *
 * UI sound effects are synthesised live in the browser with the Web Audio API.
 * The background ambience is a looped audio track supplied by the project owner.
 */

import ambientLoop from "@/assets/ambient-loop.mp3.asset.json";



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

// A slow, airy D-major-ish drift: low sustained pads with long crossfades so it
// sits far behind the interface instead of feeling like a song being played.
const CHORDS: number[][] = [
  [146.83, 220.0, 293.66], // D3 A3 D4
  [164.81, 246.94, 329.63], // E3 B3 E4
  [110.0, 164.81, 220.0], // A2 E3 A3
  [123.47, 185.0, 246.94], // B2 F#3 B3
];
// Sparse, very soft high notes that just colour the air.
const BELLS = [587.33, 659.25, 880.0, 987.77];


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
    // Very long fade in/out so chords blur into each other — no attack, no beat.
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(0.1, at + dur * 0.45);
    gain.gain.linearRampToValueAtTime(0, at + dur);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 520;
    filter.Q.value = 0.2;

    gain.connect(filter);
    filter.connect(this.musicGain!);

    [0, 2.5].forEach((detune) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      osc.detune.value = detune;
      osc.connect(gain);
      osc.start(at);
      osc.stop(at + dur + 0.4);
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
    gain.gain.linearRampToValueAtTime(0.018, at + 0.6);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 5);
    osc.connect(gain);
    gain.connect(this.musicGain!);
    osc.start(at);
    osc.stop(at + 5.1);
  }

  private trackEl: HTMLAudioElement | null = null;

  private startMusic() {
    const ctx = this.ensureContext();
    if (!ctx || this.running) return;
    this.running = true;

    if (!this.trackEl) {
      const el = new Audio(ambientLoop.url);
      el.loop = true;
      el.preload = "auto";
      el.crossOrigin = "anonymous";
      this.trackEl = el;
      try {
        const src = ctx.createMediaElementSource(el);
        src.connect(this.musicGain!);
      } catch {
        // Fallback: element plays directly at a soft level.
        el.volume = 0.28;
      }
    }

    this.musicGain!.gain.cancelScheduledValues(ctx.currentTime);
    this.musicGain!.gain.setValueAtTime(this.musicGain!.gain.value, ctx.currentTime);
    // Present in the room without competing with the interface.
    this.musicGain!.gain.linearRampToValueAtTime(0.45, ctx.currentTime + 3);
    void this.trackEl.play().catch(() => {});
  }

  private stopMusic() {
    this.running = false;
    if (this.ctx && this.musicGain) {
      const now = this.ctx.currentTime;
      this.musicGain.gain.cancelScheduledValues(now);
      this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, now);
      this.musicGain.gain.linearRampToValueAtTime(0, now + 1);
    }
    const el = this.trackEl;
    if (el) window.setTimeout(() => el.pause(), 1100);
    this.timers.forEach((t) => window.clearInterval(t));
    this.timers = [];
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
