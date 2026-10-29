<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { onHide, onShow } from '@dcloudio/uni-app'
import type { Plan } from '@/types/plan'
import { toPlanDateString } from '@/utils/planDate'
import {
  buildPlanCalendarMonth,
  groupCompletedPlans,
  planCalendarSummary,
  shiftCalendarMonth,
} from '@/utils/planCalendar'

const props = defineProps<{ plans: Plan[] }>()
const emit = defineEmits<{ select: [id: string] }>()
const weekdays = ['日', '一', '二', '三', '四', '五', '六']
const cursor = ref(toPlanDateString().slice(0, 7))
const grouped = computed(() => groupCompletedPlans(props.plans))
const cells = computed(() => buildPlanCalendarMonth(cursor.value))
const monthLabel = computed(() => {
  const [year, month] = cursor.value.split('-').map(Number)
  return `${year}年${month}月`
})
const canPrev = computed(
  () => Boolean(grouped.value.months.length) && cursor.value > grouped.value.months[0],
)
const canNext = computed(
  () =>
    Boolean(grouped.value.months.length) &&
    cursor.value < grouped.value.months[grouped.value.months.length - 1],
)
const monthCount = computed(() =>
  Object.entries(grouped.value.byDate)
    .filter(([date]) => date.startsWith(`${cursor.value}-`))
    .reduce((total, [, plans]) => total + plans.length, 0),
)
let initialized = false

watch(
  () => grouped.value.months,
  (months) => {
    if (!months.length) {
      cursor.value = toPlanDateString().slice(0, 7)
      initialized = false
      return
    }
    const first = months[0]
    const last = months[months.length - 1]
    if (!initialized) {
      cursor.value = last
      initialized = true
    } else if (cursor.value < first) cursor.value = first
    else if (cursor.value > last) cursor.value = last
  },
  { immediate: true },
)

const showPlans = ref(false)
const menuDate = ref<string | null>(null)
const menuTitle = computed(() =>
  menuDate.value ? menuDate.value.replace(/-/g, '.') : '未标注日期',
)
const menuPlans = computed(() =>
  menuDate.value ? grouped.value.byDate[menuDate.value] || [] : grouped.value.undated,
)
const actions = computed(() =>
  menuPlans.value.map((plan) => ({
    id: plan.id,
    name: plan.title || '过去的计划',
    subname: planCalendarSummary(plan),
  })),
)
let tabBarHidden = false
let pageActive = true
let disposed = false
let opening = false
let openingVersion = 0

function restoreTabBar() {
  if (!tabBarHidden) return
  tabBarHidden = false
  uni.showTabBar({ animation: false })
}

function closeMenu() {
  opening = false
  openingVersion += 1
  showPlans.value = false
}

function afterClosed() {
  if (!showPlans.value && !opening) restoreTabBar()
}

function openMenu(date: string | null) {
  if (opening || showPlans.value) return
  menuDate.value = date
  if (!menuPlans.value.length) return
  opening = true
  const version = ++openingVersion
  uni.hideTabBar({
    animation: false,
    success: () => {
      tabBarHidden = true
    },
    complete: () => {
      if (version !== openingVersion) {
        if (!opening && !showPlans.value) restoreTabBar()
        return
      }
      opening = false
      if (!disposed && pageActive && menuPlans.value.length) showPlans.value = true
      else restoreTabBar()
    },
  })
}

function pickDate(date?: string) {
  if (!date) return
  const plans = grouped.value.byDate[date] || []
  if (plans.length === 1) emit('select', plans[0].id)
  else if (plans.length > 1) openMenu(date)
}

function selectPlan({ item }: { item: { id: string } }) {
  if (!menuPlans.value.some((plan) => plan.id === item.id)) return
  closeMenu()
  emit('select', item.id)
}

function moveMonth(offset: number) {
  if (offset < 0 ? !canPrev.value : !canNext.value) return
  cursor.value = shiftCalendarMonth(cursor.value, offset)
}

watch(menuPlans, (plans) => {
  if (!plans.length && (opening || showPlans.value)) closeMenu()
})
onShow(() => {
  pageActive = true
})
onHide(() => {
  pageActive = false
  closeMenu()
  restoreTabBar()
})
onUnmounted(() => {
  disposed = true
  closeMenu()
  restoreTabBar()
})
</script>

