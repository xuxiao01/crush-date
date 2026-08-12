import type { PlanItem } from '@/types/plan'
import { PERIOD_ORDER } from '@/types/plan'

export type PlanRecordGroupLayout = 'single' | 'double' | 'triple'

export interface PlanRecordGroup {
  items: PlanItem[]
  layout: PlanRecordGroupLayout
  mirrored: boolean
}

export function sortPlanRecordItems(items: PlanItem[]): PlanItem[] {
  return items.slice().sort((a, b) => {
    const periodComparison = PERIOD_ORDER.indexOf(a.period) - PERIOD_ORDER.indexOf(b.period)
    if (periodComparison) return periodComparison
    const orderComparison = a.order - b.order
    return orderComparison || a.id.localeCompare(b.id)
  })
}

export function groupPlanRecordItems(items: PlanItem[]): PlanRecordGroup[] {
  const sortedItems = sortPlanRecordItems(items)
  const groups: PlanRecordGroup[] = []

  for (let index = 0; index < sortedItems.length; index += 3) {
    const groupItems = sortedItems.slice(index, index + 3)
    groups.push({
      items: groupItems,
      layout: groupItems.length === 1 ? 'single' : groupItems.length === 2 ? 'double' : 'triple',
      mirrored: groupItems.length === 3 && groups.length % 2 === 1,
    })
  }

  return groups
}
