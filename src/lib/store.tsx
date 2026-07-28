import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { CATEGORIES, type CategoryId, todayKey } from "./addiction-data";

export interface Journey {
  id: string;
  category: CategoryId;
  startedAt: string; // ISO
  xp: number;
  completions: Record<string, string[]>;
  lastRelapse?: string;
  costPerDay?: number; // for money-saved insights
}

export interface JournalEntry {
  id: string;
  createdAt: string; // ISO
  journeyId?: string;
  mood: 1 | 2 | 3 | 4 | 5;
  trigger?: string;
  note?: string;
}

export interface Reminder {
  id: string;
  time: string; // "HH:MM"
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
}

const KEY = "reclaim.state.v2";

const empty: AppState = {
  journeys: [],
  activeId: null,
  isPremium: false,
  journal: [],
  reminders: [],
  sos: [],
};

export const FREE_JOURNEY_LIMIT = 1;

interface Ctx {
  state: AppState;
  startJourney: (category: CategoryId) => { id: string | null; blocked?: "premium" };
  setActive: (id: string) => void;
  toggleTask: (journeyId: string, taskId: string, xp: number) => void;
  resetStreak: (journeyId: string) => void;
  setCostPerDay: (journeyId: string, cost: number) => void;
  setPremium: (v: boolean) => void;
  addJournal: (e: Omit<JournalEntry, "id" | "createdAt">) => void;
  addReminder: (r: Omit<Reminder, "id">) => void;
  toggleReminder: (id: string) => void;
  removeReminder: (id: string) => void;
  logSos: (tool: string, survived: boolean) => void;
  exportAll: () => string;
  totalXp: number;
}

const StoreCtx = createContext<Ctx | null>(null);

function load(): AppState {
  if (typeof window === "undefined") return empty;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      // migrate v1
      const legacy = localStorage.getItem("reclaim.state.v1");
      if (legacy) {
        const p = JSON.parse(legacy);
        return { ...empty, ...p };
      }
      return empty;
    }
    const parsed = JSON.parse(raw) as AppState;
    return { ...empty, ...parsed };
  } catch {
    return empty;
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(empty);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(load());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const value = useMemo<Ctx>(() => ({
    state,
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
      setState((s) => ({
        ...s,
        journeys: s.journeys.map((j) =>
          j.id === journeyId
            ? { ...j, startedAt: new Date().toISOString(), lastRelapse: new Date().toISOString() }
            : j,
        ),
      })),
    setCostPerDay: (journeyId, cost) =>
      setState((s) => ({
        ...s,
        journeys: s.journeys.map((j) => (j.id === journeyId ? { ...j, costPerDay: cost } : j)),
      })),
    setPremium: (v) => setState((s) => ({ ...s, isPremium: v })),
    addJournal: (e) =>
      setState((s) => ({
        ...s,
        journal: [
          { ...e, id: `jr-${Date.now()}`, createdAt: new Date().toISOString() },
          ...s.journal,
        ].slice(0, 500),
      })),
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
  }), [state]);

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
