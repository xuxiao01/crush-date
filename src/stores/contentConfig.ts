import { defineStore } from 'pinia'
import { getCities, getFoodCategories, getPlaceCategories } from '@/api/content'
import { DEFAULT_FOOD_CATEGORY_CONFIG } from '@/constants/foodCategories'
import type {
  CityCode,
  CityOption,
  FoodCategoryId,
  FoodCategoryOption,
  PlaceCategoryId,
  PlaceCategoryOption,
  SelectableFoodCategoryOption,
  SelectablePlaceCategoryOption,
} from '@/types/content'

interface ContentConfigState {
  currentCityCode: CityCode
  cities: CityOption[]
  foodCategories: FoodCategoryOption[]
  placeCategories: PlaceCategoryOption[]
  loading: boolean
  loaded: boolean
  error: string
}

const BEIJING_FALLBACK: CityOption = {
  code: 'beijing',
  name: '北京',
  enabled: true,
  sortOrder: 0,
}

export const useContentConfigStore = defineStore('contentConfig', {
  state: (): ContentConfigState => ({
    currentCityCode: 'beijing',
    cities: [BEIJING_FALLBACK],
    foodCategories: [...DEFAULT_FOOD_CATEGORY_CONFIG],
    placeCategories: [],
    loading: false,
    loaded: false,
    error: '',
  }),
  getters: {
    currentCityName: (state) =>
      state.cities.find((city) => city.code === state.currentCityCode)?.name ?? '北京',
    categoryName: (state) => (id: FoodCategoryId) =>
      state.foodCategories.find((category) => category.id === id)?.name ?? '',
    placeCategoryName: (state) => (id: PlaceCategoryId) =>
      state.placeCategories.find((category) => category.id === id)?.name ?? '',
    selectableFoodCategories: (state): SelectableFoodCategoryOption[] =>
      state.foodCategories.filter(
        (category): category is SelectableFoodCategoryOption =>
          !category.filterOnly && category.id !== '1',
      ),
    selectablePlaceCategories: (state): SelectablePlaceCategoryOption[] =>
      state.placeCategories.filter(
        (category): category is SelectablePlaceCategoryOption =>
          !category.filterOnly && category.id !== '1',
      ),
  },
  actions: {
    setCurrentCity(code: CityCode) {
      if (this.cities.some((city) => city.code === code)) this.currentCityCode = code
    },
    async loadConfig(force = false) {
      if (this.loading || (this.loaded && !force)) return !this.error

      this.loading = true
      this.error = ''
      try {
        const [citiesResponse, foodCategoriesResponse, placeCategoriesResponse] = await Promise.all(
          [
            getCities({ showError: false }),
            getFoodCategories({ showError: false }),
            getPlaceCategories({ showError: false }),
          ],
        )
        const cities = citiesResponse.list
          .filter((city) => city.enabled)
          .sort((a, b) => a.sortOrder - b.sortOrder)
        this.cities = cities.length ? cities : [BEIJING_FALLBACK]
        this.foodCategories = [...foodCategoriesResponse.list].sort(
          (a, b) => a.sortOrder - b.sortOrder,
        )
        this.placeCategories = [...placeCategoriesResponse.list].sort(
          (a, b) => a.sortOrder - b.sortOrder,
        )
        if (!this.cities.some((city) => city.code === this.currentCityCode)) {
          this.currentCityCode = this.cities[0]?.code ?? 'beijing'
        }
        this.loaded = true
        return true
      } catch (error) {
        this.error = error instanceof Error ? error.message : '配置加载失败'
        return false
      } finally {
        this.loading = false
      }
    },
  },
})
