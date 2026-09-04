// theme.ts

export const JuntoNowColors = {
  ride: {
    tint: "#16A34A",
    tintDark: "#4ADE80",
    light: {
      bg: "#F0FDF4",
      border: "#DCFCE7",
      iconBg: "#DCFCE7",
      btnBg: "#DCFCE7",
      btnText: "#16A34A",
      title: "#0F172A",
      sub: "#64748B",
    },
    dark: {
      bg: "rgba(34, 197, 94, 0.12)",
      border: "rgba(34, 197, 94, 0.28)",
      iconBg: "rgba(34, 197, 94, 0.22)",
      btnBg: "rgba(34, 197, 94, 0.22)",
      btnText: "#4ADE80",
      title: "#F8FAFC",
      sub: "rgba(255, 255, 255, 0.7)",
    },
  },

  help: {
    tint: "#EA580C",
    tintDark: "#FB923C",
    light: {
      bg: "#FFF7ED",
      border: "#FFEDD5",
      iconBg: "#FFEDD5",
      btnBg: "#FFEDD5",
      btnText: "#EA580C",
      title: "#0F172A",
      sub: "#64748B",
    },
    dark: {
      bg: "rgba(234, 88, 12, 0.12)",
      border: "rgba(234, 88, 12, 0.28)",
      iconBg: "rgba(234, 88, 12, 0.22)",
      btnBg: "rgba(234, 88, 12, 0.22)",
      btnText: "#FB923C",
      title: "#F8FAFC",
      sub: "rgba(255, 255, 255, 0.7)",
    },
  },

  service: {
    tint: "#9333EA",
    tintDark: "#C084FC",
    light: {
      bg: "#FAF5FF",
      border: "#F3E8FF",
      iconBg: "#F3E8FF",
      btnBg: "#F3E8FF",
      btnText: "#9333EA",
      title: "#0F172A",
      sub: "#64748B",
    },
    dark: {
      bg: "rgba(168, 85, 247, 0.12)",
      border: "rgba(168, 85, 247, 0.28)",
      iconBg: "rgba(168, 85, 247, 0.22)",
      btnBg: "rgba(168, 85, 247, 0.22)",
      btnText: "#C084FC",
      title: "#F8FAFC",
      sub: "rgba(255, 255, 255, 0.7)",
    },
  },

  deals: {
    tint: "#CA8A04",
    tintDark: "#FACC15",
    light: {
      bg: "#FEFCE8",
      border: "#FEF08A",
      iconBg: "#FEF08A",
      btnBg: "#FEF08A",
      btnText: "#CA8A04",
      title: "#0F172A",
      sub: "#64748B",
    },
    dark: {
      bg: "rgba(202, 138, 4, 0.12)",
      border: "rgba(202, 138, 4, 0.28)",
      iconBg: "rgba(202, 138, 4, 0.22)",
      btnBg: "rgba(202, 138, 4, 0.22)",
      btnText: "#FACC15",
      title: "#F8FAFC",
      sub: "rgba(255, 255, 255, 0.7)",
    },
  },

  company: {
    tint: "#2563EB",
    tintDark: "#60A5FA",
    light: {
      bg: "#EFF6FF",
      border: "#DBEAFE",
      iconBg: "#DBEAFE",
      btnBg: "#DBEAFE",
      btnText: "#2563EB",
      title: "#0F172A",
      sub: "#64748B",
    },
    dark: {
      bg: "rgba(37, 99, 235, 0.12)",
      border: "rgba(37, 99, 235, 0.28)",
      iconBg: "rgba(37, 99, 235, 0.22)",
      btnBg: "rgba(37, 99, 235, 0.22)",
      btnText: "#60A5FA",
      title: "#F8FAFC",
      sub: "rgba(255, 255, 255, 0.7)",
    },
  },

  new_here: {
    tint: "#059669",
    tintDark: "#34D399",
    light: {
      bg: "#ECFDF5",
      border: "#D1FAE5",
      iconBg: "#D1FAE5",
      btnBg: "#D1FAE5",
      btnText: "#059669",
      title: "#0F172A",
      sub: "#64748B",
    },
    dark: {
      bg: "rgba(5, 150, 105, 0.12)",
      border: "rgba(5, 150, 105, 0.28)",
      iconBg: "rgba(5, 150, 105, 0.22)",
      btnBg: "rgba(5, 150, 105, 0.22)",
      btnText: "#34D399",
      title: "#F8FAFC",
      sub: "rgba(255, 255, 255, 0.7)",
    },
  },

  // Fallback default for any newly added Junto Now features
  default: {
    tint: "#A855F7",
    tintDark: "#C084FC",
    light: {
      bg: "#FAF5FF",
      border: "#F3E8FF",
      iconBg: "#F3E8FF",
      btnBg: "#F3E8FF",
      btnText: "#A855F7",
      title: "#0F172A",
      sub: "#64748B",
    },
    dark: {
      bg: "rgba(168, 85, 247, 0.12)",
      border: "rgba(168, 85, 247, 0.28)",
      iconBg: "rgba(168, 85, 247, 0.22)",
      btnBg: "rgba(168, 85, 247, 0.22)",
      btnText: "#C084FC",
      title: "#F8FAFC",
      sub: "rgba(255, 255, 255, 0.7)",
    },
  },
};

