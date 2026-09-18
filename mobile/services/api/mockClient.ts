/**
 * MockApiClient — permet de développer l'UI sans backend.
 * Les données respectent EXACTEMENT les structures d'openapi.yaml :
 * chaque valeur nutritionnelle est un objet { estimation, min, max }.
 */
import type { Aliment, Estimate, Food, FoodPage, HealthStatus, NutriRange } from "../../types/api";
import { round1, totalFromAliments, uid } from "../../utils/format";
import {
  ApiError,
  NetworkError,
  type ApiClient,
  type ApiClientConfig,
  type ApiLogEntry,
  type EstimatePhotoInput,
  type SearchFoodsParams,
} from "./types";

const sleep = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));
const jitter = (base: number, spread: number) => base + Math.random() * spread;

function rangeAround(value: number, spread: number): NutriRange {
  return {
    estimation: round1(value),
    min: round1(value * (1 - spread)),
    max: round1(value * (1 + spread)),
  };
}

interface AlimentSeed {
  nom: string;
  source: string;
  qte: number;
  qteSpread: number;
  unite: string;
  /** Valeurs pour 100 g (ou 100 ml). */
  kcal: number;
  p: number;
  g: number;
  l: number;
  confiance: number;
  methode?: string;
}

function alimentFromSeed(s: AlimentSeed): Aliment {
  const f = s.qte / 100;
  return {
    nom: s.nom,
    source_nutritionnelle: s.source,
    quantite: {
      estimation: round1(s.qte),
      min: round1(s.qte * (1 - s.qteSpread)),
      max: round1(s.qte * (1 + s.qteSpread)),
      unite: s.unite,
    },
    calories: rangeAround(s.kcal * f, 0.18),
    macros: {
      proteines: rangeAround(s.p * f, 0.15),
      glucides: rangeAround(s.g * f, 0.15),
      lipides: rangeAround(s.l * f, 0.2),
    },
    confiance: s.confiance,
    methode: s.methode ?? "vision",
  };
}

interface PhotoPreset {
  seeds: AlimentSeed[];
  avertissements: string[];
  score_qualite: number;
}

/** Ordre aligné sur les photos d'exemple de la preview (sample:bowl, sample:pates…). */
const PRESET_KEYS = ["bowl", "pates", "salade", "porridge", "pizza"];

