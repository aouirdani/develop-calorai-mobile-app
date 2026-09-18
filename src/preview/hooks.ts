/**
 * Hooks de la preview : abonnements aux stores partagés + utilitaires async.
 */
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { ApiLogEntry } from "../../mobile/services/api";
import type { AppState } from "../../mobile/types/app";
import { appStore, getApi, getEnv, getLogs, subscribeEnv, subscribeLogs } from "./env";

export function useApp(): AppState {
  return useSyncExternalStore(appStore.subscribe, () => appStore.getState());
}

export function useEnv() {
  return useSyncExternalStore(subscribeEnv, () => getEnv());
}

export function useLogs(): ApiLogEntry[] {
  return useSyncExternalStore(subscribeLogs, () => getLogs());
}

export function useDebouncedValue<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export interface AsyncState<T> {
  status: "idle" | "loading" | "success" | "error";
  data: T | null;
  error: Error | null;
  retry(): void;
}

/** Exécute une promesse à chaque changement de `deps`, avec retry. */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [status, setStatus] = useState<AsyncState<T>["status"]>("loading");
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [tick, setTick] = useState(0);
  const seq = useRef(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    const id = ++seq.current;
    setStatus("loading");
    setError(null);
    fnRef
      .current()
      .then((result) => {
        if (id !== seq.current) return;
        setData(result);
        setStatus("success");
      })
      .catch((e: unknown) => {
        if (id !== seq.current) return;
        setError(e instanceof Error ? e : new Error(String(e)));
        setStatus("error");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const retry = useCallback(() => setTick((t) => t + 1), []);
  return { status, data, error, retry };
}

export function useNow(intervalMs: number): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

export { appStore, getApi };
