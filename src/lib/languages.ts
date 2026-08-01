export interface AppLanguage {
  code: string;
  label: string;
  english: string;
}

// A curated set — not every language, just the ones most Addiblock users speak.
export const LANGUAGES: AppLanguage[] = [
  { code: "en", label: "English", english: "English" },
  { code: "fr", label: "Français", english: "French" },
  { code: "es", label: "Español", english: "Spanish" },
  { code: "pt", label: "Português", english: "Portuguese" },
  { code: "de", label: "Deutsch", english: "German" },
  { code: "it", label: "Italiano", english: "Italian" },
  { code: "nl", label: "Nederlands", english: "Dutch" },
  { code: "pl", label: "Polski", english: "Polish" },
  { code: "tr", label: "Türkçe", english: "Turkish" },
  { code: "ar", label: "العربية", english: "Arabic" },
  { code: "hi", label: "हिन्दी", english: "Hindi" },
  { code: "ja", label: "日本語", english: "Japanese" },
];

export function languageName(code: string | undefined): string {
  return LANGUAGES.find((l) => l.code === code)?.english ?? "English";
}

export function isSupportedLanguage(code: string | undefined): boolean {
  return !!code && LANGUAGES.some((l) => l.code === code);
}
