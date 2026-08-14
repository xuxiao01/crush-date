<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { onReachBottom, onShow } from '@dcloudio/uni-app'
import { storeToRefs } from 'pinia'
import BasePage from '@/components/BasePage/index.vue'
import CustomNavbar from '@/components/CustomNavbar/index.vue'
import PlaceCollectCard from '@/components/PlaceCollectCard/index.vue'
import { useContentConfigStore } from '@/stores/contentConfig'
import { usePlacesStore } from '@/stores/places'
import type { CityCode, PlaceCategoryId } from '@/types/content'

type PlaceTab = 'wishlist' | 'visited'
type PlaceCategoryFilter = 'all' | PlaceCategoryId

const placesStore = usePlacesStore()
const configStore = useContentConfigStore()
const {
  list,
  total,
  loadingInitial,
  loadingMore,
  error,
  loadMoreError,
  hasMore,
  unvisitedCount,
  visitedCount,
} = storeToRefs(placesStore)
const {
  cities,
  placeCategories,
  currentCityCode,
  currentCityName,
  error: configError,
} = storeToRefs(configStore)

const activeTab = ref<PlaceTab>('wishlist')
const keyword = ref('')
const submittedKeyword = ref('')
const selectedCategory = ref<PlaceCategoryFilter>('all')
const showCitySheet = ref(false)
const showCategorySheet = ref(false)
let searchTimer: ReturnType<typeof setTimeout> | undefined

const cityActions = computed(() =>
  cities.value.map((city) => ({ name: city.name, code: city.code })),
)
const categoryActions = computed(() =>
  placeCategories.value.map((category) => ({
    name: category.name,
    value: category.filterOnly ? ('all' as const) : category.id,
  })),
)
const selectedCategoryName = computed(() =>
  selectedCategory.value === 'all'
    ? placeCategories.value.find((category) => category.filterOnly)?.name || '全部分类'
    : configStore.placeCategoryName(selectedCategory.value) || '全部分类',
)
const hasActiveFilter = computed(
  () => Boolean(submittedKeyword.value) || selectedCategory.value !== 'all',
)
const summaryText = computed(
  () =>
    `${currentCityName.value} · ${total.value} 个${activeTab.value === 'wishlist' ? '想去' : '去过'}`,
)
const emptyTitle = computed(() => {
  if (submittedKeyword.value) return '没有找到相关地点'
  if (selectedCategory.value !== 'all') return `${selectedCategoryName.value}暂无地点`
  return activeTab.value === 'wishlist' ? '还没有想去的地点' : '还没有去过的地点'
})
const emptyDescription = computed(() => {
  if (submittedKeyword.value) return '换个关键词试试看'
  if (selectedCategory.value !== 'all') return '选择其他分类看看吧'
  return activeTab.value === 'wishlist'
    ? '点击右上角加号，收集下一个想去的地点'
    : '去过之后来这里留下记录'
})

function currentQuery() {
  return {
    cityCode: currentCityCode.value,
    visited: activeTab.value === 'visited',
    categoryId: selectedCategory.value === 'all' ? undefined : selectedCategory.value,
    keyword: submittedKeyword.value || undefined,
  }
}

async function refreshPlaces(refreshCounts = false) {
  const query = currentQuery()
  const result = placesStore.resetAndFetchPlaces(query)
  if (refreshCounts) void placesStore.fetchStatusCounts(query.cityCode)
  return result
}

async function retryPage() {
  if (configError.value) await configStore.loadConfig(true)
  await refreshPlaces(true)
}

onShow(async () => {
  await configStore.loadConfig()
  await refreshPlaces(true)
})

onReachBottom(() => void placesStore.loadMorePlaces())

watch(keyword, (value) => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    const normalized = value.trim().slice(0, 50)
    if (normalized === submittedKeyword.value) return
    submittedKeyword.value = normalized
    void refreshPlaces()
  }, 300)
})

onBeforeUnmount(() => {
  if (searchTimer) clearTimeout(searchTimer)
})

function createPlace() {
  const category = selectedCategory.value === 'all' ? '' : `&categoryId=${selectedCategory.value}`
  uni.navigateTo({ url: `/pages/content/create?kind=place${category}` })
}

function selectTab(tab: PlaceTab) {
  if (activeTab.value === tab) return
  activeTab.value = tab
  void refreshPlaces()
}

