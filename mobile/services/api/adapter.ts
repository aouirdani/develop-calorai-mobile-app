/**
 * Conversion réponse backend (`ApiEstimateResponse`) → modèle UI (`Estimate`).
 * Le backend n'envoie pas de total de macros : il est recalculé depuis les
 * aliments. Les valeurs absentes (null) deviennent des fourchettes vides, jamais
 * inventées.
 */
import type { Aliment, ApiEstimateResponse, ApiFoodItem, ApiRangedValue, Estimate, NutriRange } from "../../types/api";
import { totalFromAliments } from "../../utils/format";
import { InvalidResponseError } from "./types";

const EMPTY: NutriRange = { estimation: 0, min: null, max: null };

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

function range(r: ApiRangedValue | null | undefined): NutriRange {
  if (!r || !isNum(r.estimation)) return { ...EMPTY };
  return { estimation: r.estimation, min: isNum(r.min) ? r.min : null, max: isNum(r.max) ? r.max : null };
}

// Le backend donne un niveau qualitatif ; l'UI attend 0→1 : on ne garde que des paliers.
const CONFIDENCE = { haute: 0.9, moyenne: 0.65, basse: 0.35 } as const;

// Les libellés UI historiques utilisent "barcode" pour le code-barres.
const METHODE: Record<string, string> = { code_barres: "barcode" };

function aliment(a: ApiFoodItem): Aliment {
  return {
    nom: a.nom,
    source_nutritionnelle: a.source_nutritionnelle,
    quantite: { ...range(a.quantite_g), unite: "g" },
    calories: range(a.calories),
    macros: {
      proteines: range(a.macros?.proteins),
      glucides: range(a.macros?.carbs),
      lipides: range(a.macros?.fats),
    },
    confiance: CONFIDENCE[a.confiance] ?? CONFIDENCE.basse,
    methode: METHODE[a.methode_estimation] ?? a.methode_estimation,
  };
}

export function toEstimate(raw: unknown): Estimate {
  const r = raw as Partial<ApiEstimateResponse> | null;
  if (!r || typeof r.id !== "string" || !Array.isArray(r.aliments)) throw new InvalidResponseError();

  const aliments = r.aliments.map(aliment);
  const totals = totalFromAliments(aliments);
  // Le total serveur fait foi pour les calories s'il est fourni.
  if (r.total?.calories) totals.calories = range(r.total.calories);

  return {
    id: r.id,
    total: totals,
    aliments,
    avertissements: Array.isArray(r.avertissements) ? r.avertissements.filter((w) => typeof w === "string") : [],
    score_qualite: isNum(r.score_qualite) ? r.score_qualite : null,
    depuis_cache: r.depuis_cache === true,
  };
}