<template>
  <view class="past-calendar">
    <view class="past-calendar__header">
      <button
        class="past-calendar__nav"
        aria-label="上个月"
        :disabled="!canPrev"
        @tap="moveMonth(-1)"
      >
        ‹
      </button>
      <view class="past-calendar__heading">
        <text class="past-calendar__month">{{ monthLabel }}</text>
        <text class="past-calendar__count">{{ monthCount }} 次计划留下了回忆</text>
      </view>
      <button
        class="past-calendar__nav"
        aria-label="下个月"
        :disabled="!canNext"
        @tap="moveMonth(1)"
      >
        ›
      </button>
    </view>
    <view class="past-calendar__week">
      <text v-for="day in weekdays" :key="day" class="past-calendar__weekday">{{ day }}</text>
    </view>
    <view class="past-calendar__grid">
      <view v-for="cell in cells" :key="cell.key" class="past-calendar__slot">
        <button
          v-if="cell.date"
          class="past-calendar__day"
          :class="{ 'past-calendar__day--highlight': grouped.byDate[cell.date]?.length }"
          :disabled="!grouped.byDate[cell.date]?.length"
          :aria-label="`${cell.date}，${grouped.byDate[cell.date]?.length || 0}条计划`"
          @tap="pickDate(cell.date)"
        >
          <text>{{ cell.label }}</text>
          <view v-if="grouped.byDate[cell.date]?.length" class="past-calendar__dot" />
        </button>
      </view>
    </view>
    <view class="past-calendar__legend">
      <view class="past-calendar__legend-dot" />
      <text>高亮的日子，藏着我们的回忆</text>
    </view>
    <text v-if="!plans.length" class="past-calendar__empty">完成一次计划后，回忆会留在这里。</text>
    <text v-else-if="!monthCount" class="past-calendar__empty">这个月还没有留下计划</text>
    <button v-if="grouped.undated.length" class="past-calendar__undated" @tap="openMenu(null)">
      未标注日期（{{ grouped.undated.length }}） ›
    </button>
  </view>
  <wd-action-sheet
    :model-value="showPlans"
    :title="menuTitle"
    cancel-text="取消"
    root-portal
    :safe-area-inset-bottom="false"
    :z-index="100"
    custom-style="margin: 0; border-radius: 28rpx 28rpx 0 0; background: #fffaf6; padding-bottom: calc(1px + env(safe-area-inset-bottom));"
    @update:model-value="!$event && closeMenu()"
    @closed="afterClosed"
  >
    <scroll-view class="past-calendar__menu-list" scroll-y>
      <button
        v-for="action in actions"
        :key="action.id"
        class="past-calendar__menu-item"
        @tap="selectPlan({ item: action })"
      >
        <text class="past-calendar__menu-name">{{ action.name }}</text>
        <text class="past-calendar__menu-summary">{{ action.subname }}</text>
      </button>
    </scroll-view>
  </wd-action-sheet>
</template>

<style lang="scss" scoped>
.past-calendar {
  padding: 24rpx;
  border: 2rpx solid #edddd2;
  border-radius: 28rpx;
  background: #fffdfb;
  box-shadow: 0 8rpx 22rpx rgba(104, 70, 48, 0.04);
}
.past-calendar__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}
.past-calendar__heading {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  text-align: center;
}
.past-calendar__month {
  color: #463730;
  font-size: 32rpx;
  font-weight: 600;
}
.past-calendar__count {
  color: #af9c90;
  font-size: 22rpx;
}
.past-calendar__nav,
.past-calendar__day,
.past-calendar__undated {
  margin: 0;
  padding: 0;
  border: 0;
  outline: none;
  background: transparent;
  font-family: inherit;
  line-height: 1;
  &::after {
    border: none;
  }
}
.past-calendar__nav {
  display: flex;
  width: 68rpx;
  height: 68rpx;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #fff0e8;
  font-size: 44rpx;
  color: #e78563;
}
.past-calendar__nav[disabled] {
  color: #d7c9be;
  background: #f7f1ec;
}
.past-calendar__week,
.past-calendar__grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
}
.past-calendar__weekday {
  height: 52rpx;
  text-align: center;
  font-size: 23rpx;
  color: #b3a196;
}
.past-calendar__slot {
  display: flex;
  height: 80rpx;
  align-items: center;
  justify-content: center;
}
.past-calendar__day {
  position: relative;
  display: flex;
  width: 64rpx;
  height: 64rpx;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #aa9b91;
  font-size: 28rpx;
}
.past-calendar__day[disabled] {
  color: #aa9b91;
  background: transparent;
}
.past-calendar__day--highlight {
  padding-bottom: 6rpx;
  background: linear-gradient(135deg, #ff956c, #ff8695);
  box-shadow: 0 6rpx 12rpx rgba(255, 143, 112, 0.16);
  color: #fff;
  font-weight: 600;
}
.past-calendar__dot {
  position: absolute;
  bottom: 8rpx;
  left: calc(50% - 3rpx);
  width: 6rpx;
  height: 6rpx;
  border-radius: 50%;
  background: #fff;
}
.past-calendar__legend {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #f3eae4;
  color: #b3a196;
  font-size: 22rpx;
}
.past-calendar__legend-dot {
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background: #ff9b80;
}
.past-calendar__empty {
  display: block;
  padding: 24rpx 4rpx 0;
  font-size: 24rpx;
  color: #a59489;
  text-align: center;
}
.past-calendar__undated {
  display: block;
  width: 100%;
  padding-top: 28rpx;
  color: #d47c5f;
  font-size: 24rpx;
  text-align: center;
}
.past-calendar__menu-list {
  max-height: 45vh;
}
.past-calendar__menu-item {
  display: block;
  width: 100%;
  margin: 0;
  padding: 24rpx 32rpx;
  border: 0;
  background: transparent;
  line-height: 1.4;
  text-align: left;
  &::after {
    border: 0;
  }
}
.past-calendar__menu-name {
  display: block;
  color: #463730;
  font-size: 29rpx;
  font-weight: 600;
}
.past-calendar__menu-summary {
  display: block;
  margin-top: 8rpx;
  overflow: hidden;
  color: #a58d82;
  font-size: 23rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
