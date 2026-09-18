/**
 * Barre d'onglets : Aujourd'hui · Journal · [Scanner] · Aliments · Profil.
 * Le bouton central pousse l'écran caméra de la pile Stack (pas un onglet).
 */
import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { colors, radius } from "../../constants/theme";

function CenterScanButton() {
  const router = useRouter();
  return (
    <View style={{ alignItems: "center", justifyContent: "center", marginTop: -26 }}>
      <Pressable
        onPress={() => router.push("/scan")}
        style={({ pressed }) => [
          {
            width: 62,
            height: 62,
            borderRadius: radius.pill,
            backgroundColor: colors.primaryDeep,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 4,
            borderColor: colors.bg,
            shadowColor: colors.primaryInk,
            shadowOpacity: 0.35,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 6 },
            elevation: 8,
            transform: [{ scale: pressed ? 0.94 : 1 }],
          },
        ]}
      >
        <Ionicons name="camera" size={26} color={colors.accent} />
      </Pressable>
    </View>
  );
}

export default function TabsLayout() {
  const icon = (name: keyof typeof Ionicons.glyphMap, focused: boolean) => (
    <Ionicons name={name} size={23} color={focused ? colors.primary : colors.faint} />
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.faint,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.line,
          height: 84,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Aujourd'hui", tabBarIcon: ({ focused }) => icon("home", focused) }} />
      <Tabs.Screen name="journal" options={{ title: "Journal", tabBarIcon: ({ focused }) => icon("book", focused) }} />
      <Tabs.Screen
        name="scanner"
        options={{
          title: "",
          tabBarButton: () => <CenterScanButton />,
        }}
      />
      <Tabs.Screen name="aliments" options={{ title: "Aliments", tabBarIcon: ({ focused }) => icon("search", focused) }} />
      <Tabs.Screen name="profil" options={{ title: "Profil", tabBarIcon: ({ focused }) => icon("person", focused) }} />
    </Tabs>
  );
}


