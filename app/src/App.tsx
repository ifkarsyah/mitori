import { Outlet } from 'react-router'
import { NavBar } from '@/components/layout/NavBar'
import { PageContainer } from '@/components/layout/PageContainer'
import { useLanguage } from '@/features/language/useLanguage'

export function App() {
  const { language } = useLanguage()

  return (
    <div className="min-h-svh bg-background text-foreground">
      <NavBar />
      <PageContainer>
        {/* Remount pages on a language switch so filter state that only makes
            sense for the previous language (a JLPT level, a kana type) resets
            instead of silently filtering the new language down to nothing. */}
        <Outlet key={language} />
      </PageContainer>
    </div>
  )
}
