import { defineStore } from 'pinia'
import food01 from '@/assets/foods/food-01.jpg'
import food09 from '@/assets/foods/food-09.jpg'
import food11 from '@/assets/foods/food-11.jpg'
import place02 from '@/assets/places/place-02.jpg'
import place03 from '@/assets/places/place-03.jpg'
import place04 from '@/assets/places/place-04.jpg'
import place06 from '@/assets/places/place-06.jpg'
import type {
  Plan,
  PlanItem,
  PlanItemType,
  PlanPeriod,
  PlanScenario,
} from '@/types/plan'
import { PERIOD_ORDER } from '@/types/plan'
import { getStorage, setStorage } from '@/utils/storage'
import { isPastDate, toPlanDateString } from '@/utils/planDate'

export const PLANS_STORAGE_KEY = 'crush_date_plans_v2'
export const LEGACY_PLANS_STORAGE_KEY = 'crush_date_plans_v1'

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
}

export type PlanMutationResult =
  | { ok: true; plan: Plan }
  | {
      ok: false
      reason:
        | 'active_exists'
        | 'invalid_date'
        | 'not_found'
        | 'invalid_status'
        | 'duplicate'
        | 'readonly'
    }

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function cloneItems(items: PlanItem[]): PlanItem[] {
  return items.map((item) => ({ ...item, id: uid('pi') }))
}

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

function createMockPlans(): Plan[] {
  return [
    {
      id: 'plan-active',
      title: '本次计划',
      status: 'active',
      date: '2026-07-20',
      scenario: 'sunny',
      scenarioText: '晴天',
      note: '希望天气不太热，也一起遇见好看的天空。',
      sourceBackupId: null,
      completedAt: null,
      createdAt: '2026-07-10T10:00:00.000Z',
      memoryPhotos: [],
      items: [
        {
          id: 'pi-active-1',
          type: 'place',
          sourceId: 'place-06',
          title: '798 艺术区',
          image: place06,
          period: 'morning',
          note: '出去走走，顺便看看天空。',
          order: 0,
        },
        {
          id: 'pi-active-2',
          type: 'food',
          sourceId: 'food-01',
          title: '阿里郎朝鲜烤肉',
          image: food01,
          period: 'evening',
          note: '感受一下当太阳的感觉！',
          order: 0,
        },
      ],
    },
    {
      id: 'backup-hot',
      title: '天气太热的时候',
      status: 'backup',
      date: null,
      scenario: 'hot',
      scenarioText: '炎热 · 室内 · 不晒',
      note: '太阳太大，就找个有空调的地方慢慢逛。',
      sourceBackupId: null,
      completedAt: null,
      createdAt: '2026-07-11T10:00:00.000Z',
      memoryPhotos: [],
      items: [
        { id: 'pi-hot-1', type: 'place', sourceId: 'place-04', title: '周末密室逃脱', image: place04, period: 'afternoon', note: '室内慢慢玩。', order: 0 },
        { id: 'pi-hot-2', type: 'food', sourceId: 'food-09', title: '蜀九香火锅', image: food09, period: 'evening', note: '晚上好好吃一顿。', order: 0 },
      ],
    },
    {
      id: 'backup-cool',
      title: '天气凉快的时候',
      status: 'backup',
      date: null,
      scenario: 'cold',
      scenarioText: '凉快 · 户外 · 散步',
      note: '有风的时候，就慢慢走一段。',
      sourceBackupId: null,
      completedAt: null,
      createdAt: '2026-07-12T10:00:00.000Z',
      memoryPhotos: [],
      items: [{ id: 'pi-cool-1', type: 'place', sourceId: 'place-02', title: '朝阳公园', image: place02, period: 'afternoon', note: '看看天空。', order: 0 }],
    },
    {
      id: 'backup-rain',
      title: '下雨的时候',
      status: 'backup',
      date: null,
      scenario: 'rainy',
      scenarioText: '下雨 · 室内',
      note: '听着雨声，慢慢吃点热的。',
      sourceBackupId: null,
      completedAt: null,
      createdAt: '2026-07-13T10:00:00.000Z',
      memoryPhotos: [],
      items: [{ id: 'pi-rain-1', type: 'place', sourceId: 'place-03', title: '三里屯随便逛逛', image: place03, period: 'afternoon', note: '找间咖啡店坐坐。', order: 0 }],
    },
    {
      id: 'plan-past',
      title: '公园里的傍晚',
      status: 'completed',
      date: '2026-07-06',
      scenario: 'sunny',
      scenarioText: '晴天 · 散步',
      note: '那天风刚好，人也刚好。',
      sourceBackupId: null,
      completedAt: '2026-07-06T14:00:00.000Z',
      createdAt: '2026-07-01T10:00:00.000Z',
      memoryPhotos: [place02],
      items: [
        { id: 'pi-past-1', type: 'place', sourceId: 'place-02', title: '朝阳公园', image: place02, period: 'afternoon', note: '躺着看云层变粉。', order: 0 },
        { id: 'pi-past-2', type: 'food', sourceId: 'food-11', title: '很久以前羊肉串', image: food11, period: 'evening', note: '烟火气刚刚好。', order: 0 },
      ],
    },
  ]
}

