import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router'
import './index.css'
import { queryClient } from '@/lib/queryClient'
import { router } from '@/router/routes'
import { LanguageProvider } from '@/features/language/LanguageProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* LanguageProvider is inside the query client: it fetches the language list. */}
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <RouterProvider router={router} />
      </LanguageProvider>
    </QueryClientProvider>
  </StrictMode>,
)
