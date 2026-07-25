import { ApiError, getBaseURL, request } from '@/api/index'
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

export type UpdatePlanStatusPayload =
  | {
      status: 'active'
      date: string
    }
  | {
      status: 'backup'
    }
  | {
      status: 'completed'
    }

export interface PlanPhoto {
  id: string
  url: string
  sortOrder: number
  createdAt: string
}

export interface PlanPhotoListResponse {
  list: PlanPhoto[]
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
    showError: false,
  })
}

export async function updatePlanStatus(
  id: string,
  payload: UpdatePlanStatusPayload,
): Promise<Plan> {
  const response = await request<PlanResponse>({
    url: `/api/crush-date/plans/${encodeURIComponent(id)}/status`,
    method: 'PATCH',
    data: payload,
    showError: false,
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

export async function getPlanPhotos(id: string): Promise<PlanPhoto[]> {
  const response = await request<PlanPhotoListResponse>({
    url: `/api/crush-date/plans/${encodeURIComponent(id)}/photos`,
    showError: false,
  })
  return response.list
}

export function deletePlanPhoto(planId: string, photoId: string): Promise<void> {
  return request<void>({
    url: `/api/crush-date/plans/${encodeURIComponent(planId)}/photos/${encodeURIComponent(photoId)}`,
    method: 'DELETE',
    showError: false,
  })
}

export function uploadPlanPhoto(id: string, filePath: string): Promise<PlanPhoto> {
  const baseURL = getBaseURL().replace(/\/$/, '')

  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: `${baseURL}/api/crush-date/plans/${encodeURIComponent(id)}/photos`,
      filePath,
      name: 'file',
      success: (response) => {
        let data: PlanPhoto | { message?: string } | null = null
        try {
          data = JSON.parse(response.data) as PlanPhoto | { message?: string }
        } catch {
          data = null
        }

        if (response.statusCode >= 200 && response.statusCode < 300 && data && 'id' in data) {
          resolve(data)
          return
        }

        const message = data && 'message' in data ? data.message : undefined
        reject(new ApiError(message || `上传失败（${response.statusCode}）`, response.statusCode))
      },
      fail: (error) => {
        reject(new Error(error.errMsg || '无法连接服务器，请稍后重试'))
      },
    })
  })
}
