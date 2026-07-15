export type PlanStatus = 'active' | 'backup' | 'completed'
export type PlanScenario = 'hot' | 'cold' | 'rainy' | 'sunny' | 'free'
export type PlanPeriod = 'morning' | 'noon' | 'afternoon' | 'evening'
export type PlanItemType = 'food' | 'place'

export interface PlanItem {
  id: string
  type: PlanItemType
  sourceId: string
  title: string
  image: string
  period: PlanPeriod
  note: string
  order: number
}

export interface Plan {
  id: string
  title: string
  status: PlanStatus
  date: string | null
  scenario: PlanScenario
  scenarioText: string
  note: string
  items: PlanItem[]
  sourceBackupId: string | null
  completedAt: string | null
  createdAt: string
  /** Read-only memory photos for completed plans. Uploading is out of scope for now. */
  memoryPhotos: string[]
}

export const PERIOD_ORDER: PlanPeriod[] = ['morning', 'noon', 'afternoon', 'evening']

export const PERIOD_LABELS: Record<PlanPeriod, string> = {
  morning: '上午',
  noon: '中午',
  afternoon: '下午',
  evening: '晚上',
}

export const SCENARIO_LABELS: Record<PlanScenario, string> = {
  hot: '炎热',
  cold: '寒冷',
  rainy: '下雨',
  sunny: '晴天',
  free: '自由',
}

export function defaultPeriodForType(type: PlanItemType): PlanPeriod {
  return type === 'food' ? 'noon' : 'afternoon'
}

/** Suggested content type when adding from a period section. */
export function itemTypeForPeriod(period: PlanPeriod): PlanItemType {
  return period === 'noon' || period === 'evening' ? 'food' : 'place'
}

export function periodsForItemType(): PlanPeriod[] {
  return PERIOD_ORDER
}
