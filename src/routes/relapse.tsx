import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, HeartHandshake } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "../components/app-shell";
import { useStore, useCategoryMeta } from "../lib/store";
import { TRIGGERS, MOOD_EMOJI, MOOD_LABELS } from "../lib/recovery-data";
import { CATEGORIES, daysBetween } from "../lib/addiction-data";

export const Route = createFileRoute("/relapse")({
  head: () => ({
    meta: [
      { title: "Log a relapse — Addiblock" },
      { name: "description", content: "Log a slip without shame, keep your history, and start again from the same day." },
      { property: "og:title", content: "Log a relapse — Addiblock" },
      { property: "og:description", content: "A slip is data, not a verdict. Log it and reset gently." },
    ],
  }),
  component: RelapsePage,
});

function RelapsePage() {
  const navigate = useNavigate();
  const { state, logRelapse } = useStore();
  const active = state.journeys.find((j) => j.id === state.activeId) ?? state.journeys[0];
  const meta = useCategoryMeta(active?.category);

  const [journeyId, setJourneyId] = useState(active?.id ?? "");
  const [mood, setMood] = useState(2);
  const [trigger, setTrigger] = useState<string>(TRIGGERS[0]);
  const [intensity, setIntensity] = useState(6);
  const [note, setNote] = useState("");

  if (!active) {
    return (
      <AppShell>
        <div className="px-5 pt-10 text-center">
          <p className="text-sm text-muted-foreground">Pick a journey first.</p>
          <Link to="/explore" className="mt-3 inline-block text-sm text-primary underline">
            Choose an addiction
          </Link>
        </div>
      </AppShell>
    );
  }

  const streak = daysBetween(state.journeys.find((j) => j.id === journeyId)?.startedAt ?? active.startedAt);

  return (
    <AppShell>
      <div className="px-5 pt-6 pb-6">
        <Link to="/today" className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Link>

        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Relapse log</div>
        <h1 className="mt-1 text-3xl font-black tracking-tight">
          This is a <span className="text-aurora">reset</span>, not a failure
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your history, badges and Recovery Points all stay. Logging what happened is how you stop it repeating.
        </p>

        <div className="mt-5 rounded-3xl border border-border/50 bg-card-grad p-5 shadow-soft">
          {state.journeys.length > 1 && (
            <div>
              <div className="text-sm font-semibold">Which journey?</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {state.journeys.map((j) => {
                  const m = CATEGORIES.find((c) => c.id === j.category)!;
                  return (
                    <button
                      key={j.id}
                      onClick={() => setJourneyId(j.id)}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                        journeyId === j.id ? "border-primary/60 bg-primary/15" : "border-border/60 bg-background/40 text-muted-foreground"
                      }`}
                    >
                      {m.emoji} {m.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-4">
            <div className="text-sm font-semibold">How do you feel right now?</div>
            <div className="mt-2 flex justify-between gap-2">
              {[1, 2, 3, 4, 5].map((m) => (
                <button
                  key={m}
                  onClick={() => setMood(m)}
                  className={`flex flex-1 flex-col items-center gap-1 rounded-xl border py-2 text-2xl ${
                    mood === m ? "border-primary/60 bg-primary/10" : "border-border/60 bg-background/40"
                  }`}
                >
                  <span>{MOOD_EMOJI[m]}</span>
                  <span className="text-[10px] font-semibold text-muted-foreground">{MOOD_LABELS[m]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <div className="text-sm font-semibold">What triggered it?</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {TRIGGERS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTrigger(t)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    trigger === t ? "border-primary/60 bg-primary/15" : "border-border/60 bg-background/40 text-muted-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-sm font-semibold">
              <span>How intense was the urge?</span>
              <span className="text-primary">{intensity}/10</span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
              className="mt-2 w-full"
            />
          </div>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="What happened, and what would you do differently next time?"
            className="mt-4 w-full rounded-2xl border border-border/60 bg-background/50 p-3 text-sm outline-none focus:border-primary/60"
          />

          <button
            onClick={() => {
              logRelapse({ journeyId: journeyId || active.id, mood, trigger, intensity, note: note.trim() || undefined });
              toast.success("Logged. Day 1 starts now — your history is safe.");
              navigate({ to: "/today" });
            }}
            className="mt-4 w-full rounded-full bg-aurora px-5 py-3 text-sm font-bold text-primary-foreground shadow-glow"
          >
            Log relapse & reset gently
          </button>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            {meta?.name ?? "This journey"} · current streak {streak} day{streak === 1 ? "" : "s"}
          </p>
        </div>

        <div className="mt-5 flex items-start gap-2 rounded-2xl border border-primary/30 bg-primary/10 p-4 text-sm">
          <HeartHandshake className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            Feeling shaky? Open the <Link to="/sos" className="text-primary underline">SOS toolkit</Link> or talk to your{" "}
            <Link to="/coach" className="text-primary underline">Coach</Link> before anything else.
          </div>
        </div>

        {state.relapses.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-3 text-lg font-bold">Past logs</h2>
            <div className="space-y-2">
              {state.relapses.slice(0, 20).map((r) => (
                <div key={r.id} className="rounded-2xl border border-border/60 bg-card/70 p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold">
                      {MOOD_EMOJI[r.mood]} {r.trigger}
                    </span>
                    <span className="text-xs text-muted-foreground">{new Date(r.at).toLocaleString()}</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">Urge intensity {r.intensity}/10</div>
                  {r.note && <p className="mt-1.5 text-sm">{r.note}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
