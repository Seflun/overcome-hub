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
