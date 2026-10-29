<script setup lang="ts">
import AppImage from '@/components/AppImage/index.vue'
import type { FoodCardItem } from '@/types/food'

const props = defineProps<{
  item: FoodCardItem
  categoryName?: string
  lazyLoad?: boolean
}>()

function goDetail() {
  uni.navigateTo({
    url: `/pages/eat/detail?id=${encodeURIComponent(props.item.id)}`,
  })
}
</script>

<template>
  <view
    class="food-card-wrap"
    hover-class="food-card-wrap--hover"
    :hover-stay-time="100"
    @tap="goDetail"
  >
    <view
      class="food-card"
      :class="item.status === 'visited' ? 'food-card--visited' : 'food-card--unvisited'"
    >
      <view class="food-card__cover">
        <AppImage
          class="food-card__image"
          :src="item.image"
          mode="aspectFill"
          :lazy-load="lazyLoad"
        />
      </view>

      <view class="food-card__body">
        <text class="food-card__name">{{ item.name }}</text>
        <text class="food-card__type">
          {{ item.status === 'visited' ? item.type : item.comment }}
        </text>

        <text v-if="item.status !== 'visited'" class="food-card__status-pill">
          {{ categoryName || '待尝' }}
        </text>

        <view v-if="item.status === 'visited'" class="food-card__quote">
          <text class="food-card__quote-mark">“</text>
          <text class="food-card__comment">{{ item.comment }}</text>
        </view>

        <text v-if="item.status === 'visited'" class="food-card__date">
          {{ item.visitedDate }}
        </text>
      </view>
    </view>

    <view v-if="item.status === 'visited'" class="food-card__stamp">
      <text class="food-card__stamp-star food-card__stamp-star--top">✦</text>
      <view class="food-card__stamp-band">
        <text class="food-card__stamp-text">已打卡</text>
      </view>
      <text class="food-card__stamp-star food-card__stamp-star--bottom">✦ ✦</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.food-card-wrap {
  position: relative;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  max-width: 100%;
  overflow: visible;
  box-sizing: border-box;
  transition: transform 160ms ease;
}

.food-card-wrap--hover {
  transform: scale(0.98);
}

.food-card {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 24rpx;
  background: #ffffff;
  box-sizing: border-box;
}

.food-card--unvisited {
  border: 2rpx solid #edddd2;
  background: #fffdfb;
  box-shadow: 0 8rpx 22rpx rgba(104, 70, 48, 0.06);
}

.food-card--visited {
  border: 2rpx solid rgba(244, 167, 138, 0.58);
  box-shadow: 0 10rpx 28rpx rgba(255, 143, 112, 0.08);
}

.food-card__cover {
  position: relative;
  width: 100%;
  height: 0;
  padding-top: 75%;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 22rpx 22rpx 0 0;
  background: #f5ebe3;
  box-sizing: border-box;
}

.food-card__image {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
}

.food-card--unvisited .food-card__image {
  filter: saturate(0.75);
}

.food-card__stamp {
  position: absolute;
  top: -18rpx;
  right: -6rpx;
  display: flex;
  width: 108rpx;
  height: 108rpx;
  align-items: center;
  justify-content: center;
  z-index: 4;
  border: 3rpx solid rgba(214, 111, 88, 0.75);
  border-radius: 50%;
  background: rgba(255, 248, 244, 0.76);
  box-sizing: border-box;
  transform: rotate(-12deg);
  transform-origin: center;
  pointer-events: none;
}

.food-card__stamp::after {
  content: '';
  position: absolute;
  top: 6rpx;
  right: 6rpx;
  bottom: 6rpx;
  left: 6rpx;
  border: 2rpx dashed rgba(214, 111, 88, 0.75);
  border-radius: 50%;
  pointer-events: none;
}

.food-card__stamp-band {
  position: relative;
  display: flex;
  width: 118rpx;
  min-height: 36rpx;
  align-items: center;
  justify-content: center;
  z-index: 2;
  border-top: 2rpx solid rgba(214, 111, 88, 0.75);
  border-bottom: 2rpx solid rgba(214, 111, 88, 0.75);
  background: rgba(255, 248, 244, 0.86);
  box-sizing: border-box;
}

.food-card__stamp-text {
  color: rgba(184, 79, 58, 0.9);
  font-size: 25rpx;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 2rpx;
  white-space: nowrap;
}

.food-card__stamp-star {
  position: absolute;
  z-index: 1;
  color: rgba(184, 79, 58, 0.78);
  font-size: 14rpx;
  line-height: 1;
  letter-spacing: 3rpx;
}

.food-card__stamp-star--top {
  top: 14rpx;
}

.food-card__stamp-star--bottom {
  bottom: 13rpx;
}

.food-card__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  padding: 16rpx 18rpx 10rpx;
  box-sizing: border-box;
}

.food-card--unvisited .food-card__body {
  padding: 14rpx 16rpx 12rpx;
}

.food-card__name {
  display: block;
  flex: 0 0 auto;
  width: 100%;
  font-size: 30rpx;
  font-weight: 700;
  color: #252525;
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.food-card__type {
  display: block;
  flex: 0 0 auto;
  width: 100%;
  margin-top: 4rpx;
  font-size: 22rpx;
  font-weight: 400;
  color: #999999;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.food-card__status-pill {
  align-self: flex-start;
  max-width: 100%;
  margin-top: 12rpx;
  padding: 7rpx 14rpx;
  border-radius: 999rpx;
  background: #fff0eb;
  color: #ee7557;
  font-size: 21rpx;
  font-weight: 500;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  box-sizing: border-box;
}

.food-card__quote {
  display: flex;
  flex: 0 0 80rpx;
  align-items: flex-start;
  gap: 6rpx;
  height: 80rpx;
  min-height: 80rpx;
  max-height: 80rpx;
  margin-top: 10rpx;
  padding: 8rpx 14rpx 8rpx 12rpx;
  border-radius: 16rpx;
  background: linear-gradient(135deg, #fff4eb 0%, #ffe8ef 100%);
  box-sizing: border-box;
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
  display: block;
  flex: 0 0 auto;
  width: 100%;
  margin-top: 4rpx;
  font-size: 20rpx;
  font-weight: 400;
  color: #b5a49a;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
