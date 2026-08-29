import { useContext } from 'react'
import { LanguageContext } from './languages'

/** The language the whole app is currently scoped to. */
export function useLanguage() {
  const value = useContext(LanguageContext)
  if (!value) throw new Error('useLanguage must be used inside a LanguageProvider')
  return value
}
