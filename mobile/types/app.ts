/**
 * Types "application" (côté client uniquement) : journal des repas,
 * objectifs, préférences. Rien ici ne provient de l'API.
 */
import type { Aliment, EstimateTotal } from "./api";

export type MealSlot = "petit_dejeuner" | "dejeuner" | "collation" | "diner";

/** Origine d'un repas du journal. */
export type MealSource = "vision" | "barcode" | "manuel";

export interface MealLog {
  id: string;
  /** Jour local au format YYYY-MM-DD. */
  day: string;
  slot: MealSlot;
  label: string;
  source: MealSource;
  /** id de l'estimation API d'origine (null pour un ajout manuel). */
  estimate_id: string | null;
  /** uri locale de la photo (RN) ou clé/résolution côté web — null sinon. */
  image: string | null;
  total: EstimateTotal;
  aliments: Aliment[];
  /** ISO 8601. */
  added_at: string;
}

export interface Goals {
  calories: number;
  proteines: number;
  glucides: number;
  lipides: number;
}

export interface ProfileInfo {
  poids_kg: number | null;
  taille_cm: number | null;
}

export interface AppPrefs {
  unites: "metrique" | "imperial";
}

export interface AppState {
  onboarding_done: boolean;
  goals: Goals;
  profile: ProfileInfo;
  prefs: AppPrefs;
  meals: MealLog[];
}
