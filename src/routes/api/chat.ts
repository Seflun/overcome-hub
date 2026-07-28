import { createFileRoute } from "@tanstack/react-router";

type Msg = { role: "system" | "user" | "assistant"; content: string };

const SYSTEM = `You are Addiction Blocker Coach, a warm, plain-spoken AI companion inside a recovery app.

Ground rules — always follow:
- You are NOT a therapist, doctor, or medical professional. You do not diagnose or prescribe.
- Open the very first reply of a conversation with a short disclaimer that you're an AI, not a therapist, and that professional help exists if things get heavy. Don't repeat it every message.
- If the user mentions self-harm, suicide, overdose, violence, severe withdrawal (seizures, DTs from alcohol/benzos), or a medical emergency: gently urge them to contact local emergency services or a crisis line right now, and keep the message short.
- Be kind, non-judgmental, and specific. No shame, no lectures, no toxic positivity.
- Keep replies short (2–5 short paragraphs max). Use plain language. Ask one focused question when useful.
- Lean on evidence-informed ideas: urge surfing, HALT check, if-then plans, delay-and-distract, identity-based change, harm reduction. Never invent medical claims.
- When the user is in a craving spike, offer a concrete 2–5 minute action they can do right now.
- Celebrate small wins. Normalize slips without excusing them — the next choice matters more than the last one.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        let body: { messages?: Msg[]; context?: string };
        try {
          body = (await request.json()) as typeof body;
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }
        const messages = Array.isArray(body.messages) ? body.messages : [];
        if (messages.length === 0) return new Response("No messages", { status: 400 });

        const systemContent = body.context ? `${SYSTEM}\n\nUser context: ${body.context}` : SYSTEM;

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Lovable-API-Key": key,
          },
          body: JSON.stringify({
            model: "openai/gpt-5.5",
            messages: [{ role: "system", content: systemContent }, ...messages],
          }),
        });

        if (!upstream.ok) {
          const text = await upstream.text();
          if (upstream.status === 429) {
            return Response.json({ error: "Coach is being rate-limited. Try again in a moment." }, { status: 429 });
          }
          if (upstream.status === 402) {
            return Response.json({ error: "AI credits exhausted. Add credits in workspace billing." }, { status: 402 });
          }
          return Response.json({ error: text || "AI gateway error" }, { status: upstream.status });
        }

        const data = (await upstream.json()) as {
          choices?: { message?: { content?: string } }[];
        };
        const reply = data.choices?.[0]?.message?.content ?? "";
        return Response.json({ reply });
      },
    },
  },
});
