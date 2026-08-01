import { Lightbulb } from "lucide-react";

import { useStore } from "../lib/store";

/** Free, on-device pattern detection — no AI needed. */
export function PatternSpotlight() {
  const { state } = useStore();
  const insights: string[] = [];

  const events = [
    ...state.cravings.map((c) => ({ at: c.at, trigger: c.trigger })),
    ...state.relapses.map((r) => ({ at: r.at, trigger: r.trigger })),
    ...state.journal.filter((j) => j.trigger).map((j) => ({ at: j.createdAt, trigger: j.trigger! })),
  ];

  if (events.length >= 3) {
    const byHour = new Map<number, number>();
    const byWeekday = new Map<number, number>();
    const byTrigger = new Map<string, number>();
    for (const e of events) {
      const d = new Date(e.at);
      const bucket = Math.floor(d.getHours() / 3) * 3;
      byHour.set(bucket, (byHour.get(bucket) ?? 0) + 1);
      byWeekday.set(d.getDay(), (byWeekday.get(d.getDay()) ?? 0) + 1);
      const t = e.trigger.trim().toLowerCase();
      if (t) byTrigger.set(t, (byTrigger.get(t) ?? 0) + 1);
    }
    const topHour = [...byHour.entries()].sort((a, b) => b[1] - a[1])[0];
    const topDay = [...byWeekday.entries()].sort((a, b) => b[1] - a[1])[0];
    const topTrigger = [...byTrigger.entries()].sort((a, b) => b[1] - a[1])[0];

    if (topHour)
      insights.push(
        `Your urges cluster between **${String(topHour[0]).padStart(2, "0")}:00 and ${String((topHour[0] + 3) % 24).padStart(2, "0")}:00** — plan something for that window.`,
      );
    if (topDay)
      insights.push(
        `**${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][topDay[0]]}** is your heaviest day so far.`,
      );
    if (topTrigger && topTrigger[1] > 1)
      insights.push(`"**${topTrigger[0]}**" shows up ${topTrigger[1]}× — it's your main trigger right now.`);
  }

  const withMood = state.checkins.slice(-14);
  if (withMood.length >= 4) {
    const half = Math.floor(withMood.length / 2);
    const a = withMood.slice(0, half).reduce((s, c) => s + c.mood, 0) / half;
    const b = withMood.slice(half).reduce((s, c) => s + c.mood, 0) / (withMood.length - half);
    if (b - a >= 0.4) insights.push("Your mood is **trending up** compared to last week. Keep the routine.");
    else if (a - b >= 0.4) insights.push("Your mood has **dipped** recently — extra sleep and a check-in help more than willpower.");
  }

  if (state.cravings.length >= 3) {
    const avg = state.cravings.reduce((s, c) => s + c.minutes, 0) / state.cravings.length;
    insights.push(`You ride out an average craving in **${Math.round(avg)} minutes** — proof they pass.`);
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card/70 p-4">
      <div className="flex items-center gap-2 text-sm font-bold">
        <Lightbulb className="h-4 w-4 text-primary" /> Pattern spotlight
        <span className="ml-auto text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Free</span>
      </div>
      {insights.length === 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Log a few cravings, check-ins or journal entries and your personal patterns will show up here.
        </p>
      ) : (
        <ul className="mt-3 space-y-2 text-sm">
          {insights.map((t, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-primary">•</span>
              <span dangerouslySetInnerHTML={{ __html: t.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") }} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
