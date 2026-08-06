import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Sparkles, Check, ArrowLeft, Layers, ShieldAlert, Bot, LineChart, Download } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";

import { AppShell } from "../components/app-shell";
import { useStore } from "../lib/store";
import { cancelPayPalSubscription, createPayPalCheckout } from "../utils/payments.functions";


export const Route = createFileRoute("/plus")({
  head: () => ({
    meta: [
      { title: "Addiblock+ — Go deeper" },
      { name: "description", content: "Unlock unlimited journeys, the craving SOS toolkit, insights, unlimited AI Coach and export." },
      { property: "og:title", content: "Addiblock+ — Go deeper" },
      { property: "og:description", content: "Deeper recovery tools: SOS toolkit, unlimited AI Coach, insights, export." },
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

function Plus() {
  const { state, userId, userEmail } = useStore();
  const navigate = useNavigate();
  const [busy, setBusy] = useState<"monthly" | "yearly" | null>(null);
  const [portalBusy, setPortalBusy] = useState(false);
  const [billingEmail, setBillingEmail] = useState(userEmail ?? "");
  const [pendingPlan, setPendingPlan] = useState<"monthly" | "yearly" | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("yearly");

  useEffect(() => {
    if (userEmail) setBillingEmail((prev) => prev || userEmail);
  }, [userEmail]);

  const isPremium = state.isPremium;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(billingEmail.trim());

  const start = async (plan: "monthly" | "yearly", email: string) => {
    setBusy(plan);
    try {
      const result = await createPayPalCheckout({
        data: {
          plan,
          customerEmail: email,
          successUrl: `${window.location.origin}/checkout/success`,
          cancelUrl: `${window.location.origin}/plus`,
        },
      });
      if ("error" in result) throw new Error(result.error);
      setPendingPlan(null);
      window.location.href = result.url;
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Checkout couldn't open. Try again in a moment.");
      setBusy(null);
    }
  };

  const buy = (plan: "monthly" | "yearly") => {
    if (!userId) {
      toast("Sign in to subscribe");
      navigate({ to: "/auth" });
      return;
    }
    // A receipt email is required before we can open checkout.
    if (!emailValid) {
      setPendingPlan(plan);
      toast("Add the email address for your receipt");
      return;
    }
    void start(plan, billingEmail.trim());
  };

  const cancelPlan = async () => {
    setPortalBusy(true);
    try {
      const result = await cancelPayPalSubscription();
      if ("error" in result) throw new Error(result.error);
      toast.success("Your subscription has been cancelled.");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Couldn't cancel the subscription.");
    } finally {
      setPortalBusy(false);
    }
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
            <Sparkles className="h-3 w-3" /> Addiblock+
          </div>
          <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight">
            Go <span className="text-aurora">deeper</span> into your recovery.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Addiblock's core — streaks, XP, daily missions, slip resets — stays free forever. Addiblock+ adds the tools that make the hard moments survivable.
          </p>

          {isPremium ? (
            <div className="mt-5 rounded-2xl border border-primary/40 bg-primary/10 p-4 text-center">
              <div className="text-sm font-semibold">You're on Addiblock+</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Thanks for supporting recovery. Your plan and receipts also live in your
                PayPal account under Automatic Payments.
              </div>
              <button
                onClick={cancelPlan}
                disabled={portalBusy}
                className="mt-3 rounded-full border border-primary/50 px-4 py-2 text-xs font-semibold text-primary disabled:opacity-60"
              >
                {portalBusy ? "Cancelling…" : "Cancel subscription"}
              </button>
            </div>
          ) : (
            <>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setSelectedPlan("monthly");
                    buy("monthly");
                  }}
                  disabled={busy !== null}
                  className={`rounded-2xl border p-3 text-left transition disabled:opacity-60 ${
                    selectedPlan === "monthly"
                      ? "border-primary/70 bg-primary/15 ring-1 ring-primary/40"
                      : "border-primary/30 bg-primary/5 hover:bg-primary/10"
                  }`}
                >
                  <div className="text-xs text-muted-foreground">Monthly</div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-2xl font-black">$2.99</span>
                    <span className="text-xs text-muted-foreground">/mo</span>
                  </div>
                  <div className="mt-1 text-[10px] text-muted-foreground">
                    {busy === "monthly" ? "Opening checkout…" : "Cancel anytime"}
                  </div>
                </button>
                <button
                  onClick={() => {
                    setSelectedPlan("yearly");
                    buy("yearly");
                  }}
                  disabled={busy !== null}
                  className={`relative rounded-2xl border p-3 text-left transition disabled:opacity-60 ${
                    selectedPlan === "yearly"
                      ? "border-primary/70 bg-aurora/15 ring-1 ring-primary/40"
                      : "border-primary/30 bg-aurora/5 hover:bg-aurora/10"
                  }`}
                >
                  <div className="absolute -top-2 right-2 rounded-full bg-aurora px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-primary-foreground">
                    Save 53%
                  </div>
                  <div className="text-xs text-muted-foreground">Yearly</div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-2xl font-black">$16.99</span>
                    <span className="text-xs text-muted-foreground">/yr</span>
                  </div>
                  <div className="mt-1 text-[10px] text-muted-foreground">
                    {busy === "yearly" ? "Opening checkout…" : "$1.42/mo"}
                  </div>
                </button>
              </div>

              <div className="mt-4">
                <label className="px-1 text-[11px] text-muted-foreground">
                  Email for your receipt <span className="text-primary">(required)</span>
                </label>
                <input
                  type="email"
                  required
                  value={billingEmail}
                  onChange={(e) => setBillingEmail(e.target.value)}
                  placeholder="you@email.com"
                  className={`mt-1 w-full rounded-2xl border bg-background/50 px-4 py-3 text-sm outline-none focus:border-primary/60 ${
                    pendingPlan && !emailValid ? "border-destructive/70" : "border-border/60"
                  }`}
                />
                <p className="mt-1 px-1 text-[11px] text-muted-foreground">
                  We send your receipt and subscription updates here.
                </p>
              </div>

              <button
                onClick={() => buy(selectedPlan)}
                disabled={busy !== null}
                className="mt-4 w-full rounded-full bg-aurora px-5 py-3 text-sm font-bold text-primary-foreground shadow-glow disabled:opacity-60"
              >
                {busy
                  ? "Opening secure checkout…"
                  : `Get Addiblock+ · ${selectedPlan === "monthly" ? "$2.99/mo" : "$16.99/yr"}`}
              </button>


              <div className="mt-2 text-center text-[11px] text-muted-foreground">
                Secure checkout · Cancel anytime
              </div>
            </>
          )}
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
