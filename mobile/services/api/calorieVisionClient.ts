/**
 * CalorieVisionApiClient — client réel du backend `calorie-vision`.
 * Base URL + token injectés par configuration : aucune clé en dur ici.
 */
import type { Estimate, FoodPage, HealthStatus } from "../../types/api";
import { uid } from "../../utils/format";
import { toEstimate } from "./adapter";
import {
  ApiError,
  InvalidResponseError,
  NetworkError,
  TimeoutError,
  type ApiClient,
  type ApiClientConfig,
  type EstimatePhotoInput,
  type SearchFoodsParams,
} from "./types";

export interface CalorieVisionConfig extends ApiClientConfig {
  baseUrl: string;
}

const DEFAULT_TIMEOUT_MS = 60_000;

/** Messages affichables : jamais le détail brut du backend (stack, SQL, chemins…). */
function httpMessage(status: number): string {
  switch (status) {
    case 400:
      return "La requête est invalide. Reprenez la photo et réessayez.";
    case 401:
    case 403:
      return "Accès refusé : la clé ou le jeton d'API est absent ou invalide.";
    case 404:
      return "Résultat introuvable.";
    case 413:
      return "La photo est trop volumineuse (10 Mo maximum).";
    case 415:
      return "Format d'image non pris en charge (JPEG, PNG, WebP ou HEIC).";
    case 422:
      return "Photo ou paramètres non valides (diamètre d'assiette entre 5 et 50 cm).";
    case 429:
      return "Trop de requêtes. Patientez un instant puis réessayez.";
    default:
      return status >= 500
        ? "Le serveur rencontre un problème. Réessayez dans un instant."
        : `Erreur inattendue (${status}).`;
  }
}

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heic",
};

export function createCalorieVisionApiClient(config: CalorieVisionConfig): ApiClient {
  const baseUrl = config.baseUrl.replace(/\/+$/, "");

  async function request<T>(method: "GET" | "POST", path: string, init?: RequestInit): Promise<T> {
    const started = Date.now();
    if (config.isNetworkDown?.()) {
      config.observer?.({ id: uid("req"), at: Date.now(), method, path, outcome: "network_error", status: null, ms: 0 });
      throw new NetworkError();
    }
    try {
      const token = await config.getToken?.();
      const headers: Record<string, string> = { Accept: "application/json", ...(init?.headers as Record<string, string> | undefined) };
      if (config.apiKey) headers["X-API-Key"] = config.apiKey;
      if (token) headers.Authorization = `Bearer ${token}`;

      const controller = new AbortController();
      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, config.timeoutMs ?? DEFAULT_TIMEOUT_MS);
      let res: Response;
      try {
        res = await fetch(`${baseUrl}${path}`, { ...init, headers, signal: controller.signal });
      } catch (e) {
        if (timedOut) throw new TimeoutError();
        throw e;
      } finally {
        clearTimeout(timer);
      }
      const ms = Date.now() - started;

      if (!res.ok) {
        config.observer?.({ id: uid("req"), at: Date.now(), method, path, outcome: "http_error", status: res.status, ms });
        throw new ApiError(res.status, `http_${res.status}`, httpMessage(res.status));
      }

      let data: T;
      try {
        data = (await res.json()) as T;
      } catch {
        throw new InvalidResponseError();
      }
      config.observer?.({ id: uid("req"), at: Date.now(), method, path, outcome: "ok", status: res.status, ms });
      return data;
    } catch (e) {
      if (e instanceof ApiError || e instanceof InvalidResponseError) throw e;
      config.observer?.({
        id: uid("req"),
        at: Date.now(),
        method,
        path,
        outcome: "network_error",
        status: null,
        ms: Date.now() - started,
      });
      throw e instanceof NetworkError ? e : new NetworkError();
    }
  }

  return {
    mode: "calorie_vision",

    async createEstimate(input: EstimatePhotoInput): Promise<Estimate> {
      const form = new FormData();
      if (input.image instanceof Blob) {
        form.append("image", input.image, "photo.jpg");
      } else {
        const name = input.image.name ?? input.image.uri.split("/").pop()?.split("?")[0] ?? "photo.jpg";
        const ext = name.split(".").pop()?.toLowerCase() ?? "";
        // Forme spécifique React Native : le fichier est streamé depuis son uri local.
        form.append("image", {
          uri: input.image.uri,
          name,
          type: input.image.type ?? MIME_BY_EXT[ext] ?? "image/jpeg",
        } as unknown as Blob);
      }
      if (input.diametre_assiette_cm != null) {
        form.append("diametre_assiette_cm", String(input.diametre_assiette_cm));
      }
      if (input.contexte && input.contexte.trim()) {
        form.append("contexte", input.contexte.trim());
      }
      // Pas de Content-Type manuel : le runtime pose le boundary multipart.
      return toEstimate(await request<unknown>("POST", "/api/v1/estimates", { method: "POST", body: form }));
    },

    getEstimate(id: string): Promise<Estimate> {
      return request<unknown>("GET", `/api/v1/estimates/${encodeURIComponent(id)}`).then(toEstimate);
    },

    createBarcodeEstimate(code: string): Promise<Estimate> {
      return request<unknown>("POST", "/api/v1/estimates/barcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      }).then(toEstimate);
    },

    searchFoods(params: SearchFoodsParams): Promise<FoodPage> {
      const limit = params.limit ?? 12;
      const offset = params.offset ?? 0;
      return request<FoodPage>(
        "GET",
        `/api/v1/foods?q=${encodeURIComponent(params.q)}&limit=${limit}&offset=${offset}`
      );
    },

    healthz(): Promise<HealthStatus> {
      return request<HealthStatus>("GET", "/api/v1/healthz");
    },
  };
}
