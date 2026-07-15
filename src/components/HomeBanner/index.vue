<script setup lang="ts">
import { ref } from 'vue'
import { MEMORIES } from '@/data/memories'

const current = ref(0)
const total = MEMORIES.length

function onChange(event: { detail: { current: number } }) {
  current.value = event.detail.current
}

function openAlbum() {
  uni.navigateTo({
    url: `/pages/memories/album?index=${current.value}`,
  })
}
</script>

<template>
  <view class="home-banner" @tap="openAlbum">
    <swiper
      class="home-banner__swiper"
      circular
      autoplay
      :interval="5500"
      :duration="500"
      @change="onChange"
    >
      <swiper-item v-for="item in MEMORIES" :key="item.id">
        <view class="home-banner__slide">
          <image
            class="home-banner__image"
            :src="item.image"
            mode="aspectFill"
            :style="{ objectPosition: item.objectPosition }"
          />
          <view class="home-banner__mask" />
          <view class="home-banner__meta">
            <view class="home-banner__copy">
              <text class="home-banner__title">{{ item.title }}</text>
              <text class="home-banner__subtitle">{{ item.subtitle }}</text>
            </view>
          </view>
        </view>
      </swiper-item>
    </swiper>

    <view class="home-banner__page">
      <text class="home-banner__page-text">{{ current + 1 }} / {{ total }}</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.home-banner {
  position: relative;
  margin: calc(-1 * #{$page-padding}) calc(-1 * #{$page-padding}) 0;
  width: calc(100% + #{$page-padding} * 2);
  overflow: hidden;
}

.home-banner__swiper {
  width: 100%;
  height: 480rpx;
}

.home-banner__slide {
  position: relative;
  width: 100%;
  height: 100%;
}

.home-banner__image {
  width: 100%;
  height: 100%;
  display: block;
}

.home-banner__mask {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 40%;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.28));
  pointer-events: none;
}

.home-banner__meta {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 28rpx 28rpx 32rpx;
  pointer-events: none;
}

.home-banner__copy {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  min-width: 0;
  max-width: 70%;
}

.home-banner__title {
  font-size: 32rpx;
  font-weight: 500;
  color: #ffffff;
  line-height: 1.3;
}

.home-banner__subtitle {
  font-size: 24rpx;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.88);
  line-height: 1.3;
}

.home-banner__page {
  position: absolute;
  right: 28rpx;
  bottom: 36rpx;
  z-index: 2;
  pointer-events: none;
}

.home-banner__page-text {
  font-size: 24rpx;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.92);
  line-height: 1;
  letter-spacing: 1rpx;
}
</style>
