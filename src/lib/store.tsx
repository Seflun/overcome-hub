import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { CATEGORIES, type CategoryId, todayKey } from "./addiction-data";

export interface Journey {
  id: string;
  category: CategoryId;
  startedAt: string; // ISO
  xp: number;
  // Map of dateKey -> array of completed task ids
  completions: Record<string, string[]>;
  lastRelapse?: string;
}

export interface AppState {
  journeys: Journey[];
  activeId: string | null;
}

const KEY = "reclaim.state.v1";

const empty: AppState = { journeys: [], activeId: null };

interface Ctx {
  state: AppState;
  startJourney: (category: CategoryId) => string;
  setActive: (id: string) => void;
  toggleTask: (journeyId: string, taskId: string, xp: number) => void;
  resetStreak: (journeyId: string) => void;
  totalXp: number;
}

const StoreCtx = createContext<Ctx | null>(null);

function load(): AppState {
  if (typeof window === "undefined") return empty;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty;
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
        return existing.id;
      }
      const id = `${category}-${Date.now()}`;
      const j: Journey = {
        id,
        category,
        startedAt: new Date().toISOString(),
        xp: 0,
        completions: {},
      };
      setState((s) => ({ journeys: [...s.journeys, j], activeId: id }));
      return id;
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
