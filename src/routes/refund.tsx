import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/refund")({
  head: () => ({
    meta: [
      { title: "Refund Policy — Addiction Blocker" },
      { name: "description", content: "Addiction Breaker's 30-day money-back guarantee and how to request a refund." },
      { property: "og:title", content: "Refund Policy — Addiction Blocker" },
      { property: "og:description", content: "Addiction Breaker's 30-day money-back guarantee and how to request a refund." },
    ],
  }),
  component: RefundPage,
});

function RefundPage() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-3xl px-5 py-16 md:px-8">
        <Link to="/" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">← Back home</Link>
        <h1 className="mt-6 text-4xl font-black tracking-tight md:text-5xl">Refund Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-foreground/90">
          <section>
            <h2 className="text-xl font-bold">30-day money-back guarantee</h2>
            <p>Addiction Breaker offers a <strong>30-day money-back guarantee</strong> on Addiction Blocker+ subscriptions. If you're not satisfied with your purchase, you can request a full refund within 30 days of your order date.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold">How to request a refund</h2>
            <p>Refunds are processed by our payment provider and Merchant of Record, Paddle. To request a refund:</p>
            <ol className="list-decimal pl-6">
              <li>Visit <a className="underline" href="https://paddle.net" target="_blank" rel="noreferrer">paddle.net</a> and look up your order using the email you purchased with.</li>
              <li>Or contact our support team through the app and we'll help you initiate the refund with Paddle.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold">Cancelling your subscription</h2>
            <p>You can cancel your subscription at any time from paddle.net or from your account page. Cancellation stops future billing; you retain access to Addiction Blocker+ features until the end of the current billing period.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold">Merchant of Record</h2>
            <p>Our order process is conducted by our online reseller Paddle.com. Paddle.com is the Merchant of Record for all our orders. Paddle provides all customer service inquiries and handles returns. For full mechanics, see Paddle's <a className="underline" href="https://www.paddle.com/legal/refund-policy" target="_blank" rel="noreferrer">Refund Policy</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
