<script setup lang="ts">
import { getCurrentInstance, nextTick, onUnmounted, ref, watch } from 'vue'
import inviteBackground from '@/assets/invite-background.jpg'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  agreed: []
}>()

const instance = getCurrentInstance()
const nopeLeft = ref(0)
const nopeTop = ref(0)
const nopeReady = ref(false)
const rejectCount = ref(0)
const showBirthdayPrompt = ref(false)
const showRewardPrompt = ref(false)
const showRejectTip = ref(false)
const rejectMessage = ref('')
const birthday = ref('')
const birthdayError = ref('')
const rewardMessage = ref('')
const rewardName = ref('')
let tabBarHidden = false
let rejectTipTimer: ReturnType<typeof setTimeout> | undefined

const PAD = 24
const BIRTHDAY_LENGTH = 4
const REJECT_MESSAGES = [
  '不要啊！还真点呐哈哈哈！',
  '不是吧，你居然还点！再给你一次重新选择的机会～',
  '不同意按钮都跑这么远了，你怎么还追呀！',
  '都第四次了，还没发现正确答案是“同意”吗？',
  '你也太执着了吧！再点下去可要触发隐藏关卡啦！',
  '宝藏就在前方',
]

function close() {
  emit('update:modelValue', false)
}

function agree() {
  emit('agreed')
  close()
  uni.showToast({
    title: '好耶！这就去看看～',
    icon: 'none',
  })
}

function handleBirthdayInput(event: Event) {
  const inputEvent = event as Event & { detail?: { value?: string } }
  const value =
    inputEvent.detail?.value ?? (inputEvent.target as HTMLInputElement | null)?.value ?? ''
  birthday.value = value.replace(/\D/g, '').slice(0, BIRTHDAY_LENGTH)
  birthdayError.value = ''
}

function confirmBirthday() {
  if (birthday.value.length < BIRTHDAY_LENGTH) {
    birthdayError.value = '请输入 4 位生日'
    return
  }

  if (birthday.value === '1210') {
    rewardMessage.value =
      '2001年12月10日，我想，那一定是初冬里格外温暖的一天。那天有一场很轻的雨，而你的降临，也悄悄温暖了这个世界。\n\n在我眼中，你是一个温柔、乐观而善良的女孩。你像阳光一样明朗，始终热爱生活；你开朗却不失细腻，自立又保有柔软，对这个世界怀着好奇，也从未停止认真思考。\n\n或许冬天从来不只是寒冷——因为从你来到这个世界的那一天起，初冬便有了温度，也有了一个温柔的名字：'
    rewardName.value = '张洁雨。'
  } else if (birthday.value === '0308') {
    rewardMessage.value =
      '这么难藏的彩蛋都被你找到啦！真的太太太让我感动，一时竟有些语塞。\n\n希望你未来的每一天，都能明亮、自在、开开心心。也要感谢那个当初勇敢主动的自己！！！'
    rewardName.value = ''
  } else {
    birthday.value = ''
    birthdayError.value = '不对哦，请重试～'
    return
  }

  showBirthdayPrompt.value = false
  showRewardPrompt.value = true
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
          Math.min(
            maxLeft,
            (card.left || 0) - (mask.left || 0) + ((card.width || 0) - (nope.width || 0)) / 2,
          ),
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
  rejectCount.value += 1
  const message = REJECT_MESSAGES[rejectCount.value - 1]
  if (message) {
    rejectMessage.value = message
    showRejectTip.value = true
    clearTimeout(rejectTipTimer)
    rejectTipTimer = setTimeout(() => {
      showRejectTip.value = false
    }, 1800)
  }

  if (rejectCount.value === 7) {
    nopeReady.value = false
    showBirthdayPrompt.value = true
    return
  }

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
    rejectCount.value = 0
    showBirthdayPrompt.value = false
    showRewardPrompt.value = false
    showRejectTip.value = false
    rejectMessage.value = ''
    clearTimeout(rejectTipTimer)
    birthday.value = ''
    birthdayError.value = ''
    rewardMessage.value = ''
    rewardName.value = ''
    hidePageTabBar()
    measureAndPlace(false)
  },
  { immediate: true },
)

