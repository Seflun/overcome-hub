import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Sparkles, Check, ArrowLeft, Layers, ShieldAlert, Bot, LineChart, Download, ToggleLeft, ToggleRight, HeartHandshake } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "../components/app-shell";
import { useStore } from "../lib/store";

export const Route = createFileRoute("/plus")({
  head: () => ({
    meta: [
      { title: "Addiblock+ Demo — Go deeper" },
      { name: "description", content: "Addiblock+ is free while in demo: flip one toggle to unlock unlimited journeys, the SOS toolkit, insights, unlimited AI Coach and export." },
      { property: "og:title", content: "Addiblock+ Demo — Go deeper" },
      { property: "og:description", content: "No payment needed. Toggle Addiblock+ on and off any time during the demo." },
    ],
  }),
  component: Plus,
});

const FEATURES = [
  { icon: Layers,        title: "Unlimited journeys",     blurb: "Break more than 2 loops at once — nicotine + gambling + alcohol, whatever you need." },
  { icon: Bot,           title: "Unlimited AI Coach",     blurb: "Chat with the AI Coach as often as you need. Free plan includes a daily streak allowance." },
  { icon: ShieldAlert,   title: "3-minute SOS protocol",  blurb: "Guided science-backed protocol: cold water → move → ground → reach out." },
  { icon: LineChart,     title: "Health & money insights", blurb: "Watch your body recover, dollars saved, and personal milestones stack up." },
  { icon: Sparkles,      title: "AI helpers everywhere",  blurb: "Summaries and answers inside Analytics, Journal, Progress, Explore and the Library — built from your own data." },
  { icon: Download,      title: "Export your progress",   blurb: "For your therapist, doctor, or your own future self." },
];

export const DONATION_URL = "https://whydonate.com/fundraising/support-addiblocks-developement";

function Plus() {
  const { state, setPremium } = useStore();
  const navigate = useNavigate();
  const isPremium = state.isPremium;

  const toggle = () => {
    setPremium(!isPremium);
    toast.success(isPremium ? "Addiblock+ turned off." : "Addiblock+ unlocked — enjoy the demo.");
  };

  return (
    <AppShell>
      <div className="px-5 pb-8 pt-6">
        <button
          onClick={() => navigate({ to: "/today" })}
          className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>

        <div className="rounded-3xl border border-primary/40 bg-card-grad p-6 shadow-glow">
          <div className="inline-flex items-center gap-1 rounded-full bg-aurora px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary-foreground">
            <Sparkles className="h-3 w-3" /> Addiblock+ Demo
          </div>
          <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight">
            Go <span className="text-aurora">deeper</span> into your recovery.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Addiblock's core — streaks, RP, daily missions, slip resets — stays free forever.
            Addiblock+ adds the tools that make the hard moments survivable, and right now
            <strong className="text-foreground"> no payment is needed</strong>: Addiblock is a demo
            built to help people, so Plus is just a toggle you flip on and off whenever you like.
          </p>

          <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-primary/40 bg-primary/10 p-4">
            <div className="min-w-0">
              <div className="text-sm font-semibold">
                {isPremium ? "Addiblock+ is ON" : "Addiblock+ is OFF"}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Demo mode — free, no card, no checkout. Toggle any time.
              </div>
            </div>
            <button
              onClick={toggle}
              role="switch"
              aria-checked={isPremium}
              aria-label="Toggle Addiblock+ demo"
              className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-bold shadow-glow transition ${
                isPremium
                  ? "bg-aurora text-primary-foreground"
                  : "border border-primary/50 text-primary"
              }`}
            >
              {isPremium ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
              {isPremium ? "Turn off" : "Turn on"}
            </button>
          </div>

          <div className="mt-2 text-center text-[11px] text-muted-foreground">
            Payments aren't set up yet — everything here is free during the demo.
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
            <li>· Streaks, RP and daily missions are always free.</li>
            <li>· No payments right now — Plus is a demo toggle for everyone.</li>
            <li>· No ads, ever — a recovery app is the wrong place for triggers.</li>
            <li>· No aggressive upsells after a slip. That's the worst moment.</li>
            <li>· Unlimited slip resets, always.</li>
          </ul>
        </div>

        <div className="mt-4 flex gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4">
          <HeartHandshake className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p className="text-xs text-muted-foreground">
            Addiblock is built by one solo developer on a tiny budget. Donations are completely
            optional, but they're what keeps updates coming.{" "}
            <a
              href={DONATION_URL}
              target="_blank"
              rel="noreferrer noopener"
              className="font-semibold text-primary underline"
            >
              Support development
            </a>
            .
          </p>
        </div>
      </div>
    </AppShell>
  );
}
