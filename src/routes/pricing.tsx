import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, Sparkles } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Addiblock" },
      { name: "description", content: "Addiblock is free to start. Upgrade to Addiblock+ for $2.99/month or $16.99/year." },
      { property: "og:title", content: "Pricing — Addiblock" },
      { property: "og:description", content: "Free to start. Addiblock+ is $2.99/month or $16.99/year." },
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
            <Sparkles className="h-3 w-3 text-primary" /> Simple pricing
          </div>
          <h1 className="mt-6 text-4xl font-black tracking-tight md:text-6xl">
            Free to start. <span className="text-aurora">Cheap</span> to go further.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground md:text-base">
            Everything you need to break the loop is free. Addiblock+ unlocks unlimited journeys and unlimited AI Coach when you're ready.
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
            <div className="absolute right-6 top-6 rounded-full bg-aurora px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary-foreground">Best value</div>
            <div className="text-xs font-semibold uppercase tracking-widest text-primary">Addiblock+</div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-5xl font-black">$2.99</span>
              <span className="text-sm text-muted-foreground">/ month</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">or <strong className="text-foreground">$16.99 / year</strong> — save over 50%</p>
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
              Get Addiblock+ <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="mt-3 text-center text-[11px] text-muted-foreground">
              30-day money-back guarantee. Cancel anytime.
            </p>
          </div>
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-center text-xs text-muted-foreground">
          Prices in USD. Payments are processed securely by Polar. Applicable taxes may be added at checkout. See our <Link to="/terms" className="underline">Terms</Link> and <Link to="/refund" className="underline">Refund Policy</Link>.
        </p>
      </div>
    </div>
  );
}
