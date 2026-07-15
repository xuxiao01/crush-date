<script setup lang="ts">
import { getCurrentInstance, nextTick, onUnmounted, ref, watch } from 'vue'
import inviteBackground from '@/assets/invite-background.jpg'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const instance = getCurrentInstance()
const nopeLeft = ref(0)
const nopeTop = ref(0)
const nopeReady = ref(false)
let tabBarHidden = false

const PAD = 24

function close() {
  emit('update:modelValue', false)
}

function agree() {
  close()
  uni.showToast({
    title: '好耶！这就去看看～',
    icon: 'none',
  })
}

function measureAndPlace(random: boolean) {
  nextTick(() => {
    const query = uni.createSelectorQuery().in(instance?.proxy as any)
    query.select('.invite-mask').boundingClientRect()
    query.select('.invite-nope').boundingClientRect()
    query.select('.invite-card').boundingClientRect()
    query.exec((res) => {
      const mask = res?.[0] as UniApp.NodeInfo | undefined
      const nope = res?.[1] as UniApp.NodeInfo | undefined
      const card = res?.[2] as UniApp.NodeInfo | undefined
      if (!mask?.width || !nope?.width || !nope?.height) return

      const maxLeft = Math.max(PAD, (mask.width || 0) - (nope.width || 0) - PAD)
      const maxTop = Math.max(PAD, (mask.height || 0) - (nope.height || 0) - PAD)

      if (!random && card?.width != null && card.top != null && mask.top != null) {
        nopeLeft.value = Math.max(
          PAD,
          Math.min(maxLeft, (card.left || 0) - (mask.left || 0) + ((card.width || 0) - (nope.width || 0)) / 2),
        )
        nopeTop.value = Math.max(
          PAD,
          Math.min(maxTop, (card.top || 0) - (mask.top || 0) + (card.height || 0) + 28),
        )
      } else {
        nopeLeft.value = PAD + Math.random() * (maxLeft - PAD)
        nopeTop.value = PAD + Math.random() * (maxTop - PAD)
      }
      nopeReady.value = true
    })
  })
}

function runAway() {
  measureAndPlace(true)
}

function hidePageTabBar() {
  if (tabBarHidden) return

  tabBarHidden = true
  uni.hideTabBar({
    animation: false,
    fail: () => {
      tabBarHidden = false
    },
  })
}

function restorePageTabBar() {
  if (!tabBarHidden) return

  tabBarHidden = false
  uni.showTabBar({
    animation: false,
  })
}

watch(
  () => props.modelValue,
  (open) => {
    if (!open) {
      nopeReady.value = false
      restorePageTabBar()
      return
    }
    hidePageTabBar()
    measureAndPlace(false)
  },
  { immediate: true },
)

onUnmounted(() => {
  restorePageTabBar()
})
</script>

<template>
  <view v-if="modelValue" class="invite-mask" @tap.stop>
    <image
      class="invite-mask__background"
      :src="inviteBackground"
      mode="aspectFill"
      :draggable="false"
    />

    <view class="invite-card" @tap.stop>
      <text class="invite-card__title">周末想跟我一块出去玩吗</text>
      <text class="invite-card__hint">强烈推荐点同意哈哈哈！</text>
      <view class="invite-yes" hover-class="invite-yes--hover" :hover-stay-time="100" @tap="agree">
        <text class="invite-yes__text">同意</text>
      </view>
    </view>

    <view
      class="invite-nope"
      :class="{ 'invite-nope--ready': nopeReady }"
      :style="{ left: `${nopeLeft}px`, top: `${nopeTop}px` }"
      @tap.stop="runAway"
    >
      <text class="invite-nope__text">不同意</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.invite-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  background: #493832;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48rpx;
  box-sizing: border-box;
}

.invite-mask__background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  opacity: 0.62;
  pointer-events: none;
}

.invite-card {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 620rpx;
  padding: 48rpx 36rpx 40rpx;
  border-radius: 32rpx;
  background: #fffaf6;
  border: 2rpx solid #ffe8d8;
  box-shadow: 0 24rpx 48rpx rgba(80, 40, 20, 0.18);
  display: flex;
  flex-direction: column;
  align-items: stretch;
  box-sizing: border-box;
  animation: invite-pop 280ms cubic-bezier(0.22, 1, 0.36, 1);
}

@keyframes invite-pop {
  from {
    opacity: 0;
    transform: scale(0.88) translateY(24rpx);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.invite-card__title {
  font-size: 44rpx;
  font-weight: 700;
  color: #2f2f2f;
  line-height: 1.35;
  text-align: center;
}

.invite-card__hint {
  margin-top: 16rpx;
  margin-bottom: 40rpx;
  font-size: 26rpx;
  color: #b5a49a;
  text-align: center;
  line-height: 1.4;
}

.invite-yes {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 108rpx;
  border-radius: 28rpx;
  background: #ff8a55;
  box-shadow: 0 12rpx 28rpx rgba(255, 138, 85, 0.35);
  transition: transform 160ms ease;
}

.invite-yes--hover {
  transform: scale(0.97);
}

.invite-yes__text {
  font-size: 40rpx;
  font-weight: 700;
  color: #fff;
  letter-spacing: 4rpx;
}

.invite-nope {
  position: absolute;
  z-index: 2;
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(255, 250, 246, 0.94);
  border: 1rpx solid rgba(111, 92, 82, 0.18);
  box-shadow: 0 8rpx 22rpx rgba(32, 24, 20, 0.24);
  opacity: 0;
  transition: left 120ms ease, top 120ms ease, opacity 160ms ease;
}

.invite-nope--ready {
  opacity: 1;
}

.invite-nope__text {
  font-size: 20rpx;
  font-weight: 500;
  color: #6f5c52;
  line-height: 1.2;
}
</style>
