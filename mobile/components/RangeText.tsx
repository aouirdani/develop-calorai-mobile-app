/**
 * Affichage des fourchettes { estimation, min, max }.
 * Règle : si min/max existent (et diffèrent), la plage est TOUJOURS visible.
 */
import { Text, View } from "react-native";
import { colors, radius } from "../constants/theme";
import type { NutriRange } from "../types/api";
import { fmtEst, fmtRangeSub } from "../utils/format";

/** Pilule "110–200 g" — null si la valeur est exacte/unique. */
export function RangePill({ range, unit, tone = "neutral" }: { range: NutriRange; unit?: string; tone?: "neutral" | "accent" }) {
  const sub = fmtRangeSub(range, unit);
  if (!sub) return null;
  return (
    <View
      style={{
        backgroundColor: tone === "accent" ? colors.accent : colors.surfaceAlt,
        borderRadius: radius.pill,
        paddingHorizontal: 8,
        paddingVertical: 2.5,
        alignSelf: "flex-start",
      }}
    >
      <Text style={{ color: tone === "accent" ? colors.accentInk : colors.muted, fontSize: 11.5, fontWeight: "700" }}>
        {sub}
      </Text>
    </View>
  );
}

/** Valeur principale + plage en dessous (ex. "620 kcal" puis "499–901 kcal"). */
export function RangeValue({
  range,
  unit,
  size = "md",
  color = colors.ink,
}: {
  range: NutriRange;
  unit?: string;
  size?: "md" | "lg" | "xl";
  color?: string;
}) {
  const sizes = { md: 16, lg: 22, xl: 34 };
  return (
    <View style={{ gap: 3 }}>
      <Text style={{ color, fontSize: sizes[size], fontWeight: "800", fontVariant: ["tabular-nums"] }}>
        {fmtEst(range)}
        {unit ? <Text style={{ fontSize: sizes[size] * 0.55, fontWeight: "700", color: colors.muted }}> {unit}</Text> : null}
      </Text>
      <RangePill range={range} unit={unit} />
    </View>
  );
}
