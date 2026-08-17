import type { ContentLocation } from '@/types/content'

export const MAP_MARKER_ICON_PATH = '/static/map/location-marker.png'

export function isValidContentLocation(
  location: ContentLocation | null | undefined,
): location is ContentLocation {
  if (!location) return false
  return (
    location.provider === 'tencent' &&
    Boolean(location.poiId && location.title) &&
    Number.isFinite(location.latitude) &&
    Number.isFinite(location.longitude) &&
    location.latitude >= -90 &&
    location.latitude <= 90 &&
    location.longitude >= -180 &&
    location.longitude <= 180
  )
}

export function toMapMarker(location: ContentLocation) {
  return {
    id: 1,
    latitude: location.latitude,
    longitude: location.longitude,
    title: location.title,
    iconPath: MAP_MARKER_ICON_PATH,
    width: 32,
    height: 37,
    callout: {
      content: location.title,
      display: 'ALWAYS' as const,
      color: '#4a3b34',
      fontSize: 13,
      borderRadius: 8,
      bgColor: '#fffdfb',
      padding: 8,
    },
  }
}

export function buildTencentNavigationUrl(location: ContentLocation, key: string): string {
  if (!isValidContentLocation(location)) throw new Error('地点坐标不可用')

  const normalizedKey = key.trim()
  if (!normalizedKey) throw new Error('腾讯地图 Key 未配置')

  const params = new URLSearchParams({
    type: 'drive',
    from: '我的位置',
    fromcoord: 'CurrentLocation',
    to: location.title,
    tocoord: `${location.latitude},${location.longitude}`,
    referer: normalizedKey,
  })
  return `https://apis.map.qq.com/uri/v1/routeplan?${params.toString()}`
}

export function openContentLocationNavigation(location: ContentLocation): void {
  if (!isValidContentLocation(location)) {
    uni.showToast({ title: '地点坐标不可用', icon: 'none' })
    return
  }

  // #ifdef H5
  try {
    const url = buildTencentNavigationUrl(
      location,
      import.meta.env.VITE_TENCENT_MAP_KEY?.trim() || '',
    )
    window.location.assign(url)
  } catch (error) {
    uni.showToast({
      title: error instanceof Error ? error.message : '无法打开导航',
      icon: 'none',
    })
  }
  // #endif

  // #ifndef H5
  uni.openLocation({
    latitude: location.latitude,
    longitude: location.longitude,
    name: location.title,
    address: location.address,
    fail: () => uni.showToast({ title: '无法打开地图导航', icon: 'none' }),
  })
  // #endif
}
