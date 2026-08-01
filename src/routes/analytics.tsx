import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { AppShell } from "../components/app-shell";
import { AiInsightCard } from "../components/ai-insight-card";
import { PatternSpotlight } from "../components/pattern-spotlight";
import { recoveryContext } from "../lib/ai-context";
import { useStore } from "../lib/store";
import { todayKey } from "../lib/addiction-data";
import { levelFromRp } from "../lib/recovery-data";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Addiblock" },
      { name: "description", content: "Charts for mood trends, cravings resisted, trigger frequency and your recovery score." },
      { property: "og:title", content: "Analytics — Addiblock" },
      { property: "og:description", content: "See the shape of your recovery over time." },
    ],
  }),
  component: Analytics,
});

function lastDays(n: number) {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    out.push(new Date(Date.now() - i * 86400000).toISOString().slice(0, 10));
  }
  return out;
}

function Sparkline({ points, label }: { points: (number | null)[]; label: string }) {
  const valid = points.filter((p): p is number => p !== null);
  const max = Math.max(10, ...valid);
  const w = 300;
  const h = 70;
  const step = points.length > 1 ? w / (points.length - 1) : w;
  const path = points
    .map((p, i) => (p === null ? null : `${i * step},${h - (p / max) * (h - 8) - 4}`))
    .filter(Boolean)
    .join(" L ");

  return (
    <div className="rounded-2xl border border-border/60 bg-card/70 p-4">
      <div className="text-sm font-semibold">{label}</div>
      {valid.length < 2 ? (
        <p className="mt-3 text-xs text-muted-foreground">Not enough data yet — keep checking in.</p>
      ) : (
        <svg viewBox={`0 0 ${w} ${h}`} className="mt-3 h-20 w-full overflow-visible">
          <path d={`M ${path}`} fill="none" stroke="var(--primary)" strokeWidth={2.5} strokeLinecap="round" />
        </svg>
      )}
    </div>
  );
}

function Bars({ data, label }: { data: { name: string; value: number }[]; label: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="rounded-2xl border border-border/60 bg-card/70 p-4">
      <div className="text-sm font-semibold">{label}</div>
      {data.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">Nothing logged yet.</p>
      ) : (
        <div className="mt-3 space-y-2">
          {data.map((d) => (
            <div key={d.name}>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{d.name}</span>
                <span className="font-semibold">{d.value}</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-background/60">
                <div className="h-full rounded-full bg-aurora" style={{ width: `${(d.value / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Analytics() {
  const { state, totalRp } = useStore();
  const days30 = lastDays(30);
  const days14 = lastDays(14);

  const moodByDay = days14.map((d) => {
    const c = state.checkins.find((x) => x.dateKey === d);
    return c ? c.mood * 2 : null;
  });
  const stressByDay = days14.map((d) => {
    const c = state.checkins.find((x) => x.dateKey === d);
    return c ? c.stress : null;
  });

  const triggerCounts = new Map<string, number>();
  for (const c of state.cravings) triggerCounts.set(c.trigger, (triggerCounts.get(c.trigger) ?? 0) + 1);
  for (const r of state.relapses) triggerCounts.set(r.trigger, (triggerCounts.get(r.trigger) ?? 0) + 1);
  const triggers = [...triggerCounts.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const activityByDay = days30.map((d) => {
    const cravings = state.cravings.filter((c) => c.at.slice(0, 10) === d).length;
    const journal = state.journal.filter((j) => j.createdAt.slice(0, 10) === d).length;
    const checkin = state.checkins.some((c) => c.dateKey === d) ? 1 : 0;
    const relapse = state.relapses.some((r) => r.at.slice(0, 10) === d);
    return { d, score: cravings + journal + checkin, relapse };
  });

  const relapsesByMonth = new Map<string, number>();
  for (const r of state.relapses) {
    const k = r.at.slice(0, 7);
    relapsesByMonth.set(k, (relapsesByMonth.get(k) ?? 0) + 1);
  }
  const monthly = [...relapsesByMonth.entries()].sort().map(([name, value]) => ({ name, value }));

  const { level } = levelFromRp(totalRp);

  return (
    <AppShell>
      <div className="px-5 pt-6 pb-6">
        <Link to="/progress" className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Progress
        </Link>

        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Analytics</div>
        <h1 className="mt-1 text-3xl font-black tracking-tight">
          The shape of your <span className="text-aurora">recovery</span>
        </h1>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: "Recovery score", value: `${totalRp}` },
            { label: "Level", value: `${level}` },
            { label: "Cravings resisted", value: `${state.cravings.length}` },
            { label: "Check-ins", value: `${state.checkins.length}` },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-border/60 bg-card/70 p-3">
              <div className="text-2xl font-black">{s.value}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          <PatternSpotlight />
          <AiInsightCard
            title="Explain my data"
            blurb="The coach reads your trends, triggers and check-ins and tells you what's actually going on."
            lockedBlurb="Addiblock+ turns these charts into plain-English insight: what's improving, what's driving your urges, and what to change this week."
            summarizeLabel="Summarize my recovery"
            summarizePrompt="Look at my data and summarize what's going well, what's slipping, and the two most useful changes I could make this week."
            suggestions={[
              "What's my biggest risk pattern?",
              "What should I focus on this week?",
              "Is my mood actually improving?",
            ]}
            placeholder="Ask about your numbers…"
            buildContext={() => recoveryContext(state)}
          />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Sparkline points={moodByDay} label="Mood trend (14 days)" />
          <Sparkline points={stressByDay} label="Stress trend (14 days)" />
          <Bars data={triggers} label="Trigger frequency" />
          <Bars data={monthly} label="Relapses by month" />
        </div>

        <div className="mt-4 rounded-2xl border border-border/60 bg-card/70 p-4">
          <div className="text-sm font-semibold">Activity heatmap (30 days)</div>
          <div className="mt-3 grid grid-cols-10 gap-1.5">
            {activityByDay.map((a) => {
              const intensity = Math.min(1, a.score / 3);
              return (
                <div
                  key={a.d}
                  title={`${a.d}${a.relapse ? " · relapse logged" : ""}`}
                  className={`aspect-square rounded-md ${a.relapse ? "ring-2 ring-destructive/70" : ""}`}
                  style={{
                    backgroundColor:
                      a.score === 0
                        ? "color-mix(in oklab, var(--muted) 70%, transparent)"
                        : `color-mix(in oklab, var(--primary) ${25 + intensity * 75}%, transparent)`,
                  }}
                />
              );
            })}
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground">
            Brighter = more check-ins, cravings logged and journaling that day. Red ring = relapse logged.
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] text-muted-foreground">Today is {todayKey()}</p>
      </div>
    </AppShell>
  );
}
