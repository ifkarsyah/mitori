import { NavLink } from 'react-router'
import { cn } from '@/lib/utils'

const links = [
  { to: '/', label: 'Overview', end: true },
  { to: '/kanji', label: 'Kanji' },
  { to: '/kotoba', label: 'Kotoba' },
  { to: '/context', label: 'Context' },
  { to: '/source', label: 'Source' },
  { to: '/sentences', label: 'Sentences' },
  { to: '/grammar', label: 'Grammar' },
  { to: '/resources', label: 'Resources' },
  { to: '/quality', label: 'Quality' },
]

export function NavBar() {
  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
        <span className="font-semibold">mitori</span>
        <nav className="flex gap-4">
          {links.map((link) => (
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
      </div>
    </header>
  )
}
