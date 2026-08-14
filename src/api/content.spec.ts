import { afterEach, describe, expect, it, vi } from 'vitest'
import { createContentItem, getFoods, getPlaces } from '@/api/content'

afterEach(() => {
  vi.unstubAllGlobals()
})

function stubRequest() {
  const requestMock = vi.fn((options: UniApp.RequestOptions) => {
    options.success?.({
      statusCode: 200,
      data: { list: [], total: 0, page: 1, pageSize: 20, hasMore: false },
      header: {},
      cookies: [],
      errMsg: 'request:ok',
    })
  })
  vi.stubGlobal('uni', { request: requestMock, showToast: vi.fn() })
  return requestMock
}

describe('content API queries', () => {
  it('serializes food filters and trims/encodes the keyword', async () => {
    const requestMock = stubRequest()
    await getFoods({
      cityCode: 'tianjin',
      visited: false,
      categoryId: '3',
      keyword: '  牛 肉  ',
      page: 2,
      pageSize: 20,
    })

    expect(requestMock.mock.calls[0]?.[0].url).toBe(
      '/api/crush-date/foods?cityCode=tianjin&visited=false&categoryId=3&keyword=%E7%89%9B%20%E8%82%89&page=2&pageSize=20',
    )
  })

  it('omits empty filters and serializes place category/keyword', async () => {
    const requestMock = stubRequest()
    await getFoods({ cityCode: 'beijing', keyword: '   ' })
    await getPlaces({
      cityCode: 'harbin',
      visited: true,
      categoryId: '2',
      keyword: ' 公园 ',
      page: 1,
      pageSize: 20,
    })

    expect(requestMock.mock.calls[0]?.[0].url).toBe(
      '/api/crush-date/foods?cityCode=beijing&page=1&pageSize=20',
    )
    expect(requestMock.mock.calls[1]?.[0].url).toBe(
      '/api/crush-date/places?cityCode=harbin&visited=true&categoryId=2&keyword=%E5%85%AC%E5%9B%AD&page=1&pageSize=20',
    )
  })
})

describe('content upload', () => {
  it('submits city, category and the resolved category name as type', async () => {
    const uploadFile = vi.fn((options: UniApp.UploadFileOption) => {
      options.success?.({
        statusCode: 201,
        data: JSON.stringify({ id: 'food-created' }),
        errMsg: 'uploadFile:ok',
      })
    })
    vi.stubGlobal('uni', { uploadFile })

    await createContentItem({
      filePath: '/tmp/food.jpg',
      contentType: 'food',
      cityCode: 'harbin',
      categoryId: '4',
      name: '烤肉',
      type: '烧烤烤肉',
      comment: '',
    })

    expect(uploadFile).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'file',
        formData: expect.objectContaining({
          contentType: 'food',
          cityCode: 'harbin',
          categoryId: '4',
          type: '烧烤烤肉',
        }),
      }),
    )
  })
})
