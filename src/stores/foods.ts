import { defineStore } from 'pinia'
import food01 from '@/assets/foods/food-01.jpg'
import food02 from '@/assets/foods/food-02.jpg'
import food03 from '@/assets/foods/food-03.jpg'
import food04 from '@/assets/foods/food-04.jpg'
import food05 from '@/assets/foods/food-05.jpg'
import food06 from '@/assets/foods/food-06.jpg'
import food07 from '@/assets/foods/food-07.jpg'
import food08 from '@/assets/foods/food-08.jpg'
import food09 from '@/assets/foods/food-09.jpg'
import food10 from '@/assets/foods/food-10.jpg'
import food11 from '@/assets/foods/food-11.jpg'
import food12 from '@/assets/foods/food-12.jpg'
import type { FoodCardItem } from '@/types/food'

function formatVisitedDate(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}.${m}.${d}`
}

const MOCK_FOODS: FoodCardItem[] = [
  {
    id: 'food-01',
    name: '阿里郎朝鲜烤肉',
    type: '烤肉 · 朝鲜风味',
    comment: '感受一下当太阳的感觉！',
    image: food01,
    status: 'unvisited',
    visitedDate: '',
  },
  {
    id: 'food-02',
    name: '蟹老板私房海鲜',
    type: '海鲜 · 清蒸',
    comment: '想把整只螃蟹吃得干干净净。',
    image: food02,
    status: 'unvisited',
    visitedDate: '',
  },
  {
    id: 'food-03',
    name: '那不勒斯手工披萨',
    type: '西餐 · 披萨',
    comment: '边缘焦香那一口超想咬。',
    image: food03,
    status: 'unvisited',
    visitedDate: '',
  },
  {
    id: 'food-04',
    name: '巷口炭火羊排',
    type: '烤肉 · 西北风味',
    comment: '孜然香要飘出三条街才算对。',
    image: food04,
    status: 'unvisited',
    visitedDate: '',
  },
  {
    id: 'food-05',
    name: '过桥人家米线',
    type: '米线 · 云南味',
    comment: '汤真烫的时候，也最幸福。',
    image: food05,
    status: 'unvisited',
    visitedDate: '',
  },
  {
    id: 'food-06',
    name: '深夜一碗拉面',
    type: '面食 · 日式',
    comment: '雨天配这一碗刚刚好。',
    image: food06,
    status: 'unvisited',
    visitedDate: '',
  },
  {
    id: 'food-07',
    name: '小笼包铺子',
    type: '点心 · 江浙',
    comment: '第一口一定要小心烫嘴。',
    image: food07,
    status: 'unvisited',
    visitedDate: '',
  },
  {
    id: 'food-08',
    name: '虾仁海鲜意面',
    type: '西餐 · 意面',
    comment: '蒜香和青柠味再多一点。',
    image: food08,
    status: 'unvisited',
    visitedDate: '',
  },
  {
    id: 'food-09',
    name: '蜀九香火锅',
    type: '火锅 · 川味',
    comment: '番茄锅居然比辣锅更好吃。',
    image: food09,
    status: 'visited',
    visitedDate: '2026.05.12',
  },
  {
    id: 'food-10',
    name: '黄油可颂早午茶',
    type: '烘焙 · 法式',
    comment: '酥掉一桌屑也没关系。',
    image: food10,
    status: 'visited',
    visitedDate: '2026.04.28',
  },
  {
    id: 'food-11',
    name: '市井牛肉粉',
    type: '粉面 · 湖南',
    comment: '辣椒油浇上去就停不下来。',
    image: food11,
    status: 'visited',
    visitedDate: '2026.03.16',
  },
  {
    id: 'food-12',
    name: '家里那道小排',
    type: '家常菜 · 糖醋',
    comment: '比外面点的还香一点。',
    image: food12,
    status: 'visited',
    visitedDate: '2026.02.08',
  },
]

interface FoodsState {
  list: FoodCardItem[]
}

export const useFoodsStore = defineStore('foods', {
  state: (): FoodsState => ({
    list: MOCK_FOODS.map((item) => ({ ...item })),
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
