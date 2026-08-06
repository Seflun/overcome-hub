import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, Loader2, AlertTriangle } from "lucide-react";
import { AppShell } from "../components/app-shell";
import { useStore } from "../lib/store";
import { supabase } from "../integrations/supabase/client";
import { confirmPayPalSubscription } from "../utils/payments.functions";

export const Route = createFileRoute("/checkout/success")({
  head: () => ({
    meta: [
      { title: "Welcome to Addiblock+" },
      { name: "description", content: "Your Addiblock+ subscription is active." },
      { property: "og:title", content: "Welcome to Addiblock+" },
      { property: "og:description", content: "Your Addiblock+ subscription is active." },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { subscription_id?: string } => ({
    subscription_id:
      typeof search.subscription_id === "string" ? search.subscription_id : undefined,
  }),
  component: Success,
});

function Success() {
  const navigate = useNavigate();
  const { subscription_id: subscriptionId } = Route.useSearch();
  const { userId, state } = useStore();
  const [confirmed, setConfirmed] = useState(state.isPremium);
  const [stalled, setStalled] = useState(false);

  useEffect(() => {
    if (state.isPremium) setConfirmed(true);
  }, [state.isPremium]);

  useEffect(() => {
    if (!userId || confirmed) return;
    let cancelled = false;
    let attempts = 0;

    const readRow = async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("status, current_period_end")
        .eq("user_id", userId)
        .eq("provider", "paypal")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const s: any = data;
      return (
        !!s &&
        ((["active", "trialing", "past_due"].includes(s.status) &&
          (!s.current_period_end || new Date(s.current_period_end) > new Date())) ||
          (s.status === "canceled" &&
            !!s.current_period_end &&
            new Date(s.current_period_end) > new Date()))
      );
    };

    const tick = async () => {
      if (cancelled) return;
      attempts++;

      // Ask PayPal directly (and sync the row) instead of waiting on the webhook.
      if (subscriptionId) {
        try {
          const result = await confirmPayPalSubscription({ data: { subscriptionId } });
          if (!cancelled && "active" in result && result.active) {
            setConfirmed(true);
            return;
          }
        } catch {
          // fall through to the table read
        }
      }

      if (await readRow()) {
        if (!cancelled) setConfirmed(true);
        return;
      }
      if (cancelled) return;
      if (attempts < 5) {
        setTimeout(tick, 2000);
      } else {
        setStalled(true);
      }
    };

    tick();
    return () => {
      cancelled = true;
    };
  }, [userId, confirmed, subscriptionId]);


  const icon = confirmed ? (
    <Sparkles className="h-8 w-8" />
  ) : stalled ? (
    <AlertTriangle className="h-8 w-8" />
  ) : (
    <Loader2 className="h-8 w-8 animate-spin" />
  );

  return (
    <AppShell>
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-aurora text-primary-foreground shadow-glow">
          {icon}
        </div>
        <h1 className="mt-5 text-3xl font-black tracking-tight">
          {confirmed ? "You're in." : stalled ? "Still processing" : "Finishing up…"}
        </h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          {confirmed
            ? "Addiblock+ is active. Your subscription unlocks unlimited journeys, unlimited AI Coach, and the full toolkit. If you don't see your Plus badge yet, refresh the page once and it'll show up."
            : stalled
              ? "Your payment went through, but activation is taking longer than usual. Open the app and it'll unlock automatically once it lands — or reload this page to check again."
              : "We're confirming your payment. This usually takes a couple seconds."}
        </p>
        <button
          onClick={() => navigate({ to: "/today" })}
          className="mt-6 rounded-full bg-aurora px-6 py-3 text-sm font-bold text-primary-foreground shadow-glow"
        >
          Go to Today
        </button>
      </div>
    </AppShell>
  );
}

