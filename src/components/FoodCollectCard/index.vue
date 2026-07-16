<script setup lang="ts">
import type { FoodCardItem } from '@/types/food'

const props = defineProps<{
  item: FoodCardItem
}>()

function goDetail() {
  uni.navigateTo({
    url: `/pages/eat/detail?id=${encodeURIComponent(props.item.id)}`,
  })
}
</script>

<template>
  <view
    class="food-card"
    :class="item.status === 'visited' ? 'food-card--visited' : 'food-card--unvisited'"
    hover-class="food-card--hover"
    :hover-stay-time="100"
    @tap="goDetail"
  >
    <view class="food-card__cover">
      <image class="food-card__image" :src="item.image" mode="aspectFill" />

      <view
        class="food-card__badge"
        :class="
          item.status === 'visited' ? 'food-card__badge--visited' : 'food-card__badge--unvisited'
        "
      >
        <text class="food-card__badge-icon">{{ item.status === 'visited' ? '✓' : '○' }}</text>
        <text class="food-card__badge-text">
          {{ item.status === 'visited' ? '吃过啦' : '还没吃' }}
        </text>
      </view>
    </view>

    <view class="food-card__body">
      <text class="food-card__name">{{ item.name }}</text>
      <text class="food-card__type">{{ item.type }}</text>

      <view class="food-card__quote">
        <text class="food-card__quote-mark">“</text>
        <text class="food-card__comment">{{ item.comment }}</text>
      </view>

      <text v-if="item.status === 'visited'" class="food-card__date">{{ item.visitedDate }}</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.food-card {
  width: 100%;
  overflow: hidden;
  border-radius: 24rpx;
  background: #ffffff;
  box-sizing: border-box;
  transition: transform 160ms ease;
}

.food-card--hover {
  transform: scale(0.98);
}

.food-card--unvisited {
  border: 2rpx dashed #e2d2c4;
  background: #fffdfb;
}

.food-card--visited {
  border: 2rpx solid #ffc2a0;
  box-shadow: 0 10rpx 28rpx rgba(255, 143, 112, 0.12);
}

.food-card__cover {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border-radius: 22rpx 22rpx 0 0;
  background: #f5ebe3;
}

.food-card__image {
  width: 100%;
  height: 100%;
  display: block;
}

.food-card--unvisited .food-card__image {
  filter: saturate(0.75);
}

.food-card__badge {
  position: absolute;
  top: 14rpx;
  right: 14rpx;
  display: flex;
  align-items: center;
  gap: 6rpx;
  padding: 8rpx 14rpx;
  border-radius: 999rpx;
}

.food-card__badge--unvisited {
  background: rgba(255, 252, 248, 0.94);
  border: 2rpx solid rgba(255, 255, 255, 0.95);
  box-shadow: 0 4rpx 12rpx rgba(80, 50, 30, 0.08);
}

.food-card__badge--visited {
  background: #ff7b4d;
  border: 2rpx solid #ff7b4d;
}

.food-card__badge-icon,
.food-card__badge-text {
  font-size: 20rpx;
  font-weight: 600;
  line-height: 1;
}

.food-card__badge--unvisited .food-card__badge-icon,
.food-card__badge--unvisited .food-card__badge-text {
  color: #8c817b;
}

.food-card__badge--visited .food-card__badge-icon,
.food-card__badge--visited .food-card__badge-text {
  color: #ffffff;
}

.food-card__body {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  padding: 20rpx 18rpx 22rpx;
}

.food-card__name {
  font-size: 30rpx;
  font-weight: 700;
  color: #252525;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.food-card__type {
  font-size: 22rpx;
  font-weight: 400;
  color: #999999;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.food-card__quote {
  display: flex;
  align-items: flex-start;
  gap: 6rpx;
  margin-top: 4rpx;
  padding: 14rpx 14rpx 14rpx 12rpx;
  border-radius: 16rpx;
  background: linear-gradient(135deg, #fff4eb 0%, #ffe8ef 100%);
}

.food-card__quote-mark {
  flex-shrink: 0;
  width: 22rpx;
  font-size: 28rpx;
  font-weight: 600;
  color: rgba(255, 143, 112, 0.55);
  line-height: 1.1;
}

.food-card__comment {
  flex: 1;
  min-width: 0;
  font-size: 24rpx;
  font-weight: 500;
  color: #6b5344;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.food-card__date {
  margin-top: 2rpx;
  font-size: 20rpx;
  font-weight: 400;
  color: #b5a49a;
  line-height: 1.3;
}
</style>
