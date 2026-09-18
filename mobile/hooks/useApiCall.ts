/**
 * Hook générique pour tout appel API d'écran :
 * statut idle/loading/success/error + données + retry, avec annulation
 * logique des réponses obsolètes (concurrence de requêtes).
 */
import { useCallback, useRef, useState } from "react";
import { ApiError, NetworkError } from "../services/api/types";

export type ApiCallStatus = "idle" | "loading" | "success" | "error";

export interface ApiCallState<T> {
  status: ApiCallStatus;
  data: T | null;
  error: Error | null;
  run(...args: unknown[]): Promise<T | undefined>;
  reset(): void;
}

export function errorMessage(e: Error | null): { title: string; body: string; offline: boolean } {
  if (e instanceof NetworkError) {
    return { title: "Hors ligne", body: e.message, offline: true };
  }
  if (e instanceof ApiError) {
    return { title: `Erreur ${e.status}`, body: e.message, offline: false };
  }
  return { title: "Erreur inattendue", body: e?.message ?? "Réessayez dans un instant.", offline: false };
}

export function useApiCall<TArgs extends unknown[], T>(
  fn: (...args: TArgs) => Promise<T>
): {
  status: ApiCallStatus;
  data: T | null;
  error: Error | null;
  run: (...args: TArgs) => Promise<T | undefined>;
  reset: () => void;
} {
  const [status, setStatus] = useState<ApiCallStatus>("idle");
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const seq = useRef(0);

  const run = useCallback(
    async (...args: TArgs) => {
      const id = ++seq.current;
      setStatus("loading");
      setError(null);
      try {
        const result = await fn(...args);
        if (id !== seq.current) return undefined;
        setData(result);
        setStatus("success");
        return result;
      } catch (e) {
        if (id === seq.current) {
          setError(e instanceof Error ? e : new Error(String(e)));
          setStatus("error");
        }
        return undefined;
      }
    },
    [fn]
  );

  const reset = useCallback(() => {
    seq.current += 1;
    setStatus("idle");
    setData(null);
    setError(null);
  }, []);

  return { status, data, error, run, reset };
}
