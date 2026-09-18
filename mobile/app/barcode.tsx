/**
 * Code-barres — détection EAN via expo-camera (CameraView), saisie manuelle
 * de secours et codes d'exemple. POST /api/v1/estimates/barcode { code }.
 * Codes acceptés : 8 à 14 chiffres (contrat API).
 */
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { ApiError, NetworkError, SAMPLE_BARCODES } from "../services/api";
import { getApi } from "../services/api/env";
import { setEstimateMeta } from "../utils/estimateMeta";
import { colors, radius } from "../constants/theme";

type ScanState =
  | { kind: "idle" }
  | { kind: "loading"; code: string }
  | { kind: "notfound"; code: string; message: string }
  | { kind: "error"; message: string; offline: boolean };

export default function BarcodeScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [state, setState] = useState<ScanState>({ kind: "idle" });
  const [manual, setManual] = useState("");
  const [manualError, setManualError] = useState<string | null>(null);
  const busyRef = useRef(false);

  const submit = async (rawCode: string) => {
    const code = rawCode.replace(/\s/g, "");
    if (!/^\d{8,14}$/.test(code)) {
      setManualError("Le code doit contenir entre 8 et 14 chiffres.");
      return;
    }
    setManualError(null);
    if (busyRef.current) return;
    busyRef.current = true;
    setState({ kind: "loading", code });
    try {
      const estimate = await getApi().createBarcodeEstimate(code);
      setEstimateMeta(estimate.id, { image: null });
      router.replace({ pathname: "/result/[id]", params: { id: estimate.id } });
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        setState({ kind: "notfound", code, message: e.message });
      } else if (e instanceof NetworkError) {
        setState({ kind: "error", message: e.message, offline: true });
      } else {
        setState({ kind: "error", message: e instanceof Error ? e.message : "Erreur inconnue.", offline: false });
      }
    } finally {
      busyRef.current = false;
    }
  };

  const onDetected = (data: string) => {
    if (busyRef.current) return;
    void submit(data);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.dark, paddingTop: 70, paddingHorizontal: 20, paddingBottom: 24 }}>
      {/* En-tête */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ width: 40, height: 40, borderRadius: radius.pill, backgroundColor: colors.darkCard, borderWidth: 1, borderColor: colors.darkLine, alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="chevron-back" size={20} color="#F2F6EC" />
        </Pressable>
        <Text style={{ color: "#F2F6EC", fontSize: 17, fontWeight: "800" }}>Code-barres</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Viseur */}
      <View style={{ height: 240, borderRadius: radius.xl, overflow: "hidden", backgroundColor: colors.darkCard, borderWidth: 1, borderColor: colors.darkLine }}>
        {permission?.granted && state.kind !== "notfound" ? (
          <CameraView
            style={{ flex: 1 }}
            onBarcodeScanned={({ data }) => onDetected(data)}
            barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128"] }}
          />
        ) : null}

        {/* Coins + laser */}
        <View pointerEvents="none" style={{ position: "absolute", inset: 26, justifyContent: "center" }}>
          <View style={{ height: 2.5, borderRadius: 2, backgroundColor: colors.accent, shadowColor: colors.accent, shadowOpacity: 0.9, shadowRadius: 8 }} />
        </View>
        {[
          { top: 14, left: 14, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 12 },
          { top: 14, right: 14, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 12 },
          { bottom: 14, left: 14, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 12 },
          { bottom: 14, right: 14, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 12 },
        ].map((corner, i) => (
          <View key={i} pointerEvents="none" style={{ position: "absolute", width: 34, height: 34, borderColor: "rgba(200,241,105,0.6)", ...corner }} />
        ))}

        {state.kind === "loading" ? (
          <View style={{ position: "absolute", inset: 0, backgroundColor: "rgba(13,23,18,0.82)", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <Ionicons name="barcode" size={30} color={colors.accent} />
            <Text style={{ color: "#F2F6EC", fontSize: 14.5, fontWeight: "800" }}>Produit {state.code}…</Text>
            <Text style={{ color: colors.darkMuted, fontSize: 12 }}>POST /api/v1/estimates/barcode</Text>
          </View>
        ) : null}

        {state.kind === "notfound" ? (
          <View style={{ position: "absolute", inset: 0, backgroundColor: "rgba(13,23,18,0.94)", alignItems: "center", justifyContent: "center", gap: 8, padding: 20 }}>
            <Ionicons name="help-circle-outline" size={28} color={colors.carbs} />
            <Text style={{ color: "#F2F6EC", fontSize: 15.5, fontWeight: "800" }}>Produit introuvable</Text>
            <Text style={{ color: colors.darkMuted, fontSize: 12.5, textAlign: "center", lineHeight: 18 }}>{state.message}</Text>
            <Pressable onPress={() => setState({ kind: "idle" })} style={{ backgroundColor: colors.accent, borderRadius: radius.pill, paddingHorizontal: 18, paddingVertical: 9, marginTop: 6 }}>
              <Text style={{ color: colors.accentInk, fontSize: 13.5, fontWeight: "800" }}>Réessayer</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      {state.kind === "error" ? (
        <View style={{ backgroundColor: colors.darkCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.darkLine, padding: 14, marginTop: 12, flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Ionicons name={state.offline ? "cloud-offline" : "alert-circle"} size={20} color={state.offline ? colors.carbs : colors.danger} />
          <Text style={{ color: "#F2F6EC", fontSize: 13, flex: 1, lineHeight: 18 }}>{state.message}</Text>
          <Pressable onPress={() => setState({ kind: "idle" })}>
            <Text style={{ color: colors.accent, fontSize: 13.5, fontWeight: "800" }}>OK</Text>
          </Pressable>
        </View>
      ) : null}

      {!permission?.granted ? (
        <Pressable onPress={() => void requestPermission()} style={{ backgroundColor: colors.darkCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.darkLine, padding: 14, marginTop: 12, alignItems: "center" }}>
          <Text style={{ color: colors.accent, fontSize: 14, fontWeight: "800" }}>
            {permission?.canAskAgain === false ? "Caméra refusée — ouvrir les réglages" : "Autoriser la caméra pour scanner"}
          </Text>
        </Pressable>
      ) : null}

      {/* Saisie manuelle */}
      <View style={{ marginTop: 18, gap: 10 }}>
        <Text style={{ color: colors.darkMuted, fontSize: 12.5, fontWeight: "700" }}>SAISIE MANUELLE (EAN 8–14 chiffres)</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TextInput
            value={manual}
            onChangeText={(v) => {
              setManual(v.replace(/[^\d]/g, "").slice(0, 14));
              setManualError(null);
            }}
            placeholder="3017620422003"
            placeholderTextColor="#5C6F62"
            keyboardType="number-pad"
            style={{ flex: 1, backgroundColor: colors.darkCard, borderWidth: 1, borderColor: manualError ? colors.danger : colors.darkLine, borderRadius: radius.lg, paddingHorizontal: 16, paddingVertical: 13, color: "#F2F6EC", fontSize: 16, letterSpacing: 1, fontVariant: ["tabular-nums"] }}
          />
          <Pressable onPress={() => void submit(manual)} style={({ pressed }) => [{ backgroundColor: colors.accent, borderRadius: radius.lg, paddingHorizontal: 18, alignItems: "center", justifyContent: "center", opacity: pressed ? 0.85 : 1 }]}>
            <Ionicons name="arrow-forward" size={19} color={colors.accentInk} />
          </Pressable>
        </View>
        {manualError ? <Text style={{ color: colors.danger, fontSize: 12.5, fontWeight: "600" }}>{manualError}</Text> : null}
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          {SAMPLE_BARCODES.map((s) => (
            <Pressable key={s.code} onPress={() => void submit(s.code)} style={{ backgroundColor: colors.darkCard, borderWidth: 1, borderColor: colors.darkLine, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 8, flexDirection: "row", gap: 6, alignItems: "center" }}>
              <Ionicons name="barcode-outline" size={13} color={colors.accent} />
              <Text style={{ color: colors.darkMuted, fontSize: 12.5, fontWeight: "700" }}>{s.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}
