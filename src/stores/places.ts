import { defineStore } from 'pinia'
import { getContentItemList } from '@/api/content'
import type { PlaceCardItem } from '@/types/place'

function formatVisitedDate(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}.${m}.${d}`
}

interface PlacesState {
  list: PlaceCardItem[]
  loading: boolean
}

export const usePlacesStore = defineStore('places', {
  state: (): PlacesState => ({
    list: [],
    loading: false,
  }),
  getters: {
    totalCount: (state) => state.list.length,
    visitedCount: (state) => state.list.filter((item) => item.status === 'visited').length,
    unvisitedCount: (state) => state.list.filter((item) => item.status === 'unvisited').length,
    visitedList: (state) => state.list.filter((item) => item.status === 'visited'),
    unvisitedList: (state) => state.list.filter((item) => item.status === 'unvisited'),
    progressPercent(): number {
      if (this.totalCount === 0) return 0
      return Math.round((this.visitedCount / this.totalCount) * 100)
    },
  },
  actions: {
    async fetchPlaces() {
      if (this.loading) return

      this.loading = true
      try {
        const statusById = new Map(
          this.list.map((item) => [
            item.id,
            { status: item.status, visitedDate: item.visitedDate },
          ]),
        )
        const response = await getContentItemList('place')
        this.list = response.list.map((item) => ({
          ...item,
          status: statusById.get(item.id)?.status ?? 'unvisited',
          visitedDate: statusById.get(item.id)?.visitedDate ?? '',
        }))
        return true
      } catch {
        return false
      } finally {
        this.loading = false
      }
    },
    addPlace(payload: Pick<PlaceCardItem, 'id' | 'name' | 'type' | 'comment' | 'image'>) {
      const item: PlaceCardItem = {
        ...payload,
        status: 'unvisited',
        visitedDate: '',
      }
      this.list.unshift(item)
      return item
    },
    removePlace(id: string) {
      const index = this.list.findIndex((item) => item.id === id)
      if (index < 0) return false

      this.list.splice(index, 1)
      return true
    },
    getById(id: string) {
      return this.list.find((item) => item.id === id)
    },
    markVisited(id: string) {
      const target = this.list.find((item) => item.id === id)
      if (!target || target.status === 'visited') return false

      target.status = 'visited'
      target.visitedDate = formatVisitedDate()
      return true
    },
  },
})
