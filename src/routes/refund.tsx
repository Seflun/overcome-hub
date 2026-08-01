import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/refund")({
  head: () => ({
    meta: [
      { title: "Refund Policy — Addiblock" },
      { name: "description", content: "Addiblock's 30-day money-back guarantee and how to request a refund." },
      { property: "og:title", content: "Refund Policy — Addiblock" },
      { property: "og:description", content: "Addiblock's 30-day money-back guarantee and how to request a refund." },
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
            <p>Addiblock offers a <strong>30-day money-back guarantee</strong> on Addiblock+ subscriptions. If you're not satisfied with your purchase, you can request a full refund within 30 days of your order date.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold">How to request a refund</h2>
            <p>To request a refund, contact our support team from within the app or reply to your purchase receipt. We'll process eligible refunds through our payment processor (Stripe) back to the original payment method — typically within 5–10 business days.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold">Cancelling your subscription</h2>
            <p>You can cancel your subscription at any time from your account page. Cancellation stops future billing; you retain access to Addiblock+ features until the end of the current billing period.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold">Payment processing</h2>
            <p>Payments for Addiblock+ are processed securely by Stripe. Applicable taxes are calculated and collected at checkout. Refunds are issued back to the original payment method.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
