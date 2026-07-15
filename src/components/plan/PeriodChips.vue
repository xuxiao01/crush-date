<script setup lang="ts">
import { computed } from 'vue'
import type { PlanPeriod } from '@/types/plan'
import { PERIOD_LABELS, PERIOD_ORDER } from '@/types/plan'

const props = withDefaults(
  defineProps<{
    modelValue: PlanPeriod
    periods?: PlanPeriod[]
  }>(),
  {
    periods: undefined,
  },
)

const emit = defineEmits<{
  'update:modelValue': [PlanPeriod]
}>()

const options = computed(() => props.periods?.length ? props.periods : PERIOD_ORDER)

function select(period: PlanPeriod) {
  emit('update:modelValue', period)
}
</script>

<template>
  <view class="period-chips">
    <view
      v-for="period in options"
      :key="period"
      class="period-chips__item"
      :class="{ 'period-chips__item--active': modelValue === period }"
      @tap="select(period)"
    >
      <text class="period-chips__text">{{ PERIOD_LABELS[period] }}</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.period-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.period-chips__item {
  flex: 1;
  min-width: calc(25% - 12rpx);
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999rpx;
  background: #fff4ec;
  border: 2rpx solid transparent;
  box-sizing: border-box;
}

.period-chips__item--active {
  background: linear-gradient(135deg, #ff8a55 0%, #ff8f9d 100%);
  border-color: transparent;
}

.period-chips__text {
  font-size: 26rpx;
  font-weight: 500;
  color: #8a6548;
}

.period-chips__item--active .period-chips__text {
  color: #ffffff;
  font-weight: 600;
}
</style>
