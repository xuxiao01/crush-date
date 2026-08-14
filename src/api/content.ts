import { getBaseURL, request } from '@/api/index'
import type {
  CityCode,
  CityOption,
  ContentItem,
  ContentItemListResponse,
  ContentType,
  ContentCategoryId,
  FoodCategoryOption,
  FoodContentItem,
  FoodListParams,
  PlaceCategoryOption,
  PlaceContentItem,
  PlaceListParams,
} from '@/types/content'

export type { ContentType }
export type ContentItemResponse = ContentItem
export type ContentItemListItem = ContentItem
export type { ContentItemListResponse }

export interface CreateContentItemInput {
  filePath: string
  contentType: ContentType
  cityCode: CityCode
  categoryId: ContentCategoryId
  name: string
  type: string
  comment: string
}

export interface ContentItemListParams {
  cityCode?: CityCode
  visited?: boolean
  page?: number
  pageSize?: number
}

interface RequestBehavior {
  showError?: boolean
}

interface ErrorResponse {
  message?: string
}

interface CityListResponse {
  list: CityOption[]
}

interface FoodCategoryListResponse {
  list: FoodCategoryOption[]
}

interface PlaceCategoryListResponse {
  list: PlaceCategoryOption[]
}

function parseResponse(data: string): ContentItem | ErrorResponse | null {
  try {
    return JSON.parse(data) as ContentItem | ErrorResponse
  } catch {
    return null
  }
}

function buildQuery(values: Record<string, string | number | boolean | undefined>): string {
  const query = Object.entries(values)
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&')
  return query ? `?${query}` : ''
}

export function createContentItem(input: CreateContentItemInput): Promise<ContentItem> {
  const baseURL = getBaseURL().replace(/\/$/, '')

  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: `${baseURL}/api/crush-date/content-items`,
      filePath: input.filePath,
      name: 'file',
      formData: {
        contentType: input.contentType,
        cityCode: input.cityCode,
        categoryId: input.categoryId,
        name: input.name,
        type: input.type,
        comment: input.comment,
      },
      success: (response) => {
        const data = parseResponse(response.data)
        if (response.statusCode >= 200 && response.statusCode < 300 && data && 'id' in data) {
          resolve(data)
          return
        }

        const message = data && 'message' in data ? data.message : undefined
        reject(new Error(message || `新增失败（${response.statusCode}）`))
      },
      fail: (error) => reject(new Error(error.errMsg || '无法连接服务器，请稍后重试')),
    })
  })
}

export function getCities(behavior: RequestBehavior = {}): Promise<CityListResponse> {
  return request<CityListResponse>({
    url: '/api/crush-date/cities',
    showError: behavior.showError,
  })
}

export function getFoodCategories(
  behavior: RequestBehavior = {},
): Promise<FoodCategoryListResponse> {
  return request<FoodCategoryListResponse>({
    url: '/api/crush-date/food-categories',
    showError: behavior.showError,
  })
}

export function getPlaceCategories(
  behavior: RequestBehavior = {},
): Promise<PlaceCategoryListResponse> {
  return request<PlaceCategoryListResponse>({
    url: '/api/crush-date/place-categories',
    showError: behavior.showError,
  })
}

export function getFoods(
  params: FoodListParams,
  behavior: RequestBehavior = {},
): Promise<ContentItemListResponse<FoodContentItem>> {
  const keyword = params.keyword?.trim().slice(0, 50)
  return request<ContentItemListResponse<FoodContentItem>>({
    url: `/api/crush-date/foods${buildQuery({
      cityCode: params.cityCode,
      visited: params.visited,
      categoryId: params.categoryId,
      keyword,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 20,
    })}`,
    showError: behavior.showError,
  })
}

export function getPlaces(
  params: PlaceListParams,
  behavior: RequestBehavior = {},
): Promise<ContentItemListResponse<PlaceContentItem>> {
  const keyword = params.keyword?.trim().slice(0, 50)
  return request<ContentItemListResponse<PlaceContentItem>>({
    url: `/api/crush-date/places${buildQuery({
      cityCode: params.cityCode,
      visited: params.visited,
      categoryId: params.categoryId,
      keyword,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 20,
    })}`,
    showError: behavior.showError,
  })
}

export function getPlaceById(
  id: string,
  behavior: RequestBehavior = {},
): Promise<PlaceContentItem> {
  return request<PlaceContentItem>({
    url: `/api/crush-date/places/${encodeURIComponent(id)}`,
    showError: behavior.showError,
  })
}

export function getFoodById(id: string, behavior: RequestBehavior = {}): Promise<FoodContentItem> {
  return request<FoodContentItem>({
    url: `/api/crush-date/foods/${encodeURIComponent(id)}`,
    showError: behavior.showError,
  })
}

/** Compatibility entry point for older callers. New code should use getFoods/getPlaces. */
export function getContentItemList(
  contentType: ContentType,
  params: ContentItemListParams = {},
): Promise<ContentItemListResponse> {
  const cityCode = params.cityCode ?? 'beijing'
  if (contentType === 'food') {
    return getFoods({
      cityCode,
      visited: params.visited,
      page: params.page,
      pageSize: params.pageSize ?? 100,
    })
  }
  return getPlaces({ cityCode, ...params })
}

export function deleteContentItem(id: string): Promise<void> {
  return request<void>({
    url: `/api/crush-date/content-items/${encodeURIComponent(id)}`,
    method: 'DELETE',
  })
}

export function updateContentItemVisited<TItem extends ContentItem = ContentItem>(
  id: string,
  visited: boolean,
): Promise<TItem> {
  return request<TItem>({
    url: `/api/crush-date/content-items/${encodeURIComponent(id)}/visited`,
    method: 'PATCH',
    data: { visited },
  })
}