function sortCompleted(a: Plan, b: Plan) {
  return (b.completedAt || b.date || '').localeCompare(a.completedAt || a.date || '')
}

function validActiveDate(date: string) {
  return Boolean(date) && !isPastDate(date)
}

export const usePlansStore = defineStore('plans', {
  state: (): PlansState => ({ list: [], hydrated: false }),
  getters: {
    activePlan: (state) => state.list.find((plan) => plan.status === 'active'),
    backupPlans: (state) =>
      state.list
        .filter((plan) => plan.status === 'backup')
        .slice()
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    completedPlans: (state) =>
      state.list.filter((plan) => plan.status === 'completed').slice().sort(sortCompleted),
    totalCount: (state) => state.list.length,
  },
  actions: {
    hydrate() {
      if (this.hydrated) return
      const stored = getStorage<Plan[]>(PLANS_STORAGE_KEY)
      if (stored?.length) {
        this.list = stored
      } else {
        const legacy = getStorage<LegacyPlan[]>(LEGACY_PLANS_STORAGE_KEY)
        this.list = legacy?.length ? migrateLegacyPlans(legacy) : createMockPlans()
      }
      this.hydrated = true
      this.persist()
    },
    persist() {
      setStorage(PLANS_STORAGE_KEY, this.list)
    },
    getById(id: string) {
      return this.list.find((plan) => plan.id === id)
    },
    createActive(payload: { date: string; note?: string }): PlanMutationResult {
      if (this.activePlan) return { ok: false, reason: 'active_exists' }
      if (!validActiveDate(payload.date)) return { ok: false, reason: 'invalid_date' }
      const plan: Plan = {
        id: uid('plan'), title: '本次计划', status: 'active', date: payload.date,
        scenario: 'free', scenarioText: '自由安排', note: (payload.note || '').trim(),
        items: [], sourceBackupId: null, completedAt: null,
        createdAt: new Date().toISOString(), memoryPhotos: [],
      }
      this.list.push(plan)
      this.persist()
      return { ok: true, plan }
    },
    createBackup(payload: {
      title: string
      scenario: PlanScenario
      scenarioText: string
      note?: string
    }): PlanMutationResult {
      const plan: Plan = {
        id: uid('backup'), title: payload.title.trim() || '备用计划', status: 'backup', date: null,
        scenario: payload.scenario, scenarioText: payload.scenarioText.trim(), note: (payload.note || '').trim(),
        items: [], sourceBackupId: null, completedAt: null,
        createdAt: new Date().toISOString(), memoryPhotos: [],
      }
      this.list.push(plan)
      this.persist()
      return { ok: true, plan }
    },
    updatePlanMeta(planId: string, payload: {
      title: string
      scenario: PlanScenario
      scenarioText: string
      note: string
    }) {
      const plan = this.getById(planId)
      if (!plan || plan.status === 'completed') return false
      plan.title = payload.title.trim() || plan.title
      plan.scenario = payload.scenario
      plan.scenarioText = payload.scenarioText.trim()
      plan.note = payload.note.trim()
      this.persist()
      return true
    },
    activateBackup(planId: string, date: string): PlanMutationResult {
      if (this.activePlan) return { ok: false, reason: 'active_exists' }
      if (!validActiveDate(date)) return { ok: false, reason: 'invalid_date' }
      const source = this.getById(planId)
      if (!source) return { ok: false, reason: 'not_found' }
      if (source.status !== 'backup') return { ok: false, reason: 'invalid_status' }
      const plan: Plan = {
        ...source,
        id: uid('plan'),
        status: 'active',
        date,
        items: cloneItems(source.items),
        sourceBackupId: source.id,
        completedAt: null,
        createdAt: new Date().toISOString(),
        memoryPhotos: [],
      }
      this.list.push(plan)
      this.persist()
      return { ok: true, plan }
    },
    replanCompleted(planId: string, date: string): PlanMutationResult {
      if (this.activePlan) return { ok: false, reason: 'active_exists' }
      if (!validActiveDate(date)) return { ok: false, reason: 'invalid_date' }
      const source = this.getById(planId)
      if (!source) return { ok: false, reason: 'not_found' }
      if (source.status !== 'completed') return { ok: false, reason: 'invalid_status' }
      const plan: Plan = {
        ...source,
        id: uid('plan'),
        status: 'active',
        date,
        items: cloneItems(source.items),
        completedAt: null,
        createdAt: new Date().toISOString(),
        memoryPhotos: [],
      }
      this.list.push(plan)
      this.persist()
      return { ok: true, plan }
    },
    completeActive(planId: string): PlanMutationResult {
      const plan = this.getById(planId)
      if (!plan) return { ok: false, reason: 'not_found' }
      if (plan.status !== 'active' || !plan.date) return { ok: false, reason: 'invalid_status' }
      plan.status = 'completed'
      plan.completedAt = new Date().toISOString()
      this.persist()
      return { ok: true, plan }
    },
    deletePlan(planId: string) {
      const index = this.list.findIndex((plan) => plan.id === planId && plan.status !== 'completed')
      if (index < 0) return false
      this.list.splice(index, 1)
      this.persist()
      return true
    },
    updatePlanNote(planId: string, note: string) {
      const plan = this.getById(planId)
      if (!plan || plan.status === 'completed') return false
      plan.note = note.trim()
      this.persist()
      return true
    },
    addItemToPlan(planId: string, payload: {
      type: PlanItemType
      sourceId: string
      title: string
      image: string
      period: PlanPeriod
      note?: string
    }) {
      const plan = this.getById(planId)
      if (!plan) return { ok: false as const, reason: 'not_found' as const }
      if (plan.status === 'completed') return { ok: false as const, reason: 'readonly' as const }
      if (plan.items.some((item) => item.sourceId === payload.sourceId)) {
        return { ok: false as const, reason: 'duplicate' as const }
      }
      const peers = plan.items.filter((item) => item.period === payload.period)
      const item: PlanItem = {
        id: uid('pi'), type: payload.type, sourceId: payload.sourceId, title: payload.title,
        image: payload.image, period: payload.period, note: (payload.note || '').trim(),
        order: peers.length ? Math.max(...peers.map((peer) => peer.order)) + 1 : 0,
      }
      plan.items.push(item)
      this.persist()
      return { ok: true as const, item, plan }
    },
    updateItemPeriod(planId: string, itemId: string, period: PlanPeriod) {
      const plan = this.getById(planId)
      if (!plan || plan.status === 'completed') return false
      const item = plan.items.find((candidate) => candidate.id === itemId)
      if (!item) return false
      item.period = period
      const peers = plan.items.filter((candidate) => candidate.period === period && candidate.id !== itemId)
      item.order = peers.length ? Math.max(...peers.map((peer) => peer.order)) + 1 : 0
      this.persist()
      return true
    },
    updateItemNote(planId: string, itemId: string, note: string) {
      const plan = this.getById(planId)
      if (!plan || plan.status === 'completed') return false
      const item = plan.items.find((candidate) => candidate.id === itemId)
      if (!item) return false
      item.note = note.trim()
      this.persist()
      return true
    },
    replaceItemSource(planId: string, itemId: string, payload: {
      type: PlanItemType
      sourceId: string
      title: string
      image: string
    }) {
      const plan = this.getById(planId)
      if (!plan || plan.status === 'completed') return { ok: false as const, reason: 'invalid' as const }
      const item = plan.items.find((candidate) => candidate.id === itemId)
      if (!item) return { ok: false as const, reason: 'not_found' as const }
      if (plan.items.some((candidate) => candidate.id !== itemId && candidate.sourceId === payload.sourceId)) {
        return { ok: false as const, reason: 'duplicate' as const }
      }
      Object.assign(item, payload)
      this.persist()
      return { ok: true as const }
    },
    removeItem(planId: string, itemId: string) {
      const plan = this.getById(planId)
      if (!plan || plan.status === 'completed') return false
      const index = plan.items.findIndex((item) => item.id === itemId)
      if (index < 0) return false
      plan.items.splice(index, 1)
      this.persist()
      return true
    },
    reorderItemInPeriod(planId: string, itemId: string, direction: 'up' | 'down') {
      const plan = this.getById(planId)
      if (!plan || plan.status === 'completed') return false
      const item = plan.items.find((candidate) => candidate.id === itemId)
      if (!item) return false
      const peers = plan.items.filter((candidate) => candidate.period === item.period).slice().sort((a, b) => a.order - b.order)
      const index = peers.findIndex((candidate) => candidate.id === itemId)
      const target = direction === 'up' ? index - 1 : index + 1
      if (index < 0 || target < 0 || target >= peers.length) return false
      const order = peers[index].order
      peers[index].order = peers[target].order
      peers[target].order = order
      this.persist()
      return true
    },
    itemsByPeriod(planId: string, period: PlanPeriod) {
      const plan = this.getById(planId)
      if (!plan) return []
      return plan.items.filter((item) => item.period === period).slice().sort((a, b) => a.order - b.order)
    },
    periodSummaries(plan: Plan) {
      return PERIOD_ORDER.map((period) => ({
        period,
        items: plan.items.filter((item) => item.period === period).slice().sort((a, b) => a.order - b.order),
      })).filter((group) => group.items.length > 0)
    },
  },
})
