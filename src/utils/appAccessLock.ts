import { getStorage, setStorage } from '@/utils/storage'

export const APP_ACCESS_PASSWORD = '12100308'
export const APP_ACCESS_STORAGE_KEY = 'crush_date_app_unlocked_v1'

export function normalizeAccessPassword(value: string): string {
  return value.replace(/\D/g, '').slice(0, APP_ACCESS_PASSWORD.length)
}

export function verifyAccessPassword(value: string): boolean {
  return normalizeAccessPassword(value) === APP_ACCESS_PASSWORD
}

export function isAppUnlocked(): boolean {
  return getStorage<boolean>(APP_ACCESS_STORAGE_KEY) === true
}

export function markAppUnlocked(): void {
  setStorage(APP_ACCESS_STORAGE_KEY, true)
}
