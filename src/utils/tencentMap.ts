interface TencentLatLng {
  lat: number
  lng: number
}

interface TencentMapInstance {
  destroy?: () => void
}

interface TencentMarkerLayer {
  setGeometries?: (geometries: unknown[]) => void
}

export interface TencentMapApi {
  LatLng: new (latitude: number, longitude: number) => TencentLatLng
  Map: new (
    container: HTMLElement,
    options: { center: TencentLatLng; zoom: number },
  ) => TencentMapInstance
  MarkerStyle: new (options: {
    width: number
    height: number
    anchor: { x: number; y: number }
    src: string
  }) => unknown
  MultiMarker: new (options: {
    map: TencentMapInstance
    styles: Record<string, unknown>
    geometries: Array<{
      id: string
      styleId: string
      position: TencentLatLng
      properties: { title: string }
    }>
  }) => TencentMarkerLayer
}

declare global {
  interface Window {
    TMap?: TencentMapApi
  }
}

let loaderPromise: Promise<TencentMapApi> | undefined

export function loadTencentMap(key: string): Promise<TencentMapApi> {
  if (!key) return Promise.reject(new Error('H5 地图 Key 未配置'))
  if (window.TMap) return Promise.resolve(window.TMap)
  if (loaderPromise) return loaderPromise

  loaderPromise = new Promise<TencentMapApi>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://map.qq.com/api/gljs?v=1.exp&key=${encodeURIComponent(key)}`
    script.async = true
    script.onload = () => {
      if (window.TMap) resolve(window.TMap)
      else reject(new Error('腾讯地图脚本加载失败'))
    }
    script.onerror = () => reject(new Error('腾讯地图脚本加载失败'))
    document.head.appendChild(script)
  }).catch((error: unknown) => {
    loaderPromise = undefined
    throw error
  })

  return loaderPromise
}
