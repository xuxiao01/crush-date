import { describe, expect, it } from 'vitest'
import type { PlanItem, PlanPeriod } from '@/types/plan'
import { groupPlanRecordItems, sortPlanRecordItems } from '@/utils/planRecordGallery'

function makeItem(index: number, period: PlanPeriod = 'morning', order = index): PlanItem {
  return {
    id: `item-${index}`,
    type: period === 'noon' || period === 'evening' ? 'food' : 'place',
    sourceId: `source-${index}`,
    title: `安排 ${index}`,
    image: `/item-${index}.jpg`,
    period,
    note: '',
    order,
  }
}

describe('plan record gallery', () => {
  it.each([
    [1, ['single']],
    [2, ['double']],
    [3, ['triple']],
    [4, ['triple', 'single']],
    [5, ['triple', 'double']],
    [6, ['triple', 'triple']],
    [7, ['triple', 'triple', 'single']],
  ] as const)('builds the expected layouts for %i items', (count, expectedLayouts) => {
    const groups = groupPlanRecordItems(
      Array.from({ length: count }, (_, index) => makeItem(index + 1)),
    )

    expect(groups.map((group) => group.layout)).toEqual(expectedLayouts)
    expect(groups.map((group) => group.mirrored)).toEqual(
      expectedLayouts.map((layout, index) => layout === 'triple' && index % 2 === 1),
    )
  })

  it('sorts items by period, order, and id', () => {
    const items = [
      makeItem(4, 'evening', 0),
      makeItem(3, 'afternoon', 0),
      makeItem(2, 'morning', 2),
      makeItem(1, 'morning', 1),
      makeItem(5, 'noon', 0),
    ]

    expect(sortPlanRecordItems(items).map((item) => item.id)).toEqual([
      'item-1',
      'item-2',
      'item-5',
      'item-3',
      'item-4',
    ])
  })
})
