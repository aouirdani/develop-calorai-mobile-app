/**
 * Navigation & toasts de la preview : contexte Nav (pile de routes),
 * Route courant, et toasts in-phone.
 */
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "./Icon";

export type TabKey = "today" | "journal" | "foods" | "profil";

export type AnalysisInput =
  | { mode: "photo"; uri: string; sampleKey?: string; diametre?: number; contexte?: string }
  | { mode: "barcode"; code: string };

export type Route =
  | { name: "onboarding" }
  | { name: "tabs"; tab: TabKey }
  | { name: "scan" }
  | { name: "barcode" }
  | { name: "analysis"; input: AnalysisInput }
  | { name: "result"; estimateId: string };

export interface Nav {
  push(route: Route): void;
  pop(): void;
  replace(route: Route): void;
  goTabs(tab?: TabKey): void;
  goOnboarding(): void;
}

export const NavContext = createContext<Nav | null>(null);
export const RouteContext = createContext<Route>({ name: "tabs", tab: "today" });
export const DirContext = createContext<"push" | "pop" | "tab">("push");

export function useNav(): Nav {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error("NavContext manquant");
  return ctx;
}

export function useRoute(): Route {
  return useContext(RouteContext);
}

export function useDir(): "push" | "pop" | "tab" {
  return useContext(DirContext);
}

/* ----- Toasts ----- */

interface Toast {
  id: number;
  message: string;
}

const ToastContext = createContext<(message: string) => void>(() => undefined);

export function useToast(): (message: string) => void {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const push = useCallback((message: string) => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2400);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none absolute inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="anim-toast flex items-center gap-2 rounded-full bg-pine-3/95 px-4 py-2.5 shadow-lg shadow-black/30"
          >
            <Icon name="check" size={14} strokeWidth={3} className="text-lime-glow" />
            <span className="text-[13px] font-bold text-[#F2F6EC]">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** Déclenche un callback quand `active` devient vrai (garde StrictMode). */
export function useOnceWhen(active: boolean, cb: () => void): void {
  const ran = useRef(false);
  useEffect(() => {
    if (active && !ran.current) {
      ran.current = true;
      cb();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
}
