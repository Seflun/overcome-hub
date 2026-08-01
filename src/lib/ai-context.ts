import { CATEGORIES, daysBetween } from "./addiction-data";
import type { AppState } from "./store";

/** Builds a compact, privacy-light snapshot of the user's recovery data for the AI. */
export function recoveryContext(state: AppState, extra?: string): string {
  const journeys = state.journeys
    .map((j) => {
      const meta = CATEGORIES.find((c) => c.id === j.category);
      return `- ${meta?.name ?? j.category}: ${daysBetween(j.startedAt)} days clean, ${j.xp} RP`;
    })
    .join("\n");

  const checkins = state.checkins
    .slice(-10)
    .map(
      (c) =>
        `- ${c.dateKey}: mood ${c.mood}/5, stress ${c.stress}/10, energy ${c.energy}/10, sleep ${c.sleep}h, cravings ${c.cravings ? "yes" : "no"}`,
    )
    .join("\n");

  const cravings = state.cravings
    .slice(-10)
    .map((c) => `- ${c.at.slice(0, 10)}: "${c.trigger}", intensity ${c.intensity}/10, surfed ${c.minutes} min`)
    .join("\n");

  const relapses = state.relapses
    .slice(-5)
    .map((r) => `- ${r.at.slice(0, 10)}: trigger "${r.trigger}", intensity ${r.intensity}/10`)
    .join("\n");

  const journal = state.journal
    .slice(-8)
    .map(
      (e) =>
        `- ${e.createdAt.slice(0, 10)}: mood ${e.mood}/5${e.trigger ? `, trigger "${e.trigger}"` : ""}${e.note ? `, note: ${e.note.slice(0, 300)}` : ""}`,
    )
    .join("\n");

  return [
    "Here is the user's Addiblock recovery data. Base your answer on it, be specific, and keep it short and practical.",
    journeys && `Journeys:\n${journeys}`,
    checkins && `Recent check-ins:\n${checkins}`,
    cravings && `Recent cravings logged:\n${cravings}`,
    relapses && `Recent relapses:\n${relapses}`,
    journal && `Recent journal entries:\n${journal}`,
    state.reasons.length > 0 && `Their reasons for quitting: ${state.reasons.join("; ")}`,
    extra,
  ]
    .filter(Boolean)
    .join("\n\n");
}
