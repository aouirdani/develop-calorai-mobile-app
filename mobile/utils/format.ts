/**
 * Formatage & arithmétique des fourchettes nutritionnelles.
 * Principe : une valeur {estimation, min, max} ne doit JAMAIS être
 * silencieusement réduite à un nombre — l'UI compose ces primitives
 * pour afficher les plages chaque fois qu'elles existent.
 */
import type { Aliment, EstimateTotal, NutriRange, QuantiteRange } from "../types/api";
import type { MealSlot } from "../types/app";

const nf0 = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });

export function fmtNum(n: number, decimals = 0): string {
  return (decimals > 0 ? nf1 : nf0).format(Math.round(n * 10) / 10);
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** "110–200 g" si une vraie plage existe, sinon null (valeur unique). */
export function fmtRangeSub(r: NutriRange, unit?: string): string | null {
  if (r.min == null || r.max == null || r.min === r.max) return null;
  const u = unit ? ` ${unit}` : "";
  return `${nf0.format(r.min)}–${nf0.format(r.max)}${u}`;
}

/** Valeur principale : "620" ou "620,5". */
export function fmtEst(r: NutriRange): string {
  return r.estimation >= 100 ? nf0.format(r.estimation) : nf1.format(r.estimation);
}

/** Somme de fourchettes : min/max ne restent définis que si toutes les bornes le sont. */
export function addRanges(ranges: NutriRange[]): NutriRange {
  if (ranges.length === 0) return { estimation: 0, min: null, max: null };
  const estimation = ranges.reduce((s, r) => s + r.estimation, 0);
  let min: number | null = 0;
  let max: number | null = 0;
  for (const r of ranges) {
    if (r.min == null || min == null) min = null;
    else min += r.min;
    if (r.max == null || max == null) max = null;
    else max += r.max;
  }
  return { estimation: round1(estimation), min, max };
}

export function sumTotals(totals: EstimateTotal[]): EstimateTotal {
  return {
    calories: addRanges(totals.map((t) => t.calories)),
    proteines: addRanges(totals.map((t) => t.proteines)),
    glucides: addRanges(totals.map((t) => t.glucides)),
    lipides: addRanges(totals.map((t) => t.lipides)),
  };
}

/** Mise à l'échelle d'une fourchette (ex. ajustement de portion). */
export function scaleRange(r: NutriRange, f: number): NutriRange {
  const s = (v: number | null): number | null => (v == null ? null : round1(v * f));
  return { estimation: round1(r.estimation * f), min: s(r.min), max: s(r.max) };
}

export function scaleQuantite(q: QuantiteRange, f: number): QuantiteRange {
  return { ...scaleRange(q, f), unite: q.unite };
}

/** Recalcule un total cohérent à partir d'une liste d'aliments. */
export function totalFromAliments(aliments: Aliment[]): EstimateTotal {
  return {
    calories: addRanges(aliments.map((a) => a.calories)),
    proteines: addRanges(aliments.map((a) => a.macros.proteines)),
    glucides: addRanges(aliments.map((a) => a.macros.glucides)),
    lipides: addRanges(aliments.map((a) => a.macros.lipides)),
  };
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

export function pct(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return clamp(part / whole, 0, 1);
}

export function confidenceTone(c: number): "good" | "mid" | "low" {
  return c >= 0.8 ? "good" : c >= 0.55 ? "mid" : "low";
}

export function confidenceLabel(c: number): string {
  return c >= 0.8 ? "Élevée" : c >= 0.55 ? "Moyenne" : "Faible";
}

export function methodeLabel(m: string): string {
  switch (m) {
    case "reference_assiette":
      return "Référence assiette";
    case "volume_profondeur":
      return "Volume / profondeur";
    case "estimation_modele":
      return "Estimation du modèle";
    case "vision":
      return "Analyse photo";
    case "heuristique":
      return "Heuristique";
    case "barcode":
      return "Code-barres";
    case "manuel":
      return "Ajout manuel";
    case "base_aliments":
      return "Base aliments";
    default:
      return m || "Inconnue";
  }
}

let seq = 0;
export function uid(prefix = "id"): string {
  seq += 1;
  return `${prefix}_${Date.now().toString(36)}${seq.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function dayKeyLocal(d: Date): string {
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function todayKey(): string {
  return dayKeyLocal(new Date());
}

export function addDaysKey(base: Date, delta: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + delta);
  return dayKeyLocal(d);
}

export function slotForHour(h: number): MealSlot {
  if (h < 11) return "petit_dejeuner";
  if (h < 15) return "dejeuner";
  if (h < 18) return "collation";
  return "diner";
}

const dayFmt = new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short" });
const longFmt = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" });

/** "Aujourd'hui", "Hier" ou "lun. 12 mai". */
export function dayLabel(day: string): string {
  const today = todayKey();
  if (day === today) return "Aujourd'hui";
  if (day === addDaysKey(new Date(), -1)) return "Hier";
  const [y, m, d] = day.split("-").map(Number);
  return dayFmt.format(new Date(y, m - 1, d));
}

export function dayLabelLong(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  return longFmt.format(new Date(y, m - 1, d));
}
