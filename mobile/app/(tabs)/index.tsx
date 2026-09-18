/**
 * Aujourd'hui — dashboard mobile-first :
 * anneau calorique (avec fourchette), macros vs objectifs, actions rapides,
 * repas du jour par créneau. États : chargement, vide, erreur réseau (healthz).
 */
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { getApi } from "../../services/api/env";
import { appStore } from "../_layout";
import { dayTotal, mealsForDay, useAppState } from "../../store/appStore";
import { CalorieRing, MacroBar } from "../../components/MacroMeter";
import { MealCard } from "../../components/MealCard";
import { Card, Chip, Screen, SectionTitle } from "../../components/ui";
import { MACRO_KEYS, MACRO_META, SLOT_META, SLOT_ORDER } from "../../constants/nutrition";
import { colors, radius } from "../../constants/theme";
import { dayLabelLong, fmtEst, fmtNum, fmtRangeSub, todayKey } from "../../utils/format";

export default function TodayScreen() {
  const router = useRouter();
  const state = useAppState(appStore, (s) => s);
  const [apiStatus, setApiStatus] = useState<"checking" | "ok" | "down">("checking");

  const ping = useCallback(async () => {
    setApiStatus("checking");
    try {
      await getApi().healthz();
      setApiStatus("ok");
    } catch {
      setApiStatus("down");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void ping();
    }, [ping])
  );

  const today = todayKey();
  const meals = mealsForDay(state, today).sort((a, b) => a.added_at.localeCompare(b.added_at));
  const total = dayTotal(meals);
  const remaining = state.goals.calories - total.calories.estimation;
  const kcalSub = fmtRangeSub(total.calories, "kcal");
  const over = remaining < 0;

  return (
    <Screen noPadding>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 34 }} showsVerticalScrollIndicator={false}>
        {/* En-tête */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <View>
            <Text style={{ color: colors.muted, fontSize: 13, fontWeight: "700", textTransform: "capitalize" }}>{dayLabelLong(today)}</Text>
            <Text style={{ color: colors.ink, fontSize: 24, fontWeight: "800", marginTop: 2 }}>Aujourd'hui</Text>
          </View>
          <Pressable onPress={ping} style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 6 }}>
            <View style={{ width: 8, height: 8, borderRadius: radius.pill, backgroundColor: apiStatus === "ok" ? colors.primary : apiStatus === "down" ? colors.danger : colors.carbs }} />
            <Text style={{ color: colors.inkSoft, fontSize: 12, fontWeight: "700" }}>
              {apiStatus === "ok" ? "API prête" : apiStatus === "down" ? "Hors ligne" : "Vérification…"}
            </Text>
          </Pressable>
        </View>

        {/* Anneau calorique */}
        <Card style={{ alignItems: "center", paddingVertical: 24, marginBottom: 12 }}>
          <CalorieRing consumed={total.calories} goal={state.goals.calories}>
            <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "700" }}>RESTANT</Text>
            <Text style={{ color: over ? colors.danger : colors.ink, fontSize: 34, fontWeight: "800", fontVariant: ["tabular-nums"] }}>
              {fmtNum(Math.abs(remaining))}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "700" }}>{over ? "kcal au-dessus" : "kcal"}</Text>
          </CalorieRing>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 14 }}>
            <Text style={{ color: colors.inkSoft, fontSize: 14, fontWeight: "700" }}>
              {fmtEst(total.calories)} / {fmtNum(state.goals.calories)} kcal
            </Text>
            {kcalSub ? <Chip color={colors.muted} bg={colors.surfaceAlt}>{kcalSub}</Chip> : null}
          </View>
        </Card>

        {/* Macros */}
        <Card style={{ marginBottom: 12 }}>
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
          <Text style={{ color: colors.faint, fontSize: 11.5, marginTop: -4 }}>
            Les barres utilisent l'estimation ; les fourchettes min/max sont affichées quand l'API les fournit.
          </Text>
        </Card>

        {/* Actions */}
        <View style={{ gap: 10, marginBottom: 20 }}>
          <Pressable
            onPress={() => router.push("/scan")}
            style={({ pressed }) => [
              {
                backgroundColor: colors.dark,
                borderRadius: radius.xl,
                padding: 18,
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
                transform: [{ scale: pressed ? 0.985 : 1 }],
              },
            ]}
          >
            <View style={{ width: 46, height: 46, borderRadius: 16, backgroundColor: colors.primaryDeep, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="camera" size={22} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#F2F6EC", fontSize: 17, fontWeight: "800" }}>Scanner un repas</Text>
              <Text style={{ color: colors.darkMuted, fontSize: 12.5, marginTop: 1 }}>Photo → calories, macros, portions</Text>
            </View>
            <Ionicons name="arrow-forward" size={18} color={colors.accent} />
          </Pressable>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Pressable
              onPress={() => router.push("/barcode")}
              style={({ pressed }) => [{ flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, paddingVertical: 13, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
            >
              <Ionicons name="barcode" size={18} color={colors.primary} />
              <Text style={{ color: colors.ink, fontSize: 14.5, fontWeight: "700" }}>Code-barres</Text>
            </Pressable>
            <Pressable
              onPress={() => router.navigate("/aliments")}
              style={({ pressed }) => [{ flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, paddingVertical: 13, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
            >
              <Ionicons name="add" size={18} color={colors.primary} />
              <Text style={{ color: colors.ink, fontSize: 14.5, fontWeight: "700" }}>Ajout manuel</Text>
            </Pressable>
          </View>
        </View>

        {/* Repas du jour */}
        <SectionTitle title="Repas du jour" hint={`${meals.length} enregistré${meals.length > 1 ? "s" : ""}`} />
        {meals.length === 0 ? (
          <Card style={{ alignItems: "center", paddingVertical: 26, gap: 6 }}>
            <Ionicons name="restaurant-outline" size={26} color={colors.faint} />
            <Text style={{ color: colors.ink, fontSize: 15, fontWeight: "800" }}>Aucun repas aujourd'hui</Text>
            <Text style={{ color: colors.muted, fontSize: 13, textAlign: "center", lineHeight: 19 }}>
              Photographiez votre assiette ou scannez un code-barres pour commencer le suivi.
            </Text>
          </Card>
        ) : (
          SLOT_ORDER.map((slot) => {
            const slotMeals = meals.filter((m) => m.slot === slot);
            if (slotMeals.length === 0) return null;
            return (
              <View key={slot} style={{ marginBottom: 6 }}>
                <Text style={{ color: colors.muted, fontSize: 12.5, fontWeight: "700", marginBottom: 8 }}>
                  {SLOT_META[slot].label} · {SLOT_META[slot].hours}
                </Text>
                {slotMeals.map((m) => (
                  <MealCard key={m.id} meal={m} onDelete={(id) => appStore.removeMeal(id)} />
                ))}
              </View>
            );
          })
        )}
      </ScrollView>
    </Screen>
  );
}
