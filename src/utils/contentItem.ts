import type { ContentItem, FoodContentItem, PlaceContentItem } from '@/types/content'
import type { FoodCardItem } from '@/types/food'
import type { PlaceCardItem } from '@/types/place'

export function formatVisitedDate(value: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}.${month}.${day}`
}

function toCardBase(item: ContentItem) {
  return {
    id: item.id,
    cityCode: item.cityCode,
    name: item.name,
    type: item.type,
    comment: item.comment,
    image: item.image,
    status: item.visited ? ('visited' as const) : ('unvisited' as const),
    visitedDate: formatVisitedDate(item.visitedAt),
  }
}

export function toFoodCardItem(item: FoodContentItem): FoodCardItem {
  return { ...toCardBase(item), contentType: 'food', categoryId: item.categoryId }
}

export function toPlaceCardItem(item: PlaceContentItem): PlaceCardItem {
  return { ...toCardBase(item), contentType: 'place', categoryId: item.categoryId }
}
