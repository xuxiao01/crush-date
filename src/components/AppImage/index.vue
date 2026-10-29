<script lang="ts">
export default {
  options: { styleIsolation: 'shared', addGlobalClass: true },
}
</script>

<script setup lang="ts">
import { computed, reactive, watch, type CSSProperties } from 'vue'
import { ImageLoadState } from '@/utils/imageLoading'

const props = withDefaults(
  defineProps<{
    src: string
    mode?: 'aspectFill' | 'aspectFit' | 'scaleToFill' | 'widthFix' | 'heightFix'
    lazyLoad?: boolean
    fade?: boolean
    transparent?: boolean
    imageStyle?: CSSProperties
  }>(),
  { mode: 'aspectFill', lazyLoad: false, fade: true, transparent: false },
)
const emit = defineEmits<{ load: [event: unknown]; error: [event: unknown] }>()
const state = reactive(new ImageLoadState())
// A keyed list also replaces the native mini-program image when retrying the same URL.
const requests = computed(() => (props.src ? [{ id: state.requestId, src: props.src }] : []))
watch(
  () => props.src,
  (src) => state.setSource(src),
  { immediate: true },
)

interface ImageEvent {
  currentTarget: { dataset: { requestId: number | string } }
}

function handleLoad(event: Event) {
  const imageEvent = event as Event & ImageEvent
  if (state.loaded(Number(imageEvent.currentTarget.dataset.requestId))) emit('load', event)
}

function handleError(event: Event) {
  const imageEvent = event as Event & ImageEvent
  if (state.failed(Number(imageEvent.currentTarget.dataset.requestId))) emit('error', event)
}
</script>

<template>
  <view class="app-image" :class="{ 'app-image--transparent': transparent }">
    <image
      v-for="request in requests"
      :key="request.id"
      class="app-image__image"
      :class="{
        'app-image__image--loaded': state.status === 'loaded',
        'app-image__image--fade': fade && state.animate,
      }"
      :src="request.src"
      :mode="mode"
      :lazy-load="lazyLoad"
      :style="imageStyle"
      :data-request-id="request.id"
      @load="handleLoad"
      @error="handleError"
    />
    <view v-if="state.status === 'error'" class="app-image__error">
      <text class="app-image__message">图片加载失败</text>
      <view class="app-image__retry" role="button" aria-label="重试图片" @tap.stop="state.retry()">
        <text>重试</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.app-image {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: inherit;
  background: #f5ebe3;
}
.app-image--transparent {
  background: transparent;
}
.app-image__image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
}
.app-image__image--fade {
  transition: opacity 160ms ease;
}
.app-image__image--loaded {
  opacity: 1;
}
.app-image__error {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  padding: 8rpx;
  color: #a58d82;
  text-align: center;
}
.app-image__message {
  font-size: 20rpx;
}
.app-image__retry {
  padding: 6rpx 16rpx;
  border-radius: 999rpx;
  background: #ffecde;
  color: #d97252;
  font-size: 22rpx;
}
</style>
