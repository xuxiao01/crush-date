const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

/** Parse YYYY-MM-DD as local date */
export function parsePlanDate(date: string): Date {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export function toPlanDateString(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
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
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  const target = parsePlanDate(date)
  const diff = target.getTime() - start.getTime()
  return Math.round(diff / (24 * 60 * 60 * 1000))
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
