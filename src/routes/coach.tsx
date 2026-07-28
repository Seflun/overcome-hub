import { createFileRoute } from "@tanstack/react-router";
import React, { useEffect, useRef, useState } from "react";
import { Send, Sparkles, Bot, User as UserIcon } from "lucide-react";

import { AppShell } from "../components/app-shell";
import { useStore, useCategoryMeta } from "../lib/store";
import { daysBetween } from "../lib/addiction-data";

type Msg = { role: "user" | "assistant"; content: string };

function renderInlineMarkdown(text: string): React.ReactNode {
  // Tokenize: ***bold-italic***, **bold**, *italic*, _italic_, `code`
  const regex = /(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*\n]+\*|_[^_\n]+_|`[^`\n]+`)/g;
  const parts = text.split(regex);
  return parts.map((part, i) => {
    if (!part) return null;
    if (part.startsWith("***") && part.endsWith("***"))
      return <strong key={i}><em>{part.slice(3, -3)}</em></strong>;
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*"))
      return <em key={i}>{part.slice(1, -1)}</em>;
    if (part.startsWith("_") && part.endsWith("_"))
      return <em key={i}>{part.slice(1, -1)}</em>;
    if (part.startsWith("`") && part.endsWith("`"))
      return <code key={i} className="rounded bg-muted px-1 py-0.5 text-[0.85em]">{part.slice(1, -1)}</code>;
    return <span key={i}>{part}</span>;
  });
}

export const Route = createFileRoute("/coach")({
  head: () => ({
    meta: [
      { title: "Coach — Addiction Blocker" },
      { name: "description", content: "Talk to an AI companion trained to help you ride out cravings and rebuild habits. Not a therapist." },
      { property: "og:title", content: "Coach — Addiction Blocker" },
      { property: "og:description", content: "An AI companion for the tough moments in recovery." },
    ],
  }),
  component: Coach,
});

const STARTERS = [
  "I'm having a craving right now.",
  "I slipped yesterday. Help me reset.",
  "How do I get through tonight without drinking?",
  "Why does the urge feel so strong at night?",
];

function Coach() {
  const { state, useCoachCredit } = useStore();
  const active = state.journeys.find((j) => j.id === state.activeId) ?? state.journeys[0];
  const meta = useCategoryMeta(active?.category);
  const days = active ? daysBetween(active.startedAt) : 0;

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const creditsLeft = state.isPremium ? Infinity : state.coachCredits;
  const outOfCredits = !state.isPremium && state.coachCredits <= 0;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    if (!useCoachCredit()) {
      setError("You're out of free Coach credits. Upgrade to Addiction Blocker+ for unlimited chats.");
      return;
    }
    setError(null);
    const next: Msg[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const ctx = active && meta
        ? `The user is working on quitting ${meta.name.toLowerCase()}. They are ${days} day(s) in.`
        : "The user has not picked an addiction yet.";
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, context: ctx }),
      });
      const data = (await res.json().catch(() => ({}))) as { reply?: string; error?: string };
      if (!res.ok) throw new Error(data.error || "Coach couldn't respond right now.");
      setMessages((m) => [...m, { role: "assistant", content: data.reply || "…" }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="flex h-[calc(100dvh-7rem)] flex-col px-5 pt-6">
        <div className="mb-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Coach · AI Coach</div>
              <h1 className="mt-1 text-3xl font-black tracking-tight">
                Talk it <span className="text-aurora">out</span>
              </h1>
            </div>
            <div className="shrink-0 rounded-full border border-border/60 bg-card/70 px-3 py-1 text-[11px] font-semibold">
              {state.isPremium ? (
                <span className="text-primary">Unlimited</span>
              ) : (
                <span className={outOfCredits ? "text-destructive" : "text-muted-foreground"}>
                  {state.coachCredits}/25 credits
                </span>
              )}
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            AI companion, not a therapist. In a crisis, contact local emergency services.
          </p>
        </div>

        <div
          ref={scrollRef}
          className="flex-1 space-y-3 overflow-y-auto rounded-2xl border border-border/60 bg-card/60 p-3"
        >
          {messages.length === 0 && (
            <div className="space-y-3">
              <div className="flex items-start gap-2 rounded-xl bg-primary/10 p-3 text-sm">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p>
                  Hey — I'm an AI, not a therapist. I can help you ride out cravings, plan your next
                  hour, or just think out loud. What's up?
                </p>
              </div>
              <div className="grid gap-2">
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-xl border border-border/60 bg-background/40 px-3 py-2 text-left text-sm hover:border-primary/40"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" && (
                <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                  <Bot className="h-3.5 w-3.5" />
                </div>
              )}
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background/60 text-foreground"
                }`}
              >
                {m.role === "assistant" ? renderInlineMarkdown(m.content) : m.content}
              </div>
              {m.role === "user" && (
                <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <UserIcon className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Bot className="h-3.5 w-3.5 animate-pulse" />
              Coach is thinking…
            </div>
          )}
          {error && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
              {error}
            </div>
          )}
        </div>

        {outOfCredits ? (
          <a
            href="/plus"
            className="mt-3 block rounded-full bg-aurora px-5 py-3 text-center text-sm font-bold text-primary-foreground shadow-glow"
          >
            Out of Coach credits — Unlock unlimited with Plus
          </a>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="mt-3 flex items-center gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tell me what's going on…"
              className="flex-1 rounded-full border border-border/60 bg-card/70 px-4 py-2.5 text-sm outline-none focus:border-primary/60"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        )}
        {!state.isPremium && !outOfCredits && creditsLeft !== Infinity && state.coachCredits <= 5 && (
          <div className="mt-2 text-center text-[11px] text-muted-foreground">
            {state.coachCredits} free Coach credits left ·{" "}
            <a href="/plus" className="text-primary underline">Go unlimited</a>
          </div>
        )}
      </div>
    </AppShell>
  );
}
