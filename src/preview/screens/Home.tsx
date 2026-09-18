/**
 * Aujourd'hui — dashboard mobile-first (miroir de mobile/app/(tabs)/index.tsx).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { MACRO_KEYS, MACRO_META, SLOT_META, SLOT_ORDER } from "../../../mobile/constants/nutrition";
import { addRanges as addAll, dayLabelLong, fmtEst, fmtNum, todayKey } from "../../../mobile/utils/format";
import { Icon } from "../Icon";
import { getApi } from "../env";
import { useApp, useNow } from "../hooks";
import { useNav } from "../shell";
import { Card, MacroBar, RangePill, Ring, Screen } from "../ui";
import { MealRow } from "./MealRow";

export function HomeScreen() {
  const state = useApp();
  const nav = useNav();
  const now = useNow(30_000);
  const [apiStatus, setApiStatus] = useState<"checking" | "ok" | "down">("checking");
  const pingSeq = useRef(0);

  const ping = useCallback(async () => {
    const id = ++pingSeq.current;
    setApiStatus("checking");
    try {
      await getApi().healthz();
      if (id === pingSeq.current) setApiStatus("ok");
    } catch {
      if (id === pingSeq.current) setApiStatus("down");
    }
  }, []);

  useEffect(() => {
    void ping();
  }, [ping, state.prefs /* re-ping au changement d'environnement via re-render */]);

  const today = todayKey();
  const meals = state.meals.filter((m) => m.day === today).sort((a, b) => a.added_at.localeCompare(b.added_at));
  const total = {
    calories: addAll(meals.map((m) => m.total.calories)),
    proteines: addAll(meals.map((m) => m.total.proteines)),
    glucides: addAll(meals.map((m) => m.total.glucides)),
    lipides: addAll(meals.map((m) => m.total.lipides)),
  };
  const remaining = state.goals.calories - total.calories.estimation;
  const over = remaining < 0;

  return (
    <Screen className="overflow-y-auto no-scrollbar">
      {/* En-tête */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[12px] font-bold capitalize text-mut">{dayLabelLong(today)} · {now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
          <h1 className="mt-0.5 font-display text-[24px] font-extrabold tracking-tight text-ink">Aujourd'hui</h1>
        </div>
        <button
          onClick={() => void ping()}
          className="flex items-center gap-1.5 rounded-full border border-cardline bg-card px-2.5 py-1.5 transition-transform active:scale-95"
          title="Vérifier la connexion à l'API (GET /api/v1/healthz)"
        >
          <span
            className={
              "h-2 w-2 rounded-full " +
              (apiStatus === "ok" ? "bg-pine" : apiStatus === "down" ? "bg-danger" : "anim-pulse-soft bg-carbs")
            }
          />
          <span className="text-[11px] font-bold text-ink-2">
            {apiStatus === "ok" ? "API prête" : apiStatus === "down" ? "Hors ligne" : "Vérif…"}
          </span>
        </button>
      </div>

      {/* Anneau calorique */}
      <Card className="mt-4 flex flex-col items-center py-5">
        <Ring value={total.calories.estimation} goal={state.goals.calories}>
          <span className="text-[10.5px] font-extrabold tracking-[0.12em] text-mut">RESTANT</span>
          <span className={"tnum font-display text-[32px] font-extrabold leading-none " + (over ? "text-danger" : "text-ink")}>
            {fmtNum(Math.abs(remaining))}
          </span>
          <span className="text-[11px] font-bold text-mut">{over ? "kcal au-dessus" : "kcal"}</span>
        </Ring>
        <div className="mt-3 flex items-center gap-2">
          <span className="tnum text-[13.5px] font-bold text-ink-2">
            {fmtEst(total.calories)} / {fmtNum(state.goals.calories)} kcal
          </span>
          <RangePill range={total.calories} unit="kcal" />
        </div>
      </Card>

      {/* Macros */}
      <Card className="mt-3">
        {MACRO_KEYS.map((k) => (
          <MacroBar
            key={k}
            label={MACRO_META[k].label}
            range={total[k]}
            goal={state.goals[k]}
            color={MACRO_META[k].color}
            soft={MACRO_META[k].soft}
          />
        ))}
      </Card>

      {/* Actions */}
      <button
        onClick={() => nav.push({ name: "scan" })}
        className="mt-3 flex w-full items-center gap-3.5 rounded-[24px] bg-shell-900 p-4 text-left transition-all hover:bg-shell-800 active:scale-[0.985]"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-pine-2 text-lime-glow">
          <Icon name="camera" size={21} />
        </span>
        <span className="flex-1">
          <span className="block text-[16px] font-extrabold text-[#F2F6EC]">Scanner un repas</span>
          <span className="block text-[12px] font-medium text-shell-300">Photo → calories, macros, portions</span>
        </span>
        <Icon name="arrow-right" size={17} className="text-lime-glow" />
      </button>
      <div className="mt-2.5 grid grid-cols-2 gap-2.5">
        <button
          onClick={() => nav.push({ name: "barcode" })}
          className="flex items-center justify-center gap-2 rounded-[18px] border border-cardline bg-card py-3 text-[14px] font-bold text-ink transition-all hover:border-cardline-2 active:scale-[0.97]"
        >
          <Icon name="barcode" size={16.5} className="text-pine" /> Code-barres
        </button>
        <button
          onClick={() => nav.goTabs("foods")}
          className="flex items-center justify-center gap-2 rounded-[18px] border border-cardline bg-card py-3 text-[14px] font-bold text-ink transition-all hover:border-cardline-2 active:scale-[0.97]"
        >
          <Icon name="plus" size={16.5} strokeWidth={2.6} className="text-pine" /> Ajout manuel
        </button>
      </div>

      {/* Repas du jour */}
      <div className="mt-5 flex items-baseline justify-between">
        <h2 className="font-display text-[16.5px] font-extrabold tracking-tight text-ink">Repas du jour</h2>
        <span className="text-[12px] font-bold text-mut">
          {meals.length} enregistré{meals.length > 1 ? "s" : ""}
        </span>
      </div>
      {meals.length === 0 ? (
        <div className="mt-3 flex flex-col items-center rounded-[24px] border border-dashed border-cardline-2 bg-card/60 px-6 py-7 text-center">
          <Icon name="flame" size={24} className="text-faint" />
          <p className="mt-2 text-[14.5px] font-extrabold text-ink">Aucun repas aujourd'hui</p>
          <p className="mt-1 text-[12.5px] leading-5 text-mut">
            Photographiez votre assiette ou scannez un code-barres pour commencer le suivi.
          </p>
        </div>
      ) : (
        <div className="mt-3 space-y-4 pb-2">
          {SLOT_ORDER.map((slot) => {
            const slotMeals = meals.filter((m) => m.slot === slot);
            if (slotMeals.length === 0) return null;
            return (
              <div key={slot}>
                <p className="mb-2 text-[11.5px] font-extrabold tracking-wide text-mut">
                  {SLOT_META[slot].label.toUpperCase()} · {SLOT_META[slot].hours}
                </p>
                <div className="space-y-2.5">
                  {slotMeals.map((m) => (
                    <MealRow key={m.id} meal={m} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Screen>
  );
}
