<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { getPoiSuggestions } from '@/api/content'
import { ApiError } from '@/api/index'
import type { CityCode, ContentLocation, PoiSuggestion } from '@/types/content'

const props = defineProps<{
  modelValue: ContentLocation | null
  cityCode: CityCode
  initialKeyword: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: ContentLocation | null]
}>()

const expanded = ref(Boolean(props.modelValue))
const keyword = ref('')
const suggestions = ref<PoiSuggestion[]>([])
const loading = ref(false)
const searched = ref(false)
const error = ref('')
let debounceTimer: ReturnType<typeof setTimeout> | undefined
let requestGeneration = 0

function resetSearchState() {
  suggestions.value = []
  searched.value = false
  error.value = ''
}

function openPicker() {
  expanded.value = true
  if (!keyword.value && props.initialKeyword.trim().length >= 2) {
    keyword.value = props.initialKeyword.trim().slice(0, 50)
    scheduleSearch()
  }
}

function closePicker(force = false) {
  if (props.modelValue && !force) return
  requestGeneration += 1
  expanded.value = false
  keyword.value = ''
  resetSearchState()
}

function handleInput() {
  if (keyword.value.length > 50) keyword.value = keyword.value.slice(0, 50)
  scheduleSearch()
}

function scheduleSearch() {
  if (debounceTimer) clearTimeout(debounceTimer)
  const normalized = keyword.value.trim()
  if (normalized.length < 2) {
    requestGeneration += 1
    loading.value = false
    resetSearchState()
    return
  }
  debounceTimer = setTimeout(() => void search(), 400)
}

function getSearchError(searchError: unknown): string {
  if (searchError instanceof ApiError) {
    if (searchError.statusCode === 400) return searchError.message || '搜索关键词不符合要求'
    if (searchError.statusCode === 429) return '搜索过于频繁，请稍后再试'
    if ([502, 503, 504].includes(searchError.statusCode)) return '地图服务暂时不可用，请稍后重试'
    return searchError.message
  }
  return '网络连接失败，请检查网络后重试'
}

async function search() {
  const normalized = keyword.value.trim().slice(0, 50)
  if (normalized.length < 2) return

  const generation = ++requestGeneration
  loading.value = true
  error.value = ''
  searched.value = false
  try {
    const response = await getPoiSuggestions(props.cityCode, normalized)
    if (generation !== requestGeneration) return
    suggestions.value = response.list
    searched.value = true
  } catch (searchError) {
    if (generation !== requestGeneration) return
    suggestions.value = []
    error.value = getSearchError(searchError)
  } finally {
    if (generation === requestGeneration) loading.value = false
  }
}

function selectSuggestion(suggestion: PoiSuggestion) {
  emit('update:modelValue', {
    provider: suggestion.provider,
    poiId: suggestion.poiId,
    title: suggestion.title,
    address: suggestion.address,
    latitude: suggestion.latitude,
    longitude: suggestion.longitude,
    adcode: suggestion.adcode,
  })
  keyword.value = suggestion.title
  suggestions.value = []
  searched.value = false
  error.value = ''
}

function replaceLocation() {
  emit('update:modelValue', null)
  expanded.value = true
  scheduleSearch()
}

function clearLocation() {
  emit('update:modelValue', null)
  closePicker(true)
}

onBeforeUnmount(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
  requestGeneration += 1
})
</script>

