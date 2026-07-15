export type FoodCardStatus = 'unvisited' | 'visited'

export interface FoodCardItem {
  id: string
  name: string
  type: string
  comment: string
  image: string
  status: FoodCardStatus
  visitedDate: string
}
