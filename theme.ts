// theme.ts

export const LightTheme = {
  /* ---------- Backgrounds ---------- */
  bg: "#F8FAFC",
  bg2: "#FFFFFF",

  /* ---------- Surfaces ---------- */
  card: "#FFFFFF",
  cardSecondary: "#F1F5F9",

  /* ---------- Borders ---------- */
  border: "#E2E8F0",
  divider: "#CBD5E1",

  /* ---------- Text ---------- */
  text: "#111827",
  sub: "#64748B",
  mute: "#94A3B8",
  textInverse: "#FFFFFF",

  /* ---------- Brand ---------- */
  primary: "#A855F7",
  primarySoft: "rgba(168,85,247,0.12)",

  /* ---------- Status ---------- */
  success: "#22C55E",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#3B82F6",

  /* ---------- Icons ---------- */
  icon: "#64748B",
  iconActive: "#A855F7",

  /* ---------- Inputs ---------- */
  inputBg: "#FFFFFF",
  inputBorder: "#CBD5E1",
  placeholder: "#94A3B8",

  /* ---------- Misc ---------- */
  overlay: "rgba(0,0,0,0.45)",

  white: "#FFFFFF",
  black: "#000000",

  /* ----- Shadow ------ */
  shadow: "#000000",
  shadowOpacity: 0.08,
  glass: "rgba(255,255,255,0.55)",
};

export const DarkTheme = {
  /* ---------- Backgrounds ---------- */
  bg: "#0B0714",
  bg2: "#120A22",

  /* ---------- Surfaces ---------- */
  card: "rgba(255,255,255,0.04)",
  cardSecondary: "rgba(255,255,255,0.08)",

  /* ---------- Borders ---------- */
  border: "rgba(255,255,255,0.08)",
  divider: "rgba(255,255,255,0.12)",

  /* ---------- Text ---------- */
  text: "#FFFFFF",
  sub: "rgba(255,255,255,0.65)",
  mute: "rgba(255,255,255,0.45)",
  textInverse: "#111827",

  /* ---------- Brand ---------- */
  primary: "#A855F7",
  primarySoft: "rgba(168,85,247,0.15)",

  /* ---------- Status ---------- */
  success: "#22C55E",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#3B82F6",

  /* ---------- Icons ---------- */
  icon: "#94A3B8",
  iconActive: "#C084FC",

  /* ---------- Inputs ---------- */
  inputBg: "rgba(255,255,255,0.04)",
  inputBorder: "rgba(255,255,255,0.08)",
  placeholder: "#94A3B8",

  /* ---------- Misc ---------- */
  overlay: "rgba(0,0,0,0.6)",

  white: "#FFFFFF",
  black: "#000000",

  /* ------ Shadow ------- */
  shadow: "#000000",
  shadowOpacity: 0.35,
  glass: "rgba(255,255,255,0.04)",
};

export type Theme = typeof LightTheme;

export const HeroColors = {
  swap: {
    tint: "#7C3AED",
    tint2: "#4C1D95",
  },

  mates: {
    tint: "#EA580C",
    tint2: "#7C2D12",
  },

  help: {
    tint: "#0D9488",
    tint2: "#134E4A",
  },
};

export const ActivityColors = {
  walking: "#A78BFA",
  coffee: "#FBBF24",
  gym: "#60A5FA",
  movies: "#F472B6",
  cycling: "#34D399",
};
