import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "../components/app-shell";
import { PremiumGate } from "../components/premium-badge";
import { useStore } from "../lib/store";

export const Route = createFileRoute("/reminders")({
  head: () => ({
    meta: [
      { title: "Reminders — Addiction Blocker" },
      { name: "description", content: "Smart nudges at your trigger times." },
      { property: "og:title", content: "Reminders — Addiction Blocker" },
      { property: "og:description", content: "Set custom recovery reminders at the times you need them." },
    ],
  }),
  component: Reminders,
});

const PRESETS = [
  { time: "07:30", label: "Morning intention" },
  { time: "12:00", label: "Midday check-in" },
  { time: "17:30", label: "The witching hour" },
  { time: "22:00", label: "Wind down + reflect" },
];

function Reminders() {
  return (
    <AppShell>
      <div className="px-5 pt-8">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          <Bell className="h-3.5 w-3.5" /> Reminders
        </div>
        <h1 className="text-3xl font-black tracking-tight">
          Nudges when it <span className="text-aurora">matters</span>.
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Set your own recovery reminders. Simple and quiet.
        </p>
        <div className="mt-6">
          <PremiumGate title="Reminders are a Plus feature" blurb="Set custom check-ins at your trigger times.">
            <RemindersInner />
          </PremiumGate>
        </div>
      </div>
    </AppShell>
  );
}

function RemindersInner() {
  const { state, addReminder, toggleReminder, removeReminder } = useStore();
  const [time, setTime] = useState("18:00");
  const [label, setLabel] = useState("");

  return (
    <>
      <div className="rounded-2xl border border-border/60 bg-card/70 p-4">
        <div className="flex items-center gap-2">
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm"
          />
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Reminder label"
            className="flex-1 rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm placeholder:text-muted-foreground/70"
          />
        </div>
        <button
          onClick={() => {
            if (!label.trim()) return;
            addReminder({ time, label: label.trim(), enabled: true });
            setLabel("");
            toast.success("Reminder saved.");
          }}
          className="mt-3 inline-flex items-center gap-1 rounded-full bg-aurora px-4 py-2 text-xs font-bold text-primary-foreground shadow-glow"
        >
          <Plus className="h-3.5 w-3.5" /> Add reminder
        </button>

        <div className="mt-4">
          <div className="text-xs text-muted-foreground">Or start from a preset:</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => {
                  addReminder({ ...p, enabled: true });
                  toast.success(`${p.label} added`);
                }}
                className="rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs"
              >
                {p.time} · {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {state.reminders.length === 0 && (
          <li className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-6 text-center text-xs text-muted-foreground">
            No reminders yet.
          </li>
        )}
        {state.reminders.map((r) => (
          <li key={r.id} className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/70 p-3">
            <button
              onClick={() => toggleReminder(r.id)}
              className={`h-5 w-9 shrink-0 rounded-full transition ${r.enabled ? "bg-primary" : "bg-muted"}`}
              aria-label="toggle"
            >
              <div
                className={`h-4 w-4 rounded-full bg-background transition-all ${r.enabled ? "translate-x-4" : "translate-x-0.5"} mt-0.5`}
              />
            </button>
            <div className="flex-1">
              <div className="font-semibold">{r.label}</div>
              <div className="text-xs text-muted-foreground">{r.time}</div>
            </div>
            <button onClick={() => removeReminder(r.id)} className="rounded-lg p-2 text-muted-foreground hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
