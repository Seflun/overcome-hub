import { createFileRoute, Link } from "@tanstack/react-router";
import { Flame, Plus, Sparkles, CheckCircle2, Circle, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "../components/app-shell";
import { useStore, useCategoryMeta } from "../lib/store";
import { useConfirm } from "../components/confirm-dialog";
import {
  CATEGORIES,
  daysBetween,
  levelFromXp,
  tasksForDay,
  todayKey,
} from "../lib/addiction-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Today — Addiction Blocker" },
      { name: "description", content: "Your daily plan to break the addiction loop." },
      { property: "og:title", content: "Today — Addiction Blocker" },
      { property: "og:description", content: "Daily tasks and streaks to help you quit." },
    ],
  }),
  component: Today,
});

function Today() {
  const { state, setActive, startJourney, removeJourney } = useStore();
  const confirm = useConfirm();

  if (state.journeys.length === 0) return <Onboarding onPick={startJourney} />;

  const active =
    state.journeys.find((j) => j.id === state.activeId) ?? state.journeys[0];

  return (
    <AppShell>
      <div className="px-5 pt-8">
        <Header />
        <ActiveCard journeyId={active.id} />

        <div className="mt-5">
          <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Your journeys
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {state.journeys.map((j) => {
              const meta = CATEGORIES.find((c) => c.id === j.category)!;
              const isActive = j.id === active.id;
              return (
                <div
                  key={j.id}
                  className={`flex shrink-0 items-center gap-2 rounded-full border py-1.5 pl-3 pr-1.5 text-sm transition ${
                    isActive
                      ? "border-primary/60 bg-primary/10 text-foreground"
                      : "border-border/60 bg-card/60 text-muted-foreground"
                  }`}
                >
                  <button onClick={() => setActive(j.id)} className="flex items-center gap-2">
                    <span>{meta.emoji}</span>
                    <span className="font-medium">{meta.name}</span>
                    <span className="text-xs opacity-70">{daysBetween(j.startedAt)}d</span>
                  </button>
                  <button
                    aria-label={`Cancel ${meta.name} journey`}
                    onClick={async () => {
                      const ok = await confirm({
                        title: `Cancel ${meta.name} journey?`,
                        description: "Your streak and XP on this journey will be removed. This can't be undone.",
                        confirmLabel: "Remove journey",
                        tone: "destructive",
                      });
                      if (ok) {
                        removeJourney(j.id);
                        toast(`Journey removed: ${meta.name}`);
                      }
                    }}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-background/60 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
            <Link
              to="/explore"
              className="flex shrink-0 items-center gap-1 rounded-full border border-dashed border-border/70 px-3 py-1.5 text-sm text-muted-foreground"
            >
              <Plus className="h-4 w-4" /> Add
            </Link>
          </div>
        </div>


        <TaskList journeyId={active.id} />
      </div>
    </AppShell>
  );
}

function Header() {
  const { totalXp, state } = useStore();
  const { level } = levelFromXp(totalXp);
  return (
    <div className="mb-6 flex items-center justify-between">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Addiction Blocker{state.isPremium && <span className="ml-1 text-primary">+</span>}
        </div>
        <h1 className="mt-1 text-3xl font-black tracking-tight">
          Today's <span className="text-aurora">plan</span>
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <div className="rounded-full border border-border/60 bg-card/70 px-3 py-1.5 text-xs font-semibold">
          <span className="text-muted-foreground">LVL</span>{" "}
          <span className="text-primary">{level}</span>
        </div>
        <Link to="/settings" className="rounded-full border border-border/60 bg-card/70 p-2 text-muted-foreground">
          <Settings className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function ActiveCard({ journeyId }: { journeyId: string }) {
  const { state, resetStreak } = useStore();
  const journey = state.journeys.find((j) => j.id === journeyId)!;
  const meta = useCategoryMeta(journey.category)!;
  const days = daysBetween(journey.startedAt);
  const { level, into, needed, progress } = levelFromXp(journey.xp);

  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-border/50 bg-card-grad p-5 shadow-soft"
      style={{ backgroundColor: "var(--card)" }}
    >
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-30 blur-3xl"
        style={{ backgroundColor: meta.color }}
      />
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Quitting {meta.name}
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-5xl font-black tracking-tight">{days}</span>
            <span className="text-sm text-muted-foreground">days free</span>
          </div>
        </div>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-background/40 text-3xl">
          {meta.emoji}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        {meta.benefit}
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Level {level}</span>
          <span>{into} / {needed} XP</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-background/60">
          <div
            className="h-full rounded-full bg-aurora transition-all"
            style={{ width: `${Math.max(4, progress * 100)}%` }}
          />
        </div>
      </div>

      <button
        onClick={() => {
          resetStreak(journey.id);
          toast("Streak reset. Day 0 — you're still here, that's what matters.");
        }}
        className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground/80 hover:text-foreground"
      >
        <RotateCcw className="h-3 w-3" /> Slipped? Reset gently
      </button>
    </div>
  );
}

function TaskList({ journeyId }: { journeyId: string }) {
  const { state, toggleTask } = useStore();
  const confirm = useConfirm();
  const journey = state.journeys.find((j) => j.id === journeyId)!;
  const key = todayKey();
  const tasks = tasksForDay(journey.category, key);
  const done = new Set(journey.completions[key] ?? []);
  const completedCount = tasks.filter((t) => done.has(t.id)).length;

  return (
    <div className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">Missions for today</h2>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Flame className="h-4 w-4 text-primary" />
          {completedCount}/{tasks.length}
        </div>
      </div>

      <ul className="space-y-2.5">
        {tasks.map((t) => {
          const isDone = done.has(t.id);
          return (
            <li key={t.id}>
              <button
                onClick={async () => {
                  const ok = await confirm(
                    isDone
                      ? {
                          title: `Uncheck "${t.title}"?`,
                          description: `You'll lose ${t.xp} XP.`,
                          confirmLabel: "Uncheck",
                          tone: "destructive",
                        }
                      : {
                          title: `Mark "${t.title}" done?`,
                          description: `You'll earn +${t.xp} XP.`,
                          confirmLabel: `Complete · +${t.xp} XP`,
                        },
                  );
                  if (!ok) return;
                  toggleTask(journey.id, t.id, t.xp);
                  if (!isDone) toast.success(`+${t.xp} XP · ${t.title}`);
                }}
                className={`group flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition ${
                  isDone
                    ? "border-primary/50 bg-primary/10"
                    : "border-border/60 bg-card/70 hover:border-primary/40"
                }`}
              >
                <div className="mt-0.5">
                  {isDone ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className={`font-semibold ${isDone ? "line-through opacity-70" : ""}`}>
                      {t.title}
                    </div>
                    <div className="shrink-0 rounded-full bg-background/60 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      +{t.xp}
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>
                  <div className="mt-1.5 text-[11px] uppercase tracking-widest text-muted-foreground/80">
                    {t.minutes} min · {t.category ? "targeted" : "universal"}
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Onboarding({ onPick }: { onPick: (c: (typeof CATEGORIES)[number]["id"]) => void }) {
  return (
    <AppShell>
      <div className="px-5 pt-10">
        <div className="mb-8">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
            Addiction Blocker
          </div>
          <h1 className="mt-3 text-4xl font-black leading-tight tracking-tight">
            What do you want to <span className="text-aurora">break free</span> from?
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Pick one to start. You'll get a daily plan, streaks, and XP. Add more journeys later — every win compounds.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                onPick(c.id);
                toast.success(`Journey started: quitting ${c.name}`);
              }}
              className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/70 p-4 text-left shadow-soft transition hover:border-primary/40"
            >
              <div
                className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-30 blur-2xl transition group-hover:opacity-50"
                style={{ backgroundColor: c.color }}
              />
              <div className="text-3xl">{c.emoji}</div>
              <div className="mt-3 font-bold">{c.name}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{c.tagline}</div>
            </button>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
