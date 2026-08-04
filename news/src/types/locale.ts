// 1. Union Type
export type Locale = "am" | "en" | "om" |"sw";

// 2. Readonly array for iterations & dropdowns
export const SUPPORTED_LOCALES: readonly Locale[] = ["am", "en", "om", "sw"] as const;

// 3. Metadata dictionary for UI rendering
export const LOCALE_LABELS: Record<Locale, { name: string; nativeName: string }> = {
  am: { name: "Amharic", nativeName: "አማርኛ" },
  en: { name: "English", nativeName: "English" },
  sw: { name: "Swahili", nativeName: "Kiswahili" },
  om: { name: "Oromo"  , nativeName: "Afaan Oromoo" },
};

// 4. Type Guard function for runtime validation
export function isValidLocale(value: string): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale);
}