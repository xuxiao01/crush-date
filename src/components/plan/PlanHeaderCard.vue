<script setup lang="ts">
import type { Plan } from '@/types/plan'
import { countdownLabel, formatZhDate } from '@/utils/planDate'

defineProps<{ plan: Plan }>()
</script>

<template>
  <view class="header">
    <text class="header__date">{{ formatZhDate(plan.date || '') }}</text>
    <text class="header__countdown">{{ countdownLabel(plan.date || '') }}</text>
    <text v-if="plan.note" class="header__note">{{ plan.note }}</text>
  </view>
</template>

<style lang="scss" scoped>
.header { padding: 34rpx 30rpx; border-radius: 30rpx; background: linear-gradient(135deg, #ffe4ce, #ffd9e5); box-sizing: border-box; }
.header__date { display: block; font-size: 42rpx; font-weight: 700; color: #2f2f2f; }
.header__countdown { display: inline-block; margin-top: 10rpx; padding: 7rpx 16rpx; border-radius: 999rpx; background: rgba(255, 255, 255, 0.78); font-size: 23rpx; font-weight: 600; color: #ff7b58; }
.header__note { display: block; margin-top: 18rpx; font-size: 26rpx; color: #8c6e5d; line-height: 1.5; }
</style>