onUnmounted(() => {
  clearTimeout(rejectTipTimer)
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

    <view v-if="!showBirthdayPrompt && !showRewardPrompt" class="invite-card" @tap.stop>
      <text class="invite-card__title">周日想跟我一块出去玩吗</text>
      <text class="invite-card__hint">你看同意按钮那么大，不同意按钮那么小，肯定得点同意吧！</text>
      <view class="invite-yes" hover-class="invite-yes--hover" :hover-stay-time="100" @tap="agree">
        <text class="invite-yes__text">同意</text>
      </view>
    </view>

    <view
      v-if="!showBirthdayPrompt && !showRewardPrompt"
      class="invite-nope"
      :class="{ 'invite-nope--ready': nopeReady }"
      :style="{ left: `${nopeLeft}px`, top: `${nopeTop}px` }"
      @tap.stop="runAway"
    >
      <text class="invite-nope__text">不同意</text>
    </view>

    <view v-if="showRejectTip" class="reject-tip" @tap.stop>
      <text class="reject-tip__text">{{ rejectMessage }}</text>
    </view>

    <view v-if="showBirthdayPrompt" class="birthday-card" @tap.stop>
      <text class="birthday-card__title">提示：生日</text>

      <view class="birthday-input" @tap.stop>
        <view
          v-for="index in BIRTHDAY_LENGTH"
          :key="index"
          class="birthday-input__cell"
          :class="{ 'birthday-input__cell--active': birthday.length === index - 1 }"
        >
          <text class="birthday-input__digit">{{ birthday[index - 1] || '' }}</text>
          <view
            v-if="birthday.length === index - 1 && birthday.length < BIRTHDAY_LENGTH"
            class="birthday-input__caret"
          />
        </view>
        <input
          class="birthday-input__control"
          type="number"
          inputmode="numeric"
          :maxlength="BIRTHDAY_LENGTH"
          :value="birthday"
          :focus="showBirthdayPrompt"
          @input="handleBirthdayInput"
          @confirm="confirmBirthday"
        />
      </view>

      <text class="birthday-card__error">{{ birthdayError }}</text>

      <view
        class="birthday-confirm"
        :class="{ 'birthday-confirm--disabled': birthday.length < BIRTHDAY_LENGTH }"
        hover-class="birthday-confirm--hover"
        :hover-stay-time="100"
        @tap="confirmBirthday"
      >
        <text class="birthday-confirm__text">确认</text>
      </view>
    </view>

    <view v-if="showRewardPrompt" class="reward-card" @tap.stop>
      <text class="reward-card__text"
        >{{ rewardMessage }}<text v-if="rewardName" class="reward-card__name">{{ rewardName }}</text></text
      >
      <view
        class="reward-agree"
        hover-class="reward-agree--hover"
        :hover-stay-time="100"
        @tap="agree"
      >
        <text class="reward-agree__text">同意</text>
      </view>
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
  transition:
    left 120ms ease,
    top 120ms ease,
    opacity 160ms ease;
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

.reject-tip {
  position: fixed;
  top: 18%;
  left: 50%;
  z-index: 4;
  max-width: calc(100vw - 96rpx);
  padding: 20rpx 28rpx;
  border-radius: 20rpx;
  background: rgba(47, 47, 47, 0.9);
  box-shadow: 0 12rpx 30rpx rgba(32, 24, 20, 0.24);
  transform: translateX(-50%);
  box-sizing: border-box;
  animation: reject-tip-pop 180ms ease-out;
}

.reject-tip__text {
  display: block;
  color: #fff;
  font-size: 27rpx;
  font-weight: 600;
  line-height: 1.45;
  text-align: center;
}

@keyframes reject-tip-pop {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-12rpx) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0) scale(1);
  }
}

