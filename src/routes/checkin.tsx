import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "../components/app-shell";
import { useStore } from "../lib/store";
import { MOOD_EMOJI, MOOD_LABELS } from "../lib/recovery-data";
import { todayKey } from "../lib/addiction-data";

export const Route = createFileRoute("/checkin")({
  head: () => ({
    meta: [
      { title: "Daily check-in — Addiblock" },
      { name: "description", content: "A 30-second daily check-in on mood, cravings, stress, energy and sleep." },
      { property: "og:title", content: "Daily check-in — Addiblock" },
      { property: "og:description", content: "Track how you feel each day and watch the trends improve." },
    ],
  }),
  component: CheckInPage,
});

function Scale({
  label,
  value,
  onChange,
  low,
  high,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  low: string;
  high: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/70 p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-sm font-black text-primary">{value}</div>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 w-full accent-[var(--primary)]"
      />
      <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  );
}

function CheckInPage() {
  const { state, addCheckIn, checkedInToday, checkinStreak } = useStore();
  const existing = state.checkins.find((c) => c.dateKey === todayKey());

  const [mood, setMood] = useState<number>(existing?.mood ?? 3);
  const [cravings, setCravings] = useState<boolean>(existing?.cravings ?? false);
  const [stress, setStress] = useState<number>(existing?.stress ?? 5);
  const [energy, setEnergy] = useState<number>(existing?.energy ?? 5);
  const [sleep, setSleep] = useState<number>(existing?.sleep ?? 5);

  const history = [...state.checkins].sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1)).slice(0, 14);

  return (
    <AppShell>
      <div className="px-5 pt-6 pb-6">
        <Link to="/today" className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Link>

        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Daily check-in
            </div>
            <h1 className="mt-1 text-3xl font-black tracking-tight">
              How are you <span className="text-aurora">today?</span>
            </h1>
          </div>
          <div className="shrink-0 rounded-full border border-border/60 bg-card/70 px-3 py-1 text-[11px] font-semibold">
            🔥 {checkinStreak}d
          </div>
        </div>

        {checkedInToday && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-primary/40 bg-primary/10 p-3 text-sm">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            Checked in today. You can update your answers below.
          </div>
        )}

        <div className="mt-5 rounded-2xl border border-border/60 bg-card/70 p-4">
          <div className="text-sm font-semibold">Mood</div>
          <div className="mt-3 flex justify-between gap-2">
            {[1, 2, 3, 4, 5].map((m) => (
              <button
                key={m}
                onClick={() => setMood(m)}
                className={`flex flex-1 flex-col items-center gap-1 rounded-xl border py-2 text-2xl transition ${
                  mood === m ? "border-primary/60 bg-primary/10" : "border-border/60 bg-background/40"
                }`}
              >
                <span>{MOOD_EMOJI[m]}</span>
                <span className="text-[10px] font-semibold text-muted-foreground">{MOOD_LABELS[m]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 rounded-2xl border border-border/60 bg-card/70 p-4">
          <div className="text-sm font-semibold">Did you experience cravings?</div>
          <div className="mt-3 flex gap-2">
            {[
              { v: true, label: "Yes" },
              { v: false, label: "No" },
            ].map((o) => (
              <button
                key={o.label}
                onClick={() => setCravings(o.v)}
                className={`flex-1 rounded-xl border py-2 text-sm font-semibold transition ${
                  cravings === o.v ? "border-primary/60 bg-primary/10 text-foreground" : "border-border/60 bg-background/40 text-muted-foreground"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
          {cravings && (
            <Link to="/cravings" className="mt-3 inline-block text-xs text-primary underline">
              Log the craving in detail →
            </Link>
          )}
        </div>

        <div className="mt-3 space-y-3">
          <Scale label="Stress level" value={stress} onChange={setStress} low="Calm" high="Overwhelmed" />
          <Scale label="Energy level" value={energy} onChange={setEnergy} low="Drained" high="Energised" />
          <Scale label="Sleep quality" value={sleep} onChange={setSleep} low="Terrible" high="Excellent" />
        </div>

        <button
          onClick={() => {
            addCheckIn({ mood, cravings, stress, energy, sleep });
            toast.success(checkedInToday ? "Check-in updated." : "Checked in · +25 RP");
          }}
          className="mt-5 w-full rounded-full bg-aurora px-5 py-3 text-sm font-bold text-primary-foreground shadow-glow"
        >
          {checkedInToday ? "Update check-in" : "Save check-in · +25 RP"}
        </button>

        {history.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-3 text-lg font-bold">Recent history</h2>
            <div className="space-y-2">
              {history.map((c) => (
                <div key={c.id} className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/70 p-3">
                  <div className="text-2xl">{MOOD_EMOJI[c.mood]}</div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{c.dateKey}</div>
                    <div className="text-xs text-muted-foreground">
                      Stress {c.stress} · Energy {c.energy} · Sleep {c.sleep}
                      {c.cravings ? " · cravings" : ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
