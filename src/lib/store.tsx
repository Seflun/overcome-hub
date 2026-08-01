import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CATEGORIES, daysBetween, type CategoryId, todayKey } from "./addiction-data";
import { supabase } from "@/integrations/supabase/client";

export interface Journey {
  id: string;
  category: CategoryId;
  startedAt: string;
  xp: number;
  completions: Record<string, string[]>;
  lastRelapse?: string;
  costPerDay?: number;
}

export interface JournalEntry {
  id: string;
  createdAt: string;
  journeyId?: string;
  mood: 1 | 2 | 3 | 4 | 5;
  trigger?: string;
  note?: string;
  aiReview?: string;
  aiReviewStatus?: "pending" | "done" | "error";
}

export interface Reminder {
  id: string;
  time: string;
  label: string;
  enabled: boolean;
}

export interface SosSession {
  id: string;
  createdAt: string;
  tool: string;
  survived: boolean;
}

export interface RelapseLog {
  id: string;
  journeyId: string;
  at: string;
  mood: number;
  trigger: string;
  intensity: number;
  note?: string;
}

export interface CravingLog {
  id: string;
  journeyId?: string;
  at: string;
  intensity: number;
  minutes: number;
  trigger: string;
  note?: string;
}

export interface CheckIn {
  id: string;
  dateKey: string;
  at: string;
  mood: number;
  cravings: boolean;
  stress: number;
  energy: number;
  sleep: number;
}

export interface Profile {
  username: string;
  avatar: string;
  bio: string;
  joinedAt: string;
  dob?: string;
  language?: string;
}


export interface AppState {
  journeys: Journey[];
  activeId: string | null;
  isPremium: boolean;
  journal: JournalEntry[];
  reminders: Reminder[];
  sos: SosSession[];
  coachCredits: number;
  coachStreak: number;
  lastCoachRefill: string | null;
  aiReviewEnabled: boolean;
  profile: Profile;
  relapses: RelapseLog[];
  cravings: CravingLog[];
  checkins: CheckIn[];
  generalMissions: Record<string, string[]>;
  rpBonus: number;
  unlocked: string[];
  theme: "dark" | "light";
  reasons: string[];
}

const KEY = "reclaim.state.v2";

export const FREE_COACH_CREDITS = 25;
export const COACH_STREAK_SCHEDULE = [5, 8, 13, 20, 30, 45, 60, 75];
export const COACH_STREAK_MAX = 75;

const empty: AppState = {
  journeys: [],
  activeId: null,
  isPremium: false,
  journal: [],
  reminders: [],
  sos: [],
  coachCredits: FREE_COACH_CREDITS,
  coachStreak: 0,
  lastCoachRefill: null,
  aiReviewEnabled: false,
  profile: { username: "", avatar: "🌱", bio: "", joinedAt: new Date().toISOString(), language: "en" },
  relapses: [],
  cravings: [],
  checkins: [],
  generalMissions: {},
  rpBonus: 0,
  unlocked: [],
  theme: "dark",
  reasons: [],
};

export const FREE_JOURNEY_LIMIT = 2;

interface Ctx {
  state: AppState;
  userId: string | null;
  userEmail: string | null;
  authChecked: boolean;
  syncing: boolean;
  signOut: () => Promise<void>;
  startJourney: (category: CategoryId) => { id: string | null; blocked?: "premium" };
  setActive: (id: string) => void;
  removeJourney: (id: string) => void;
  toggleTask: (journeyId: string, taskId: string, xp: number) => void;
  resetStreak: (journeyId: string) => void;
  logRelapse: (r: Omit<RelapseLog, "id" | "at">) => void;
  logCraving: (c: Omit<CravingLog, "id" | "at">) => void;
  addCheckIn: (c: Omit<CheckIn, "id" | "at" | "dateKey">) => void;
  toggleGeneralMission: (missionId: string, rp: number) => void;
  updateProfile: (p: Partial<Profile>) => void;
  setTheme: (t: "dark" | "light") => void;
  setReasons: (r: string[]) => void;
  setCostPerDay: (journeyId: string, cost: number) => void;
  setPremium: (v: boolean) => void;
  addJournal: (e: Omit<JournalEntry, "id" | "createdAt">) => string;
  updateJournalReview: (id: string, review: string, status: "done" | "error") => void;
  setAiReviewEnabled: (v: boolean) => void;
  addReminder: (r: Omit<Reminder, "id">) => void;
  toggleReminder: (id: string) => void;
  removeReminder: (id: string) => void;
  logSos: (tool: string, survived: boolean) => void;
  useCoachCredit: () => boolean;
  exportAll: () => string;
  deleteAccountData: () => Promise<void>;
  totalXp: number;
  totalRp: number;
  checkedInToday: boolean;
  checkinStreak: number;
}

