/**
 * Onboarding court et premium : objectif calorique, objectif protéines,
 * poids/taille optionnels, permission caméra. Passable à tout moment.
 */
import { Ionicons } from "@expo/vector-icons";
import { Camera } from "expo-camera";
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { appStore } from "./_layout";
import { Button, Chip, Screen, Stepper } from "../components/ui";
import { CALORIE_PRESETS, DEFAULT_GOALS, PROTEIN_PRESETS } from "../constants/nutrition";
import { colors, radius } from "../constants/theme";
import { fmtNum } from "../utils/format";

function PresetChips({ presets, value, onChange, unit }: { presets: number[]; value: number; onChange: (v: number) => void; unit: string }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
      {presets.map((p) => {
        const active = p === value;
        return (
          <Pressable
            key={p}
            onPress={() => onChange(p)}
            style={{
              borderRadius: radius.pill,
              paddingHorizontal: 14,
              paddingVertical: 9,
              backgroundColor: active ? colors.primary : colors.surface,
              borderWidth: 1,
              borderColor: active ? colors.primary : colors.line,
            }}
          >
            <Text style={{ color: active ? "#F4F8EE" : colors.inkSoft, fontWeight: "700", fontSize: 14 }}>
              {fmtNum(p)} {unit}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [calories, setCalories] = useState(DEFAULT_GOALS.calories);
  const [proteines, setProteines] = useState(DEFAULT_GOALS.proteines);
  const [poids, setPoids] = useState("");
  const [taille, setTaille] = useState("");
  const [camGranted, setCamGranted] = useState<boolean | null>(null);

  const finish = () => {
    appStore.completeOnboarding({
      goals: { calories, proteines },
      profile: {
        poids_kg: poids ? Number(poids.replace(",", ".")) : null,
        taille_cm: taille ? Number(taille.replace(",", ".")) : null,
      },
    });
  };

  const skip = () => {
    appStore.completeOnboarding({ goals: {}, profile: {} });
  };

  const askCamera = async () => {
    const { granted } = await Camera.requestCameraPermissionsAsync();
    setCamGranted(granted);
  };

  const steps = [
    /* 0 — Bienvenue */
    <View key="s0" style={{ flex: 1, justifyContent: "center", gap: 14 }}>
      <View style={{ width: 72, height: 72, borderRadius: 22, backgroundColor: colors.primaryDeep, alignItems: "center", justifyContent: "center" }}>
        <Ionicons name="nutrition" size={34} color={colors.accent} />
      </View>
      <Text style={{ color: colors.ink, fontSize: 30, fontWeight: "800", lineHeight: 38 }}>
        Photographiez.{"\n"}CalorAI calcule.
      </Text>
      <Text style={{ color: colors.muted, fontSize: 15.5, lineHeight: 23 }}>
        Une photo de votre assiette suffit pour estimer calories, macros et portions — toujours avec leur fourchette, jamais un chiffre aveugle.
      </Text>
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
        <Chip color={colors.primary} bg={colors.primarySoft}>Analyse photo</Chip>
        <Chip color={colors.primary} bg={colors.primarySoft}>Code-barres</Chip>
        <Chip color={colors.primary} bg={colors.primarySoft}>Fourchettes min/max</Chip>
      </View>
    </View>,

    /* 1 — Objectif calorique */
    <View key="s1" style={{ flex: 1, justifyContent: "center" }}>
      <Text style={{ color: colors.ink, fontSize: 26, fontWeight: "800", marginBottom: 8 }}>Votre objectif calorique</Text>
      <Text style={{ color: colors.muted, fontSize: 14.5, lineHeight: 21, marginBottom: 22 }}>
        CalorAI suivra vos calories restantes par rapport à ce repère quotidien.
      </Text>
      <PresetChips presets={CALORIE_PRESETS} value={calories} onChange={setCalories} unit="kcal" />
      <View style={{ alignItems: "center" }}>
        <Stepper value={calories} onChange={setCalories} step={50} min={1000} max={6000} format={(v) => `${fmtNum(v)} kcal`} />
      </View>
    </View>,

    /* 2 — Protéines + mensurations */
    <View key="s2" style={{ flex: 1, justifyContent: "center" }}>
      <Text style={{ color: colors.ink, fontSize: 26, fontWeight: "800", marginBottom: 8 }}>Protéines & profil</Text>
      <Text style={{ color: colors.muted, fontSize: 14.5, lineHeight: 21, marginBottom: 22 }}>
        Objectif protéines quotidien, et si vous le souhaitez, poids et taille (facultatif).
      </Text>
      <PresetChips presets={PROTEIN_PRESETS} value={proteines} onChange={setProteines} unit="g" />
      <View style={{ alignItems: "center", marginBottom: 20 }}>
        <Stepper value={proteines} onChange={setProteines} step={5} min={40} max={300} format={(v) => `${v} g / jour`} />
      </View>
      <View style={{ flexDirection: "row", gap: 10 }}>
        {[
          { label: "Poids (kg)", value: poids, set: setPoids },
          { label: "Taille (cm)", value: taille, set: setTaille },
        ].map((f) => (
          <View key={f.label} style={{ flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12 }}>
            <Text style={{ color: colors.faint, fontSize: 12, fontWeight: "700" }}>{f.label}</Text>
            <TextInput value={f.value} onChangeText={f.set} keyboardType="numeric" placeholder="—" placeholderTextColor={colors.faint} style={{ color: colors.ink, fontSize: 17, fontWeight: "800", paddingVertical: 2 }} />
          </View>
        ))}
      </View>
    </View>,

    /* 3 — Permission caméra */
    <View key="s3" style={{ flex: 1, justifyContent: "center", gap: 12 }}>
      <View style={{ width: 72, height: 72, borderRadius: 22, backgroundColor: colors.dark, alignItems: "center", justifyContent: "center" }}>
        <Ionicons name="camera" size={32} color={colors.accent} />
      </View>
      <Text style={{ color: colors.ink, fontSize: 26, fontWeight: "800" }}>Autoriser la caméra</Text>
      <Text style={{ color: colors.muted, fontSize: 14.5, lineHeight: 22 }}>
        Indispensable pour photographier vos repas et scanner les codes-barres. Les photos ne servent qu'à l'analyse nutritionnelle.
      </Text>
      {camGranted == null ? (
        <Button title="Autoriser la caméra" icon="camera" variant="dark" onPress={askCamera} style={{ marginTop: 8 }} />
      ) : camGranted ? (
        <Chip color={colors.primary} bg={colors.primarySoft}>✓ Caméra autorisée</Chip>
      ) : (
        <Chip color={colors.warnText} bg={colors.warnBg}>Permission refusée — réglable plus tard dans Profil</Chip>
      )}
    </View>,
  ];

  const last = steps.length - 1;

  return (
    <Screen>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <View style={{ flexDirection: "row", gap: 6 }}>
          {steps.map((_, i) => (
            <View key={i} style={{ width: i === step ? 22 : 7, height: 7, borderRadius: radius.pill, backgroundColor: i === step ? colors.primary : colors.lineStrong }} />
          ))}
        </View>
        <Pressable onPress={skip} hitSlop={10}>
          <Text style={{ color: colors.muted, fontSize: 14, fontWeight: "700" }}>Passer</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>{steps[step]}</ScrollView>
      <View style={{ paddingTop: 14, gap: 10 }}>
        <Button
          title={step === last ? "Commencer" : "Continuer"}
          icon={step === last ? "checkmark" : "arrow-forward"}
          onPress={() => (step === last ? finish() : setStep(step + 1))}
        />
        {step > 0 ? <Button title="Retour" variant="ghost" onPress={() => setStep(step - 1)} /> : null}
      </View>
    </Screen>
  );
}
