/**
 * Factory de la couche API.
 *
 * Basculer du mock au backend réel se joue ICI — les écrans n'y touchent pas :
 *   createApiClient("mock")  →  createApiClient("calorie_vision", { baseUrl, getToken })
 */
import { createCalorieVisionApiClient } from "./calorieVisionClient";
import { createMockApiClient } from "./mockClient";
import type { ApiClient, ApiClientConfig } from "./types";

export type ApiMode = "mock" | "calorie_vision";

export function createApiClient(mode: ApiMode, config: ApiClientConfig = {}): ApiClient {
  if (mode === "calorie_vision") {
    if (!config.baseUrl || !config.baseUrl.trim()) {
      throw new Error("createApiClient : `baseUrl` est requis pour le mode calorie_vision.");
    }
    return createCalorieVisionApiClient({ ...config, baseUrl: config.baseUrl.trim() });
  }
  return createMockApiClient(config);
}

export { SAMPLE_BARCODES } from "./mockClient";
export {
  ApiError,
  NetworkError,
  InvalidResponseError,
  TimeoutError,
  type ApiClient,
  type ApiClientConfig,
  type ApiLogEntry,
  type ApiObserver,
  type EstimatePhotoInput,
  type ImageSource,
  type SearchFoodsParams,
} from "./types";