const StoreCtx = createContext<Ctx | null>(null);

function migrate(s: AppState): AppState {
  const journeys = s.journeys.map((j) => {
    const cat = j.category as string;
    if (cat === "smoking" || cat === "vaping") {
      return { ...j, category: "nicotine" as CategoryId };
    }
    return j;
  });
  return { ...s, journeys };
}

function loadLocal(): AppState {
  if (typeof window === "undefined") return empty;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const legacy = localStorage.getItem("reclaim.state.v1");
      if (legacy) return migrate({ ...empty, ...JSON.parse(legacy) });
      return empty;
    }
    return migrate({ ...empty, ...(JSON.parse(raw) as AppState) });
  } catch {
    return empty;
  }
}

function applyDailyCoachRefill(s: AppState): AppState {
  if (s.isPremium) return s;
  const today = todayKey();
  if (s.lastCoachRefill === today) return s;
  if (!s.lastCoachRefill) {
    // First-time free user — keep welcome bonus, stamp today
    return { ...s, lastCoachRefill: today };
  }
  const prev = new Date(s.lastCoachRefill + "T00:00:00");
  const now = new Date(today + "T00:00:00");
  const diffDays = Math.round((now.getTime() - prev.getTime()) / 86400000);
  if (diffDays <= 0) return { ...s, lastCoachRefill: today };
  const streak = diffDays === 1 ? s.coachStreak + 1 : 1;
  const daily = COACH_STREAK_SCHEDULE[Math.min(streak - 1, COACH_STREAK_SCHEDULE.length - 1)];
  return { ...s, coachStreak: streak, coachCredits: daily, lastCoachRefill: today };
}

