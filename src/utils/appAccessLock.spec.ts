import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  APP_ACCESS_PASSWORD,
  APP_ACCESS_STORAGE_KEY,
  isAppUnlocked,
  markAppUnlocked,
  normalizeAccessPassword,
  verifyAccessPassword,
} from '@/utils/appAccessLock'

describe('app access lock', () => {
  const storage = new Map<string, unknown>()

  beforeEach(() => {
    storage.clear()
    vi.stubGlobal('uni', {
      getStorageSync: (key: string) => storage.get(key) ?? '',
      setStorageSync: (key: string, value: unknown) => storage.set(key, value),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('normalizes input to eight digits', () => {
    expect(normalizeAccessPassword(' 12a1003089 ')).toBe(APP_ACCESS_PASSWORD)
  })

  it('accepts only the configured password', () => {
    expect(verifyAccessPassword(APP_ACCESS_PASSWORD)).toBe(true)
    expect(verifyAccessPassword('12100307')).toBe(false)
    expect(verifyAccessPassword('1210030')).toBe(false)
  })

  it('persists the unlocked state without persisting the password', () => {
    expect(isAppUnlocked()).toBe(false)
    markAppUnlocked()
    expect(isAppUnlocked()).toBe(true)
    expect(storage.get(APP_ACCESS_STORAGE_KEY)).toBe(true)
    expect(storage.has(APP_ACCESS_PASSWORD)).toBe(false)
  })
})
