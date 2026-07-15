import { defineStore } from 'pinia'
import { getContentItemList, updateContentItemVisited } from '@/api/content'
import type { PlaceCardItem } from '@/types/place'

function formatVisitedDate(value: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
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
        const response = await getContentItemList('place')
        this.list = response.list.map((item) => ({
          id: item.id,
          name: item.name,
          type: item.type,
          comment: item.comment,
          image: item.image,
          status: item.visited ? 'visited' : 'unvisited',
          visitedDate: formatVisitedDate(item.visitedAt),
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
    async setVisited(id: string, visited: boolean) {
      const target = this.list.find((item) => item.id === id)
      if (!target) return false

      const nextStatus = visited ? 'visited' : 'unvisited'
      if (target.status === nextStatus) return true

      try {
        const updated = await updateContentItemVisited(id, visited)
        target.status = updated.visited ? 'visited' : 'unvisited'
        target.visitedDate = formatVisitedDate(updated.visitedAt)
        return true
      } catch {
        return false
      }
    },

    markVisited(id: string) {
      return this.setVisited(id, true)
    },
  },
})
