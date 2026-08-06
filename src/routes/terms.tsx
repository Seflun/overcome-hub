import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — Addiblock" },
      { name: "description", content: "The terms governing your use of Addiblock." },
      { property: "og:title", content: "Terms & Conditions — Addiblock" },
      { property: "og:description", content: "The terms governing your use of Addiblock." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-3xl px-5 py-16 md:px-8">
        <Link to="/" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">← Back home</Link>
        <h1 className="mt-6 text-4xl font-black tracking-tight md:text-5xl">Terms & Conditions</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-foreground/90">
          <section>
            <h2 className="text-xl font-bold">1. Who you are contracting with</h2>
            <p>These terms are a binding agreement between you and <strong>Addiblock</strong> ("we", "us"), the operator of the Addiblock application and website (the "Service").</p>

          </section>

          <section>
            <h2 className="text-xl font-bold">2. Acceptance</h2>
            <p>By creating an account or continuing to use the Service, you agree to these Terms. If you don't agree, please stop using the Service.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold">3. Eligibility</h2>
            <p>You must be of legal age in your jurisdiction to enter into a binding contract. If you use the Service on behalf of an organisation, you confirm you have authority to bind that organisation.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold">4. What the Service is (and isn't)</h2>
            <p>Addiblock provides self-help tools — daily missions, streaks, journaling, reminders, and an AI companion — to support people working on reducing or stopping addictive behaviours. <strong>It is not a therapist, doctor, or medical service.</strong> Outputs from the AI Coach may be inaccurate and are not a substitute for professional advice. In an emergency, contact local emergency services.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold">5. Accounts</h2>
            <p>You are responsible for maintaining the confidentiality of your credentials and for all activity under your account. You must provide accurate information and keep it up to date.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold">6. Acceptable use</h2>
            <p>You must not misuse the Service. In particular, you must not:</p>
            <ul className="list-disc pl-6">
              <li>Use it for unlawful purposes, fraud, or spam.</li>
              <li>Infringe our or anyone else's intellectual property rights.</li>
              <li>Interfere with security (introduce malware, probe, scan, or scrape).</li>
              <li>Attempt to reverse engineer, resell, or redistribute the Service.</li>
              <li>Use the AI Coach to generate illegal content, deepfakes, harassment, hate speech, or content that circumvents the Service's safety measures.</li>
            </ul>
            <p>You are responsible for your prompts to the AI Coach, how you use its outputs, verifying their accuracy, and for the content you submit (journal entries, messages).</p>
          </section>

          <section>
            <h2 className="text-xl font-bold">7. Intellectual property</h2>
            <p>We own or license all rights in the Service, its software, content, and branding. We grant you a limited, non-exclusive, non-transferable right to use the Service within your selected plan. You retain rights to content you submit; you grant us a limited license to host and process it solely to provide the Service.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold">8. Subscriptions, payments, and refunds</h2>
            <p>Paid plans are billed by Addiblock and processed by our payment provider, PayPal. Applicable taxes are calculated and collected at checkout.</p>
            <p>By subscribing, you authorize recurring charges to your payment method until you cancel. You can cancel at any time from your account page. See our <Link to="/refund" className="underline">Refund Policy</Link> for our position on refunds.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold">9. Service level</h2>
            <p>We work to keep the Service available, but we do not guarantee uninterrupted or error-free performance. To the fullest extent permitted by law, we disclaim all implied warranties, including merchantability and fitness for a particular purpose.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold">10. Suspension and termination</h2>
            <p>We may suspend or terminate your access for material breach, non-payment, security or fraud risk, or repeated or serious violations of these Terms. On termination, your right to use the Service ends; you can request an export of your data within a reasonable window before deletion.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold">11. Liability</h2>
            <p>To the fullest extent permitted by law, our aggregate liability for any claim arising from the Service is capped at the fees you paid us in the 12 months before the event giving rise to the claim. We are not liable for indirect, consequential, or special damages (including loss of profits, data, or goodwill). Nothing in these Terms limits liability for fraud, death, or personal injury caused by our negligence where the law does not allow such limitation.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold">12. Indemnity</h2>
            <p>You agree to indemnify us against third-party claims arising from your content, your unlawful use of the Service, or your breach of these Terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold">13. Changes</h2>
            <p>We may update these Terms from time to time. Continued use of the Service after changes take effect constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold">14. Governing law</h2>
            <p>These Terms are governed by the laws of the jurisdiction in which Addiblock is established, without regard to conflict-of-laws principles. Disputes will be brought in the competent courts of that jurisdiction.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold">15. Assignment & force majeure</h2>
            <p>You may not assign these Terms without our consent; we may assign them in connection with a merger or acquisition. Neither party is liable for delays caused by events beyond its reasonable control.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
