const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const SHANGHAI_OFFSET_MS = 8 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

/** Parse YYYY-MM-DD as local date */
export function parsePlanDate(date: string): Date {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export function toPlanDateString(date = new Date()): string {
  // Plan dates are calendar dates in Shanghai, regardless of the device timezone.
  const shanghaiDate = new Date(date.getTime() + SHANGHAI_OFFSET_MS)
  const y = shanghaiDate.getUTCFullYear()
  const m = String(shanghaiDate.getUTCMonth() + 1).padStart(2, '0')
  const d = String(shanghaiDate.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function addPlanDays(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number)
  const result = new Date(Date.UTC(year, month - 1, day))
  result.setUTCDate(result.getUTCDate() + days)
  return `${result.getUTCFullYear()}-${String(result.getUTCMonth() + 1).padStart(2, '0')}-${String(
    result.getUTCDate(),
  ).padStart(2, '0')}`
}

/** Earliest date allowed for temporary plan backfilling, inclusive. */
export function getEarliestSelectablePlanDate(from = new Date()): string {
  return addPlanDays(toPlanDateString(from), -14)
}

export function isSelectablePlanDate(date: string, from = new Date()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false
  const [year, month, day] = date.split('-').map(Number)
  const parsed = new Date(Date.UTC(year, month - 1, day))
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() + 1 !== month ||
    parsed.getUTCDate() !== day
  ) {
    return false
  }
  return date >= getEarliestSelectablePlanDate(from)
}

export function formatZhDate(date: string): string {
  const d = parsePlanDate(date)
  return `${d.getMonth() + 1}月${d.getDate()}日 · ${WEEKDAYS[d.getDay()]}`
}

export function formatZhDateShort(date: string): string {
  const d = parsePlanDate(date)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

export function formatDayMonth(date: string): { day: string; month: string } {
  const d = parsePlanDate(date)
  return {
    day: String(d.getDate()).padStart(2, '0'),
    month: String(d.getMonth() + 1).padStart(2, '0'),
  }
}

/** Days from today to plan date (0 = today, negative = past) */
export function daysUntil(date: string, from = new Date()): number {
  const start = parsePlanDate(toPlanDateString(from))
  const target = parsePlanDate(date)
  const diff = target.getTime() - start.getTime()
  return Math.round(diff / DAY_MS)
}

export function isPastDate(date: string, from = new Date()): boolean {
  return daysUntil(date, from) < 0
}

export function countdownLabel(date: string, from = new Date()): string {
  const n = daysUntil(date, from)
  if (n === 0) return '就是今天'
  if (n === 1) return '还有 1 天'
  if (n > 1) return `还有 ${n} 天`
  if (n === -1) return '昨天'
  return `已过去 ${Math.abs(n)} 天`
}
