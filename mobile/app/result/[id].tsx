/**
 * Résultat — détail complet d'une estimation (GET /api/v1/estimates/{id}) :
 * calories & macros en fourchettes, aliments (quantité, min/max, confiance,
 * méthode, source), avertissements, score qualité. Revue/ajustement avant
 * ajout au journal (désactiver un aliment, ajuster la portion).
 */
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { appStore } from "../_layout";
import { MacroBar } from "../../components/MacroMeter";
import { Chip, ErrorState, LoadingState, Screen } from "../../components/ui";
import { errorMessage, useApiCall } from "../../hooks/useApiCall";
import { getApi } from "../../services/api/env";
import { colors, radius } from "../../constants/theme";
import { MACRO_KEYS, MACRO_META, SLOT_META, SLOT_ORDER } from "../../constants/nutrition";
import type { Aliment } from "../../types/api";
import type { MealLog, MealSlot } from "../../types/app";
import { getEstimateMeta } from "../../utils/estimateMeta";
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
} from "../../utils/format";

const confBg: Record<string, string> = { good: colors.primarySoft, mid: colors.carbsSoft, low: colors.dangerSoft };
const confFg: Record<string, string> = { good: colors.primary, mid: colors.carbs, low: colors.danger };

interface AdjustState {
  enabled: boolean;
  factor: number; // 0.5 → 2.0
}

