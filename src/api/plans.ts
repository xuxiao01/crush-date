import { request } from '@/api/index'
import type {
  Plan,
  PlanItem,
  PlanItemType,
  PlanPeriod,
  PlanScenario,
  PlanStatus,
} from '@/types/plan'

export interface PlanItemInput {
  id?: string
  type: PlanItemType
  sourceId: string
  period: PlanPeriod
  note: string
  order: number
}

export interface CreatePlanInput {
  title: string
  status: Extract<PlanStatus, 'active' | 'backup'>
  date: string | null
  scenario: PlanScenario
  scenarioText: string
  note: string
  items: PlanItemInput[]
}

export interface UpdatePlanInput {
  title?: string
  date?: string | null
  scenario?: PlanScenario
  scenarioText?: string
  note?: string
  items?: PlanItemInput[]
}

interface PlanResponse extends Omit<Plan, 'memoryPhotos'> {
  memoryPhotos?: string[]
}

interface PlanListResponse {
  activePlan: PlanResponse | null
  backupPlans: PlanResponse[]
  completedPlans: PlanResponse[]
}

export interface NormalizedPlanListResponse {
  activePlan: Plan | null
  backupPlans: Plan[]
  completedPlans: Plan[]
}

function normalizePlan(plan: PlanResponse): Plan {
  return {
    ...plan,
    memoryPhotos: plan.memoryPhotos ?? [],
  }
}

export function toPlanItemInput(item: PlanItem): PlanItemInput {
  return {
    id: item.id,
    type: item.type,
    sourceId: item.sourceId,
    period: item.period,
    note: item.note,
    order: item.order,
  }
}

export async function getPlans(): Promise<NormalizedPlanListResponse> {
  const response = await request<PlanListResponse>({ url: '/api/crush-date/plans' })
  return {
    activePlan: response.activePlan ? normalizePlan(response.activePlan) : null,
    backupPlans: response.backupPlans.map(normalizePlan),
    completedPlans: response.completedPlans.map(normalizePlan),
  }
}

export async function getPlan(id: string): Promise<Plan> {
  const response = await request<PlanResponse>({
    url: `/api/crush-date/plans/${encodeURIComponent(id)}`,
  })
  return normalizePlan(response)
}

export async function createPlan(input: CreatePlanInput): Promise<Plan> {
  const response = await request<PlanResponse>({
    url: '/api/crush-date/plans',
    method: 'POST',
    data: input,
  })
  return normalizePlan(response)
}

export async function updatePlan(id: string, input: UpdatePlanInput): Promise<Plan> {
  const response = await request<PlanResponse>({
    url: `/api/crush-date/plans/${encodeURIComponent(id)}`,
    method: 'PATCH',
    data: input,
  })
  return normalizePlan(response)
}

export function deletePlan(id: string): Promise<void> {
  return request<void>({
    url: `/api/crush-date/plans/${encodeURIComponent(id)}`,
    method: 'DELETE',
  })
}

export async function activatePlan(id: string, date: string): Promise<Plan> {
  const response = await request<PlanResponse>({
    url: `/api/crush-date/plans/${encodeURIComponent(id)}/activate`,
    method: 'POST',
    data: { date },
  })
  return normalizePlan(response)
}

export async function completePlan(id: string): Promise<Plan> {
  const response = await request<PlanResponse>({
    url: `/api/crush-date/plans/${encodeURIComponent(id)}/complete`,
    method: 'POST',
  })
  return normalizePlan(response)
}

export async function replan(id: string, date: string): Promise<Plan> {
  const response = await request<PlanResponse>({
    url: `/api/crush-date/plans/${encodeURIComponent(id)}/replan`,
    method: 'POST',
    data: { date },
  })
  return normalizePlan(response)
}
