import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, Sparkles } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Addiblock" },
      { name: "description", content: "Addiblock is completely free right now — Addiblock+ is a demo you unlock with a single toggle. No payment needed." },
      { property: "og:title", content: "Pricing — Addiblock" },
      { property: "og:description", content: "Everything is free during the demo. Addiblock+ unlocks with a toggle." },
    ],
  }),
  component: PricingPage,
});

const FREE = [
  "Up to 2 active addiction journeys",
  "Daily missions, streaks, XP & milestones",
  "Urge Surf timer & basic SOS toolkit",
  "Journal with mood tracker & history",
  "Custom reminders",
  "AI Coach with a daily credit streak (5 → 75/day)",
];

const PLUS = [
  "Unlimited addiction journeys",
  "Unlimited AI Coach conversations",
  "AI journal review — daily reflections on your entries",
  "Advanced SOS toolkit & insights",
  "Money & health saved calculators",
  "Priority support",
];

function PricingPage() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-5xl px-5 py-16 md:px-8">
        <Link to="/" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">← Back home</Link>
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" /> Free while in demo
          </div>
          <h1 className="mt-6 text-4xl font-black tracking-tight md:text-6xl">
Everything is <span className="text-aurora">free</span> right now.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground md:text-base">
Payments aren't set up yet — Addiblock is a demo built to help people. Addiblock+ isn't sold: you unlock it with a single toggle inside the app, and you can turn it off again any time.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          <div className="rounded-3xl border border-border/60 bg-card/60 p-8 shadow-soft">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Free</div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-5xl font-black">$0</span>
              <span className="text-sm text-muted-foreground">/ forever</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Genuinely useful on its own.</p>
            <ul className="mt-6 space-y-2 text-sm">
              {FREE.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {f}
                </li>
              ))}
            </ul>
            <Link
              to="/auth"
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full border border-border/60 bg-background px-5 py-3 text-sm font-semibold hover:border-primary/40"
            >
              Create free account <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="relative rounded-3xl border border-primary/40 bg-card p-8 shadow-glow">
            <div className="absolute right-6 top-6 rounded-full bg-aurora px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary-foreground">Free demo</div>
            <div className="text-xs font-semibold uppercase tracking-widest text-primary">Addiblock+</div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-5xl font-black">$0</span>
              <span className="text-sm text-muted-foreground">/ demo</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Unlock it with the <strong className="text-foreground">Plus Demo</strong> toggle — no card, no checkout.</p>
            <ul className="mt-6 space-y-2 text-sm">
              {PLUS.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {f}
                </li>
              ))}
            </ul>
            <Link
              to="/auth"
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-aurora px-5 py-3 text-sm font-bold text-primary-foreground shadow-glow"
            >
              Create an account & toggle Plus on <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="mt-3 text-center text-[11px] text-muted-foreground">
No payment required. Toggle Addiblock+ on or off whenever you want.
            </p>
          </div>
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-center text-xs text-muted-foreground">
There is nothing to pay: Addiblock is currently a free demo and Addiblock+ is unlocked by a toggle. Donations toward development are optional. See our <Link to="/terms" className="underline">Terms</Link> and <Link to="/refund" className="underline">Refund Policy</Link>.
        </p>
      </div>
    </div>
  );
}
