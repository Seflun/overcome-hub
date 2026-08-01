export const TRIGGERS = [
  "Stress",
  "Loneliness",
  "Boredom",
  "Anxiety",
  "Anger",
  "Depression",
  "Social pressure",
  "Fatigue",
  "Temptation",
  "Other",
] as const;

export type TriggerName = (typeof TRIGGERS)[number];

export const MOOD_LABELS: Record<number, string> = {
  1: "Awful",
  2: "Low",
  3: "Okay",
  4: "Good",
  5: "Great",
};

export const MOOD_EMOJI: Record<number, string> = {
  1: "😩",
  2: "😕",
  3: "😐",
  4: "🙂",
  5: "😄",
};

/* ---------------- Recovery timeline ---------------- */

export interface TimelineStage {
  days: number;
  label: string;
  message: string;
  changes: string[];
}

export const TIMELINE: TimelineStage[] = [
  {
    days: 1,
    label: "1 day",
    message: "The hardest hour is already behind you.",
    changes: ["Withdrawal peaks and begins to ease", "Your body starts clearing residuals", "Cravings come in waves — they pass"],
  },
  {
    days: 3,
    label: "3 days",
    message: "Three days is a real threshold. Most people never get here.",
    changes: ["Sleep starts to normalise", "Appetite and taste shift", "Mental fog begins lifting"],
  },
  {
    days: 7,
    label: "1 week",
    message: "One full week. Your brain is already adapting.",
    changes: ["Energy levels stabilise", "Fewer spontaneous urges", "Mood swings become less sharp"],
  },
  {
    days: 14,
    label: "2 weeks",
    message: "Two weeks in — the habit loop is losing its grip.",
    changes: ["Cravings space out further apart", "Focus and memory improve", "Confidence starts compounding"],
  },
  {
    days: 30,
    label: "1 month",
    message: "A month clean. This is identity-level change.",
    changes: ["New routines feel more automatic", "Noticeable physical improvements", "Triggers lose their old power"],
  },
  {
    days: 90,
    label: "3 months",
    message: "Ninety days. Neural rewiring is well underway.",
    changes: ["Baseline mood is higher", "Motivation returns naturally", "Old cues stop feeling urgent"],
  },
  {
    days: 180,
    label: "6 months",
    message: "Half a year. Freedom is becoming your default.",
    changes: ["Relapse risk drops significantly", "Self-trust is rebuilt", "You plan around goals, not urges"],
  },
  {
    days: 365,
    label: "1 year",
    message: "One year. You are genuinely not the same person.",
    changes: ["The habit is no longer part of your identity", "Long-term health gains compound", "You can help others now"],
  },
];

export function nextStage(days: number) {
  return TIMELINE.find((s) => s.days > days) ?? null;
}

export function currentStage(days: number) {
  return [...TIMELINE].reverse().find((s) => days >= s.days) ?? null;
}

/* ---------------- Daily missions (general) ---------------- */

export interface GeneralMission {
  id: string;
  title: string;
  rp: number;
}

export const GENERAL_MISSIONS: GeneralMission[] = [
  { id: "gm-water", title: "Drink water", rp: 10 },
  { id: "gm-exercise", title: "Exercise 20 minutes", rp: 30 },
  { id: "gm-read", title: "Read for 15 minutes", rp: 20 },
  { id: "gm-walk", title: "Take a walk", rp: 20 },
  { id: "gm-meditate", title: "Meditate", rp: 25 },
  { id: "gm-friend", title: "Call a friend", rp: 20 },
  { id: "gm-offline", title: "Stay offline for one hour", rp: 25 },
  { id: "gm-sleep", title: "Go to sleep before 11 PM", rp: 25 },
  { id: "gm-avoid", title: "Avoid known triggers", rp: 25 },
  { id: "gm-journal", title: "Write in your journal", rp: 20 },
];

/* ---------------- Achievements ---------------- */

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  emoji: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first-day", name: "First Day", description: "Complete your first 24 hours clean.", emoji: "🌅" },
  { id: "week-clean", name: "One Week Clean", description: "Reach a 7-day streak.", emoji: "🗓️" },
  { id: "month-clean", name: "One Month Clean", description: "Reach a 30-day streak.", emoji: "🌙" },
  { id: "three-months", name: "Three Months Clean", description: "Reach a 90-day streak.", emoji: "🍀" },
  { id: "year-clean", name: "One Year Clean", description: "Reach a 365-day streak.", emoji: "👑" },
  { id: "cravings-100", name: "100 Cravings Resisted", description: "Log 100 cravings you rode out.", emoji: "🛡️" },
  { id: "first-journal", name: "First Journal Entry", description: "Write your first journal entry.", emoji: "📓" },
  { id: "morning-routine", name: "Morning Routine", description: "Complete a check-in before noon.", emoji: "☀️" },
  { id: "night-routine", name: "Night Routine", description: "Journal after 9 PM.", emoji: "🌜" },
  { id: "warrior", name: "Recovery Warrior", description: "Earn 1,000 Recovery Points.", emoji: "⚔️" },
  { id: "consistency", name: "Consistency Champion", description: "Check in 7 days in a row.", emoji: "🔥" },
];

/* ---------------- Quotes ---------------- */

