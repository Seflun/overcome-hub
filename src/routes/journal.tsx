import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BookHeart, Plus, TrendingDown, TrendingUp } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "../components/app-shell";
import { PremiumGate } from "../components/premium-badge";
import { useStore } from "../lib/store";
import { CATEGORIES } from "../lib/addiction-data";

export const Route = createFileRoute("/journal")({
  head: () => ({
    meta: [
      { title: "Journal — Addiction Blocker" },
      { name: "description", content: "Log cravings, moods and triggers. See the patterns behind your slips." },
      { property: "og:title", content: "Journal — Addiction Blocker" },
      { property: "og:description", content: "Track mood and triggers to spot the patterns behind your slips." },
    ],
  }),
  component: Journal,
});

const MOODS = [
  { v: 1, emoji: "😩", label: "Awful" },
  { v: 2, emoji: "😕", label: "Rough" },
  { v: 3, emoji: "😐", label: "Meh" },
  { v: 4, emoji: "🙂", label: "Good" },
  { v: 5, emoji: "🤩", label: "Great" },
] as const;

function Journal() {
  return (
    <AppShell>
      <div className="px-5 pt-8">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          <BookHeart className="h-3.5 w-3.5" /> Journal
        </div>
        <h1 className="text-3xl font-black tracking-tight">
          The <span className="text-aurora">pattern</span> is the point.
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Log a craving, a mood, or what triggered you. Addiction Blocker+ shows you the patterns behind your slips.
        </p>

        <div className="mt-6">
          <PremiumGate
            title="Journaling is a Plus feature"
            blurb="Log moods, triggers and notes — see when and why cravings hit hardest."
          >
            <JournalInner />
          </PremiumGate>
        </div>
      </div>
    </AppShell>
  );
}

function JournalInner() {
  const { state, addJournal } = useStore();
  const [mood, setMood] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [trigger, setTrigger] = useState("");
  const [note, setNote] = useState("");
  const [journeyId, setJourneyId] = useState<string>(state.activeId ?? state.journeys[0]?.id ?? "");

  const stats = useMemo(() => {
    if (state.journal.length === 0) return null;
    const avg = state.journal.reduce((a, e) => a + e.mood, 0) / state.journal.length;
    const byDay: Record<string, number[]> = {};
    for (const e of state.journal) {
      const d = new Date(e.createdAt).toLocaleDateString(undefined, { weekday: "short" });
      byDay[d] = byDay[d] ?? [];
      byDay[d].push(e.mood);
    }
    const worstDay = Object.entries(byDay)
      .map(([d, arr]) => [d, arr.reduce((a, b) => a + b, 0) / arr.length] as const)
      .sort((a, b) => a[1] - b[1])[0];
    const triggers: Record<string, number> = {};
    for (const e of state.journal) if (e.trigger) triggers[e.trigger] = (triggers[e.trigger] ?? 0) + 1;
    const topTrigger = Object.entries(triggers).sort((a, b) => b[1] - a[1])[0];
    return { avg, worstDay, topTrigger, count: state.journal.length };
  }, [state.journal]);

  return (
    <>
      <div className="rounded-3xl border border-border/60 bg-card/70 p-4">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">How do you feel?</div>
        <div className="mt-3 flex justify-between">
          {MOODS.map((m) => (
            <button
              key={m.v}
              onClick={() => setMood(m.v)}
              className={`flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-xs transition ${
                mood === m.v ? "bg-primary/15 text-primary" : "text-muted-foreground"
              }`}
            >
              <span className="text-2xl">{m.emoji}</span>
              <span>{m.label}</span>
            </button>
          ))}
        </div>

        {state.journeys.length > 1 && (
          <select
            value={journeyId}
            onChange={(e) => setJourneyId(e.target.value)}
            className="mt-3 w-full rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm"
          >
            {state.journeys.map((j) => {
              const meta = CATEGORIES.find((c) => c.id === j.category)!;
              return <option key={j.id} value={j.id}>{meta.emoji} {meta.name}</option>;
            })}
          </select>
        )}

        <input
          value={trigger}
          onChange={(e) => setTrigger(e.target.value)}
          placeholder="Trigger (e.g. work stress, evening, drinking)"
          className="mt-3 w-full rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm placeholder:text-muted-foreground/70"
        />
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="What happened? What did you do instead?"
          className="mt-2 w-full resize-none rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm placeholder:text-muted-foreground/70"
        />
        <button
          onClick={() => {
            addJournal({ mood, trigger: trigger.trim() || undefined, note: note.trim() || undefined, journeyId: journeyId || undefined });
            setTrigger(""); setNote(""); setMood(3);
            toast.success("Logged.");
          }}
          className="mt-3 inline-flex items-center gap-1 rounded-full bg-aurora px-4 py-2 text-xs font-bold text-primary-foreground shadow-glow"
        >
          <Plus className="h-3.5 w-3.5" /> Save entry
        </button>
      </div>

      {stats && (
        <div className="mt-5 grid grid-cols-2 gap-2">
          <StatCard label="Avg mood" value={stats.avg.toFixed(1)} note={`across ${stats.count} entries`} />
          {stats.worstDay && (
            <StatCard
              label="Toughest day"
              value={stats.worstDay[0]}
              note={`avg ${stats.worstDay[1].toFixed(1)}/5`}
              trend="down"
            />
          )}
          {stats.topTrigger && (
            <div className="col-span-2 rounded-2xl border border-primary/30 bg-primary/5 p-3">
              <div className="text-xs text-muted-foreground">Top trigger</div>
              <div className="mt-0.5 font-bold">"{stats.topTrigger[0]}"</div>
              <div className="mt-0.5 text-xs text-muted-foreground">Mentioned {stats.topTrigger[1]}×</div>
            </div>
          )}
        </div>
      )}

      {state.journal.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">Recent</h2>
          <ul className="space-y-2">
            {state.journal.slice(0, 20).map((e) => (
              <li key={e.id} className="rounded-2xl border border-border/60 bg-card/60 p-3 text-sm">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{new Date(e.createdAt).toLocaleString()}</span>
                  <span className="text-lg">{MOODS.find((m) => m.v === e.mood)?.emoji}</span>
                </div>
                {e.trigger && <div className="mt-1 text-xs text-primary">#{e.trigger}</div>}
                {e.note && <div className="mt-1">{e.note}</div>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

function StatCard({ label, value, note, trend }: { label: string; value: string; note?: string; trend?: "up" | "down" }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/70 p-3">
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        {label}
        {trend === "up" && <TrendingUp className="h-3 w-3 text-primary" />}
        {trend === "down" && <TrendingDown className="h-3 w-3 text-destructive" />}
      </div>
      <div className="mt-0.5 text-2xl font-black">{value}</div>
      {note && <div className="mt-0.5 text-[10px] text-muted-foreground">{note}</div>}
    </div>
  );
}
