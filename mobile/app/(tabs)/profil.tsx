/**
 * Profil — objectifs nutritionnels, unités, permissions caméra,
 * configuration API (mode + base URL, token via SecureStore), confidentialité,
 * version de l'application.
 */
import { Camera } from "expo-camera";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { getApi } from "../../services/api/env";
import { appStore } from "../_layout";
import { useAppState } from "../../store/appStore";
import { Button, Card, Field, Screen, SectionTitle } from "../../components/ui";
import { API_PATH_PREFIX, APP_VERSION, MACRO_KEYS, MACRO_META } from "../../constants/nutrition";
import { colors, radius } from "../../constants/theme";

export default function ProfilScreen() {
  const state = useAppState(appStore, (s) => s);
  const [calories, setCalories] = useState(String(state.goals.calories));
  const [macros, setMacros] = useState({
    proteines: String(state.goals.proteines),
    glucides: String(state.goals.glucides),
    lipides: String(state.goals.lipides),
  });
  const [poids, setPoids] = useState(state.profile.poids_kg != null ? String(state.profile.poids_kg) : "");
  const [taille, setTaille] = useState(state.profile.taille_cm != null ? String(state.profile.taille_cm) : "");
  const [camPermission, setCamPermission] = useState<string>("…");
  const [saved, setSaved] = useState(false);

  useFocusEffect(
    useCallback(() => {
      Camera.getCameraPermissionsAsync()
        .then((p) => setCamPermission(p.granted ? "Autorisée" : p.canAskAgain ? "Non demandée" : "Refusée (réglages système)"))
        .catch(() => setCamPermission("Indisponible"));
    }, [])
  );

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 1800);
    return () => clearTimeout(t);
  }, [saved]);

  const saveGoals = () => {
    const num = (v: string) => Number(v.replace(",", "."));
    appStore.setGoals({
      calories: Number.isFinite(num(calories)) && num(calories) > 0 ? num(calories) : state.goals.calories,
      proteines: Number.isFinite(num(macros.proteines)) ? num(macros.proteines) : state.goals.proteines,
      glucides: Number.isFinite(num(macros.glucides)) ? num(macros.glucides) : state.goals.glucides,
      lipides: Number.isFinite(num(macros.lipides)) ? num(macros.lipides) : state.goals.lipides,
    });
    appStore.setProfile({
      poids_kg: poids ? num(poids) : null,
      taille_cm: taille ? num(taille) : null,
    });
    setSaved(true);
  };

  const askCamera = async () => {
    const { granted } = await Camera.requestCameraPermissionsAsync();
    setCamPermission(granted ? "Autorisée" : "Refusée");
  };

  const apiMode = getApi().mode;

  return (
    <Screen noPadding>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Text style={{ color: colors.ink, fontSize: 24, fontWeight: "800", marginBottom: 16 }}>Profil</Text>

        <SectionTitle title="Objectifs nutritionnels" />
        <Card style={{ marginBottom: 12 }}>
          <Field label="Calories (kcal / jour)" value={calories} onChangeText={setCalories} keyboardType="numeric" />
          {MACRO_KEYS.map((k) => (
            <Field
              key={k}
              label={`${MACRO_META[k].label} (g / jour)`}
              value={macros[k]}
              onChangeText={(v) => setMacros((m) => ({ ...m, [k]: v }))}
              keyboardType="numeric"
            />
          ))}
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Field label="Poids (kg)" value={poids} onChangeText={setPoids} keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Taille (cm)" value={taille} onChangeText={setTaille} keyboardType="numeric" />
            </View>
          </View>
          <Button title={saved ? "Enregistré ✓" : "Enregistrer les objectifs"} icon={saved ? "checkmark" : "save-outline"} variant={saved ? "ghost" : "primary"} onPress={saveGoals} />
        </Card>

        <SectionTitle title="Préférences" />
        <Card style={{ marginBottom: 12 }}>
          <Text style={{ color: colors.inkSoft, fontSize: 13, fontWeight: "700", marginBottom: 8 }}>Unités</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {(["metrique", "imperial"] as const).map((u) => (
              <Pressable
                key={u}
                onPress={() => appStore.setPrefs({ unites: u })}
                style={{
                  flex: 1,
                  borderRadius: radius.md,
                  paddingVertical: 11,
                  alignItems: "center",
                  backgroundColor: state.prefs.unites === u ? colors.primarySoft : colors.field,
                  borderWidth: 1,
                  borderColor: state.prefs.unites === u ? colors.primary : colors.line,
                }}
              >
                <Text style={{ color: state.prefs.unites === u ? colors.primaryInk : colors.muted, fontWeight: "700", fontSize: 14 }}>
                  {u === "metrique" ? "Métrique (g, kg)" : "Impérial (oz, lb)"}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>

        <SectionTitle title="Permissions" />
        <Card style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.ink, fontSize: 15, fontWeight: "800" }}>Caméra</Text>
              <Text style={{ color: colors.muted, fontSize: 12.5, marginTop: 2 }}>
                Statut : {camPermission}
              </Text>
            </View>
            <Button title="Demander" variant="outline" onPress={askCamera} />
          </View>
        </Card>

        <SectionTitle title="API CalorieVision" hint={API_PATH_PREFIX} />
        <Card style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <View style={{ width: 9, height: 9, borderRadius: radius.pill, backgroundColor: apiMode === "mock" ? colors.carbs : colors.primary }} />
            <Text style={{ color: colors.ink, fontSize: 15, fontWeight: "800" }}>
              {apiMode === "mock" ? "MockApiClient (démo)" : "CalorieVisionApiClient (réel)"}
            </Text>
          </View>
          <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 20 }}>
            {apiMode === "mock"
              ? "Aucune base URL configurée : l'app utilise le mock pour le développement. Renseignez EXPO_PUBLIC_API_URL (.env local, jamais commité) pour basculer sur le backend."
              : "Connectée au backend calorie-vision. Le token d'API provient de la couche d'authentification et est stocké dans le SecureStore — jamais de clé codée en dur."}
          </Text>
        </Card>

        <SectionTitle title="Confidentialité" />
        <Card style={{ marginBottom: 20 }}>
          <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 20 }}>
            Les photos envoyées à l'API ne servent qu'à l'estimation nutritionnelle de votre repas. Le journal et vos objectifs sont stockés localement sur votre appareil. Aucune donnée n'est partagée avec des tiers.
          </Text>
        </Card>

        <View style={{ gap: 10 }}>
          <Button title="Revoir l'onboarding" icon="walk-outline" variant="outline" onPress={() => appStore.resetOnboarding()} />
          <Button
            title="Réinitialiser toutes les données"
            icon="trash-outline"
            variant="danger"
            onPress={() =>
              Alert.alert("Réinitialiser", "Supprimer le journal et les objectifs ?", [
                { text: "Annuler", style: "cancel" },
                { text: "Réinitialiser", style: "destructive", onPress: () => appStore.resetAll() },
              ])
            }
          />
        </View>

        <View style={{ alignItems: "center", marginTop: 22, gap: 3 }}>
          <Text style={{ color: colors.faint, fontSize: 12, fontWeight: "700" }}>CalorAI {APP_VERSION}</Text>
          <Text style={{ color: colors.faint, fontSize: 11 }}>API {API_PATH_PREFIX} · contrat : calorie-vision/openapi.yaml</Text>
        </View>
      </ScrollView>
    </Screen>
  );
}
