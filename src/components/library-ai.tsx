import { useState } from "react";
import { Sparkles, Send, Loader2 } from "lucide-react";

import { LIBRARY } from "../lib/recovery-data";
import { AiMessage } from "../lib/markdown";

function libraryContext() {
  return LIBRARY.map(
    (a) => `# ${a.title} (${a.category}, ${a.minutes} min)\n${a.body.join("\n")}`,
  ).join("\n\n");
}

type Turn = { role: "user" | "assistant"; content: string };

export function LibraryAi() {
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
        body: JSON.stringify({
          messages: next,
          context: `The user is reading the Addiblock library. Answer ONLY using the library material below; if something isn't covered, say so briefly. Library material:\n\n${libraryContext()}`,
        }),
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

  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 text-sm font-bold">
          <Sparkles className="h-4 w-4 text-primary" />
          Ask the library
        </div>
        <button
          onClick={() => ask("Summarize the whole library for me in the most useful way.")}
          disabled={loading}
          className="ml-auto rounded-full bg-aurora px-4 py-2 text-xs font-bold text-primary-foreground shadow-glow disabled:opacity-60"
        >
          Summarize everything
        </button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        The coach reads every article here and answers using only what's written in them.
      </p>

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
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Reading the library…
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
          placeholder="Ask anything about these reads…"
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
