import { ref, watch, type Ref } from 'vue'
import { adjacentImageIndexes } from '@/utils/imageLoading'

export function useAdjacentImages(current: Ref<number>, total: number, ready = ref(true)) {
  const mountedImages = ref(new Set<number>())
  watch(
    [current, ready],
    ([index, enabled]) => {
      if (!enabled) return
      mountedImages.value = new Set([...mountedImages.value, ...adjacentImageIndexes(index, total)])
    },
    { immediate: true, flush: 'sync' },
  )
  return mountedImages
}
