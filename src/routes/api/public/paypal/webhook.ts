import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { mapPayPalStatus, paypalFetch, verifyPayPalWebhook } from "@/lib/paypal.server";

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

async function saveSubscription(resource: any) {
  // Billing events (payment sale/completed) only carry the subscription id.
  const subscriptionId = String(resource.id ?? resource.billing_agreement_id ?? "");
  if (!subscriptionId) return;

  const sub = await paypalFetch<any>(
    `/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}`,
  );
  const userId = sub.custom_id ?? null;
  if (!userId) {
    console.error("PayPal webhook: no user id on subscription", subscriptionId);
    return;
  }

  const row = {
    user_id: userId,
    provider: "paypal",
    paypal_subscription_id: String(sub.id),
    paypal_payer_id: String(sub.subscriber?.payer_id ?? ""),
    product_id: String(sub.plan_id ?? ""),
    price_id: String(sub.plan_id ?? ""),
    status: mapPayPalStatus(String(sub.status ?? "")),
    current_period_start: sub.billing_info?.last_payment?.time ?? sub.start_time ?? null,
    current_period_end: sub.billing_info?.next_billing_time ?? null,
    cancel_at_period_end: String(sub.status).toUpperCase() === "CANCELLED",
    environment: "live",
    updated_at: new Date().toISOString(),
  };

  const client = getSupabase();
  const { data: existing } = await client
    .from("subscriptions")
    .select("id")
    .eq("paypal_subscription_id", String(sub.id))
    .maybeSingle();

  const { error } = existing?.id
    ? await client.from("subscriptions").update(row).eq("id", existing.id)
    : await client.from("subscriptions").insert(row);
  if (error) console.error("PayPal webhook: failed to save subscription", error.message);
}

export const Route = createFileRoute("/api/public/paypal/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const event = await verifyPayPalWebhook(request);
          switch (event.event_type) {
            case "BILLING.SUBSCRIPTION.CREATED":
            case "BILLING.SUBSCRIPTION.ACTIVATED":
            case "BILLING.SUBSCRIPTION.UPDATED":
            case "BILLING.SUBSCRIPTION.RE-ACTIVATED":
            case "BILLING.SUBSCRIPTION.SUSPENDED":
            case "BILLING.SUBSCRIPTION.CANCELLED":
            case "BILLING.SUBSCRIPTION.EXPIRED":
            case "PAYMENT.SALE.COMPLETED":
              await saveSubscription(event.resource);
              break;
            default:
              console.log("Unhandled PayPal event:", event.event_type);
          }
          return Response.json({ received: true });
        } catch (e) {
          console.error("PayPal webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
