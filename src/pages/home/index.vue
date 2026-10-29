<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import BasePage from '@/components/BasePage/index.vue'
import CustomNavbar from '@/components/CustomNavbar/index.vue'
import HomeBanner from '@/components/HomeBanner/index.vue'
import HomeListCard from '@/components/HomeListCard/index.vue'
import WeekendInviteModal from '@/components/WeekendInviteModal.vue'
import CityPickerSheet from '@/components/CityPickerSheet/index.vue'
import hotpotImage from '@/assets/素材-透明火锅.png'
import castleImage from '@/assets/素材-透明摩天轮城堡.png'
import { getFoods, getPlaces } from '@/api/content'
import { useContentConfigStore } from '@/stores/contentConfig'
import type { CityCode } from '@/types/content'
import { getStorage, setStorage } from '@/utils/storage'

const configStore = useContentConfigStore()
const { cities, currentCityCode, currentCityName } = storeToRefs(configStore)
const eatTotalCount = ref(0)
const goTotalCount = ref(0)
const showCitySheet = ref(false)
const showInvite = ref(false)
const INVITE_AGREED_STORAGE_KEY = 'crush_date_weekend_invite_agreed_v1'

onShow(async () => {
  showInvite.value = getStorage<boolean>(INVITE_AGREED_STORAGE_KEY) !== true
  await configStore.loadConfig()
  void loadTotals()
})

async function loadTotals() {
  const cityCode = currentCityCode.value
  try {
    const [foods, places] = await Promise.all([
      getFoods({ cityCode, page: 1, pageSize: 1 }, { showError: false }),
      getPlaces({ cityCode, page: 1, pageSize: 1 }, { showError: false }),
    ])
    if (cityCode !== currentCityCode.value) return
    eatTotalCount.value = foods.total
    goTotalCount.value = places.total
  } catch {
    // Keep the previous totals when a background refresh fails.
  }
}

function handleInviteAgreed() {
  setStorage(INVITE_AGREED_STORAGE_KEY, true)
}

function handleCitySwitch() {
  showCitySheet.value = true
}

function onCitySelect(code: CityCode) {
  configStore.setCurrentCity(code)
  void loadTotals()
}
</script>

<template>
  <BasePage>
    <CustomNavbar title="雨间计划" :show-back="false" :show-brand="true" />

    <view class="home">
      <HomeBanner />

      <view class="hero">
        <text class="hero__title">周末去哪玩？</text>
        <text class="hero__subtitle">看看想吃的，看看想去的！</text>
        <view class="hero__location" @tap="handleCitySwitch">
          <text class="hero__location-pin">📍</text>
          <text class="hero__location-city">{{ currentCityName }}</text>
          <text class="hero__location-caret">⌄</text>
        </view>
      </view>

      <view class="list-cards">
        <HomeListCard
          title="想吃清单"
          description="火锅、烤肉、铁锅炖……"
          :count="eatTotalCount"
          :image="hotpotImage"
          theme="food"
          url="/pages/eat/index"
        />
        <HomeListCard
          title="想去清单"
          description="公园、爬山、KTV……"
          :count="goTotalCount"
          :image="castleImage"
          theme="play"
          url="/pages/go/index"
        />
      </view>
    </view>
  </BasePage>

  <CityPickerSheet
    v-model="showCitySheet"
    :cities="cities"
    :current-city-code="currentCityCode"
    @select="onCitySelect"
  />
  <WeekendInviteModal v-model="showInvite" @agreed="handleInviteAgreed" />
</template>

<style lang="scss" scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: 32rpx;
  padding-bottom: 24rpx;
}

.hero {
  display: flex;
  flex-direction: column;
}

.hero__location {
  align-self: flex-start;
  display: flex;
  align-items: center;
  gap: 6rpx;
  height: 64rpx;
  padding: 0 24rpx;
  margin-top: 48rpx;
  border-radius: 999rpx;
  background: #ffecde;
}

.hero__location-pin {
  font-size: 26rpx;
  line-height: 1;
}

.hero__location-city {
  font-size: 28rpx;
  font-weight: 500;
  color: $color-text-primary;
  line-height: 1;
}

.hero__location-caret {
  font-size: 22rpx;
  font-weight: 600;
  color: $color-text-primary;
  line-height: 1;
  transform: translateY(-1rpx);
}

.hero__title {
  margin-bottom: 16rpx;
  font-size: 56rpx;
  font-weight: 700;
  color: #2f2f2f;
  line-height: 1.3;
}

.hero__subtitle {
  font-size: 30rpx;
  font-weight: 400;
  color: $color-text-secondary;
  line-height: 1.4;
}

.list-cards {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 28rpx;
  width: 100%;
  padding: 0 24rpx;
  box-sizing: border-box;
}
</style>
