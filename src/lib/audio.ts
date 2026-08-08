/**
 * Addiblock sound engine.
 *
 * UI sound effects are synthesised live in the browser with the Web Audio API.
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

const SFX_KEY = "addiblock.sound.sfx";

class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  sfxEnabled = true;

  private listeners = new Set<() => void>();

  /** Restore saved preferences (browser only). */
  hydrate() {
    if (typeof window === "undefined") return;
    const sfx = window.localStorage.getItem(SFX_KEY);
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

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.5;
      this.sfxGain.connect(this.master);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  setSfx(on: boolean) {
    this.sfxEnabled = on;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SFX_KEY, on ? "on" : "off");
    }
    this.emit();
    if (on) this.play("toggle");
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
