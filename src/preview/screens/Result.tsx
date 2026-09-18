/**
 * Résultat — GET /api/v1/estimates/{id} : total & macros en fourchettes,
 * aliments (quantité min/max, confiance, méthode, source), avertissements,
 * score qualité, puis revue/ajustement avant ajout au journal.
 */
import { useMemo, useState } from "react";
import { MACRO_KEYS, MACRO_META, SLOT_META, SLOT_ORDER } from "../../../mobile/constants/nutrition";
import { NetworkError } from "../../../mobile/services/api";
import type { Aliment } from "../../../mobile/types/api";
import type { MealLog, MealSlot } from "../../../mobile/types/app";
import { getEstimateMeta } from "../../../mobile/utils/estimateMeta";
import {
  confidenceLabel,
  confidenceTone,
  fmtEst,
  fmtNum,
  fmtRangeSub,
  methodeLabel,
  scaleQuantite,
  scaleRange,
  slotForHour,
  todayKey,
  totalFromAliments,
  uid,
} from "../../../mobile/utils/format";
import { resolveMealImage } from "../assets";
import { Icon } from "../Icon";
import { appStore, getApi } from "../env";
import { useApp, useAsync } from "../hooks";
import { useNav, useRoute, useToast } from "../shell";
import { ErrorBlock, LoadingBlock, MacroBar, Screen } from "../ui";
import { cn } from "../../utils/cn";

const confBg: Record<string, string> = { good: "bg-pine-soft text-pine", mid: "bg-carbs-soft text-carbs", low: "bg-danger-soft text-danger" };

interface AdjustState {
  enabled: boolean;
  factor: number;
}

