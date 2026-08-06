import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles, Loader2, Lock, Send } from "lucide-react";

import { useStore } from "../lib/store";
import { AiMessage } from "../lib/markdown";

type Turn = { role: "user" | "assistant"; content: string };

/**
 * Reusable Addiblock+ AI helper card.
 * Free users see a locked teaser; Plus users get a summary button,
 * suggested questions and a free-text follow-up — all answered from
 * the context string the host page builds.
 */
export function AiInsightCard({
  title,
  blurb,
  summarizeLabel = "Summarize for me",
  summarizePrompt,
  suggestions = [],
  buildContext,
  placeholder = "Ask a follow-up…",
  lockedBlurb,
}: {
  title: string;
  blurb: string;
  summarizeLabel?: string;
  summarizePrompt: string;
  suggestions?: string[];
  buildContext: () => string;
  placeholder?: string;
  lockedBlurb?: string;
}) {
  const { state } = useStore();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask(question: string) {
    if (!question.trim() || loading) return;
    setError(null);
    setLoading(true);
    const next: Turn[] = [...turns, { role: "user", content: question }];
    setTurns(next);
    setInput("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, context: buildContext() }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setTurns([...next, { role: "assistant", content: data.reply ?? "" }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setTurns(turns);
    } finally {
      setLoading(false);
    }
  }

  if (!state.isPremium) {
    return (
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
        <div className="flex items-center gap-2 text-sm font-bold">
          <Sparkles className="h-4 w-4 text-primary" />
          {title}
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-aurora px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary-foreground">
            <Sparkles className="h-3 w-3" /> Plus
          </span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{lockedBlurb ?? blurb}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">No payment needed — Plus is a free demo toggle.</p>
        <Link
          to="/plus"
          className="mt-3 inline-flex items-center gap-1 rounded-full bg-aurora px-4 py-2 text-xs font-bold text-primary-foreground shadow-glow"
        >
          <Lock className="h-3.5 w-3.5" /> Turn on Addiblock+ — free demo
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 text-sm font-bold">
          <Sparkles className="h-4 w-4 text-primary" />
          {title}
        </div>
        <button
          onClick={() => ask(summarizePrompt)}
          disabled={loading}
          className="ml-auto rounded-full bg-aurora px-4 py-2 text-xs font-bold text-primary-foreground shadow-glow disabled:opacity-60"
        >
          {summarizeLabel}
        </button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{blurb}</p>

      {suggestions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => ask(s)}
              disabled={loading}
              className="rounded-full border border-border/60 bg-card/70 px-3 py-1.5 text-[11px] font-semibold text-muted-foreground transition hover:border-primary/40 hover:text-foreground disabled:opacity-60"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {turns.length > 0 && (
        <div className="mt-4 space-y-3">
          {turns.map((t, i) =>
            t.role === "user" ? (
              <div key={i} className="ml-auto max-w-[85%] rounded-2xl bg-card/80 px-3 py-2 text-sm">
                {t.content}
              </div>
            ) : (
              <AiMessage
                key={i}
                text={t.content}
                className="max-w-[95%] rounded-2xl border border-border/60 bg-card/70 px-3 py-2 text-sm leading-relaxed"
              />
            ),
          )}
        </div>
      )}

      {loading && (
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
        </div>
      )}
      {error && <div className="mt-3 text-xs text-destructive">{error}</div>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void ask(input);
        }}
        className="mt-4 flex items-center gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 rounded-full border border-border/60 bg-card/70 px-4 py-2.5 text-sm outline-none focus:border-primary/50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          aria-label="Send"
          className="rounded-full bg-primary p-2.5 text-primary-foreground disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
