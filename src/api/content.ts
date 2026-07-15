import { getBaseURL, request } from '@/api/index'

export type ContentType = 'food' | 'place'

export interface CreateContentItemInput {
  filePath: string
  contentType: ContentType
  name: string
  type: string
  comment: string
}

export interface ContentItemResponse {
  id: string
  contentType: ContentType
  name: string
  type: string
  comment: string
  image: string
}

export type ContentItemListItem = Omit<ContentItemResponse, 'contentType'>

export interface ContentItemListResponse {
  list: ContentItemListItem[]
  total: number
}

export interface ContentItemListParams {
  page?: number
  pageSize?: number
}

interface ErrorResponse {
  message?: string
}

function parseResponse(data: string): ContentItemResponse | ErrorResponse | null {
  try {
    return JSON.parse(data) as ContentItemResponse | ErrorResponse
  } catch {
    return null
  }
}

export function createContentItem(input: CreateContentItemInput): Promise<ContentItemResponse> {
  const baseURL = getBaseURL().replace(/\/$/, '')

  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: `${baseURL}/api/crush-date/content-items`,
      filePath: input.filePath,
      name: 'file',
      formData: {
        contentType: input.contentType,
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
      fail: (error) => {
        reject(new Error(error.errMsg || '无法连接服务器，请稍后重试'))
      },
    })
  })
}

export function getContentItemList(
  contentType: ContentType,
  params: ContentItemListParams = {},
): Promise<ContentItemListResponse> {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 100
  const resource = contentType === 'food' ? 'foods' : 'places'

  return request<ContentItemListResponse>({
    url: `/api/crush-date/${resource}?page=${page}&pageSize=${pageSize}`,
  })
}

export function deleteContentItem(id: string): Promise<void> {
  return request<void>({
    url: `/api/crush-date/content-items/${encodeURIComponent(id)}`,
    method: 'DELETE',
  })
}