const PHOTO_PRESETS: PhotoPreset[] = [
  {
    seeds: [
      { nom: "Saumon grillé", source: "CIQUAL", qte: 140, qteSpread: 0.22, unite: "g", kcal: 181, p: 20.2, g: 0, l: 11, confiance: 0.87 },
      { nom: "Quinoa cuit", source: "CIQUAL", qte: 165, qteSpread: 0.2, unite: "g", kcal: 120, p: 4.4, g: 21.3, l: 1.9, confiance: 0.81 },
      { nom: "Avocat", source: "CIQUAL", qte: 75, qteSpread: 0.3, unite: "g", kcal: 160, p: 2, g: 8.5, l: 14.7, confiance: 0.74 },
      { nom: "Vinaigrette huile d'olive", source: "CIQUAL", qte: 18, qteSpread: 0.45, unite: "ml", kcal: 720, p: 0, g: 3, l: 75, confiance: 0.49 },
    ],
    avertissements: [
      "La vinaigrette est partiellement masquée : sa quantité est incertaine.",
      "Précisez le diamètre de l'assiette pour affiner l'estimation des portions.",
    ],
    score_qualite: 78,
  },
  {
    seeds: [
      { nom: "Pâtes cuites", source: "CIQUAL", qte: 220, qteSpread: 0.18, unite: "g", kcal: 140, p: 5, g: 27, l: 1.1, confiance: 0.84 },
      { nom: "Bœuf haché 5 %", source: "CIQUAL", qte: 110, qteSpread: 0.25, unite: "g", kcal: 176, p: 26, g: 0, l: 7.5, confiance: 0.79 },
      { nom: "Sauce tomate", source: "CIQUAL", qte: 95, qteSpread: 0.3, unite: "g", kcal: 36, p: 1.3, g: 6.5, l: 0.5, confiance: 0.72 },
      { nom: "Parmesan râpé", source: "CIQUAL", qte: 14, qteSpread: 0.45, unite: "g", kcal: 420, p: 29, g: 3.4, l: 31, confiance: 0.63 },
    ],
    avertissements: ["Le parmesan râpé est difficile à quantifier sur photo."],
    score_qualite: 82,
  },
  {
    seeds: [
      { nom: "Laitue romaine", source: "CIQUAL", qte: 90, qteSpread: 0.25, unite: "g", kcal: 17, p: 1.2, g: 3.3, l: 0.3, confiance: 0.88 },
      { nom: "Poulet rôti", source: "CIQUAL", qte: 125, qteSpread: 0.2, unite: "g", kcal: 190, p: 29, g: 0, l: 7.5, confiance: 0.83 },
      { nom: "Croûtons", source: "CIQUAL", qte: 30, qteSpread: 0.35, unite: "g", kcal: 410, p: 12, g: 68, l: 9, confiance: 0.7 },
      { nom: "Sauce César", source: "CIQUAL", qte: 42, qteSpread: 0.45, unite: "ml", kcal: 360, p: 1.5, g: 6, l: 36, confiance: 0.47 },
      { nom: "Copeaux de parmesan", source: "CIQUAL", qte: 10, qteSpread: 0.5, unite: "g", kcal: 420, p: 29, g: 3.4, l: 31, confiance: 0.6 },
    ],
    avertissements: [
      "La sauce est l'élément le plus incertain de cette estimation.",
      "Estimation réalisée sans diamètre d'assiette.",
    ],
    score_qualite: 71,
  },
  {
    seeds: [
      { nom: "Flocons d'avoine", source: "CIQUAL", qte: 60, qteSpread: 0.2, unite: "g", kcal: 370, p: 13, g: 60, l: 7, confiance: 0.85 },
      { nom: "Lait demi-écrémé", source: "CIQUAL", qte: 200, qteSpread: 0.15, unite: "ml", kcal: 46, p: 3.3, g: 4.8, l: 1.6, confiance: 0.8 },
      { nom: "Myrtilles", source: "CIQUAL", qte: 80, qteSpread: 0.25, unite: "g", kcal: 57, p: 0.7, g: 14, l: 0.3, confiance: 0.77 },
      { nom: "Miel", source: "CIQUAL", qte: 14, qteSpread: 0.4, unite: "g", kcal: 320, p: 0.3, g: 80, l: 0, confiance: 0.58 },
    ],
    avertissements: [],
    score_qualite: 88,
  },
  {
    seeds: [
      { nom: "Pâte à pizza cuite", source: "CIQUAL", qte: 180, qteSpread: 0.2, unite: "g", kcal: 266, p: 8.9, g: 50, l: 3.2, confiance: 0.82 },
      { nom: "Mozzarella fior di latte", source: "CIQUAL", qte: 90, qteSpread: 0.25, unite: "g", kcal: 280, p: 18, g: 2.2, l: 22, confiance: 0.78 },
      { nom: "Sauce tomate", source: "CIQUAL", qte: 70, qteSpread: 0.3, unite: "g", kcal: 36, p: 1.3, g: 6.5, l: 0.5, confiance: 0.7 },
      { nom: "Huile d'olive", source: "CIQUAL", qte: 10, qteSpread: 0.5, unite: "ml", kcal: 884, p: 0, g: 0, l: 100, confiance: 0.45 },
      { nom: "Basilic frais", source: "CIQUAL", qte: 3, qteSpread: 0.6, unite: "g", kcal: 23, p: 3.2, g: 3.6, l: 0.6, confiance: 0.65 },
    ],
    avertissements: ["La quantité d'huile en surface est difficile à estimer sur photo."],
    score_qualite: 75,
  },
];

interface BarcodeProduct {
  nom: string;
  marque: string;
  portionQte: number;
  portionUnite: string;
  portionLabel: string;
  kcal: number;
  p: number;
  g: number;
  l: number;
}

const BARCODE_DB: Record<string, BarcodeProduct> = {
  "3017620422003": {
    nom: "Pâte à tartiner Nutella",
    marque: "Ferrero",
    portionQte: 15,
    portionUnite: "g",
    portionLabel: "1 cuillère à soupe (15 g)",
    kcal: 81,
    p: 0.9,
    g: 8.6,
    l: 4.6,
  },
  "5449000000996": {
    nom: "Coca-Cola",
    marque: "Coca-Cola",
    portionQte: 330,
    portionUnite: "ml",
    portionLabel: "1 canette (330 ml)",
    kcal: 139,
    p: 0,
    g: 35,
    l: 0,
  },
  "7622210449283": {
    nom: "Biscuits Oreo Original",
    marque: "Mondelez",
    portionQte: 33,
    portionUnite: "g",
    portionLabel: "3 biscuits (33 g)",
    kcal: 158,
    p: 1.7,
    g: 22.1,
    l: 6.9,
  },
};

