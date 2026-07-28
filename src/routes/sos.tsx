import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ShieldAlert, Wind, Waves, Sparkles, Phone, PhoneOff, Timer } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "../components/app-shell";
import { PremiumBadge } from "../components/premium-badge";
import { useStore } from "../lib/store";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/sos")({
  head: () => ({
    meta: [
      { title: "Craving SOS — Addiction Blocker" },
      { name: "description", content: "Panic button, guided breathing and urge-surf timer for cravings in the moment." },
      { property: "og:title", content: "Craving SOS — Addiction Blocker" },
      { property: "og:description", content: "Survive the craving. 3-minute science-backed protocol." },
    ],
  }),
  component: Sos,
});

type Tool = "breath" | "urge" | "protocol" | null;

function Sos() {
  const { state, logSos } = useStore();
  const [tool, setTool] = useState<Tool>(null);

  return (
    <AppShell>
      <div className="px-5 pt-8">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-destructive">
          <ShieldAlert className="h-3.5 w-3.5" /> Craving SOS
        </div>
        <h1 className="text-3xl font-black tracking-tight">
          You're not <span className="text-aurora">alone</span> in this moment.
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Cravings peak and pass in ~90 seconds. Pick a tool and ride it out.
        </p>

        {/* Free: box breathing */}
        <div className="mt-6 space-y-2.5">
          <ToolCard
            title="Box breathing"
            desc="Free · Calms your nervous system in 60 seconds."
            active={tool === "breath"}
            onClick={() => setTool(tool === "breath" ? null : "breath")}
            icon={Wind}
          />
          {tool === "breath" && <BreathingBox onDone={() => logSos("breath", true)} />}

          <ToolCard
            title="Urge surf timer"
            desc="Watch the craving wave rise and fall. 90 seconds."
            active={tool === "urge"}
            onClick={() => setTool(tool === "urge" ? null : "urge")}
            icon={Waves}
            premium={!state.isPremium}
          />
          {tool === "urge" && state.isPremium && (
            <UrgeSurf onDone={() => logSos("urge", true)} />
          )}

          <ToolCard
            title="3-minute SOS protocol"
            desc="Cold water → move → distract → ground. Guided."
            active={tool === "protocol"}
            onClick={() => setTool(tool === "protocol" ? null : "protocol")}
            icon={Sparkles}
            premium={!state.isPremium}
          />
          {tool === "protocol" && state.isPremium && (
            <Protocol onDone={() => logSos("protocol", true)} />
          )}
        </div>

        {!state.isPremium && (
          <Link
            to="/plus"
            className="mt-6 block rounded-2xl border border-primary/40 bg-aurora/10 p-4 text-center"
          >
            <div className="text-xs font-bold uppercase tracking-widest text-primary">Unlock the full toolkit</div>
            <div className="mt-1 text-sm font-semibold">Urge surf timer + guided SOS protocol</div>
            <div className="mt-0.5 text-xs text-muted-foreground">With Addiction Blocker+</div>
          </Link>
        )}

        {state.sos.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-2 text-sm font-bold text-muted-foreground uppercase tracking-widest">Recent SOS wins</h2>
            <ul className="space-y-1.5">
              {state.sos.slice(0, 5).map((s) => (
                <li key={s.id} className="flex items-center justify-between rounded-xl border border-border/60 bg-card/60 px-3 py-2 text-xs">
                  <span className="capitalize">{s.tool}</span>
                  <span className="text-muted-foreground">{new Date(s.createdAt).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function ToolCard({
  title, desc, active, onClick, icon: Icon, premium,
}: {
  title: string; desc: string; active: boolean; onClick: () => void; icon: any; premium?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition ${
        active ? "border-primary/60 bg-primary/10" : "border-border/60 bg-card/70"
      }`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{title}</span>
          {premium && <PremiumBadge />}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
      </div>
    </button>
  );
}

function BreathingBox({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState(0); // 0 in, 1 hold, 2 out, 3 hold
  const [round, setRound] = useState(0);
  const labels = ["Breathe in", "Hold", "Breathe out", "Hold"];
  useEffect(() => {
    const id = setInterval(() => {
      setPhase((p) => {
        const next = (p + 1) % 4;
        if (next === 0) setRound((r) => r + 1);
        return next;
      });
    }, 4000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (round >= 5) {
      onDone();
      toast.success("Nice work. The wave passed.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);
  return (
    <div className="rounded-2xl border border-primary/40 bg-primary/5 p-6 text-center">
      <div className="mx-auto flex h-40 w-40 items-center justify-center">
        <div
          className="h-32 w-32 rounded-full bg-aurora shadow-glow transition-transform duration-[4000ms] ease-in-out"
          style={{ transform: phase === 0 ? "scale(1)" : phase === 2 ? "scale(0.55)" : "scale(0.85)" }}
        />
      </div>
      <div className="mt-4 text-lg font-bold">{labels[phase]}</div>
      <div className="mt-1 text-xs text-muted-foreground">Round {Math.min(round + 1, 5)} of 5</div>
    </div>
  );
}

function UrgeSurf({ onDone }: { onDone: () => void }) {
  const [t, setT] = useState(90);
  useEffect(() => {
    const id = setInterval(() => setT((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (t === 0) { onDone(); toast.success("You surfed it. It's already fading."); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);
  const pct = ((90 - t) / 90) * 100;
  const wave = Math.sin(((90 - t) / 90) * Math.PI); // 0→1→0
  return (
    <div className="rounded-2xl border border-primary/40 bg-primary/5 p-5">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Watch the wave</span>
        <span className="flex items-center gap-1"><Timer className="h-3 w-3" /> {t}s</span>
      </div>
      <div className="relative mt-4 h-24 overflow-hidden rounded-xl bg-background/60">
        <div
          className="absolute inset-x-0 bottom-0 bg-aurora transition-all duration-1000"
          style={{ height: `${20 + wave * 70}%`, opacity: 0.7 }}
        />
      </div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-background/60">
        <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-3 text-center text-sm">Don't push the wave away. Just watch it rise and fall.</p>
    </div>
  );
}

const STEPS = [
  { t: 30, label: "Cold water on wrists & face", note: "Resets your nervous system fast." },
  { t: 60, label: "Move your body", note: "20 pushups, walk to another room — anything." },
  { t: 60, label: "5-4-3-2-1 grounding", note: "5 things you see, 4 you feel, 3 you hear, 2 you smell, 1 you taste." },
  { t: 30, label: "Text someone you trust", note: "Even a 👋 counts." },
];

function Protocol({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [t, setT] = useState(STEPS[0].t);
  const done = useRef(false);
  useEffect(() => {
    const id = setInterval(() => {
      setT((v) => {
        if (v > 1) return v - 1;
        setStep((s) => {
          if (s + 1 >= STEPS.length) {
            if (!done.current) { done.current = true; onDone(); toast.success("You beat it. That's real."); }
            return s;
          }
          setT(STEPS[s + 1].t);
          return s + 1;
        });
        return 0;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const cur = STEPS[step];
  return (
    <div className="rounded-2xl border border-primary/40 bg-primary/5 p-5">
      <div className="text-xs font-semibold uppercase tracking-widest text-primary">Step {step + 1} of {STEPS.length}</div>
      <div className="mt-2 text-lg font-bold">{cur.label}</div>
      <p className="mt-1 text-sm text-muted-foreground">{cur.note}</p>
      <div className="mt-4 flex items-center gap-3">
        <div className="text-3xl font-black tabular-nums">{t}s</div>
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-background/60">
          <div className="h-full bg-aurora transition-all" style={{ width: `${((cur.t - t) / cur.t) * 100}%` }} />
        </div>
      </div>
    </div>
  );
}
