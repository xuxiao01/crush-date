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