export const QUOTES = [
  "You don't have to quit forever today. Just don't start again right now.",
  "The urge is a wave. You are the surfer, not the water.",
  "Discipline is choosing what you want most over what you want now.",
  "Every craving you survive rewires the pattern a little more.",
  "Relapse isn't the end of recovery. Quitting recovery is.",
  "You've done hard things before. This is one of them.",
  "Freedom is on the other side of discomfort you can survive.",
  "Progress isn't linear. Direction matters more than speed.",
  "Ten minutes of delay beats a day of regret.",
  "You are not broken. You are rebuilding.",
];

export function quoteForDay(dateKey: string) {
  const seed = [...dateKey].reduce((a, c) => a + c.charCodeAt(0), 0);
  return QUOTES[seed % QUOTES.length];
}

/* ---------------- Educational library ---------------- */

export interface Article {
  id: string;
  title: string;
  minutes: number;
  category: string;
  body: string[];
}

export const LIBRARY: Article[] = [
  {
    id: "dopamine",
    title: "Why cravings feel like emergencies",
    minutes: 4,
    category: "Neuroscience",
    body: [
      "Addiction hijacks the brain's reward prediction system. Your brain learns that a specific cue reliably predicts a big dopamine hit, so it starts screaming for it the moment the cue appears.",
      "That scream feels like an emergency, but it's a prediction error — not a real need. Nothing bad happens if you don't act on it. The signal peaks and fades, usually within 10–20 minutes.",
      "Every time you feel the urge and don't act, you weaken the prediction. This is the actual mechanism of recovery: repeated, boring non-action.",
    ],
  },
  {
    id: "urge-surfing",
    title: "Urge surfing, step by step",
    minutes: 3,
    category: "Skills",
    body: [
      "1. Notice the urge and name it out loud: 'this is a craving'.",
      "2. Find where you feel it physically — chest, jaw, stomach, hands.",
      "3. Breathe into that spot for 60 seconds without trying to make it stop.",
      "4. Rate it 1–10, wait two minutes, rate it again. Watch it move.",
      "5. Do something with your hands until it drops below a 4.",
      "The goal is never to fight the urge. It's to be present while it passes on its own.",
    ],
  },
  {
    id: "triggers",
    title: "Mapping your triggers",
    minutes: 4,
    category: "Skills",
    body: [
      "Most relapses aren't random. They cluster around a small set of predictable conditions: a time of day, a place, a person, an emotion, or a level of tiredness.",
      "For one week, log every craving with its trigger. Don't try to change anything yet — just collect data.",
      "Then attack the top two triggers structurally, not with willpower: change the route home, remove the app, go to bed earlier, eat before the risky hour.",
      "Willpower is a bad plan. Environment design is a good one.",
    ],
  },
  {
    id: "relapse",
    title: "How to handle a relapse",
    minutes: 4,
    category: "Recovery",
    body: [
      "A relapse is information, not a verdict. The dangerous part is rarely the slip itself — it's the shame spiral that follows and turns one slip into a week.",
      "Log it within an hour. Write the trigger, the mood, and what happened right before. Then restart your streak the same day.",
      "Ask one question: what would have made this 10% less likely? Fix that one thing.",
      "Your historical stats stay intact. Your longest streak still happened. You still know how to do this.",
    ],
  },
  {
    id: "sleep",
    title: "Sleep is a recovery tool",
    minutes: 3,
    category: "Health",
    body: [
      "Sleep deprivation lowers impulse control in the prefrontal cortex — the exact system you rely on to say no.",
      "Most people relapse in the late evening, when they're tired and alone. Moving bedtime earlier removes the window entirely.",
      "Aim for a consistent wake time first; the sleep time follows. Keep screens out of the bedroom, especially if screens are part of what you're quitting.",
    ],
  },
  {
    id: "identity",
    title: "From 'quitting' to 'not my thing'",
    minutes: 3,
    category: "Mindset",
    body: [
      "'I'm trying to quit' keeps the habit central to your identity. 'I don't do that' removes it.",
      "Language shapes decisions. In a moment of pressure, 'I don't drink' ends the conversation. 'I'm cutting back' invites negotiation.",
      "Pick your sentence now, before you need it. Practise it out loud once. You'll use it under stress, and rehearsed lines are the ones that show up.",
    ],
  },
  {
    id: "replacement",
    title: "Replace the ritual, not just the substance",
    minutes: 3,
    category: "Skills",
    body: [
      "Habits are rituals with a payload. If you remove the payload but keep the empty ritual slot, the brain will refill it.",
      "Map the ritual: what happens in the five minutes before? That's the part you replace — the walk outside, the drink in your hand, the transition after work.",
      "Choose replacements that are physically similar and immediately available. Sparkling water in the same glass beats 'just don't drink'.",
    ],
  },
  {
    id: "not-medical",
    title: "When to get professional help",
    minutes: 2,
    category: "Safety",
    body: [
      "This app is a companion, not medical care. Some withdrawals — alcohol and certain drugs in particular — can be physically dangerous to stop abruptly without supervision.",
      "If you experience shaking, confusion, seizures, chest pain, or thoughts of harming yourself, contact a doctor or your local emergency service immediately.",
      "Getting professional support isn't a failure of self-discipline. It's the same as using a physio for a torn muscle.",
    ],
  },
];

/* ---------------- Recovery points / levels ---------------- */

export function levelFromRp(rp: number) {
  const level = Math.floor(rp / 250) + 1;
  const into = rp % 250;
  return { level, into, needed: 250, progress: into / 250 };
}

export const RP = {
  checkin: 25,
  mission: 20,
  cravingResisted: 30,
  journal: 20,
  milestone: 100,
};
