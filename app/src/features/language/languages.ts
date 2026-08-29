import { createContext } from 'react'
import type { Tables } from '@/types/database'

export type LanguageRow = Tables<'language'>

/** A language code. The set of valid codes lives in the database, not here. */
export type Language = string

export const DEFAULT_LANGUAGE: Language = 'ja'

/** Key in localStorage; the choice persists across sessions like a theme setting. */
export const LANGUAGE_STORAGE_KEY = 'mitori.language'

export type LanguageContextValue = {
  /** The language the whole app is currently scoped to. */
  language: Language
  setLanguage: (language: Language) => void
  /** Every language the database knows about, in display order. */
  languages: LanguageRow[]
  /** The row for the selected language; undefined until the list has loaded. */
  current: LanguageRow | undefined
  labelFor: (code: string) => string
}

export const LanguageContext = createContext<LanguageContextValue | null>(null)
