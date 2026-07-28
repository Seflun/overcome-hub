import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BookHeart, Plus, TrendingDown, TrendingUp, Sparkles, Lock, Bot } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "../components/app-shell";
import { useStore } from "../lib/store";
import { CATEGORIES } from "../lib/addiction-data";
import { PremiumBadge } from "../components/premium-badge";

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
          Log a craving, a mood, or what triggered you. Spot the patterns behind your slips.
        </p>

        <div className="mt-6">
          <JournalInner />
        </div>
      </div>
    </AppShell>
  );
}

async function requestAiReview(entry: { mood: number; trigger?: string; note?: string }): Promise<string> {
  const moodLabel = MOODS.find((m) => m.v === entry.mood)?.label ?? "";
  const prompt = `Please review my journal entry from today and give me kind, specific advice in 2–4 short paragraphs. Don't lecture.\n\nMood: ${entry.mood}/5 (${moodLabel})\nTrigger: ${entry.trigger || "(none)"}\nNote: ${entry.note || "(none)"}`;
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [{ role: "user", content: prompt }],
      context: "The user just wrote a journal entry and enabled AI Review. Comment supportively on what they wrote and offer one concrete suggestion.",
    }),
  });
  const data = (await res.json().catch(() => ({}))) as { reply?: string; error?: string };
  if (!res.ok) throw new Error(data.error || "AI review unavailable");
  return data.reply || "";
}

function JournalInner() {
  const { state, addJournal, updateJournalReview, setAiReviewEnabled } = useStore();
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

  const groupedByDay = useMemo(() => {
    const map = new Map<string, typeof state.journal>();
    for (const e of state.journal) {
      const day = new Date(e.createdAt).toDateString();
      const list = map.get(day);
      if (list) list.push(e);
      else map.set(day, [e]);
    }
    return Array.from(map.entries());
  }, [state.journal]);

  const aiReviewOn = state.aiReviewEnabled && state.isPremium;

  async function save() {
    const payload = {
      mood,
      trigger: trigger.trim() || undefined,
      note: note.trim() || undefined,
      journeyId: journeyId || undefined,
      aiReviewStatus: aiReviewOn ? ("pending" as const) : undefined,
    };
    const id = addJournal(payload);
    setTrigger(""); setNote(""); setMood(3);
    toast.success("Logged.");
    if (aiReviewOn) {
      try {
        const review = await requestAiReview(payload);
        updateJournalReview(id, review, "done");
      } catch (e) {
        updateJournalReview(id, e instanceof Error ? e.message : "AI review failed", "error");
      }
    }
  }

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

        <div className="mt-3 flex items-center justify-between rounded-xl border border-border/60 bg-background/40 px-3 py-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <div>
              <div className="flex items-center gap-1.5 text-sm font-semibold">
                AI review <PremiumBadge />
              </div>
              <div className="text-[11px] text-muted-foreground">
                Let Coach read this entry and reply with advice.
              </div>
            </div>
          </div>
          {state.isPremium ? (
            <button
              onClick={() => setAiReviewEnabled(!state.aiReviewEnabled)}
              className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                state.aiReviewEnabled ? "bg-primary" : "bg-muted"
              }`}
              aria-label="Toggle AI review"
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition ${
                  state.aiReviewEnabled ? "left-[22px]" : "left-0.5"
                }`}
              />
            </button>
          ) : (
            <a href="/plus" className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
              <Lock className="h-3 w-3" /> Plus
            </a>
          )}
        </div>

        <button
          onClick={save}
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

      {groupedByDay.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">History</h2>
          <div className="space-y-4">
            {groupedByDay.map(([day, entries]) => (
              <div key={day}>
                <div className="mb-2 text-xs font-semibold text-muted-foreground">
                  {new Date(day).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
                </div>
                <ul className="space-y-2">
                  {entries.map((e) => (
                    <li key={e.id} className="rounded-2xl border border-border/60 bg-card/60 p-3 text-sm">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{new Date(e.createdAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</span>
                        <span className="text-lg">{MOODS.find((m) => m.v === e.mood)?.emoji}</span>
                      </div>
                      {e.trigger && <div className="mt-1 text-xs text-primary">#{e.trigger}</div>}
                      {e.note && <div className="mt-1">{e.note}</div>}
                      {e.aiReviewStatus === "pending" && (
                        <div className="mt-2 flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/5 p-2 text-xs text-muted-foreground">
                          <Bot className="h-3.5 w-3.5 animate-pulse text-primary" /> Coach is reviewing…
                        </div>
                      )}
                      {e.aiReview && e.aiReviewStatus === "done" && (
                        <div className="mt-2 rounded-xl border border-primary/30 bg-primary/5 p-2.5">
                          <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-primary">
                            <Sparkles className="h-3 w-3" /> Coach review
                          </div>
                          <AiMessage text={e.aiReview} className="text-xs leading-relaxed" />
                        </div>
                      )}
                      {e.aiReviewStatus === "error" && e.aiReview && (
                        <div className="mt-2 rounded-xl border border-destructive/40 bg-destructive/10 p-2 text-[11px] text-destructive">
                          {e.aiReview}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
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
