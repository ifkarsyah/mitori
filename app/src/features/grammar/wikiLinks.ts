import type { GrammarPoint } from './api'

/**
 * Resolves a raw [[target]] wiki-link against the current grammar point's own slug.
 * Targets seen in content are one of:
 *  - a bare filename in the same folder as the current point, e.g. [[1a-は]]
 *  - a relative cross-folder path, e.g. [[../2-verb/2-て-form]]
 *  - a bare top-level slug, e.g. [[0-overview]]
 */
function resolveWikiTarget(target: string, currentSlug: string, slugSet: Set<string>): string | null {
  let primary: string
  if (target.startsWith('../')) {
    primary = target.slice(3)
  } else if (target.includes('/')) {
    primary = target
  } else {
    const lastSlash = currentSlug.lastIndexOf('/')
    const currentFolder = lastSlash === -1 ? null : currentSlug.slice(0, lastSlash)
    primary = currentFolder ? `${currentFolder}/${target}` : target
  }
  if (slugSet.has(primary)) return primary
  if (slugSet.has(target)) return target
  return null
}

/** Replaces [[target]] wiki-links with real markdown links to other grammar points' titles.
 *  Unresolvable targets fall back to plain text (brackets stripped) rather than a dead link. */
export function resolveWikiLinks(
  content: string,
  currentSlug: string,
  pointsBySlug: Map<string, GrammarPoint>,
): string {
  const slugSet = new Set(pointsBySlug.keys())
  return content.replace(/\[\[([^\]]+)\]\]/g, (_match, rawTarget: string) => {
    const target = rawTarget.trim()
    const resolvedSlug = resolveWikiTarget(target, currentSlug, slugSet)
    if (!resolvedSlug) return target
    const point = pointsBySlug.get(resolvedSlug)!
    return `[${point.title}](/grammar/${resolvedSlug})`
  })
}
