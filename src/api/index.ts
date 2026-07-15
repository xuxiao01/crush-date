const baseURL = import.meta.env.VITE_API_BASE_URL || ''

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

interface RequestOptions {
  url: string
  method?: HttpMethod
  data?: Record<string, unknown>
  header?: Record<string, string>
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
      method,
      data,
      header,
      success: (response) => {
        const statusCode = response.statusCode || 0

        if (statusCode >= 200 && statusCode < 300) {
          resolve(response.data as T)
          return
        }

        showRequestError()
        reject(new Error(`Request failed with status ${statusCode}`))
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
