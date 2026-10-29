import type { Plan } from '@/types/plan'
import { PERIOD_ORDER } from '@/types/plan'

function utcDate(year: number, month: number, day = 1): Date {
  const date = new Date(0)
  date.setUTCHours(0, 0, 0, 0)
  date.setUTCFullYear(year, month, day)
  return date
}

export function isCalendarDate(value: string | null): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = utcDate(year, month - 1, day)
  return (
    year > 0 &&
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

export function groupCompletedPlans(plans: readonly Plan[]) {
  const byDate: Record<string, Plan[]> = {}
  const undated: Plan[] = []
  for (const plan of plans) {
    if (plan.status !== 'completed') continue
    if (isCalendarDate(plan.date)) (byDate[plan.date] ||= []).push(plan)
    else undated.push(plan)
  }
  const months = [...new Set(Object.keys(byDate).map((date) => date.slice(0, 7)))].sort()
  return { byDate, undated, months }
}

function monthParts(month: string): [number, number] {
  if (!isCalendarDate(`${month}-01`)) throw new Error('无效的日历月份')
  const [year, value] = month.split('-').map(Number)
  return [year, value - 1]
}

export function shiftCalendarMonth(month: string, offset: number): string {
  const [year, index] = monthParts(month)
  const date = utcDate(year, index + offset)
  return `${String(date.getUTCFullYear()).padStart(4, '0')}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

export interface PlanCalendarCell {
  key: string
  label: string
  date?: string
}

export function buildPlanCalendarMonth(month: string): PlanCalendarCell[] {
  const [year, index] = monthParts(month)
  const offset = utcDate(year, index).getUTCDay()
  const days = utcDate(year, index + 1, 0).getUTCDate()
  return Array.from({ length: 42 }, (_, index) => {
    const day = index - offset + 1
    if (day < 1 || day > days) return { key: `${month}-pad-${index}`, label: '' }
    const date = `${month}-${String(day).padStart(2, '0')}`
    return { key: date, label: String(day), date }
  })
}

export function planCalendarSummary(plan: Plan): string {
  return (
    plan.items
      .slice()
      .sort(
        (a, b) =>
          PERIOD_ORDER.indexOf(a.period) - PERIOD_ORDER.indexOf(b.period) || a.order - b.order,
      )
      .map((item) => item.title)
      .join(' → ') || '那天也很好'
  )
}
