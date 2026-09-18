/**
 * Types miroirs du contrat `calorie-vision/openapi.yaml` (API `/api/v1`).
 *
 * Règle absolue : ce fichier reflète le contrat existant. On n'invente ici
 * ni endpoint, ni champ, ni structure. Toute évolution doit d'abord être
 * validée contre openapi.yaml.
 */

/** Toute valeur nutritionnelle est une fourchette : jamais un simple nombre. */
export interface NutriRange {
  estimation: number;
  min: number | null;
  max: number | null;
}

/** Quantité d'un aliment : fourchette + unité (ex. { estimation: 156, min: 110, max: 200, unite: "g" }). */
export interface QuantiteRange extends NutriRange {
  unite: string;
}

export interface Macros {
  proteines: NutriRange;
  glucides: NutriRange;
  lipides: NutriRange;
}

/** `total` d'une estimation : calories + macros, chacune en fourchette. */
export interface EstimateTotal {
  calories: NutriRange;
  proteines: NutriRange;
  glucides: NutriRange;
  lipides: NutriRange;
}

/**
 * Méthode d'estimation renvoyée par le backend.
 * Le contrat ne fixe pas d'énumération stricte : on reste sur `string`
 * et l'UI affiche un libellé pour les valeurs connues (voir methodeLabel).
 */
export type MethodeEstimation = string;

export interface Aliment {
  nom: string;
  source_nutritionnelle: string;
  quantite: QuantiteRange;
  calories: NutriRange;
  macros: Macros;
  /** 0 → 1 */
  confiance: number;
  methode: MethodeEstimation;
}

/** Réponse de POST /estimates, GET /estimates/{id} et POST /estimates/barcode. */
export interface Estimate {
  id: string;
  total: EstimateTotal;
  aliments: Aliment[];
  avertissements: string[];
  score_qualite: number | null;
  depuis_cache: boolean;
}

/** Élément renvoyé par GET /foods?q=... */
export interface Food {
  id: string;
  nom: string;
  marque: string | null;
  /** Référence nutritionnelle affichée, ex. "100 g". */
  quantite_reference: string;
  calories: NutriRange;
  macros: Macros;
}

/**
 * Enveloppe paginée de GET /foods.
 * ⚠️ À valider contre openapi.yaml : la forme exacte de la pagination
 * (noms des champs) est l'hypothèse la plus probable.
 */
export interface FoodPage {
  aliments: Food[];
  total: number;
  limit: number;
  offset: number;
}

/** Réponse de GET /healthz. */
export interface HealthStatus {
  status: string;
}

/* ────────────────────────────────────────────────────────────────────────
 * Contrat BRUT du backend (POST/GET /estimates). Le client réel
 * (services/api/adapter.ts) le convertit vers `Estimate` ci-dessus, que
 * l'UI et le mock consomment : les écrans ne voient jamais ces types.
 * ──────────────────────────────────────────────────────────────────────── */

export interface ApiRangedValue {
  estimation: number;
  min: number;
  max: number;
}

export interface ApiFoodItem {
  nom: string;
  source_nutritionnelle: "USDA" | "CIQUAL" | "OFF" | "estimation_modele";
  quantite_g: ApiRangedValue | null;
  calories: ApiRangedValue | null;
  macros: {
    proteins: ApiRangedValue;
    carbs: ApiRangedValue;
    fats: ApiRangedValue;
  };
  confiance: "haute" | "moyenne" | "basse";
  methode_estimation: "reference_assiette" | "volume_profondeur" | "estimation_modele" | "code_barres";
}

export interface ApiEstimateResponse {
  id: string;
  total: { calories: ApiRangedValue | null };
  aliments: ApiFoodItem[];
  avertissements: string[];
  score_qualite: number | null;
  depuis_cache: boolean;
}
