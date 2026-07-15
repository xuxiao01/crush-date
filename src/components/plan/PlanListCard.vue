<script setup lang="ts">
import { computed } from 'vue'
import type { Plan } from '@/types/plan'
import { PERIOD_ORDER } from '@/types/plan'

const props = defineProps<{ plan: Plan }>()
const emit = defineEmits<{ tap: [] }>()
const cover = computed(() => props.plan.items[0]?.image || '')
const route = computed(() => {
  const titles = props.plan.items
    .slice()
    .sort((a, b) => PERIOD_ORDER.indexOf(a.period) - PERIOD_ORDER.indexOf(b.period) || a.order - b.order)
    .map((item) => item.title)
  return titles.length ? titles.join(' → ') : '还没有安排'
})
</script>

<template>
  <view class="card" hover-class="card--hover" @tap="emit('tap')">
    <image v-if="cover" class="card__cover" :src="cover" mode="aspectFill" />
    <view v-else class="card__cover card__cover--empty"><text>☁</text></view>
    <view class="card__body">
      <text class="card__title">{{ plan.title }}</text>
      <text class="card__tags">{{ plan.scenarioText || '自由安排' }}</text>
      <text class="card__route">{{ route }}</text>
      <text class="card__count">{{ plan.items.length }} 个安排</text>
    </view>
    <text class="card__arrow">›</text>
  </view>
</template>

<style lang="scss" scoped>
.card { display: flex; align-items: center; gap: 20rpx; padding: 22rpx; border-radius: 24rpx; background: #fffdf9; border: 2rpx solid #ffe1d6; box-shadow: 0 8rpx 20rpx rgba(120, 70, 40, 0.04); transition: transform 160ms ease; }
.card--hover { transform: scale(0.985); }
.card__cover { width: 112rpx; height: 132rpx; flex-shrink: 0; border-radius: 20rpx; }
.card__cover--empty { display: flex; align-items: center; justify-content: center; background: #fff0e8; color: #d6a28b; font-size: 38rpx; }
.card__body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5rpx; }
.card__title { font-size: 29rpx; font-weight: 700; color: #2f2f2f; }
.card__tags { font-size: 22rpx; color: #d3785e; }
.card__route { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font-size: 24rpx; color: #6f625d; }
.card__count { font-size: 21rpx; color: #b5a49a; }
.card__arrow { flex-shrink: 0; font-size: 38rpx; color: #cbb5a8; }
</style>
