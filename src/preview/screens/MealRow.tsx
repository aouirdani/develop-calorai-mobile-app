/**
 * Ligne repas réutilisable (Aujourd'hui + Journal) : photo, kcal en fourchette,
 * macros, détail des aliments dépliable, suppression.
 */
import { useState } from "react";
import { MACRO_KEYS, MACRO_META, SLOT_META } from "../../../mobile/constants/nutrition";
import type { MealLog } from "../../../mobile/types/app";
import { confidenceTone, fmtEst, fmtNum, fmtRangeSub, methodeLabel } from "../../../mobile/utils/format";
import { resolveMealImage } from "../assets";
import { Icon } from "../Icon";
import { appStore } from "../env";
import { useToast } from "../shell";
import { cn } from "../../utils/cn";

const confColor: Record<string, string> = {
  good: "bg-pine-soft text-pine",
  mid: "bg-carbs-soft text-carbs",
  low: "bg-danger-soft text-danger",
};

export function MealRow({ meal }: { meal: MealLog }) {
  const [open, setOpen] = useState(false);
  const toast = useToast();
  const img = resolveMealImage(meal.image);
  const kcalSub = fmtRangeSub(meal.total.calories, "kcal");
  const time = new Date(meal.added_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="rounded-[22px] border border-cardline bg-card p-3.5 transition-shadow hover:shadow-sm">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-3 text-left">
        {img ? (
          <img
            src={img}
            alt=""
            className="h-14 w-14 shrink-0 rounded-[14px] object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[14px] bg-pine-soft text-pine">
            <Icon name={meal.source === "barcode" ? "barcode" : meal.source === "manuel" ? "search" : "camera"} size={21} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14.5px] font-extrabold text-ink">{meal.label}</p>
          <p className="mt-0.5 text-[11.5px] font-medium text-mut">
            {SLOT_META[meal.slot].label} · {time}
          </p>
          <div className="mt-1.5 flex gap-1.5">
            {MACRO_KEYS.map((k) => (
              <span
                key={k}
                className="tnum rounded-full px-2 py-0.5 text-[10.5px] font-bold"
                style={{ backgroundColor: MACRO_META[k].soft, color: MACRO_META[k].color }}
              >
                {MACRO_META[k].short} {fmtNum(meal.total[k].estimation)}
              </span>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="tnum text-[15.5px] font-extrabold text-ink">
            {fmtEst(meal.total.calories)} <span className="text-[10.5px] font-bold text-mut">kcal</span>
          </span>
          {kcalSub ? <span className="tnum rounded-full bg-field px-2 py-0.5 text-[10px] font-bold text-mut">{kcalSub}</span> : null}
          <Icon name="chevron-down" size={14} className={cn("text-faint transition-transform duration-200", open && "rotate-180")} />
        </div>
      </button>

      {open ? (
        <div className="anim-fade-up mt-3.5 space-y-3 border-t border-cardline pt-3.5">
          {meal.aliments.map((a, i) => {
            const qteSub = fmtRangeSub(a.quantite, a.quantite.unite);
            return (
              <div key={`${a.nom}_${i}`}>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="truncate text-[13.5px] font-bold text-ink">{a.nom}</p>
                  <p className="tnum shrink-0 text-[13px] font-bold text-ink-2">{fmtEst(a.calories)} kcal</p>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <span className="tnum rounded-full bg-field px-2 py-0.5 text-[10.5px] font-bold text-ink-2">
                    {qteSub ?? `${fmtNum(a.quantite.estimation)} ${a.quantite.unite}`}
                  </span>
                  <span className={cn("tnum rounded-full px-2 py-0.5 text-[10.5px] font-bold", confColor[confidenceTone(a.confiance)])}>
                    Confiance {Math.round(a.confiance * 100)} %
                  </span>
                  <span className="rounded-full bg-field px-2 py-0.5 text-[10.5px] font-bold text-mut">{methodeLabel(a.methode)}</span>
                </div>
                <p className="mt-1 text-[10.5px] font-medium text-faint">Source : {a.source_nutritionnelle}</p>
              </div>
            );
          })}
          <button
            onClick={() => {
              appStore.removeMeal(meal.id);
              toast("Repas supprimé");
            }}
            className="flex items-center gap-1.5 text-[12.5px] font-bold text-danger transition-opacity hover:opacity-70"
          >
            <Icon name="trash" size={13.5} /> Supprimer ce repas
          </button>
        </div>
      ) : null}
    </div>
  );
}
