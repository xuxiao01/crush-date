import { defineStore } from 'pinia'
import { ApiError } from '@/api/index'
import {
  activatePlan,
  completePlan,
  createPlan,
  deletePlan as deletePlanRequest,
  getPlans,
  replan,
  toPlanItemInput,
  updatePlan,
  type PlanItemInput,
} from '@/api/plans'
import type { Plan, PlanItem, PlanItemType, PlanPeriod, PlanScenario } from '@/types/plan'
import { PERIOD_ORDER } from '@/types/plan'
import { isPastDate, toPlanDateString } from '@/utils/planDate'

interface LegacyPlanItem extends PlanItem {
  address?: string
  completed?: boolean
}

interface LegacyPlan {
  id: string
  title: string
  date: string
  status: 'upcoming' | 'completed'
  note: string
  items: LegacyPlanItem[]
  createdAt: string
}

interface PlansState {
  list: Plan[]
  hydrated: boolean
  loading: boolean
}

type PlanMutationReason =
  | 'active_exists'
  | 'invalid_date'
  | 'not_found'
  | 'invalid_status'
  | 'duplicate'
  | 'readonly'
  | 'request_failed'

export type PlanMutationResult =
  { ok: true; plan: Plan } | { ok: false; reason: PlanMutationReason }

type PlanItemMutationResult =
  { ok: true; plan: Plan; item?: PlanItem } | { ok: false; reason: PlanMutationReason }

function stripLegacyItem(item: LegacyPlanItem): PlanItem {
  return {
    id: item.id,
    type: item.type,
    sourceId: item.sourceId,
    title: item.title,
    image: item.image,
    period: item.period,
    note: item.note || '',
    order: item.order,
  }
}

export function migrateLegacyPlans(legacy: LegacyPlan[], today = toPlanDateString()): Plan[] {
  const eligible = legacy
    .filter((plan) => plan.status === 'upcoming' && plan.date >= today)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
  const activeId = eligible[0]?.id

  return legacy.map((plan) => {
    const completed = plan.status === 'completed'
    const active = plan.id === activeId
    return {
      id: plan.id,
      title: active ? '本次计划' : plan.title || '备用计划',
      status: completed ? 'completed' : active ? 'active' : 'backup',
      date: completed || active ? plan.date : null,
      scenario: 'free',
      scenarioText: '自由安排',
      note: plan.note || '',
      items: plan.items.map(stripLegacyItem),
      sourceBackupId: null,
      completedAt: completed ? `${plan.date}T12:00:00.000Z` : null,
      createdAt: plan.createdAt,
      memoryPhotos: [],
    }
  })
}

function sortCompleted(a: Plan, b: Plan) {
  return (b.completedAt || b.date || '').localeCompare(a.completedAt || a.date || '')
}

function validActiveDate(date: string) {
  return Boolean(date) && !isPastDate(date)
}

function failureReason(error: unknown, fallback: PlanMutationReason = 'request_failed') {
  if (error instanceof ApiError && error.statusCode === 409) return 'active_exists' as const
  if (error instanceof ApiError && error.statusCode === 404) return 'not_found' as const
  return fallback
}

