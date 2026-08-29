import { useContext } from 'react'
import { LanguageContext } from './languages'

/** The language the whole app is currently scoped to, plus the language list. */
export function useLanguage() {
  const value = useContext(LanguageContext)
  if (!value) throw new Error('useLanguage must be used inside a LanguageProvider')
  return value
}
