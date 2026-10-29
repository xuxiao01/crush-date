export type ContentType = 'food' | 'place'

export type CityCode = 'beijing' | 'tianjin' | 'harbin' | 'yinchuan' | 'zhongwei' | 'wuzhong'

export type FoodCategoryId = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
export type PlaceCategoryId = '2' | '3' | '4' | '5' | '6' | '7'
export type CategoryFilterId = '1'
export type ContentCategoryId = FoodCategoryId | PlaceCategoryId

export interface CityOption {
  code: CityCode
  name: string
  enabled: boolean
  sortOrder: number
}

export interface CategoryOption<TId extends string> {
  id: TId | CategoryFilterId
  name: string
  sortOrder: number
  filterOnly: boolean
}

export type FoodCategoryOption = CategoryOption<FoodCategoryId>
export type PlaceCategoryOption = CategoryOption<PlaceCategoryId>
export type SelectableFoodCategoryOption = Omit<FoodCategoryOption, 'id' | 'filterOnly'> & {
  id: FoodCategoryId
  filterOnly: false
}
export type SelectablePlaceCategoryOption = Omit<PlaceCategoryOption, 'id' | 'filterOnly'> & {
  id: PlaceCategoryId
  filterOnly: false
}

export interface ContentLocation {
  provider: 'tencent'
  poiId: string
  title: string
  address: string
  latitude: number
  longitude: number
  adcode: string
}

export interface PoiSuggestion extends ContentLocation {
  city: string
  district: string
}

export interface PoiSuggestionsResponse {
  list: PoiSuggestion[]
}

interface ContentItemBase {
  id: string
  cityCode: CityCode
  name: string
  type: string
  comment: string
  image: string
  visited: boolean
  visitedAt: string | null
  location: ContentLocation | null
}

export interface FoodContentItem extends ContentItemBase {
  contentType: 'food'
  categoryId: FoodCategoryId
}

export interface PlaceContentItem extends ContentItemBase {
  contentType: 'place'
  categoryId: PlaceCategoryId
}

export type ContentItem = FoodContentItem | PlaceContentItem

export interface ContentItemListResponse<TItem extends ContentItem = ContentItem> {
  list: TItem[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export interface FoodListParams {
  cityCode: CityCode
  visited?: boolean
  categoryId?: FoodCategoryId
  keyword?: string
  page?: number
  pageSize?: number
}

export interface PlaceListParams {
  cityCode: CityCode
  visited?: boolean
  categoryId?: PlaceCategoryId
  keyword?: string
  page?: number
  pageSize?: number
}