<template>
  <view class="location-picker">
    <view class="location-picker__heading">
      <view>
        <text class="location-picker__label">添加地点</text>
        <text class="location-picker__optional">选填</text>
      </view>
      <text v-if="!expanded" class="location-picker__action" @tap="openPicker">＋ 添加</text>
      <text v-else-if="!modelValue" class="location-picker__action" @tap="closePicker">收起</text>
    </view>

    <view v-if="modelValue" class="location-picker__selected">
      <view class="location-picker__pin"><text>●</text></view>
      <view class="location-picker__selected-content">
        <text class="location-picker__title">{{ modelValue.title }}</text>
        <text class="location-picker__address">{{ modelValue.address || '暂无详细地址' }}</text>
      </view>
      <view class="location-picker__selected-actions">
        <text @tap="replaceLocation">更换</text>
        <text class="location-picker__remove" @tap="clearLocation">清除</text>
      </view>
    </view>

    <view v-else-if="expanded" class="location-picker__search">
      <view class="location-picker__input-wrap">
        <text class="location-picker__search-icon">⌕</text>
        <input
          v-model="keyword"
          class="location-picker__input"
          placeholder="搜索具体门店、公园或景点"
          placeholder-class="location-picker__placeholder"
          maxlength="50"
          confirm-type="search"
          @input="handleInput"
          @confirm="search"
        />
      </view>
      <text
        v-if="keyword.trim().length > 0 && keyword.trim().length < 2"
        class="location-picker__tip"
      >
        请输入至少 2 个字符
      </text>
      <text v-else-if="loading" class="location-picker__tip">正在搜索地点…</text>

      <view v-if="error" class="location-picker__feedback">
        <text>{{ error }}</text>
        <view class="location-picker__feedback-actions">
          <text @tap="search">重试</text>
          <text @tap="closePicker">跳过地点</text>
        </view>
      </view>
      <view v-else-if="searched && !suggestions.length" class="location-picker__feedback">
        <text>没有找到匹配地点，可换个关键词或跳过</text>
      </view>

      <view v-if="suggestions.length" class="location-picker__results">
        <view
          v-for="suggestion in suggestions"
          :key="suggestion.poiId"
          class="location-picker__result"
          hover-class="location-picker__result--hover"
          @tap="selectSuggestion(suggestion)"
        >
          <view class="location-picker__result-main">
            <text class="location-picker__title">{{ suggestion.title }}</text>
            <text class="location-picker__district">{{ suggestion.district }}</text>
          </view>
          <text class="location-picker__address">{{ suggestion.address || '暂无详细地址' }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.location-picker {
  padding: 28rpx;
  border-top: 2rpx solid #f4e5dc;
}

.location-picker__heading,
.location-picker__selected,
.location-picker__result-main,
.location-picker__feedback-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.location-picker__label {
  color: #4a3b34;
  font-size: 28rpx;
  font-weight: 600;
}

.location-picker__optional {
  margin-left: 12rpx;
  color: #a89184;
  font-size: 23rpx;
}

.location-picker__action,
.location-picker__feedback-actions text {
  color: #ff765b;
  font-size: 24rpx;
}

.location-picker__selected {
  margin-top: 22rpx;
  padding: 22rpx;
  border: 2rpx solid #ffd2c3;
  border-radius: 20rpx;
  background: #fff7f3;
}

.location-picker__pin {
  flex: 0 0 40rpx;
  color: #ff765b;
  font-size: 20rpx;
}

.location-picker__selected-content {
  min-width: 0;
  flex: 1;
}

.location-picker__selected-actions {
  display: flex;
  flex-direction: column;
  flex: 0 0 76rpx;
  align-items: flex-end;
  margin-left: 16rpx;
  color: #ff765b;
  font-size: 23rpx;
}

.location-picker__selected-actions text + text {
  margin-top: 14rpx;
}

.location-picker__remove {
  color: #a89184;
}

.location-picker__search {
  margin-top: 22rpx;
}

.location-picker__input-wrap {
  display: flex;
  height: 82rpx;
  align-items: center;
  padding: 0 24rpx;
  border: 2rpx solid #eadbd3;
  border-radius: 20rpx;
  background: #fff;
  box-sizing: border-box;
}

.location-picker__search-icon {
  margin-right: 14rpx;
  color: #9d8d84;
  font-size: 34rpx;
}

.location-picker__input {
  min-width: 0;
  height: 100%;
  flex: 1;
  color: #4a3b34;
  font-size: 26rpx;
}

.location-picker__placeholder,
.location-picker__tip,
.location-picker__address {
  color: #a99a92;
}

.location-picker__tip {
  display: block;
  padding: 16rpx 4rpx 0;
  font-size: 22rpx;
}

.location-picker__feedback {
  margin-top: 18rpx;
  padding: 20rpx;
  color: #8b776c;
  font-size: 23rpx;
  border-radius: 16rpx;
  background: #faf4f0;
}

.location-picker__feedback-actions {
  justify-content: flex-start;
  margin-top: 16rpx;
}

.location-picker__feedback-actions text + text {
  margin-left: 34rpx;
}

.location-picker__results {
  margin-top: 16rpx;
  overflow: hidden;
  border: 2rpx solid #f0e3dc;
  border-radius: 18rpx;
}

.location-picker__result {
  padding: 20rpx 22rpx;
  background: #fff;
}

.location-picker__result + .location-picker__result {
  border-top: 2rpx solid #f4e8e1;
}

.location-picker__result--hover {
  background: #fff7f3;
}

.location-picker__title {
  overflow: hidden;
  color: #4a3b34;
  font-size: 26rpx;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.location-picker__district {
  flex: 0 0 auto;
  margin-left: 16rpx;
  color: #ff765b;
  font-size: 21rpx;
}

.location-picker__address {
  display: block;
  overflow: hidden;
  margin-top: 8rpx;
  font-size: 22rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
