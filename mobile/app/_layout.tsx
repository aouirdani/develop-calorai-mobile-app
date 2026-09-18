/**
 * Layout racine Expo Router : hydrate le store persisté (AsyncStorage),
 * garde l'onboarding comme porte d'entrée, puis pile Stack au-dessus des tabs.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { colors } from "../constants/theme";
import { createAppStore, useAppState } from "../store/appStore";
import { STORAGE_KEY } from "../store/appStore";
import type { StorageAdapter } from "../store/storage";

const asyncStorageAdapter: StorageAdapter = {
  read: () => AsyncStorage.getItem(STORAGE_KEY),
  write: (v) => AsyncStorage.setItem(STORAGE_KEY, v),
};

/** Instance unique pour toute l'app (écrans, hooks, services). */
export const appStore = createAppStore(asyncStorageAdapter);

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const segments = useSegments();
  const onboardingDone = useAppState(appStore, (s) => s.onboarding_done);

  useEffect(() => {
    appStore.hydrate().finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;
    const inOnboarding = segments[0] === "onboarding";
    if (!onboardingDone && !inOnboarding) router.replace("/onboarding");
    else if (onboardingDone && inOnboarding) router.replace("/");
  }, [ready, onboardingDone, segments, router]);

  if (!ready) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" options={{ animation: "fade" }} />
        <Stack.Screen name="scan" />
        <Stack.Screen name="barcode" />
        <Stack.Screen name="analysis" options={{ animation: "fade" }} />
        <Stack.Screen name="result/[id]" />
      </Stack>
    </>
  );
}
