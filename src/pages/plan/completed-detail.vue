<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import BasePage from '@/components/BasePage/index.vue'
import CustomNavbar from '@/components/CustomNavbar/index.vue'
import DatePickerSheet from '@/components/plan/DatePickerSheet.vue'
import PlanPeriodSection from '@/components/plan/PlanPeriodSection.vue'
import { usePlansStore } from '@/stores/plans'
import type { PlanPeriod } from '@/types/plan'
import { PERIOD_ORDER } from '@/types/plan'
import { formatZhDate, toPlanDateString } from '@/utils/planDate'

const plansStore = usePlansStore()
const planId = ref('')
const showDate = ref(false)
const date = ref(toPlanDateString())
const plan = computed(() => plansStore.getById(planId.value))
const foodRecords = computed(() => plan.value?.items.filter((item) => item.type === 'food') || [])
const placeRecords = computed(() => plan.value?.items.filter((item) => item.type === 'place') || [])

onLoad((query) => {
  plansStore.hydrate()
  planId.value = typeof query?.id === 'string' ? decodeURIComponent(query.id) : ''
})

function itemsOf(period: PlanPeriod) {
  return plan.value?.items.filter((item) => item.period === period).slice().sort((a, b) => a.order - b.order) || []
}
function showConflict() {
  const active = plansStore.activePlan
  uni.showModal({ title: '已有本次计划', content: '请先完成或删除当前的本次计划。', cancelText: '知道了', confirmText: '查看本次计划', success: (res) => { if (res.confirm && active) uni.redirectTo({ url: `/pages/plan/detail?id=${encodeURIComponent(active.id)}` }) } })
}
function requestReplan() {
  if (plansStore.activePlan) { showConflict(); return }
  showDate.value = true
}
function replan(value: string) {
  if (!plan.value) return
  const result = plansStore.replanCompleted(plan.value.id, value)
  if (!result.ok) { if (result.reason === 'active_exists') showConflict(); return }
  uni.redirectTo({ url: `/pages/plan/detail?id=${encodeURIComponent(result.plan.id)}` })
}
</script>

<template>
  <BasePage>
    <CustomNavbar title="那天的记录" :show-back="true" :large-hit="true" />
    <view v-if="plan?.status === 'completed'" class="detail">
      <view class="header"><text class="header__date">{{ formatZhDate(plan.date || '') }}</text><text v-if="plan.note" class="header__note">{{ plan.note }}</text></view>
      <view class="periods"><PlanPeriodSection v-for="period in PERIOD_ORDER" :key="period" :period="period" :items="itemsOf(period)" readonly /></view>
      <view class="memories"><text class="section-title">打卡照片</text><scroll-view v-if="plan.memoryPhotos.length" scroll-x class="photos"><image v-for="(photo, index) in plan.memoryPhotos" :key="`${photo}-${index}`" class="photo" :src="photo" mode="aspectFill" /></scroll-view><text v-else class="empty">那天还没有留下打卡照片</text></view>
      <view class="records"><text class="section-title">吃过和去过</text><view v-if="placeRecords.length" class="record-group"><text class="record-group__label">去过的地方</text><text class="record-group__text">{{ placeRecords.map((item) => item.title).join(' · ') }}</text></view><view v-if="foodRecords.length" class="record-group"><text class="record-group__label">吃过的味道</text><text class="record-group__text">{{ foodRecords.map((item) => item.title).join(' · ') }}</text></view><text v-if="!placeRecords.length && !foodRecords.length" class="empty">那天还没有安排记录</text></view>
    </view>
    <view v-else class="missing"><text>没有找到这条过去的计划</text></view>
    <view v-if="plan?.status === 'completed'" class="footer"><view class="primary" @tap="requestReplan"><text>再计划一次</text></view></view>
    <DatePickerSheet v-model="showDate" :value="date" :min-date="toPlanDateString()" title="什么时候再出发？" confirm-text="创建本次计划" @confirm="replan" />
  </BasePage>
</template>

<style lang="scss" scoped>
.detail { display: flex; flex-direction: column; gap: 34rpx; padding-bottom: 180rpx; }
.header { padding: 32rpx 28rpx; border-radius: 28rpx; background: #eee8e2; border: 2rpx solid #e0d6ce; }
.header__date { display: block; font-size: 40rpx; font-weight: 700; color: #5f554f; }
.header__note { display: block; margin-top: 14rpx; font-size: 26rpx; color: #81746c; }
.periods { display: flex; flex-direction: column; gap: 28rpx; filter: saturate(.72); }
.memories, .records { padding: 26rpx; border-radius: 24rpx; background: #f4efe9; }
.section-title { display: block; margin-bottom: 18rpx; font-size: 29rpx; font-weight: 700; color: #655b55; }
.photos { white-space: nowrap; width: 100%; }
.photo { width: 220rpx; height: 220rpx; margin-right: 14rpx; border-radius: 20rpx; }
.empty { font-size: 24rpx; color: #a09289; }
.record-group { display: flex; flex-direction: column; gap: 8rpx; padding: 14rpx 0; border-bottom: 1rpx solid #e2d8d0; }
.record-group__label { font-size: 23rpx; color: #a08474; }
.record-group__text { font-size: 27rpx; color: #625750; line-height: 1.5; }
.missing { min-height: 45vh; display: flex; align-items: center; justify-content: center; color: #999; }
.footer { position: fixed; left: 0; right: 0; bottom: 0; z-index: 40; padding: 20rpx 28rpx calc(20rpx + env(safe-area-inset-bottom)); background: linear-gradient(180deg, rgba(255,250,246,0), #fffaf6 28%); }
.primary { height: 92rpx; display: flex; align-items: center; justify-content: center; border-radius: 999rpx; background: linear-gradient(90deg, #ff8a55, #ff8f9d); font-size: 29rpx; font-weight: 600; color: #fff; }
</style>
