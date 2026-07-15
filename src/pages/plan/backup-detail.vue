<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import BasePage from '@/components/BasePage/index.vue'
import CustomNavbar from '@/components/CustomNavbar/index.vue'
import BackupPlanSheet from '@/components/plan/BackupPlanSheet.vue'
import DatePickerSheet from '@/components/plan/DatePickerSheet.vue'
import PlanScheduleEditor from '@/components/plan/PlanScheduleEditor.vue'
import { usePlansStore } from '@/stores/plans'
import { toPlanDateString } from '@/utils/planDate'

const plansStore = usePlansStore()
const planId = ref('')
const showEdit = ref(false)
const showDate = ref(false)
const showMenu = ref(false)
const date = ref(toPlanDateString())
const plan = computed(() => plansStore.getById(planId.value))

onLoad((query) => {
  plansStore.hydrate()
  planId.value = typeof query?.id === 'string' ? decodeURIComponent(query.id) : ''
})

function showConflict() {
  const active = plansStore.activePlan
  uni.showModal({
    title: '已有本次计划',
    content: '请先完成或删除当前的本次计划。',
    cancelText: '知道了',
    confirmText: '查看本次计划',
    success: (res) => {
      if (res.confirm && active) uni.redirectTo({ url: `/pages/plan/detail?id=${encodeURIComponent(active.id)}` })
    },
  })
}
function requestActivate() {
  if (plansStore.activePlan) { showConflict(); return }
  date.value = toPlanDateString()
  showDate.value = true
}
function activate(value: string) {
  if (!plan.value) return
  const result = plansStore.activateBackup(plan.value.id, value)
  if (!result.ok) {
    if (result.reason === 'active_exists') showConflict()
    else uni.showToast({ title: '设为本次计划失败', icon: 'none' })
    return
  }
  uni.redirectTo({ url: `/pages/plan/detail?id=${encodeURIComponent(result.plan.id)}` })
}
function deletePlan() {
  if (!plan.value) return
  plansStore.deletePlan(plan.value.id)
  uni.switchTab({ url: '/pages/plan/index' })
}
</script>

<template>
  <BasePage>
    <CustomNavbar title="备用计划" :show-back="true" :large-hit="true">
      <template #right><view class="more" @tap="showMenu = true"><text>⋯</text></view></template>
    </CustomNavbar>
    <view v-if="plan?.status === 'backup'" class="detail">
      <view class="header">
        <text class="header__title">{{ plan.title }}</text>
        <text class="header__tags">{{ plan.scenarioText }}</text>
        <text v-if="plan.note" class="header__note">{{ plan.note }}</text>
      </view>
      <PlanScheduleEditor :plan-id="plan.id" />
    </view>
    <view v-else class="missing"><text>没有找到这个备用计划</text></view>
    <view v-if="plan?.status === 'backup'" class="footer">
      <view class="secondary" @tap="showEdit = true"><text>编辑计划</text></view>
      <view class="primary" @tap="requestActivate"><text>设为本次计划</text></view>
    </view>
    <BackupPlanSheet v-if="plan" v-model="showEdit" :plan="plan" />
    <DatePickerSheet v-model="showDate" :value="date" :min-date="toPlanDateString()" title="什么时候出发？" confirm-text="设为本次计划" @confirm="activate" />
    <view v-if="showMenu" class="mask" @tap="showMenu = false"><view class="menu" @tap.stop><view class="menu__item" @tap="deletePlan"><text class="danger">删除备用计划</text></view><view class="menu__item" @tap="showMenu = false"><text>取消</text></view></view></view>
  </BasePage>
</template>

<style lang="scss" scoped>
.detail { display: flex; flex-direction: column; gap: 32rpx; padding-bottom: 190rpx; }
.header { padding: 32rpx 28rpx; border: 2rpx solid #ffe1d6; border-radius: 28rpx; background: #fffdf9; }
.header__title { display: block; font-size: 40rpx; font-weight: 700; color: #2f2f2f; }
.header__tags { display: block; margin-top: 10rpx; font-size: 24rpx; font-weight: 600; color: #d3785e; }
.header__note { display: block; margin-top: 18rpx; font-size: 26rpx; color: #7d6a60; line-height: 1.5; }
.missing { min-height: 45vh; display: flex; align-items: center; justify-content: center; color: #999; }
.more { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; font-size: 28px; }
.footer { position: fixed; left: 0; right: 0; bottom: 0; z-index: 40; display: flex; gap: 14rpx; padding: 20rpx 28rpx calc(20rpx + env(safe-area-inset-bottom)); background: linear-gradient(180deg, rgba(255,250,246,0), #fffaf6 28%); }
.primary, .secondary { height: 92rpx; display: flex; align-items: center; justify-content: center; border-radius: 999rpx; font-size: 28rpx; font-weight: 600; }
.primary { flex: 1.35; background: linear-gradient(90deg, #ff8a55, #ff8f9d); color: #fff; }
.secondary { flex: 1; border: 2rpx solid #ffcbb3; background: #fff; color: #ff7b58; }
.mask { position: fixed; inset: 0; z-index: 900; display: flex; align-items: flex-end; background: rgba(40,24,16,.35); }
.menu { width: 100%; padding: 16rpx 0 calc(16rpx + env(safe-area-inset-bottom)); border-radius: 28rpx 28rpx 0 0; background: #fffaf6; }
.menu__item { height: 94rpx; display: flex; align-items: center; justify-content: center; border-bottom: 1rpx solid #eee2da; font-size: 29rpx; }
.danger { color: #e05a45; }
</style>
