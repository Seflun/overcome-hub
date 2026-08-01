import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock, Trophy } from "lucide-react";

import { AppShell } from "../components/app-shell";
import { CATEGORIES, MILESTONES, daysBetween, levelFromXp } from "../lib/addiction-data";
import { useStore } from "../lib/store";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "Progress — Addiblock" },
      { name: "description", content: "Milestones, streaks and XP for every addiction you're breaking." },
      { property: "og:title", content: "Progress — Addiblock" },
      { property: "og:description", content: "See your streaks, milestones and XP across every journey." },
    ],
  }),
  component: Progress,
});

function Progress() {
  const { state, totalXp } = useStore();
  const { level, into, needed, progress } = levelFromXp(totalXp);

  if (state.journeys.length === 0) {
    return (
      <AppShell>
        <div className="px-5 pt-16 text-center">
          <Trophy className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-4 text-2xl font-black">No milestones yet</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Start a journey to unlock streaks, XP and milestones.
          </p>
          <Link
            to="/explore"
            className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow"
          >
            Pick your first
          </Link>
        </div>
      </AppShell>
    );
  }

  const bestJourney = [...state.journeys].sort(
    (a, b) => daysBetween(b.startedAt) - daysBetween(a.startedAt),
  )[0];
  const bestDays = daysBetween(bestJourney.startedAt);

  return (
    <AppShell>
      <div className="px-5 pt-8">
        <div className="mb-6">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Progress
          </div>
          <h1 className="mt-1 text-3xl font-black tracking-tight">
            You're <span className="text-aurora">rebuilding</span>
          </h1>
        </div>

        <div className="rounded-3xl border border-border/50 bg-card-grad p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Total XP
              </div>
              <div className="mt-1 text-4xl font-black tracking-tight">{totalXp}</div>
            </div>
            <div className="rounded-2xl bg-primary/15 px-4 py-2 text-primary">
              <div className="text-xs font-semibold uppercase tracking-widest">Level</div>
              <div className="text-2xl font-black leading-tight">{level}</div>
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-background/60">
            <div
              className="h-full rounded-full bg-aurora"
              style={{ width: `${Math.max(4, progress * 100)}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
            <span>{into} / {needed} XP</span>
            <span>Next level in {needed - into} XP</span>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="mb-3 text-lg font-bold">Journeys</h2>
          <div className="space-y-2.5">
            {state.journeys.map((j) => {
              const meta = CATEGORIES.find((c) => c.id === j.category)!;
              const days = daysBetween(j.startedAt);
              return (
                <div
                  key={j.id}
                  className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/70 p-3"
                >
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl text-2xl"
                    style={{ backgroundColor: `color-mix(in oklab, ${meta.color} 25%, transparent)` }}
                  >
                    {meta.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">Quitting {meta.name}</div>
                    <div className="text-xs text-muted-foreground">{j.xp} XP earned</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-2xl font-black leading-none">{days}</div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">days</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-8">
          <h2 className="mb-1 text-lg font-bold">Milestones</h2>
          <p className="mb-3 text-xs text-muted-foreground">
            Based on your longest streak — {bestDays} day{bestDays === 1 ? "" : "s"}.
          </p>
          <ol className="relative space-y-3 border-l border-border/60 pl-5">
            {MILESTONES.map((m) => {
              const reached = bestDays >= m.days;
              return (
                <li key={m.days} className="relative">
                  <span
                    className={`absolute -left-[26px] top-1.5 h-3 w-3 rounded-full border-2 ${
                      reached
                        ? "border-primary bg-primary shadow-glow"
                        : "border-border bg-background"
                    }`}
                  />
                  <div
                    className={`rounded-2xl border p-3 ${
                      reached
                        ? "border-primary/40 bg-primary/10"
                        : "border-border/60 bg-card/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">{m.label}</div>
                      {reached ? (
                        <span className="text-xs font-semibold text-primary">Unlocked</span>
                      ) : (
                        <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{m.note}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </AppShell>
  );
}
