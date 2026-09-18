/**
 * CalorAI — scène de présentation : l'application mobile Expo dans son
 * châssis, entourée de sa console de développement (environnement API,
 * journal des requêtes en direct, contrat openapi, architecture).
 */
import { useEffect, useState } from "react";
import { Icon, type IconName } from "./preview/Icon";
import { Phone } from "./preview/Phone";
import { clearLogs, getApi, setEnv } from "./preview/env";
import { useEnv, useLogs } from "./preview/hooks";
import { cn } from "./utils/cn";

/* ---------- Fond de scène ---------- */

function Backdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-shell-900" />
      {/* grille */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #c8f169 1px, transparent 1px), linear-gradient(to bottom, #c8f169 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />
      {/* halos dérivants */}
      <div className="anim-drift-a absolute -left-[15%] -top-[20%] h-[55vh] w-[55vh] rounded-full bg-pine/25 blur-[130px]" />
      <div className="anim-drift-b absolute -bottom-[25%] -right-[10%] h-[60vh] w-[60vh] rounded-full bg-lime-glow/10 blur-[150px]" />
      <div className="absolute left-[30%] top-[55%] h-[35vh] w-[35vh] rounded-full bg-pine-2/40 blur-[120px]" />
      {/* grain */}
      <div
        className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
      {/* vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(9,15,11,0.75))]" />
    </div>
  );
}

/* ---------- Console ---------- */

function HealthPing() {
  const env = useEnv();
  const [state, setState] = useState<{ s: "idle" | "checking" | "ok" | "error"; msg?: string }>({ s: "idle" });

  const ping = async () => {
    setState({ s: "checking" });
    try {
      const res = await getApi().healthz();
      setState({ s: "ok", msg: `status: ${res.status}` });
    } catch (e) {
      setState({ s: "error", msg: e instanceof Error ? e.message : "erreur" });
    }
  };

  useEffect(() => {
    void ping();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [env.mode, env.baseUrl, env.offline, env.token]);

  return (
    <button
      onClick={() => void ping()}
      className={cn(
        "flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11.5px] font-bold transition-all active:scale-95",
        state.s === "ok" && "border-pine/50 bg-pine/15 text-lime-soft",
        state.s === "error" && "border-danger/50 bg-danger/15 text-[#f0b4a5]",
        state.s === "checking" && "border-shell-600 bg-shell-800 text-shell-300",
        state.s === "idle" && "border-shell-600 bg-shell-800 text-shell-300"
      )}
      title="GET /api/v1/healthz"
    >
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          state.s === "ok" ? "bg-lime-glow" : state.s === "error" ? "bg-danger" : "anim-pulse-soft bg-carbs"
        )}
      />
      {state.s === "checking" ? "healthz…" : state.s === "ok" ? "healthz ok" : state.s === "error" ? "API injoignable" : "healthz"}
    </button>
  );
}

function EnvCard() {
  const env = useEnv();
  const inputCls =
    "mt-1.5 w-full rounded-[12px] border border-shell-600 bg-shell-900 px-3 py-2.5 font-mono text-[11.5px] font-medium text-shell-200 outline-none placeholder:text-shell-400 focus:border-lime-glow/50";
  return (
    <section className="rounded-[22px] border border-shell-600/80 bg-shell-800/70 p-4 backdrop-blur">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-[14.5px] font-extrabold tracking-tight text-white">
          <Icon name="sliders" size={15} className="text-lime-glow" /> Environnement API
        </h2>
        <HealthPing />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {(["mock", "calorie_vision"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setEnv({ mode: m })}
            className={cn(
              "rounded-[12px] border px-3 py-2.5 text-[12px] font-extrabold transition-all active:scale-[0.97]",
              env.mode === m
                ? "border-lime-glow/70 bg-lime-glow/15 text-lime-glow"
                : "border-shell-600 bg-shell-900 text-shell-300 hover:border-shell-500"
            )}
          >
            {m === "mock" ? "MockApiClient" : "CalorieVision"}
          </button>
        ))}
      </div>

      <label className="mt-3 block">
        <span className="text-[10.5px] font-extrabold tracking-wide text-shell-300">BASE URL · /api/v1</span>
        <input
          value={env.baseUrl}
          onChange={(e) => setEnv({ baseUrl: e.target.value })}
          placeholder="http://localhost:8000"
          disabled={env.mode === "mock"}
          className={cn(inputCls, env.mode === "mock" && "opacity-40")}
        />
      </label>
      <label className="mt-2.5 block">
        <span className="text-[10.5px] font-extrabold tracking-wide text-shell-300">TOKEN · injecté via getToken(), jamais en dur</span>
        <input
          type="password"
          value={env.token}
          onChange={(e) => setEnv({ token: e.target.value })}
          placeholder="Bearer …"
          disabled={env.mode === "mock"}
          className={cn(inputCls, env.mode === "mock" && "opacity-40")}
        />
      </label>

      <button
        onClick={() => setEnv({ offline: !env.offline })}
        className="mt-3 flex w-full items-center justify-between rounded-[12px] border border-shell-600 bg-shell-900 px-3 py-2.5 transition-colors hover:border-shell-500"
      >
        <span className="flex items-center gap-2 text-[12px] font-bold text-shell-200">
          <Icon name="wifiOff" size={14} className={env.offline ? "text-danger" : "text-shell-400"} />
          Simuler une coupure réseau
        </span>
        <span className={cn("relative h-5 w-9 rounded-full transition-colors", env.offline ? "bg-danger" : "bg-shell-600")}>
          <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all", env.offline ? "left-[18px]" : "left-0.5")} />
        </span>
      </button>
      <p className="mt-2.5 text-[10.5px] leading-4 text-shell-400">
        La bascule Mock ⇄ réel ne touche que <span className="font-mono text-shell-300">createApiClient()</span> — aucun écran n'est réécrit.
      </p>
    </section>
  );
}

