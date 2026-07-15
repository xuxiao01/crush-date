import { defineStore } from 'pinia'
import type { AppState } from '@/types/common'

export const useAppStore = defineStore('app', {
  state: (): AppState => ({
    count: 0,
    initialized: false,
  }),
  actions: {
    increment() {
      this.count += 1
    },
    resetCount() {
      this.count = 0
    },
    setInitialized(value: boolean) {
      this.initialized = value
    },
  },
})
