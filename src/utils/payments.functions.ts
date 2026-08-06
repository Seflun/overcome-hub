import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  ACTIVE_PAYPAL_STATUSES,
  getPayPalErrorMessage,
  mapPayPalStatus,
  paypalFetch,
  planPrice,
  resolvePlans,
  type PlanKey,
} from "@/lib/paypal.server";

const planSchema = z.enum(["monthly", "yearly"]);

export type PlanInfo = {
  plan: PlanKey;
  productId: string;
  name: string;
  amount: number | null;
  currency: string | null;
  interval: string | null;
};

type PlansResult = { plans: PlanInfo[] } | { error: string };

/** Public plan metadata straight from PayPal (names + amounts only). */
export const getPlusPlans = createServerFn({ method: "GET" }).handler(
  async (): Promise<PlansResult> => {
    try {
      const plansByKey = await resolvePlans();
      const plans = (["monthly", "yearly"] as PlanKey[]).map((plan) => {
        const p = plansByKey[plan];
        const price = planPrice(p);
        return {
          plan,
          productId: p.id,
          name: p.name,
          amount: price.amount,
          currency: price.currency,
          interval: price.interval,
        };
      });
      return { plans };
    } catch (error) {
      return { error: getPayPalErrorMessage(error) };
    }
  },
);

type CheckoutResult = { url: string; subscriptionId: string } | { error: string };

/** Creates a PayPal subscription and returns its approval URL. */
export const createPayPalCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        plan: planSchema,
        customerEmail: z.string().max(320),
        successUrl: z.string().url(),
        cancelUrl: z.string().url(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }): Promise<CheckoutResult> => {
    const email = data.customerEmail.trim().toLowerCase();
    if (!z.string().email().safeParse(email).success) {
      return { error: "A valid email is required for your receipt." };
    }
    try {
      const plans = await resolvePlans();
      const plan = plans[data.plan];

      const subscription = await paypalFetch<{
        id: string;
        links?: Array<{ rel: string; href: string }>;
      }>("/v1/billing/subscriptions", {
        method: "POST",
        body: JSON.stringify({
          plan_id: plan.id,
          custom_id: context.userId,
          subscriber: { email_address: email },
          application_context: {
            brand_name: "Addiblock",
            user_action: "SUBSCRIBE_NOW",
            shipping_preference: "NO_SHIPPING",
            payment_method: {
              payer_selected: "PAYPAL",
              payee_preferred: "IMMEDIATE_PAYMENT_REQUIRED",
            },
            return_url: data.successUrl,
            cancel_url: data.cancelUrl,
          },
        }),
      });

      const approve = subscription.links?.find((l) => l.rel === "approve")?.href;
      if (!approve) throw new Error("PayPal did not return an approval URL");
      return { url: approve, subscriptionId: subscription.id };
    } catch (error) {
      return { error: getPayPalErrorMessage(error) };
    }
  });

type ConfirmResult = { active: boolean } | { error: string };

/**
 * Reads a subscription straight from PayPal and syncs the local row, so the
 * success page never has to wait on webhook delivery.
 */
export const confirmPayPalSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ subscriptionId: z.string().min(1).max(100) }).parse(data),
  )
  .handler(async ({ data, context }): Promise<ConfirmResult> => {
    try {
      const sub = await paypalFetch<any>(
        `/v1/billing/subscriptions/${encodeURIComponent(data.subscriptionId)}`,
      );

      if (sub.custom_id && sub.custom_id !== context.userId) {
        return { error: "This subscription belongs to a different account" };
      }

      const status = String(sub.status ?? "");
      if (!ACTIVE_PAYPAL_STATUSES.includes(status.toUpperCase())) {
        return { active: false };
      }

      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const row = {
        user_id: context.userId,
        provider: "paypal",
        paypal_subscription_id: String(sub.id),
        paypal_payer_id: String(sub.subscriber?.payer_id ?? ""),
        product_id: String(sub.plan_id ?? ""),
        price_id: String(sub.plan_id ?? ""),
        status: mapPayPalStatus(status),
        current_period_start: sub.billing_info?.last_payment?.time ?? sub.start_time ?? null,
        current_period_end: sub.billing_info?.next_billing_time ?? null,
        cancel_at_period_end: false,
        environment: "live",
        updated_at: new Date().toISOString(),
      } as any;

      const { data: existing } = await supabaseAdmin
        .from("subscriptions")
        .select("id")
        .eq("paypal_subscription_id", String(sub.id))
        .maybeSingle();
      const saveQuery = existing?.id
        ? supabaseAdmin.from("subscriptions").update(row).eq("id", existing.id)
        : supabaseAdmin.from("subscriptions").insert(row);
      const { error: saveError } = await saveQuery;
      if (saveError) return { error: `Could not save subscription: ${saveError.message}` };

      return { active: true };
    } catch (error) {
      return { error: getPayPalErrorMessage(error) };
    }
  });

type CancelResult = { canceled: true } | { error: string };

/** Cancels the signed-in user's active PayPal subscription. */
export const cancelPayPalSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CancelResult> => {
    try {
      const { data: row } = await context.supabase
        .from("subscriptions")
        .select("paypal_subscription_id")
        .eq("user_id", context.userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const subscriptionId = (row as any)?.paypal_subscription_id as string | undefined;
      if (!subscriptionId) return { error: "No active subscription found." };

      await paypalFetch(
        `/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`,
        {
          method: "POST",
          body: JSON.stringify({ reason: "Cancelled by the subscriber in Addiblock" }),
        },
      );

      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin
        .from("subscriptions")
        .update({ status: "canceled", cancel_at_period_end: true, updated_at: new Date().toISOString() })
        .eq("paypal_subscription_id", subscriptionId);

      return { canceled: true };
    } catch (error) {
      return { error: getPayPalErrorMessage(error) };
    }
  });
