<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app'
import { useAppStore } from '@/stores/app'
import { isAppUnlocked } from '@/utils/appAccessLock'

const LOCK_PAGE_URL = '/pages/lock/index'

function isLockPage(url: string): boolean {
  return url.split('?')[0] === LOCK_PAGE_URL
}

function registerAccessRouteGuards() {
  const guard = {
    invoke(options: { url: string }) {
      if (isAppUnlocked() || isLockPage(options.url)) return options
      uni.reLaunch({ url: LOCK_PAGE_URL })
      return false
    },
  }

  uni.addInterceptor('navigateTo', guard)
  uni.addInterceptor('redirectTo', guard)
  uni.addInterceptor('reLaunch', guard)
  uni.addInterceptor('switchTab', guard)
}

onLaunch(() => {
  registerAccessRouteGuards()
  const appStore = useAppStore()
  appStore.setInitialized(true)
})
</script>

<style lang="scss">
@import '@/styles/global.scss';

:root,
page {
  --wot-color-theme: #ff8f70;
}
</style>
