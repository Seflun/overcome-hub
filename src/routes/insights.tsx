import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, DollarSign, Clock } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "../components/app-shell";
import { PremiumGate } from "../components/premium-badge";
import { useStore } from "../lib/store";
import { CATEGORIES, daysBetween, type CategoryId } from "../lib/addiction-data";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "Insights — Reclaim" },
      { name: "description", content: "Health recovery timeline and money saved as you break the habit." },
      { property: "og:title", content: "Insights — Reclaim" },
      { property: "og:description", content: "Watch your body recover and dollars stack up." },
    ],
  }),
  component: Insights,
});

const HEALTH: Record<CategoryId, { hours: number; label: string }[]> = {
  vaping: [
    { hours: 8,    label: "Nicotine level halves in your blood" },
    { hours: 24,   label: "Carbon monoxide has left your body" },
    { hours: 72,   label: "Lung capacity begins to improve" },
    { hours: 336,  label: "Circulation and lung function up 30%" },
    { hours: 2160, label: "Coughing and shortness of breath drop" },
  ],
  smoking: [
    { hours: 20,   label: "Heart rate and blood pressure drop" },
    { hours: 12,   label: "Carbon monoxide normalizes" },
    { hours: 336,  label: "Circulation improves, walking easier" },
    { hours: 2160, label: "Lung cilia regenerate" },
    { hours: 8760, label: "Heart-disease risk halved" },
  ],
  alcohol: [
    { hours: 24,   label: "Blood sugar stabilizes" },
    { hours: 72,   label: "Sleep quality begins to improve" },
    { hours: 168,  label: "Liver fat begins reducing" },
    { hours: 720,  label: "Skin clearer, energy steadier" },
  ],
  drinking: [
    { hours: 24,   label: "Hydration and blood sugar stabilize" },
    { hours: 72,   label: "Deeper sleep, sharper mornings" },
    { hours: 168,  label: "Mood swings level out" },
    { hours: 720,  label: "Weight, skin, and focus visibly improve" },
  ],
  gambling: [
    { hours: 72,   label: "Dopamine baseline starts resetting" },
    { hours: 336,  label: "Impulse control improves" },
    { hours: 720,  label: "Anxiety drops sharply" },
  ],
  sugar: [
    { hours: 72,   label: "Cravings peak — then fade" },
    { hours: 240,  label: "Cravings noticeably weaker" },
    { hours: 720,  label: "Energy steadier, skin clearer" },
  ],
  cannabis: [
    { hours: 72,   label: "REM sleep and dreams return" },
    { hours: 168,  label: "Focus and memory sharpen" },
    { hours: 720,  label: "Motivation and mood stabilize" },
  ],
  porn: [
    { hours: 168,  label: "Dopamine sensitivity begins recovering" },
    { hours: 720,  label: "Motivation and focus rise" },
    { hours: 2160, label: "Real-world attraction returns" },
  ],
  social: [
    { hours: 72,   label: "Attention span begins to lengthen" },
    { hours: 168,  label: "Anxiety and comparison drop" },
    { hours: 336,  label: "Real-world presence deepens" },
  ],
};

function Insights() {
  return (
    <AppShell>
      <div className="px-5 pt-8">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          <Heart className="h-3.5 w-3.5" /> Insights
        </div>
        <h1 className="text-3xl font-black tracking-tight">
          Proof it's <span className="text-aurora">working</span>.
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your body is repairing itself right now. Here's the receipt.
        </p>
        <div className="mt-6">
          <PremiumGate
            title="Insights are a Plus feature"
            blurb="See your body recover in real time and how much money you're saving."
          >
            <InsightsInner />
          </PremiumGate>
        </div>
      </div>
    </AppShell>
  );
}

function InsightsInner() {
  const { state, setCostPerDay } = useStore();
  const [editing, setEditing] = useState<string | null>(null);

  if (state.journeys.length === 0)
    return <div className="rounded-2xl border border-border/60 bg-card/60 p-6 text-center text-sm text-muted-foreground">Start a journey first.</div>;

  return (
    <div className="space-y-5">
      {state.journeys.map((j) => {
        const meta = CATEGORIES.find((c) => c.id === j.category)!;
        const days = daysBetween(j.startedAt);
        const hours = days * 24;
        const saved = (j.costPerDay ?? 0) * days;
        const items = HEALTH[j.category];

        return (
          <div key={j.id} className="rounded-3xl border border-border/60 bg-card-grad p-5 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="text-3xl">{meta.emoji}</div>
              <div className="flex-1">
                <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Quitting {meta.name}</div>
                <div className="mt-0.5 text-2xl font-black">{days} <span className="text-sm font-normal text-muted-foreground">days</span></div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/5 p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <DollarSign className="h-3.5 w-3.5 text-primary" /> Money saved
              </div>
              {editing === j.id || j.costPerDay == null ? (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">$/day</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    defaultValue={j.costPerDay ?? ""}
                    placeholder="e.g. 12"
                    onBlur={(e) => {
                      const v = parseFloat(e.target.value);
                      if (!isNaN(v)) setCostPerDay(j.id, v);
                      setEditing(null);
                    }}
                    className="w-24 rounded-lg border border-border/60 bg-background/60 px-2 py-1 text-sm"
                  />
                </div>
              ) : (
                <button onClick={() => setEditing(j.id)} className="mt-1 flex items-baseline gap-1 text-left">
                  <span className="text-3xl font-black">${saved.toFixed(0)}</span>
                  <span className="text-xs text-muted-foreground">· tap to edit rate</span>
                </button>
              )}
            </div>

            <div className="mt-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                <Clock className="h-3.5 w-3.5" /> Health timeline
              </div>
              <ol className="relative space-y-2 border-l border-border/60 pl-4">
                {items.map((it) => {
                  const reached = hours >= it.hours;
                  return (
                    <li key={it.hours} className="relative">
                      <span
                        className={`absolute -left-[19px] top-2 h-2.5 w-2.5 rounded-full border-2 ${
                          reached ? "border-primary bg-primary" : "border-border bg-background"
                        }`}
                      />
                      <div className={`rounded-xl border p-2.5 text-sm ${reached ? "border-primary/40 bg-primary/10" : "border-border/60 bg-card/50 text-muted-foreground"}`}>
                        {it.label}
                        <div className="text-[10px] uppercase tracking-widest opacity-70">
                          {it.hours < 48 ? `${it.hours}h` : `${Math.round(it.hours / 24)} days`}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        );
      })}
    </div>
  );
}
