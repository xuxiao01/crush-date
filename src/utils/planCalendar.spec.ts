import { describe, expect, it } from 'vitest'
import type { Plan } from '@/types/plan'
import {
  buildPlanCalendarMonth,
  groupCompletedPlans,
  isCalendarDate,
  planCalendarSummary,
  shiftCalendarMonth,
} from '@/utils/planCalendar'

function plan(id: string, date: string | null, extra: Partial<Plan> = {}): Plan {
  return {
    id,
    date,
    title: id,
    status: 'completed',
    scenario: 'free',
    scenarioText: '',
    note: '',
    items: [],
    sourceBackupId: null,
    completedAt: '2026-10-25T12:00:00.000Z',
    createdAt: '2026-10-01T00:00:00.000Z',
    memoryPhotos: [],
    ...extra,
  }
}

describe('past plan calendar', () => {
  it('groups multiple completed plans by plan date, not completion time', () => {
    const first = plan('first', '2026-10-01')
    const second = plan('second', '2026-10-01')
    const groups = groupCompletedPlans([
      first,
      second,
      plan('old', '2026-07-19', { completedAt: '2026-10-30T00:00:00.000Z' }),
      plan('active', '2026-10-06', { status: 'active' }),
    ])
    expect(groups.byDate['2026-10-01']).toEqual([first, second])
    expect(groups.byDate['2026-10-25']).toBeUndefined()
    expect(groups.byDate['2026-10-06']).toBeUndefined()
    expect(groups.months).toEqual(['2026-07', '2026-10'])
  })

  it('highlights the corrected October 1–6 holiday dates without a lookback restriction', () => {
    const plans = Array.from({ length: 6 }, (_, index) =>
      plan(String(index), `2026-10-0${index + 1}`),
    )
    const grouped = groupCompletedPlans(plans)
    expect(Object.keys(grouped.byDate)).toEqual([
      '2026-10-01',
      '2026-10-02',
      '2026-10-03',
      '2026-10-04',
      '2026-10-05',
      '2026-10-06',
    ])
    expect(grouped.months).toEqual(['2026-10'])
  })

  it('keeps missing and invalid dates accessible instead of normalizing them', () => {
    const missing = plan('missing', null)
    const invalid = plan('invalid', '2026-02-30')
    const grouped = groupCompletedPlans([missing, invalid, plan('valid', '2026-10-01')])
    expect(grouped.undated).toEqual([missing, invalid])
    expect(Object.keys(grouped.byDate)).toEqual(['2026-10-01'])
    expect(groupCompletedPlans([])).toEqual({ byDate: {}, undated: [], months: [] })
  })

  it.each([
    '',
    '2026-2-01',
    '2026-00-01',
    '2026-13-01',
    '2026-01-00',
    '2026-04-31',
    '2025-02-29',
    '2026-10-01T00:00:00Z',
  ])('rejects invalid calendar date %s', (date) => {
    expect(isCalendarDate(date)).toBe(false)
  })

  it('handles leap years and the correct weekday offset with exactly six rows', () => {
    const leap = buildPlanCalendarMonth('2024-02')
    expect(leap).toHaveLength(42)
    expect(leap.filter((cell) => cell.date)).toHaveLength(29)
    expect(leap[4].date).toBe('2024-02-01')
    expect(leap[32].date).toBe('2024-02-29')
    expect(new Set(leap.map((cell) => cell.key)).size).toBe(42)
    expect(buildPlanCalendarMonth('2026-02').filter((cell) => cell.date)).toHaveLength(28)
    const october = buildPlanCalendarMonth('2026-10')
    expect(october[4].date).toBe('2026-10-01')
    expect(october[34].date).toBe('2026-10-31')
  })

  it('moves across year boundaries and includes months without records', () => {
    expect(shiftCalendarMonth('2026-12', 1)).toBe('2027-01')
    expect(shiftCalendarMonth('2026-01', -1)).toBe('2025-12')
    expect(shiftCalendarMonth('2026-07', 1)).toBe('2026-08')
    expect(() => buildPlanCalendarMonth('2026-13')).toThrow('无效的日历月份')
  })

  it('creates the itinerary summary without mutating the original item order', () => {
    const input = plan('route', '2026-10-01', {
      items: [
        {
          id: 'evening',
          type: 'food',
          sourceId: '1',
          title: '晚饭',
          image: '',
          period: 'evening',
          note: '',
          order: 0,
        },
        {
          id: 'morning',
          type: 'place',
          sourceId: '2',
          title: '散步',
          image: '',
          period: 'morning',
          note: '',
          order: 0,
        },
      ],
    })
    expect(planCalendarSummary(input)).toBe('散步 → 晚饭')
    expect(input.items[0].id).toBe('evening')
    expect(planCalendarSummary(plan('empty', null))).toBe('那天也很好')
  })
})
