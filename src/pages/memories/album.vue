<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import CustomNavbar from '@/components/CustomNavbar/index.vue'
import { MEMORIES } from '@/data/memories'

const current = ref(0)
const total = MEMORIES.length
const ready = ref(false)

const active = computed(() => MEMORIES[current.value] ?? MEMORIES[0])

onLoad((query) => {
  const raw = typeof query?.index === 'string' ? Number(query.index) : 0
  const next = Number.isFinite(raw) ? Math.floor(raw) : 0
  current.value = Math.min(Math.max(next, 0), total - 1)
  ready.value = true
})

function onChange(event: { detail: { current: number } }) {
  current.value = event.detail.current
}
</script>

<template>
  <view class="album">
    <CustomNavbar
      title="回忆"
      :show-back="true"
      :show-brand="false"
      :light="true"
      background="transparent"
    />

    <swiper
      v-if="ready"
      class="album__swiper"
      circular
      :current="current"
      :duration="400"
      @change="onChange"
    >
      <swiper-item v-for="item in MEMORIES" :key="item.id">
        <view class="album__slide">
          <image
            class="album__image"
            :src="item.image"
            mode="aspectFill"
            :style="{ objectPosition: item.objectPosition }"
          />
        </view>
      </swiper-item>
    </swiper>

    <view class="album__footer">
      <view class="album__copy">
        <text class="album__title">{{ active.title }}</text>
        <text class="album__subtitle">{{ active.subtitle }}</text>
      </view>
      <text class="album__page">{{ current + 1 }} / {{ total }}</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.album {
  position: relative;
  width: 100%;
  min-height: 100vh;
  background: #111111;
  overflow: hidden;
}

.album__swiper {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.album__slide {
  width: 100%;
  height: 100%;
  background: #111111;
}

.album__image {
  width: 100%;
  height: 100%;
  display: block;
}

.album__footer {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24rpx;
  padding: 48rpx 32rpx calc(48rpx + env(safe-area-inset-bottom));
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.45));
  pointer-events: none;
}

.album__copy {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  min-width: 0;
  max-width: 72%;
}

.album__title {
  font-size: 36rpx;
  font-weight: 500;
  color: #ffffff;
  line-height: 1.3;
}

.album__subtitle {
  font-size: 26rpx;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.88);
  line-height: 1.3;
}

.album__page {
  flex-shrink: 0;
  font-size: 26rpx;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.92);
  line-height: 1;
  letter-spacing: 1rpx;
  padding-bottom: 6rpx;
}
</style>
