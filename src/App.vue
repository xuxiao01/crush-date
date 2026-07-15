<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app'
import { useAppStore } from '@/stores/app'

onLaunch(() => {
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
