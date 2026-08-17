import { describe, expect, it } from 'vitest'
import type { ContentLocation } from '@/types/content'
import {
  buildTencentNavigationUrl,
  isValidContentLocation,
  toMapMarker,
} from '@/utils/contentLocation'

const location: ContentLocation = {
  provider: 'tencent',
  poiId: 'poi-1',
  title: '颐和园',
  address: '北京市海淀区新建宫门路19号',
  latitude: 39.9999,
  longitude: 116.2755,
  adcode: '110108',
}

describe('content location helpers', () => {
  it('rejects missing and invalid coordinates', () => {
    expect(isValidContentLocation(null)).toBe(false)
    expect(isValidContentLocation({ ...location, latitude: Number.NaN })).toBe(false)
    expect(isValidContentLocation({ ...location, longitude: 181 })).toBe(false)
  })

  it('converts a valid location to a stable mini-program marker', () => {
    expect(isValidContentLocation(location)).toBe(true)
    expect(toMapMarker(location)).toEqual(
      expect.objectContaining({
        id: 1,
        latitude: location.latitude,
        longitude: location.longitude,
        title: location.title,
      }),
    )
  })

  it('builds a Tencent route URL from current location to the bound POI', () => {
    const url = new URL(buildTencentNavigationUrl(location, ' test-key '))

    expect(`${url.origin}${url.pathname}`).toBe('https://apis.map.qq.com/uri/v1/routeplan')
    expect(url.searchParams.get('type')).toBe('drive')
    expect(url.searchParams.get('fromcoord')).toBe('CurrentLocation')
    expect(url.searchParams.get('to')).toBe(location.title)
    expect(url.searchParams.get('tocoord')).toBe(`${location.latitude},${location.longitude}`)
    expect(url.searchParams.get('referer')).toBe('test-key')
  })

  it('rejects navigation without valid coordinates or a Tencent key', () => {
    expect(() => buildTencentNavigationUrl(location, '  ')).toThrow('腾讯地图 Key 未配置')
    expect(() =>
      buildTencentNavigationUrl({ ...location, longitude: Number.NaN }, 'test-key'),
    ).toThrow('地点坐标不可用')
  })
})
