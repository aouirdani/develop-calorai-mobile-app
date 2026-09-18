/**
 * Onboarding — objectif calorique, protéines, poids/taille, permission caméra.
 * Passable. (Miroir de mobile/app/onboarding.tsx)
 */
import { useState } from "react";
import { CALORIE_PRESETS, DEFAULT_GOALS, PROTEIN_PRESETS } from "../../../mobile/constants/nutrition";
import { fmtNum } from "../../../mobile/utils/format";
import { Icon } from "../Icon";
import { useToast } from "../shell";
import { appStore } from "../env";
import { Btn, Screen } from "../ui";
import { cn } from "../../utils/cn";

function Stepper({ value, onChange, step, min, max, format }: { value: number; onChange: (v: number) => void; step: number; min: number; max: number; format: (v: number) => string }) {
  const btn = "flex h-10 w-10 items-center justify-center rounded-full bg-field text-pine-3 transition-all hover:bg-pine-soft active:scale-90 disabled:opacity-30";
  return (
    <div className="flex items-center gap-4">
      <button className={btn} disabled={value <= min} onClick={() => onChange(Math.max(min, value - step))} aria-label="Diminuer">
        <Icon name="minus" size={16} strokeWidth={2.6} />
      </button>
      <span className="tnum min-w-[110px] text-center font-display text-[22px] font-extrabold text-ink">{format(value)}</span>
      <button className={btn} disabled={value >= max} onClick={() => onChange(Math.min(max, value + step))} aria-label="Augmenter">
        <Icon name="plus" size={16} strokeWidth={2.6} />
      </button>
    </div>
  );
}

function PresetChips({ presets, value, onChange, unit }: { presets: number[]; value: number; onChange: (v: number) => void; unit: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {presets.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={cn(
            "tnum rounded-full border px-3.5 py-2 text-[13.5px] font-bold transition-all active:scale-95",
            p === value ? "border-pine bg-pine text-[#F4F8EE]" : "border-cardline bg-card text-ink-2 hover:border-cardline-2"
          )}
        >
          {fmtNum(p)} {unit}
        </button>
      ))}
    </div>
  );
}

