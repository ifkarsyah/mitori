import { createContext } from 'react'

export const LANGUAGES = ['ja', 'de'] as const

export type Language = (typeof LANGUAGES)[number]

export const DEFAULT_LANGUAGE: Language = 'ja'

/** Key in localStorage; the choice persists across sessions like a theme setting. */
export const LANGUAGE_STORAGE_KEY = 'mitori.language'

const LANGUAGE_LABELS: Record<Language, string> = {
  ja: 'Japanese',
  de: 'German',
}

export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && (LANGUAGES as readonly string[]).includes(value)
}

export function languageLabel(value: string): string {
  return isLanguage(value) ? LANGUAGE_LABELS[value] : value
}

/**
 * Features that only exist for Japanese. Kanji is structural — German has no
 * logographic script — so its nav entry is hidden rather than shown empty.
 */
export function hasKanji(language: Language): boolean {
  return language === 'ja'
}

export type LanguageContextValue = {
  language: Language
  setLanguage: (language: Language) => void
}

export const LanguageContext = createContext<LanguageContextValue | null>(null)
