import { useCallback, useMemo, useState, type ReactNode } from 'react'
import {
  DEFAULT_LANGUAGE,
  isLanguage,
  LANGUAGE_STORAGE_KEY,
  LanguageContext,
  type Language,
} from './languages'

function readStoredLanguage(): Language {
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY)
  return isLanguage(stored) ? stored : DEFAULT_LANGUAGE
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(readStoredLanguage)

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next)
    localStorage.setItem(LANGUAGE_STORAGE_KEY, next)
  }, [])

  const value = useMemo(() => ({ language, setLanguage }), [language, setLanguage])

  return <LanguageContext value={value}>{children}</LanguageContext>
}
