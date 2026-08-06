// Server-only helpers for PayPal Subscriptions.
// Credentials are secrets — never import this file from client code.

const getEnv = (key: string): string | undefined => process.env[key];

const requireEnv = (key: string): string => {
  const value = getEnv(key);
  if (!value) throw new Error(`${key} is not configured`);
  return value;
};

export type PayPalEnv = "sandbox" | "live";

export function getPayPalEnv(): PayPalEnv {
  return getEnv("PAYPAL_ENV") === "sandbox" ? "sandbox" : "live";
}

export function getPayPalApiBase(): string {
  return getPayPalEnv() === "sandbox"
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";
}

async function getAccessToken(): Promise<string> {
  const id = requireEnv("PAYPAL_CLIENT_ID");
  const secret = requireEnv("PAYPAL_CLIENT_SECRET");
  const res = await fetch(`${getPayPalApiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) {
    console.error(`PayPal auth failed [${res.status}]: ${await res.text()}`);
    throw new Error("Payment provider rejected our credentials. Please try again shortly.");
  }
  const json = (await res.json()) as { access_token: string };
  return json.access_token;
}

export async function paypalFetch<T = any>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(`${getPayPalApiBase()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`PayPal request failed [${res.status}] ${path}: ${body}`);
    throw new Error(friendlyPayPalError(res.status, body));
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export function friendlyPayPalError(status: number, body: string): string {
  try {
    const parsed = JSON.parse(body) as {
      message?: string;
      details?: Array<{ description?: string; issue?: string }>;
    };
    const detail = parsed.details?.[0]?.description ?? parsed.details?.[0]?.issue;
    if (detail && /email/i.test(detail)) {
      return "That email address doesn't look valid. Please use a real email you can receive the receipt at.";
    }
    if (detail) return detail;
    if (parsed.message) return parsed.message;
  } catch {
    // fall through
  }
  if (status === 401 || status === 403) {
    return "Payment provider rejected our credentials. Please try again shortly.";
  }
  return "We couldn't start checkout just now. Please try again in a moment.";
}

export function getPayPalErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Payment request failed";
}

export type PlanKey = "monthly" | "yearly";

export const PLAN_CONFIG: Record<
  PlanKey,
  { name: string; amount: string; interval: "MONTH" | "YEAR" }
> = {
  monthly: { name: "Addiblock+ Monthly", amount: "2.99", interval: "MONTH" },
  yearly: { name: "Addiblock+ Yearly", amount: "16.99", interval: "YEAR" },
};

const PRODUCT_NAME = "Addiblock+";

type PayPalProduct = { id: string; name: string };
type PayPalPlan = {
  id: string;
  name: string;
  status: string;
  billing_cycles?: Array<{
    frequency?: { interval_unit?: string };
    pricing_scheme?: { fixed_price?: { value?: string; currency_code?: string } };
  }>;
};

async function ensureProduct(): Promise<string> {
  const list = await paypalFetch<{ products?: PayPalProduct[] }>(
    "/v1/catalogs/products?page_size=100",
  );
  const existing = (list.products ?? []).find((p) => p.name === PRODUCT_NAME);
  if (existing) return existing.id;

  const created = await paypalFetch<PayPalProduct>("/v1/catalogs/products", {
    method: "POST",
    body: JSON.stringify({
      name: PRODUCT_NAME,
      description: "Addiblock+ recovery subscription",
      type: "SERVICE",
      category: "SOFTWARE",
    }),
  });
  return created.id;
}

/**
 * Resolves (creating on first use) the two Addiblock+ PayPal plans, so the app
 * works with nothing but API credentials configured.
 */
export async function resolvePlans(): Promise<Record<PlanKey, PayPalPlan>> {
  const productId = await ensureProduct();
  const list = await paypalFetch<{ plans?: PayPalPlan[] }>(
    `/v1/billing/plans?product_id=${encodeURIComponent(productId)}&page_size=100&total_required=false`,
  );
  const plans = (list.plans ?? []).filter((p) => p.status !== "INACTIVE");

  const resolveOne = async (key: PlanKey): Promise<PayPalPlan> => {
    const cfg = PLAN_CONFIG[key];
    const found = plans.find((p) => p.name === cfg.name);
    if (found) {
      // Fetch full detail so pricing is available for display.
      return await paypalFetch<PayPalPlan>(
        `/v1/billing/plans/${encodeURIComponent(found.id)}`,
      );
    }
    return await paypalFetch<PayPalPlan>("/v1/billing/plans", {
      method: "POST",
      body: JSON.stringify({
        product_id: productId,
        name: cfg.name,
        description: `Addiblock+ billed ${key}`,
        status: "ACTIVE",
        billing_cycles: [
          {
            frequency: { interval_unit: cfg.interval, interval_count: 1 },
            tenure_type: "REGULAR",
            sequence: 1,
            total_cycles: 0,
            pricing_scheme: {
              fixed_price: { value: cfg.amount, currency_code: "USD" },
            },
          },
        ],
        payment_preferences: {
          auto_bill_outstanding: true,
          setup_fee_failure_action: "CONTINUE",
          payment_failure_threshold: 3,
        },
      }),
    });
  };

  const [monthly, yearly] = await Promise.all([
    resolveOne("monthly"),
    resolveOne("yearly"),
  ]);
  return { monthly, yearly };
}

export function planPrice(plan: PayPalPlan): {
  amount: number | null;
  currency: string | null;
  interval: string | null;
} {
  const cycle = plan.billing_cycles?.[0];
  const price = cycle?.pricing_scheme?.fixed_price;
  return {
    amount: price?.value ? Math.round(Number(price.value) * 100) : null,
    currency: price?.currency_code ?? null,
    interval: cycle?.frequency?.interval_unit?.toLowerCase() ?? null,
  };
}

export const ACTIVE_PAYPAL_STATUSES = ["ACTIVE", "APPROVED"];

export function mapPayPalStatus(status: string): string {
  switch (String(status).toUpperCase()) {
    case "ACTIVE":
      return "active";
    case "APPROVAL_PENDING":
    case "APPROVED":
      return "trialing";
    case "SUSPENDED":
      return "past_due";
    case "CANCELLED":
    case "EXPIRED":
      return "canceled";
    default:
      return String(status).toLowerCase();
  }
}

/** Verifies a PayPal webhook using PayPal's signature verification endpoint. */
export async function verifyPayPalWebhook(
  req: Request,
): Promise<{ event_type: string; resource: any }> {
  const body = await req.text();
  const webhookId = requireEnv("PAYPAL_WEBHOOK_ID");

  const headers = {
    transmission_id: req.headers.get("paypal-transmission-id"),
    transmission_time: req.headers.get("paypal-transmission-time"),
    cert_url: req.headers.get("paypal-cert-url"),
    auth_algo: req.headers.get("paypal-auth-algo"),
    transmission_sig: req.headers.get("paypal-transmission-sig"),
  };
  if (Object.values(headers).some((v) => !v)) {
    throw new Error("Missing webhook headers");
  }

  const result = await paypalFetch<{ verification_status: string }>(
    "/v1/notifications/verify-webhook-signature",
    {
      method: "POST",
      body: JSON.stringify({
        auth_algo: headers.auth_algo,
        cert_url: headers.cert_url,
        transmission_id: headers.transmission_id,
        transmission_sig: headers.transmission_sig,
        transmission_time: headers.transmission_time,
        webhook_id: webhookId,
        webhook_event: JSON.parse(body),
      }),
    },
  );
  if (result.verification_status !== "SUCCESS") {
    throw new Error("Invalid webhook signature");
  }
  return JSON.parse(body);
}
