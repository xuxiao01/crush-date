import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { getFoods, getPlaces, updateContentItemVisited } from '@/api/content'
import { useFoodsStore } from '@/stores/foods'
import { usePlacesStore } from '@/stores/places'
import type {
  ContentItem,
  ContentItemListResponse,
  FoodContentItem,
  PlaceContentItem,
  CityCode,
} from '@/types/content'

vi.mock('@/api/content', () => ({
  getFoods: vi.fn(),
  getPlaces: vi.fn(),
  updateContentItemVisited: vi.fn(),
}))

const food: FoodContentItem = {
  id: 'food-1',
  contentType: 'food',
  cityCode: 'beijing',
  categoryId: '3',
  name: '火锅',
  type: '川味',
  comment: '一起去吃',
  image: '/food.jpg',
  visited: false,
  visitedAt: null,
  location: null,
}

const place: PlaceContentItem = {
  id: 'place-1',
  contentType: 'place',
  cityCode: 'beijing',
  categoryId: '2',
  name: '公园',
  type: '散步',
  comment: '一起去走走',
  image: '/place.jpg',
  visited: false,
  visitedAt: null,
  location: null,
}

function response<TItem extends ContentItem>(
  list: TItem[],
  overrides: Partial<ContentItemListResponse<TItem>> = {},
): ContentItemListResponse<TItem> {
  return { list, total: list.length, page: 1, pageSize: 20, hasMore: false, ...overrides }
}

beforeEach(() => {
  vi.clearAllMocks()
  setActivePinia(createPinia())
})

describe.each(['foods', 'places'] as const)('%s page reuse', (kind) => {
  function scenario() {
    const api = vi.fn()
    vi.mocked(getFoods).mockImplementation(api)
    vi.mocked(getPlaces).mockImplementation(api)
    const store = kind === 'foods' ? useFoodsStore() : usePlacesStore()
    const query = { cityCode: 'beijing' as CityCode, visited: false }
    const item = kind === 'foods' ? food : place
    const fetch = (next = query) =>
      'resetAndFetchFoods' in store
        ? store.resetAndFetchFoods(next)
        : store.resetAndFetchPlaces(next)
    const ensure = () =>
      'ensureFoods' in store ? store.ensureFoods(query) : store.ensurePlaces(query)
    const more = () => ('loadMoreFoods' in store ? store.loadMoreFoods() : store.loadMorePlaces())
    api.mockResolvedValue(response([item]))
    return { api, store, item, query, fetch, ensure, more }
  }

  it('reuses mounted cards and all loaded pages when returning without changes', async () => {
    const { api, store, item, fetch, ensure, more } = scenario()
    api
      .mockResolvedValueOnce(response([item], { total: 2, hasMore: true }))
      .mockResolvedValueOnce(response([{ ...item, id: 'second' }], { total: 2, page: 2 }))
    await fetch()
    await more()
    const previous = store.list
    await ensure()
    expect(api).toHaveBeenCalledTimes(2)
    expect(store.list).toBe(previous)
    expect(store.page).toBe(2)
    expect(store.list).toHaveLength(2)
  })

  it('also reuses a successfully loaded empty list', async () => {
    const { api, store, fetch, ensure } = scenario()
    api.mockResolvedValue(response([]))
    await fetch()
    await ensure()
    expect(store.loaded).toBe(true)
    expect(api).toHaveBeenCalledTimes(1)
  })

  it('keeps cards during refresh, blocks pagination and updates on success', async () => {
    const { api, store, item, fetch, ensure, more } = scenario()
    await fetch()
    store.invalidate()
    let resolve!: (value: ContentItemListResponse) => void
    api.mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done
        }),
    )
    const previous = store.list
    const pending = ensure()
    expect(store.list).toBe(previous)
    expect(store.loadingInitial).toBe(false)
    expect(store.refreshing).toBe(true)
    expect(store.invalidated).toBe(true)
    await more()
    expect(api).toHaveBeenCalledTimes(2)
    resolve(response([{ ...item, name: '更新后' }]))
    await pending
    expect(store.list[0].name).toBe('更新后')
    expect(store.invalidated).toBe(false)
    expect(store.refreshing).toBe(false)
  })

  it('keeps data and invalidation after refresh fails, allowing a retry', async () => {
    const { api, store, fetch, ensure } = scenario()
    await fetch()
    store.invalidate()
    api.mockRejectedValueOnce(new Error('刷新失败'))
    const previous = store.list
    expect(await ensure()).toBe(false)
    expect(store.list).toBe(previous)
    expect(store.refreshError).toBe('刷新失败')
    expect(store.error).toBe('')
    expect(store.invalidated).toBe(true)
    expect(await ensure()).toBe(true)
    expect(store.refreshError).toBe('')
  })

  it('clears old-query cards and ignores an earlier response on a city switch', async () => {
    const { api, store, item, fetch } = scenario()
    await fetch()
    let resolve!: (value: ContentItemListResponse) => void
    api.mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done
        }),
    )
    const pending = fetch()
    const next = fetch({ cityCode: 'tianjin', visited: false })
    expect(store.list).toEqual([])
    expect(store.loadingInitial).toBe(true)
    await next
    resolve(response([{ ...item, id: 'obsolete' }]))
    await pending
    expect(store.list[0].id).not.toBe('obsolete')
    expect(store.query.cityCode).toBe('tianjin')
  })

  it('does not overwrite a mutation that happens while refresh is in flight', async () => {
    const { api, store, item, fetch } = scenario()
    await fetch()
    let resolve!: (value: ContentItemListResponse) => void
    api.mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done
        }),
    )
    const pending = fetch()
    store.invalidate()
    resolve(response([{ ...item, name: '过期数据' }]))
    expect(await pending).toBe(false)
    expect(store.list[0].name).toBe(item.name)
    expect(store.invalidated).toBe(true)
  })
})