export const usePlansStore = defineStore('plans', {
  state: (): PlansState => ({ list: [], hydrated: false, loading: false }),
  getters: {
    activePlan: (state) => state.list.find((plan) => plan.status === 'active'),
    backupPlans: (state) =>
      state.list
        .filter((plan) => plan.status === 'backup')
        .slice()
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    completedPlans: (state) =>
      state.list
        .filter((plan) => plan.status === 'completed')
        .slice()
        .sort(sortCompleted),
    totalCount: (state) => state.list.length,
  },
  actions: {
    replacePlan(plan: Plan) {
      const index = this.list.findIndex((item) => item.id === plan.id)
      if (index >= 0) this.list.splice(index, 1, plan)
      else this.list.push(plan)
    },
    async hydrate(force = false) {
      if ((this.hydrated && !force) || this.loading) return this.hydrated
      this.loading = true
      try {
        const response = await getPlans()
        this.list = [
          ...(response.activePlan ? [response.activePlan] : []),
          ...response.backupPlans,
          ...response.completedPlans,
        ]
        this.hydrated = true
        return true
      } catch {
        return false
      } finally {
        this.loading = false
      }
    },
    getById(id: string) {
      return this.list.find((plan) => plan.id === id)
    },
    async createActive(payload: { date: string; note?: string }): Promise<PlanMutationResult> {
      if (this.activePlan) return { ok: false, reason: 'active_exists' }
      if (!validActiveDate(payload.date)) return { ok: false, reason: 'invalid_date' }
      try {
        const plan = await createPlan({
          title: '本次计划',
          status: 'active',
          date: payload.date,
          scenario: 'free',
          scenarioText: '自由安排',
          note: (payload.note || '').trim(),
          items: [],
        })
        this.replacePlan(plan)
        return { ok: true, plan }
      } catch (error) {
        return { ok: false, reason: failureReason(error) }
      }
    },
    async createBackup(payload: {
      title: string
      scenario: PlanScenario
      scenarioText: string
      note?: string
    }): Promise<PlanMutationResult> {
      try {
        const plan = await createPlan({
          title: payload.title.trim() || '备用计划',
          status: 'backup',
          date: null,
          scenario: payload.scenario,
          scenarioText: payload.scenarioText.trim(),
          note: (payload.note || '').trim(),
          items: [],
        })
        this.replacePlan(plan)
        return { ok: true, plan }
      } catch (error) {
        return { ok: false, reason: failureReason(error) }
      }
    },
    async updatePlanMeta(
      planId: string,
      payload: {
        title: string
        scenario: PlanScenario
        scenarioText: string
        note: string
      },
    ) {
      const current = this.getById(planId)
      if (!current || current.status === 'completed') return false
      try {
        const plan = await updatePlan(planId, {
          title: payload.title.trim() || current.title,
          scenario: payload.scenario,
          scenarioText: payload.scenarioText.trim(),
          note: payload.note.trim(),
        })
        this.replacePlan(plan)
        return true
      } catch {
        return false
      }
    },
    async activateBackup(planId: string, date: string): Promise<PlanMutationResult> {
      if (this.activePlan) return { ok: false, reason: 'active_exists' }
      if (!validActiveDate(date)) return { ok: false, reason: 'invalid_date' }
      const source = this.getById(planId)
      if (!source) return { ok: false, reason: 'not_found' }
      if (source.status !== 'backup') return { ok: false, reason: 'invalid_status' }
      try {
        const plan = await activatePlan(planId, date)
        this.replacePlan(plan)
        return { ok: true, plan }
      } catch (error) {
        return { ok: false, reason: failureReason(error) }
      }
    },
    async replanCompleted(planId: string, date: string): Promise<PlanMutationResult> {
      if (this.activePlan) return { ok: false, reason: 'active_exists' }
      if (!validActiveDate(date)) return { ok: false, reason: 'invalid_date' }
      const source = this.getById(planId)
      if (!source) return { ok: false, reason: 'not_found' }
      if (source.status !== 'completed') return { ok: false, reason: 'invalid_status' }
      try {
        const plan = await replan(planId, date)
        this.replacePlan(plan)
        return { ok: true, plan }
      } catch (error) {
        return { ok: false, reason: failureReason(error) }
      }
    },
    async completeActive(planId: string): Promise<PlanMutationResult> {
      const current = this.getById(planId)
      if (!current) return { ok: false, reason: 'not_found' }
      if (current.status !== 'active' || !current.date) {
        return { ok: false, reason: 'invalid_status' }
      }
      try {
        const plan = await completePlan(planId)
        this.replacePlan(plan)
        return { ok: true, plan }
      } catch (error) {
        return { ok: false, reason: failureReason(error, 'invalid_status') }
      }
    },
    async deletePlan(planId: string) {
      const current = this.getById(planId)
      if (!current || current.status === 'completed') return false
      try {
        await deletePlanRequest(planId)
        this.list = this.list.filter((plan) => plan.id !== planId)
        return true
      } catch {
        return false
      }
    },
    async updatePlanNote(planId: string, note: string) {
      const current = this.getById(planId)
      if (!current || current.status === 'completed') return false
      try {
        const plan = await updatePlan(planId, { note: note.trim() })
        this.replacePlan(plan)
        return true
      } catch {
        return false
      }
    },
    async replaceItems(planId: string, items: PlanItemInput[]): Promise<PlanItemMutationResult> {
      try {
        const plan = await updatePlan(planId, { items })
        this.replacePlan(plan)
        return { ok: true, plan }
      } catch (error) {
        return { ok: false, reason: failureReason(error) }
      }
    },
    async addItemToPlan(
      planId: string,
      payload: {
        type: PlanItemType
        sourceId: string
        title: string
        image: string
        period: PlanPeriod
        note?: string
      },
    ): Promise<PlanItemMutationResult> {
      const plan = this.getById(planId)
      if (!plan) return { ok: false, reason: 'not_found' }
      if (plan.status === 'completed') return { ok: false, reason: 'readonly' }
      if (plan.items.some((item) => item.sourceId === payload.sourceId)) {
        return { ok: false, reason: 'duplicate' }
      }
      const peers = plan.items.filter((item) => item.period === payload.period)
      const result = await this.replaceItems(planId, [
        ...plan.items.map(toPlanItemInput),
        {
          type: payload.type,
          sourceId: payload.sourceId,
          period: payload.period,
          note: (payload.note || '').trim(),
          order: peers.length ? Math.max(...peers.map((peer) => peer.order)) + 1 : 0,
        },
      ])
      if (!result.ok) return result
      return {
        ...result,
        item: result.plan.items.find((item) => item.sourceId === payload.sourceId),
      }
    },
    async updateItemPeriod(planId: string, itemId: string, period: PlanPeriod) {
      const plan = this.getById(planId)
      if (!plan || plan.status === 'completed') return false
      const target = plan.items.find((item) => item.id === itemId)
      if (!target) return false
      const peers = plan.items.filter((item) => item.period === period && item.id !== itemId)
      const result = await this.replaceItems(
        planId,
        plan.items.map((item) => ({
          ...toPlanItemInput(item),
          period: item.id === itemId ? period : item.period,
          order:
            item.id === itemId
              ? peers.length
                ? Math.max(...peers.map((peer) => peer.order)) + 1
                : 0
              : item.order,
        })),
      )
      return result.ok
    },
    async updateItemNote(planId: string, itemId: string, note: string) {
      const plan = this.getById(planId)
      if (!plan || plan.status === 'completed') return false
      if (!plan.items.some((item) => item.id === itemId)) return false
      const result = await this.replaceItems(
        planId,
        plan.items.map((item) => ({
          ...toPlanItemInput(item),
          note: item.id === itemId ? note.trim() : item.note,
        })),
      )
      return result.ok
    },
    async replaceItemSource(
      planId: string,
      itemId: string,
      payload: { type: PlanItemType; sourceId: string; title: string; image: string },
    ): Promise<PlanItemMutationResult> {
      const plan = this.getById(planId)
      if (!plan || plan.status === 'completed') return { ok: false, reason: 'readonly' }
      if (!plan.items.some((item) => item.id === itemId)) {
        return { ok: false, reason: 'not_found' }
      }
      if (plan.items.some((item) => item.id !== itemId && item.sourceId === payload.sourceId)) {
        return { ok: false, reason: 'duplicate' }
      }
      return this.replaceItems(
        planId,
        plan.items.map((item) =>
          item.id === itemId
            ? { ...toPlanItemInput(item), type: payload.type, sourceId: payload.sourceId }
            : toPlanItemInput(item),
        ),
      )
    },
    async removeItem(planId: string, itemId: string) {
      const plan = this.getById(planId)
      if (!plan || plan.status === 'completed') return false
      if (!plan.items.some((item) => item.id === itemId)) return false
      const result = await this.replaceItems(
        planId,
        plan.items.filter((item) => item.id !== itemId).map(toPlanItemInput),
      )
      return result.ok
    },
    async reorderItemInPeriod(planId: string, itemId: string, direction: 'up' | 'down') {
      const plan = this.getById(planId)
      if (!plan || plan.status === 'completed') return false
      const item = plan.items.find((candidate) => candidate.id === itemId)
      if (!item) return false
      const peers = plan.items
        .filter((candidate) => candidate.period === item.period)
        .slice()
        .sort((a, b) => a.order - b.order)
      const index = peers.findIndex((candidate) => candidate.id === itemId)
      const target = direction === 'up' ? index - 1 : index + 1
      if (index < 0 || target < 0 || target >= peers.length) return false
      const firstId = peers[index].id
      const secondId = peers[target].id
      const firstOrder = peers[index].order
      const secondOrder = peers[target].order
      const result = await this.replaceItems(
        planId,
        plan.items.map((candidate) => ({
          ...toPlanItemInput(candidate),
          order:
            candidate.id === firstId
              ? secondOrder
              : candidate.id === secondId
                ? firstOrder
                : candidate.order,
        })),
      )
      return result.ok
    },
    itemsByPeriod(planId: string, period: PlanPeriod) {
      const plan = this.getById(planId)
      if (!plan) return []
      return plan.items
        .filter((item) => item.period === period)
        .slice()
        .sort((a, b) => a.order - b.order)
    },
    periodSummaries(plan: Plan) {
      return PERIOD_ORDER.map((period) => ({
        period,
        items: plan.items
          .filter((item) => item.period === period)
          .slice()
          .sort((a, b) => a.order - b.order),
      })).filter((group) => group.items.length > 0)
    },
  },
})
