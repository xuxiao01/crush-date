import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { getCities, getFoodCategories, getPlaceCategories } from '@/api/content'
import { useContentConfigStore } from '@/stores/contentConfig'

vi.mock('@/api/content', () => ({
  getCities: vi.fn(),
  getFoodCategories: vi.fn(),
  getPlaceCategories: vi.fn(),
}))

beforeEach(() => {
  vi.clearAllMocks()
  setActivePinia(createPinia())
})

describe('content config store', () => {
  it('filters disabled cities, sorts config, and uses remote category names', async () => {
    vi.mocked(getCities).mockResolvedValue({
      list: [
        { code: 'harbin', name: '哈尔滨', enabled: true, sortOrder: 2 },
        { code: 'tianjin', name: '天津', enabled: false, sortOrder: 1 },
        { code: 'beijing', name: '北京', enabled: true, sortOrder: 0 },
      ],
    })
    vi.mocked(getFoodCategories).mockResolvedValue({
      list: [
        { id: '9', name: '后端其他', sortOrder: 8, filterOnly: false },
        { id: '1', name: '全部分类', sortOrder: 0, filterOnly: true },
        { id: '3', name: '后端火锅', sortOrder: 2, filterOnly: false },
      ],
    })
    vi.mocked(getPlaceCategories).mockResolvedValue({
      list: [
        { id: '7', name: '地点其他', sortOrder: 6, filterOnly: false },
        { id: '1', name: '全部分类', sortOrder: 0, filterOnly: true },
      ],
    })
    const store = useContentConfigStore()

    expect(await store.loadConfig()).toBe(true)
    expect(store.cities.map((city) => city.code)).toEqual(['beijing', 'harbin'])
    expect(store.foodCategories.map((category) => category.id)).toEqual(['1', '3', '9'])
    expect(store.categoryName('3')).toBe('后端火锅')
    expect(store.selectableFoodCategories.map((category) => category.id)).toEqual(['3', '9'])
    expect(store.placeCategoryName('7')).toBe('地点其他')
  })
})
