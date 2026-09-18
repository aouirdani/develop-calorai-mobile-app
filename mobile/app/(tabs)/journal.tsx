/**
 * Journal — historique des repas par jour : sélecteur de jour,
 * totaux (fourchettes incluses), détail de chaque repas.
 */
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { appStore } from "../_layout";
import { dayTotal, mealsForDay, useAppState } from "../../store/appStore";
import { MealCard } from "../../components/MealCard";
import { Card, Chip, EmptyState, Screen } from "../../components/ui";
import { MACRO_KEYS, MACRO_META } from "../../constants/nutrition";
import { colors, radius } from "../../constants/theme";
import { addDaysKey, dayLabel, fmtEst, fmtNum, fmtRangeSub, todayKey } from "../../utils/format";

export default function JournalScreen() {
  const state = useAppState(appStore, (s) => s);
  const days = useMemo(() => {
    const list: string[] = [];
    for (let i = 0; i >= -13; i--) list.push(addDaysKey(new Date(), i));
    return list;
  }, []);
  const [selected, setSelected] = useState(todayKey());

  const meals = mealsForDay(state, selected).sort((a, b) => b.added_at.localeCompare(a.added_at));
  const total = dayTotal(meals);
  const kcalSub = fmtRangeSub(total.calories, "kcal");

  return (
    <Screen noPadding>
      <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
        <Text style={{ color: colors.ink, fontSize: 24, fontWeight: "800", marginBottom: 12 }}>Journal</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 12 }}>
          {days.map((d) => {
            const count = mealsForDay(state, d).length;
            const active = d === selected;
            return (
              <Pressable
                key={d}
                onPress={() => setSelected(d)}
                style={{
                  borderRadius: radius.lg,
                  paddingHorizontal: 13,
                  paddingVertical: 9,
                  backgroundColor: active ? colors.primary : colors.surface,
                  borderWidth: 1,
                  borderColor: active ? colors.primary : colors.line,
                  minWidth: 76,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: active ? "#F4F8EE" : colors.inkSoft, fontSize: 12.5, fontWeight: "800" }}>{dayLabel(d)}</Text>
                <Text style={{ color: active ? colors.accent : colors.faint, fontSize: 10.5, fontWeight: "700", marginTop: 1 }}>
                  {count > 0 ? `${count} repas` : "—"}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 8, paddingBottom: 34 }} showsVerticalScrollIndicator={false}>
        {meals.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title="Aucun repas ce jour-là"
            text="Les repas ajoutés par photo, code-barres ou recherche apparaîtront ici, jour par jour."
          />
        ) : (
          <>
            <Card style={{ marginBottom: 14 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View>
                  <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "700" }}>TOTAL DU JOUR</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 3 }}>
                    <Text style={{ color: colors.ink, fontSize: 24, fontWeight: "800", fontVariant: ["tabular-nums"] }}>{fmtEst(total.calories)}</Text>
                    <Text style={{ color: colors.muted, fontSize: 13, fontWeight: "700" }}>/ {fmtNum(state.goals.calories)} kcal</Text>
                    {kcalSub ? <Chip color={colors.muted} bg={colors.surfaceAlt}>{kcalSub}</Chip> : null}
                  </View>
                </View>
                <View style={{ alignItems: "flex-end", gap: 3 }}>
                  {MACRO_KEYS.map((k) => (
                    <Text key={k} style={{ color: MACRO_META[k].color, fontSize: 12.5, fontWeight: "800", fontVariant: ["tabular-nums"] }}>
                      {MACRO_META[k].short} {fmtNum(total[k].estimation)} g
                    </Text>
                  ))}
                </View>
              </View>
            </Card>
            {meals.map((m) => (
              <MealCard key={m.id} meal={m} onDelete={(id) => appStore.removeMeal(id)} />
            ))}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
