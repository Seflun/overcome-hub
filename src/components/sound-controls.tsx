import { Music, Music2, Volume2, VolumeX } from "lucide-react";
import { useEffect, useState } from "react";

import { sound, sliderToVolume, volumeToSlider } from "@/lib/audio";

/**
 * Mounts the app-wide sound layer: restores preferences, unlocks audio on the
 * first user gesture, and plays a subtle click for interactive elements.
 */
export function SoundProvider() {
  useEffect(() => {
    sound.hydrate();

    const unlock = () => {
      sound.resumeIfEnabled();
      if (sound.isPlaying) detachUnlock();
    };

    const detachUnlock = () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("visibilitychange", unlock);
    };

    // Try immediately (works when the tab already has audio permission, e.g.
    // coming back from checkout), then keep retrying on user gestures.
    sound.resumeIfEnabled();
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    window.addEventListener("visibilitychange", unlock);

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
      detachUnlock();
      window.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, []);

  return null;
}

interface SoundControlsProps {
  className?: string;
  /** Hide the ambient music toggle. */
  hideMusic?: boolean;
  /** Hide the volume slider when music is enabled. */
  compact?: boolean;
}

/** Small floating pill to toggle the ambient music and the UI sounds. */
export function SoundControls({ className = "", hideMusic = false, compact = false }: SoundControlsProps) {
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
        className={`flex h-9 items-center gap-1 rounded-full border border-border/60 bg-card/80 p-1 shadow-soft backdrop-blur-xl ${className}`}
        aria-hidden="true"
      >
        <div className="h-7 w-7 rounded-full" />
        <div className="h-7 w-7 rounded-full" />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-1 rounded-full border border-border/60 bg-card/80 p-1 shadow-soft backdrop-blur-xl ${className}`}
    >
      {!hideMusic && (
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
      )}
      {sound.musicEnabled && !compact && (
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          data-no-sound
          value={volumeToSlider(sound.musicVolume)}
          onChange={(e) => sound.setMusicVolume(sliderToVolume(Number(e.target.value)))}
          aria-label="Music volume"
          title={`Music volume: ${volumeToSlider(sound.musicVolume)}%`}
          className="h-1 w-20 cursor-pointer appearance-none rounded-full bg-border accent-primary"
        />
      )}
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

