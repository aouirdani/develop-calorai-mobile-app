/**
 * Jauges nutritionnelles : barre de macro + anneau calorique (react-native-svg).
 */
import { Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { colors, radius } from "../constants/theme";
import type { NutriRange } from "../types/api";
import { fmtEst, fmtRangeSub, pct } from "../utils/format";

export function MacroBar({
  label,
  range,
  goal,
  color,
  soft,
  unit = "g",
}: {
  label: string;
  range: NutriRange;
  goal: number;
  color: string;
  soft: string;
  unit?: string;
}) {
  const progress = pct(range.estimation, goal);
  const sub = fmtRangeSub(range, unit);
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <Text style={{ color: colors.inkSoft, fontSize: 13.5, fontWeight: "700" }}>{label}</Text>
        <Text style={{ color: colors.ink, fontSize: 13.5, fontWeight: "800", fontVariant: ["tabular-nums"] }}>
          {fmtEst(range)}
          <Text style={{ color: colors.faint, fontWeight: "600" }}> / {goal} {unit}</Text>
        </Text>
      </View>
      <View style={{ height: 8, borderRadius: radius.pill, backgroundColor: soft, overflow: "hidden" }}>
        <View style={{ height: "100%", width: `${progress * 100}%`, borderRadius: radius.pill, backgroundColor: color }} />
      </View>
      {sub ? (
        <Text style={{ color: colors.faint, fontSize: 11.5, marginTop: 4, fontVariant: ["tabular-nums"] }}>
          Fourchette : {sub}
        </Text>
      ) : null}
    </View>
  );
}

export function CalorieRing({
  consumed,
  goal,
  size = 176,
  strokeWidth = 15,
  children,
}: {
  consumed: NutriRange;
  goal: number;
  size?: number;
  strokeWidth?: number;
  children?: React.ReactNode;
}) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const progress = pct(consumed.estimation, goal);
  const over = consumed.estimation > goal;
  const stroke = over ? colors.danger : colors.primary;
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.surfaceAlt} strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={stroke}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c * progress} ${c}`}
          rotation="-90"
          originX={size / 2}
          originY={size / 2}
        />
      </Svg>
      <View style={{ position: "absolute", alignItems: "center", justifyContent: "center" }}>{children}</View>
    </View>
  );
}
