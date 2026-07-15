import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { getContentItemList, updateContentItemVisited } from '@/api/content'
import { useFoodsStore } from '@/stores/foods'
import { usePlacesStore } from '@/stores/places'

vi.mock('@/api/content', () => ({
  getContentItemList: vi.fn(),
  updateContentItemVisited: vi.fn(),
}))

const food = {
  id: 'food-1',
  contentType: 'food' as const,
  name: '火锅',
  type: '川味',
  comment: '一起去吃',
  image: '/food.jpg',
  visited: true,
  visitedAt: '2026-07-15T12:00:00.000Z',
}

const place = {
  id: 'place-1',
  contentType: 'place' as const,
  name: '公园',
  type: '散步',
  comment: '一起去走走',
  image: '/place.jpg',
  visited: false,
  visitedAt: null,
}

beforeEach(() => {
  vi.clearAllMocks()
  setActivePinia(createPinia())
})

describe('content visit status integration', () => {
  it('uses the server status when refreshing food and place lists', async () => {
    vi.mocked(getContentItemList).mockImplementation(async (contentType) => ({
      list: [contentType === 'food' ? food : place],
      total: 1,
    }))

    const foodsStore = useFoodsStore()
    const placesStore = usePlacesStore()
    await foodsStore.fetchFoods()
    await placesStore.fetchPlaces()

    expect(foodsStore.list[0]).toMatchObject({ status: 'visited', visitedDate: '2026.07.15' })
    expect(placesStore.list[0]).toMatchObject({ status: 'unvisited', visitedDate: '' })
  })

  it('updates local food state only after the backend succeeds', async () => {
    vi.mocked(getContentItemList).mockResolvedValue({
      list: [{ ...food, visited: false, visitedAt: null }],
      total: 1,
    })
    vi.mocked(updateContentItemVisited).mockResolvedValue(food)
    const store = useFoodsStore()
    await store.fetchFoods()

    expect(await store.markVisited(food.id)).toBe(true)
    expect(updateContentItemVisited).toHaveBeenCalledWith(food.id, true)
    expect(store.list[0]).toMatchObject({ status: 'visited', visitedDate: '2026.07.15' })
  })

  it('keeps the original place state when the backend fails', async () => {
    vi.mocked(getContentItemList).mockResolvedValue({ list: [place], total: 1 })
    vi.mocked(updateContentItemVisited).mockRejectedValue(new Error('network error'))
    const store = usePlacesStore()
    await store.fetchPlaces()

    expect(await store.markVisited(place.id)).toBe(false)
    expect(store.list[0]).toMatchObject({ status: 'unvisited', visitedDate: '' })
  })
})
