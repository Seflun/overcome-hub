import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { verifyPolarWebhook } from "@/lib/polar.server";

let _supabase: any = null;
function getSupabase(): any {
  if (!_supabase) {
    _supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }
  return _supabase;
}

function planFromSubscription(sub: any): string {
  return String(
    sub.metadata?.plan ??
      (sub.recurring_interval === "year" ? "yearly" : "monthly"),
  );
}

async function upsertSubscription(sub: any) {
  const userId =
    sub.metadata?.userId ?? sub.customer?.external_id ?? sub.user_id ?? null;
  if (!userId) {
    console.error("Polar webhook: no user id on subscription", sub.id);
    return;
  }

  const { error } = await getSupabase()
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        provider: "polar",
        polar_subscription_id: sub.id,
        polar_customer_id: String(sub.customer_id ?? ""),
        product_id: String(sub.product_id ?? ""),
        price_id: planFromSubscription(sub),
        status: String(sub.status),
        current_period_start: sub.current_period_start ?? null,
        current_period_end: sub.current_period_end ?? null,
        cancel_at_period_end: sub.cancel_at_period_end ?? false,
        environment: "live",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "polar_subscription_id" },
    );
  if (error) console.error("Polar webhook: failed to save subscription", error.message);
}

async function markCanceled(sub: any) {
  await getSupabase()
    .from("subscriptions")
    .update({
      status: "canceled",
      current_period_end: sub.current_period_end ?? null,
      cancel_at_period_end: sub.cancel_at_period_end ?? true,
      updated_at: new Date().toISOString(),
    })
    .eq("polar_subscription_id", sub.id);
}

export const Route = createFileRoute("/api/public/polar/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const event = await verifyPolarWebhook(request);
          switch (event.type) {
            case "subscription.created":
            case "subscription.active":
            case "subscription.updated":
            case "subscription.uncanceled":
            case "subscription.past_due":
              await upsertSubscription(event.data);
              break;
            case "subscription.canceled":
            case "subscription.revoked":
              await markCanceled(event.data);
              break;
            default:
              console.log("Unhandled Polar event:", event.type);
          }
          return Response.json({ received: true });
        } catch (e) {
          console.error("Polar webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
