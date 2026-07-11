const PAGE_SIZE = 1000

/**
 * PostgREST caps responses at 1000 rows by default. All our tables can exceed
 * that, so every list query must paginate until a short page signals the end.
 */
export async function fetchAllRows<T>(
  queryPage: (from: number, to: number) => Promise<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const allRows: T[] = []
  let from = 0

  while (true) {
    const { data, error } = await queryPage(from, from + PAGE_SIZE - 1)
    if (error) throw error
    if (!data || data.length === 0) break
    allRows.push(...data)
    if (data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  return allRows
}
