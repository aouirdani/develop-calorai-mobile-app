/**
 * Journal — historique par jour : sélecteur 14 jours, totaux (fourchettes),
 * détail de chaque repas. (Miroir de mobile/app/(tabs)/journal.tsx)
 */
import { useMemo, useState } from "react";
import { MACRO_KEYS, MACRO_META } from "../../../mobile/constants/nutrition";
import { addDaysKey, dayLabel, fmtEst, fmtNum, fmtRangeSub, sumTotals, todayKey } from "../../../mobile/utils/format";
import { useApp } from "../hooks";
import { useNav } from "../shell";
import { EmptyBlock, Screen } from "../ui";
import { MealRow } from "./MealRow";
import { cn } from "../../utils/cn";

export function DiaryScreen() {
  const state = useApp();
  const nav = useNav();
  const [selected, setSelected] = useState(todayKey());

  const days = useMemo(() => {
    const list: string[] = [];
    for (let i = 0; i >= -13; i--) list.push(addDaysKey(new Date(), i));
    return list;
  }, []);

  const meals = state.meals.filter((m) => m.day === selected).sort((a, b) => b.added_at.localeCompare(a.added_at));
  const total = sumTotals(meals.map((m) => m.total));
  const kcalSub = fmtRangeSub(total.calories, "kcal");

  return (
    <Screen padded={false} className="flex flex-col">
      <div className="px-5 pt-4">
        <h1 className="mb-3 font-display text-[24px] font-extrabold tracking-tight text-ink">Journal</h1>
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-3 no-scrollbar">
          {days.map((d) => {
            const count = state.meals.filter((m) => m.day === d).length;
            const active = d === selected;
            return (
              <button
                key={d}
                onClick={() => setSelected(d)}
                className={cn(
                  "min-w-[82px] shrink-0 rounded-[16px] border px-3 py-2 text-center transition-all active:scale-95",
                  active ? "border-pine bg-pine" : "border-cardline bg-card hover:border-cardline-2"
                )}
              >
                <span className={cn("block text-[12px] font-extrabold", active ? "text-[#F4F8EE]" : "text-ink-2")}>{dayLabel(d)}</span>
                <span className={cn("tnum mt-0.5 block text-[10px] font-bold", active ? "text-lime-glow" : "text-faint")}>
                  {count > 0 ? `${count} repas` : "—"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-8 no-scrollbar">
        {meals.length === 0 ? (
          <EmptyBlock
            icon="journal"
            title="Aucun repas ce jour-là"
            text="Les repas ajoutés par photo, code-barres ou recherche apparaissent ici, jour par jour."
            actionTitle="Scanner un repas"
            onAction={() => nav.push({ name: "scan" })}
          />
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between rounded-[22px] border border-cardline bg-card p-4">
              <div>
                <p className="text-[10.5px] font-extrabold tracking-[0.12em] text-mut">TOTAL DU JOUR</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="tnum font-display text-[24px] font-extrabold text-ink">{fmtEst(total.calories)}</span>
                  <span className="text-[12.5px] font-bold text-mut">/ {fmtNum(state.goals.calories)} kcal</span>
                  {kcalSub ? <span className="tnum rounded-full bg-field px-2 py-0.5 text-[10px] font-bold text-mut">{kcalSub}</span> : null}
                </div>
              </div>
              <div className="flex flex-col items-end gap-0.5">
                {MACRO_KEYS.map((k) => (
                  <span key={k} className="tnum text-[12px] font-extrabold" style={{ color: MACRO_META[k].color }}>
                    {MACRO_META[k].short} {fmtNum(total[k].estimation)} g
                  </span>
                ))}
              </div>
            </div>
            <div className="space-y-2.5">
              {meals.map((m) => (
                <MealRow key={m.id} meal={m} />
              ))}
            </div>
          </>
        )}
      </div>
    </Screen>
  );
}
