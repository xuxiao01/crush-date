import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as vue from 'vue'
import ts from 'typescript'
import type { Plan } from '@/types/plan'
import * as calendar from '@/utils/planCalendar'
import * as planDate from '@/utils/planDate'

const require = createRequire(import.meta.url)
const { parse, compileScript } = require('vue/compiler-sfc')
const { descriptor } = parse(
  readFileSync(new URL('./PastPlanCalendar.vue', import.meta.url), 'utf8'),
)
const compiled = compileScript(descriptor, { id: 'past-calendar-test' })
const code = ts.transpileModule(compiled.content, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText

interface State {
  cursor: vue.Ref<string>
  showPlans: vue.Ref<boolean>
  pickDate: (date?: string) => void
  moveMonth: (offset: number) => void
  openMenu: (date: string | null) => void
  closeMenu: () => void
  afterClosed: () => void
  selectPlan: (event: { item: { id: string } }) => void
}
type TabBarCallbacks = { success: () => void; complete: () => void }
const hideTabBar = vi.fn<[TabBarCallbacks], void>()
const showTabBar = vi.fn()
const cleanups: Array<() => void> = []

function plan(id: string, date: string | null): Plan {
  return {
    id,
    date,
    title: id,
    status: 'completed',
    scenario: 'free',
    scenarioText: '',
    note: '',
    items: [],
    sourceBackupId: null,
    completedAt: '2026-10-25T00:00:00Z',
    createdAt: '2026-10-01T00:00:00Z',
    memoryPhotos: [],
  }
}

function setup(plans: Plan[]) {
  const lifecycle = { hide: () => {}, show: () => {}, unmount: () => {} }
  const imports = (id: string) => {
    if (id === 'vue')
      return {
        ...vue,
        onUnmounted: (fn: () => void) => {
          lifecycle.unmount = fn
        },
      }
    if (id === '@dcloudio/uni-app')
      return {
        onHide: (fn: () => void) => {
          lifecycle.hide = fn
        },
        onShow: (fn: () => void) => {
          lifecycle.show = fn
        },
      }
    if (id === '@/utils/planCalendar') return calendar
    if (id === '@/utils/planDate') return planDate
    throw new Error(`Unexpected import: ${id}`)
  }
  const module = {
    exports: {} as { default?: { setup: (props: object, context: object) => State } },
  }
  new Function('require', 'exports', code)(imports, module.exports)
  const props = vue.reactive({ plans })
  const emit = vi.fn()
  const scope = vue.effectScope()
  const state = scope.run(() => module.exports.default!.setup(props, { emit, expose: () => {} }))!
  const destroy = () => {
    lifecycle.unmount()
    scope.stop()
  }
  cleanups.push(destroy)
  return { props, emit, state, lifecycle, destroy }
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-30T00:00:00Z'))
  hideTabBar.mockReset().mockImplementation((options) => {
    options.success()
    options.complete()
  })
  showTabBar.mockReset()
  vi.stubGlobal('uni', { hideTabBar, showTabBar })
})
afterEach(() => {
  cleanups.splice(0).forEach((cleanup) => cleanup())
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('past calendar interaction', () => {
  it('initializes after async data, preserves the chosen month and clamps after deletion', async () => {
    const { state, props } = setup([])
    expect(state.cursor.value).toBe('2026-10')
    props.plans = [plan('july', '2026-07-19'), plan('october', '2026-10-01')]
    await vue.nextTick()
    expect(state.cursor.value).toBe('2026-10')
    state.moveMonth(-1)
    expect(state.cursor.value).toBe('2026-09')
    props.plans = [...props.plans, plan('new', '2026-11-01')]
    await vue.nextTick()
    expect(state.cursor.value).toBe('2026-09')
    props.plans = [plan('july', '2026-07-19')]
    await vue.nextTick()
    expect(state.cursor.value).toBe('2026-07')
    state.moveMonth(-1)
    expect(state.cursor.value).toBe('2026-07')
    props.plans = []
    await vue.nextTick()
    expect(state.cursor.value).toBe('2026-10')
  })

  it('opens a single plan directly and ignores empty dates and blank cells', () => {
    const { state, emit } = setup([plan('holiday', '2026-10-01')])
    state.pickDate()
    state.pickDate('2026-10-02')
    expect(emit).not.toHaveBeenCalled()
    state.pickDate('2026-10-01')
    expect(emit).toHaveBeenCalledWith('select', 'holiday')
    expect(hideTabBar).not.toHaveBeenCalled()
  })

  it('shows same-day choices, cancels without navigating and restores only after closing', () => {
    const { state, emit } = setup([plan('first', '2026-10-01'), plan('second', '2026-10-01')])
    state.pickDate('2026-10-01')
    expect(state.showPlans.value).toBe(true)
    expect(hideTabBar).toHaveBeenCalledTimes(1)
    state.closeMenu()
    expect(emit).not.toHaveBeenCalled()
    expect(showTabBar).not.toHaveBeenCalled()
    state.afterClosed()
    expect(showTabBar).toHaveBeenCalledTimes(1)
    state.pickDate('2026-10-01')
    state.selectPlan({ item: { id: 'second' } })
    expect(emit).toHaveBeenCalledWith('select', 'second')
  })

  it('retains undated records and closes a menu if its records are deleted', async () => {
    const { state, props, emit } = setup([plan('undated', null)])
    state.openMenu(null)
    expect(state.showPlans.value).toBe(true)
    state.selectPlan({ item: { id: 'missing' } })
    expect(emit).not.toHaveBeenCalled()
    props.plans = []
    await vue.nextTick()
    expect(state.showPlans.value).toBe(false)
    state.afterClosed()
    expect(showTabBar).toHaveBeenCalledTimes(1)
  })

  it('restores the bar when navigating away and rejects late hide callbacks after unmount', () => {
    const first = setup([plan('a', null)])
    first.state.openMenu(null)
    first.lifecycle.hide()
    expect(first.state.showPlans.value).toBe(false)
    expect(showTabBar).toHaveBeenCalledTimes(1)
    let pending!: TabBarCallbacks
    hideTabBar.mockImplementationOnce((options) => {
      pending = options
    })
    const second = setup([plan('b', null)])
    second.state.openMenu(null)
    second.destroy()
    pending.success()
    pending.complete()
    expect(second.state.showPlans.value).toBe(false)
    expect(showTabBar).toHaveBeenCalledTimes(2)
  })
})
