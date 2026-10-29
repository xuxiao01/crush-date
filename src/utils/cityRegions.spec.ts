import { describe, expect, it } from 'vitest'
import type { CityCode, CityOption } from '@/types/content'
import { groupCitiesByProvince } from '@/utils/cityRegions'

function city(code: CityCode, name: string, sortOrder: number, enabled = true): CityOption {
  return { code, name, sortOrder, enabled }
}

describe('groupCitiesByProvince', () => {
  it('groups all six cities in the fixed province order and API city order', () => {
    const cities = [
      city('wuzhong', '吴忠', 5),
      city('zhongwei', '中卫', 4),
      city('harbin', '哈尔滨', 2),
      city('yinchuan', '银川', 3),
      city('tianjin', '天津', 1),
      city('beijing', '北京', 0),
    ]
    const original = [...cities]
    const groups = groupCitiesByProvince(cities)

    expect(groups.map((group) => group.name)).toEqual([
      '北京市',
      '天津市',
      '黑龙江省',
      '宁夏回族自治区',
    ])
    expect(groups.map((group) => group.cities.map((item) => item.code))).toEqual([
      ['beijing'],
      ['tianjin'],
      ['harbin'],
      ['yinchuan', 'zhongwei', 'wuzhong'],
    ])
    expect(cities).toEqual(original)
  })

  it('excludes disabled cities and provinces with no enabled cities', () => {
    const groups = groupCitiesByProvince([
      city('beijing', '北京', 0, false),
      city('yinchuan', '银川', 3, false),
      city('wuzhong', '接口城市名', 5),
    ])
    expect(groups).toEqual([
      {
        code: 'ningxia',
        name: '宁夏回族自治区',
        cities: [city('wuzhong', '接口城市名', 5)],
      },
    ])
  })

  it('returns no provinces when no cities are available', () => {
    expect(groupCitiesByProvince([])).toEqual([])
    expect(groupCitiesByProvince([city('tianjin', '天津', 0, false)])).toEqual([])
  })
})