/** Codes proposés par l'UI pour simuler un scan. */
export const SAMPLE_BARCODES: { code: string; label: string }[] = [
  { code: "3017620422003", label: "Nutella 400 g" },
  { code: "5449000000996", label: "Coca-Cola 33 cl" },
  { code: "7622210449283", label: "Oreo 154 g" },
];

function exact(value: number): NutriRange {
  return { estimation: round1(value), min: round1(value), max: round1(value) };
}

function estimateFromBarcode(product: BarcodeProduct): Estimate {
  const aliment: Aliment = {
    nom: `${product.nom} — ${product.portionLabel}`,
    source_nutritionnelle: "Open Food Facts",
    quantite: {
      estimation: product.portionQte,
      min: product.portionQte,
      max: product.portionQte,
      unite: product.portionUnite,
    },
    calories: exact(product.kcal),
    macros: {
      proteines: exact(product.p),
      glucides: exact(product.g),
      lipides: exact(product.l),
    },
    confiance: 1,
    methode: "barcode",
  };
  return {
    id: uid("est"),
    total: totalFromAliments([aliment]),
    aliments: [aliment],
    avertissements: [],
    score_qualite: 96,
    depuis_cache: false,
  };
}

const FOODS_DB: Food[] = [
  { id: "f01", nom: "Poulet rôti (cuissot)", marque: null, quantite_reference: "100 g", calories: rangeAround(190, 0.05), macros: { proteines: rangeAround(29, 0.05), glucides: exact(0), lipides: rangeAround(7.5, 0.08) } },
  { id: "f02", nom: "Saumon cuit", marque: null, quantite_reference: "100 g", calories: rangeAround(208, 0.05), macros: { proteines: rangeAround(22, 0.05), glucides: exact(0), lipides: rangeAround(13, 0.08) } },
  { id: "f03", nom: "Œuf dur", marque: null, quantite_reference: "100 g", calories: rangeAround(155, 0.05), macros: { proteines: rangeAround(13, 0.05), glucides: rangeAround(1.1, 0.1), lipides: rangeAround(11, 0.08) } },
  { id: "f04", nom: "Riz blanc cuit", marque: null, quantite_reference: "100 g", calories: rangeAround(130, 0.05), macros: { proteines: rangeAround(2.7, 0.08), glucides: rangeAround(28, 0.05), lipides: rangeAround(0.3, 0.1) } },
  { id: "f05", nom: "Pâtes cuites", marque: null, quantite_reference: "100 g", calories: rangeAround(140, 0.05), macros: { proteines: rangeAround(5, 0.08), glucides: rangeAround(27, 0.05), lipides: rangeAround(1.1, 0.1) } },
  { id: "f06", nom: "Quinoa cuit", marque: null, quantite_reference: "100 g", calories: rangeAround(120, 0.05), macros: { proteines: rangeAround(4.4, 0.08), glucides: rangeAround(21.3, 0.05), lipides: rangeAround(1.9, 0.1) } },
  { id: "f07", nom: "Avocat", marque: null, quantite_reference: "100 g", calories: rangeAround(160, 0.05), macros: { proteines: rangeAround(2, 0.08), glucides: rangeAround(8.5, 0.06), lipides: rangeAround(14.7, 0.07) } },
  { id: "f08", nom: "Banane", marque: null, quantite_reference: "100 g", calories: rangeAround(89, 0.05), macros: { proteines: rangeAround(1.1, 0.1), glucides: rangeAround(23, 0.05), lipides: rangeAround(0.3, 0.1) } },
  { id: "f09", nom: "Pomme", marque: null, quantite_reference: "100 g", calories: rangeAround(52, 0.06), macros: { proteines: rangeAround(0.3, 0.1), glucides: rangeAround(14, 0.06), lipides: rangeAround(0.2, 0.1) } },
  { id: "f10", nom: "Pain complet", marque: null, quantite_reference: "100 g", calories: rangeAround(247, 0.04), macros: { proteines: rangeAround(13, 0.06), glucides: rangeAround(41, 0.05), lipides: rangeAround(3.4, 0.1) } },
  { id: "f11", nom: "Yaourt grec nature", marque: null, quantite_reference: "100 g", calories: rangeAround(97, 0.05), macros: { proteines: rangeAround(9, 0.06), glucides: rangeAround(3.9, 0.08), lipides: rangeAround(5, 0.08) } },
  { id: "f12", nom: "Fromage blanc 0 %", marque: null, quantite_reference: "100 g", calories: rangeAround(45, 0.06), macros: { proteines: rangeAround(8, 0.06), glucides: rangeAround(3.9, 0.08), lipides: rangeAround(0.1, 0.1) } },
  { id: "f13", nom: "Amandes", marque: null, quantite_reference: "100 g", calories: rangeAround(579, 0.03), macros: { proteines: rangeAround(21, 0.05), glucides: rangeAround(22, 0.05), lipides: rangeAround(50, 0.04) } },
  { id: "f14", nom: "Beurre de cacahuète", marque: null, quantite_reference: "100 g", calories: rangeAround(588, 0.03), macros: { proteines: rangeAround(25, 0.05), glucides: rangeAround(20, 0.05), lipides: rangeAround(50, 0.04) } },
  { id: "f15", nom: "Huile d'olive", marque: null, quantite_reference: "100 ml", calories: rangeAround(884, 0.02), macros: { proteines: exact(0), glucides: exact(0), lipides: rangeAround(100, 0.02) } },
  { id: "f16", nom: "Brocoli cuit", marque: null, quantite_reference: "100 g", calories: rangeAround(35, 0.08), macros: { proteines: rangeAround(2.4, 0.08), glucides: rangeAround(7, 0.06), lipides: rangeAround(0.4, 0.1) } },
  { id: "f17", nom: "Tomate", marque: null, quantite_reference: "100 g", calories: rangeAround(18, 0.08), macros: { proteines: rangeAround(0.9, 0.1), glucides: rangeAround(3.9, 0.07), lipides: rangeAround(0.2, 0.1) } },
  { id: "f18", nom: "Lait demi-écrémé", marque: null, quantite_reference: "100 ml", calories: rangeAround(46, 0.05), macros: { proteines: rangeAround(3.3, 0.06), glucides: rangeAround(4.8, 0.06), lipides: rangeAround(1.6, 0.08) } },
  { id: "f19", nom: "Lentilles cuites", marque: null, quantite_reference: "100 g", calories: rangeAround(116, 0.05), macros: { proteines: rangeAround(9, 0.06), glucides: rangeAround(20, 0.05), lipides: rangeAround(0.4, 0.1) } },
  { id: "f20", nom: "Bœuf haché 5 % cuit", marque: null, quantite_reference: "100 g", calories: rangeAround(176, 0.05), macros: { proteines: rangeAround(26, 0.05), glucides: exact(0), lipides: rangeAround(7.5, 0.08) } },
  { id: "f21", nom: "Flocons d'avoine", marque: null, quantite_reference: "100 g", calories: rangeAround(370, 0.03), macros: { proteines: rangeAround(13, 0.05), glucides: rangeAround(60, 0.04), lipides: rangeAround(7, 0.06) } },
  { id: "f22", nom: "Tofu ferme", marque: null, quantite_reference: "100 g", calories: rangeAround(144, 0.05), macros: { proteines: rangeAround(15, 0.06), glucides: rangeAround(3, 0.08), lipides: rangeAround(8.5, 0.08) } },
];

