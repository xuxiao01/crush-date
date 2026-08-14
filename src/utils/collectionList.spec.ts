import { describe, expect, it } from 'vitest'
import type { FoodCardItem } from '@/types/food'
import type { PlaceCardItem } from '@/types/place'
import { filterCollectionItems } from '@/utils/collectionList'

const foods: FoodCardItem[] = [
  {
    id: 'food-1',
    name: '川味老火锅',
    type: '火锅 · 川味',
    comment: '一起去吃',
    image: '/hotpot.jpg',
    status: 'unvisited',
    visitedDate: '',
  },
  {
    id: 'food-2',
    name: '胡同铜锅涮肉',
    type: '涮肉 · 老北京',
    comment: '已经打卡',
    image: '/visited.jpg',
    status: 'visited',
    visitedDate: '2026.08.01',
  },
]

const places: PlaceCardItem[] = [
  {
    id: 'place-1',
    name: '颐和园傍晚散步',
    type: '公园 · 散步',
    comment: '一起看晚霞',
    image: '/park.jpg',
    status: 'unvisited',
    visitedDate: '',
  },
  {
    id: 'place-2',
    name: '今日美术馆',
    type: '展览 · 室内',
    comment: '看过展览',
    image: '/museum.jpg',
    status: 'visited',
    visitedDate: '2026.08.02',
  },
]

describe('filterCollectionItems', () => {
  it('returns every item in the selected status for an empty keyword', () => {
    expect(filterCollectionItems(foods, { status: 'unvisited', keyword: '   ' })).toEqual([
      foods[0],
    ])
  })

  it('matches visible food name and type text', () => {
    expect(filterCollectionItems(foods, { status: 'unvisited', keyword: '老火锅' })).toEqual([
      foods[0],
    ])
    expect(filterCollectionItems(foods, { status: 'unvisited', keyword: '川味' })).toEqual([
      foods[0],
    ])
  })

  it('matches visible place name and type text', () => {
    expect(filterCollectionItems(places, { status: 'unvisited', keyword: '颐和园' })).toEqual([
      places[0],
    ])
    expect(filterCollectionItems(places, { status: 'unvisited', keyword: '公园' })).toEqual([
      places[0],
    ])
  })

  it('does not match hidden comment text', () => {
    expect(filterCollectionItems(places, { status: 'unvisited', keyword: '晚霞' })).toEqual([])
  })

  it('keeps visited and unvisited results isolated', () => {
    expect(filterCollectionItems(places, { status: 'visited', keyword: '展览' })).toEqual([
      places[1],
    ])
    expect(filterCollectionItems(places, { status: 'unvisited', keyword: '展览' })).toEqual([])
  })

  it('returns no result for an unmatched keyword', () => {
    expect(filterCollectionItems(places, { status: 'unvisited', keyword: '电影院' })).toEqual([])
  })

  it('combines an exact category filter with keyword search', () => {
    expect(
      filterCollectionItems(foods, {
        status: 'unvisited',
        keyword: '川味',
        category: '火锅 · 川味',
      }),
    ).toEqual([foods[0]])
    expect(
      filterCollectionItems(foods, {
        status: 'unvisited',
        keyword: '川味',
        category: '中餐',
      }),
    ).toEqual([])
  })
})
