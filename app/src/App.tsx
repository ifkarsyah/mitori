import { Outlet } from 'react-router'
import { NavBar } from '@/components/layout/NavBar'
import { PageContainer } from '@/components/layout/PageContainer'

export function App() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <NavBar />
      <PageContainer>
        <Outlet />
      </PageContainer>
    </div>
  )
}
