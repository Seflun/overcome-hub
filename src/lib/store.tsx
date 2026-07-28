import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CATEGORIES, type CategoryId, todayKey } from "./addiction-data";
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
  totalXp: number;
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
    exportAll: () => JSON.stringify(state, null, 2),
    totalXp: state.journeys.reduce((acc, j) => acc + j.xp, 0),
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