export interface JuntoNowItemConfig {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  btn: string;
  colorKey?: keyof typeof JuntoNowColors | string;
  route?: string;
  query?: string;
  // Optional custom theme overrides for custom features
  customLightColors?: Partial<(typeof JuntoNowColors)["default"]["light"]> & {
    tint?: string;
  };
  customDarkColors?: Partial<(typeof JuntoNowColors)["default"]["dark"]> & {
    tintDark?: string;
  };
}

export const DefaultJuntoNowFeatures: JuntoNowItemConfig[] = [
  {
    id: "ride",
    icon: "car",
    title: "Need a Ride",
    subtitle: "2 people going your way",
    btn: "View Rides",
    colorKey: "ride",
    route: "/(screens)/rides",
  },
  {
    id: "help",
    icon: "heart",
    title: "Need Help",
    subtitle: "4 people available",
    btn: "Get Help",
    colorKey: "help",
    route: "/(screens)/ask-nearby",
  },
  {
    id: "service",
    icon: "construct",
    title: "Need a Service",
    subtitle: "3 professionals available",
    btn: "Find Service",
    colorKey: "service",
    route: "/(screens)/services",
  },
  {
    id: "something",
    icon: "bag-handle",
    title: "Local Deals",
    subtitle: "Buy & Sell items nearby",
    btn: "See Deals",
    colorKey: "deals",
    route: "/(screens)/deals",
  },
  {
    id: "company",
    icon: "people",
    title: "Need Company",
    subtitle: "6 people looking for something fun",
    btn: "Find People",
    colorKey: "company",
    route: "/(screens)/add-daymate",
  },
  {
    id: "new_here",
    icon: "location",
    title: "New Here",
    subtitle: "Visiting {city}?",
    btn: "Explore Now",
    colorKey: "new_here",
    route: "/(screens)/new-here",
  },
];

export function getJuntoNowFeatureColors(
  feature: JuntoNowItemConfig | string,
  isDark: boolean,
) {
  const colorKey =
    typeof feature === "string"
      ? feature
      : feature.colorKey || feature.id || "default";

  const config =
    (JuntoNowColors as Record<string, any>)[colorKey] || JuntoNowColors.default;

  const modeColors = isDark ? config.dark : config.light;
  const tint = isDark ? config.tintDark : config.tint;

  // Merge custom overrides if provided on the item config
  if (typeof feature !== "string") {
    const overrides = isDark
      ? feature.customDarkColors
      : feature.customLightColors;
    if (overrides) {
      return {
        ...modeColors,
        ...overrides,
        tint:
          (isDark
            ? feature.customDarkColors?.tintDark
            : feature.customLightColors?.tint) || tint,
      };
    }
  }

  return {
    ...modeColors,
    tint,
  };
}

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

  /* ----- Junto Now Config ----- */
  juntoNow: JuntoNowColors,
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

  /* ----- Junto Now Config ----- */
  juntoNow: JuntoNowColors,
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
