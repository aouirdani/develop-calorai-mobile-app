/**
 * État global CalorAI : objectifs, profil, préférences, journal des repas.
 * Store minimaliste (useSyncExternalStore) — aucune dépendance externe.
 */
import { useSyncExternalStore } from "react";
import { DEFAULT_GOALS } from "../constants/nutrition";
import type { AppState, Goals, MealLog, ProfileInfo, AppPrefs } from "../types/app";
import type { EstimateTotal } from "../types/api";
import { sumTotals } from "../utils/format";
import type { StorageAdapter } from "./storage";

const STORAGE_KEY = "calorai.store.v1";

export interface AppStore {
  getState(): AppState;
  subscribe(listener: () => void): () => void;
  hydrate(): Promise<void>;
  setGoals(g: Partial<Goals>): void;
  setProfile(p: Partial<ProfileInfo>): void;
  setPrefs(p: Partial<AppPrefs>): void;
  completeOnboarding(input: { goals: Partial<Goals>; profile: Partial<ProfileInfo> }): void;
  addMeal(meal: MealLog): void;
  removeMeal(id: string): void;
  resetOnboarding(): void;
  resetAll(): void;
}

function defaultState(): AppState {
  return {
    onboarding_done: false,
    goals: { ...DEFAULT_GOALS },
    profile: { poids_kg: null, taille_cm: null },
    prefs: { unites: "metrique" },
    meals: [],
  };
}

export function createAppStore(storage?: StorageAdapter): AppStore {
  let state = defaultState();
  const listeners = new Set<() => void>();

  const emit = () => listeners.forEach((l) => l());
  const persist = () => {
    void storage?.write(JSON.stringify(state));
  };
  const set = (patch: Partial<AppState>) => {
    state = { ...state, ...patch };
    persist();
    emit();
  };

  return {
    getState: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    hydrate: async () => {
      if (!storage) return;
      const raw = await storage.read();
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw) as Partial<AppState>;
        state = {
          ...defaultState(),
          ...parsed,
          goals: { ...DEFAULT_GOALS, ...(parsed.goals ?? {}) },
          profile: { ...defaultState().profile, ...(parsed.profile ?? {}) },
          prefs: { ...defaultState().prefs, ...(parsed.prefs ?? {}) },
          meals: Array.isArray(parsed.meals) ? parsed.meals : [],
        };
        emit();
      } catch {
        /* stockage corrompu → valeurs par défaut */
      }
    },
    setGoals: (g) => set({ goals: { ...state.goals, ...g } }),
    setProfile: (p) => set({ profile: { ...state.profile, ...p } }),
    setPrefs: (p) => set({ prefs: { ...state.prefs, ...p } }),
    completeOnboarding: ({ goals, profile }) =>
      set({
        onboarding_done: true,
        goals: { ...state.goals, ...goals },
        profile: { ...state.profile, ...profile },
      }),
    addMeal: (meal) => set({ meals: [...state.meals, meal] }),
    removeMeal: (id) => set({ meals: state.meals.filter((m) => m.id !== id) }),
    resetOnboarding: () => set({ onboarding_done: false }),
    resetAll: () => {
      state = defaultState();
      persist();
      emit();
    },
  };
}

/** Hook React (RN & web). Sélecteur : renvoyer une référence stable ou une primitive. */
export function useAppState<S>(store: AppStore, selector: (s: AppState) => S): S {
  return useSyncExternalStore(store.subscribe, () => selector(store.getState()));
}

/* ----- Sélecteurs dérivés (purs) ----- */

export function mealsForDay(s: AppState, day: string): MealLog[] {
  return s.meals.filter((m) => m.day === day);
}

export function dayTotal(meals: MealLog[]): EstimateTotal {
  return sumTotals(meals.map((m) => m.total));
}

export { STORAGE_KEY };
