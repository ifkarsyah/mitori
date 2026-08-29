import { createBrowserRouter } from 'react-router'
import { App } from '@/App'
import { OverviewPage } from '@/features/overview/OverviewPage'
import { KanjiDashboardPage } from '@/features/kanji/KanjiDashboardPage'
import { KanjiDetailPage } from '@/features/kanji/KanjiDetailPage'
import { KotobaDashboardPage } from '@/features/kotoba/KotobaDashboardPage'
import { KotobaDetailPage } from '@/features/kotoba/KotobaDetailPage'
import { ConceptDashboardPage } from '@/features/concept/ConceptDashboardPage'
import { ConceptDetailPage } from '@/features/concept/ConceptDetailPage'
import { CategoryDashboardPage } from '@/features/category/CategoryDashboardPage'
import { CategoryDetailPage } from '@/features/category/CategoryDetailPage'
import { SourceDashboardPage } from '@/features/source/SourceDashboardPage'
import { SourceDetailPage } from '@/features/source/SourceDetailPage'
import { SentenceDashboardPage } from '@/features/sentences/SentenceDashboardPage'
import { GrammarDashboardPage } from '@/features/grammar/GrammarDashboardPage'
import { GrammarDetailPage } from '@/features/grammar/GrammarDetailPage'
import { ResourcesDashboardPage } from '@/features/resources/ResourcesDashboardPage'
import { ResourceDetailPage } from '@/features/resources/ResourceDetailPage'
import { ChannelDetailPage } from '@/features/resources/ChannelDetailPage'
import { QualityDashboardPage } from '@/features/quality/QualityDashboardPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <OverviewPage /> },
      { path: 'kanji', element: <KanjiDashboardPage /> },
      { path: 'kanji/:character', element: <KanjiDetailPage /> },
      { path: 'kotoba', element: <KotobaDashboardPage /> },
      { path: 'kotoba/:word', element: <KotobaDetailPage /> },
      { path: 'concept', element: <ConceptDashboardPage /> },
      { path: 'concept/:id', element: <ConceptDetailPage /> },
      { path: 'category', element: <CategoryDashboardPage /> },
      { path: 'category/:slug', element: <CategoryDetailPage /> },
      { path: 'source', element: <SourceDashboardPage /> },
      { path: 'source/:id', element: <SourceDetailPage /> },
      { path: 'sentences', element: <SentenceDashboardPage /> },
      { path: 'grammar', element: <GrammarDashboardPage /> },
      { path: 'grammar/*', element: <GrammarDetailPage /> },
      { path: 'resources', element: <ResourcesDashboardPage /> },
      { path: 'resources/channel/:slug', element: <ChannelDetailPage /> },
      { path: 'resources/:id', element: <ResourceDetailPage /> },
      { path: 'quality', element: <QualityDashboardPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
