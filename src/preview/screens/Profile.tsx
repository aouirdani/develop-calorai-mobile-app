/**
 * Profil — objectifs, unités, permissions, configuration API (environnement),
 * confidentialité, version. (Miroir de mobile/app/(tabs)/profil.tsx)
 */
import { useEffect, useState } from "react";
import { API_PATH_PREFIX, APP_VERSION, MACRO_KEYS, MACRO_META } from "../../../mobile/constants/nutrition";
import { Icon } from "../Icon";
import { appStore, setEnv } from "../env";
import { useApp, useEnv } from "../hooks";
import { useNav, useToast } from "../shell";
import { Screen } from "../ui";
import { cn } from "../../utils/cn";

function SectionTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-2.5 mt-6 flex items-baseline justify-between first:mt-0">
      <h2 className="font-display text-[16px] font-extrabold tracking-tight text-ink">{title}</h2>
      {hint ? <span className="font-mono text-[10.5px] font-medium text-faint">{hint}</span> : null}
    </div>
  );
}

function NumField({ label, value, onChange, suffix }: { label: string; value: string; onChange: (v: string) => void; suffix?: string }) {
  return (
    <label className="block">
      <span className="text-[11.5px] font-bold text-ink-2">{label}</span>
      <span className="mt-1 flex items-center rounded-[14px] border border-cardline bg-field px-3.5">
        <input
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^\d.,]/g, ""))}
          className="tnum w-full bg-transparent py-3 text-[15px] font-bold text-ink outline-none"
        />
        {suffix ? <span className="text-[12.5px] font-bold text-mut">{suffix}</span> : null}
      </span>
    </label>
  );
}

