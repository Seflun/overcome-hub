import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Flame,
  Plus,
  Sparkles,
  CheckCircle2,
  Circle,
  RotateCcw,
  X,
  ClipboardCheck,
  Quote as QuoteIcon,
  Target,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "../components/app-shell";
import { useStore, useCategoryMeta } from "../lib/store";
import { useConfirm } from "../components/confirm-dialog";
import {
  CATEGORIES,
  daysBetween,
  tasksForDay,
  todayKey,
} from "../lib/addiction-data";
import {
  ACHIEVEMENTS,
  GENERAL_MISSIONS,
  currentStage,
  levelFromRp,
  nextStage,
  quoteForDay,
} from "../lib/recovery-data";
import { LOGO_URL as logo } from "@/lib/brand";

export const Route = createFileRoute("/today")({
  head: () => ({
    meta: [
      { title: "Today — Addiblock" },
      { name: "description", content: "Your daily plan to break the addiction loop: missions, check-in, streaks and Recovery Points." },
      { property: "og:title", content: "Today — Addiblock" },
      { property: "og:description", content: "Daily missions, check-ins and streaks to help you quit." },
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
        <CheckInPrompt />
        <ActiveCard journeyId={active.id} />
        <MilestoneCard journeyId={active.id} />

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
                        description: "Your streak and Recovery Points on this journey will be removed. This can't be undone.",
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
        <GeneralMissions />
        <RecentAchievements />
        <Quote />
      </div>
    </AppShell>
  );
}

function Header() {
  const { totalRp, state, userEmail } = useStore();
  const { level } = levelFromRp(totalRp);
  const name = state.profile.username || userEmail?.split("@")[0] || "friend";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="mb-5 flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <img src={logo} alt="Addiblock logo" className="h-10 w-10 shrink-0 rounded-xl object-contain" />
        <div className="min-w-0">
          <div className="truncate text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {greeting}, {name}
            {state.isPremium && <span className="ml-1 text-primary">+</span>}
          </div>
          <h1 className="mt-1 text-3xl font-black tracking-tight">
            Today's <span className="text-aurora">plan</span>
          </h1>
        </div>
      </div>
      <Link
        to="/profile"
        className="shrink-0 rounded-2xl border border-border/60 bg-card/70 px-3 py-2 text-center"
      >
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Score</div>
        <div className="text-lg font-black leading-tight text-primary">{totalRp}</div>
        <div className="text-[10px] text-muted-foreground">Lvl {level}</div>
      </Link>
    </div>
  );
}

function CheckInPrompt() {
  const { checkedInToday, checkinStreak } = useStore();
  if (checkedInToday) {
    return (
      <div className="mb-4 flex items-center gap-2 rounded-2xl border border-primary/30 bg-primary/10 p-3 text-sm">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
        Checked in today · {checkinStreak}-day check-in streak.
        <Link to="/checkin" className="ml-auto shrink-0 text-xs text-primary underline">
          Edit
        </Link>
      </div>
    );
  }
  return (
    <Link
      to="/checkin"
      className="mb-4 flex items-center gap-3 rounded-2xl border border-border/60 bg-card/70 p-4 transition hover:border-primary/40"
    >
      <ClipboardCheck className="h-5 w-5 shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold">Daily check-in</div>
        <div className="text-xs text-muted-foreground">30 seconds on mood, cravings, sleep · +25 RP</div>
      </div>
      <span className="shrink-0 text-xs font-bold text-primary">Start →</span>
    </Link>
  );
}

function ActiveCard({ journeyId }: { journeyId: string }) {
  const { state, resetStreak } = useStore();
  const confirm = useConfirm();
  const journey = state.journeys.find((j) => j.id === journeyId)!;
  const meta = useCategoryMeta(journey.category)!;
  const days = daysBetween(journey.startedAt);
  const { level, into, needed, progress } = levelFromRp(journey.xp);

  const start = new Date(journey.startedAt).getTime();
  const totalMs = Date.now() - start;
  const hours = Math.floor(totalMs / 3600000) % 24;
  const minutes = Math.floor(totalMs / 60000) % 60;

  const relapses = state.relapses.filter((r) => r.journeyId === journey.id).length;

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
          <div className="mt-1 text-xs text-muted-foreground">
            {days}d {hours}h {minutes}m clean · {relapses} relapse{relapses === 1 ? "" : "s"} logged
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
          <span>{into} / {needed} RP</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-background/60">
          <div
            className="h-full rounded-full bg-aurora transition-all"
            style={{ width: `${Math.max(4, progress * 100)}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Link
          to="/relapse"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/80 hover:text-foreground"
        >
          <RotateCcw className="h-3 w-3" /> Slipped? Log it & reset gently
        </Link>
        <button
          onClick={async () => {
            const ok = await confirm({
              title: "Reset this streak?",
              description: "Your history stays. Today's completed missions are cleared and the counter restarts.",
              confirmLabel: "Reset streak",
              tone: "destructive",
            });
            if (!ok) return;
            resetStreak(journey.id);
            toast("Streak reset. Day 0 — you're still here, that's what matters.");
          }}
          className="text-xs text-muted-foreground/60 hover:text-foreground"
        >
          Quick reset
        </button>
      </div>
    </div>
  );
}

function MilestoneCard({ journeyId }: { journeyId: string }) {
  const { state } = useStore();
  const journey = state.journeys.find((j) => j.id === journeyId)!;
  const days = daysBetween(journey.startedAt);
  const stage = currentStage(days);
  const next = nextStage(days);

  return (
    <div className="mt-3 rounded-2xl border border-border/60 bg-card/70 p-4">
      <div className="flex items-center gap-2 text-sm font-bold">
        <Target className="h-4 w-4 text-primary" />
        {stage ? stage.label : "Day one"}
      </div>
      <p className="mt-1.5 text-sm text-muted-foreground">
        {stage ? stage.message : "The first 24 hours are the steepest. Just get through today."}
      </p>
      {next && (
        <div className="mt-3 border-t border-border/50 pt-3 text-xs text-muted-foreground">
          Next milestone: <span className="font-semibold text-foreground">{next.label}</span> in{" "}
          {next.days - days} day{next.days - days === 1 ? "" : "s"} ·{" "}
          <Link to="/progress" className="text-primary underline">timeline</Link>
        </div>
      )}
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
                          description: `You'll lose ${t.xp} RP.`,
                          confirmLabel: "Uncheck",
                          tone: "destructive",
                        }
                      : {
                          title: `Mark "${t.title}" done?`,
                          description: `You'll earn +${t.xp} RP.`,
                          confirmLabel: `Complete · +${t.xp} RP`,
                        },
                  );
                  if (!ok) return;
                  toggleTask(journey.id, t.id, t.xp);
                  if (!isDone) toast.success(`+${t.xp} RP · ${t.title}`);
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

function GeneralMissions() {
  const { state, toggleGeneralMission } = useStore();
  const key = todayKey();
  const done = new Set(state.generalMissions[key] ?? []);
  const seed = [...key].reduce((a, c) => a + c.charCodeAt(0), 0);
  const picks = Array.from({ length: 4 }, (_, i) => GENERAL_MISSIONS[(seed + i * 3) % GENERAL_MISSIONS.length]);
  const unique = picks.filter((m, i) => picks.findIndex((x) => x.id === m.id) === i);

  return (
    <div className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">Healthy habits</h2>
        <span className="text-xs text-muted-foreground">
          {unique.filter((m) => done.has(m.id)).length}/{unique.length}
        </span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {unique.map((m) => {
          const isDone = done.has(m.id);
          return (
            <button
              key={m.id}
              onClick={() => {
                toggleGeneralMission(m.id, m.rp);
                if (!isDone) toast.success(`+${m.rp} RP · ${m.title}`);
              }}
              className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${
                isDone ? "border-primary/50 bg-primary/10" : "border-border/60 bg-card/70 hover:border-primary/40"
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
              ) : (
                <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />
              )}
              <span className={`flex-1 text-sm font-semibold ${isDone ? "line-through opacity-70" : ""}`}>
                {m.title}
              </span>
              <span className="shrink-0 text-[10px] font-bold text-primary">+{m.rp}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RecentAchievements() {
  const { state } = useStore();
  const recent = state.unlocked.slice(-3).reverse();
  if (recent.length === 0) return null;

  return (
    <div className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">Recent achievements</h2>
        <Link to="/profile" className="text-xs text-primary underline">All badges</Link>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {recent.map((id) => {
          const a = ACHIEVEMENTS.find((x) => x.id === id);
          if (!a) return null;
          return (
            <div
              key={id}
              className="flex shrink-0 items-center gap-2 rounded-2xl border border-primary/40 bg-primary/10 px-3 py-2"
            >
              <span className="text-xl">{a.emoji}</span>
              <span className="text-sm font-bold">{a.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Quote() {
  return (
    <div className="mt-8 mb-4 flex items-start gap-3 rounded-2xl border border-border/60 bg-card/60 p-4">
      <QuoteIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <p className="text-sm italic text-muted-foreground">{quoteForDay(todayKey())}</p>
    </div>
  );
}

function Onboarding({ onPick }: { onPick: (c: (typeof CATEGORIES)[number]["id"]) => void }) {
  return (
    <AppShell>
      <div className="px-5 pt-10">
        <div className="mb-8">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Addiblock logo" className="h-8 w-8 rounded-lg object-contain" />
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
              Addiblock
            </div>
          </div>
          <h1 className="mt-3 text-4xl font-black leading-tight tracking-tight">
            What do you want to <span className="text-aurora">break free</span> from?
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Pick one to start. You'll get a daily plan, streaks, and Recovery Points. Add more journeys later — every win compounds.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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

        <div className="mt-6 flex items-center justify-center gap-1 text-xs text-muted-foreground">
          <Trophy className="h-3.5 w-3.5 text-primary" /> Badges, milestones and analytics unlock as you go.
        </div>
      </div>
    </AppShell>
  );
}
