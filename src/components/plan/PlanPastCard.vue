<script setup lang="ts">
import type { Plan } from '@/types/plan'
import { PERIOD_ORDER } from '@/types/plan'
import { formatZhDateShort } from '@/utils/planDate'
import { computed } from 'vue'

const props = defineProps<{
  plan: Plan
}>()

const emit = defineEmits<{
  tap: []
}>()

const path = computed(() => {
  const titles = props.plan.items
    .slice()
    .sort((a, b) => PERIOD_ORDER.indexOf(a.period) - PERIOD_ORDER.indexOf(b.period) || a.order - b.order)
    .map((i) => i.title)
  if (!titles.length) return '那天也很好'
  return titles.join(' → ')
})
</script>

<template>
  <view class="past" hover-class="past--hover" :hover-stay-time="100" @tap="emit('tap')">
    <text class="past__meta">{{ formatZhDateShort(plan.date || '') }}</text>
    <text class="past__path">{{ path }}</text>
    <text class="past__link">查看那天的记录 ›</text>
  </view>
</template>

<style lang="scss" scoped>
.past {
  width: 100%;
  padding: 24rpx 28rpx;
  border-radius: 24rpx;
  background: #f4efe9;
  border: 2rpx solid #e6dbd2;
  box-sizing: border-box;
  transition: transform 160ms ease;
}

.past--hover {
  transform: scale(0.98);
}

.past__meta {
  display: block;
  font-size: 24rpx;
  color: #9a8b80;
  margin-bottom: 10rpx;
}

.past__path {
  display: block;
  font-size: 28rpx;
  font-weight: 500;
  color: #6b5c52;
  line-height: 1.4;
  margin-bottom: 12rpx;
}

.past__link {
  font-size: 24rpx;
  color: #b08772;
}
</style>
