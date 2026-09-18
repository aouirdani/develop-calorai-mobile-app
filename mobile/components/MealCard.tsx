/**
 * Carte repas du journal : photo, calories (fourchette), macros,
 * détail des aliments dépliable, suppression.
 */
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { colors, radius } from "../constants/theme";
import { MACRO_KEYS, MACRO_META, SLOT_META } from "../constants/nutrition";
import type { MealLog } from "../types/app";
import { confidenceTone, fmtEst, fmtNum, fmtRangeSub, methodeLabel } from "../utils/format";
import { Card, Chip } from "./ui";

const confColor: Record<string, string> = {
  good: colors.primary,
  mid: colors.carbs,
  low: colors.danger,
};

export function MealCard({ meal, onDelete }: { meal: MealLog; onDelete?: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const kcalSub = fmtRangeSub(meal.total.calories, "kcal");
  const time = new Date(meal.added_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  return (
    <Card style={{ marginBottom: 12, padding: 14 }}>
      <Pressable onPress={() => setOpen((v) => !v)} style={{ flexDirection: "row", gap: 12 }}>
        {meal.image ? (
          <Image source={{ uri: meal.image }} style={{ width: 56, height: 56, borderRadius: radius.md, backgroundColor: colors.surfaceAlt }} />
        ) : (
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: radius.md,
              backgroundColor: colors.primarySoft,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons
              name={meal.source === "barcode" ? "barcode" : meal.source === "manuel" ? "search" : "camera"}
              size={22}
              color={colors.primary}
            />
          </View>
        )}
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={{ color: colors.ink, fontSize: 15, fontWeight: "800" }} numberOfLines={1}>
            {meal.label}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 12 }}>
            {SLOT_META[meal.slot].label} · {time}
          </Text>
          <View style={{ flexDirection: "row", gap: 6, marginTop: 3 }}>
            {MACRO_KEYS.map((k) => (
              <Chip key={k} color={MACRO_META[k].color} bg={MACRO_META[k].soft}>
                {MACRO_META[k].short} {fmtNum(meal.total[k].estimation)}
              </Chip>
            ))}
          </View>
        </View>
        <View style={{ alignItems: "flex-end", gap: 4 }}>
          <Text style={{ color: colors.ink, fontSize: 16, fontWeight: "800", fontVariant: ["tabular-nums"] }}>
            {fmtEst(meal.total.calories)} <Text style={{ fontSize: 11, color: colors.muted, fontWeight: "700" }}>kcal</Text>
          </Text>
          {kcalSub ? (
            <View style={{ backgroundColor: colors.surfaceAlt, borderRadius: radius.pill, paddingHorizontal: 7, paddingVertical: 2 }}>
              <Text style={{ color: colors.muted, fontSize: 10.5, fontWeight: "700" }}>{kcalSub}</Text>
            </View>
          ) : null}
          <Ionicons name={open ? "chevron-up" : "chevron-down"} size={15} color={colors.faint} style={{ marginTop: 2 }} />
        </View>
      </Pressable>

      {open ? (
        <View style={{ marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.line, gap: 12 }}>
          {meal.aliments.map((a, i) => {
            const qteSub = fmtRangeSub(a.quantite, a.quantite.unite);
            const tone = confidenceTone(a.confiance);
            return (
              <View key={`${a.nom}_${i}`} style={{ gap: 4 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10 }}>
                  <Text style={{ color: colors.ink, fontSize: 14, fontWeight: "700", flex: 1 }} numberOfLines={1}>
                    {a.nom}
                  </Text>
                  <Text style={{ color: colors.inkSoft, fontSize: 13.5, fontWeight: "700", fontVariant: ["tabular-nums"] }}>
                    {fmtEst(a.calories)} kcal
                  </Text>
                </View>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                  <Chip color={colors.inkSoft} bg={colors.field}>
                    {qteSub ? `${qteSub}` : `${fmtNum(a.quantite.estimation)} ${a.quantite.unite}`}
                  </Chip>
                  <Chip color={confColor[tone]} bg={colors.surfaceAlt}>
                    Confiance {Math.round(a.confiance * 100)} %
                  </Chip>
                  <Chip color={colors.muted} bg={colors.surfaceAlt}>
                    {methodeLabel(a.methode)}
                  </Chip>
                </View>
                <Text style={{ color: colors.faint, fontSize: 11.5 }}>
                  Source : {a.source_nutritionnelle}
                </Text>
              </View>
            );
          })}
          {onDelete ? (
            <Pressable
              onPress={() => onDelete(meal.id)}
              style={{ flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingVertical: 4 }}
            >
              <Ionicons name="trash-outline" size={15} color={colors.danger} />
              <Text style={{ color: colors.danger, fontSize: 13, fontWeight: "700" }}>Supprimer ce repas</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}
