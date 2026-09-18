/**
 * Le téléphone : châssis, status bar, routeur (simule Expo Router —
 * Stack au-dessus de Tabs), barre d'onglets avec bouton scan central.
 */
import { useEffect, useMemo, useState } from "react";
import { Icon, type IconName } from "./Icon";
import { NavContext, RouteContext, DirContext, ToastProvider, type Nav, type Route, type TabKey } from "./shell";
import { appStore } from "./env";
import { useApp, useNow } from "./hooks";
import { cn } from "../utils/cn";
import { OnboardingScreen } from "./screens/Onboarding";
import { HomeScreen } from "./screens/Home";
import { DiaryScreen } from "./screens/Diary";
import { FoodsScreen } from "./screens/Foods";
import { ProfileScreen } from "./screens/Profile";
import { ScanScreen } from "./screens/Scan";
import { BarcodeScreen } from "./screens/Barcode";
import { AnalysisScreen } from "./screens/Analysis";
import { ResultScreen } from "./screens/Result";

function RouteView({ route }: { route: Route }) {
  switch (route.name) {
    case "onboarding":
      return <OnboardingScreen />;
    case "scan":
      return <ScanScreen />;
    case "barcode":
      return <BarcodeScreen />;
    case "analysis":
      return <AnalysisScreen />;
    case "result":
      return <ResultScreen />;
    case "tabs":
      switch (route.tab) {
        case "today":
          return <HomeScreen />;
        case "journal":
          return <DiaryScreen />;
        case "foods":
          return <FoodsScreen />;
        case "profil":
          return <ProfileScreen />;
      }
  }
}

function isDarkRoute(route: Route): boolean {
  return route.name === "scan" || route.name === "barcode" || route.name === "analysis";
}

