import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, HeartHandshake, Sparkles } from "lucide-react";

import { AppShell } from "../components/app-shell";

const DONATION_URL = "https://whydonate.com/fundraising/support-addiblocks-developement";

export const Route = createFileRoute("/fun-fact")({
  head: () => ({
    meta: [
      { title: "Fun fact — Addiblock" },
      { name: "description", content: "A note from the solo developer behind Addiblock, and an optional way to support future updates." },
      { property: "og:title", content: "Fun fact — Addiblock" },
      { property: "og:description", content: "Addiblock is built by one developer on a tiny budget. Support is optional and appreciated." },
    ],
  }),
  component: FunFact,
});

function FunFact() {
  return (
    <AppShell>
      <div className="px-5 pb-10 pt-6">
        <Link to="/today" className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Link>

        <div className="rounded-3xl border border-primary/40 bg-card-grad p-6 shadow-soft">
          <div className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
            <Sparkles className="h-3 w-3" /> Fun fact
          </div>
          <h1 className="mt-3 text-2xl font-black leading-tight tracking-tight">
            A note from the developer
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Fun fact, I am a solo developer who is stuck and can barely continue since there's not
            enough of a budget. I can make occasional updates but not a lot due to the lack of the
            required budget. While this is completely optional, you can be kind to donate to me to
            help support this site and to make more updates in the future. I would really appreciate
            if you do — here's the donation link:
          </p>

          <a
            href={DONATION_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-aurora px-5 py-3 text-sm font-bold text-primary-foreground shadow-glow"
          >
            <HeartHandshake className="h-4 w-4" /> Support Addiblock's development
          </a>

          <p className="mt-3 break-all text-[11px] text-muted-foreground">{DONATION_URL}</p>
        </div>

        <div className="mt-5 rounded-2xl border border-border/60 bg-card/60 p-4 text-xs text-muted-foreground">
          To be clear: nothing in Addiblock is paywalled right now. Addiblock+ is free during the
          demo — just flip the toggle on the{" "}
          <Link to="/plus" className="font-semibold text-primary underline">Plus Demo</Link> page.
          Donations only exist to keep the updates coming.
        </div>
      </div>
    </AppShell>
  );
}
