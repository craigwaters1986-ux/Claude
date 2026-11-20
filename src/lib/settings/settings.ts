/**
 * User settings: appearance, report branding and defaults.
 *
 * Saved to the user's account (user_settings) so phone and laptop match, and
 * mirrored in localStorage so the theme applies before the page first paints
 * (no flash of the wrong colours), even with no signal.
 */
export type Theme = "system" | "light" | "dark";
export type Accent = "yellow" | "orange" | "green" | "blue" | "pink";
export type TextSize = "standard" | "large";
export type ReportColor = "red" | "orange" | "green" | "blue" | "navy" | "charcoal";

export type Settings = {
  theme: Theme;
  accent: Accent;
  textSize: TextSize;
  /** Snag list layout on tablets and laptops. */
  snagView: "cards" | "table";
  /** Shown at the top of every report. */
  companyName: string;
  logoUrl: string | null;
  logoPath: string | null;
  /** Default "Prepared by" on reports. */
  preparedBy: string;
  /** Hand-drawn signature (transparent PNG), printed on report cover pages. */
  signatureUrl: string | null;
  signaturePath: string | null;
  /** Colour of rules and headings in reports. */
  reportColor: ReportColor;
};

export const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  accent: "yellow",
  textSize: "standard",
  snagView: "table",
  companyName: "",
  logoUrl: null,
  logoPath: null,
  preparedBy: "",
  signatureUrl: null,
  signaturePath: null,
  reportColor: "red",
};

/** Report colours: dark enough to read on white paper and to print well. */
export const REPORT_COLORS: { value: ReportColor; label: string; hex: string }[] = [
  { value: "red", label: "Red", hex: "#d32f2f" },
  { value: "orange", label: "Orange", hex: "#e8590c" },
  { value: "green", label: "Green", hex: "#2f7d32" },
  { value: "blue", label: "Blue", hex: "#1f6feb" },
  { value: "navy", label: "Navy", hex: "#1e3a5f" },
  { value: "charcoal", label: "Charcoal", hex: "#2b2b2b" },
];
export const reportColorHex = (c: ReportColor) => REPORT_COLORS.find((r) => r.value === c)?.hex ?? REPORT_COLORS[0].hex;

export const ACCENTS: { value: Accent; label: string; swatch: string }[] = [
  { value: "yellow", label: "Safety yellow", swatch: "oklch(0.86 0.173 91.9)" },
  { value: "orange", label: "Orange", swatch: "oklch(0.75 0.18 55)" },
  { value: "green", label: "Lime", swatch: "oklch(0.86 0.2 128)" },
  { value: "blue", label: "Sky blue", swatch: "oklch(0.78 0.13 230)" },
  { value: "pink", label: "Pink", swatch: "oklch(0.78 0.15 350)" },
];

const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
  allowed.includes(v as T) ? (v as T) : fallback;
const text = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");

/** Accept anything (old versions, hand-edited JSON) and return valid settings. */
export function normaliseSettings(raw: unknown): Settings {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    theme: oneOf(r.theme, ["system", "light", "dark"] as const, DEFAULT_SETTINGS.theme),
    accent: oneOf(r.accent, ["yellow", "orange", "green", "blue", "pink"] as const, DEFAULT_SETTINGS.accent),
    textSize: oneOf(r.textSize, ["standard", "large"] as const, DEFAULT_SETTINGS.textSize),
    snagView: oneOf(r.snagView, ["cards", "table"] as const, DEFAULT_SETTINGS.snagView),
    companyName: text(r.companyName, 120),
    logoUrl: typeof r.logoUrl === "string" ? r.logoUrl : null,
    logoPath: typeof r.logoPath === "string" ? r.logoPath : null,
    preparedBy: text(r.preparedBy, 120),
    signatureUrl: typeof r.signatureUrl === "string" ? r.signatureUrl : null,
    signaturePath: typeof r.signaturePath === "string" ? r.signaturePath : null,
    reportColor: oneOf(r.reportColor, ["red", "orange", "green", "blue", "navy", "charcoal"] as const, DEFAULT_SETTINGS.reportColor),
  };
}

// ---------------------------------------------------------------------------
// Device copy (applied before first paint by the inline script in layout.tsx)
// ---------------------------------------------------------------------------
export const SETTINGS_STORAGE_KEY = "snaglist.settings";

export function readLocalSettings(): Settings {
  try {
    return normaliseSettings(JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) ?? "{}"));
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function writeLocalSettings(settings: Settings) {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // storage blocked: settings still apply for this visit
  }
}

/** Apply the appearance settings to the page. */
export function applyAppearance(settings: Pick<Settings, "theme" | "accent" | "textSize">) {
  const root = document.documentElement;
  const dark =
    settings.theme === "dark" || (settings.theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.classList.toggle("dark", dark);
  root.style.colorScheme = dark ? "dark" : "light";
  root.dataset.accent = settings.accent;
  root.dataset.text = settings.textSize;
  // Browser toolbar: black top bar in both themes.
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", "#000000");
}

/**
 * Runs in <head> before the page paints, so the right theme shows from the
 * first frame. Kept tiny and self-contained (no imports).
 */
export const APPEARANCE_BOOT_SCRIPT = `(function(){try{var s=JSON.parse(localStorage.getItem(${JSON.stringify(
  SETTINGS_STORAGE_KEY,
)})||"{}");var t=s.theme||"system";var d=t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;if(d)r.classList.add("dark");r.style.colorScheme=d?"dark":"light";r.dataset.accent=s.accent||"yellow";r.dataset.text=s.textSize||"standard";}catch(e){}})();`;
