<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import BasePage from '@/components/BasePage/index.vue'
import CustomNavbar from '@/components/CustomNavbar/index.vue'
import ContentMapView from '@/components/content/ContentMapView.vue'
import { getFoodById, getPlaceById } from '@/api/content'
import { ApiError } from '@/api/index'
import type { ContentItem, ContentType } from '@/types/content'
import { isValidContentLocation, openContentLocationNavigation } from '@/utils/contentLocation'

const kind = ref<ContentType>('food')
const contentId = ref('')
const item = ref<ContentItem>()
const loading = ref(true)
const error = ref('')
const notFound = ref(false)

const location = computed(() => item.value?.location ?? null)
const hasValidLocation = computed(() => isValidContentLocation(location.value))

onLoad((query) => {
  kind.value = query?.kind === 'place' ? 'place' : 'food'
  contentId.value = typeof query?.id === 'string' ? decodeURIComponent(query.id) : ''
  void loadDetail()
})

async function loadDetail() {
  loading.value = true
  error.value = ''
  notFound.value = false
  item.value = undefined
  if (!contentId.value) {
    notFound.value = true
    loading.value = false
    return
  }

  try {
    item.value =
      kind.value === 'food'
        ? await getFoodById(contentId.value, { showError: false })
        : await getPlaceById(contentId.value, { showError: false })
  } catch (loadError) {
    if (loadError instanceof ApiError && loadError.statusCode === 404) notFound.value = true
    else error.value = loadError instanceof Error ? loadError.message : '地点加载失败'
  } finally {
    loading.value = false
  }
}

function goBack() {
  uni.navigateBack()
}

function openNavigation() {
  if (location.value) openContentLocationNavigation(location.value)
}
</script>

<template>
  <BasePage>
    <CustomNavbar title="地点地图" :show-back="true" :show-brand="false" />

    <view v-if="loading" class="map-state"><text>正在加载地点…</text></view>

    <view v-else-if="item && hasValidLocation && location" class="map-page">
      <view class="map-page__heading">
        <text class="map-page__title">{{ location.title }}</text>
        <text class="map-page__address">{{ location.address || '暂无详细地址' }}</text>
      </view>
      <ContentMapView :location="location" :interactive="true" />
      <view
        class="map-page__navigation"
        hover-class="map-page__navigation--hover"
        :hover-stay-time="100"
        @tap="openNavigation"
      >
        <text class="map-page__navigation-text">去导航</text>
      </view>
      <text class="map-page__tip">可拖动和缩放地图查看周边</text>
    </view>

    <view v-else class="map-state">
      <text>{{ notFound ? '内容不存在或已被删除' : error || '这条内容还没有绑定地点' }}</text>
      <view class="map-state__actions">
        <button v-if="error && !notFound" class="map-state__button" @tap="loadDetail">
          重新加载
        </button>
        <button class="map-state__button map-state__button--secondary" @tap="goBack">返回</button>
      </view>
    </view>
  </BasePage>
</template>

<style lang="scss" scoped>
.map-page {
  padding: 12rpx 0 32rpx;
}

.map-page__heading {
  padding: 8rpx 4rpx 24rpx;
}

.map-page__title,
.map-page__address,
.map-page__tip {
  display: block;
}

.map-page__navigation {
  display: flex;
  width: 100%;
  height: 88rpx;
  box-sizing: border-box;
  align-items: center;
  justify-content: center;
  margin-top: 24rpx;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #ff8a61, #ff7188);
}

.map-page__navigation--hover {
  opacity: 0.86;
}

.map-page__navigation-text {
  color: #fff;
  font-size: 28rpx;
  font-weight: 600;
  line-height: 1;
}

.map-page__title {
  color: #3f342f;
  font-size: 34rpx;
  font-weight: 700;
}

.map-page__address {
  margin-top: 8rpx;
  color: #918078;
  font-size: 24rpx;
}

.map-page__tip {
  margin-top: 18rpx;
  color: #a18e84;
  font-size: 22rpx;
  text-align: center;
}

.map-state {
  display: flex;
  min-height: 560rpx;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #8f7d73;
  font-size: 26rpx;
  text-align: center;
}

.map-state__actions {
  display: flex;
  margin-top: 28rpx;
}

.map-state__button {
  min-width: 180rpx;
  margin: 0 10rpx;
  color: #fff;
  font-size: 24rpx;
  border: 0;
  border-radius: 999rpx;
  background: #ff765b;
}

.map-state__button::after {
  border: 0;
}

.map-state__button--secondary {
  color: #6d5b52;
  background: #f5ece7;
}
</style>