function LogsCard() {
  const logs = useLogs();
  return (
    <section className="rounded-[22px] border border-shell-600/80 bg-shell-800/70 p-4 backdrop-blur">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-[14.5px] font-extrabold tracking-tight text-white">
          <span className="relative flex h-2.5 w-2.5">
            <span className="anim-pulse-soft absolute h-full w-full rounded-full bg-lime-glow" />
          </span>
          Journal des requêtes
        </h2>
        <button onClick={clearLogs} className="text-[11px] font-bold text-shell-300 transition-colors hover:text-white">
          Effacer
        </button>
      </div>
      <div className="max-h-[240px] space-y-1.5 overflow-y-auto pr-1 no-scrollbar">
        {logs.length === 0 ? (
          <p className="py-5 text-center text-[11.5px] font-medium text-shell-400">
            Les appels API de l'app apparaîtront ici en direct.
          </p>
        ) : (
          logs.map((l) => (
            <div key={l.id} className="anim-fade-up flex items-center gap-2 rounded-[10px] bg-shell-900/80 px-2.5 py-2">
              <span
                className={cn(
                  "w-11 shrink-0 rounded-md py-0.5 text-center font-mono text-[9.5px] font-bold",
                  l.method === "GET" ? "bg-fat/20 text-[#8fd0c8]" : "bg-carbs/20 text-[#ecc477]"
                )}
              >
                {l.method}
              </span>
              <span className="min-w-0 flex-1 truncate font-mono text-[10.5px] font-medium text-shell-200" title={l.path}>
                {l.path}
              </span>
              {l.outcome === "ok" ? (
                <span className="tnum shrink-0 font-mono text-[10px] font-bold text-lime-glow">{l.status}</span>
              ) : l.outcome === "http_error" ? (
                <span className="tnum shrink-0 font-mono text-[10px] font-bold text-[#ecc477]">{l.status}</span>
              ) : (
                <Icon name="wifiOff" size={11} className="shrink-0 text-danger" />
              )}
              <span className="tnum w-12 shrink-0 text-right font-mono text-[9.5px] font-medium text-shell-400">{l.ms} ms</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

const ENDPOINTS: { method: "GET" | "POST"; path: string; note: string }[] = [
  { method: "POST", path: "/estimates", note: "multipart : image, diametre_assiette_cm?, contexte?" },
  { method: "GET", path: "/estimates/{id}", note: "Estimate : total, aliments, avertissements…" },
  { method: "POST", path: "/estimates/barcode", note: "{ \"code\" : EAN 8–14 chiffres }" },
  { method: "GET", path: "/foods?q=…", note: "recherche paginée (limit / offset)" },
  { method: "GET", path: "/healthz", note: "disponibilité du service" },
];

function ContractCard() {
  return (
    <section className="rounded-[22px] border border-shell-600/80 bg-shell-800/70 p-4 backdrop-blur">
      <h2 className="mb-1 flex items-center gap-2 font-display text-[14.5px] font-extrabold tracking-tight text-white">
        <Icon name="shield" size={15} className="text-lime-glow" /> Contrat calorie-vision
      </h2>
      <p className="mb-3 font-mono text-[10px] font-medium text-shell-400">
        source de vérité : openapi.yaml · préfixe /api/v1 · rien d'inventé
      </p>
      <div className="space-y-1.5">
        {ENDPOINTS.map((e) => (
          <div key={e.path} className="rounded-[10px] bg-shell-900/80 px-2.5 py-2">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "w-11 shrink-0 rounded-md py-0.5 text-center font-mono text-[9.5px] font-bold",
                  e.method === "GET" ? "bg-fat/20 text-[#8fd0c8]" : "bg-carbs/20 text-[#ecc477]"
                )}
              >
                {e.method}
              </span>
              <span className="truncate font-mono text-[11px] font-bold text-shell-200">{e.path}</span>
            </div>
            <p className="mt-1 truncate font-mono text-[9.5px] font-medium text-shell-400">{e.note}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[10.5px] leading-4 text-shell-400">
        Chaque valeur nutritionnelle est <span className="font-mono text-lime-soft">{"{ estimation, min, max }"}</span> — l'UI affiche les
        fourchettes, jamais un nombre seul.
      </p>
    </section>
  );
}

const TREE: { icon: IconName; dir: string; role: string }[] = [
  { icon: "home", dir: "app/", role: "Expo Router — tabs, scan, analysis, result, barcode, onboarding" },
  { icon: "leaf", dir: "components/", role: "UI réutilisable : Button, RangeText, MacroMeter, MealCard…" },
  { icon: "bolt", dir: "services/api/", role: "MockApiClient ⇄ CalorieVisionApiClient (1 ligne pour basculer)" },
  { icon: "shield", dir: "types/", role: "miroir TypeScript d'openapi.yaml" },
  { icon: "target", dir: "store/ · hooks/", role: "état persisté (goals, journal) + useApiCall loading/error/retry" },
];

function ArchCard() {
  return (
    <section className="rounded-[22px] border border-shell-600/80 bg-shell-800/70 p-4 backdrop-blur">
      <h2 className="mb-3 flex items-center gap-2 font-display text-[14.5px] font-extrabold tracking-tight text-white">
        <Icon name="gallery" size={15} className="text-lime-glow" /> Architecture <span className="font-mono text-[11px] font-bold text-lime-glow">mobile/</span>
      </h2>
      <div className="space-y-2">
        {TREE.map((t) => (
          <div key={t.dir} className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] bg-shell-900 text-lime-glow">
              <Icon name={t.icon} size={13.5} />
            </span>
            <div className="min-w-0">
              <p className="font-mono text-[11px] font-bold text-shell-200">{t.dir}</p>
              <p className="text-[10.5px] leading-4 text-shell-400">{t.role}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 rounded-[12px] border border-lime-glow/20 bg-lime-glow/10 px-3 py-2 text-[10.5px] leading-4 text-lime-soft">
        Ce dossier est un projet Expo autonome : copiez-le, <span className="font-mono">npx expo start</span>. Détails dans{" "}
        <span className="font-mono">mobile/README.md</span>.
      </p>
    </section>
  );
}

/* ---------- Scène ---------- */

function Callout({ side, y, label, sub }: { side: "l" | "r"; y: string; label: string; sub: string }) {
  return (
    <div
      className={cn(
        "absolute hidden w-[210px] xl:block",
        side === "l" ? "right-full mr-7 text-right" : "left-full ml-7",
        y
      )}
    >
      <div className={cn("flex items-center gap-2.5", side === "l" ? "flex-row-reverse" : "")}>
        <span className={cn("h-px w-8 bg-shell-500", side === "l" ? "" : "")} />
        <span className="h-2 w-2 shrink-0 rounded-full border border-lime-glow/70 bg-shell-900" />
      </div>
      <p className="mt-1.5 font-mono text-[11px] font-bold text-shell-200">{label}</p>
      <p className="text-[10.5px] leading-4 text-shell-400">{sub}</p>
    </div>
  );
}

export default function App() {
  return (
    <div className="relative min-h-dvh font-sans text-shell-200">
      <Backdrop />

      <div className="relative mx-auto flex min-h-dvh max-w-[1460px] flex-col px-5 py-6 lg:px-8">
        {/* En-tête */}
        <header className="anim-fade-up mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-pine-2 text-lime-glow shadow-[0_10px_30px_-8px_rgba(200,241,105,0.35)]">
              <Icon name="logo" size={27} strokeWidth={1.8} />
            </div>
            <div>
              <h1 className="font-display text-[22px] font-extrabold leading-none tracking-tight text-white">
                CalorAI
                <span className="ml-2 align-middle rounded-full border border-lime-glow/30 bg-lime-glow/10 px-2 py-0.5 font-mono text-[9.5px] font-bold tracking-normal text-lime-glow">
                  MOBILE
                </span>
              </h1>
              <p className="mt-1.5 text-[12.5px] font-medium text-shell-300">
                Expo · React Native · TypeScript — construite autour de l'API CalorieVision
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {["expo-router v6", "SDK 54", "iOS · Android", "API /api/v1"].map((t) => (
              <span key={t} className="rounded-full border border-shell-600 bg-shell-800/80 px-3 py-1.5 font-mono text-[10.5px] font-bold text-shell-300">
                {t}
              </span>
            ))}
          </div>
        </header>

        {/* Corps */}
        <div className="flex flex-1 flex-col items-center gap-10 lg:flex-row lg:items-start lg:justify-center lg:gap-12">
          {/* Téléphone */}
          <div className="relative shrink-0">
            <Callout side="l" y="top-[14%]" label="expo-router" sub="Stack au-dessus des Tabs, deep-linking prêt" />
            <Callout side="l" y="top-[52%]" label="expo-camera" sub="capture photo, scan EAN 8–14, galerie" />
            <Callout side="r" y="top-[28%]" label="services/api/" sub="MockApiClient ⇄ CalorieVisionApiClient" />
            <Callout side="r" y="top-[66%]" label="store/" sub="goals & journal persistés — AsyncStorage" />
            <div className="anim-fade-up" style={{ animationDelay: "120ms" }}>
              <Phone />
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              {["390 × 844 · iPhone", "petits & grands écrans", "Android adaptatif", "loading · error · empty · retry"].map((t) => (
                <span key={t} className="rounded-full border border-shell-600/80 bg-shell-800/60 px-3 py-1 text-[10.5px] font-bold text-shell-300">
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Console */}
          <aside className="w-full max-w-[420px] space-y-4 lg:sticky lg:top-6 lg:max-h-[calc(100dvh-48px)] lg:overflow-y-auto lg:pr-1 lg:no-scrollbar">
            <div className="anim-fade-up flex items-center justify-between" style={{ animationDelay: "60ms" }}>
              <h2 className="font-display text-[17px] font-extrabold tracking-tight text-white">Console de développement</h2>
              <span className="flex items-center gap-1.5 rounded-full border border-lime-glow/25 bg-lime-glow/10 px-2.5 py-1 text-[10px] font-extrabold text-lime-glow">
                <span className="anim-pulse-soft h-1.5 w-1.5 rounded-full bg-lime-glow" /> LIVE
              </span>
            </div>
            <div className="anim-fade-up" style={{ animationDelay: "120ms" }}>
              <EnvCard />
            </div>
            <div className="anim-fade-up" style={{ animationDelay: "180ms" }}>
              <LogsCard />
            </div>
            <div className="anim-fade-up" style={{ animationDelay: "240ms" }}>
              <ContractCard />
            </div>
            <div className="anim-fade-up" style={{ animationDelay: "300ms" }}>
              <ArchCard />
            </div>
          </aside>
        </div>

        {/* Pied */}
        <footer className="mt-10 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-t border-shell-700 pt-5 text-center">
          <p className="text-[11px] font-medium text-shell-400">
            CalorAI · aperçu interactif — le code Expo complet vit dans <span className="font-mono text-shell-300">mobile/</span>
          </p>
          <span className="hidden text-shell-600 sm:inline">·</span>
          <p className="font-mono text-[10.5px] font-medium text-shell-400">contrat : calorie-vision/openapi.yaml</p>
        </footer>
      </div>
    </div>
  );
}
