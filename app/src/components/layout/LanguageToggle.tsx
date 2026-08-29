import { Button } from '@/components/ui/button'
import { useLanguage } from '@/features/language/useLanguage'
import { LANGUAGES, languageLabel } from '@/features/language/languages'

/**
 * Switches the language the whole app is scoped to. Persisted like a theme
 * setting, so it survives reloads rather than living in the URL.
 */
export function LanguageToggle() {
  const { language, setLanguage } = useLanguage()

  return (
    <div className="flex items-center gap-0.5 rounded-lg border p-0.5" role="group" aria-label="Learning language">
      {LANGUAGES.map((option) => (
        <Button
          key={option}
          type="button"
          size="xs"
          variant={option === language ? 'default' : 'ghost'}
          aria-pressed={option === language}
          onClick={() => setLanguage(option)}
        >
          {languageLabel(option)}
        </Button>
      ))}
    </div>
  )
}
