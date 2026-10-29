<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { onHide, onShow } from '@dcloudio/uni-app'
import type { CityCode, CityOption } from '@/types/content'
import { CITY_PROVINCES, groupCitiesByProvince, type ProvinceCode } from '@/utils/cityRegions'

const props = defineProps<{
  modelValue: boolean
  cities: CityOption[]
  currentCityCode: CityCode
}>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  select: [code: CityCode]
}>()

const visible = ref(false)
const selectedProvinceCode = ref<ProvinceCode | null>(null)
const scrollTop = ref(0)
const regions = computed(() => groupCitiesByProvince(props.cities))
const selectedProvince = computed(() =>
  regions.value.find((region) => region.code === selectedProvinceCode.value),
)
const currentProvinceCode = computed(() => CITY_PROVINCES[props.currentCityCode])
let tabBarHidden = false
let pageActive = true
let disposed = false

function restoreTabBar() {
  if (!tabBarHidden) return
  tabBarHidden = false
  uni.showTabBar({ animation: false })
}

function close() {
  visible.value = false
  emit('update:modelValue', false)
}

function afterLeave() {
  // A previous closing animation must not restore the bar under a reopened sheet.
  if (!visible.value && !props.modelValue) restoreTabBar()
}

watch(
  () => props.modelValue,
  (open) => {
    if (!open) {
      visible.value = false
      return
    }
    selectedProvinceCode.value = null
    scrollTop.value = 0
    // Wait for the native tab bar to disappear before placing the sheet at bottom: 0.
    uni.hideTabBar({
      animation: false,
      success: () => {
        tabBarHidden = true
      },
      complete: () => {
        if (!disposed && pageActive && props.modelValue) visible.value = true
        else restoreTabBar()
      },
    })
  },
  { immediate: true },
)

onShow(() => {
  pageActive = true
})
onHide(() => {
  pageActive = false
  close()
  restoreTabBar()
})
onUnmounted(() => {
  disposed = true
  restoreTabBar()
})

function selectProvince(code: ProvinceCode) {
  selectedProvinceCode.value = code
  scrollTop.value = 0
}

function selectCity(code: CityCode) {
  if (!selectedProvince.value?.cities.some((city) => city.code === code)) return
  close()
  emit('select', code)
}
</script>

<template>
  <wd-popup
    :model-value="visible"
    position="bottom"
    root-portal
    :safe-area-inset-bottom="false"
    :z-index="100"
    custom-style="width: 100%; bottom: 0; border-radius: 32rpx 32rpx 0 0; background: #fffaf6; overflow: hidden;"
    @close="close"
    @after-leave="afterLeave"
  >
    <view class="city-picker">
      <view class="city-picker__header">
        <text class="city-picker__title">选择城市</text>
        <button class="city-picker__close" aria-label="关闭城市选择" @tap="close">
          <wd-icon name="close" size="20px" />
        </button>
      </view>
      <view class="city-picker__steps">
        <button
          class="city-picker__step"
          :class="{ 'city-picker__step--active': !selectedProvince }"
          @tap="selectedProvinceCode = null"
        >
          {{ selectedProvince?.name || '选择省份' }}
        </button>
        <text class="city-picker__separator">›</text>
        <text
          class="city-picker__step-label"
          :class="{ 'city-picker__step--active': selectedProvince }"
        >
          选择城市
        </text>
      </view>
      <scroll-view
        :key="selectedProvinceCode || 'provinces'"
        class="city-picker__list"
        scroll-y
        :scroll-top="scrollTop"
      >
        <template v-if="selectedProvince">
          <button
            v-for="city in selectedProvince.cities"
            :key="city.code"
            class="city-picker__option"
            :class="{ 'city-picker__option--selected': city.code === currentCityCode }"
            @tap="selectCity(city.code)"
          >
            <text>{{ city.name }}</text>
            <wd-icon v-if="city.code === currentCityCode" name="check" size="20px" />
          </button>
        </template>
        <template v-else>
          <button
            v-for="region in regions"
            :key="region.code"
            class="city-picker__option"
            :class="{ 'city-picker__option--selected': region.code === currentProvinceCode }"
            @tap="selectProvince(region.code)"
          >
            <text>{{ region.name }}</text>
            <wd-icon name="arrow-right" size="18px" />
          </button>
        </template>
      </scroll-view>
    </view>
  </wd-popup>
</template>

<style lang="scss" scoped>
.city-picker {
  padding: 28rpx 32rpx calc(24rpx + env(safe-area-inset-bottom));
  background: #fffaf6;
}

.city-picker__header,
.city-picker__steps,
.city-picker__option {
  display: flex;
  align-items: center;
}

.city-picker__header,
.city-picker__option {
  justify-content: space-between;
}

.city-picker__title {
  color: #463730;
  font-size: 34rpx;
  font-weight: 600;
}

.city-picker__close,
.city-picker__step,
.city-picker__option {
  border: none;
  outline: none;
  background: transparent;
  font-family: inherit;
  line-height: inherit;

  &::after {
    border: none;
  }
}

.city-picker__close {
  display: flex;
  width: 72rpx;
  height: 72rpx;
  align-items: center;
  justify-content: center;
  margin-right: -12rpx;
  color: #a58d82;
}

.city-picker__steps {
  gap: 20rpx;
  min-height: 88rpx;
  margin-bottom: 12rpx;
  border-bottom: 1rpx solid #f0e4dd;
  font-size: 27rpx;
  color: #a58d82;
}

.city-picker__step {
  margin: 0;
  padding: 20rpx 0;
  color: inherit;
  font-size: inherit;
  text-align: left;
}

.city-picker__step--active {
  color: #e47c5d;
  font-weight: 600;
}

.city-picker__list {
  height: 38vh;
  max-height: 480rpx;
}

.city-picker__option {
  width: 100%;
  min-height: 96rpx;
  margin: 8rpx 0;
  padding: 20rpx 24rpx;
  border-radius: 16rpx;
  color: #463730;
  font-size: 30rpx;
  text-align: left;
}

.city-picker__option--selected {
  color: #d97252;
  background: #ffecde;
  font-weight: 600;
}
</style>
