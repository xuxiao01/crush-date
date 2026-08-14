<script setup lang="ts">
import type { PlaceCardItem } from '@/types/place'

const props = defineProps<{
  item: PlaceCardItem
  categoryName?: string
}>()

function goDetail() {
  uni.navigateTo({
    url: `/pages/go/detail?id=${encodeURIComponent(props.item.id)}`,
  })
}
</script>

<template>
  <view
    class="place-card-wrap"
    hover-class="place-card-wrap--hover"
    :hover-stay-time="100"
    @tap="goDetail"
  >
    <view
      class="place-card"
      :class="item.status === 'visited' ? 'place-card--visited' : 'place-card--unvisited'"
    >
      <view class="place-card__cover">
        <image class="place-card__image" :src="item.image" mode="aspectFill" lazy-load />
      </view>

      <view class="place-card__body">
        <text class="place-card__name">{{ item.name }}</text>
        <text class="place-card__type">
          {{ item.status === 'visited' ? item.type : item.comment }}
        </text>

        <text v-if="item.status !== 'visited'" class="place-card__status-pill">
          {{ categoryName || '想去' }}
        </text>

        <view v-if="item.status === 'visited'" class="place-card__quote">
          <text class="place-card__quote-mark">“</text>
          <text class="place-card__comment">{{ item.comment }}</text>
        </view>

        <text v-if="item.status === 'visited'" class="place-card__date">
          {{ item.visitedDate }}
        </text>
      </view>
    </view>

    <view v-if="item.status === 'visited'" class="place-card__stamp">
      <text class="place-card__stamp-star place-card__stamp-star--top">✦</text>
      <view class="place-card__stamp-band">
        <text class="place-card__stamp-text">已打卡</text>
      </view>
      <text class="place-card__stamp-star place-card__stamp-star--bottom">✦ ✦</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.place-card-wrap {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  max-width: 100%;
  overflow: visible;
  box-sizing: border-box;
  transition: transform 160ms ease;
}

.place-card-wrap--hover {
  transform: scale(0.98);
}

.place-card {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 24rpx;
  background: #ffffff;
  box-sizing: border-box;
}

.place-card--unvisited {
  border: 2rpx solid #edddd2;
  background: #fffdfb;
  box-shadow: 0 8rpx 22rpx rgba(104, 70, 48, 0.06);
}

.place-card--visited {
  border: 2rpx solid rgba(244, 167, 138, 0.58);
  box-shadow: 0 10rpx 28rpx rgba(255, 143, 112, 0.08);
}

.place-card__cover {
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

.place-card__image {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
}

.place-card--unvisited .place-card__image {
  filter: saturate(0.75);
}

.place-card__stamp {
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

.place-card__stamp::after {
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

.place-card__stamp-band {
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

.place-card__stamp-text {
  color: rgba(184, 79, 58, 0.9);
  font-size: 25rpx;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 2rpx;
  white-space: nowrap;
}

.place-card__stamp-star {
  position: absolute;
  z-index: 1;
  color: rgba(184, 79, 58, 0.78);
  font-size: 14rpx;
  line-height: 1;
  letter-spacing: 3rpx;
}

.place-card__stamp-star--top {
  top: 14rpx;
}

.place-card__stamp-star--bottom {
  bottom: 13rpx;
}

.place-card__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  padding: 16rpx 18rpx 10rpx;
  box-sizing: border-box;
}

.place-card--unvisited .place-card__body {
  padding: 14rpx 16rpx 12rpx;
}

.place-card__name {
  display: block;
  flex: 0 0 auto;
  width: 100%;
  color: #252525;
  font-size: 30rpx;
  font-weight: 700;
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.place-card__type {
  display: block;
  flex: 0 0 auto;
  width: 100%;
  margin-top: 4rpx;
  color: #999999;
  font-size: 22rpx;
  font-weight: 400;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.place-card__status-pill {
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

.place-card__quote {
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

.place-card__quote-mark {
  flex-shrink: 0;
  width: 22rpx;
  color: rgba(255, 143, 112, 0.55);
  font-size: 28rpx;
  font-weight: 600;
  line-height: 1.1;
}

.place-card__comment {
  display: -webkit-box;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: #6b5344;
  font-size: 24rpx;
  font-weight: 500;
  line-height: 1.4;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.place-card__date {
  display: block;
  flex: 0 0 auto;
  width: 100%;
  margin-top: 4rpx;
  overflow: hidden;
  color: #b5a49a;
  font-size: 20rpx;
  font-weight: 400;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
