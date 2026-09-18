/**
 * Analyse — écran d'attente pendant l'appel POST /api/v1/estimates
 * (ou /estimates/barcode). Les étapes affichées sont des messages génériques :
 * le backend répond en une seule requête, on ne prétend pas suivre ses étapes.
 */
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Image, Pressable, Text, View } from "react-native";
import { getApi } from "../services/api/env";
import { NetworkError, type EstimatePhotoInput } from "../services/api";
import { setEstimateMeta } from "../utils/estimateMeta";
import { colors, radius } from "../constants/theme";

const STAGES = [
  "Analyse de votre repas…",
  "Identification des aliments…",
  "Estimation des portions…",
  "Calcul des macros…",
];

export default function AnalysisScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode: string; uri?: string; diametre?: string; contexte?: string; code?: string }>();
  const [stage, setStage] = useState(0);
  const [error, setError] = useState<{ title: string; body: string; offline: boolean } | null>(null);
  const ranRef = useRef(false);
  const scanY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanY, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(scanY, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scanY]);

  const run = async () => {
    setError(null);
    setStage(0);
    const started = Date.now();
    try {
      let estimate;
      if (params.mode === "barcode" && params.code) {
        estimate = await getApi().createBarcodeEstimate(params.code);
      } else {
        const input: EstimatePhotoInput = {
          image: { uri: params.uri ?? "" },
          ...(params.diametre ? { diametre_assiette_cm: Number(params.diametre) } : {}),
          ...(params.contexte ? { contexte: params.contexte } : {}),
        };
        estimate = await getApi().createEstimate(input);
      }
      // Temps d'affichage minimum pour une transition agréable.
      const elapsed = Date.now() - started;
      if (elapsed < 2600) await new Promise((r) => setTimeout(r, 2600 - elapsed));
      setEstimateMeta(estimate.id, { image: params.uri ?? null });
      router.replace({ pathname: "/result/[id]", params: { id: estimate.id } });
    } catch (e) {
      if (e instanceof NetworkError) setError({ title: "Hors ligne", body: e.message, offline: true });
      else setError({ title: "L'analyse a échoué", body: e instanceof Error ? e.message : "Réessayez dans un instant.", offline: false });
    }
  };

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (error) return;
    const t = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 850);
    return () => clearInterval(t);
  }, [error]);

  const translateY = scanY.interpolate({ inputRange: [0, 1], outputRange: [8, 292] });

  return (
    <View style={{ flex: 1, backgroundColor: colors.dark, alignItems: "center", justifyContent: "center", padding: 28 }}>
      {error ? (
        <View style={{ alignItems: "center", gap: 14 }}>
          <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: colors.darkCard, borderWidth: 1, borderColor: colors.darkLine, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name={error.offline ? "cloud-offline" : "alert-circle"} size={28} color={error.offline ? colors.carbs : colors.danger} />
          </View>
          <Text style={{ color: "#F2F6EC", fontSize: 19, fontWeight: "800" }}>{error.title}</Text>
          <Text style={{ color: colors.darkMuted, fontSize: 14, textAlign: "center", lineHeight: 21, maxWidth: 290 }}>{error.body}</Text>
          <Pressable
            onPress={() => void run()}
            style={({ pressed }) => [{ backgroundColor: colors.accent, borderRadius: radius.lg, paddingHorizontal: 26, paddingVertical: 14, flexDirection: "row", gap: 8, alignItems: "center", opacity: pressed ? 0.85 : 1, marginTop: 6 }]}
          >
            <Ionicons name="refresh" size={17} color={colors.accentInk} />
            <Text style={{ color: colors.accentInk, fontSize: 15.5, fontWeight: "800" }}>Réessayer</Text>
          </Pressable>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Text style={{ color: colors.darkMuted, fontSize: 14, fontWeight: "700", marginTop: 4 }}>Retour</Text>
          </Pressable>
        </View>
      ) : (
        <>
          {/* Zone photo + balayage */}
          <View style={{ width: 250, height: 310, borderRadius: radius.xl, overflow: "hidden", backgroundColor: colors.darkCard, borderWidth: 1, borderColor: colors.darkLine }}>
            {params.uri ? <Image source={{ uri: params.uri }} style={{ width: "100%", height: "100%", opacity: 0.55 }} /> : null}
            <View pointerEvents="none" style={{ position: "absolute", inset: 12, borderRadius: radius.lg, borderWidth: 1.5, borderColor: "rgba(200,241,105,0.5)" }} />
            <Animated.View
              pointerEvents="none"
              style={{
                position: "absolute",
                left: 16,
                right: 16,
                height: 2.5,
                borderRadius: 2,
                backgroundColor: colors.accent,
                shadowColor: colors.accent,
                shadowOpacity: 0.9,
                shadowRadius: 8,
                transform: [{ translateY }],
              }}
            />
          </View>

          {/* Étapes génériques */}
          <View style={{ marginTop: 30, gap: 12, alignSelf: "stretch", maxWidth: 300 }}>
            {STAGES.map((label, i) => (
              <View key={label} style={{ flexDirection: "row", alignItems: "center", gap: 10, opacity: i <= stage ? 1 : 0.35 }}>
                {i < stage ? (
                  <Ionicons name="checkmark-circle" size={19} color={colors.accent} />
                ) : i === stage ? (
                  <Ionicons name="radio-button-on" size={19} color={colors.accent} />
                ) : (
                  <Ionicons name="ellipse-outline" size={19} color={colors.darkMuted} />
                )}
                <Text style={{ color: i <= stage ? "#F2F6EC" : colors.darkMuted, fontSize: 14.5, fontWeight: i === stage ? "800" : "600" }}>
                  {label}
                </Text>
              </View>
            ))}
          </View>
          <Text style={{ color: "#5C6F62", fontSize: 11.5, marginTop: 26, fontVariant: ["tabular-nums"] }}>
            POST /api/v1/estimates · multipart image
          </Text>
        </>
      )}
    </View>
  );
}
