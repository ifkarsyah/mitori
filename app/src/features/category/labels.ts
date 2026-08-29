import type { Category } from './api'

export const UNCATEGORISED = '__uncategorised__'

/** Category name for a stringified id, for filter and group-by labels. */
export function categoryNameLabel(value: string, byId: Map<number, Category>): string {
  if (value === UNCATEGORISED) return 'No category'
  return byId.get(Number(value))?.name ?? value
}