function clearSearch() {
  if (searchTimer) clearTimeout(searchTimer)
  keyword.value = ''
  if (!submittedKeyword.value) return
  submittedKeyword.value = ''
  void refreshPlaces()
}

function clearFilters() {
  if (searchTimer) clearTimeout(searchTimer)
  keyword.value = ''
  submittedKeyword.value = ''
  selectedCategory.value = 'all'
  void refreshPlaces()
}

function retryLoadMore() {
  void placesStore.loadMorePlaces()
}

function getCategoryName(categoryId: PlaceCategoryId | undefined) {
  return categoryId ? configStore.placeCategoryName(categoryId) : ''
}

function onCitySelect({ item }: { item: { name: string; code: CityCode }; index: number }) {
  if (item.code === currentCityCode.value) return
  configStore.setCurrentCity(item.code)
  void refreshPlaces(true)
}

function onCategorySelect({
  item,
}: {
  item: { name: string; value: PlaceCategoryFilter }
  index: number
}) {
  if (selectedCategory.value === item.value) return
  selectedCategory.value = item.value
  void refreshPlaces()
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
      <view class="toolbar">
        <view
          class="toolbar-button toolbar-button--city"
          hover-class="toolbar-button--hover"
          @tap="showCitySheet = true"
        >
          <view class="location-pin"><view class="location-pin__dot" /></view>
          <text class="toolbar-button__text">{{ currentCityName }}</text>
          <text class="toolbar-button__arrow">⌄</text>
        </view>

        <view class="search">
          <view class="search__icon" />
          <input
            v-model="keyword"
            class="search__input"
            type="text"
            confirm-type="search"
            maxlength="50"
            placeholder="搜索想去的地点"
            placeholder-class="search__placeholder"
          />
          <view
            v-if="keyword"
            class="search__clear"
            hover-class="search__clear--hover"
            @tap="clearSearch"
          >
            <text>×</text>
          </view>
        </view>

        <view
          class="toolbar-button toolbar-button--category"
          hover-class="toolbar-button--hover"
          @tap="showCategorySheet = true"
        >
          <view class="category-icon">
            <view v-for="index in 4" :key="index" class="category-icon__dot" />
          </view>
          <text class="toolbar-button__text">{{ selectedCategoryName }}</text>
        </view>
      </view>

      <view class="tabs-section">
        <view class="tabs">
          <view
            class="tabs__item"
            :class="{ 'tabs__item--active': activeTab === 'wishlist' }"
            @tap="selectTab('wishlist')"
          >
            <text>想去 {{ unvisitedCount }}</text>
          </view>
          <view
            class="tabs__item"
            :class="{ 'tabs__item--active': activeTab === 'visited' }"
            @tap="selectTab('visited')"
          >
            <text>去过 {{ visitedCount }}</text>
          </view>
        </view>
      </view>

      <text v-if="!loadingInitial && !error" class="summary">{{ summaryText }}</text>

      <view v-if="loadingInitial" class="grid grid--skeleton">
        <view v-for="index in 6" :key="index" class="skeleton-card">
          <view class="skeleton-card__image" />
          <view class="skeleton-card__line skeleton-card__line--title" />
          <view class="skeleton-card__line skeleton-card__line--short" />
          <view class="skeleton-card__pill" />
        </view>
      </view>

      <view v-else-if="error || configError" class="state-card">
        <text class="state-card__title">加载失败了</text>
        <text class="state-card__description">{{ error || configError }}</text>
        <view class="state-card__button" hover-class="state-card__button--hover" @tap="retryPage">
          <text>重新加载</text>
        </view>
      </view>

      <view v-else-if="list.length === 0" class="state-card">
        <text class="state-card__title">{{ emptyTitle }}</text>
        <text class="state-card__description">{{ emptyDescription }}</text>
        <view
          v-if="hasActiveFilter"
          class="state-card__button"
          hover-class="state-card__button--hover"
          @tap="clearFilters"
        >
          <text>清空搜索</text>
        </view>
      </view>

      <template v-else>
        <view class="grid">
          <view
            v-for="item in list"
            :key="item.id"
            class="grid__item"
            :class="{
              'grid__item--wishlist': activeTab === 'wishlist',
              'grid__item--visited': activeTab === 'visited',
            }"
          >
            <PlaceCollectCard
              class="grid__card"
              :item="item"
              :category-name="getCategoryName(item.categoryId)"
            />
          </view>
        </view>

        <view v-if="loadingMore" class="list-end">
          <text class="list-end__text">正在加载更多…</text>
        </view>
        <view v-else-if="loadMoreError" class="list-end" @tap="retryLoadMore">
          <text class="list-end__text">加载失败，点击重试</text>
        </view>
        <view v-else-if="!hasMore" class="list-end">
          <view class="list-end__line" />
          <text class="list-end__text">已经到底啦</text>
          <view class="list-end__line" />
        </view>
      </template>
    </view>

    <wd-action-sheet
      v-model="showCitySheet"
      :actions="cityActions"
      cancel-text="取消"
      @select="onCitySelect"
    />
    <wd-action-sheet
      v-model="showCategorySheet"
      :actions="categoryActions"
      cancel-text="取消"
      @select="onCategorySelect"
    />
  </BasePage>
