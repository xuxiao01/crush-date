import { afterEach, describe, expect, it, vi } from 'vitest'
import { createContentItem, getFoods, getPlaces, getPoiSuggestions } from '@/api/content'

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

  it('trims and encodes the POI keyword with its selected city', async () => {
    const requestMock = stubRequest()
    await getPoiSuggestions('tianjin', '  五大道 咖啡  ')

    expect(requestMock.mock.calls[0]?.[0].url).toBe(
      '/api/crush-date/map/poi-suggestions?cityCode=tianjin&keyword=%E4%BA%94%E5%A4%A7%E9%81%93%20%E5%92%96%E5%95%A1',
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

  it('submits all POI fields when a location is selected', async () => {
    const uploadFile = vi.fn((options: UniApp.UploadFileOption) => {
      options.success?.({
        statusCode: 201,
        data: JSON.stringify({ id: 'place-created' }),
        errMsg: 'uploadFile:ok',
      })
    })
    vi.stubGlobal('uni', { uploadFile })

    await createContentItem({
      filePath: '/tmp/place.jpg',
      contentType: 'place',
      cityCode: 'beijing',
      categoryId: '2',
      name: '傍晚散步',
      type: '公园',
      comment: '',
      location: {
        provider: 'tencent',
        poiId: 'poi-1',
        title: '颐和园',
        address: '北京市海淀区新建宫门路19号',
        latitude: 39.9999,
        longitude: 116.2755,
        adcode: '110108',
      },
    })

    expect(uploadFile.mock.calls[0]?.[0].formData).toEqual(
      expect.objectContaining({
        poiProvider: 'tencent',
        poiId: 'poi-1',
        poiTitle: '颐和园',
        poiAddress: '北京市海淀区新建宫门路19号',
        poiLatitude: '39.9999',
        poiLongitude: '116.2755',
        poiAdcode: '110108',
      }),
    )
  })

  it('omits every POI field when no location is selected', async () => {
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
      cityCode: 'beijing',
      categoryId: '3',
      name: '火锅',
      type: '火锅',
      comment: '',
      location: null,
    })

    const formData = uploadFile.mock.calls[0]?.[0].formData as Record<string, string>
    expect(Object.keys(formData).filter((key) => key.startsWith('poi'))).toEqual([])
  })
})
