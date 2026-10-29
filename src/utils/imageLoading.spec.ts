import { describe, expect, it } from 'vitest'
import { ref, effectScope } from 'vue'
import { ImageLoadCache, ImageLoadState, adjacentImageIndexes } from '@/utils/imageLoading'
import { useAdjacentImages } from '@/utils/useAdjacentImages'

describe('image loading', () => {
  it('keeps at most 200 successfully loaded URLs using LRU order', () => {
    const cache = new ImageLoadCache()
    for (let index = 0; index < 200; index++) cache.add(String(index))
    expect(cache.has('0')).toBe(true)
    cache.add('200')
    expect(cache.has('1')).toBe(false)
    expect(cache.has('0')).toBe(true)
    expect(cache.has('200')).toBe(true)
  })

  it('fades the first successful load and reuses its record across instances', () => {
    const cache = new ImageLoadCache()
    const first = new ImageLoadState(cache)
    first.setSource('/photo.jpg')
    expect(first.animate).toBe(true)
    expect(first.loaded(first.requestId)).toBe(true)
    const next = new ImageLoadState(cache)
    next.setSource('/photo.jpg')
    expect(next.animate).toBe(false)
    expect(next.status).toBe('loading')
  })

  it('does not cache failures and retries with a fresh request identity', () => {
    const cache = new ImageLoadCache()
    const state = new ImageLoadState(cache)
    state.setSource('/photo.jpg')
    const previous = state.requestId
    state.failed(previous)
    expect(cache.has('/photo.jpg')).toBe(false)
    state.retry()
    expect(state.status).toBe('loading')
    expect(state.requestId).not.toBe(previous)
    expect(state.loaded(previous)).toBe(false)
    expect(state.loaded(state.requestId)).toBe(true)
  })

  it('ignores late success and failure events for a replaced image', () => {
    const cache = new ImageLoadCache()
    const state = new ImageLoadState(cache)
    state.setSource('/old.jpg')
    const old = state.requestId
    state.setSource('/new.jpg')
    expect(state.failed(old)).toBe(false)
    expect(state.loaded(old)).toBe(false)
    expect(state.status).toBe('loading')
    state.loaded(state.requestId)
    expect(cache.has('/old.jpg')).toBe(false)
    expect(cache.has('/new.jpg')).toBe(true)
  })
})

describe('adjacent slides', () => {
  it('waits for the route-selected initial slide before mounting images', () => {
    const scope = effectScope()
    const current = ref(0)
    const ready = ref(false)
    const mounted = scope.run(() => useAdjacentImages(current, 5, ready))!
    expect(mounted.value.size).toBe(0)
    current.value = 2
    ready.value = true
    expect([...mounted.value].sort()).toEqual([1, 2, 3])
    scope.stop()
  })
  it('loads neighbors across the circular boundary and handles short albums', () => {
    expect(adjacentImageIndexes(0, 5).sort()).toEqual([0, 1, 4])
    expect(adjacentImageIndexes(4, 5).sort()).toEqual([0, 3, 4])
    expect(adjacentImageIndexes(0, 1)).toEqual([0])
    expect(adjacentImageIndexes(0, 0)).toEqual([])
  })

  it('supports a specified starting slide and retains mounted nodes after swiping', () => {
    const scope = effectScope()
    const current = ref(2)
    const mounted = scope.run(() => useAdjacentImages(current, 5))!
    expect([...mounted.value].sort()).toEqual([1, 2, 3])
    current.value = 4
    expect([...mounted.value].sort()).toEqual([0, 1, 2, 3, 4])
    scope.stop()
  })
})
