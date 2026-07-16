<script setup lang="ts">
import EmptyPeriodCard from '@/components/plan/EmptyPeriodCard.vue'
import PlanItemCard from '@/components/plan/PlanItemCard.vue'
import type { PlanItem, PlanPeriod } from '@/types/plan'
import { PERIOD_LABELS } from '@/types/plan'
import { computed } from 'vue'

const props = defineProps<{
  period: PlanPeriod
  items: PlanItem[]
  readonly?: boolean
}>()

const emit = defineEmits<{
  add: []
  edit: []
}>()

const hasItems = computed(() => props.items.length > 0)
</script>

<template>
  <view class="section">
    <view class="section__head">
      <text class="section__title">{{ PERIOD_LABELS[period] }}</text>
      <text
        v-if="!readonly"
        class="section__action"
        @tap="hasItems ? emit('edit') : emit('add')"
      >
        {{ hasItems ? '修改' : '＋ 添加安排' }}
      </text>
    </view>

    <view v-if="hasItems" class="section__list">
      <PlanItemCard v-for="item in items" :key="item.id" :item="item" />
    </view>

    <view v-else-if="readonly" class="section__readonly-empty">
      <text>暂时没有安排</text>
    </view>
    <EmptyPeriodCard v-else @add="emit('add')" />
  </view>
</template>

<style lang="scss" scoped>
.section {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  width: 100%;
  box-sizing: border-box;
}

.section__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  min-height: 48rpx;
}

.section__title {
  font-size: 30rpx;
  font-weight: 700;
  color: #2f2f2f;
  line-height: 1.3;
}

.section__action {
  font-size: 26rpx;
  font-weight: 500;
  color: #ff8a55;
  line-height: 1.3;
}

.section__list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.section__readonly-empty { padding: 24rpx 4rpx; border-bottom: 2rpx dashed #ded5ce; font-size: 24rpx; color: #aaa; }
</style>