export function computeCheckinStreak(checkins: CheckIn[]): number {
  if (checkins.length === 0) return 0;
  const keys = new Set(checkins.map((c) => c.dateKey));
  let streak = 0;
  const cursor = new Date();
  if (!keys.has(todayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (keys.has(todayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function earnedAchievements(s: AppState): string[] {
  const out: string[] = [];
  const longest = s.journeys.reduce((max, j) => Math.max(max, daysBetween(j.startedAt)), 0);
  const rp = s.journeys.reduce((a, j) => a + j.xp, 0) + s.rpBonus;
  if (longest >= 1) out.push("first-day");
  if (longest >= 7) out.push("week-clean");
  if (longest >= 30) out.push("month-clean");
  if (longest >= 90) out.push("three-months");
  if (longest >= 365) out.push("year-clean");
  if (s.cravings.length >= 100) out.push("cravings-100");
  if (s.journal.length >= 1) out.push("first-journal");
  if (s.checkins.some((c) => new Date(c.at).getHours() < 12)) out.push("morning-routine");
  if (s.journal.some((j) => new Date(j.createdAt).getHours() >= 21)) out.push("night-routine");
  if (rp >= 1000) out.push("warrior");
  if (computeCheckinStreak(s.checkins) >= 7) out.push("consistency");
  return out;
}


export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(empty);
  const [hydrated, setHydrated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextSave = useRef(false);

  // Initial local load + auth listener
  useEffect(() => {
    setState(applyDailyCoachRefill(loadLocal()));
    setHydrated(true);

    const applySession = async (uid: string | null, email: string | null) => {
      setUserId((prev) => {
        // Account switch or sign-out: never carry state across identities.
        if (prev !== uid) {
          skipNextSave.current = true;
          setState(applyDailyCoachRefill(empty));
          try { localStorage.removeItem(KEY); } catch {}
        }
        return uid;
      });
      setUserEmail(email);
      if (!uid) return;
      setSyncing(true);
      try {
        const { data } = await supabase
          .from("user_state")
          .select("data")
          .eq("user_id", uid)
          .maybeSingle();
        if (data?.data && Object.keys(data.data as object).length > 0) {
          skipNextSave.current = true;
          setState(applyDailyCoachRefill(migrate({ ...empty, ...(data.data as unknown as AppState) })));
        } else {
          // Brand-new account — start fresh, never seed from another account's local cache.
          skipNextSave.current = true;
          const fresh = applyDailyCoachRefill(empty);
          setState(fresh);
          await supabase.from("user_state").upsert({ user_id: uid, data: fresh as any });
        }
      } finally {
        setSyncing(false);
      }
    };

    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user.id ?? null;
      if (uid) {
        // Signed-in visit: cloud is source of truth; don't hydrate from local.
        skipNextSave.current = true;
        setState(applyDailyCoachRefill(empty));
        applySession(uid, data.session?.user.email ?? null);
      } else {
        // Signed-out visit: local cache is fine (used until they sign in).
        setState(applyDailyCoachRefill(loadLocal()));
      }
      setAuthChecked(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        applySession(session?.user.id ?? null, session?.user.email ?? null);
      } else if (event === "SIGNED_OUT") {
        skipNextSave.current = true;
        setState(applyDailyCoachRefill(empty));
        try { localStorage.removeItem(KEY); } catch {}
        setUserId(null);
        setUserEmail(null);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  // Persist to localStorage + debounced cloud sync
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(KEY, JSON.stringify(state));
    if (!userId) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      supabase
        .from("user_state")
        .upsert({ user_id: userId, data: state as any })
        .then(() => {});
    }, 600);
  }, [state, hydrated, userId]);

  // Sync premium status from subscriptions table
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    const env = (import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined)?.startsWith("pk_test_")
      ? "sandbox"
      : "live";
    const check = async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("status, current_period_end")
        .eq("user_id", userId)
        .eq("environment", env)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      const s: any = data;
      const active =
        !!s &&
        (
          (["active", "trialing", "past_due"].includes(s.status) &&
            (!s.current_period_end || new Date(s.current_period_end) > new Date())) ||
          (s.status === "canceled" &&
            !!s.current_period_end &&
            new Date(s.current_period_end) > new Date())
        );
      setState((prev) => (prev.isPremium === active ? prev : { ...prev, isPremium: active }));
    };
    check();
    const channel = supabase
      .channel(`subs:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${userId}` },
        () => check()
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Apply theme to <html>
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.classList.toggle("light", state.theme === "light");
    root.classList.toggle("dark", state.theme !== "light");
  }, [state.theme]);

  // Unlock achievements as they're earned
  useEffect(() => {
    if (!hydrated) return;
    const earned = earnedAchievements(state);
    const missing = earned.filter((id) => !state.unlocked.includes(id));
    if (missing.length === 0) return;
    setState((s) => ({ ...s, unlocked: [...s.unlocked, ...missing] }));
  }, [state, hydrated]);


  const value = useMemo<Ctx>(() => ({
    state,
    userId,
    userEmail,
    authChecked,
    syncing,
    signOut: async () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
      if (userId) {
        try {
          await supabase.from("user_state").upsert({ user_id: userId, data: state as any });
        } catch {}
      }
      await supabase.auth.signOut();
      skipNextSave.current = true;
      try { localStorage.removeItem(KEY); } catch {}
      setState(applyDailyCoachRefill(empty));
      setUserId(null);
      setUserEmail(null);
    },
    startJourney: (category) => {
      const existing = state.journeys.find((j) => j.category === category);
      if (existing) {
        setState((s) => ({ ...s, activeId: existing.id }));
        return { id: existing.id };
      }
      if (!state.isPremium && state.journeys.length >= FREE_JOURNEY_LIMIT) {
        return { id: null, blocked: "premium" };
      }
      const id = `${category}-${Date.now()}`;
      const j: Journey = {
        id,
        category,
        startedAt: new Date().toISOString(),
        xp: 0,
        completions: {},
      };
      setState((s) => ({ ...s, journeys: [...s.journeys, j], activeId: id }));
      return { id };
    },
    setActive: (id) => setState((s) => ({ ...s, activeId: id })),
    removeJourney: (id) =>
      setState((s) => {
        const journeys = s.journeys.filter((j) => j.id !== id);
        const activeId = s.activeId === id ? (journeys[0]?.id ?? null) : s.activeId;
        return { ...s, journeys, activeId };
      }),
    useCoachCredit: () => {
      if (state.isPremium) return true;
      if (state.coachCredits <= 0) return false;
      setState((s) => ({ ...s, coachCredits: Math.max(0, s.coachCredits - 1) }));
      return true;
    },
    toggleTask: (journeyId, taskId, xp) => {
      setState((s) => {
        const key = todayKey();
        const journeys = s.journeys.map((j) => {
          if (j.id !== journeyId) return j;
          const done = j.completions[key] ?? [];
          const isDone = done.includes(taskId);
          const nextDone = isDone ? done.filter((x) => x !== taskId) : [...done, taskId];
          return {
            ...j,
            xp: Math.max(0, j.xp + (isDone ? -xp : xp)),
            completions: { ...j.completions, [key]: nextDone },
          };
        });
        return { ...s, journeys };
      });
    },
    resetStreak: (journeyId) =>
      setState((s) => {
        const key = todayKey();
        return {
          ...s,
          journeys: s.journeys.map((j) => {
            if (j.id !== journeyId) return j;
            const { [key]: _cleared, ...restCompletions } = j.completions;
            return {
              ...j,
              startedAt: new Date().toISOString(),
              lastRelapse: new Date().toISOString(),
              completions: restCompletions,
            };
          }),
        };
      }),
    setCostPerDay: (journeyId, cost) =>
      setState((s) => ({
        ...s,
        journeys: s.journeys.map((j) => (j.id === journeyId ? { ...j, costPerDay: cost } : j)),
      })),
    setPremium: (v) => setState((s) => ({ ...s, isPremium: v })),
    addJournal: (e) => {
      const id = `jr-${Date.now()}`;
      setState((s) => ({
        ...s,
        journal: [
          { ...e, id, createdAt: new Date().toISOString() },
          ...s.journal,
        ].slice(0, 500),
      }));
      return id;
    },
    updateJournalReview: (id, review, status) =>
      setState((s) => ({
        ...s,
        journal: s.journal.map((j) =>
          j.id === id ? { ...j, aiReview: review, aiReviewStatus: status } : j,
        ),
      })),
    setAiReviewEnabled: (v) => setState((s) => ({ ...s, aiReviewEnabled: v })),
    addReminder: (r) =>
      setState((s) => ({
        ...s,
        reminders: [...s.reminders, { ...r, id: `rm-${Date.now()}` }],
      })),
    toggleReminder: (id) =>
      setState((s) => ({
        ...s,
        reminders: s.reminders.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)),
      })),
    removeReminder: (id) =>
      setState((s) => ({ ...s, reminders: s.reminders.filter((r) => r.id !== id) })),
    logSos: (tool, survived) =>
      setState((s) => ({
        ...s,
        sos: [
          { id: `sos-${Date.now()}`, createdAt: new Date().toISOString(), tool, survived },
          ...s.sos,
        ].slice(0, 200),
      })),
    logRelapse: (r) =>
      setState((s) => {
        const key = todayKey();
        return {
          ...s,
          relapses: [{ ...r, id: `rl-${Date.now()}`, at: new Date().toISOString() }, ...s.relapses].slice(0, 500),
          journeys: s.journeys.map((j) => {
            if (j.id !== r.journeyId) return j;
            const { [key]: _cleared, ...restCompletions } = j.completions;
            return {
              ...j,
              startedAt: new Date().toISOString(),
              lastRelapse: new Date().toISOString(),
              completions: restCompletions,
            };
          }),
        };
      }),
    logCraving: (c) =>
      setState((s) => ({
        ...s,
        cravings: [{ ...c, id: `cv-${Date.now()}`, at: new Date().toISOString() }, ...s.cravings].slice(0, 1000),
        rpBonus: s.rpBonus + 30,
      })),
    addCheckIn: (c) =>
      setState((s) => {
        const key = todayKey();
        const rest = s.checkins.filter((x) => x.dateKey !== key);
        const already = s.checkins.some((x) => x.dateKey === key);
        return {
          ...s,
          checkins: [{ ...c, id: `ci-${Date.now()}`, at: new Date().toISOString(), dateKey: key }, ...rest].slice(0, 730),
          rpBonus: already ? s.rpBonus : s.rpBonus + 25,
        };
      }),
    toggleGeneralMission: (missionId, rp) =>
      setState((s) => {
        const key = todayKey();
        const done = s.generalMissions[key] ?? [];
        const isDone = done.includes(missionId);
        return {
          ...s,
          generalMissions: {
            ...s.generalMissions,
            [key]: isDone ? done.filter((x) => x !== missionId) : [...done, missionId],
          },
          rpBonus: Math.max(0, s.rpBonus + (isDone ? -rp : rp)),
        };
      }),
    updateProfile: (p) => setState((s) => ({ ...s, profile: { ...s.profile, ...p } })),
    setTheme: (t) => setState((s) => ({ ...s, theme: t })),
    setReasons: (r) => setState((s) => ({ ...s, reasons: r })),
    exportAll: () => JSON.stringify(state, null, 2),
    deleteAccountData: async () => {
      const fresh: AppState = { ...empty, isPremium: state.isPremium, theme: state.theme };
      if (userId) {
        try {
          await supabase
            .from("user_state")
            .upsert({ user_id: userId, data: fresh as any, updated_at: new Date().toISOString() });
        } catch {}
      }
      skipNextSave.current = true;
      try { localStorage.removeItem(KEY); } catch {}
      setState(fresh);
    },
    totalXp: state.journeys.reduce((acc, j) => acc + j.xp, 0) + state.rpBonus,
    totalRp: state.journeys.reduce((acc, j) => acc + j.xp, 0) + state.rpBonus,
    checkedInToday: state.checkins.some((c) => c.dateKey === todayKey()),
    checkinStreak: computeCheckinStreak(state.checkins),
  }), [state, userId, userEmail, authChecked, syncing]);

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

export function useCategoryMeta(id: CategoryId | undefined) {
  return CATEGORIES.find((c) => c.id === id);
}
