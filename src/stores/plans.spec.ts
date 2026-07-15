import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { migrateLegacyPlans, usePlansStore } from '@/stores/plans'
import { toPlanDateString } from '@/utils/planDate'

const storage = new Map<string, unknown>()

beforeEach(() => {
  storage.clear()
  vi.stubGlobal('uni', {
    getStorageSync: vi.fn((key: string) => storage.get(key) ?? ''),
    setStorageSync: vi.fn((key: string, value: unknown) => storage.set(key, value)),
    removeStorageSync: vi.fn((key: string) => storage.delete(key)),
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
    expect(migrated.find((plan) => plan.id === 'later')).toMatchObject({ status: 'backup', date: null })
    expect(migrated.find((plan) => plan.id === 'past-upcoming')).toMatchObject({ status: 'backup', date: null })
    expect(migrated.find((plan) => plan.id === 'done')?.completedAt).toBeTruthy()
  })
})

describe('plan domain rules', () => {
  it('allows only one active plan and rejects past dates', () => {
    const store = usePlansStore()
    const today = toPlanDateString()
    expect(store.createActive({ date: '2000-01-01' })).toMatchObject({ ok: false, reason: 'invalid_date' })
    expect(store.createActive({ date: today }).ok).toBe(true)
    expect(store.createActive({ date: today })).toMatchObject({ ok: false, reason: 'active_exists' })
  })

  it('copies a backup deeply and keeps the template unchanged', () => {
    const store = usePlansStore()
    const backupResult = store.createBackup({ title: '下雨方案', scenario: 'rainy', scenarioText: '下雨 · 室内' })
    expect(backupResult.ok).toBe(true)
    if (!backupResult.ok) return
    store.addItemToPlan(backupResult.plan.id, { type: 'place', sourceId: 'place-1', title: '咖啡馆', image: '/coffee.jpg', period: 'afternoon', note: '靠窗坐' })

    const activeResult = store.activateBackup(backupResult.plan.id, toPlanDateString())
    expect(activeResult.ok).toBe(true)
    if (!activeResult.ok) return
    expect(activeResult.plan.sourceBackupId).toBe(backupResult.plan.id)
    expect(activeResult.plan.items[0].id).not.toBe(backupResult.plan.items[0].id)

    store.updateItemNote(activeResult.plan.id, activeResult.plan.items[0].id, '新备注')
    expect(backupResult.plan.items[0].note).toBe('靠窗坐')
  })

  it('completes active plans and keeps completed plans read-only', () => {
    const store = usePlansStore()
    const created = store.createActive({ date: toPlanDateString() })
    expect(created.ok).toBe(true)
    if (!created.ok) return
    const completed = store.completeActive(created.plan.id)
    expect(completed.ok).toBe(true)
    expect(created.plan.status).toBe('completed')
    expect(created.plan.completedAt).toBeTruthy()
    expect(store.addItemToPlan(created.plan.id, { type: 'food', sourceId: 'food-1', title: '火锅', image: '/food.jpg', period: 'evening' })).toMatchObject({ ok: false, reason: 'readonly' })
    expect(store.deletePlan(created.plan.id)).toBe(false)
  })

  it('replans completed content without changing the original record', () => {
    const store = usePlansStore()
    const created = store.createActive({ date: toPlanDateString(), note: '原来的备注' })
    if (!created.ok) return
    store.addItemToPlan(created.plan.id, { type: 'place', sourceId: 'place-memory', title: '公园', image: '/park.jpg', period: 'afternoon' })
    const completed = store.completeActive(created.plan.id)
    if (!completed.ok) return

    const replanned = store.replanCompleted(completed.plan.id, toPlanDateString())
    expect(replanned.ok).toBe(true)
    if (!replanned.ok) return
    expect(completed.plan.status).toBe('completed')
    expect(replanned.plan.status).toBe('active')
    expect(replanned.plan.items[0].id).not.toBe(completed.plan.items[0].id)
  })

  it('prevents duplicates inside one plan but permits them across plans', () => {
    const store = usePlansStore()
    const first = store.createBackup({ title: 'A', scenario: 'free', scenarioText: '自由' })
    const second = store.createBackup({ title: 'B', scenario: 'free', scenarioText: '自由' })
    if (!first.ok || !second.ok) return
    const item = { type: 'place' as const, sourceId: 'same', title: '公园', image: '/park.jpg', period: 'morning' as const }
    expect(store.addItemToPlan(first.plan.id, item).ok).toBe(true)
    expect(store.addItemToPlan(first.plan.id, item)).toMatchObject({ ok: false, reason: 'duplicate' })
    const secondItem = { ...item, sourceId: 'another', title: '美术馆' }
    expect(store.addItemToPlan(first.plan.id, secondItem)).toMatchObject({ ok: true, item: { order: 1 } })
    expect(store.addItemToPlan(second.plan.id, item).ok).toBe(true)
  })
})
