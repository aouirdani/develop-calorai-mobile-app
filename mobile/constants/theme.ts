/**
 * Identité visuelle CalorAI — partagée par l'app React Native.
 * Palette "potager" : papier chaud, vert pin profond, accent lime,
 * couleurs macro nutritionnelles conventionnelles.
 */
export const colors = {
  bg: "#F2F4EC",
  surface: "#FCFCF8",
  surfaceAlt: "#EEF1E4",
  field: "#F5F7EE",
  line: "#E2E6D6",
  lineStrong: "#D2D8C4",

  ink: "#182720",
  inkSoft: "#3E4E42",
  muted: "#6C7A68",
  faint: "#98A493",

  primary: "#1C5A3C",
  primaryDeep: "#123E29",
  primaryInk: "#0E2E1F",
  primarySoft: "#E1ECDA",
  accent: "#C8F169",
  accentInk: "#3C4A12",

  dark: "#0D1712",
  darkCard: "#142019",
  darkLine: "#24382C",
  darkMuted: "#8FA394",

  protein: "#D95E3F",
  proteinSoft: "#FBE4DC",
  carbs: "#DE9A26",
  carbsSoft: "#FAEFD8",
  fat: "#3D8E85",
  fatSoft: "#DFEFEC",

  warnBg: "#F6ECCF",
  warnText: "#8A6A14",
  danger: "#BE4B32",
  dangerSoft: "#F7E2DC",
} as const;

export const radius = {
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const hitSlop = { top: 8, bottom: 8, left: 8, right: 8 } as const;
