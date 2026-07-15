const baseURL = import.meta.env.VITE_API_BASE_URL || ''

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface RequestOptions {
  url: string
  method?: HttpMethod
  data?: unknown
  header?: Record<string, string>
}

interface ErrorResponse {
  message?: string
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

function showRequestError(message = '请求失败'): void {
  uni.showToast({
    title: message,
    icon: 'none',
  })
}

export function request<T>(options: RequestOptions): Promise<T> {
  const { url, method = 'GET', data, header } = options

  return new Promise((resolve, reject) => {
    uni.request({
      url: `${baseURL}${url}`,
      method: method as UniApp.RequestOptions['method'],
      data: data as UniApp.RequestOptions['data'],
      header,
      success: (response) => {
        const statusCode = response.statusCode || 0

        if (statusCode >= 200 && statusCode < 300) {
          resolve(response.data as T)
          return
        }

        const data = response.data as ErrorResponse | undefined
        const message = data?.message || `请求失败（${statusCode}）`
        showRequestError(message)
        reject(new ApiError(message, statusCode))
      },
      fail: (error) => {
        showRequestError()
        reject(error)
      },
    })
  })
}

export function getBaseURL(): string {
  return baseURL
}
