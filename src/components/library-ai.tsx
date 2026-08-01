import { LIBRARY } from "../lib/recovery-data";
import { AiInsightCard } from "./ai-insight-card";

function libraryContext() {
  return LIBRARY.map(
    (a) => `# ${a.title} (${a.category}, ${a.minutes} min)\n${a.body.join("\n")}`,
  ).join("\n\n");
}

export function LibraryAi() {
  return (
    <AiInsightCard
      title="Ask the library"
      blurb="The coach reads every article here and answers using only what's written in them."
      lockedBlurb="Addiblock+ summarizes the whole library for you and answers your questions using only what these articles say."
      summarizeLabel="Summarize everything"
      summarizePrompt="Summarize the whole library for me in the most useful way."
      suggestions={[
        "What should I read first?",
        "Explain cravings in 5 bullet points",
        "How do I handle a trigger tonight?",
      ]}
      placeholder="Ask anything about these reads…"
      buildContext={() =>
        `The user is reading the Addiblock library. Answer ONLY using the library material below; if something isn't covered, say so briefly. Library material:\n\n${libraryContext()}`
      }
    />
  );
}
