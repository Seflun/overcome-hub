// Server-only machine translation helper for the app UI.
import { languageName } from "./languages";

const MODEL = "openai/gpt-5.5";

export async function translateStrings(
  texts: string[],
  targetLanguage: string,
): Promise<string[]> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("Translation is not configured");

  const target = languageName(targetLanguage);
  const payload = JSON.stringify(texts);

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: `You are a professional UI localizer for a recovery/addiction support app called Addiblock.
Translate each string of the given JSON array into ${target}.
Rules:
- Reply with ONLY a JSON array of strings, same length and same order as the input.
- Keep the brand names "Addiblock" and "Addiblock+" untranslated.
- Preserve numbers, emoji, punctuation, placeholders and markdown markers exactly.
- Keep the tone warm, short and natural for app UI (buttons stay short).
- If a string should stay as-is (a number, a symbol), return it unchanged.`,
        },
        { role: "user", content: payload },
      ],
    }),
  });

  if (!res.ok) throw new Error(`Translation failed (${res.status})`);
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const raw = data.choices?.[0]?.message?.content ?? "";
  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]");
  if (start === -1 || end === -1) throw new Error("Unexpected translation response");
  const parsed = JSON.parse(raw.slice(start, end + 1)) as unknown;
  if (!Array.isArray(parsed)) throw new Error("Unexpected translation response");
  return texts.map((t, i) => (typeof parsed[i] === "string" ? (parsed[i] as string) : t));
}
