import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Notice — Addiblock" },
      { name: "description", content: "How Addiblock collects, uses, and protects your personal data." },
      { property: "og:title", content: "Privacy Notice — Addiblock" },
      { property: "og:description", content: "How Addiblock collects, uses, and protects your personal data." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-3xl px-5 py-16 md:px-8">
        <Link to="/" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">← Back home</Link>
        <h1 className="mt-6 text-4xl font-black tracking-tight md:text-5xl">Privacy Notice</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

        <div className="prose prose-invert mt-8 max-w-none space-y-6 text-sm leading-relaxed text-foreground/90">
          <section>
            <h2 className="text-xl font-bold">1. Who we are</h2>
            <p>This service ("Addiblock", the "app") is operated by <strong>Addiblock</strong> ("we", "us"). We act as the data controller for personal data processed in connection with the app.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold">2. Data we collect</h2>
            <ul className="list-disc pl-6">
              <li><strong>Account data:</strong> email address, authentication identifiers, and (optionally) name/avatar when you sign in with Google.</li>
              <li><strong>App content:</strong> your selected addiction categories, mission completions, streaks, XP, journal entries, mood check-ins, SOS tool usage, reminders, and Coach chat messages.</li>
              <li><strong>Usage/telemetry:</strong> device type, browser, approximate location derived from IP, and basic diagnostics for security and reliability.</li>
              <li><strong>Support messages:</strong> anything you send us directly.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold">3. Why we use it</h2>
            <ul className="list-disc pl-6">
              <li>To create your account and provide the app (contract).</li>
              <li>To sync your progress across devices (contract).</li>
              <li>To generate AI Coach and journal review responses (contract).</li>
              <li>To keep the service secure and prevent fraud/abuse (legitimate interests).</li>
              <li>To respond to support requests (legitimate interests).</li>
              <li>To comply with legal obligations.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold">4. Who we share it with</h2>
            <ul className="list-disc pl-6">
              <li><strong>Hosting & database providers</strong> that store your account and app content.</li>
              <li><strong>AI model providers</strong> that process your Coach and journal-review prompts to generate responses.</li>
              <li><strong>PayPal</strong>, our payment processor, for checkout, subscription billing, tax calculation, invoicing, and refunds.</li>
              <li><strong>Professional advisers</strong> (legal, accounting) where necessary.</li>
              <li><strong>Authorities</strong> where required by law.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold">5. Retention</h2>
            <p>We keep your account and app content for as long as your account is active. If you delete your account, we delete or anonymise your data within a reasonable period, except where we must retain it to comply with law or resolve disputes.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold">6. Your rights</h2>
            <p>Depending on where you live, you may have the right to access, correct, delete, restrict, or port your personal data, and to object to certain processing or withdraw consent. You can also complain to your local data protection authority. To exercise these rights, contact us at the email below.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold">7. International transfers</h2>
            <p>Your data may be processed outside your country, including in the United States and the European Economic Area. Where required, we rely on appropriate safeguards such as Standard Contractual Clauses or adequacy decisions.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold">8. Security</h2>
            <p>We use appropriate technical and organisational measures — including encryption in transit, access controls, and row-level security — to protect your data. No system is perfectly secure, but we work to reduce risk.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold">9. Cookies</h2>
            <p>We use strictly necessary cookies and local storage for authentication and to remember your preferences. our payment provider's embedded checkout may set its own cookies, described in our payment provider's privacy notice.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold">10. Contact</h2>
            <p>For any privacy question or to exercise your rights, contact Addiblock via the support channel inside the app.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
