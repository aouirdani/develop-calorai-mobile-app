/**
 * Configuration API côté React Native (Expo).
 *
 * - Base URL : `EXPO_PUBLIC_API_URL` (ou l'ancien alias
 *   `EXPO_PUBLIC_CALORIEVISION_URL`), fichier .env local JAMAIS commité.
 * - `EXPO_PUBLIC_USE_MOCK=true` force le mock même si une URL est définie.
 * - `EXPO_PUBLIC_API_KEY` → en-tête `X-API-Key`. ⚠️ DEV LOCAL UNIQUEMENT : toute
 *   variable `EXPO_PUBLIC_*` est embarquée en clair dans le bundle de l'app, donc
 *   lisible par n'importe qui. Ne jamais y mettre une vraie clé de production ;
 *   la prod exigera une authentification utilisateur/session ou un backend BFF.
 * - Token : lu dans expo-secure-store ; il devra provenir d'une future couche
 *   d'authentification. Ne JAMAIS coder de clé API privée en dur.
 * - Sans base URL configurée, l'app bascule sur le MockApiClient.
 */
import * as SecureStore from "expo-secure-store";
import { createApiClient, type ApiClient } from "./index";

const TOKEN_KEY = "calorai.api_token";

export async function getAuthToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

/** À réserver à la future couche d'authentification. */
export async function setAuthToken(token: string | null): Promise<void> {
  try {
    if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
    else await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    /* stockage sécurisé indisponible (simulateur) : ignorer */
  }
}

let client: ApiClient | null = null;

export function getApi(): ApiClient {
  if (!client) {
    const baseUrl = process.env.EXPO_PUBLIC_API_URL ?? process.env.EXPO_PUBLIC_CALORIEVISION_URL ?? "";
    const forceMock = process.env.EXPO_PUBLIC_USE_MOCK === "true";
    const apiKey = process.env.EXPO_PUBLIC_API_KEY?.trim();
    client =
      baseUrl.trim() && !forceMock
        ? createApiClient("calorie_vision", { baseUrl, getToken: getAuthToken, apiKey: apiKey || undefined })
        : createApiClient("mock");
  }
  return client;
}
