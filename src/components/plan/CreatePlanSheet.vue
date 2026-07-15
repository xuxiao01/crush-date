<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue'
import DatePickerSheet from '@/components/plan/DatePickerSheet.vue'
import { usePlansStore } from '@/stores/plans'
import { formatZhDate, toPlanDateString } from '@/utils/planDate'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  'update:modelValue': [boolean]
  created: [string]
  conflict: []
}>()

const plansStore = usePlansStore()
const date = ref(toPlanDateString())
const note = ref('')
const showDate = ref(false)
let tabBarHidden = false

function hidePageTabBar() {
  if (tabBarHidden) return
  tabBarHidden = true
  uni.hideTabBar({
    animation: false,
    fail: () => {
      tabBarHidden = false
    },
  })
}

function restorePageTabBar() {
  if (!tabBarHidden) return
  tabBarHidden = false
  uni.showTabBar({ animation: false })
}

watch(() => props.modelValue, (open) => {
  if (!open) {
    restorePageTabBar()
    return
  }
  hidePageTabBar()
  reset()
})

onUnmounted(() => {
  restorePageTabBar()
})

function reset() {
  date.value = toPlanDateString()
  note.value = ''
}

function close() {
  emit('update:modelValue', false)
}

function submit() {
  const result = plansStore.createActive({ date: date.value, note: note.value })
  if (!result.ok) {
    if (result.reason === 'active_exists') emit('conflict')
    else uni.showToast({ title: '请选择今天或以后的日期', icon: 'none' })
    return
  }
  close()
  reset()
  emit('created', result.plan.id)
}
</script>

<template>
  <view v-if="modelValue" class="sheet-mask" @tap="close">
    <view class="sheet" @tap.stop>
      <text class="sheet__title">新建本次计划</text>
      <text class="sheet__hint">先定下出发的日子，安排可以慢慢补齐。</text>
      <view class="field" @tap="showDate = true">
        <text class="field__label">计划日期</text>
        <text class="field__value">{{ formatZhDate(date) }} ›</text>
      </view>
      <view class="field field--input">
        <text class="field__label">一句备注（可选）</text>
        <input v-model="note" class="field__input" maxlength="40" placeholder="希望那天天气刚好……" />
      </view>
      <view class="sheet__btn" hover-class="sheet__btn--hover" @tap="submit">
        <text class="sheet__btn-text">创建并打开</text>
      </view>
    </view>
  </view>
  <DatePickerSheet
    v-model="showDate"
    :value="date"
    :min-date="toPlanDateString()"
    @confirm="(value) => (date = value)"
  />
</template>

<style lang="scss" scoped>
.sheet-mask { position: fixed; inset: 0; z-index: 900; background: rgba(40, 24, 16, 0.35); display: flex; align-items: flex-end; }
.sheet { width: 100%; padding: 32rpx 28rpx calc(28rpx + env(safe-area-inset-bottom)); border-radius: 28rpx 28rpx 0 0; background: #fffaf6; box-sizing: border-box; animation: slide-up 220ms ease; }
@keyframes slide-up { from { transform: translateY(40%); } to { transform: translateY(0); } }
.sheet__title { display: block; font-size: 34rpx; font-weight: 700; color: #2f2f2f; }
.sheet__hint { display: block; margin: 10rpx 0 28rpx; font-size: 24rpx; color: #9a7a66; }
.field { display: flex; align-items: center; justify-content: space-between; gap: 16rpx; min-height: 88rpx; padding: 0 24rpx; margin-bottom: 16rpx; border-radius: 20rpx; background: #fff; border: 2rpx solid #ffe4d2; box-sizing: border-box; }
.field--input { flex-direction: column; align-items: stretch; justify-content: center; padding: 18rpx 24rpx; gap: 8rpx; }
.field__label { font-size: 24rpx; color: #9a6a4a; }
.field__value { font-size: 28rpx; font-weight: 500; color: #2f2f2f; }
.field__input { width: 100%; font-size: 28rpx; color: #2f2f2f; }
.sheet__btn { margin-top: 20rpx; height: 92rpx; border-radius: 999rpx; display: flex; align-items: center; justify-content: center; background: linear-gradient(90deg, #ff8a55, #ff8f9d); }
.sheet__btn--hover { transform: scale(0.98); }
.sheet__btn-text { font-size: 30rpx; font-weight: 600; color: #fff; }
</style>
