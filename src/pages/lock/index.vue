<script setup lang="ts">
import { ref } from 'vue'
import { onLoad, onReady } from '@dcloudio/uni-app'
import BasePage from '@/components/BasePage/index.vue'
import CustomNavbar from '@/components/CustomNavbar/index.vue'
import {
  APP_ACCESS_PASSWORD,
  isAppUnlocked,
  markAppUnlocked,
  normalizeAccessPassword,
  verifyAccessPassword,
} from '@/utils/appAccessLock'

const password = ref('')
const error = ref('')
const inputFocused = ref(false)
const checking = ref(false)

function goHome() {
  uni.switchTab({ url: '/pages/home/index' })
}

onLoad(() => {
  if (isAppUnlocked()) goHome()
})

onReady(() => {
  if (!isAppUnlocked()) inputFocused.value = true
})

function handleInput(event: Event) {
  const inputEvent = event as Event & { detail?: { value?: string } }
  const nextValue = inputEvent.detail?.value ?? ''
  password.value = normalizeAccessPassword(nextValue)
  error.value = ''
  if (password.value.length === APP_ACCESS_PASSWORD.length) unlock()
}

function unlock() {
  if (checking.value || password.value.length !== APP_ACCESS_PASSWORD.length) return
  checking.value = true
  if (verifyAccessPassword(password.value)) {
    markAppUnlocked()
    goHome()
    return
  }

  password.value = ''
  inputFocused.value = false
  error.value = '密码不对，再试一次～'
  checking.value = false
  uni.vibrateShort({ type: 'light' })
  setTimeout(() => {
    inputFocused.value = true
  }, 80)
}
</script>

<template>
  <BasePage>
    <CustomNavbar title="雨间计划" :show-back="false" :show-brand="false" />

    <view class="lock-page">
      <view class="lock-page__glow lock-page__glow--top" />
      <view class="lock-page__glow lock-page__glow--bottom" />

      <view class="lock-card">
        <text class="lock-card__eyebrow">Jie Yu</text>
        <text class="lock-card__title">又见面啦</text>
        <text class="lock-card__subtitle">输入暗号，故事继续</text>

        <view class="lock-input">
          <view
            v-for="index in APP_ACCESS_PASSWORD.length"
            :key="index"
            class="lock-input__cell"
            :class="{
              'lock-input__cell--active': password.length === index - 1,
              'lock-input__cell--filled': password.length >= index,
            }"
          >
            <text class="lock-input__dot">{{ password.length >= index ? '●' : '' }}</text>
          </view>
          <input
            class="lock-input__control"
            type="number"
            password
            inputmode="numeric"
            :maxlength="APP_ACCESS_PASSWORD.length"
            :adjust-position="false"
            :value="password"
            :focus="inputFocused"
            @focus="inputFocused = true"
            @blur="inputFocused = false"
            @input="handleInput"
            @confirm="unlock"
          />
        </view>

        <text class="lock-card__error">{{ error }}</text>

        <view
          class="lock-card__button"
          :class="{
            'lock-card__button--disabled': password.length !== APP_ACCESS_PASSWORD.length,
          }"
          hover-class="lock-card__button--hover"
          :hover-stay-time="100"
          @tap="unlock"
        >
          <text class="lock-card__button-text">开启</text>
        </view>

        <text class="lock-card__hint">给你留的小角落</text>
      </view>
    </view>
  </BasePage>
</template>

<style lang="scss" scoped>
.lock-page {
  position: relative;
  display: flex;
  min-height: calc(100vh - 88rpx);
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 48rpx 0 96rpx;
  box-sizing: border-box;
  background: #fff7f2;
}

.lock-page__glow {
  position: absolute;
  width: 360rpx;
  height: 360rpx;
  border-radius: 50%;
  background: rgba(255, 157, 122, 0.16);
  filter: blur(4rpx);
}

.lock-page__glow--top {
  top: -160rpx;
  right: -120rpx;
}

.lock-page__glow--bottom {
  bottom: -180rpx;
  left: -140rpx;
  background: rgba(255, 125, 145, 0.12);
}

.lock-card {
  position: relative;
  z-index: 1;
  width: 100%;
  padding: 64rpx 40rpx 48rpx;
  border: 2rpx solid #ffe0d2;
  border-radius: 36rpx;
  background: rgba(255, 253, 251, 0.96);
  box-shadow: 0 24rpx 60rpx rgba(129, 75, 45, 0.1);
  box-sizing: border-box;
}

.lock-card__eyebrow,
.lock-card__title,
.lock-card__subtitle,
.lock-card__error,
.lock-card__hint {
  display: block;
  text-align: center;
}

.lock-card__eyebrow {
  color: #ff9275;
  font-size: 20rpx;
  font-weight: 600;
  letter-spacing: 6rpx;
}

.lock-card__title {
  margin-top: 20rpx;
  color: #463730;
  font-size: 42rpx;
  font-weight: 700;
}

.lock-card__subtitle {
  margin-top: 14rpx;
  color: #a58d82;
  font-size: 25rpx;
}

.lock-input {
  position: relative;
  display: flex;
  justify-content: space-between;
  margin-top: 54rpx;
}

.lock-input__cell {
  display: flex;
  width: 62rpx;
  height: 76rpx;
  align-items: center;
  justify-content: center;
  border: 2rpx solid #eadbd3;
  border-radius: 16rpx;
  background: #fff;
  box-sizing: border-box;
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease;
}

.lock-input__cell--active {
  border-color: #ff8a61;
  box-shadow: 0 0 0 4rpx rgba(255, 138, 97, 0.12);
}

.lock-input__cell--filled {
  border-color: #ffc6b2;
}

.lock-input__dot {
  color: #ff765b;
  font-size: 25rpx;
  line-height: 1;
}

.lock-input__control {
  // Keep the native input tappable across the cells, including after it loses focus.
  position: absolute;
  z-index: 2;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  color: transparent !important;
  caret-color: transparent !important;
  -webkit-text-fill-color: transparent !important;
  font-size: 32rpx;
  opacity: 0.01;
}

.lock-card__error {
  min-height: 34rpx;
  margin-top: 18rpx;
  color: #ef6f5c;
  font-size: 23rpx;
}

.lock-card__button {
  display: flex;
  height: 92rpx;
  align-items: center;
  justify-content: center;
  margin-top: 26rpx;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #ff8b61, #ff7488);
  box-shadow: 0 12rpx 26rpx rgba(255, 122, 111, 0.2);
}

.lock-card__button--disabled {
  opacity: 0.45;
}

.lock-card__button--hover {
  opacity: 0.86;
}

.lock-card__button-text {
  color: #fff;
  font-size: 29rpx;
  font-weight: 600;
}

.lock-card__hint {
  margin-top: 28rpx;
  color: #b7a59b;
  font-size: 21rpx;
}
</style>