</template>

<style lang="scss" scoped>
.navbar-add {
  display: flex;
  width: 34px;
  height: 34px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #ff7957;
  box-shadow: 0 6rpx 16rpx rgba(255, 121, 87, 0.24);
  transition:
    opacity 160ms ease,
    transform 160ms ease;
}

.navbar-add--hover {
  opacity: 0.78;
  transform: scale(0.96);
}

.navbar-add__icon {
  color: #ffffff;
  font-size: 27px;
  font-weight: 300;
  line-height: 1;
  transform: translateY(-1px);
}

.go {
  margin: 0 calc(16rpx - #{$page-padding});
  padding: 16rpx 16rpx 56rpx;
  box-sizing: border-box;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 14rpx;
  width: 100%;
}

.toolbar-button,
.search {
  height: 68rpx;
  border: 2rpx solid #eedfd5;
  border-radius: 999rpx;
  background: rgba(255, 253, 250, 0.96);
  box-shadow: 0 4rpx 12rpx rgba(96, 66, 46, 0.03);
}

.toolbar-button {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  padding: 0 16rpx;
  transition: background 150ms ease;
}

.toolbar-button--hover {
  background: #fff3eb;
}

.toolbar-button--city {
  width: 148rpx;
}

.toolbar-button--category {
  width: 184rpx;
}

.toolbar-button__text {
  color: #3f3935;
  font-size: 25rpx;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
}

.toolbar-button__arrow {
  color: #6f6762;
  font-size: 22rpx;
  line-height: 1;
  transform: translateY(-2rpx);
}

.location-pin {
  position: relative;
  width: 22rpx;
  height: 28rpx;
  flex-shrink: 0;
  border-radius: 50% 50% 50% 0;
  background: #ff7656;
  transform: rotate(-45deg);
}

.location-pin__dot {
  position: absolute;
  top: 7rpx;
  left: 7rpx;
  width: 8rpx;
  height: 8rpx;
  border-radius: 50%;
  background: #ffffff;
}

.search {
  position: relative;
  display: flex;
  flex: 1;
  min-width: 0;
  align-items: center;
  padding: 0 54rpx 0 22rpx;
}

.search__icon {
  position: relative;
  width: 34rpx;
  height: 34rpx;
  flex-shrink: 0;
}

.search__icon::before {
  position: absolute;
  top: 3rpx;
  left: 2rpx;
  width: 19rpx;
  height: 19rpx;
  border: 3rpx solid #8b8783;
  border-radius: 50%;
  content: '';
}

.search__icon::after {
  position: absolute;
  right: 3rpx;
  bottom: 4rpx;
  width: 13rpx;
  height: 3rpx;
  border-radius: 999rpx;
  background: #8b8783;
  content: '';
  transform: rotate(45deg);
  transform-origin: right center;
}

.search__input {
  flex: 1;
  min-width: 0;
  height: 64rpx;
  color: #33302e;
  font-size: 24rpx;
  line-height: 64rpx;
}

.search__placeholder {
  color: #aaa39e;
  font-size: 24rpx;
}

.search__clear {
  position: absolute;
  top: 50%;
  right: 12rpx;
  display: flex;
  width: 38rpx;
  height: 38rpx;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #eee7e2;
  color: #817b77;
  font-size: 28rpx;
  line-height: 1;
  transform: translateY(-50%);
}

.search__clear--hover {
  opacity: 0.65;
}

.category-icon {
  display: grid;
  width: 26rpx;
  height: 26rpx;
  flex-shrink: 0;
  grid-template-columns: repeat(2, 1fr);
  gap: 4rpx;
}

.category-icon__dot {
  border-radius: 4rpx;
  background: #ff7656;
}

.tabs-section {
  margin-top: 24rpx;
}

.tabs {
  display: flex;
  height: 78rpx;
  overflow: hidden;
  border: 2rpx solid #f2ded0;
  border-radius: 20rpx;
  background: #fffaf6;
  box-shadow: 0 5rpx 14rpx rgba(116, 75, 48, 0.04);
}

.tabs__item {
  position: relative;
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  color: #5f5a57;
  font-size: 28rpx;
  font-weight: 500;
}

.tabs__item:first-child {
  border-right: 1rpx solid #f1e1d7;
}

.tabs__item--active {
  color: #ff7656;
  font-weight: 700;
  background: linear-gradient(180deg, rgba(255, 243, 236, 0.7), rgba(255, 250, 246, 0));
}

.tabs__item--active::after {
  position: absolute;
  right: 16rpx;
  bottom: 0;
  left: 16rpx;
  height: 5rpx;
  border-radius: 999rpx;
  background: #ff7656;
  content: '';
}

.summary {
  display: block;
  margin: 20rpx 10rpx 18rpx;
  color: #3d3936;
  font-size: 27rpx;
  font-weight: 500;
  line-height: 1.4;
}

.grid {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  width: 100%;
}

.grid__item {
  display: flex;
  width: 50%;
  min-width: 0;
  margin-bottom: 20rpx;
  box-sizing: border-box;
}

.grid__item--wishlist {
  height: 400rpx;
}

.grid__item--visited {
  height: 480rpx;
}

.grid__item:nth-child(odd) {
  padding-right: 10rpx;
}

.grid__item:nth-child(even) {
  padding-left: 10rpx;
}

.grid__card {
  display: block;
  width: 100%;
  min-width: 0;
  height: 100%;
}

.grid--skeleton {
  margin-top: 18rpx;
}

.skeleton-card {
  width: calc(50% - 10rpx);
  height: 400rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
  border: 2rpx solid #f2e7df;
  border-radius: 22rpx;
  background: #fffdfb;
}

.skeleton-card:nth-child(odd) {
  margin-right: 20rpx;
}

.skeleton-card__image,
.skeleton-card__line,
.skeleton-card__pill {
  background: linear-gradient(90deg, #f4ebe5 25%, #fff8f3 50%, #f4ebe5 75%);
  background-size: 220% 100%;
  animation: skeleton-shimmer 1.4s ease-in-out infinite;
}

.skeleton-card__image {
  width: 100%;
  height: 255rpx;
}

.skeleton-card__line {
  height: 22rpx;
  margin: 18rpx 18rpx 0;
  border-radius: 999rpx;
}

.skeleton-card__line--title {
  width: 68%;
}

.skeleton-card__line--short {
  width: 44%;
  height: 16rpx;
  margin-top: 12rpx;
}

.skeleton-card__pill {
  width: 64rpx;
  height: 34rpx;
  margin: 14rpx 18rpx 0;
  border-radius: 999rpx;
}

.state-card {
  display: flex;
  min-height: 420rpx;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 48rpx 32rpx;
  text-align: center;
}

.state-card__title {
  color: #4f4742;
  font-size: 30rpx;
  font-weight: 600;
}

.state-card__description {
  margin-top: 10rpx;
  color: #a1948b;
  font-size: 24rpx;
}

.state-card__button {
  display: flex;
  min-width: 170rpx;
  height: 66rpx;
  align-items: center;
  justify-content: center;
  margin-top: 26rpx;
  padding: 0 28rpx;
  border: 2rpx solid #ffc8b3;
  border-radius: 999rpx;
  background: #fff7f1;
  color: #ee704f;
  font-size: 25rpx;
  font-weight: 600;
}

.state-card__button--hover {
  opacity: 0.7;
}

.list-end {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18rpx;
  padding: 24rpx 24rpx 8rpx;
}

.list-end__line {
  width: 76rpx;
  height: 1rpx;
  background: #eadfd7;
}

.list-end__text {
  color: #b0a59e;
  font-size: 22rpx;
}

@keyframes skeleton-shimmer {
  0% {
    background-position: 100% 0;
  }

  100% {
    background-position: -100% 0;
  }
}
</style>
