<script setup lang="ts">
import type { PlanItem } from '@/types/plan'

defineProps<{
  item: PlanItem
  readonly?: boolean
}>()

const emit = defineEmits<{
  remove: [itemId: string]
}>()
</script>

<template>
  <view class="item" :class="item.type === 'food' ? 'item--food' : 'item--place'">
    <view class="item__text">
      <text class="item__title">{{ item.title }}</text>
      <text v-if="item.note" class="item__note">{{ item.note }}</text>
    </view>
    <image class="item__cover" :src="item.image" mode="aspectFill" />
    <view v-if="!readonly" class="item__remove" @tap.stop="emit('remove', item.id)">
      <text class="item__remove-text">×</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.item {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
  width: 100%;
  padding: 24rpx 68rpx 24rpx 24rpx;
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

.item__remove {
  position: absolute;
  top: 14rpx;
  right: 14rpx;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: #fff4ee;
  border: 2rpx solid #f1d8ca;
  box-sizing: border-box;
}

.item__remove-text {
  color: #b57960;
  font-size: 30rpx;
  font-weight: 400;
  line-height: 1;
  transform: translateY(-1rpx);
}
</style>
