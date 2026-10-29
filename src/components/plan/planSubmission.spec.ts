import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { describe, expect, it, vi } from 'vitest'
import * as vue from 'vue'
import ts from 'typescript'
import * as planTypes from '@/types/plan'

// Compile the real setup scripts without mounting platform-specific uni-app elements.
const require = createRequire(import.meta.url)
const { parse, compileScript } = require('vue/compiler-sfc')

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

const plan = { id: 'backup-1', title: '周末', status: 'backup' }
function makeStore() {
  return {
    backupPlans: [],
    activePlan: undefined,
    hydrate: vi.fn().mockResolvedValue(true),
    createBackup: vi.fn().mockResolvedValue({ ok: true, plan }),
    updatePlanMeta: vi.fn().mockResolvedValue(true),
    getById: vi.fn().mockReturnValue(plan),
    addItemToPlan: vi.fn().mockResolvedValue({ ok: true }),
  }
}

interface SetupState {
  submit: () => Promise<void>
  close: () => void
  submitting: vue.Ref<boolean>
  title: vue.Ref<string>
  backupTitle: vue.Ref<string>
  mode: vue.Ref<string>
  selectedBackupId: vue.Ref<string>
}

function setupSheet(name: string, store: ReturnType<typeof makeStore>, props = {}) {
  const filename = new URL(`./${name}.vue`, import.meta.url)
  const { descriptor } = parse(readFileSync(filename, 'utf8'))
  const script = compileScript(descriptor, { id: name })
  const code = ts.transpileModule(script.content, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText
  const module = {
    exports: {} as { default?: { setup: (props: object, context: object) => unknown } },
  }
  const imports = (id: string) => {
    if (id === 'vue') return { ...vue, onUnmounted: () => {} }
    if (id === '@/stores/plans') return { usePlansStore: () => store }
    if (id === '@/types/plan') return planTypes
    if (id.endsWith('.vue')) return {}
    throw new Error(`Unexpected import: ${id}`)
  }
  new Function('require', 'exports', code)(imports, module.exports)
  const emit = vi.fn()
  const scope = vue.effectScope()
  const state = scope.run(() =>
    module.exports.default!.setup(
      { modelValue: true, ...props },
      {
        emit,
        expose: () => {},
      },
    ),
  ) as SetupState
  return { state, emit, stop: () => scope.stop() }
}

vi.stubGlobal('uni', { showToast: vi.fn() })

describe('计划弹窗提交', () => {
  it.each(['create', 'edit'])('备用计划 %s 慢请求时只提交一次并禁止关闭', async (mode) => {
    const store = makeStore()
    const pending = deferred<unknown>()
    const action = mode === 'edit' ? store.updatePlanMeta : store.createBackup
    action.mockReturnValueOnce(pending.promise)
    const { state, emit, stop } = setupSheet(
      'BackupPlanSheet',
      store,
      mode === 'edit' ? { plan } : {},
    )
    state.title.value = '周末'
    const first = state.submit()
    await state.submit()
    state.close()
    expect(action).toHaveBeenCalledTimes(1)
    expect(state.submitting.value).toBe(true)
    expect(emit).not.toHaveBeenCalled()
    pending.resolve(mode === 'edit' ? true : { ok: true, plan })
    await first
    expect(emit.mock.calls).toEqual([
      ['update:modelValue', false],
      ['saved', plan.id],
    ])
    expect(state.submitting.value).toBe(false)
    stop()
  })

  it('失败后保留输入并解锁重试', async () => {
    const store = makeStore()
    store.createBackup.mockRejectedValueOnce(new Error('network'))
    const { state, emit, stop } = setupSheet('BackupPlanSheet', store)
    state.title.value = '周末'
    await state.submit()
    expect(state.submitting.value).toBe(false)
    expect(state.title.value).toBe('周末')
    expect(emit).not.toHaveBeenCalled()
    await state.submit()
    expect(store.createBackup).toHaveBeenCalledTimes(2)
    expect(emit).toHaveBeenCalledWith('saved', plan.id)
    stop()
  })

  it('创建和添加安排全过程防连点，添加失败后重试复用计划', async () => {
    const store = makeStore()
    const creating = deferred<unknown>()
    const adding = deferred<unknown>()
    store.createBackup.mockReturnValueOnce(creating.promise)
    store.addItemToPlan.mockReturnValueOnce(adding.promise)
    const { state, emit, stop } = setupSheet('AddPlanSheet', store)
    state.mode.value = 'new-backup'
    state.backupTitle.value = '周末'
    const first = state.submit()
    await state.submit()
    expect(store.createBackup).toHaveBeenCalledTimes(1)
    creating.resolve({ ok: true, plan })
    await vi.waitFor(() => expect(store.addItemToPlan).toHaveBeenCalledTimes(1))
    await state.submit()
    state.close()
    expect(store.addItemToPlan).toHaveBeenCalledTimes(1)
    expect(state.submitting.value).toBe(true)
    expect(emit).not.toHaveBeenCalled()
    adding.resolve({ ok: false, reason: 'request_failed' })
    await first
    expect(state.submitting.value).toBe(false)
    expect(state.selectedBackupId.value).toBe(plan.id)
    await state.submit()
    expect(store.createBackup).toHaveBeenCalledTimes(1)
    expect(store.addItemToPlan).toHaveBeenCalledTimes(2)
    expect(emit.mock.calls).toEqual([
      ['update:modelValue', false],
      ['success', { planId: plan.id, planStatus: plan.status, label: plan.title }],
    ])
    stop()
  })
})
