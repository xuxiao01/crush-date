<script setup lang="ts">
import type { PlaceCardItem } from '@/types/place'

const props = defineProps<{
  item: PlaceCardItem
}>()

function goDetail() {
  uni.navigateTo({
    url: `/pages/go/detail?id=${encodeURIComponent(props.item.id)}`,
  })
}
</script>

<template>
  <view
    class="place-card"
    :class="item.status === 'visited' ? 'place-card--visited' : 'place-card--unvisited'"
    hover-class="place-card--hover"
    :hover-stay-time="100"
    @tap="goDetail"
  >
    <view class="place-card__cover">
      <image class="place-card__image" :src="item.image" mode="aspectFill" />

      <view
        class="place-card__badge"
        :class="
          item.status === 'visited' ? 'place-card__badge--visited' : 'place-card__badge--unvisited'
        "
      >
        <text class="place-card__badge-icon">{{ item.status === 'visited' ? '✓' : '○' }}</text>
        <text class="place-card__badge-text">
          {{ item.status === 'visited' ? '去过了' : '还没去' }}
        </text>
      </view>
    </view>

    <view class="place-card__body">
      <text class="place-card__name">{{ item.name }}</text>
      <text class="place-card__type">{{ item.type }}</text>

      <view class="place-card__quote">
        <text class="place-card__quote-mark">“</text>
        <text class="place-card__comment">{{ item.comment }}</text>
      </view>

      <text v-if="item.status === 'visited'" class="place-card__date">{{ item.visitedDate }}</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.place-card {
  width: 100%;
  overflow: hidden;
  border-radius: 24rpx;
  background: #ffffff;
  box-sizing: border-box;
  transition: transform 160ms ease;
}

.place-card--hover {
  transform: scale(0.98);
}

.place-card--unvisited {
  border: 2rpx dashed #e2d2c4;
  background: #fffdfb;
}

.place-card--visited {
  border: 2rpx solid #ffc2a0;
  box-shadow: 0 10rpx 28rpx rgba(255, 143, 112, 0.12);
}

.place-card__cover {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border-radius: 22rpx 22rpx 0 0;
  background: #f5ebe3;
}

.place-card__image {
  width: 100%;
  height: 100%;
  display: block;
}

.place-card--unvisited .place-card__image {
  filter: saturate(0.75);
}

.place-card__badge {
  position: absolute;
  top: 14rpx;
  right: 14rpx;
  display: flex;
  align-items: center;
  gap: 6rpx;
  padding: 8rpx 14rpx;
  border-radius: 999rpx;
}

.place-card__badge--unvisited {
  background: rgba(255, 252, 248, 0.94);
  border: 2rpx solid rgba(255, 255, 255, 0.95);
  box-shadow: 0 4rpx 12rpx rgba(80, 50, 30, 0.08);
}

.place-card__badge--visited {
  background: #ff7b4d;
  border: 2rpx solid #ff7b4d;
}

.place-card__badge-icon,
.place-card__badge-text {
  font-size: 20rpx;
  font-weight: 600;
  line-height: 1;
}

.place-card__badge--unvisited .place-card__badge-icon,
.place-card__badge--unvisited .place-card__badge-text {
  color: #8c817b;
}

.place-card__badge--visited .place-card__badge-icon,
.place-card__badge--visited .place-card__badge-text {
  color: #ffffff;
}

.place-card__body {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  padding: 20rpx 18rpx 22rpx;
}

.place-card__name {
  font-size: 30rpx;
  font-weight: 700;
  color: #252525;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.place-card__type {
  font-size: 22rpx;
  font-weight: 400;
  color: #999999;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.place-card__quote {
  display: flex;
  align-items: flex-start;
  gap: 6rpx;
  margin-top: 4rpx;
  padding: 14rpx 14rpx 14rpx 12rpx;
  border-radius: 16rpx;
  background: linear-gradient(135deg, #fff4eb 0%, #ffe8ef 100%);
}

.place-card__quote-mark {
  flex-shrink: 0;
  width: 22rpx;
  font-size: 28rpx;
  font-weight: 600;
  color: rgba(255, 143, 112, 0.55);
  line-height: 1.1;
}

.place-card__comment {
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

.place-card__date {
  margin-top: 2rpx;
  font-size: 20rpx;
  font-weight: 400;
  color: #b5a49a;
  line-height: 1.3;
}
</style>
