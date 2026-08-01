import { Music, Music2, Volume2, VolumeX } from "lucide-react";
import { useEffect, useState } from "react";

import { sound } from "@/lib/audio";

/**
 * Mounts the app-wide sound layer: restores preferences, unlocks audio on the
 * first user gesture, and plays a subtle click for interactive elements.
 */
export function SoundProvider() {
  useEffect(() => {
    sound.hydrate();

    const unlock = () => sound.resumeIfEnabled();

    const onPointerDown = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const el = target.closest(
        'button, a, [role="button"], input[type="checkbox"], input[type="radio"], label',
      );
      if (!el) return;
      if (el.getAttribute("data-no-sound") !== null) return;
      if ((el as HTMLButtonElement).disabled) return;
      sound.play("click");
    };

    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    window.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, []);

  return null;
}

/** Small floating pill to toggle the ambient music and the UI sounds. */
export function SoundControls({ className = "" }: { className?: string }) {
  const [, force] = useState(0);

  useEffect(() => {
    const unsubscribe = sound.subscribe(() => force((n) => n + 1));
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div
      className={`flex items-center gap-1 rounded-full border border-border/60 bg-card/80 p-1 shadow-soft backdrop-blur-xl ${className}`}
    >
      <button
        type="button"
        data-no-sound
        onClick={() => sound.setMusic(!sound.musicEnabled)}
        aria-label={sound.musicEnabled ? "Turn calm music off" : "Turn calm music on"}
        title={sound.musicEnabled ? "Calm music: on" : "Calm music: off"}
        className={`cursor-pointer rounded-full p-2 transition ${
          sound.musicEnabled
            ? "bg-primary/15 text-primary"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        {sound.musicEnabled ? <Music className="h-4 w-4" /> : <Music2 className="h-4 w-4" />}
      </button>
      <button
        type="button"
        data-no-sound
        onClick={() => sound.setSfx(!sound.sfxEnabled)}
        aria-label={sound.sfxEnabled ? "Mute interface sounds" : "Unmute interface sounds"}
        title={sound.sfxEnabled ? "Interface sounds: on" : "Interface sounds: off"}
        className={`cursor-pointer rounded-full p-2 transition ${
          sound.sfxEnabled
            ? "bg-primary/15 text-primary"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        {sound.sfxEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
      </button>
    </div>
  );
}
