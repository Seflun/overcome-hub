export type CategoryId =
  | "nicotine"
  | "alcohol"
  | "gambling"
  | "sugar"
  | "cannabis"
  | "porn"
  | "social"
  | "gaming";


export interface Category {
  id: CategoryId;
  name: string;
  emoji: string;
  tagline: string;
  color: string; // oklch swatch for tinting cards
  benefit: string;
}

export const CATEGORIES: Category[] = [
  { id: "nicotine", name: "Nicotine",     emoji: "🚭", tagline: "Reclaim your lungs and focus", color: "oklch(0.75 0.15 210)", benefit: "Lung capacity improves in 72 hours" },
  { id: "alcohol",  name: "Alcohol",      emoji: "🍺", tagline: "Wake up clear again",          color: "oklch(0.78 0.17 80)",  benefit: "Sleep quality up 30% in a week" },
  { id: "gambling", name: "Gambling",     emoji: "🎰", tagline: "Win back your peace",          color: "oklch(0.7 0.2 340)",   benefit: "Anxiety drops sharply after 21 days" },
  { id: "sugar",    name: "Sugar",        emoji: "🍬", tagline: "Steady energy, clearer skin",  color: "oklch(0.78 0.14 20)",  benefit: "Cravings fade in ~10 days" },
  { id: "cannabis", name: "Drugs",        emoji: "💊", tagline: "Sharpen your mind",            color: "oklch(0.78 0.16 155)", benefit: "Dreams & memory return in ~2 weeks" },
  { id: "porn",     name: "Porn",         emoji: "🧠", tagline: "Rewire, refocus, reconnect",   color: "oklch(0.68 0.18 285)", benefit: "Motivation & confidence climb" },
  { id: "social",   name: "Social Media", emoji: "📱", tagline: "Reclaim your attention",       color: "oklch(0.75 0.15 250)", benefit: "Focus & mood improve in days" },
  { id: "gaming",   name: "Video Games",  emoji: "🎮", tagline: "Reclaim your time and drive",  color: "oklch(0.72 0.16 300)", benefit: "Sleep, focus & motivation rebound in ~2 weeks" },
];

export interface Task {
  id: string;
  title: string;
  description: string;
  minutes: number;
  xp: number;
  category?: CategoryId; // undefined = universal
}

const UNIVERSAL: Task[] = [
  { id: "u-breathe",  title: "Box breathing", description: "4s in, 4s hold, 4s out, 4s hold — 5 rounds.", minutes: 4, xp: 20 },
  { id: "u-walk",     title: "10 minute walk", description: "Outside if you can. No phone.", minutes: 10, xp: 25 },
  { id: "u-water",    title: "Drink a full glass of water", description: "Cravings often mimic thirst.", minutes: 1, xp: 10 },
  { id: "u-journal",  title: "Journal one trigger", description: "What happened, what you felt, what you did instead.", minutes: 5, xp: 25 },
  { id: "u-urge",     title: "Urge surf for 5 min", description: "Watch the craving rise and fall without acting.", minutes: 5, xp: 30 },
  { id: "u-reach",    title: "Message someone you trust", description: "Even a small check-in counts.", minutes: 3, xp: 20 },
  { id: "u-gratitude",title: "Write 3 gratitudes", description: "Rewire attention toward what's working.", minutes: 3, xp: 15 },
  { id: "u-stretch",  title: "5 minute stretch", description: "Release tension in shoulders, jaw, hips.", minutes: 5, xp: 15 },
  { id: "u-cold",     title: "30s cold water on face/wrists", description: "Resets your nervous system fast.", minutes: 1, xp: 15 },
  { id: "u-plan",     title: "Plan tomorrow's first 20 min", description: "Momentum kills relapse.", minutes: 5, xp: 20 },
];

