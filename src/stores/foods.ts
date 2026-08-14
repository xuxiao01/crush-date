import { defineStore } from 'pinia'
import { getFoods, updateContentItemVisited } from '@/api/content'
import type { CityCode, FoodCategoryId, FoodContentItem, FoodListParams } from '@/types/content'
import type { FoodCardItem } from '@/types/food'
import { toFoodCardItem } from '@/utils/contentItem'

export interface FoodQuery {
  cityCode: CityCode
  visited: boolean
  categoryId?: FoodCategoryId
  keyword?: string
}

interface FoodsState {
  list: FoodCardItem[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
  loading: boolean
  loadingInitial: boolean
  loadingMore: boolean
  error: string
  loadMoreError: string
  query: FoodQuery
  unvisitedCount: number
  visitedCount: number
  requestEpoch: number
  countsRequestEpoch: number
  invalidated: boolean
}

function querySignature(query: FoodQuery): string {
  return [query.cityCode, query.visited, query.categoryId ?? '', query.keyword?.trim() ?? ''].join(
    '|',
  )
}

export const useFoodsStore = defineStore('foods', {
  state: (): FoodsState => ({
    list: [],
    total: 0,
    page: 0,
    pageSize: 20,
    hasMore: true,
    loading: false,
    loadingInitial: false,
    loadingMore: false,
    error: '',
    loadMoreError: '',
    query: { cityCode: 'beijing', visited: false },
    unvisitedCount: 0,
    visitedCount: 0,
    requestEpoch: 0,
    countsRequestEpoch: 0,
    invalidated: false,
  }),
  getters: {
    totalCount: (state) => state.total,
    visitedList: (state) => state.list.filter((item) => item.status === 'visited'),
    unvisitedList: (state) => state.list.filter((item) => item.status === 'unvisited'),
    progressPercent(): number {
      const total = this.unvisitedCount + this.visitedCount
      return total === 0 ? 0 : Math.round((this.visitedCount / total) * 100)
    },
  },
  actions: {
    async resetAndFetchFoods(query: FoodQuery) {
      const normalized: FoodQuery = {
        ...query,
        keyword: query.keyword?.trim().slice(0, 50) || undefined,
      }
      this.requestEpoch += 1
      const epoch = this.requestEpoch
      this.query = normalized
      this.list = []
      this.total = 0
      this.page = 0
      this.hasMore = true
      this.error = ''
      this.loadMoreError = ''
      this.loadingInitial = true
      this.loading = true
      this.invalidated = false

      try {
        const response = await getFoods(
          { ...normalized, page: 1, pageSize: this.pageSize },
          { showError: false },
        )
        if (
          epoch !== this.requestEpoch ||
          querySignature(normalized) !== querySignature(this.query)
        ) {
          return false
        }
        this.list = response.list.map(toFoodCardItem)
        this.total = response.total
        this.page = response.page
        this.hasMore = response.hasMore
        return true
      } catch (error) {
        if (epoch === this.requestEpoch) {
          this.error = error instanceof Error ? error.message : '美食加载失败'
        }
        return false
      } finally {
        if (epoch === this.requestEpoch) {
          this.loadingInitial = false
          this.loading = false
        }
      }
    },
    async loadMoreFoods() {
      if (this.loadingInitial || this.loadingMore || !this.hasMore || this.error) return false

      const epoch = this.requestEpoch
      const signature = querySignature(this.query)
      const nextPage = this.page + 1
      this.loadingMore = true
      this.loadMoreError = ''
      try {
        const response = await getFoods(
          { ...this.query, page: nextPage, pageSize: this.pageSize },
          { showError: false },
        )
        if (epoch !== this.requestEpoch || signature !== querySignature(this.query)) return false

        const existingIds = new Set(this.list.map((item) => item.id))
        this.list.push(
          ...response.list.filter((item) => !existingIds.has(item.id)).map(toFoodCardItem),
        )
        this.total = response.total
        this.page = response.page
        this.hasMore = response.hasMore
        return true
      } catch (error) {
        if (epoch === this.requestEpoch) {
          this.loadMoreError = error instanceof Error ? error.message : '加载更多失败'
        }
        return false
      } finally {
        if (epoch === this.requestEpoch) this.loadingMore = false
      }
    },
    async fetchStatusCounts(cityCode: CityCode) {
      this.countsRequestEpoch += 1
      const epoch = this.countsRequestEpoch
      try {
        const [unvisited, visited] = await Promise.all([
          getFoods({ cityCode, visited: false, page: 1, pageSize: 1 }, { showError: false }),
          getFoods({ cityCode, visited: true, page: 1, pageSize: 1 }, { showError: false }),
        ])
        if (cityCode !== this.query.cityCode || epoch !== this.countsRequestEpoch) return false
        this.unvisitedCount = unvisited.total
        this.visitedCount = visited.total
        return true
      } catch {
        return false
      }
    },
    fetchFoods(params: Partial<FoodListParams> = {}) {
      return this.resetAndFetchFoods({
        cityCode: params.cityCode ?? this.query.cityCode,
        visited: params.visited ?? this.query.visited,
        categoryId: params.categoryId,
        keyword: params.keyword,
      })
    },
    invalidate() {
      this.invalidated = true
    },
    addFood(payload: Pick<FoodCardItem, 'id' | 'name' | 'type' | 'comment' | 'image'>) {
      const item: FoodCardItem = { ...payload, status: 'unvisited', visitedDate: '' }
      this.list.unshift(item)
      this.total += 1
      return item
    },
    removeFood(id: string) {
      const index = this.list.findIndex((item) => item.id === id)
      if (index < 0) return false
      this.list.splice(index, 1)
      this.total = Math.max(0, this.total - 1)
      this.invalidated = true
      return true
    },
    getById(id: string) {
      return this.list.find((item) => item.id === id)
    },
    async setVisited(id: string, visited: boolean) {
      try {
        const updated = await updateContentItemVisited<FoodContentItem>(id, visited)
        this.removeFood(id)
        this.invalidated = true
        return toFoodCardItem(updated)
      } catch {
        return false
      }
    },
    markVisited(id: string) {
      return this.setVisited(id, true)
    },
  },
})
