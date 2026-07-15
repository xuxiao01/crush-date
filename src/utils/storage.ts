export function setStorage<T>(key: string, value: T): void {
  try {
    uni.setStorageSync(key, value)
  } catch (error) {
    console.warn(`[storage] setStorage failed: ${key}`, error)
  }
}

export function getStorage<T>(key: string): T | null {
  try {
    const value = uni.getStorageSync(key)
    return value === '' || value === undefined ? null : (value as T)
  } catch (error) {
    console.warn(`[storage] getStorage failed: ${key}`, error)
    return null
  }
}

export function removeStorage(key: string): void {
  try {
    uni.removeStorageSync(key)
  } catch (error) {
    console.warn(`[storage] removeStorage failed: ${key}`, error)
  }
}
