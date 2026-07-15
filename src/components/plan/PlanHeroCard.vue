<script setup lang="ts">
import { computed } from 'vue'
import type { Plan } from '@/types/plan'
import { PERIOD_LABELS, PERIOD_ORDER } from '@/types/plan'
import { countdownLabel, formatZhDate } from '@/utils/planDate'

const props = defineProps<{ plan: Plan }>()
const emit = defineEmits<{ tap: [] }>()
const cover = computed(() => props.plan.items[0]?.image || '')
const summaries = computed(() =>
  PERIOD_ORDER.map((period) => ({
    period,
    title: props.plan.items
      .filter((item) => item.period === period)
      .sort((a, b) => a.order - b.order)
      .map((item) => item.title)
      .join(' / '),
  })).filter((item) => item.title),
)
</script>

<template>
  <view class="hero" hover-class="hero--hover" @tap="emit('tap')">
    <view class="hero__content">
      <text class="hero__date">{{ formatZhDate(plan.date || '') }}</text>
      <text class="hero__countdown">{{ countdownLabel(plan.date || '') }}</text>
      <view v-if="summaries.length" class="hero__summaries">
        <view v-for="item in summaries" :key="item.period" class="hero__summary">
          <text class="hero__period">{{ PERIOD_LABELS[item.period] }}</text>
          <text class="hero__place">{{ item.title }}</text>
        </view>
      </view>
      <text v-else class="hero__empty">还没有安排，点击开始准备</text>
    </view>
    <image v-if="cover" class="hero__cover" :src="cover" mode="aspectFill" />
    <view v-else class="hero__cover hero__cover--empty">
      <text class="hero__cover-icon">☁</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.hero { display: flex; align-items: stretch; gap: 24rpx; min-height: 320rpx; padding: 32rpx; border-radius: 32rpx; background: linear-gradient(135deg, #ffe0c9 0%, #ffd4e1 100%); box-shadow: 0 14rpx 36rpx rgba(255, 138, 85, 0.16); box-sizing: border-box; transition: transform 160ms ease; }
.hero--hover { transform: scale(0.985); }
.hero__content { flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: flex-start; }
.hero__date { font-size: 40rpx; font-weight: 700; color: #2f2f2f; line-height: 1.3; }
.hero__countdown { margin-top: 8rpx; padding: 7rpx 16rpx; border-radius: 999rpx; background: rgba(255, 255, 255, 0.82); font-size: 22rpx; font-weight: 600; color: #ff754d; }
.hero__summaries { width: 100%; margin-top: 20rpx; display: flex; flex-direction: column; gap: 9rpx; }
.hero__summary { display: flex; gap: 12rpx; min-width: 0; }
.hero__period { width: 56rpx; flex-shrink: 0; font-size: 23rpx; color: #9a6a4a; }
.hero__place { flex: 1; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font-size: 25rpx; font-weight: 500; color: #3e342f; }
.hero__empty { margin-top: 24rpx; font-size: 24rpx; color: #9a6a4a; line-height: 1.5; }
.hero__cover { align-self: center; width: 176rpx; height: 220rpx; flex-shrink: 0; border-radius: 26rpx; }
.hero__cover--empty { display: flex; align-items: center; justify-content: center; background: rgba(255, 255, 255, 0.45); }
.hero__cover-icon { font-size: 64rpx; color: rgba(255, 138, 85, 0.55); }
</style>
