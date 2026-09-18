/**
 * Composants UI réutilisables CalorAI (React Native).
 */
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius } from "../constants/theme";

/* ---------- Écrans ---------- */

export function Screen({
  children,
  dark = false,
  style,
  noPadding = false,
}: {
  children: React.ReactNode;
  dark?: boolean;
  style?: StyleProp<ViewStyle>;
  noPadding?: boolean;
}) {
  return (
    <SafeAreaView
      edges={["top"]}
      style={[{ flex: 1, backgroundColor: dark ? colors.dark : colors.bg }, style]}
    >
      <View style={{ flex: 1, padding: noPadding ? 0 : 20 }}>{children}</View>
    </SafeAreaView>
  );
}

/* ---------- Surfaces ---------- */

export function Card({
  children,
  style,
  dark = false,
  onPress,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  dark?: boolean;
  onPress?: () => void;
}) {
  const base: StyleProp<ViewStyle> = {
    backgroundColor: dark ? colors.darkCard : colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: dark ? colors.darkLine : colors.line,
    padding: 18,
  };
  if (!onPress) return <View style={[base, style]}>{children}</View>;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [base, style, pressed && { transform: [{ scale: 0.985 }], opacity: 0.92 }]}
    >
      {children}
    </Pressable>
  );
}

export function Chip({
  children,
  color = colors.muted,
  bg = colors.surfaceAlt,
  style,
}: {
  children: React.ReactNode;
  color?: string;
  bg?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        { backgroundColor: bg, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start" },
        style,
      ]}
    >
      <Text style={{ color, fontSize: 12, fontWeight: "600" }}>{children}</Text>
    </View>
  );
}

/* ---------- Boutons ---------- */

type ButtonVariant = "primary" | "dark" | "outline" | "ghost" | "danger";

export function Button({
  title,
  onPress,
  variant = "primary",
  icon,
  loading = false,
  disabled = false,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const styles: Record<ButtonVariant, { bg: string; fg: string; border?: string }> = {
    primary: { bg: colors.primary, fg: "#F4F8EE" },
    dark: { bg: colors.dark, fg: colors.accent },
    outline: { bg: "transparent", fg: colors.ink, border: colors.lineStrong },
    ghost: { bg: "transparent", fg: colors.primary },
    danger: { bg: colors.dangerSoft, fg: colors.danger },
  };
  const s = styles[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          backgroundColor: s.bg,
          borderRadius: radius.lg,
          borderWidth: s.border ? 1 : 0,
          borderColor: s.border,
          paddingVertical: 15,
          paddingHorizontal: 20,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed && !disabled ? 0.98 : 1 }],
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={s.fg} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={19} color={s.fg} /> : null}
          <Text style={{ color: s.fg, fontSize: 16, fontWeight: "700" }}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

/* ---------- Titres & champs ---------- */

export function SectionTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12, marginTop: 6 }}>
      <Text style={{ color: colors.ink, fontSize: 17, fontWeight: "800" }}>{title}</Text>
      {hint ? <Text style={{ color: colors.muted, fontSize: 12.5 }}>{hint}</Text> : null}
    </View>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline = false,
  suffix,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: TextInputProps["keyboardType"];
  multiline?: boolean;
  suffix?: string;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ color: colors.inkSoft, fontSize: 13, fontWeight: "700", marginBottom: 6 }}>{label}</Text>
      <View
        style={{
          backgroundColor: colors.field,
          borderWidth: 1,
          borderColor: colors.line,
          borderRadius: radius.md,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 14,
        }}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.faint}
          keyboardType={keyboardType}
          multiline={multiline}
          style={{ flex: 1, paddingVertical: 13, color: colors.ink, fontSize: 15.5 }}
        />
        {suffix ? <Text style={{ color: colors.muted, fontSize: 14, fontWeight: "600" }}>{suffix}</Text> : null}
      </View>
    </View>
  );
}

export function Stepper({
  value,
  onChange,
  step = 1,
  min = 0,
  max = 9999,
  format,
}: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  format?: (v: number) => string;
}) {
  const btn = (icon: keyof typeof Ionicons.glyphMap, delta: number, enabled: boolean) => (
    <Pressable
      onPress={() => onChange(Math.min(max, Math.max(min, value + delta)))}
      disabled={!enabled}
      style={({ pressed }) => [
        {
          width: 40,
          height: 40,
          borderRadius: radius.pill,
          backgroundColor: colors.surfaceAlt,
          alignItems: "center",
          justifyContent: "center",
          opacity: enabled ? (pressed ? 0.7 : 1) : 0.35,
        },
      ]}
    >
      <Ionicons name={icon} size={18} color={colors.primaryInk} />
    </Pressable>
  );
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
      {btn("remove", -step, value > min)}
      <Text style={{ color: colors.ink, fontSize: 18, fontWeight: "800", minWidth: 84, textAlign: "center" }}>
        {format ? format(value) : String(value)}
      </Text>
      {btn("add", step, value < max)}
    </View>
  );
}

/* ---------- États (loading / error / empty) ---------- */

export function LoadingState({ label = "Chargement…" }: { label?: string }) {
  return (
    <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 48, gap: 14 }}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={{ color: colors.muted, fontSize: 14 }}>{label}</Text>
    </View>
  );
}

export function ErrorState({
  title,
  body,
  onRetry,
  offline = false,
}: {
  title: string;
  body: string;
  onRetry?: () => void;
  offline?: boolean;
}) {
  return (
    <View style={{ alignItems: "center", paddingVertical: 40, gap: 10 }}>
      <View
        style={{
          width: 54,
          height: 54,
          borderRadius: radius.pill,
          backgroundColor: offline ? colors.warnBg : colors.dangerSoft,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={offline ? "cloud-offline" : "alert-circle"} size={26} color={offline ? colors.warnText : colors.danger} />
      </View>
      <Text style={{ color: colors.ink, fontSize: 16, fontWeight: "800", marginTop: 6 }}>{title}</Text>
      <Text style={{ color: colors.muted, fontSize: 14, textAlign: "center", lineHeight: 20, maxWidth: 280 }}>{body}</Text>
      {onRetry ? (
        <Button title="Réessayer" icon="refresh" variant="outline" onPress={onRetry} style={{ marginTop: 10, alignSelf: "center" }} />
      ) : null}
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  text,
  actionTitle,
  onAction,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  text: string;
  actionTitle?: string;
  onAction?: () => void;
}) {
  return (
    <View style={{ alignItems: "center", paddingVertical: 40, gap: 8 }}>
      <View
        style={{
          width: 54,
          height: 54,
          borderRadius: radius.pill,
          backgroundColor: colors.primarySoft,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={24} color={colors.primary} />
      </View>
      <Text style={{ color: colors.ink, fontSize: 16, fontWeight: "800", marginTop: 6 }}>{title}</Text>
      <Text style={{ color: colors.muted, fontSize: 14, textAlign: "center", lineHeight: 20, maxWidth: 280 }}>{text}</Text>
      {actionTitle && onAction ? (
        <Button title={actionTitle} onPress={onAction} style={{ marginTop: 12 }} />
      ) : null}
    </View>
  );
}
