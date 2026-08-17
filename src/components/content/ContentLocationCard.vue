<script setup lang="ts">
import ContentMapView from '@/components/content/ContentMapView.vue'
import type { ContentLocation, ContentType } from '@/types/content'
import { openContentLocationNavigation } from '@/utils/contentLocation'

const props = defineProps<{
  kind: ContentType
  contentId: string
  location: ContentLocation
}>()

function openMap() {
  uni.navigateTo({
    url: `/pages/content/location-map?kind=${props.kind}&id=${encodeURIComponent(props.contentId)}`,
  })
}

function openNavigation() {
  openContentLocationNavigation(props.location)
}
</script>

<template>
  <view class="location-card">
    <view class="location-card__heading">
      <view class="location-card__copy">
        <text class="location-card__eyebrow">地点</text>
        <text class="location-card__title">{{ location.title }}</text>
        <text class="location-card__address">{{ location.address || '暂无详细地址' }}</text>
      </view>
      <view class="location-card__actions">
        <text class="location-card__link" @tap="openMap">查看地图</text>
        <text class="location-card__link location-card__link--primary" @tap="openNavigation">
          去导航
        </text>
      </view>
    </view>
    <ContentMapView :location="location" @activate="openMap" />
  </view>
</template>

<style lang="scss" scoped>
.location-card {
  margin-top: 28rpx;
  padding: 24rpx;
  border: 2rpx solid #f1ddd1;
  border-radius: 24rpx;
  background: #fffdfb;
}

.location-card__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.location-card__copy {
  min-width: 0;
  flex: 1;
}

.location-card__eyebrow,
.location-card__title,
.location-card__address {
  display: block;
}

.location-card__eyebrow {
  margin-bottom: 6rpx;
  color: #ff765b;
  font-size: 21rpx;
}

.location-card__title {
  overflow: hidden;
  color: #4a3b34;
  font-size: 27rpx;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.location-card__address {
  overflow: hidden;
  margin-top: 6rpx;
  color: #9c8d84;
  font-size: 22rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.location-card__link {
  flex: 0 0 auto;
  color: #ff765b;
  font-size: 23rpx;
}

.location-card__actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  margin-left: 20rpx;
}

.location-card__link--primary {
  margin-left: 20rpx;
  padding-left: 20rpx;
  border-left: 1rpx solid #ead8ce;
  font-weight: 600;
}
</style>
