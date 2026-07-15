<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { parsePlanDate, toPlanDateString } from '@/utils/planDate'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    value: string
    title?: string
    confirmText?: string
    minDate?: string
  }>(),
  {
    title: '选择日期',
    confirmText: '确定',
    minDate: '',
  },
)

const emit = defineEmits<{
  'update:modelValue': [boolean]
  confirm: [string]
}>()

const WEEK = ['日', '一', '二', '三', '四', '五', '六']

const cursor = ref(new Date())
const selected = ref(toPlanDateString())

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    selected.value = props.value || toPlanDateString()
    cursor.value = parsePlanDate(selected.value)
  },
)

const monthLabel = computed(
  () => `${cursor.value.getFullYear()}年${cursor.value.getMonth() + 1}月`,
)

const cells = computed(() => {
  const y = cursor.value.getFullYear()
  const m = cursor.value.getMonth()
  const first = new Date(y, m, 1)
  const startPad = first.getDay()
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const list: Array<{ key: string; label: string; date?: string; muted?: boolean }> = []

  for (let i = 0; i < startPad; i += 1) {
    list.push({ key: `pad-${i}`, label: '', muted: true })
  }
  for (let d = 1; d <= daysInMonth; d += 1) {
    const date = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    list.push({ key: date, label: String(d), date, muted: Boolean(props.minDate && date < props.minDate) })
  }
  return list
})

function prevMonth() {
  cursor.value = new Date(cursor.value.getFullYear(), cursor.value.getMonth() - 1, 1)
}

function nextMonth() {
  cursor.value = new Date(cursor.value.getFullYear(), cursor.value.getMonth() + 1, 1)
}

function pick(date?: string) {
  if (!date) return
  if (props.minDate && date < props.minDate) return
  selected.value = date
}

function close() {
  emit('update:modelValue', false)
}

function confirm() {
  emit('confirm', selected.value)
  close()
}
</script>

<template>
  <view v-if="modelValue" class="sheet-mask" @tap="close">
    <view class="sheet" @tap.stop>
      <text class="sheet__title">{{ title }}</text>

      <view class="cal-nav">
        <text class="cal-nav__btn" @tap="prevMonth">‹</text>
        <text class="cal-nav__label">{{ monthLabel }}</text>
        <text class="cal-nav__btn" @tap="nextMonth">›</text>
      </view>

      <view class="cal-week">
        <text v-for="w in WEEK" :key="w" class="cal-week__item">{{ w }}</text>
      </view>

      <view class="cal-grid">
        <view
          v-for="cell in cells"
          :key="cell.key"
          class="cal-grid__cell"
          :class="{
            'cal-grid__cell--active': cell.date === selected,
            'cal-grid__cell--empty': !cell.date,
            'cal-grid__cell--muted': cell.muted,
          }"
          @tap="pick(cell.date)"
        >
          <text class="cal-grid__text">{{ cell.label }}</text>
        </view>
      </view>

      <view class="sheet__btn" hover-class="sheet__btn--hover" @tap="confirm">
        <text class="sheet__btn-text">{{ confirmText }}</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.sheet-mask {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(40, 24, 16, 0.35);
  display: flex;
  align-items: flex-end;
}

.sheet {
  width: 100%;
  padding: 32rpx 28rpx calc(28rpx + env(safe-area-inset-bottom));
  border-radius: 28rpx 28rpx 0 0;
  background: #fffaf6;
  box-sizing: border-box;
  animation: slide-up 220ms ease;
}

@keyframes slide-up {
  from {
    transform: translateY(40%);
  }
  to {
    transform: translateY(0);
  }
}

.sheet__title {
  display: block;
  margin-bottom: 24rpx;
  font-size: 32rpx;
  font-weight: 700;
  color: #2f2f2f;
}

.cal-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.cal-nav__btn {
  width: 64rpx;
  text-align: center;
  font-size: 40rpx;
  color: #ff8a55;
}

.cal-nav__label {
  font-size: 28rpx;
  font-weight: 600;
  color: #2f2f2f;
}

.cal-week,
.cal-grid {
  display: flex;
  flex-wrap: wrap;
}

.cal-week__item,
.cal-grid__cell {
  width: 14.285%;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.cal-week__item {
  font-size: 22rpx;
  color: #999;
}

.cal-grid__text {
  font-size: 28rpx;
  color: #2f2f2f;
}

.cal-grid__cell--active {
  border-radius: 999rpx;
  background: linear-gradient(135deg, #ff8a55 0%, #ff8f9d 100%);
}

.cal-grid__cell--active .cal-grid__text {
  color: #fff;
  font-weight: 600;
}

.cal-grid__cell--empty {
  pointer-events: none;
}

.cal-grid__cell--muted {
  opacity: 0.28;
  pointer-events: none;
}

.sheet__btn {
  margin-top: 24rpx;
  height: 88rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(90deg, #ff8a55 0%, #ff8f9d 100%);
}

.sheet__btn--hover {
  transform: scale(0.98);
}

.sheet__btn-text {
  font-size: 30rpx;
  font-weight: 600;
  color: #fff;
}
</style>
