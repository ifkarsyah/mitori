import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchLanguageList } from './api'
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  LanguageContext,
  type Language,
} from './languages'

function readStoredLanguage(): Language {
  return localStorage.getItem(LANGUAGE_STORAGE_KEY) ?? DEFAULT_LANGUAGE
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(readStoredLanguage)

  // The list drives the toggle and the per-language feature flags, so adding a
  // language is a database row rather than an edit here.
  const { data: languages } = useQuery({
    queryKey: ['language', 'list'],
    queryFn: fetchLanguageList,
    staleTime: Infinity,
  })

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next)
    localStorage.setItem(LANGUAGE_STORAGE_KEY, next)
  }, [])

  const value = useMemo(() => {
    const list = languages ?? []
    const byCode = new Map(list.map((row) => [row.code, row]))
    return {
      language,
      setLanguage,
      languages: list,
      current: byCode.get(language),
      // Falls back to the raw code so labels still render before the list loads.
      labelFor: (code: string) => byCode.get(code)?.name ?? code,
    }
  }, [language, setLanguage, languages])

  return <LanguageContext value={value}>{children}</LanguageContext>
}
