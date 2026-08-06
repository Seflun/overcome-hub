import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  getPolarErrorMessage,
  pickDisplayPrice,
  polarFetch,
  resolvePlanProducts,
  type PlanKey,
} from "@/lib/polar.server";

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

/** Public plan metadata straight from Polar (names + amounts only). */
export const getPlusPlans = createServerFn({ method: "GET" }).handler(
  async (): Promise<PlansResult> => {
    try {
      const products = await resolvePlanProducts();
      const plans = (["monthly", "yearly"] as PlanKey[]).map((plan) => {
        const product = products[plan];
        const price = pickDisplayPrice(product);
        return {
          plan,
          productId: product.id,
          name: product.name,
          amount: price?.price_amount ?? null,
          currency: price?.price_currency ?? null,
          interval: price?.recurring_interval ?? product.recurring_interval ?? null,
        };
      });
      return { plans };
    } catch (error) {
      return { error: getPolarErrorMessage(error) };
    }
  },
);

type CheckoutResult = { url: string } | { error: string };

/** Creates a Polar checkout session and returns its hosted URL. */
export const createPolarCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        plan: planSchema,
        customerEmail: z.string().max(320),
        successUrl: z.string().url(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }): Promise<CheckoutResult> => {
    const email = data.customerEmail.trim().toLowerCase();
    if (!z.string().email().safeParse(email).success) {
      return { error: "A valid email is required for your receipt." };
    }
    try {
      const products = await resolvePlanProducts();
      const product = products[data.plan];


      const checkout = await polarFetch<{ url: string }>("/v1/checkouts/", {
        method: "POST",
        body: JSON.stringify({
          products: [product.id],
          customer_email: email,
          external_customer_id: context.userId,
          success_url: data.successUrl,
          metadata: { userId: context.userId, plan: data.plan },
          currency: "usd",
        }),
      });

      if (!checkout.url) throw new Error("Polar did not return a checkout URL");
      return { url: checkout.url };
    } catch (error) {
      return { error: getPolarErrorMessage(error) };
    }
  });

type ConfirmResult = { active: boolean } | { error: string };

const ACTIVE_STATUSES = ["active", "trialing", "past_due"];

/**
 * Reads a checkout straight from Polar and syncs the subscription row, so the
 * success page never has to wait on webhook delivery.
 */
export const confirmPolarCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ checkoutId: z.string().min(1).max(100) }).parse(data),
  )
  .handler(async ({ data, context }): Promise<ConfirmResult> => {
    try {
      const checkout = await polarFetch<any>(
        `/v1/checkouts/${encodeURIComponent(data.checkoutId)}`,
      );

      const externalCustomerId =
        checkout.customer_external_id ?? checkout.external_customer_id ?? null;
      const metaUserId = checkout.metadata?.userId ?? null;
      if (
        (externalCustomerId && externalCustomerId !== context.userId) ||
        (metaUserId && metaUserId !== context.userId)
      ) {
        return { error: "This checkout belongs to a different account" };
      }

      if (!["succeeded", "confirmed"].includes(String(checkout.status))) {
        return { active: false };
      }

      const subscriptionId: string | null =
        checkout.subscription_id ?? checkout.subscription?.id ?? null;
      let sub: any = null;
      if (subscriptionId) {
        sub = await polarFetch<any>(
          `/v1/subscriptions/${encodeURIComponent(subscriptionId)}`,
        );
      } else {
        // Polar can finish a fully discounted recurring checkout before it
        // links subscription_id onto the checkout response. Resolve the
        // subscription from the verified customer and product instead.
        const customerId = checkout.customer_id ?? null;
        const productId = checkout.product_id ?? checkout.product?.id ?? null;
        if (!customerId || !productId) return { active: false };
        const query = new URLSearchParams({
          customer_id: String(customerId),
          product_id: String(productId),
          limit: "100",
        });
        const subscriptions = await polarFetch<{ items?: any[] }>(
          `/v1/subscriptions/?${query.toString()}`,
        );
        sub = (subscriptions.items ?? [])
          .filter((candidate) => ACTIVE_STATUSES.includes(String(candidate.status)))
          .sort(
            (a, b) =>
              new Date(String(b.created_at ?? 0)).getTime() -
              new Date(String(a.created_at ?? 0)).getTime(),
          )[0] ?? null;
        if (!sub) return { active: false };
      }

      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const subscriptionRow = {
        user_id: context.userId,
        provider: "polar",
        polar_subscription_id: sub.id,
        polar_customer_id: String(sub.customer_id ?? checkout.customer_id ?? ""),
        product_id: String(sub.product_id ?? checkout.product_id ?? ""),
        price_id: String(sub.metadata?.plan ?? checkout.metadata?.plan ?? sub.recurring_interval ?? ""),
        status: String(sub.status),
        current_period_start: sub.current_period_start ?? null,
        current_period_end: sub.current_period_end ?? null,
        cancel_at_period_end: sub.cancel_at_period_end ?? false,
        environment: "live",
        updated_at: new Date().toISOString(),
      } as any;
      const { data: existing } = await supabaseAdmin
        .from("subscriptions")
        .select("id")
        .eq("polar_subscription_id", sub.id)
        .maybeSingle();
      const saveQuery = existing?.id
        ? supabaseAdmin.from("subscriptions").update(subscriptionRow).eq("id", existing.id)
        : supabaseAdmin.from("subscriptions").insert(subscriptionRow);
      const { error: saveError } = await saveQuery;
      if (saveError) return { error: `Could not save subscription: ${saveError.message}` };

      return { active: ACTIVE_STATUSES.includes(String(sub.status)) };
    } catch (error) {
      return { error: getPolarErrorMessage(error) };
    }
  });

type PortalResult = { url: string } | { error: string };

/** Opens the Polar customer portal for the signed-in user. */
export const createPolarPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PortalResult> => {
    try {
      const session = await polarFetch<{ customer_portal_url: string }>(
        "/v1/customer-sessions/",
        {
          method: "POST",
          body: JSON.stringify({ external_customer_id: context.userId }),
        },
      );
      if (!session.customer_portal_url) throw new Error("No portal URL returned");
      return { url: session.customer_portal_url };
    } catch (error) {
      return { error: getPolarErrorMessage(error) };
    }
  });
