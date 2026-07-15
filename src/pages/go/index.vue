<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app'
import { storeToRefs } from 'pinia'
import BasePage from '@/components/BasePage/index.vue'
import CustomNavbar from '@/components/CustomNavbar/index.vue'
import PlaceCollectCard from '@/components/PlaceCollectCard/index.vue'
import { usePlacesStore } from '@/stores/places'

const placesStore = usePlacesStore()
const { unvisitedList, visitedList, unvisitedCount, visitedCount, totalCount, progressPercent } =
  storeToRefs(placesStore)

onShow(() => {
  void placesStore.fetchPlaces()
})

function createPlace() {
  uni.navigateTo({
    url: '/pages/content/create?kind=place',
  })
}
</script>

<template>
  <BasePage>
    <CustomNavbar title="想去清单" :show-back="true" :show-brand="false">
      <template #right>
        <view class="navbar-add" hover-class="navbar-add--hover" @tap="createPlace">
          <text class="navbar-add__icon">＋</text>
        </view>
      </template>
    </CustomNavbar>

    <view class="go">
      <view class="tip-card">
        <image class="tip-card__icon" src="/static/brand/fluent-cloud.png" mode="aspectFit" />
        <view class="tip-card__text">
          <text class="tip-card__title">出去玩小默契</text>
          <text class="tip-card__desc">希望天气不太热，也一起遇见好看的天空。</text>
        </view>
      </view>

      <view class="progress">
        <view class="progress__row">
          <text class="progress__label">想去收集进度</text>
          <text class="progress__count">已去过 {{ visitedCount }} / {{ totalCount }}</text>
        </view>
        <view class="progress__track">
          <view class="progress__fill" :style="{ width: `${progressPercent}%` }" />
        </view>
      </view>

      <view class="section">
        <text class="section__title section__title--unvisited"
          >还没去 · {{ unvisitedCount }} 个</text
        >
        <view class="grid">
          <PlaceCollectCard v-for="item in unvisitedList" :key="item.id" :item="item" />
        </view>
      </view>

      <view class="section">
        <text class="section__title section__title--visited">去过了 · {{ visitedCount }} 个</text>
        <view class="grid">
          <PlaceCollectCard v-for="item in visitedList" :key="item.id" :item="item" />
        </view>
      </view>
    </view>
  </BasePage>
</template>

<style lang="scss" scoped>
.navbar-add {
  display: flex;
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
}

.navbar-add--hover {
  opacity: 0.55;
}

.navbar-add__icon {
  color: #ff7b58;
  font-size: 30px;
  font-weight: 300;
  line-height: 1;
}

.go {
  display: flex;
  flex-direction: column;
  gap: 36rpx;
  margin: 0 calc(24rpx - #{$page-padding});
  padding: 0 24rpx 48rpx;
  box-sizing: border-box;
}

.tip-card {
  display: flex;
  align-items: center;
  gap: 20rpx;
  min-height: 130rpx;
  padding: 24rpx 28rpx;
  border-radius: 24rpx;
  border: 2rpx solid #ffd0b0;
  background: linear-gradient(135deg, #fff6ee 0%, #ffe8d4 100%);
  box-sizing: border-box;
}

.tip-card__icon {
  width: 72rpx;
  height: 72rpx;
  flex-shrink: 0;
}

.tip-card__text {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  min-width: 0;
}

.tip-card__title {
  font-size: 30rpx;
  font-weight: 600;
  color: $color-text-primary;
  line-height: 1.3;
}

.tip-card__desc {
  font-size: 26rpx;
  color: #8a6548;
  line-height: 1.4;
}

.progress {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.progress__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.progress__label {
  font-size: 30rpx;
  font-weight: 600;
  color: $color-text-primary;
}

.progress__count {
  font-size: 26rpx;
  color: #9a6a4a;
}

.progress__track {
  width: 100%;
  height: 14rpx;
  overflow: hidden;
  border-radius: 999rpx;
  background: #ffe8d8;
}

.progress__fill {
  height: 100%;
  border-radius: 999rpx;
  background: linear-gradient(90deg, #ff9a6b 0%, #ffb6c1 100%);
  transition: width 280ms ease;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.section__title {
  font-size: 28rpx;
  font-weight: 600;
  line-height: 1.3;
}

.section__title--unvisited {
  color: #8c817b;
}

.section__title--visited {
  color: #ff7b4d;
}

.grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}
</style>