export default function ResultScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const call = useApiCall(() => getApi().getEstimate(id));
  const [editMode, setEditMode] = useState(false);
  const [adjusts, setAdjusts] = useState<AdjustState[] | null>(null);
  const [slot, setSlot] = useState<MealSlot>(slotForHour(new Date().getHours()));

  useEffect(() => {
    void call.run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const estimate = call.data;
  const image = useMemo(() => (id ? getEstimateMeta(id)?.image ?? null : null), [id]);

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

  const saveToJournal = () => {
    if (!estimate || !displayTotal) return;
    const aliments = adjusted ?? estimate.aliments;
    if (aliments.length === 0) return;
    const label =
      aliments
        .slice(0, 2)
        .map((a) => a.nom)
        .join(", ") + (aliments.length > 2 ? "…" : "");
    const meal: MealLog = {
      id: uid("meal"),
      day: todayKey(),
      slot,
      label,
      source: estimate.aliments[0]?.methode === "barcode" ? "barcode" : "vision",
      estimate_id: estimate.id,
      image,
      total: displayTotal,
      aliments,
      added_at: new Date().toISOString(),
    };
    appStore.addMeal(meal);
    router.replace("/");
  };

  if (call.status !== "success" || !estimate || !displayTotal) {
    return (
      <Screen>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={{ width: 40, height: 40, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="chevron-back" size={20} color={colors.ink} />
          </Pressable>
        </View>
        {call.status === "error" ? (
          <ErrorState
            title={errorMessage(call.error).title}
            body={errorMessage(call.error).body}
            offline={errorMessage(call.error).offline}
            onRetry={() => void call.run()}
          />
        ) : (
          <LoadingState label="Chargement du résultat…" />
        )}
      </Screen>
    );
  }

  const kcalSub = fmtRangeSub(displayTotal.calories, "kcal");

  return (
    <Screen noPadding>
      {/* Photo d'en-tête */}
      <View style={{ height: 218, backgroundColor: colors.dark }}>
        {image ? (
          <Image source={{ uri: image }} style={{ width: "100%", height: "100%", opacity: 0.85 }} />
        ) : (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name={estimate.aliments[0]?.methode === "barcode" ? "barcode" : "nutrition"} size={44} color={colors.accent} />
          </View>
        )}
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={{ position: "absolute", top: 64, left: 20, width: 40, height: 40, borderRadius: radius.pill, backgroundColor: "rgba(13,23,18,0.55)", alignItems: "center", justifyContent: "center" }}
        >
          <Ionicons name="chevron-back" size={20} color="#F2F6EC" />
        </Pressable>
        <View style={{ position: "absolute", top: 70, right: 20, flexDirection: "row", gap: 8 }}>
          {estimate.depuis_cache ? (
            <View style={{ backgroundColor: "rgba(13,23,18,0.6)", borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5 }}>
              <Text style={{ color: colors.accent, fontSize: 11.5, fontWeight: "800" }}>Depuis le cache</Text>
            </View>
          ) : null}
          {estimate.score_qualite != null ? (
            <View style={{ backgroundColor: "rgba(13,23,18,0.6)", borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5 }}>
              <Text style={{ color: "#F2F6EC", fontSize: 11.5, fontWeight: "800" }}>Qualité {estimate.score_qualite <= 1 ? `${Math.round(estimate.score_qualite * 100)}` : Math.round(estimate.score_qualite)}/100</Text>
            </View>
          ) : null}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
        {/* Total */}
        <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.xl, padding: 18, marginTop: -34, marginBottom: 12 }}>
          <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "800", marginBottom: 4 }}>TOTAL ESTIMÉ</Text>
          <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 10 }}>
            <Text style={{ color: colors.ink, fontSize: 40, fontWeight: "800", fontVariant: ["tabular-nums"], lineHeight: 44 }}>
              {fmtEst(displayTotal.calories)}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 15, fontWeight: "700", marginBottom: 6 }}>kcal</Text>
            {kcalSub ? (
              <View style={{ backgroundColor: colors.accent, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 8 }}>
                <Text style={{ color: colors.accentInk, fontSize: 12, fontWeight: "800" }}>{kcalSub}</Text>
              </View>
            ) : null}
          </View>
          <View style={{ marginTop: 14 }}>
            {MACRO_KEYS.map((k) => (
              <MacroBar
                key={k}
                label={MACRO_META[k].label}
                range={displayTotal[k]}
                goal={appStore.getState().goals[k]}
                color={MACRO_META[k].color}
                soft={MACRO_META[k].soft}
              />
            ))}
          </View>
        </View>

        {/* Avertissements */}
        {estimate.avertissements.length > 0 ? (
          <View style={{ backgroundColor: colors.warnBg, borderRadius: radius.xl, padding: 16, marginBottom: 12, gap: 8 }}>
            {estimate.avertissements.map((a) => (
              <View key={a} style={{ flexDirection: "row", gap: 9, alignItems: "flex-start" }}>
                <Ionicons name="warning" size={15} color={colors.warnText} style={{ marginTop: 2 }} />
                <Text style={{ color: colors.warnText, fontSize: 13, lineHeight: 19, flex: 1 }}>{a}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Aliments */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <Text style={{ color: colors.ink, fontSize: 17, fontWeight: "800" }}>
            Aliments détectés ({(adjusted ?? estimate.aliments).length})
          </Text>
          <Pressable onPress={() => {
            if (!editMode && !adjusts) {
              setAdjusts(estimate.aliments.map(() => ({ enabled: true, factor: 1 })));
            }
            setEditMode((v) => !v);
          }} hitSlop={8}>
            <Text style={{ color: colors.primary, fontSize: 14, fontWeight: "800" }}>{editMode ? "Terminer" : "Ajuster"}</Text>
          </Pressable>
        </View>

        {(estimate.aliments).map((a, i) => {
          const st = adjusts?.[i] ?? { enabled: true, factor: 1 };
          const f = st.factor;
          const quantite = f === 1 ? a.quantite : scaleQuantite(a.quantite, f);
          const kcal = f === 1 ? a.calories : scaleRange(a.calories, f);
          const tone = confidenceTone(a.confiance);
          const qteSub = fmtRangeSub(quantite, quantite.unite);
          return (
            <View
              key={`${a.nom}_${i}`}
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.line,
                borderRadius: radius.xl,
                padding: 15,
                marginBottom: 10,
                opacity: st.enabled ? 1 : 0.45,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={{ color: colors.ink, fontSize: 15.5, fontWeight: "800" }}>{a.nom}</Text>
                  <Text style={{ color: colors.faint, fontSize: 11.5 }}>Source : {a.source_nutritionnelle}</Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: 4 }}>
                  <Text style={{ color: colors.ink, fontSize: 16, fontWeight: "800", fontVariant: ["tabular-nums"] }}>
                    {fmtEst(kcal)} <Text style={{ fontSize: 11, color: colors.muted }}>kcal</Text>
                  </Text>
                  {fmtRangeSub(kcal) ? <Chip color={colors.muted} bg={colors.surfaceAlt}>{fmtRangeSub(kcal)} kcal</Chip> : null}
                </View>
              </View>

              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                <Chip color={colors.inkSoft} bg={colors.field}>
                  {qteSub ?? `${fmtNum(quantite.estimation)} ${quantite.unite}`}
                </Chip>
                <Chip color={confFg[tone]} bg={confBg[tone]}>
                  Confiance {confidenceLabel(a.confiance).toLowerCase()}
                </Chip>
                <Chip color={colors.muted} bg={colors.surfaceAlt}>{methodeLabel(a.methode)}</Chip>
              </View>

              <View style={{ flexDirection: "row", gap: 6, marginTop: 8 }}>
                {MACRO_KEYS.map((k) => {
                  const r = f === 1 ? a.macros[k] : scaleRange(a.macros[k], f);
                  return (
                    <Chip key={k} color={MACRO_META[k].color} bg={MACRO_META[k].soft}>
                      {MACRO_META[k].short} {fmtNum(r.estimation)} g
                    </Chip>
                  );
                })}
              </View>

              {editMode && adjusts ? (
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.line }}>
                  <Pressable
                    onPress={() => setAdjusts(adjusts.map((s, j) => (j === i ? { ...s, enabled: !s.enabled } : s)))}
                    style={{ flexDirection: "row", alignItems: "center", gap: 7 }}
                  >
                    <View style={{ width: 22, height: 22, borderRadius: 7, borderWidth: 2, borderColor: st.enabled ? colors.primary : colors.lineStrong, backgroundColor: st.enabled ? colors.primary : "transparent", alignItems: "center", justifyContent: "center" }}>
                      {st.enabled ? <Ionicons name="checkmark" size={13} color="#F4F8EE" /> : null}
                    </View>
                    <Text style={{ color: colors.inkSoft, fontSize: 13, fontWeight: "700" }}>Inclus</Text>
                  </Pressable>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <Pressable
                      onPress={() => setAdjusts(adjusts.map((s, j) => (j === i ? { ...s, factor: Math.max(0.5, Math.round((s.factor - 0.1) * 10) / 10) } : s)))}
                      style={{ width: 32, height: 32, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt, alignItems: "center", justifyContent: "center" }}
                    >
                      <Ionicons name="remove" size={15} color={colors.primaryInk} />
                    </Pressable>
                    <Text style={{ color: colors.ink, fontSize: 13.5, fontWeight: "800", minWidth: 46, textAlign: "center" }}>
                      × {f.toLocaleString("fr-FR", { minimumFractionDigits: 1 })}
                    </Text>
                    <Pressable
                      onPress={() => setAdjusts(adjusts.map((s, j) => (j === i ? { ...s, factor: Math.min(2, Math.round((s.factor + 0.1) * 10) / 10) } : s)))}
                      style={{ width: 32, height: 32, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt, alignItems: "center", justifyContent: "center" }}
                    >
                      <Ionicons name="add" size={15} color={colors.primaryInk} />
                    </Pressable>
                  </View>
                </View>
              ) : null}
            </View>
          );
        })}
      </ScrollView>

      {/* Barre d'ajout */}
      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.line, padding: 16, paddingBottom: 26, gap: 10 }}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {SLOT_ORDER.map((s) => (
            <Pressable
              key={s}
              onPress={() => setSlot(s)}
              style={{
                flex: 1,
                borderRadius: radius.md,
                paddingVertical: 8,
                alignItems: "center",
                backgroundColor: slot === s ? colors.primarySoft : colors.field,
                borderWidth: 1,
                borderColor: slot === s ? colors.primary : colors.line,
              }}
            >
              <Text style={{ color: slot === s ? colors.primaryInk : colors.muted, fontSize: 10.5, fontWeight: "700" }}>{SLOT_META[s].label}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          onPress={saveToJournal}
          disabled={adjusted?.length === 0}
          style={({ pressed }) => [{ backgroundColor: adjusted?.length === 0 ? colors.lineStrong : colors.primary, borderRadius: radius.lg, paddingVertical: 16, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 9, opacity: pressed ? 0.9 : 1 }]}
        >
          <Ionicons name="add-circle" size={19} color="#F4F8EE" />
          <Text style={{ color: "#F4F8EE", fontSize: 16.5, fontWeight: "800" }}>
            Ajouter au journal · {fmtEst(displayTotal.calories)} kcal
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}
