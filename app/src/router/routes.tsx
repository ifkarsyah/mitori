import { createBrowserRouter } from 'react-router'
import { App } from '@/App'
import { OverviewPage } from '@/features/overview/OverviewPage'
import { KanjiDashboardPage } from '@/features/kanji/KanjiDashboardPage'
import { KanjiDetailPage } from '@/features/kanji/KanjiDetailPage'
import { KotobaDashboardPage } from '@/features/kotoba/KotobaDashboardPage'
import { KotobaDetailPage } from '@/features/kotoba/KotobaDetailPage'
import { ContextDashboardPage } from '@/features/context/ContextDashboardPage'
import { ContextDetailPage } from '@/features/context/ContextDetailPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <OverviewPage /> },
      { path: 'kanji', element: <KanjiDashboardPage /> },
      { path: 'kanji/:id', element: <KanjiDetailPage /> },
      { path: 'kotoba', element: <KotobaDashboardPage /> },
      { path: 'kotoba/:id', element: <KotobaDetailPage /> },
      { path: 'context', element: <ContextDashboardPage /> },
      { path: 'context/:id', element: <ContextDetailPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
