import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useState } from "react";

import { sound } from "@/lib/audio";

/**
 * Mounts the app-wide sound layer: restores preferences and plays a subtle
 * click for interactive elements.
 */
export function SoundProvider() {
  useEffect(() => {
    sound.hydrate();

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

    window.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, []);

  return null;
}

interface SoundControlsProps {
  className?: string;
  /** Kept for compatibility with existing call sites. */
  hideMusic?: boolean;
  compact?: boolean;
}

/** Small floating pill to toggle the interface sounds. */
export function SoundControls({ className = "" }: SoundControlsProps) {
  const [, force] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    const unsubscribe = sound.subscribe(() => force((n) => n + 1));
    return () => {
      unsubscribe();
    };
  }, []);

  // Render a stable, identical placeholder on SSR and first client paint so we
  // never trigger a hydration mismatch. The real controls appear after mount.
  if (!hydrated) {
    return (
      <div
        className={`flex items-center gap-1 rounded-full border border-border/60 bg-card/80 p-1 shadow-soft backdrop-blur-xl ${className}`}
        aria-hidden="true"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Volume2 className="h-4 w-4" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-1 rounded-full border border-border/60 bg-card/80 p-1 shadow-soft backdrop-blur-xl ${className}`}
    >
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