.birthday-card {
  position: relative;
  z-index: 3;
  width: 100%;
  max-width: 560rpx;
  padding: 48rpx 40rpx 40rpx;
  border: 2rpx solid #ffe8d8;
  border-radius: 32rpx;
  background: #fffaf6;
  box-shadow: 0 24rpx 48rpx rgba(80, 40, 20, 0.18);
  box-sizing: border-box;
  animation: invite-pop 280ms cubic-bezier(0.22, 1, 0.36, 1);
}

.birthday-card__title {
  display: block;
  font-size: 38rpx;
  font-weight: 700;
  color: #2f2f2f;
  line-height: 1.35;
  text-align: center;
}

.birthday-input {
  position: relative;
  display: flex;
  justify-content: center;
  gap: 18rpx;
  margin-top: 42rpx;
}

.birthday-input__cell {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 84rpx;
  height: 96rpx;
  border: 2rpx solid #ead8cc;
  border-radius: 18rpx;
  background: #fff;
  box-sizing: border-box;
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease;
}

.birthday-input__cell--active {
  border-color: #ff8a55;
  box-shadow: 0 0 0 4rpx rgba(255, 138, 85, 0.12);
}

.birthday-input__digit {
  font-size: 42rpx;
  font-weight: 700;
  color: #2f2f2f;
  line-height: 1;
}

.birthday-input__caret {
  width: 3rpx;
  height: 44rpx;
  border-radius: 999rpx;
  background: #ff8a55;
  animation: birthday-caret-blink 1s steps(1) infinite;
}

@keyframes birthday-caret-blink {
  0%,
  45% {
    opacity: 1;
  }
  50%,
  100% {
    opacity: 0;
  }
}

.birthday-input__control {
  position: absolute;
  top: 0;
  left: 50%;
  width: 390rpx;
  height: 96rpx;
  opacity: 0;
  color: transparent;
  caret-color: transparent;
  transform: translateX(-50%);
}

.birthday-card__error {
  display: block;
  min-height: 34rpx;
  margin-top: 16rpx;
  font-size: 24rpx;
  font-weight: 500;
  color: #e76546;
  line-height: 34rpx;
  text-align: center;
}

.birthday-confirm {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  margin-top: 22rpx;
  border-radius: 24rpx;
  background: #ff8a55;
  box-shadow: 0 10rpx 24rpx rgba(255, 138, 85, 0.28);
  transition:
    opacity 160ms ease,
    transform 160ms ease;
}

.birthday-confirm--hover {
  transform: scale(0.97);
}

.birthday-confirm--disabled {
  opacity: 0.45;
  box-shadow: none;
}

.birthday-confirm__text {
  font-size: 32rpx;
  font-weight: 700;
  color: #fff;
  letter-spacing: 4rpx;
}

.reward-card {
  position: relative;
  z-index: 3;
  width: 100%;
  max-width: 600rpx;
  padding: 48rpx 40rpx 40rpx;
  border: 2rpx solid #ffe8d8;
  border-radius: 32rpx;
  background: #fffaf6;
  box-shadow: 0 24rpx 48rpx rgba(80, 40, 20, 0.18);
  box-sizing: border-box;
  animation: invite-pop 280ms cubic-bezier(0.22, 1, 0.36, 1);
}

.reward-card__text {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #2f2f2f;
  line-height: 1.75;
  text-align: left;
}

.reward-card__name {
  font-weight: 800;
}

.reward-agree {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 96rpx;
  margin-top: 40rpx;
  border-radius: 26rpx;
  background: #ff8a55;
  box-shadow: 0 12rpx 28rpx rgba(255, 138, 85, 0.35);
  transition: transform 160ms ease;
}

.reward-agree--hover {
  transform: scale(0.97);
}

.reward-agree__text {
  font-size: 36rpx;
  font-weight: 700;
  color: #fff;
  letter-spacing: 4rpx;
}
</style>
