import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Sparkles, Check, ArrowLeft, Layers, ShieldAlert, BookHeart, LineChart, Bell, Download } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "../components/app-shell";
import { useStore } from "../lib/store";

export const Route = createFileRoute("/plus")({
  head: () => ({
    meta: [
      { title: "Addiction Blocker+ — Go deeper" },
      { name: "description", content: "Unlock unlimited journeys, the craving SOS toolkit, journaling, insights and custom reminders." },
      { property: "og:title", content: "Addiction Blocker+ — Go deeper" },
      { property: "og:description", content: "Deeper recovery tools: SOS toolkit, journaling, insights, reminders." },
    ],
  }),
  component: Plus,
});

const FEATURES = [
  { icon: Layers,        title: "Unlimited journeys",     blurb: "Break more than one loop at once — vaping + gambling, alcohol + sugar, whatever you need." },
  { icon: ShieldAlert,   title: "Craving SOS toolkit",    blurb: "Panic button, guided breathing, urge-surf timer, and a 3-minute science-backed protocol." },
  { icon: BookHeart,     title: "Journaling & mood",      blurb: "Log cravings and mood — see patterns like 'you slip most on Friday evenings'." },
  { icon: LineChart,     title: "Health & money insights", blurb: "Watch your lungs recover, dollars saved, and personal milestones stack up." },
  { icon: Bell,          title: "Custom reminders",       blurb: "Smart nudges at your trigger times — not spammy, actually useful." },
  { icon: Download,      title: "Export your progress",   blurb: "For your therapist, doctor, or your own future self." },
];

function Plus() {
  const { state, setPremium } = useStore();
  const navigate = useNavigate();

  const isPremium = state.isPremium;

  return (
    <AppShell>
      <div className="px-5 pb-8 pt-6">
        <button
          onClick={() => navigate({ to: "/" })}
          className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>

        <div className="rounded-3xl border border-primary/40 bg-card-grad p-6 shadow-glow">
          <div className="inline-flex items-center gap-1 rounded-full bg-aurora px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary-foreground">
            <Sparkles className="h-3 w-3" /> Addiction Blocker+
          </div>
          <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight">
            Go <span className="text-aurora">deeper</span> into your recovery.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Addiction Blocker's core — streaks, XP, daily missions, slip resets — stays free forever. Addiction Blocker+ adds the tools that make the hard moments survivable.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <div className="rounded-2xl border border-primary/40 bg-primary/10 p-3">
              <div className="text-xs text-muted-foreground">Monthly</div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-2xl font-black">$4.99</span>
                <span className="text-xs text-muted-foreground">/mo</span>
              </div>
              <div className="mt-1 text-[10px] text-muted-foreground">Less than 2 packs of gum</div>
            </div>
            <div className="relative rounded-2xl border border-primary/60 bg-aurora/10 p-3">
              <div className="absolute -top-2 right-2 rounded-full bg-aurora px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-primary-foreground">
                Save 50%
              </div>
              <div className="text-xs text-muted-foreground">Yearly</div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-2xl font-black">$29</span>
                <span className="text-xs text-muted-foreground">/yr</span>
              </div>
              <div className="mt-1 text-[10px] text-muted-foreground">$2.42/mo · 7-day free trial</div>
            </div>
          </div>

          <button
            onClick={() => {
              if (isPremium) {
                setPremium(false);
                toast("Addiction Blocker+ turned off. Core stays free.");
              } else {
                setPremium(true);
                toast.success("Welcome to Addiction Blocker+ 🎉");
                navigate({ to: "/" });
              }
            }}
            className={`mt-4 w-full rounded-full px-5 py-3 text-sm font-bold shadow-glow transition ${
              isPremium
                ? "bg-card border border-border/60 text-foreground"
                : "bg-aurora text-primary-foreground"
            }`}
          >
            {isPremium ? "Turn off Plus (demo)" : "Start 7-day free trial"}
          </button>
          <div className="mt-2 text-center text-[11px] text-muted-foreground">
            Cancel anytime · No card until trial ends
          </div>
        </div>

        <div className="mt-6 space-y-2.5">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="flex gap-3 rounded-2xl border border-border/60 bg-card/70 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold">{f.title}</div>
                    <Check className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{f.blurb}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 rounded-2xl border border-border/40 bg-card/40 p-4 text-xs text-muted-foreground">
          <div className="font-semibold text-foreground">Our promise</div>
          <ul className="mt-2 space-y-1.5">
            <li>· Streaks, XP and daily missions are always free.</li>
            <li>· No ads, ever — a recovery app is the wrong place for triggers.</li>
            <li>· No aggressive upsells after a slip. That's the worst moment.</li>
            <li>· Unlimited slip resets on every plan.</li>
          </ul>
        </div>
      </div>
    </AppShell>
  );
}
