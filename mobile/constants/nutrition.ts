import type { MealSlot } from "../types/app";
import type { Goals } from "../types/app";

export const APP_VERSION = "1.0.0";
export const API_PATH_PREFIX = "/api/v1";

export const DEFAULT_GOALS: Goals = {
  calories: 2200,
  proteines: 140,
  glucides: 250,
  lipides: 70,
};

export const CALORIE_PRESETS = [1600, 1800, 2000, 2200, 2500, 2800];
export const PROTEIN_PRESETS = [90, 110, 130, 150, 170];
export const PLATE_DIAMETERS_CM = [18, 22, 26, 30];

export type MacroKey = "proteines" | "glucides" | "lipides";
export const MACRO_KEYS: MacroKey[] = ["proteines", "glucides", "lipides"];

export const MACRO_META: Record<MacroKey, { label: string; short: string; color: string; soft: string }> = {
  proteines: { label: "Protéines", short: "P", color: "#D95E3F", soft: "#FBE4DC" },
  glucides: { label: "Glucides", short: "G", color: "#DE9A26", soft: "#FAEFD8" },
  lipides: { label: "Lipides", short: "L", color: "#3D8E85", soft: "#DFEFEC" },
};

export const SLOT_ORDER: MealSlot[] = ["petit_dejeuner", "dejeuner", "collation", "diner"];

export const SLOT_META: Record<MealSlot, { label: string; hours: string }> = {
  petit_dejeuner: { label: "Petit-déjeuner", hours: "5h – 11h" },
  dejeuner: { label: "Déjeuner", hours: "11h – 15h" },
  collation: { label: "Collation", hours: "15h – 18h" },
  diner: { label: "Dîner", hours: "18h – 5h" },
};
