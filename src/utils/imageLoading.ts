export class ImageLoadCache {
  private urls = new Map<string, true>()

  constructor(private readonly limit = 200) {}

  has(url: string): boolean {
    if (!this.urls.has(url)) return false
    this.urls.delete(url)
    this.urls.set(url, true)
    return true
  }

  add(url: string): void {
    if (!url) return
    this.urls.delete(url)
    this.urls.set(url, true)
    while (this.urls.size > this.limit) this.urls.delete(this.urls.keys().next().value!)
  }

  delete(url: string): void {
    this.urls.delete(url)
  }
}

const imageLoadCache = new ImageLoadCache()

/** Tracks rendering only; the browser/mini-program still owns the image bytes. */
export class ImageLoadState {
  src = ''
  requestId = 0
  status: 'loading' | 'loaded' | 'error' = 'loading'
  animate = true

  constructor(private readonly cache = imageLoadCache) {}

  setSource(src: string): void {
    this.src = src
    this.requestId += 1
    this.status = 'loading'
    this.animate = !this.cache.has(src)
  }

  loaded(requestId: number): boolean {
    if (requestId !== this.requestId || this.status !== 'loading') return false
    this.status = 'loaded'
    this.cache.add(this.src)
    return true
  }

  failed(requestId: number): boolean {
    if (requestId !== this.requestId || this.status !== 'loading') return false
    this.status = 'error'
    this.cache.delete(this.src)
    return true
  }

  retry(): void {
    this.setSource(this.src)
  }
}

export function adjacentImageIndexes(current: number, total: number): number[] {
  if (total <= 0) return []
  return [...new Set([-1, 0, 1].map((offset) => (((current + offset) % total) + total) % total))]
}
