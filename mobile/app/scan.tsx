/**
 * Scan — capture caméra (expo-camera) ou import galerie (expo-image-picker),
 * diamètre d'assiette optionnel + contexte facultatif, puis navigation vers
 * /analysis qui pilote l'appel POST /api/v1/estimates.
 */
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { PLATE_DIAMETERS_CM } from "../constants/nutrition";
import { colors, radius } from "../constants/theme";
import { Button, Chip } from "../components/ui";

export default function ScanScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<string | null>(null);
  const [diametre, setDiametre] = useState<number | null>(null);
  const [contexte, setContexte] = useState("");
  const [showOptions, setShowOptions] = useState(false);

  const takePicture = async () => {
    const shot = await cameraRef.current?.takePictureAsync({ quality: 0.7 });
    if (shot?.uri) setPhoto(shot.uri);
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (!result.canceled && result.assets[0]?.uri) setPhoto(result.assets[0].uri);
  };

  const analyze = () => {
    if (!photo) return;
    router.push({
      pathname: "/analysis",
      params: {
        mode: "photo",
        uri: photo,
        ...(diametre != null ? { diametre: String(diametre) } : {}),
        ...(contexte.trim() ? { contexte: contexte.trim() } : {}),
      },
    });
  };

  const optionsPanel = (
    <View style={{ backgroundColor: colors.darkCard, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.darkLine, padding: 16, gap: 12 }}>
      <View>
        <Text style={{ color: colors.darkMuted, fontSize: 12, fontWeight: "700", marginBottom: 8 }}>
          Diamètre de l'assiette (optionnel)
        </Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {PLATE_DIAMETERS_CM.map((d) => (
            <Pressable
              key={d}
              onPress={() => setDiametre(diametre === d ? null : d)}
              style={{
                flex: 1,
                borderRadius: radius.md,
                paddingVertical: 10,
                alignItems: "center",
                backgroundColor: diametre === d ? colors.accent : colors.dark,
                borderWidth: 1,
                borderColor: diametre === d ? colors.accent : colors.darkLine,
              }}
            >
              <Text style={{ color: diametre === d ? colors.accentInk : colors.darkMuted, fontWeight: "700", fontSize: 13 }}>
                {d} cm
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      <View>
        <Text style={{ color: colors.darkMuted, fontSize: 12, fontWeight: "700", marginBottom: 8 }}>Contexte (facultatif)</Text>
        <TextInput
          value={contexte}
          onChangeText={setContexte}
          placeholder="ex. dîner après le sport, restaurant…"
          placeholderTextColor="#5C6F62"
          style={{ backgroundColor: colors.dark, borderWidth: 1, borderColor: colors.darkLine, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, color: "#F2F6EC", fontSize: 14.5 }}
        />
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.dark }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={{ flex: 1, paddingTop: 70, paddingHorizontal: 20, paddingBottom: 24 }}>
          {/* En-tête */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <Pressable onPress={() => router.back()} hitSlop={10} style={{ width: 40, height: 40, borderRadius: radius.pill, backgroundColor: colors.darkCard, borderWidth: 1, borderColor: colors.darkLine, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="chevron-back" size={20} color="#F2F6EC" />
            </Pressable>
            <Text style={{ color: "#F2F6EC", fontSize: 17, fontWeight: "800" }}>Scanner un repas</Text>
            <Pressable onPress={pickFromGallery} hitSlop={10} style={{ width: 40, height: 40, borderRadius: radius.pill, backgroundColor: colors.darkCard, borderWidth: 1, borderColor: colors.darkLine, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="images" size={19} color={colors.accent} />
            </Pressable>
          </View>

          {photo ? (
            /* ----- Aperçu avant analyse ----- */
            <ScrollView contentContainerStyle={{ gap: 14 }} showsVerticalScrollIndicator={false}>
              <View style={{ borderRadius: radius.xl, overflow: "hidden", borderWidth: 1, borderColor: colors.darkLine }}>
                <Image source={{ uri: photo }} style={{ width: "100%", height: 320 }} />
              </View>
              {optionsPanel}
              <Button title="Analyser ce repas" icon="sparkles" onPress={analyze} variant="primary" />
              <Button title="Reprendre une photo" icon="camera-outline" onPress={() => setPhoto(null)} variant="ghost" style={{ borderColor: colors.darkLine }} />
            </ScrollView>
          ) : !permission?.granted ? (
            /* ----- Permission caméra ----- */
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
              <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: colors.darkCard, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="camera" size={28} color={colors.accent} />
              </View>
              <Text style={{ color: "#F2F6EC", fontSize: 17, fontWeight: "800" }}>Accès caméra requis</Text>
              <Text style={{ color: colors.darkMuted, fontSize: 13.5, textAlign: "center", lineHeight: 20, maxWidth: 280 }}>
                Autorisez la caméra pour photographier votre assiette, ou importez une photo depuis la galerie.
              </Text>
              <Button title={permission?.canAskAgain === false ? "Ouvrir les réglages" : "Autoriser la caméra"} onPress={() => void requestPermission()} />
              <Button title="Choisir une photo" icon="images" variant="ghost" onPress={pickFromGallery} />
            </View>
          ) : (
            /* ----- Viseur ----- */
            <View style={{ flex: 1, gap: 14 }}>
              <View style={{ flex: 1, borderRadius: radius.xl, overflow: "hidden", backgroundColor: colors.darkCard }}>
                <CameraView ref={cameraRef} style={{ flex: 1 }} enableTorch={false} />
                {/* Grille des tiers */}
                <View pointerEvents="none" style={{ position: "absolute", top: 0, bottom: 0, left: "33%", width: 1, backgroundColor: "rgba(255,255,255,0.12)" }} />
                <View pointerEvents="none" style={{ position: "absolute", top: 0, bottom: 0, left: "66%", width: 1, backgroundColor: "rgba(255,255,255,0.12)" }} />
                <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, top: "33%", height: 1, backgroundColor: "rgba(255,255,255,0.12)" }} />
                <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, top: "66%", height: 1, backgroundColor: "rgba(255,255,255,0.12)" }} />
                {/* Cadre */}
                <View pointerEvents="none" style={{ position: "absolute", inset: 14, borderRadius: radius.lg, borderWidth: 1.5, borderColor: "rgba(200,241,105,0.55)" }} />
              </View>

              <Pressable onPress={() => setShowOptions((v) => !v)} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.darkCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.darkLine, paddingHorizontal: 16, paddingVertical: 13 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Ionicons name="options-outline" size={17} color={colors.accent} />
                  <Text style={{ color: "#F2F6EC", fontSize: 14, fontWeight: "700" }}>Assiette & contexte</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  {diametre != null ? <Chip color={colors.accentInk} bg={colors.accent}>{diametre} cm</Chip> : null}
                  <Ionicons name={showOptions ? "chevron-up" : "chevron-down"} size={15} color={colors.darkMuted} />
                </View>
              </Pressable>
              {showOptions ? optionsPanel : null}

              {/* Déclencheur */}
              <View style={{ alignItems: "center", paddingBottom: 6 }}>
                <Pressable
                  onPress={takePicture}
                  style={({ pressed }) => [
                    {
                      width: 76,
                      height: 76,
                      borderRadius: radius.pill,
                      borderWidth: 4,
                      borderColor: colors.accent,
                      alignItems: "center",
                      justifyContent: "center",
                      transform: [{ scale: pressed ? 0.92 : 1 }],
                    },
                  ]}
                >
                  <View style={{ width: 60, height: 60, borderRadius: radius.pill, backgroundColor: colors.accent }} />
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
