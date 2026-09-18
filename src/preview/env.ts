/**
 * Câblage de la preview : mêmes briques que l'app React Native —
 * createAppStore (persistance localStorage) + createApiClient (mock ou réel).
 * Gère aussi l'environnement API (mode, baseUrl, token, offline) et le
 * journal des requêtes affiché dans la console.
 */
import { createAppStore, type AppStore } from "../../mobile/store/appStore";
import type { StorageAdapter } from "../../mobile/store/storage";
import {
  createApiClient,
  type ApiClient,
  type ApiLogEntry,
  type ApiMode,
} from "../../mobile/services/api";

const STORE_KEY = "calorai.store.v1";
const ENV_KEY = "calorai.env.v1";

/* ----- Store applicatif (journal, objectifs…) ----- */

const localStorageAdapter: StorageAdapter = {
  read: () => localStorage.getItem(STORE_KEY),
  write: (v) => localStorage.setItem(STORE_KEY, v),
};

export const appStore: AppStore = createAppStore(localStorageAdapter);
void appStore.hydrate();

/* ----- Environnement API ----- */

export interface EnvConfig {
  mode: ApiMode;
  baseUrl: string;
  token: string;
  offline: boolean;
}

function loadEnv(): EnvConfig {
  try {
    const raw = localStorage.getItem(ENV_KEY);
    if (raw) return { mode: "mock", baseUrl: "http://localhost:8000", token: "", offline: false, ...(JSON.parse(raw) as Partial<EnvConfig>) };
  } catch {
    /* valeur corrompue */
  }
  return { mode: "mock", baseUrl: "http://localhost:8000", token: "", offline: false };
}

let env: EnvConfig = loadEnv();
const envListeners = new Set<() => void>();

export function getEnv(): EnvConfig {
  return env;
}

export function setEnv(patch: Partial<EnvConfig>): void {
  env = { ...env, ...patch };
  localStorage.setItem(ENV_KEY, JSON.stringify(env));
  rebuildClient();
  envListeners.forEach((l) => l());
}

export function subscribeEnv(listener: () => void): () => void {
  envListeners.add(listener);
  return () => envListeners.delete(listener);
}

/* ----- Journal des requêtes ----- */

let logs: ApiLogEntry[] = [];
const logListeners = new Set<() => void>();

export function getLogs(): ApiLogEntry[] {
  return logs;
}

export function clearLogs(): void {
  logs = [];
  logListeners.forEach((l) => l());
}

export function subscribeLogs(listener: () => void): () => void {
  logListeners.add(listener);
  return () => logListeners.delete(listener);
}

function pushLog(entry: ApiLogEntry): void {
  logs = [entry, ...logs].slice(0, 40);
  logListeners.forEach((l) => l());
}

/* ----- Client API ----- */

let client: ApiClient = buildClient();

function buildClient(): ApiClient {
  if (env.mode === "calorie_vision") {
    return createApiClient("calorie_vision", {
      // Sans base URL, on retombe sur l'origine courante : les états
      // d'erreur HTTP se démontrent proprement.
      baseUrl: env.baseUrl.trim() || window.location.origin,
      getToken: () => (env.token.trim() ? env.token.trim() : null),
      isNetworkDown: () => env.offline,
      observer: pushLog,
    });
  }
  return createApiClient("mock", {
    isNetworkDown: () => env.offline,
    observer: pushLog,
  });
}

function rebuildClient(): void {
  client = buildClient();
}

export function getApi(): ApiClient {
  return client;
}
