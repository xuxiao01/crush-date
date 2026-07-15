import { defineStore } from 'pinia'
import place01 from '@/assets/places/place-01.jpg'
import place02 from '@/assets/places/place-02.jpg'
import place03 from '@/assets/places/place-03.jpg'
import place04 from '@/assets/places/place-04.jpg'
import place05 from '@/assets/places/place-05.jpg'
import place06 from '@/assets/places/place-06.jpg'
import place07 from '@/assets/places/place-07.jpg'
import place08 from '@/assets/places/place-08.jpg'
import type { PlaceCardItem } from '@/types/place'

function formatVisitedDate(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}.${m}.${d}`
}

const MOCK_PLACES: PlaceCardItem[] = [
  {
    id: 'place-01',
    name: '颐和园傍晚散步',
    type: '公园 · 散步',
    comment: '想慢慢走完长廊，再看一眼湖面。',
    image: place01,
    status: 'unvisited',
    visitedDate: '',
  },
  {
    id: 'place-02',
    name: '朝阳公园露营午后',
    type: '公园 · 露营',
    comment: '带一本闲书，躺到云层变粉。',
    image: place02,
    status: 'unvisited',
    visitedDate: '',
  },
  {
    id: 'place-03',
    name: '三里屯随便逛逛',
    type: '街区 · 逛街',
    comment: '不一定买什么，逛到腿软也行。',
    image: place03,
    status: 'unvisited',
    visitedDate: '',
  },
  {
    id: 'place-04',
    name: '周末密室逃脱',
    type: '娱乐 · 密室',
    comment: '这次一定不当第一个尖叫的人。',
    image: place04,
    status: 'unvisited',
    visitedDate: '',
  },
  {
    id: 'place-05',
    name: '半夜 KTV 点歌',
    type: '娱乐 · KTV',
    comment: '把那天没唱完的歌都点一遍。',
    image: place05,
    status: 'unvisited',
    visitedDate: '',
  },
  {
    id: 'place-06',
    name: '天坛看云发呆',
    type: '公园 · 天空',
    comment: '遇到好看的云就拍一张给你。',
    image: place06,
    status: 'visited',
    visitedDate: '2026.05.18',
  },
  {
    id: 'place-07',
    name: '奥森绿道骑行',
    type: '户外 · 骑行',
    comment: '风不大的时候，骑一段就够幸福。',
    image: place07,
    status: 'visited',
    visitedDate: '2026.04.02',
  },
  {
    id: 'place-08',
    name: '海边看日落',
    type: '旅行 · 日落',
    comment: '等太阳碰到海面那一刻再说晚安。',
    image: place08,
    status: 'visited',
    visitedDate: '2026.03.21',
  },
]

interface PlacesState {
  list: PlaceCardItem[]
}

export const usePlacesStore = defineStore('places', {
  state: (): PlacesState => ({
    list: MOCK_PLACES.map((item) => ({ ...item })),
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
