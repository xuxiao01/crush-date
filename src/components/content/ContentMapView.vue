<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import type { ContentLocation } from '@/types/content'
import { isValidContentLocation, toMapMarker } from '@/utils/contentLocation'

// #ifdef H5
import { loadTencentMap } from '@/utils/tencentMap'
// #endif

const props = withDefaults(
  defineProps<{
    location: ContentLocation
    interactive?: boolean
  }>(),
  { interactive: false },
)

const emit = defineEmits<{
  activate: []
}>()

const mapId = `content-map-${Math.random().toString(36).slice(2)}`
const mapError = ref('')
const valid = computed(() => isValidContentLocation(props.location))
const markers = computed(() => (valid.value ? [toMapMarker(props.location)] : []))

let mapInstance: { destroy?: () => void } | undefined

async function mountH5Map() {
  // #ifdef H5
  if (!valid.value) {
    mapError.value = '地点坐标不可用'
    return
  }
  mapError.value = ''
  try {
    await nextTick()
    const api = await loadTencentMap(import.meta.env.VITE_TENCENT_MAP_KEY?.trim() || '')
    const container = document.getElementById(mapId)
    if (!container) throw new Error('地图容器加载失败')
    const center = new api.LatLng(props.location.latitude, props.location.longitude)
    mapInstance = new api.Map(container, {
      center,
      zoom: props.interactive ? 16 : 15,
    })
    new api.MultiMarker({
      map: mapInstance,
      styles: {
        location: new api.MarkerStyle({
          width: 32,
          height: 37,
          anchor: { x: 16, y: 36 },
          src: `${import.meta.env.BASE_URL}static/map/location-marker.png`,
        }),
      },
      geometries: [
        {
          id: props.location.poiId,
          styleId: 'location',
          position: center,
          properties: { title: props.location.title },
        },
      ],
    })
  } catch (error) {
    mapError.value = error instanceof Error ? error.message : '地图加载失败'
  }
  // #endif
}

onMounted(() => void mountH5Map())
onBeforeUnmount(() => mapInstance?.destroy?.())
</script>

<template>
  <view class="content-map-view" :class="{ 'content-map-view--interactive': interactive }">
    <!-- #ifdef MP-WEIXIN -->
    <map
      v-if="valid"
      class="content-map-view__canvas"
      :latitude="location.latitude"
      :longitude="location.longitude"
      :markers="markers"
      :scale="interactive ? 16 : 15"
      :enable-scroll="interactive"
      :enable-zoom="interactive"
      :enable-rotate="false"
      :show-location="false"
      @tap="emit('activate')"
    />
    <view v-else class="content-map-view__fallback"><text>地点坐标不可用</text></view>
    <!-- #endif -->

    <!-- #ifdef H5 -->
    <view :id="mapId" class="content-map-view__canvas" @tap="emit('activate')" />
    <view v-if="mapError" class="content-map-view__fallback">
      <text>{{ mapError }}</text>
      <text v-if="mapError.includes('Key')" class="content-map-view__hint">
        请配置 VITE_TENCENT_MAP_KEY
      </text>
      <text v-else class="content-map-view__retry" @tap.stop="mountH5Map">重新加载</text>
    </view>
    <!-- #endif -->
  </view>
</template>

<style lang="scss" scoped>
.content-map-view {
  position: relative;
  width: 100%;
  height: 280rpx;
  overflow: hidden;
  border-radius: 20rpx;
  background: #f5eee9;
}

.content-map-view--interactive {
  height: 860rpx;
  border-radius: 24rpx;
}

.content-map-view__canvas,
.content-map-view__fallback {
  width: 100%;
  height: 100%;
}

.content-map-view__fallback {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #8e7c72;
  font-size: 24rpx;
  background: #f8f2ee;
}

.content-map-view__hint,
.content-map-view__retry {
  margin-top: 12rpx;
  color: #ff765b;
  font-size: 22rpx;
}
</style>
