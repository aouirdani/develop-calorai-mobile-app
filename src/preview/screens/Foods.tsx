/**
 * Aliments — GET /api/v1/foods?q=…&limit&offset : recherche débouncée,
 * pagination infinie, états chargement/vide/erreur, ajout manuel au journal.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MACRO_KEYS, MACRO_META, SLOT_META, SLOT_ORDER } from "../../../mobile/constants/nutrition";
import { NetworkError } from "../../../mobile/services/api";
import type { Food } from "../../../mobile/types/api";
import type { MealLog, MealSlot } from "../../../mobile/types/app";
import { fmtEst, fmtNum, fmtRangeSub, scaleRange, slotForHour, todayKey, uid } from "../../../mobile/utils/format";
import { Icon } from "../Icon";
import { appStore, getApi } from "../env";
import { useDebouncedValue } from "../hooks";
import { useToast } from "../shell";
import { EmptyBlock, ErrorBlock, Screen } from "../ui";
import { cn } from "../../utils/cn";

const PAGE = 12;

function Skeleton() {
  return (
    <div className="rounded-[20px] border border-cardline bg-card p-4">
      <div className="skeleton h-3.5 w-3/5 rounded-md" />
      <div className="skeleton mt-2.5 h-3 w-2/5 rounded-md" />
    </div>
  );
}

export function FoodsScreen() {
  const toast = useToast();
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, 300);
  const [items, setItems] = useState<Food[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [selected, setSelected] = useState<Food | null>(null);
  const [grams, setGrams] = useState(100);
  const [slot, setSlot] = useState<MealSlot>(slotForHour(new Date().getHours()));
  const seqRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchPage = useCallback(async (q: string, offset: number) => {
    const id = ++seqRef.current;
    if (offset === 0) {
      setLoading(true);
      setItems([]);
      scrollRef.current?.scrollTo({ top: 0 });
    } else {
      setLoadingMore(true);
    }
    setError(null);
    try {
      const page = await getApi().searchFoods({ q, limit: PAGE, offset });
      if (id !== seqRef.current) return;
      setItems((prev) => (offset === 0 ? page.aliments : [...prev, ...page.aliments]));
      setTotal(page.total);
    } catch (e) {
      if (id === seqRef.current) setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      if (id === seqRef.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, []);

  useEffect(() => {
    void fetchPage(debounced, 0);
  }, [debounced, fetchPage]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el || loading || loadingMore || error) return;
    if (items.length < total && el.scrollTop + el.clientHeight > el.scrollHeight - 140) {
      void fetchPage(debounced, items.length);
    }
  };

  const scaled = useMemo(() => {
    if (!selected) return null;
    const f = grams / 100;
    return {
      calories: scaleRange(selected.calories, f),
      proteines: scaleRange(selected.macros.proteines, f),
      glucides: scaleRange(selected.macros.glucides, f),
      lipides: scaleRange(selected.macros.lipides, f),
    };
  }, [selected, grams]);

  const confirmAdd = () => {
    if (!selected || !scaled) return;
    const meal: MealLog = {
      id: uid("meal"),
      day: todayKey(),
      slot,
      label: selected.nom,
      source: "manuel",
      estimate_id: null,
      image: null,
      total: scaled,
      aliments: [
        {
          nom: selected.nom,
          source_nutritionnelle: "Base aliments",
          quantite: { estimation: grams, min: grams, max: grams, unite: "g" },
          calories: scaled.calories,
          macros: { proteines: scaled.proteines, glucides: scaled.glucides, lipides: scaled.lipides },
          confiance: 1,
          methode: "manuel",
        },
      ],
      added_at: new Date().toISOString(),
    };
    appStore.addMeal(meal);
    toast(`${selected.nom} ajouté au journal`);
    setSelected(null);
  };

  return (
    <Screen padded={false} className="flex flex-col">
      <div className="px-5 pt-4">
        <h1 className="mb-3 font-display text-[24px] font-extrabold tracking-tight text-ink">Aliments</h1>
        <div className="mb-3 flex items-center gap-2.5 rounded-[18px] border border-cardline bg-card px-3.5">
          <Icon name="search" size={16.5} className="shrink-0 text-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un aliment…"
            className="w-full bg-transparent py-3.5 text-[15px] font-medium text-ink outline-none placeholder:text-faint"
          />
          {query ? (
            <button onClick={() => setQuery("")} aria-label="Effacer">
              <Icon name="x" size={15} className="text-faint" />
            </button>
          ) : null}
        </div>
      </div>

      <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto px-5 pb-8 no-scrollbar">
        {loading ? (
          <div className="space-y-2.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <ErrorBlock
            title={error instanceof NetworkError ? "Hors ligne" : "Recherche impossible"}
            body={error.message}
            offline={error instanceof NetworkError}
            onRetry={() => void fetchPage(debounced, 0)}
          />
        ) : items.length === 0 ? (
          <EmptyBlock
            icon="search"
            title={`Rien pour « ${query} »`}
            text="Essayez un autre terme, ou scannez le code-barres du produit directement."
          />
        ) : (
          <>
            <p className="mb-2.5 text-[11.5px] font-bold text-faint">
              {query ? `${total} résultat${total > 1 ? "s" : ""} pour « ${query} »` : "Aliments courants · valeurs pour 100 g"}
            </p>
            <div className="space-y-2.5">
              {items.map((f) => {
                const kcalSub = fmtRangeSub(f.calories, "kcal");
                return (
                  <button
                    key={f.id}
                    onClick={() => {
                      setSelected(f);
                      setGrams(100);
                      setSlot(slotForHour(new Date().getHours()));
                    }}
                    className="flex w-full items-center gap-3 rounded-[20px] border border-cardline bg-card p-3.5 text-left transition-all hover:border-cardline-2 hover:shadow-sm active:scale-[0.985]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14.5px] font-extrabold text-ink">{f.nom}</p>
                      <p className="mt-0.5 text-[11px] font-medium text-faint">
                        {f.marque ? `${f.marque} · ` : ""}pour {f.quantite_reference}
                      </p>
                      <div className="mt-1.5 flex gap-1.5">
                        {MACRO_KEYS.map((k) => (
                          <span key={k} className="tnum rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: MACRO_META[k].soft, color: MACRO_META[k].color }}>
                            {MACRO_META[k].short} {fmtNum(f.macros[k].estimation)}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="tnum text-[15px] font-extrabold text-ink">
                        {fmtEst(f.calories)} <span className="text-[10px] font-bold text-mut">kcal</span>
                      </span>
                      {kcalSub ? <span className="tnum rounded-full bg-field px-2 py-0.5 text-[9.5px] font-bold text-mut">{kcalSub}</span> : null}
                    </div>
                  </button>
                );
              })}
            </div>
            {loadingMore ? (
              <div className="flex justify-center py-4">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-pine-soft border-t-pine" />
              </div>
            ) : null}
          </>
        )}
      </div>

      {/* Fiche d'ajout */}
      {selected && scaled ? (
        <div className="absolute inset-0 z-40 flex flex-col justify-end bg-shell-900/50" onClick={() => setSelected(null)}>
          <div className="anim-fade-up max-h-[86%] overflow-y-auto rounded-t-[30px] bg-paper p-5 pb-7 no-scrollbar" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-4 h-[5px] w-11 rounded-full bg-cardline-2" />
            <p className="font-display text-[19px] font-extrabold tracking-tight text-ink">{selected.nom}</p>
            <p className="mt-0.5 text-[12.5px] font-medium text-mut">
              Valeurs pour {selected.quantite_reference} : {fmtEst(selected.calories)} kcal
              {fmtRangeSub(selected.calories) ? ` (${fmtRangeSub(selected.calories)})` : ""}
            </p>
            <p className="mb-2 mt-4 text-[11px] font-extrabold tracking-wide text-mut">QUANTITÉ CONSOMMÉE</p>
            <div className="flex gap-2">
              {[50, 100, 150, 200].map((g) => (
                <button
                  key={g}
                  onClick={() => setGrams(g)}
                  className={cn(
                    "tnum flex-1 rounded-[14px] border py-2.5 text-[13.5px] font-bold transition-all active:scale-95",
                    grams === g ? "border-pine bg-pine text-[#F4F8EE]" : "border-cardline bg-card text-ink-2 hover:border-cardline-2"
                  )}
                >
                  {g} g
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between rounded-[18px] border border-cardline bg-card p-4">
              <div>
                <p className="tnum font-display text-[22px] font-extrabold text-ink">
                  {fmtEst(scaled.calories)} <span className="text-[12px] font-bold text-mut">kcal</span>
                </p>
                {fmtRangeSub(scaled.calories, "kcal") ? (
                  <p className="tnum mt-0.5 text-[11px] font-bold text-faint">{fmtRangeSub(scaled.calories, "kcal")}</p>
                ) : null}
              </div>
              <div className="flex flex-col items-end gap-0.5">
                {MACRO_KEYS.map((k) => (
                  <span key={k} className="tnum text-[11.5px] font-extrabold" style={{ color: MACRO_META[k].color }}>
                    {MACRO_META[k].short} {fmtNum(scaled[k].estimation)} g
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-1.5">
              {SLOT_ORDER.map((s) => (
                <button
                  key={s}
                  onClick={() => setSlot(s)}
                  className={cn(
                    "rounded-[12px] border py-2 text-[10.5px] font-bold transition-all",
                    slot === s ? "border-pine bg-pine-soft text-pine-3" : "border-cardline bg-card text-mut"
                  )}
                >
                  {SLOT_META[s].label}
                </button>
              ))}
            </div>
            <button
              onClick={confirmAdd}
              className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-[18px] bg-shell-900 py-4 text-[15.5px] font-extrabold text-[#F2F6EC] transition-all hover:bg-shell-800 active:scale-[0.98]"
            >
              <Icon name="plus" size={16} strokeWidth={2.6} className="text-lime-glow" /> Ajouter au journal
            </button>
          </div>
        </div>
      ) : null}
    </Screen>
  );
}