export function ProfileScreen() {
  const state = useApp();
  const env = useEnv();
  const toast = useToast();
  const nav = useNav();

  const [calories, setCalories] = useState(String(state.goals.calories));
  const [macros, setMacros] = useState({
    proteines: String(state.goals.proteines),
    glucides: String(state.goals.glucides),
    lipides: String(state.goals.lipides),
  });
  const [poids, setPoids] = useState(state.profile.poids_kg != null ? String(state.profile.poids_kg) : "");
  const [taille, setTaille] = useState(state.profile.taille_cm != null ? String(state.profile.taille_cm) : "");
  const [camGranted, setCamGranted] = useState(true);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    if (!confirmReset) return;
    const t = setTimeout(() => setConfirmReset(false), 2500);
    return () => clearTimeout(t);
  }, [confirmReset]);

  const num = (v: string) => Number(v.replace(",", "."));

  const saveGoals = () => {
    appStore.setGoals({
      calories: Number.isFinite(num(calories)) && num(calories) > 0 ? num(calories) : state.goals.calories,
      proteines: Number.isFinite(num(macros.proteines)) ? num(macros.proteines) : state.goals.proteines,
      glucides: Number.isFinite(num(macros.glucides)) ? num(macros.glucides) : state.goals.glucides,
      lipides: Number.isFinite(num(macros.lipides)) ? num(macros.lipides) : state.goals.lipides,
    });
    appStore.setProfile({ poids_kg: poids ? num(poids) : null, taille_cm: taille ? num(taille) : null });
    toast("Objectifs enregistrés");
  };

  return (
    <Screen padded={false} className="overflow-y-auto no-scrollbar">
      <div className="px-5 pb-9 pt-4">
        <h1 className="mb-1 font-display text-[24px] font-extrabold tracking-tight text-ink">Profil</h1>

        <SectionTitle title="Objectifs nutritionnels" />
        <div className="rounded-[24px] border border-cardline bg-card p-4">
          <NumField label="Calories (kcal / jour)" value={calories} onChange={setCalories} suffix="kcal" />
          <div className="mt-3">
            {MACRO_KEYS.map((k) => (
              <div key={k} className="mb-3 last:mb-0">
                <NumField
                  label={`${MACRO_META[k].label} (g / jour)`}
                  value={macros[k]}
                  onChange={(v) => setMacros((m) => ({ ...m, [k]: v }))}
                  suffix="g"
                />
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <NumField label="Poids (facultatif)" value={poids} onChange={setPoids} suffix="kg" />
            <NumField label="Taille (facultatif)" value={taille} onChange={setTaille} suffix="cm" />
          </div>
          <button
            onClick={saveGoals}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-[16px] bg-pine py-3.5 text-[14.5px] font-extrabold text-[#F4F8EE] transition-all hover:bg-pine-2 active:scale-[0.98]"
          >
            <Icon name="check" size={15} strokeWidth={3} /> Enregistrer les objectifs
          </button>
        </div>

        <SectionTitle title="Préférences" />
        <div className="rounded-[24px] border border-cardline bg-card p-4">
          <p className="mb-2 text-[11.5px] font-bold text-ink-2">Unités</p>
          <div className="grid grid-cols-2 gap-2">
            {(["metrique", "imperial"] as const).map((u) => (
              <button
                key={u}
                onClick={() => appStore.setPrefs({ unites: u })}
                className={cn(
                  "rounded-[14px] border py-3 text-[13px] font-bold transition-all active:scale-[0.97]",
                  state.prefs.unites === u ? "border-pine bg-pine-soft text-pine-3" : "border-cardline bg-field text-mut"
                )}
              >
                {u === "metrique" ? "Métrique (g, kg)" : "Impérial (oz, lb)"}
              </button>
            ))}
          </div>
        </div>

        <SectionTitle title="Permissions" />
        <div className="flex items-center justify-between rounded-[24px] border border-cardline bg-card p-4">
          <div>
            <p className="text-[14.5px] font-extrabold text-ink">Caméra</p>
            <p className="mt-0.5 text-[12px] font-medium text-mut">
              {camGranted ? "Autorisée" : "Refusée — réglable dans les paramètres système"}
            </p>
          </div>
          <button
            onClick={() => setCamGranted((v) => !v)}
            className={cn("rounded-[14px] border px-4 py-2.5 text-[13px] font-bold transition-all active:scale-95", camGranted ? "border-cardline bg-field text-ink-2" : "border-pine bg-pine text-[#F4F8EE]")}
          >
            {camGranted ? "Révoquer" : "Demander"}
          </button>
        </div>

        <SectionTitle title="API CalorieVision" hint={API_PATH_PREFIX} />
        <div className="rounded-[24px] border border-cardline bg-card p-4">
          <div className="grid grid-cols-2 gap-2">
            {(["mock", "calorie_vision"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setEnv({ mode: m })}
                className={cn(
                  "rounded-[14px] border py-3 text-[12.5px] font-extrabold transition-all active:scale-[0.97]",
                  env.mode === m ? "border-pine bg-pine text-[#F4F8EE]" : "border-cardline bg-field text-mut"
                )}
              >
                {m === "mock" ? "MockApiClient" : "Backend réel"}
              </button>
            ))}
          </div>
          <label className="mt-3 block">
            <span className="text-[11.5px] font-bold text-ink-2">Base URL du backend</span>
            <input
              value={env.baseUrl}
              onChange={(e) => setEnv({ baseUrl: e.target.value })}
              placeholder="http://localhost:8000"
              className="mt-1 w-full rounded-[14px] border border-cardline bg-field px-3.5 py-3 font-mono text-[12.5px] font-medium text-ink outline-none focus:border-pine/50"
            />
          </label>
          <label className="mt-2.5 block">
            <span className="text-[11.5px] font-bold text-ink-2">Token (futur flux d'authentification — SecureStore côté appareil)</span>
            <input
              type="password"
              value={env.token}
              onChange={(e) => setEnv({ token: e.target.value })}
              placeholder="jamais de clé privée en dur"
              className="mt-1 w-full rounded-[14px] border border-cardline bg-field px-3.5 py-3 font-mono text-[12.5px] font-medium text-ink outline-none focus:border-pine/50"
            />
          </label>
          <button
            onClick={() => setEnv({ offline: !env.offline })}
            className="mt-3 flex w-full items-center justify-between rounded-[14px] border border-cardline bg-field px-3.5 py-3"
          >
            <span className="flex items-center gap-2 text-[13px] font-bold text-ink-2">
              <Icon name="wifiOff" size={14.5} className={env.offline ? "text-danger" : "text-faint"} /> Simuler une panne réseau
            </span>
            <span className={cn("relative h-6 w-11 rounded-full transition-colors", env.offline ? "bg-danger" : "bg-cardline-2")}>
              <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", env.offline ? "left-[22px]" : "left-0.5")} />
            </span>
          </button>
          <p className="mt-3 text-[11.5px] leading-5 text-faint">
            Sans base URL en production, l'app mobile bascule automatiquement sur le mock (EXPO_PUBLIC_CALORIEVISION_URL dans .env local, jamais commité).
          </p>
        </div>

        <SectionTitle title="Confidentialité" />
        <div className="rounded-[24px] border border-cardline bg-card p-4">
          <p className="flex items-start gap-2.5 text-[12.5px] leading-5 text-mut">
            <Icon name="shield" size={15} className="mt-0.5 shrink-0 text-pine" />
            Les photos envoyées à l'API ne servent qu'à l'estimation nutritionnelle. Journal et objectifs restent stockés localement sur l'appareil. Aucune donnée n'est partagée avec des tiers.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-2.5">
          <button
            onClick={() => {
              appStore.resetOnboarding();
              nav.goOnboarding();
            }}
            className="flex items-center justify-center gap-2 rounded-[16px] border border-cardline-2 py-3.5 text-[14px] font-bold text-ink transition-all hover:bg-card active:scale-[0.98]"
          >
            <Icon name="refresh" size={14.5} /> Revoir l'onboarding
          </button>
          <button
            onClick={() => {
              if (!confirmReset) {
                setConfirmReset(true);
                return;
              }
              appStore.resetAll();
              setConfirmReset(false);
              toast("Données réinitialisées");
            }}
            className={cn(
              "flex items-center justify-center gap-2 rounded-[16px] py-3.5 text-[14px] font-bold transition-all active:scale-[0.98]",
              confirmReset ? "bg-danger text-white" : "bg-danger-soft text-danger hover:bg-[#f0d4cc]"
            )}
          >
            <Icon name="trash" size={14.5} /> {confirmReset ? "Confirmer la suppression ?" : "Réinitialiser toutes les données"}
          </button>
        </div>

        <div className="mt-6 flex flex-col items-center gap-1">
          <p className="font-display text-[13px] font-extrabold text-faint">CalorAI {APP_VERSION}</p>
          <p className="font-mono text-[10.5px] font-medium text-faint">
            API {API_PATH_PREFIX} · contrat : calorie-vision/openapi.yaml
          </p>
        </div>
      </div>
    </Screen>
  );
}
