import { Redirect } from "expo-router";

/** Onglet central : le vrai écran est /scan (pile Stack). */
export default function ScannerTab() {
  return <Redirect href="/scan" />;
}
