import { useState } from "react";
import { MessageCircleHeart, RefreshCw } from "lucide-react";

const PROMPTS = [
  "What did today cost you, and what did it give back?",
  "Name the exact moment the urge showed up. What happened right before?",
  "Who would you disappoint least by staying clean tonight — including yourself?",
  "What did you do instead of using today, even if it was small?",
  "Write the sentence your urge tells you. Then answer it.",
  "What's one thing about today you'd want to remember in a year?",
  "Where in your body did the craving live today?",
  "What would make tomorrow 10% easier?",
  "What are you avoiding by using? Say it plainly.",
  "List three things that went right, no matter how small.",
  "If a friend had your day, what would you tell them?",
  "What's the earliest warning sign you noticed today?",
];

/** Free daily reflection prompt — rotates by day, refreshable. */
export function DailyReflection() {
  const dayIndex = Math.floor(Date.now() / 86400000) % PROMPTS.length;
  const [i, setI] = useState(dayIndex);

  return (
    <div className="rounded-2xl border border-border/60 bg-card/70 p-4">
      <div className="flex items-center gap-2 text-sm font-bold">
        <MessageCircleHeart className="h-4 w-4 text-primary" /> Today's reflection
        <button
          onClick={() => setI((p) => (p + 1) % PROMPTS.length)}
          className="ml-auto inline-flex items-center gap-1 rounded-full border border-border/60 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground transition hover:text-foreground"
        >
          <RefreshCw className="h-3 w-3" /> New prompt
        </button>
      </div>
      <p className="mt-2 text-sm leading-relaxed">{PROMPTS[i]}</p>
    </div>
  );
}