export function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [calories, setCalories] = useState(DEFAULT_GOALS.calories);
  const [proteines, setProteines] = useState(DEFAULT_GOALS.proteines);
  const [poids, setPoids] = useState("");
  const [taille, setTaille] = useState("");
  const [camGranted, setCamGranted] = useState<boolean | null>(null);
  const toast = useToast();

  const finish = () => {
    appStore.completeOnboarding({
      goals: { calories, proteines },
      profile: {
        poids_kg: poids ? Number(poids.replace(",", ".")) : null,
        taille_cm: taille ? Number(taille.replace(",", ".")) : null,
      },
    });
    toast("Bienvenue sur CalorAI");
  };

  const steps = [
    /* 0 — Bienvenue */
    <div key="s0" className="flex flex-1 flex-col justify-center">
      <div className="mb-5 flex h-[74px] w-[74px] items-center justify-center rounded-[24px] bg-pine-2 text-lime-glow shadow-lg shadow-pine-3/30">
        <Icon name="logo" size={38} strokeWidth={1.8} />
      </div>
      <h2 className="font-display text-[30px] font-extrabold leading-[1.12] tracking-tight text-ink">
        Photographiez.
        <br />
        CalorAI calcule.
      </h2>
      <p className="mt-3 text-[14.5px] leading-6 text-mut">
        Une photo de votre assiette suffit pour estimer calories, macros et portions — toujours avec leur fourchette, jamais un chiffre aveugle.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        {["Analyse photo", "Code-barres", "Fourchettes min/max"].map((t) => (
          <span key={t} className="rounded-full bg-pine-soft px-3 py-1 text-[12px] font-bold text-pine">
            {t}
          </span>
        ))}
      </div>
    </div>,

    /* 1 — Calories */
    <div key="s1" className="flex flex-1 flex-col justify-center">
      <h2 className="font-display text-[24px] font-extrabold tracking-tight text-ink">Votre objectif calorique</h2>
      <p className="mb-5 mt-2 text-[13.5px] leading-5 text-mut">CalorAI suivra vos calories restantes par rapport à ce repère quotidien.</p>
      <PresetChips presets={CALORIE_PRESETS} value={calories} onChange={setCalories} unit="kcal" />
      <div className="mt-6 flex justify-center">
        <Stepper value={calories} onChange={setCalories} step={50} min={1000} max={6000} format={(v) => `${fmtNum(v)} kcal`} />
      </div>
    </div>,

    /* 2 — Protéines + profil */
    <div key="s2" className="flex flex-1 flex-col justify-center">
      <h2 className="font-display text-[24px] font-extrabold tracking-tight text-ink">Protéines & profil</h2>
      <p className="mb-5 mt-2 text-[13.5px] leading-5 text-mut">Objectif protéines quotidien, et si vous le souhaitez, poids et taille.</p>
      <PresetChips presets={PROTEIN_PRESETS} value={proteines} onChange={setProteines} unit="g" />
      <div className="mt-5 flex justify-center">
        <Stepper value={proteines} onChange={setProteines} step={5} min={40} max={300} format={(v) => `${v} g / jour`} />
      </div>
      <div className="mt-6 grid grid-cols-2 gap-2.5">
        {[
          { label: "Poids (kg)", icon: "weight" as const, value: poids, set: setPoids },
          { label: "Taille (cm)", icon: "ruler" as const, value: taille, set: setTaille },
        ].map((f) => (
          <label key={f.label} className="rounded-[18px] border border-cardline bg-card px-4 py-3">
            <span className="flex items-center gap-1.5 text-[11.5px] font-bold text-faint">
              <Icon name={f.icon} size={13} /> {f.label} · facultatif
            </span>
            <input
              inputMode="decimal"
              value={f.value}
              onChange={(e) => f.set(e.target.value.replace(/[^\d.,]/g, ""))}
              placeholder="—"
              className="tnum mt-1 w-full bg-transparent font-display text-[20px] font-extrabold text-ink outline-none placeholder:text-faint"
            />
          </label>
        ))}
      </div>
    </div>,

    /* 3 — Caméra */
    <div key="s3" className="flex flex-1 flex-col justify-center">
      <div className="mb-5 flex h-[74px] w-[74px] items-center justify-center rounded-[24px] bg-shell-900 text-lime-glow">
        <Icon name="camera" size={32} />
      </div>
      <h2 className="font-display text-[24px] font-extrabold tracking-tight text-ink">Autoriser la caméra</h2>
      <p className="mt-2 text-[13.5px] leading-6 text-mut">
        Indispensable pour photographier vos repas et scanner les codes-barres. Les photos ne servent qu'à l'analyse nutritionnelle.
      </p>
      <div className="mt-5">
        {camGranted == null ? (
          <Btn variant="dark" icon="camera" onClick={() => setCamGranted(true)}>
            Autoriser la caméra
          </Btn>
        ) : camGranted ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-pine-soft px-3.5 py-1.5 text-[13px] font-bold text-pine">
            <Icon name="check" size={14} strokeWidth={3} /> Caméra autorisée
          </span>
        ) : (
          <span className="inline-flex rounded-full bg-warnbg px-3.5 py-1.5 text-[13px] font-bold text-warntext">
            Réglable plus tard dans Profil
          </span>
        )}
      </div>
    </div>,
  ];

  const last = steps.length - 1;

  return (
    <Screen className="flex flex-col">
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          {steps.map((_, i) => (
            <span
              key={i}
              className={cn("h-[7px] rounded-full transition-all duration-300", i === step ? "w-6 bg-pine" : "w-[7px] bg-cardline-2")}
            />
          ))}
        </div>
        <button onClick={finish} className="text-[13.5px] font-bold text-mut transition-colors hover:text-ink">
          Passer
        </button>
      </div>
      <div key={step} className="anim-slide-r flex min-h-0 flex-1 flex-col overflow-y-auto no-scrollbar">
        {steps[step]}
      </div>
      <div className="flex flex-col gap-2.5 pt-3">
        <Btn icon={step === last ? "check" : "arrow-right"} onClick={() => (step === last ? finish() : setStep(step + 1))}>
          {step === last ? "Commencer" : "Continuer"}
        </Btn>
        {step > 0 ? (
          <Btn variant="ghost" onClick={() => setStep(step - 1)} className="!py-2.5">
            Retour
          </Btn>
        ) : null}
      </div>
    </Screen>
  );
}
