import { NavLink } from 'react-router'
import { cn } from '@/lib/utils'
import { LanguageToggle } from '@/components/layout/LanguageToggle'
import { useLanguage } from '@/features/language/useLanguage'

const links = [
  { to: '/', label: 'Overview', end: true },
  { to: '/kanji', label: 'Kanji', japaneseOnly: true },
  { to: '/kotoba', label: 'Kotoba' },
  { to: '/concept', label: 'Concept' },
  { to: '/context', label: 'Context' },
  { to: '/source', label: 'Source' },
  { to: '/sentences', label: 'Sentences' },
  { to: '/grammar', label: 'Grammar' },
  { to: '/resources', label: 'Resources' },
  { to: '/quality', label: 'Quality' },
]

export function NavBar() {
  const { current } = useLanguage()
  // The kanji table holds Japanese kanji specifically (JLPT, school grade).
  // Chinese also has has_characters, but sharing a Han character layer between
  // them is a later step — until then this is a Japanese-only feature.
  const visibleLinks = links.filter((link) => !link.japaneseOnly || current?.script === 'japanese')

  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
        <span className="font-semibold">mitori</span>
        <nav className="flex flex-wrap gap-4">
          {visibleLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  'text-sm text-muted-foreground hover:text-foreground',
                  isActive && 'font-medium text-foreground',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto">
          <LanguageToggle />
        </div>
      </div>
    </header>
  )
}
