// Server-only helpers for talking to Polar (https://polar.sh).
// The organization access token is a secret — never import this from client code.

const getEnv = (key: string): string | undefined => process.env[key];

const requireEnv = (key: string): string => {
  const value = getEnv(key);
  if (!value) throw new Error(`${key} is not configured`);
  return value;
};

/** Polar has two isolated environments; "sandbox" uses a separate org + token. */
export type PolarServer = "sandbox" | "production";

export function getPolarServer(): PolarServer {
  return getEnv("POLAR_SERVER") === "sandbox" ? "sandbox" : "production";
}

export function getPolarApiBase(): string {
  return getPolarServer() === "sandbox"
    ? "https://sandbox-api.polar.sh"
    : "https://api.polar.sh";
}

export async function polarFetch<T = any>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = requireEnv("POLAR_ACCESS_TOKEN");
  const res = await fetch(`${getPolarApiBase()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`Polar request failed [${res.status}] ${path}: ${body}`);
    throw new Error(friendlyPolarError(res.status, body));
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** Turns Polar's verbose validation payloads into one readable sentence. */
export function friendlyPolarError(status: number, body: string): string {
  try {
    const parsed = JSON.parse(body) as {
      detail?: Array<{ msg?: string; loc?: unknown[] }> | string;
    };
    const detail = parsed.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      const messages = detail
        .map((d) => String(d?.msg ?? ""))
        .filter(Boolean);
      const emailIssue = messages.find((m) => /email|domain/i.test(m));
      if (emailIssue) {
        return "That email address doesn't look deliverable. Please use a real email you can receive the receipt at.";
      }
      if (messages.length) return messages[0]!;
    }
  } catch {
    // fall through
  }
  if (status === 401 || status === 403) {
    return "Payment provider rejected our credentials. Please try again shortly.";
  }
  return "We couldn't start checkout just now. Please try again in a moment.";
}


export function getPolarErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Payment request failed";
}

export type PolarPrice = {
  id?: string;
  amount_type?: string;
  price_amount?: number;
  price_currency?: string;
  recurring_interval?: string | null;
};


export type PolarProduct = {
  id: string;
  name: string;
  description: string | null;
  is_archived: boolean;
  recurring_interval: string | null;
  prices: PolarPrice[];
  metadata?: Record<string, unknown>;
};

/** Pick the USD price, or fall back to the first price. */
export function pickDisplayPrice(product: PolarProduct): PolarPrice {
  const usd = product.prices?.find((p) => p.price_currency?.toLowerCase() === "usd");
  return usd ?? product.prices?.[0] ?? {};
}

export type PlanKey = "monthly" | "yearly";

/**
 * Resolves the two Addiblock+ products in Polar.
 * Matches on `metadata.plan` first ("monthly" / "yearly"), then falls back to
 * the product's recurring interval, so a plain dashboard setup still works.
 */
export async function resolvePlanProducts(): Promise<Record<PlanKey, PolarProduct>> {
  const data = await polarFetch<{ items: PolarProduct[] }>(
    "/v1/products?is_archived=false&limit=100",
  );
  const items = data.items ?? [];

  const pick = (plan: PlanKey, interval: string): PolarProduct | undefined =>
    items.find((p) => String(p.metadata?.["plan"] ?? "") === plan) ??
    items.find((p) => p.recurring_interval === interval) ??
    items.find((p) => p.prices?.some((pr) => pr.recurring_interval === interval));

  const monthly = pick("monthly", "month");
  const yearly = pick("yearly", "year");

  if (!monthly || !yearly) {
    throw new Error(
      "Addiblock+ products are not set up in Polar yet (need one monthly and one yearly subscription product).",
    );
  }
  return { monthly, yearly };
}

/** Standard Webhooks verification (the scheme Polar uses). */
export async function verifyPolarWebhook(req: Request): Promise<{ type: string; data: any }> {
  const body = await req.text();
  const id = req.headers.get("webhook-id");
  const timestamp = req.headers.get("webhook-timestamp");
  const signatureHeader = req.headers.get("webhook-signature");
  const secret = requireEnv("POLAR_WEBHOOK_SECRET");

  if (!id || !timestamp || !signatureHeader) throw new Error("Missing webhook headers");

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) throw new Error("Webhook timestamp too old");

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${id}.${timestamp}.${body}`),
  );
  const expected = Buffer.from(new Uint8Array(signed)).toString("base64");

  const provided = signatureHeader
    .split(" ")
    .map((part) => part.split(",", 2)[1])
    .filter(Boolean);
  if (!provided.includes(expected)) throw new Error("Invalid webhook signature");

  return JSON.parse(body);
}