function normalize(q: string): string {
  return q
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

export function createMockApiClient(config: ApiClientConfig = {}): ApiClient {
  const { observer, isNetworkDown } = config;
  const estimates = new Map<string, Estimate>();
  const presetSeen = new Map<number, number>();
  let photoIndex = 0;

  const log = (entry: Omit<ApiLogEntry, "id" | "at">) => {
    observer?.({ ...entry, id: uid("req"), at: Date.now() });
  };

  async function guardNetwork(): Promise<void> {
    if (isNetworkDown?.()) {
      throw new NetworkError();
    }
  }

  return {
    mode: "mock",

    async createEstimate(input: EstimatePhotoInput): Promise<Estimate> {
      const started = Date.now();
      const path = "/api/v1/estimates";
      await guardNetwork();
      await sleep(jitter(1600, 900));
      // Astuce de démo : si l'image s'appelle "sample:xxx" (preview web),
      // le preset correspondant est choisi pour rester cohérent avec la photo.
      let fileName = "";
      if (typeof File !== "undefined" && input.image instanceof File) fileName = input.image.name;
      else if (!(input.image instanceof Blob)) fileName = input.image.name ?? "";
      const sampleMatch = /^sample:(\w+)/.exec(fileName);
      let idx = sampleMatch ? PRESET_KEYS.indexOf(sampleMatch[1]) : -1;
      if (idx < 0) {
        idx = photoIndex % PHOTO_PRESETS.length;
        photoIndex += 1;
      }
      const seen = (presetSeen.get(idx) ?? 0) + 1;
      presetSeen.set(idx, seen);
      const preset = PHOTO_PRESETS[idx];
      const aliments = preset.seeds.map(alimentFromSeed);
      const estimate: Estimate = {
        id: uid("est"),
        total: totalFromAliments(aliments),
        aliments,
        avertissements:
          input.diametre_assiette_cm != null
            ? preset.avertissements.filter((a) => !a.includes("diamètre"))
            : preset.avertissements,
        score_qualite: preset.score_qualite,
        depuis_cache: seen > 1,
      };
      estimates.set(estimate.id, estimate);
      log({ method: "POST", path, outcome: "ok", status: 201, ms: Date.now() - started, detail: `id=${estimate.id}` });
      return estimate;
    },

    async getEstimate(id: string): Promise<Estimate> {
      const started = Date.now();
      const path = `/api/v1/estimates/${id}`;
      await guardNetwork();
      await sleep(jitter(250, 250));
      const found = estimates.get(id);
      if (!found) {
        log({ method: "GET", path, outcome: "http_error", status: 404, ms: Date.now() - started });
        throw new ApiError(404, "estimation_introuvable", "Cette estimation n'existe plus.");
      }
      log({ method: "GET", path, outcome: "ok", status: 200, ms: Date.now() - started });
      return found;
    },

    async createBarcodeEstimate(code: string): Promise<Estimate> {
      const started = Date.now();
      const path = "/api/v1/estimates/barcode";
      await guardNetwork();
      if (!/^\d{8,14}$/.test(code)) {
        await sleep(200);
        log({ method: "POST", path, outcome: "http_error", status: 400, ms: Date.now() - started });
        throw new ApiError(400, "code_invalide", "Le code doit contenir entre 8 et 14 chiffres.");
      }
      await sleep(jitter(900, 500));
      const product = BARCODE_DB[code];
      if (!product) {
        log({ method: "POST", path, outcome: "http_error", status: 404, ms: Date.now() - started, detail: `code=${code}` });
        throw new ApiError(404, "produit_introuvable", `Aucun produit trouvé pour le code ${code}.`);
      }
      const estimate = estimateFromBarcode(product);
      estimates.set(estimate.id, estimate);
      log({ method: "POST", path, outcome: "ok", status: 200, ms: Date.now() - started, detail: product.nom });
      return estimate;
    },

    async searchFoods(params: SearchFoodsParams): Promise<FoodPage> {
      const started = Date.now();
      const limit = params.limit ?? 12;
      const offset = params.offset ?? 0;
      const path = `/api/v1/foods?q=${encodeURIComponent(params.q)}&limit=${limit}&offset=${offset}`;
      await guardNetwork();
      await sleep(jitter(350, 300));
      const q = normalize(params.q);
      const filtered = q
        ? FOODS_DB.filter((f) => normalize(f.nom).includes(q) || (f.marque && normalize(f.marque).includes(q)))
        : FOODS_DB;
      const page: FoodPage = {
        aliments: filtered.slice(offset, offset + limit),
        total: filtered.length,
        limit,
        offset,
      };
      log({ method: "GET", path, outcome: "ok", status: 200, ms: Date.now() - started, detail: `${page.aliments.length}/${page.total}` });
      return page;
    },

    async healthz(): Promise<HealthStatus> {
      const started = Date.now();
      await guardNetwork();
      await sleep(180);
      log({ method: "GET", path: "/api/v1/healthz", outcome: "ok", status: 200, ms: Date.now() - started });
      return { status: "ok" };
    },
  };
}
