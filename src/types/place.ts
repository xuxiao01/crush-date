import type { CityCode, PlaceCategoryId } from '@/types/content'

export type PlaceCardStatus = 'unvisited' | 'visited'

export interface PlaceCardItem {
  id: string
  contentType?: 'place'
  cityCode?: CityCode
  categoryId?: PlaceCategoryId
  name: string
  type: string
  comment: string
  image: string
  status: PlaceCardStatus
  visitedDate: string
}
