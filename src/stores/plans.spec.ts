import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { completePlan, createPlan, getPlans, updatePlan } from '@/api/plans'
import { migrateLegacyPlans, usePlansStore } from '@/stores/plans'
import type { Plan } from '@/types/plan'
import { toPlanDateString } from '@/utils/planDate'

vi.mock('@/api/plans', () => ({
  activatePlan: vi.fn(),
  completePlan: vi.fn(),
  createPlan: vi.fn(),
  deletePlan: vi.fn(),
  getPlans: vi.fn(),
  replan: vi.fn(),
  toPlanItemInput: (item: Plan['items'][number]) => ({
    id: item.id,
    type: item.type,
    sourceId: item.sourceId,
    period: item.period,
    note: item.note,
    order: item.order,
  }),
  updatePlan: vi.fn(),
}))

function makePlan(overrides: Partial<Plan> = {}): Plan {
  return {
    id: 'plan-1',
    title: '本次计划',
    status: 'active',
    date: toPlanDateString(),
    scenario: 'free',
    scenarioText: '自由安排',
    note: '',
    items: [],
    sourceBackupId: null,
    completedAt: null,
    createdAt: '2026-07-15T00:00:00.000Z',
    updatedAt: '2026-07-15T00:00:00.000Z',
    memoryPhotos: [],
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getPlans).mockResolvedValue({
    activePlan: null,
    backupPlans: [],
    completedPlans: [],
  })
  setActivePinia(createPinia())
})

describe('plan storage migration', () => {
  it('keeps only the earliest non-past upcoming plan active', () => {
    const base = {
      title: '旧计划',
      note: '',
      items: [],
      createdAt: '2026-07-01T00:00:00.000Z',
    }
    const migrated = migrateLegacyPlans(
      [
        { ...base, id: 'past-upcoming', date: '2026-07-01', status: 'upcoming' as const },
        { ...base, id: 'later', date: '2026-07-20', status: 'upcoming' as const },
        { ...base, id: 'first', date: '2026-07-15', status: 'upcoming' as const },
        { ...base, id: 'done', date: '2026-07-02', status: 'completed' as const },
      ],
      '2026-07-10',
    )

    expect(migrated.find((plan) => plan.id === 'first')?.status).toBe('active')
    expect(migrated.filter((plan) => plan.status === 'active')).toHaveLength(1)
    expect(migrated.find((plan) => plan.id === 'later')).toMatchObject({
      status: 'backup',
      date: null,
    })
    expect(migrated.find((plan) => plan.id === 'done')?.completedAt).toBeTruthy()
  })
})

describe('plan API integration', () => {
  it('hydrates the three server-side plan groups', async () => {
    const active = makePlan()
    const backup = makePlan({ id: 'backup-1', status: 'backup', date: null })
    const completed = makePlan({
      id: 'completed-1',
      status: 'completed',
      completedAt: '2026-07-14T00:00:00.000Z',
    })
    vi.mocked(getPlans).mockResolvedValue({
      activePlan: active,
      backupPlans: [backup],
      completedPlans: [completed],
    })

    const store = usePlansStore()
    expect(await store.hydrate()).toBe(true)
    expect(store.activePlan?.id).toBe(active.id)
    expect(store.backupPlans[0]?.id).toBe(backup.id)
    expect(store.completedPlans[0]?.id).toBe(completed.id)
  })

  it('creates active plans through the backend and validates past dates locally', async () => {
    const store = usePlansStore()
    expect(await store.createActive({ date: '2000-01-01' })).toMatchObject({
      ok: false,
      reason: 'invalid_date',
    })
    expect(createPlan).not.toHaveBeenCalled()

    const created = makePlan()
    vi.mocked(createPlan).mockResolvedValue(created)
    expect(await store.createActive({ date: created.date || '' })).toEqual({
      ok: true,
      plan: created,
    })
    expect(store.activePlan).toEqual(created)
  })

  it('sends the complete items array and rejects duplicate sources', async () => {
    const backup = makePlan({ id: 'backup-1', status: 'backup', date: null })
    vi.mocked(getPlans).mockResolvedValue({
      activePlan: null,
      backupPlans: [backup],
      completedPlans: [],
    })
    const stored = makePlan({
      ...backup,
      items: [
        {
          id: 'item-1',
          type: 'place',
          sourceId: 'place-1',
          title: '公园',
          image: '/park.jpg',
          period: 'afternoon',
          note: '',
          order: 0,
        },
      ],
    })
    vi.mocked(updatePlan).mockResolvedValue(stored)

    const store = usePlansStore()
    await store.hydrate()
    expect(
      await store.addItemToPlan(backup.id, {
        type: 'place',
        sourceId: 'place-1',
        title: '公园',
        image: '/park.jpg',
        period: 'afternoon',
      }),
    ).toMatchObject({ ok: true, item: { id: 'item-1' } })
    expect(updatePlan).toHaveBeenCalledWith(
      backup.id,
      expect.objectContaining({ items: [expect.objectContaining({ sourceId: 'place-1' })] }),
    )
    expect(
      await store.addItemToPlan(backup.id, {
        type: 'place',
        sourceId: 'place-1',
        title: '公园',
        image: '/park.jpg',
        period: 'morning',
      }),
    ).toMatchObject({ ok: false, reason: 'duplicate' })
  })

  it('replaces the active plan with the completed response', async () => {
    const active = makePlan()
    const completed = makePlan({
      status: 'completed',
      completedAt: '2026-07-15T12:00:00.000Z',
    })
    vi.mocked(getPlans).mockResolvedValue({
      activePlan: active,
      backupPlans: [],
      completedPlans: [],
    })
    vi.mocked(completePlan).mockResolvedValue(completed)

    const store = usePlansStore()
    await store.hydrate()
    expect(await store.completeActive(active.id)).toEqual({ ok: true, plan: completed })
    expect(store.activePlan).toBeUndefined()
    expect(store.completedPlans[0]).toEqual(completed)
  })
})
