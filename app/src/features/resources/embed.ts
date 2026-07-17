/** Builds a privacy-enhanced (youtube-nocookie.com) embed URL, preserving a `t=` timestamp as `start=`. */
export function getYoutubeEmbedUrl(url: string): string | null {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }

  const videoId = parsed.hostname.includes('youtu.be')
    ? parsed.pathname.slice(1)
    : parsed.searchParams.get('v')
  if (!videoId) return null

  const embedUrl = new URL(`https://www.youtube-nocookie.com/embed/${videoId}`)
  const start = parsed.searchParams.get('t')?.match(/^(\d+)/)?.[1]
  if (start) embedUrl.searchParams.set('start', start)

  return embedUrl.toString()
}