describe('foods server pagination', () => {
  it('replaces page one and appends later pages without duplicate ids', async () => {
    vi.mocked(getFoods)
      .mockResolvedValueOnce(response([food], { total: 2, hasMore: true }))
      .mockResolvedValueOnce(
        response([{ ...food }, { ...food, id: 'food-2' }], {
          total: 2,
          page: 2,
          hasMore: false,
        }),
      )
    const store = useFoodsStore()

    await store.resetAndFetchFoods({ cityCode: 'beijing', visited: false })
    await store.loadMoreFoods()

    expect(store.list.map((item) => item.id)).toEqual(['food-1', 'food-2'])
    expect(store.hasMore).toBe(false)
    await store.loadMoreFoods()
    expect(getFoods).toHaveBeenCalledTimes(2)
  })

  it('ignores a response from an obsolete query', async () => {
    let resolveFirst!: (value: ContentItemListResponse<FoodContentItem>) => void
    vi.mocked(getFoods)
      .mockImplementationOnce(() => new Promise((resolve) => (resolveFirst = resolve)))
      .mockResolvedValueOnce(response([{ ...food, id: 'tianjin-food', cityCode: 'tianjin' }]))
    const store = useFoodsStore()

    const first = store.resetAndFetchFoods({ cityCode: 'beijing', visited: false })
    await store.resetAndFetchFoods({ cityCode: 'tianjin', visited: false })
    resolveFirst(response([food]))
    await first

    expect(store.list.map((item) => item.id)).toEqual(['tianjin-food'])
  })

  it('keeps existing cards when loading a later page fails', async () => {
    vi.mocked(getFoods)
      .mockResolvedValueOnce(response([food], { total: 2, hasMore: true }))
      .mockRejectedValueOnce(new Error('下一页失败'))
    const store = useFoodsStore()

    await store.resetAndFetchFoods({ cityCode: 'beijing', visited: false })
    await store.loadMoreFoods()

    expect(store.list).toHaveLength(1)
    expect(store.loadMoreError).toBe('下一页失败')
  })

  it('removes a card after a visited update because it no longer matches the tab', async () => {
    vi.mocked(getFoods).mockResolvedValue(response([food]))
    vi.mocked(updateContentItemVisited).mockResolvedValue({
      ...food,
      visited: true,
      visitedAt: '2026-07-15T12:00:00.000Z',
    })
    const store = useFoodsStore()
    await store.resetAndFetchFoods({ cityCode: 'beijing', visited: false })

    expect(await store.markVisited(food.id)).toMatchObject({ status: 'visited' })
    expect(store.list).toEqual([])
  })
})

describe('places server pagination', () => {
  it('sends the current place filters to the first page', async () => {
    vi.mocked(getPlaces).mockResolvedValueOnce(response([place]))
    const store = usePlacesStore()

    await store.resetAndFetchPlaces({
      cityCode: 'beijing',
      visited: false,
      categoryId: '2',
      keyword: '公园',
    })

    expect(getPlaces).toHaveBeenNthCalledWith(
      1,
      {
        cityCode: 'beijing',
        visited: false,
        categoryId: '2',
        keyword: '公园',
        page: 1,
        pageSize: 20,
      },
      { showError: false },
    )
    expect(store.list).toHaveLength(1)
  })
})
