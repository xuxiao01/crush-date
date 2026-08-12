import { describe, expect, it } from 'vitest'
import {
  getEarliestSelectablePlanDate,
  isSelectablePlanDate,
  toPlanDateString,
} from '@/utils/planDate'

describe('plan date range', () => {
  const justAfterShanghaiMidnight = new Date('2026-08-11T16:00:00.000Z')

  it('uses the Shanghai calendar date', () => {
    expect(toPlanDateString(justAfterShanghaiMidnight)).toBe('2026-08-12')
    expect(getEarliestSelectablePlanDate(justAfterShanghaiMidnight)).toBe('2026-07-29')
  })

  it('includes exactly 14 days ago and rejects the 15th day', () => {
    expect(isSelectablePlanDate('2026-07-29', justAfterShanghaiMidnight)).toBe(true)
    expect(isSelectablePlanDate('2026-07-28', justAfterShanghaiMidnight)).toBe(false)
    expect(isSelectablePlanDate('2026-08-12', justAfterShanghaiMidnight)).toBe(true)
    expect(isSelectablePlanDate('2099-01-01', justAfterShanghaiMidnight)).toBe(true)
  })
})