const BY_CATEGORY: Record<CategoryId, Task[]> = {
  nicotine: [
    { id: "n-1", category: "nicotine", title: "Move your vape/pack out of reach", description: "Give it to a friend or lock it away.", minutes: 2, xp: 30 },
    { id: "n-2", category: "nicotine", title: "Chew gum or mints instead", description: "Sub the oral fixation, not the nicotine.", minutes: 1, xp: 15 },
    { id: "n-3", category: "nicotine", title: "Track puff/cig count for one hour", description: "Awareness alone reduces use.", minutes: 60, xp: 30 },
    { id: "n-4", category: "nicotine", title: "Delay first hit by 20 min", description: "Push the window a little each day.", minutes: 20, xp: 30 },
    { id: "n-5", category: "nicotine", title: "Brush teeth right after cravings", description: "Clean mouth kills the urge.", minutes: 3, xp: 15 },
    { id: "n-6", category: "nicotine", title: "Take a 5 min walk instead of a smoke break", description: "Same ritual, better outcome.", minutes: 5, xp: 25 },
  ],
  alcohol: [
    { id: "a-1", category: "alcohol", title: "Pour a mocktail with soda + lime", description: "Ritual > substance.", minutes: 3, xp: 20 },
    { id: "a-2", category: "alcohol", title: "Remove alcohol from eye-level", description: "Out of sight, out of mind.", minutes: 3, xp: 20 },
    { id: "a-3", category: "alcohol", title: "Text a sober buddy", description: "Accountability is a superpower.", minutes: 2, xp: 20 },
  ],
  gambling: [
    { id: "g-1", category: "gambling", title: "Delete one gambling app", description: "Friction saves money.", minutes: 2, xp: 40 },
    { id: "g-2", category: "gambling", title: "Set a bank block on gambling merchants", description: "Most banks support this in-app.", minutes: 5, xp: 40 },
    { id: "g-3", category: "gambling", title: "Log today's urges & wins avoided", description: "See the money you didn't lose.", minutes: 4, xp: 25 },
  ],
  sugar: [
    { id: "su-1", category: "sugar", title: "Swap one sugary drink for water", description: "Just one today.", minutes: 1, xp: 15 },
    { id: "su-2", category: "sugar", title: "Eat protein at breakfast", description: "Kills afternoon cravings.", minutes: 10, xp: 20 },
    { id: "su-3", category: "sugar", title: "Read the label on 3 snacks", description: "Awareness shifts choices.", minutes: 5, xp: 15 },
  ],
  cannabis: [
    { id: "c-1", category: "cannabis", title: "Move stash out of the house", description: "24h gap is a huge win.", minutes: 5, xp: 40 },
    { id: "c-2", category: "cannabis", title: "Replace the evening ritual", description: "Tea + music + stretch.", minutes: 15, xp: 25 },
    { id: "c-3", category: "cannabis", title: "10 min cardio", description: "Endorphins do the heavy lifting.", minutes: 10, xp: 25 },
  ],
  porn: [
    { id: "p-1", category: "porn", title: "Install a content blocker", description: "Cover phone + laptop.", minutes: 5, xp: 40 },
    { id: "p-2", category: "porn", title: "Get out of bed when the urge hits", description: "Change room, change state.", minutes: 3, xp: 25 },
    { id: "p-3", category: "porn", title: "10 pushups instead", description: "Redirect the arousal to action.", minutes: 2, xp: 20 },
  ],
  social: [
    { id: "so-1", category: "social", title: "Move apps off your home screen", description: "Add friction. It works.", minutes: 3, xp: 20 },
    { id: "so-2", category: "social", title: "Set a 20 min daily app timer", description: "Enforce your intention.", minutes: 3, xp: 25 },
    { id: "so-3", category: "social", title: "Grayscale your phone for 2 hours", description: "Kills the dopamine loop.", minutes: 2, xp: 25 },
  ],
  gaming: [
    { id: "gm-1", category: "gaming", title: "Uninstall your most-played game", description: "Reinstall later if you truly miss it — most people don't.", minutes: 3, xp: 40 },
    { id: "gm-2", category: "gaming", title: "Move console/PC out of the bedroom", description: "Physical distance breaks the auto-loop.", minutes: 10, xp: 30 },
    { id: "gm-3", category: "gaming", title: "Set a 1-hour play cap today", description: "Use a timer. Stop when it rings.", minutes: 3, xp: 25 },
    { id: "gm-4", category: "gaming", title: "Replace one gaming hour with a hobby", description: "Read, draw, walk, cook, lift — pick one.", minutes: 60, xp: 30 },
    { id: "gm-5", category: "gaming", title: "Log out of every gaming account", description: "Even 30 seconds of friction is enough.", minutes: 3, xp: 20 },
  ],
};

// Deterministic pseudo-random pick per day so tasks stay stable within a date.
function seededPick<T>(arr: T[], seed: number, count: number): T[] {
  const out: T[] = [];
  const pool = [...arr];
  let s = seed;
  while (out.length < count && pool.length) {
    s = (s * 9301 + 49297) % 233280;
    const idx = Math.floor((s / 233280) * pool.length);
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}

export function tasksForDay(category: CategoryId, dateKey: string): Task[] {
  const seed = [...dateKey].reduce((a, c) => a + c.charCodeAt(0), 0) + category.length;
  const specific = seededPick(BY_CATEGORY[category], seed, 2);
  const universal = seededPick(UNIVERSAL, seed + 7, 3);
  return [...specific, ...universal];
}

export const MILESTONES = [
  { days: 1,   label: "First 24 hours", note: "Nicotine/stimulant peak withdrawal fades." },
  { days: 3,   label: "72 hours clean", note: "Body starts flushing residuals." },
  { days: 7,   label: "One week strong", note: "Sleep and taste sharpen." },
  { days: 14,  label: "Two weeks", note: "Cravings begin to space out." },
  { days: 30,  label: "One month", note: "New identity forming. Keep going." },
  { days: 60,  label: "Two months", note: "The old habit loop is weakening." },
  { days: 90,  label: "90 days", note: "Neural rewiring is well underway." },
  { days: 180, label: "Six months", note: "Freedom is your new default." },
  { days: 365, label: "One year", note: "You are not the same person." },
];

export function levelFromXp(xp: number) {
  const level = Math.floor(xp / 200) + 1;
  const into = xp % 200;
  return { level, into, needed: 200, progress: into / 200 };
}

export function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export function daysBetween(iso: string, now = new Date()) {
  const start = new Date(iso);
  return Math.max(0, Math.floor((now.getTime() - start.getTime()) / 86400000));
}
