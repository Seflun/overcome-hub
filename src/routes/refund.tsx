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
            <p>Addiblock offers a no paid plans at the moment. Addiblock is a free demo and Addiblock+ is unlocked with an in-app toggle, so there is nothing to purchase and nothing to refund.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold">How to request a refund</h2>
            <p>To request a refund, contact our support team from within the app or reply to your purchase receipt. Since no payments are collected today, there are no refunds to process. If paid plans return in the future, this policy will be updated before any charge is made.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold">Cancelling your subscription</h2>
            <p>There is no subscription to cancel. You can turn Addiblock+ off at any time from the Plus Demo page, and turn it back on whenever you like.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold">Payment processing</h2>
            <p>No payment processor is connected and no payments are taken. Optional donations toward development are handled by WhyDonate and are non-refundable gifts, not purchases.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
