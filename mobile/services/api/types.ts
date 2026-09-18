/**
 * Couche API isolée : les écrans ne parlent qu'à `ApiClient`.
 * Remplacer le mock par le backend réel = changer une ligne dans la factory.
 */
import type { Estimate, FoodPage, HealthStatus } from "../../types/api";

/** Image à envoyer en multipart : Blob (web) ou fichier local { uri } (React Native). */
export type ImageSource = Blob | { uri: string; name?: string; type?: string };

/** Champs multipart de POST /api/v1/estimates (cf. openapi.yaml). */
export interface EstimatePhotoInput {
  image: ImageSource;
  diametre_assiette_cm?: number;
  contexte?: string;
}

export interface SearchFoodsParams {
  q: string;
  limit?: number;
  offset?: number;
}

/** Erreur HTTP renvoyée par le backend (4xx/5xx). */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

/** Connexion impossible (hors ligne, DNS, CORS, serveur down…). */
export class NetworkError extends Error {
  constructor(message = "Connexion au serveur impossible. Vérifiez votre réseau.") {
    super(message);
    this.name = "NetworkError";
  }
}

/** Réponse 2xx dont le corps n'est pas le JSON attendu. */
export class InvalidResponseError extends Error {
  constructor(message = "Réponse inattendue du serveur. Réessayez dans un instant.") {
    super(message);
    this.name = "InvalidResponseError";
  }
}

/** Délai dépassé : traité comme une erreur réseau (même UI, réessai possible). */
export class TimeoutError extends NetworkError {
  constructor() {
    super("Le serveur met trop de temps à répondre. Réessayez.");
    this.name = "TimeoutError";
  }
}

export interface ApiLogEntry {
  id: string;
  at: number;
  method: "GET" | "POST";
  path: string;
  outcome: "ok" | "http_error" | "network_error";
  status: number | null;
  ms: number;
  detail?: string;
}

export type ApiObserver = (entry: ApiLogEntry) => void;

export interface ApiClientConfig {
  baseUrl?: string;
  /**
   * Le token provient d'une future couche d'authentification.
   * Jamais de clé API privée codée en dur dans l'application.
   */
  getToken?: () => string | null | Promise<string | null>;
  /**
   * Clé `X-API-Key` — DÉVELOPPEMENT LOCAL UNIQUEMENT (voir env.ts).
   * Une clé embarquée dans l'app n'est pas un secret.
   */
  apiKey?: string;
  /** Délai max d'une requête en ms (défaut 60 000 : l'analyse d'image est lente). */
  timeoutMs?: number;
  /** Observateur (journal des requêtes, debugging). */
  observer?: ApiObserver;
  /** Simule une panne réseau pour tester les états hors ligne. */
  isNetworkDown?: () => boolean;
}

export interface ApiClient {
  readonly mode: "mock" | "calorie_vision";
  /** POST /api/v1/estimates — multipart/form-data. */
  createEstimate(input: EstimatePhotoInput): Promise<Estimate>;
  /** GET /api/v1/estimates/{id} */
  getEstimate(id: string): Promise<Estimate>;
  /** POST /api/v1/estimates/barcode — { "code": "EAN 8–14 chiffres" }. */
  createBarcodeEstimate(code: string): Promise<Estimate>;
  /** GET /api/v1/foods?q=... (paginé). */
  searchFoods(params: SearchFoodsParams): Promise<FoodPage>;
  /** GET /api/v1/healthz */
  healthz(): Promise<HealthStatus>;
}
