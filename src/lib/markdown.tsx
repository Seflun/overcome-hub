import React from "react";

export function renderInlineMarkdown(text: string): React.ReactNode {
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

/**
 * Splits an AI message into a main body and a trailing "side note" disclaimer.
 * The model is instructed to end messages with a line starting with "— " which
 * we render as small muted italic text beneath the main reply.
 */
export function splitSideNote(text: string): { body: string; note: string | null } {
  const trimmed = text.trimEnd();
  // Match final line beginning with an em/en dash marker
  const match = trimmed.match(/(?:\n|^)\s*([—–-]{1,2}\s+.+)$/);
  if (!match) return { body: trimmed, note: null };
  const note = match[1].replace(/^[—–-]{1,2}\s+/, "").trim();
  const body = trimmed.slice(0, match.index).trimEnd();
  return { body, note };
}

export function AiMessage({ text, className }: { text: string; className?: string }) {
  const { body, note } = splitSideNote(text);
  return (
    <div className={className}>
      {body && <div className="whitespace-pre-wrap">{renderInlineMarkdown(body)}</div>}
      {note && (
        <div className="mt-2 border-t border-border/40 pt-1.5 text-[11px] italic leading-snug text-muted-foreground/80">
          {renderInlineMarkdown(note)}
        </div>
      )}
    </div>
  );
}
