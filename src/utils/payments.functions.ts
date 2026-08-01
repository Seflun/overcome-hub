import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import Stripe from "stripe";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  type StripeEnv,
  createStripeClient,
  getStripeErrorMessage,
} from "@/lib/stripe.server";


const checkoutInput = z.object({
  priceId: z
    .string()
    .min(1)
    .regex(/^[a-zA-Z0-9_-]+$/, "Invalid priceId"),
  quantity: z.number().int().positive().optional(),
  customerEmail: z.string().email().optional(),
  userId: z
    .string()
    .regex(/^[a-zA-Z0-9_-]+$/, "Invalid userId")
    .optional(),
  returnUrl: z.string().url(),
  environment: z.enum(["sandbox", "live"]),
});

type CheckoutResult = { clientSecret: string } | { error: string };

async function resolveOrCreateCustomer(
  stripe: Stripe,
  options: { email?: string; userId?: string },
): Promise<string> {
  if (options.userId) {
    const found = await stripe.customers.search({
      query: `metadata['userId']:'${options.userId}'`,
      limit: 1,
    });
    if (found.data.length) return found.data[0].id;
  }
  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    if (existing.data.length) {
      const customer = existing.data[0];
      if (options.userId && customer.metadata?.userId !== options.userId) {
        await stripe.customers.update(customer.id, {
          metadata: { ...customer.metadata, userId: options.userId },
        });
      }
      return customer.id;
    }
  }
  const created = await stripe.customers.create({
    ...(options.email && { email: options.email }),
    ...(options.userId && { metadata: { userId: options.userId } }),
  });
  return created.id;
}

export const createCheckoutSession = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => checkoutInput.parse(data))
  .handler(async ({ data }): Promise<CheckoutResult> => {
    try {
      const stripe = createStripeClient(data.environment as StripeEnv);

      const prices = await stripe.prices.list({ lookup_keys: [data.priceId] });
      if (!prices.data.length) throw new Error(`Price not found: ${data.priceId}`);
      const stripePrice = prices.data[0];
      const isRecurring = stripePrice.type === "recurring";

      const customerId =
        data.customerEmail || data.userId
          ? await resolveOrCreateCustomer(stripe, {
              email: data.customerEmail,
              userId: data.userId,
            })
          : undefined;

      const session = await stripe.checkout.sessions.create({
        line_items: [{ price: stripePrice.id, quantity: data.quantity || 1 }],
        mode: isRecurring ? "subscription" : "payment",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        ...(customerId && { customer: customerId }),
        managed_payments: { enabled: true },
        ...(data.userId && {
          metadata: { userId: data.userId },
          ...(isRecurring && {
            subscription_data: { metadata: { userId: data.userId } },
          }),
        }),
      } as Stripe.Checkout.SessionCreateParams);

      return { clientSecret: session.client_secret ?? "" };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

// Confirms a checkout session straight from Stripe and syncs the subscription
// row, so the success page never has to wait on webhook delivery.
type ConfirmResult = { active: boolean } | { error: string };

export const confirmCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        sessionId: z.string().min(1).regex(/^cs_[a-zA-Z0-9_]+$/, "Invalid sessionId"),
        environment: z.enum(["sandbox", "live"]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }): Promise<ConfirmResult> => {
    try {
      const stripe = createStripeClient(data.environment as StripeEnv);
      const session = await stripe.checkout.sessions.retrieve(data.sessionId, {
        expand: ["subscription", "subscription.items.data.price"],
      });

      if (session.payment_status === "unpaid") return { active: false };

      const sub = session.subscription as Stripe.Subscription | null;
      if (!sub || typeof sub === "string") return { active: false };

      const userId = (sub.metadata?.userId as string | undefined) ?? context.userId;
      if (userId !== context.userId) return { error: "Session does not belong to this user" };

      const item: any = sub.items?.data?.[0];
      const priceId =
        item?.price?.lookup_key || item?.price?.metadata?.lovable_external_id || item?.price?.id;
      const productId =
        typeof item?.price?.product === "string" ? item.price.product : item?.price?.product?.id;
      const periodStart = item?.current_period_start ?? (sub as any).current_period_start;
      const periodEnd = item?.current_period_end ?? (sub as any).current_period_end;

      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("subscriptions").upsert(
        {
          user_id: context.userId,
          stripe_subscription_id: sub.id,
          stripe_customer_id: String(sub.customer),
          product_id: productId,
          price_id: priceId,
          status: sub.status,
          current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
          current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
          cancel_at_period_end: sub.cancel_at_period_end ?? false,
          environment: data.environment,
          updated_at: new Date().toISOString(),
        } as any,
        { onConflict: "stripe_subscription_id" },
      );

      const active = ["active", "trialing", "past_due"].includes(sub.status);
      return { active };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