function StatusBar({ dark }: { dark: boolean }) {
  const now = useNow(15_000);
  return (
    <div className={cn("relative z-30 flex h-[44px] shrink-0 items-center justify-between px-7", dark ? "text-white" : "text-ink")}>
      <span className="tnum text-[13.5px] font-bold">
        {now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
      </span>
      <span className="flex items-center gap-1.5">
        <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor" aria-hidden>
          <rect x="0" y="7" width="3" height="4" rx="1" />
          <rect x="4.5" y="5" width="3" height="6" rx="1" />
          <rect x="9" y="2.5" width="3" height="8.5" rx="1" />
          <rect x="13.5" y="0" width="3" height="11" rx="1" />
        </svg>
        <svg width="16" height="11" viewBox="0 0 16 11" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden>
          <path d="M1.5 4a10 10 0 0 1 13 0" />
          <path d="M4 7a6.2 6.2 0 0 1 8 0" />
          <path d="M8 10h.01" strokeWidth="2.4" />
        </svg>
        <svg width="25" height="12" viewBox="0 0 25 12" fill="none" aria-hidden>
          <rect x="0.7" y="0.7" width="20" height="10.6" rx="3" stroke="currentColor" strokeOpacity="0.45" strokeWidth="1.2" />
          <rect x="2.6" y="2.6" width="13" height="6.8" rx="1.6" fill="currentColor" />
          <path d="M22.8 4v4a2.2 2.2 0 0 0 0-4z" fill="currentColor" fillOpacity="0.45" />
        </svg>
      </span>
    </div>
  );
}

function TabBar({ tab, nav }: { tab: TabKey | null; nav: Nav }) {
  const items: { key: TabKey; icon: IconName; label: string }[] = [
    { key: "today", icon: "home", label: "Aujourd'hui" },
    { key: "journal", icon: "journal", label: "Journal" },
    { key: "foods", icon: "search", label: "Aliments" },
    { key: "profil", icon: "user", label: "Profil" },
  ];
  const renderItem = (item: (typeof items)[number]) => {
    const active = tab === item.key;
    return (
      <button
        key={item.key}
        onClick={() => nav.goTabs(item.key)}
        className="flex flex-1 flex-col items-center gap-0.5 py-1 transition-transform active:scale-90"
      >
        <Icon name={item.icon} size={21} strokeWidth={active ? 2.4 : 2} className={active ? "text-pine" : "text-faint"} />
        <span className={cn("text-[10px] font-bold", active ? "text-pine" : "text-faint")}>{item.label}</span>
      </button>
    );
  };

  return (
    <div className="relative z-30 shrink-0 border-t border-cardline bg-card/95 px-2 pb-5 pt-1.5 backdrop-blur">
      <div className="flex items-center">
        {renderItem(items[0])}
        {renderItem(items[1])}
        {/* Bouton scan central */}
        <div className="flex flex-1 justify-center">
          <button
            onClick={() => nav.push({ name: "scan" })}
            aria-label="Scanner un repas"
            className="-mt-8 flex h-[62px] w-[62px] items-center justify-center rounded-full border-4 border-paper bg-pine-2 text-lime-glow shadow-[0_10px_24px_-6px_rgba(14,46,31,0.55)] transition-all hover:bg-pine-3 active:scale-90"
          >
            <Icon name="camera" size={25} />
          </button>
        </div>
        {renderItem(items[2])}
        {renderItem(items[3])}
      </div>
    </div>
  );
}

export function Phone() {
  const { onboarding_done } = useApp();
  const [stack, setStack] = useState<Route[]>(() => [
    onboarding_done ? { name: "tabs", tab: "today" } : { name: "onboarding" },
  ]);
  const [dir, setDir] = useState<"push" | "pop" | "tab">("push");

  /* Garde onboarding (équivalent du redirect Expo Router). */
  useEffect(() => {
    setStack((s) => {
      const top = s[s.length - 1];
      if (!onboarding_done && top?.name !== "onboarding") return [{ name: "onboarding" }];
      if (onboarding_done && top?.name === "onboarding") return [{ name: "tabs", tab: "today" }];
      return s;
    });
  }, [onboarding_done]);

  const nav: Nav = useMemo(
    () => ({
      push: (r) => {
        setDir("push");
        setStack((s) => [...s, r]);
      },
      pop: () => {
        setDir("pop");
        setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
      },
      replace: (r) => {
        setDir("push");
        setStack((s) => [...s.slice(0, -1), r]);
      },
      goTabs: (tab: TabKey = "today") => {
        setDir("tab");
        setStack([{ name: "tabs", tab }]);
      },
      goOnboarding: () => {
        setDir("push");
        setStack([{ name: "onboarding" }]);
      },
    }),
    []
  );

  const route = stack[stack.length - 1];
  const dark = isDarkRoute(route);
  const tab = route.name === "tabs" ? route.tab : null;

  return (
    <div className="relative mx-auto w-full max-w-[392px]">
      {/* Châssis */}
      <div className="relative rounded-[54px] border border-shell-600 bg-gradient-to-b from-shell-700 to-shell-800 p-[9px] shadow-[0_50px_100px_-30px_rgba(0,0,0,0.8),0_0_0_1px_rgba(200,241,105,0.05)]">
        {/* Boutons latéraux */}
        <span className="absolute -left-[2.5px] top-[120px] h-8 w-[3px] rounded-l bg-shell-500" />
        <span className="absolute -left-[2.5px] top-[170px] h-14 w-[3px] rounded-l bg-shell-500" />
        <span className="absolute -right-[2.5px] top-[150px] h-20 w-[3px] rounded-r bg-shell-500" />
        <div className="relative h-[780px] overflow-hidden rounded-[45px] bg-paper">
          {/* Dynamic island */}
          <div className="pointer-events-none absolute left-1/2 top-[11px] z-40 h-[27px] w-[98px] -translate-x-1/2 rounded-full bg-shell-950" />
          <NavContext.Provider value={nav}>
            <ToastProvider>
              <div className="flex h-full flex-col">
                <StatusBar dark={dark} />
                <div className="relative min-h-0 flex-1">
                  <RouteContext.Provider value={route}>
                    <DirContext.Provider value={dir}>
                      <div key={stack.length + route.name + (route.name === "tabs" ? route.tab : "")} className="absolute inset-0">
                        <RouteView route={route} />
                      </div>
                    </DirContext.Provider>
                  </RouteContext.Provider>
                </div>
                {tab ? <TabBar tab={tab} nav={nav} /> : null}
                {/* Home indicator */}
                <div className={cn("flex shrink-0 justify-center pb-2 pt-1", dark || tab ? "bg-card" : "bg-transparent", dark && "bg-shell-900")}>
                  <span className={cn("h-[5px] w-[130px] rounded-full", dark ? "bg-white/35" : "bg-ink/25")} />
                </div>
              </div>
            </ToastProvider>
          </NavContext.Provider>
        </div>
      </div>
    </div>
  );
}

export type { Route };
export { appStore };
