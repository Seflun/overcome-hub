import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, BookOpen, Clock, X } from "lucide-react";

import { AppShell } from "../components/app-shell";
import { LIBRARY, type Article } from "../lib/recovery-data";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "Library — Addiblock" },
      { name: "description", content: "Short, practical reads on cravings, triggers, relapse and rebuilding habits." },
      { property: "og:title", content: "Library — Addiblock" },
      { property: "og:description", content: "Understand what's happening in your brain — in 3-minute reads." },
    ],
  }),
  component: Library,
});

function Library() {
  const [open, setOpen] = useState<Article | null>(null);
  const categories = Array.from(new Set(LIBRARY.map((a) => a.category)));

  return (
    <AppShell>
      <div className="px-5 pt-6 pb-6">
        <Link to="/today" className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Link>

        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Library</div>
        <h1 className="mt-1 text-3xl font-black tracking-tight">
          Understand the <span className="text-aurora">machinery</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Knowing why an urge behaves the way it does makes it far easier to ride out.
        </p>

        <div className="mt-6 space-y-6">
          {categories.map((cat) => (
            <div key={cat}>
              <h2 className="mb-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">{cat}</h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {LIBRARY.filter((a) => a.category === cat).map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setOpen(a)}
                    className="rounded-2xl border border-border/60 bg-card/70 p-4 text-left transition hover:border-primary/40"
                  >
                    <div className="flex items-start gap-3">
                      <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <div>
                        <div className="font-bold leading-snug">{a.title}</div>
                        <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Clock className="h-3 w-3" /> {a.minutes} min read
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 p-0 backdrop-blur-sm sm:items-center sm:p-6">
          <div className="max-h-[85dvh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-border/60 bg-card p-6 shadow-soft sm:rounded-3xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {open.category} · {open.minutes} min
                </div>
                <h2 className="mt-1 text-2xl font-black tracking-tight">{open.title}</h2>
              </div>
              <button onClick={() => setOpen(null)} className="rounded-full p-1 text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 space-y-3 text-sm leading-relaxed">
              {open.body.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <button
              onClick={() => setOpen(null)}
              className="mt-6 w-full rounded-full bg-aurora px-5 py-3 text-sm font-bold text-primary-foreground shadow-glow"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
