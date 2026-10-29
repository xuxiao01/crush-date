import type { CityCode, CityOption } from '@/types/content'

export type ProvinceCode = 'beijing' | 'tianjin' | 'heilongjiang' | 'ningxia'

export interface CityRegion {
  code: ProvinceCode
  name: string
  cities: CityOption[]
}

export const CITY_PROVINCES: Record<CityCode, ProvinceCode> = {
  beijing: 'beijing',
  tianjin: 'tianjin',
  harbin: 'heilongjiang',
  yinchuan: 'ningxia',
  zhongwei: 'ningxia',
  wuzhong: 'ningxia',
}

const PROVINCES: Array<{ code: ProvinceCode; name: string }> = [
  { code: 'beijing', name: '北京市' },
  { code: 'tianjin', name: '天津市' },
  { code: 'heilongjiang', name: '黑龙江省' },
  { code: 'ningxia', name: '宁夏回族自治区' },
]

export function groupCitiesByProvince(cities: readonly CityOption[]): CityRegion[] {
  const available = cities.filter((city) => city.enabled).sort((a, b) => a.sortOrder - b.sortOrder)
  return PROVINCES.map((province) => ({
    ...province,
    cities: available.filter((city) => CITY_PROVINCES[city.code] === province.code),
  })).filter((province) => province.cities.length > 0)
}
