import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "../components/app-shell";
import { useStore, useCategoryMeta } from "../lib/store";
import { TRIGGERS } from "../lib/recovery-data";

export const Route = createFileRoute("/cravings")({
  head: () => ({
    meta: [
      { title: "Craving tracker — Addiblock" },
      { name: "description", content: "Log the cravings you rode out and watch your resistance grow over time." },
      { property: "og:title", content: "Craving tracker — Addiblock" },
      { property: "og:description", content: "Every craving you log instead of act on is a win worth counting." },
    ],
  }),
  component: Cravings,
});

function Cravings() {
  const { state, logCraving } = useStore();
  const active = state.journeys.find((j) => j.id === state.activeId) ?? state.journeys[0];
  const meta = useCategoryMeta(active?.category);

  const [intensity, setIntensity] = useState(5);
  const [minutes, setMinutes] = useState(10);
  const [trigger, setTrigger] = useState<string>(TRIGGERS[0]);
  const [note, setNote] = useState("");

  const total = state.cravings.length;
  const week = state.cravings.filter(
    (c) => Date.now() - new Date(c.at).getTime() < 7 * 86400000,
  ).length;
  const avg =
    total === 0 ? 0 : Math.round((state.cravings.reduce((a, c) => a + c.intensity, 0) / total) * 10) / 10;

  return (
    <AppShell>
      <div className="px-5 pt-6 pb-6">
        <Link to="/today" className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Link>

        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Craving tracker
        </div>
        <h1 className="mt-1 text-3xl font-black tracking-tight">
          You felt it and <span className="text-aurora">didn't act</span>
        </h1>
        <p className="mt-2 text-xs text-muted-foreground">
          Logging a craving is a victory, not a failure. Each one earns +30 RP.
        </p>

        <div className="mt-5 grid grid-cols-3 gap-2">
          {[
            { label: "Resisted", value: total },
            { label: "This week", value: week },
            { label: "Avg intensity", value: avg },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-border/60 bg-card/70 p-3 text-center">
              <div className="text-2xl font-black">{s.value}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-3xl border border-border/50 bg-card-grad p-5 shadow-soft">
          <div className="flex items-center gap-2 text-sm font-bold">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Log a craving {meta ? `· ${meta.name}` : ""}
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-sm font-semibold">
              <span>Intensity</span>
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

          <div className="mt-4">
            <div className="flex items-center justify-between text-sm font-semibold">
              <span>How long did it last?</span>
              <span className="text-primary">{minutes} min</span>
            </div>
            <input
              type="range"
              min={1}
              max={60}
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
              className="mt-2 w-full"
            />
          </div>

          <div className="mt-4">
            <div className="text-sm font-semibold">Trigger</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {TRIGGERS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTrigger(t)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    trigger === t
                      ? "border-primary/60 bg-primary/15 text-foreground"
                      : "border-border/60 bg-background/40 text-muted-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What helped you get through it?"
            rows={3}
            className="mt-4 w-full rounded-2xl border border-border/60 bg-background/50 p-3 text-sm outline-none focus:border-primary/60"
          />

          <button
            onClick={() => {
              logCraving({ journeyId: active?.id, intensity, minutes, trigger, note: note.trim() || undefined });
              setNote("");
              toast.success("Craving resisted · +30 RP");
            }}
            className="mt-4 w-full rounded-full bg-aurora px-5 py-3 text-sm font-bold text-primary-foreground shadow-glow"
          >
            Log it · +30 RP
          </button>
        </div>

        {state.cravings.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-3 text-lg font-bold">Recent cravings</h2>
            <div className="space-y-2">
              {state.cravings.slice(0, 20).map((c) => (
                <div key={c.id} className="rounded-2xl border border-border/60 bg-card/70 p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold">{c.trigger}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(c.at).toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Intensity {c.intensity}/10 · {c.minutes} min
                  </div>
                  {c.note && <p className="mt-1.5 text-sm">{c.note}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
