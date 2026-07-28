import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Check, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "../components/app-shell";
import { CATEGORIES } from "../lib/addiction-data";
import { useStore, FREE_JOURNEY_LIMIT } from "../lib/store";

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "Explore — Reclaim" },
      { name: "description", content: "Start a new journey and stack XP across every addiction you break." },
      { property: "og:title", content: "Explore — Reclaim" },
      { property: "og:description", content: "Start a new recovery journey. Stack XP as you break each loop." },
    ],
  }),
  component: Explore,
});

function Explore() {
  const { state, startJourney } = useStore();
  const navigate = useNavigate();
  const active = new Set(state.journeys.map((j) => j.category));
  const atLimit = !state.isPremium && state.journeys.length >= FREE_JOURNEY_LIMIT;

  return (
    <AppShell>
      <div className="px-5 pt-8">
        <div className="mb-6">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Explore
          </div>
          <h1 className="mt-1 text-3xl font-black tracking-tight">
            Take on <span className="text-aurora">another</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Every journey you start earns XP toward the version of you underneath the habits.
          </p>
        </div>

        {atLimit && (
          <Link
            to="/plus"
            className="mb-4 flex items-center gap-3 rounded-2xl border border-primary/40 bg-aurora/10 p-4"
          >
            <Sparkles className="h-5 w-5 text-primary" />
            <div className="flex-1 text-sm">
              <div className="font-bold">Unlock unlimited journeys</div>
              <div className="text-xs text-muted-foreground">Free plan supports 1 active journey.</div>
            </div>
          </Link>
        )}

        <div className="grid grid-cols-2 gap-3">
          {CATEGORIES.map((c) => {
            const isActive = active.has(c.id);
            const locked = atLimit && !isActive;
            return (
              <button
                key={c.id}
                onClick={() => {
                  if (locked) { navigate({ to: "/plus" }); return; }
                  const res = startJourney(c.id);
                  if (res.blocked === "premium") { navigate({ to: "/plus" }); return; }
                  toast.success(isActive ? `Switched to ${c.name}` : `New journey: quitting ${c.name}`);
                  navigate({ to: "/" });
                }}
                className={`group relative overflow-hidden rounded-2xl border p-4 text-left shadow-soft transition ${
                  locked ? "border-border/40 bg-card/40 opacity-60" : "border-border/60 bg-card/70 hover:border-primary/40"
                }`}
              >
                <div
                  className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-30 blur-2xl transition group-hover:opacity-50"
                  style={{ backgroundColor: c.color }}
                />
                <div className="flex items-start justify-between">
                  <div className="text-3xl">{c.emoji}</div>
                  {isActive && (
                    <div className="rounded-full bg-primary/20 p-1 text-primary">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </div>
                  )}
                  {locked && <Sparkles className="h-3.5 w-3.5 text-primary" />}
                </div>
                <div className="mt-3 font-bold">{c.name}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{c.tagline}</div>
              </button>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}

