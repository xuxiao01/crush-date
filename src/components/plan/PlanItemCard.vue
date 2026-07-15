<script setup lang="ts">
import type { PlanItem } from '@/types/plan'

defineProps<{
  item: PlanItem
}>()
</script>

<template>
  <view class="item" :class="item.type === 'food' ? 'item--food' : 'item--place'">
    <view class="item__text">
      <text class="item__title">{{ item.title }}</text>
      <text v-if="item.note" class="item__note">{{ item.note }}</text>
    </view>
    <image class="item__cover" :src="item.image" mode="aspectFill" />
  </view>
</template>

<style lang="scss" scoped>
.item {
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
  padding: 24rpx;
  border-radius: 24rpx;
  background: #fffdfb;
  border: 2rpx solid transparent;
  box-sizing: border-box;
}

.item--food {
  border-color: #ffd7bf;
}

.item--place {
  border-color: #ffd3df;
}

.item__text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.item__title {
  font-size: 30rpx;
  font-weight: 600;
  color: #2f2f2f;
  line-height: 1.35;
}

.item__note {
  font-size: 24rpx;
  font-weight: 400;
  color: #6f625d;
  line-height: 1.4;
}

.item__cover {
  width: 120rpx;
  height: 120rpx;
  flex-shrink: 0;
  border-radius: 20rpx;
  display: block;
}
</style>
