import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { AppShell } from "../components/app-shell";
import { useStore } from "../lib/store";
import { supabase } from "../integrations/supabase/client";

export const Route = createFileRoute("/checkout/success")({
  head: () => ({
    meta: [
      { title: "Welcome to Addiblock+" },
      { name: "description", content: "Your Addiblock+ subscription is active." },
      { property: "og:title", content: "Welcome to Addiblock+" },
      { property: "og:description", content: "Your Addiblock+ subscription is active." },
    ],
  }),
  component: Success,
});

function Success() {
  const navigate = useNavigate();
  const { userId, state } = useStore();
  const [confirmed, setConfirmed] = useState(state.isPremium);

  useEffect(() => {
    if (state.isPremium) {
      setConfirmed(true);
    }
  }, [state.isPremium]);

  // Poll the subscriptions table for up to ~30s so users see Plus activate
  // immediately after the webhook lands, instead of waiting on realtime.
  useEffect(() => {
    if (!userId || confirmed) return;
    let cancelled = false;
    const env = (import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined)?.startsWith("pk_test_")
      ? "sandbox"
      : "live";
    let attempts = 0;
    const tick = async () => {
      if (cancelled) return;
      attempts++;
      const { data } = await supabase
        .from("subscriptions")
        .select("status, current_period_end")
        .eq("user_id", userId)
        .eq("environment", env)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const s: any = data;
      const active =
        !!s &&
        ((["active", "trialing", "past_due"].includes(s.status) &&
          (!s.current_period_end || new Date(s.current_period_end) > new Date())) ||
          (s.status === "canceled" && !!s.current_period_end && new Date(s.current_period_end) > new Date()));
      if (active) {
        setConfirmed(true);
      } else if (attempts < 20) {
        setTimeout(tick, 1500);
      }
    };
    tick();
    return () => {
      cancelled = true;
    };
  }, [userId, confirmed]);

  return (
    <AppShell>
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-aurora text-primary-foreground shadow-glow">
          {confirmed ? <Sparkles className="h-8 w-8" /> : <Loader2 className="h-8 w-8 animate-spin" />}
        </div>
        <h1 className="mt-5 text-3xl font-black tracking-tight">
          {confirmed ? "You're in." : "Finishing up…"}
        </h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          {confirmed
            ? "Addiblock+ is active. Your subscription unlocks unlimited journeys, unlimited AI Coach, and the full toolkit."
            : "We're confirming your payment. This usually takes a couple seconds."}
        </p>
        <button
          onClick={() => navigate({ to: "/today" })}
          disabled={!confirmed}
          className="mt-6 rounded-full bg-aurora px-6 py-3 text-sm font-bold text-primary-foreground shadow-glow disabled:opacity-50"
        >
          Go to Today
        </button>
      </div>
    </AppShell>
  );
}
