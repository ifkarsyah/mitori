import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60, // 1 hour — this is manually-curated reference data, not live-changing
      refetchOnWindowFocus: false,
    },
  },
})