export function ResultScreen() {
  const nav = useNav();
  const route = useRoute();
  const state = useApp();
  const toast = useToast();
  const estimateId = route.name === "result" ? route.estimateId : "";
  const { status, data: estimate, error, retry } = useAsync(() => getApi().getEstimate(estimateId), [estimateId]);

  const [editMode, setEditMode] = useState(false);
  const [adjusts, setAdjusts] = useState<AdjustState[] | null>(null);
  const [slot, setSlot] = useState<MealSlot>(() => slotForHour(new Date().getHours()));

  const adjusted: Aliment[] | null = useMemo(() => {
    if (!estimate || !adjusts) return null;
    const list: Aliment[] = [];
    estimate.aliments.forEach((a, i) => {
      const st = adjusts[i];
      if (!st || !st.enabled) return;
      if (st.factor === 1) {
        list.push(a);
        return;
      }
      list.push({
        ...a,
        quantite: scaleQuantite(a.quantite, st.factor),
        calories: scaleRange(a.calories, st.factor),
        macros: {
          proteines: scaleRange(a.macros.proteines, st.factor),
          glucides: scaleRange(a.macros.glucides, st.factor),
          lipides: scaleRange(a.macros.lipides, st.factor),
        },
      });
    });
    return list;
  }, [estimate, adjusts]);

  const displayTotal = useMemo(() => {
    if (estimate && adjusted) return totalFromAliments(adjusted);
    return estimate?.total ?? null;
  }, [estimate, adjusted]);

  const save = () => {
    if (!estimate || !displayTotal) return;
    const aliments = adjusted ?? estimate.aliments;
    if (aliments.length === 0) return;
    const label =
      aliments.slice(0, 2).map((a) => a.nom).join(", ") + (aliments.length > 2 ? "…" : "");
    const meal: MealLog = {
      id: uid("meal"),
      day: todayKey(),
      slot,
      label,
      source: estimate.aliments[0]?.methode === "barcode" ? "barcode" : "vision",
      estimate_id: estimate.id,
      image: getEstimateMeta(estimate.id)?.image ?? null,
      total: displayTotal,
      aliments,
      added_at: new Date().toISOString(),
    };
    appStore.addMeal(meal);
    toast("Repas ajouté au journal");
    nav.goTabs("today");
  };

  if (status !== "success" || !estimate || !displayTotal) {
    return (
      <Screen>
        <Header onBack={() => nav.pop()} />
        {status === "error" ? (
          <ErrorBlock
            title={error instanceof NetworkError ? "Hors ligne" : "Résultat indisponible"}
            body={error?.message ?? ""}
            offline={error instanceof NetworkError}
            onRetry={retry}
          />
        ) : (
          <LoadingBlock label="Chargement du résultat…" />
        )}
      </Screen>
    );
  }

  const meta = getEstimateMeta(estimate.id);
  const image = resolveMealImage(meta?.image ?? null);
  const shownAliments = estimate.aliments;
  const isBarcode = estimate.aliments[0]?.methode === "barcode";

  return (
    <Screen padded={false} className="overflow-y-auto pb-[132px] no-scrollbar">
      {/* Photo d'en-tête */}
      <div className="relative h-[210px] shrink-0 bg-shell-900">
        {image ? (
          <img
            src={image}
            alt=""
            className="h-full w-full object-cover opacity-90"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-lime-glow">
            <Icon name={isBarcode ? "barcode" : "logo"} size={44} strokeWidth={1.6} />
          </div>
        )}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4 pt-3.5">
          <button
            onClick={() => nav.pop()}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-shell-900/60 text-white backdrop-blur transition-transform active:scale-90"
            aria-label="Retour"
          >
            <Icon name="chevron-left" size={17} strokeWidth={2.5} />
          </button>
          <div className="flex gap-1.5">
            {estimate.depuis_cache ? (
              <span className="rounded-full bg-shell-900/60 px-2.5 py-1 text-[10.5px] font-extrabold text-lime-glow backdrop-blur">Depuis le cache</span>
            ) : null}
            {estimate.score_qualite != null ? (
              <span className="rounded-full bg-shell-900/60 px-2.5 py-1 text-[10.5px] font-extrabold text-white backdrop-blur">
                Qualité {estimate.score_qualite}/100
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="px-5">
        {/* Total */}
        <div className="-mt-9 rounded-[26px] border border-cardline bg-card p-5 shadow-sm">
          <p className="text-[10.5px] font-extrabold tracking-[0.14em] text-mut">TOTAL ESTIMÉ</p>
          <div className="mt-1 flex items-end gap-2.5">
            <span className="tnum font-display text-[38px] font-extrabold leading-none text-ink">{fmtEst(displayTotal.calories)}</span>
            <span className="mb-1 text-[14px] font-bold text-mut">kcal</span>
            {fmtRangeSub(displayTotal.calories, "kcal") ? (
              <span className="tnum mb-1.5 rounded-full bg-lime-glow px-2.5 py-1 text-[11.5px] font-extrabold text-lime-ink">
                {fmtRangeSub(displayTotal.calories, "kcal")}
              </span>
            ) : null}
          </div>
          <div className="mt-4">
            {MACRO_KEYS.map((k) => (
              <MacroBar key={k} label={MACRO_META[k].label} range={displayTotal[k]} goal={state.goals[k]} color={MACRO_META[k].color} soft={MACRO_META[k].soft} />
            ))}
          </div>
        </div>

        {/* Avertissements */}
        {estimate.avertissements.length > 0 ? (
          <div className="mt-3 space-y-2 rounded-[22px] bg-warnbg p-4">
            {estimate.avertissements.map((a) => (
              <div key={a} className="flex items-start gap-2.5">
                <Icon name="alert" size={14} className="mt-0.5 shrink-0 text-warntext" />
                <p className="text-[12.5px] leading-[18px] text-warntext">{a}</p>
              </div>
            ))}
          </div>
        ) : null}

        {/* Aliments */}
        <div className="mb-2.5 mt-5 flex items-center justify-between">
          <h2 className="font-display text-[16.5px] font-extrabold tracking-tight text-ink">
            {isBarcode ? "Produit" : `Aliments détectés (${shownAliments.length})`}
          </h2>
          {!isBarcode ? (
            <button
              onClick={() => {
                if (!editMode && !adjusts) setAdjusts(estimate.aliments.map(() => ({ enabled: true, factor: 1 })));
                setEditMode((v) => !v);
              }}
              className="flex items-center gap-1.5 text-[13.5px] font-extrabold text-pine transition-opacity hover:opacity-70"
            >
              <Icon name="sliders" size={14} /> {editMode ? "Terminer" : "Ajuster"}
            </button>
          ) : null}
        </div>

        <div className="space-y-2.5">
          {shownAliments.map((a, i) => {
            const st = adjusts?.[i] ?? { enabled: true, factor: 1 };
            const f = st.factor;
            const quantite = f === 1 ? a.quantite : scaleQuantite(a.quantite, f);
            const kcal = f === 1 ? a.calories : scaleRange(a.calories, f);
            const qteSub = fmtRangeSub(quantite, quantite.unite);
            return (
              <div
                key={`${a.nom}_${i}`}
                className={cn("rounded-[22px] border border-cardline bg-card p-4 transition-opacity", !st.enabled && "opacity-45")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-extrabold text-ink">{a.nom}</p>
                    <p className="mt-0.5 text-[11px] font-medium text-faint">Source : {a.source_nutritionnelle}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="tnum text-[15.5px] font-extrabold text-ink">
                      {fmtEst(kcal)} <span className="text-[10.5px] font-bold text-mut">kcal</span>
                    </span>
                    {fmtRangeSub(kcal) ? (
                      <span className="tnum rounded-full bg-field px-2 py-0.5 text-[10px] font-bold text-mut">{fmtRangeSub(kcal)} kcal</span>
                    ) : null}
                  </div>
                </div>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <span className="tnum rounded-full bg-field px-2.5 py-1 text-[11px] font-bold text-ink-2">
                    {qteSub ?? `${fmtNum(quantite.estimation)} ${quantite.unite}`}
                  </span>
                  <span className={cn("tnum rounded-full px-2.5 py-1 text-[11px] font-bold", confBg[confidenceTone(a.confiance)])}>
                    Confiance {confidenceLabel(a.confiance).toLowerCase()} · {Math.round(a.confiance * 100)} %
                  </span>
                  <span className="rounded-full bg-field px-2.5 py-1 text-[11px] font-bold text-mut">{methodeLabel(a.methode)}</span>
                </div>
                <div className="mt-2 flex gap-1.5">
                  {MACRO_KEYS.map((k) => {
                    const r = f === 1 ? a.macros[k] : scaleRange(a.macros[k], f);
                    return (
                      <span key={k} className="tnum rounded-full px-2 py-0.5 text-[10.5px] font-bold" style={{ backgroundColor: MACRO_META[k].soft, color: MACRO_META[k].color }}>
                        {MACRO_META[k].short} {fmtNum(r.estimation)} g
                      </span>
                    );
                  })}
                </div>

                {editMode && adjusts ? (
                  <div className="mt-3 flex items-center justify-between border-t border-cardline pt-3">
                    <button onClick={() => setAdjusts(adjusts.map((s, j) => (j === i ? { ...s, enabled: !s.enabled } : s)))} className="flex items-center gap-2">
                      <span
                        className={cn(
                          "flex h-[22px] w-[22px] items-center justify-center rounded-[7px] border-2 transition-colors",
                          st.enabled ? "border-pine bg-pine text-white" : "border-cardline-2"
                        )}
                      >
                        {st.enabled ? <Icon name="check" size={12} strokeWidth={3.5} /> : null}
                      </span>
                      <span className="text-[12.5px] font-bold text-ink-2">Inclus</span>
                    </button>
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => setAdjusts(adjusts.map((s, j) => (j === i ? { ...s, factor: Math.max(0.5, Math.round((s.factor - 0.1) * 10) / 10) } : s)))}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-field text-pine-3 transition-transform active:scale-90"
                        aria-label="Réduire la portion"
                      >
                        <Icon name="minus" size={13} strokeWidth={2.6} />
                      </button>
                      <span className="tnum min-w-[44px] text-center text-[13px] font-extrabold text-ink">
                        × {f.toLocaleString("fr-FR", { minimumFractionDigits: 1 })}
                      </span>
                      <button
                        onClick={() => setAdjusts(adjusts.map((s, j) => (j === i ? { ...s, factor: Math.min(2, Math.round((s.factor + 0.1) * 10) / 10) } : s)))}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-field text-pine-3 transition-transform active:scale-90"
                        aria-label="Augmenter la portion"
                      >
                        <Icon name="plus" size={13} strokeWidth={2.6} />
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* Barre d'ajout */}
      <div className="absolute inset-x-0 bottom-0 z-40 border-t border-cardline bg-card/95 p-4 pb-5 backdrop-blur">
        <div className="mb-2.5 grid grid-cols-4 gap-1.5">
          {SLOT_ORDER.map((s) => (
            <button
              key={s}
              onClick={() => setSlot(s)}
              className={cn(
                "rounded-[12px] border py-2 text-[10.5px] font-bold transition-all",
                slot === s ? "border-pine bg-pine-soft text-pine-3" : "border-cardline bg-field text-mut hover:border-cardline-2"
              )}
            >
              {SLOT_META[s].label}
            </button>
          ))}
        </div>
        <button
          onClick={save}
          disabled={adjusted?.length === 0}
          className="flex w-full items-center justify-center gap-2 rounded-[18px] bg-pine py-4 text-[15.5px] font-extrabold text-[#F4F8EE] transition-all hover:bg-pine-2 active:scale-[0.98] disabled:bg-cardline-2"
        >
          <Icon name="plus" size={17} strokeWidth={2.6} />
          Ajouter au journal · {fmtEst(displayTotal.calories)} kcal
        </button>
      </div>
    </Screen>
  );
}

function Header({ onBack }: { onBack: () => void }) {
  return (
    <button
      onClick={onBack}
      className="mb-2 flex h-9 w-9 items-center justify-center rounded-full border border-cardline bg-card text-ink transition-transform active:scale-90"
      aria-label="Retour"
    >
      <Icon name="chevron-left" size={17} strokeWidth={2.5} />
    </button>
  );
}
