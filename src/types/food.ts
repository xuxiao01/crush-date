import type { CityCode, FoodCategoryId } from '@/types/content'

export type FoodCardStatus = 'unvisited' | 'visited'

export interface FoodCardItem {
  id: string
  contentType?: 'food'
  cityCode?: CityCode
  categoryId?: FoodCategoryId
  name: string
  type: string
  comment: string
  image: string
  status: FoodCardStatus
  visitedDate: string
}
