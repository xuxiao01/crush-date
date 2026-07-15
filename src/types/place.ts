export type PlaceCardStatus = 'unvisited' | 'visited'

export interface PlaceCardItem {
  id: string
  name: string
  type: string
  comment: string
  image: string
  status: PlaceCardStatus
  visitedDate: string
}
