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
  loaded: boolean
  refreshing: boolean
  refreshError: string
  invalidationVersion: number
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
  return [
    query.cityCode,
    query.visited,
    query.categoryId ?? '',
    query.keyword?.trim().slice(0, 50) ?? '',
  ].join('|')
}

export const useFoodsStore = defineStore('foods', {
  state: (): FoodsState => ({
    list: [],
    total: 0,
    page: 0,
    pageSize: 20,
    hasMore: true,
    loading: false,
    loaded: false,
    refreshing: false,
    refreshError: '',
    invalidationVersion: 0,
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
    isCurrentQuery(query: FoodQuery) {
      return querySignature(query) === querySignature(this.query)
    },
    async ensureFoods(query: FoodQuery) {
      if (this.isCurrentQuery(query)) {
        if (this.loaded && !this.invalidated) return true
        if (this.loading) return false
      }
      const result = await this.resetAndFetchFoods(query)
      if (result) void this.fetchStatusCounts(query.cityCode)
      return result
    },
    async resetAndFetchFoods(query: FoodQuery) {
      const normalized: FoodQuery = {
        ...query,
        keyword: query.keyword?.trim().slice(0, 50) || undefined,
      }
      const keepExisting = this.loaded && this.isCurrentQuery(normalized)
      const invalidationVersion = this.invalidationVersion
      this.requestEpoch += 1
      const epoch = this.requestEpoch
      this.query = normalized
      if (!keepExisting) {
        this.list = []
        this.total = 0
        this.page = 0
        this.hasMore = true
        this.loaded = false
      }
      this.error = ''
      this.refreshError = ''
      this.loadMoreError = ''
      this.loadingMore = false
      this.loadingInitial = !keepExisting
      this.refreshing = keepExisting
      this.loading = true

      try {
        const response = await getFoods(
          { ...normalized, page: 1, pageSize: this.pageSize },
          { showError: false },
        )
        if (
          epoch !== this.requestEpoch ||
          invalidationVersion !== this.invalidationVersion ||
          querySignature(normalized) !== querySignature(this.query)
        ) {
          return false
        }
        this.list = response.list.map(toFoodCardItem)
        this.total = response.total
        this.page = response.page
        this.hasMore = response.hasMore
        this.loaded = true
        this.invalidated = false
        return true
      } catch (error) {
        if (epoch === this.requestEpoch) {
          const message = error instanceof Error ? error.message : '美食加载失败'
          if (keepExisting) this.refreshError = message
          else this.error = message
        }
        return false
      } finally {
        if (epoch === this.requestEpoch) {
          this.loadingInitial = false
          this.refreshing = false
          this.loading = false
        }
      }
    },
    async loadMoreFoods() {
      if (this.loading || this.loadingMore || !this.hasMore || this.error || this.refreshError)
        return false

      const epoch = this.requestEpoch
      const signature = querySignature(this.query)
      const invalidationVersion = this.invalidationVersion
      const nextPage = this.page + 1
      this.loadingMore = true
      this.loadMoreError = ''
      try {
        const response = await getFoods(
          { ...this.query, page: nextPage, pageSize: this.pageSize },
          { showError: false },
        )
        if (
          epoch !== this.requestEpoch ||
          invalidationVersion !== this.invalidationVersion ||
          signature !== querySignature(this.query)
        )
          return false

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
      this.invalidationVersion += 1
    },
    addFood(payload: Pick<FoodCardItem, 'id' | 'name' | 'type' | 'comment' | 'image'>) {
      const item: FoodCardItem = { ...payload, status: 'unvisited', visitedDate: '' }
      this.list.unshift(item)
      this.total += 1
      return item
    },
    removeFood(id: string) {
      this.invalidate()
      const index = this.list.findIndex((item) => item.id === id)
      if (index < 0) return false
      this.list.splice(index, 1)
      this.total = Math.max(0, this.total - 1)
      return true
    },
    getById(id: string) {
      return this.list.find((item) => item.id === id)
    },
    async setVisited(id: string, visited: boolean) {
      try {
        const updated = await updateContentItemVisited<FoodContentItem>(id, visited)
        this.removeFood(id)
        this.invalidate()
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
