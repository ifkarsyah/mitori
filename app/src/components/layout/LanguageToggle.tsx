import { Button } from '@/components/ui/button'
import { useLanguage } from '@/features/language/useLanguage'

/**
 * Switches the language the whole app is scoped to. Persisted like a theme
 * setting, so it survives reloads rather than living in the URL. The options
 * come from the language table, so a new language needs no change here.
 */
export function LanguageToggle() {
  const { language, setLanguage, languages } = useLanguage()

  if (languages.length < 2) return null

  return (
    <div className="flex items-center gap-0.5 rounded-lg border p-0.5" role="group" aria-label="Learning language">
      {languages.map((option) => (
        <Button
          key={option.code}
          type="button"
          size="xs"
          variant={option.code === language ? 'default' : 'ghost'}
          aria-pressed={option.code === language}
          onClick={() => setLanguage(option.code)}
        >
          {option.name}
        </Button>
      ))}
    </div>
  )
}
