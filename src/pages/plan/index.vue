<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import BasePage from '@/components/BasePage/index.vue'
import CustomNavbar from '@/components/CustomNavbar/index.vue'
import BackupPlanSheet from '@/components/plan/BackupPlanSheet.vue'
import CreatePlanSheet from '@/components/plan/CreatePlanSheet.vue'
import PlanHeroCard from '@/components/plan/PlanHeroCard.vue'
import PlanListCard from '@/components/plan/PlanListCard.vue'
import PlanPastCard from '@/components/plan/PlanPastCard.vue'
import { usePlansStore } from '@/stores/plans'

const plansStore = usePlansStore()
const { activePlan, backupPlans, completedPlans } = storeToRefs(plansStore)
const showCreateActive = ref(false)
const showCreateBackup = ref(false)

onShow(() => plansStore.hydrate())

function openActive(id: string) {
  uni.navigateTo({ url: `/pages/plan/detail?id=${encodeURIComponent(id)}` })
}
function openBackup(id: string) {
  uni.navigateTo({ url: `/pages/plan/backup-detail?id=${encodeURIComponent(id)}` })
}
function openCompleted(id: string) {
  uni.navigateTo({ url: `/pages/plan/completed-detail?id=${encodeURIComponent(id)}` })
}
function showActiveConflict() {
  showCreateActive.value = false
  uni.showModal({
    title: '已有本次计划',
    content: '同一时间只能准备一个本次计划。请先完成或删除当前计划。',
    cancelText: '知道了',
    confirmText: '查看本次计划',
    success: (res) => {
      if (res.confirm && activePlan.value) openActive(activePlan.value.id)
    },
  })
}
function requestCreateActive() {
  if (activePlan.value) showActiveConflict()
  else showCreateActive.value = true
}
function chooseBackup() {
  if (!backupPlans.value.length) {
    showCreateBackup.value = true
    return
  }
  uni.pageScrollTo({ selector: '#backup-plans', duration: 280 })
}
</script>

<template>
  <BasePage>
    <CustomNavbar title="雨间计划" :show-back="false" :show-brand="true" />
    <view class="page">
      <view class="block block--active">
        <text class="block__title">本次计划</text>
        <PlanHeroCard v-if="activePlan" :plan="activePlan" @tap="openActive(activePlan.id)" />
        <view v-else class="active-empty">
          <text class="active-empty__title">还没有确定下一次去哪</text>
          <text class="active-empty__desc">从备用计划中选一个，或者新建计划</text>
          <view class="active-empty__buttons">
            <view class="btn btn--secondary" @tap="chooseBackup">
              <text class="btn__text btn__text--secondary">选择备用计划</text>
            </view>
            <view class="btn" @tap="requestCreateActive"><text class="btn__text">新建本次计划</text></view>
          </view>
        </view>
      </view>

      <view id="backup-plans" class="block">
        <view class="block__head">
          <view><text class="block__title">备用计划</text><text class="block__subtitle">天气合适的时候，就从这里挑一个。</text></view>
          <text class="block__action" @tap="showCreateBackup = true">＋ 新建备用计划</text>
        </view>
        <view v-if="backupPlans.length" class="block__list">
          <PlanListCard v-for="plan in backupPlans" :key="plan.id" :plan="plan" @tap="openBackup(plan.id)" />
        </view>
        <text v-else class="block__empty">还没有备用方案，先为不同天气准备一个吧。</text>
      </view>

      <view class="block">
        <text class="block__title">过去的计划</text>
        <view v-if="completedPlans.length" class="block__list">
          <PlanPastCard v-for="plan in completedPlans" :key="plan.id" :plan="plan" @tap="openCompleted(plan.id)" />
        </view>
        <text v-else class="block__empty">完成一次计划后，回忆会留在这里。</text>
      </view>
    </view>
    <CreatePlanSheet v-model="showCreateActive" @created="openActive" @conflict="showActiveConflict" />
    <BackupPlanSheet v-model="showCreateBackup" @saved="openBackup" />
  </BasePage>
</template>

<style lang="scss" scoped>
.page { display: flex; flex-direction: column; gap: 48rpx; padding-bottom: 48rpx; }
.block { display: flex; flex-direction: column; gap: 20rpx; }
.block__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16rpx; }
.block__head > view { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6rpx; }
.block__title { display: block; font-size: 32rpx; font-weight: 700; color: #2f2f2f; }
.block__subtitle { font-size: 23rpx; color: #a58f82; line-height: 1.45; }
.block__action { flex-shrink: 0; margin-top: 4rpx; font-size: 24rpx; font-weight: 600; color: #ff7b58; }
.block__list { display: flex; flex-direction: column; gap: 18rpx; }
.block__empty { padding: 28rpx; border-radius: 22rpx; background: #f7f1ec; font-size: 24rpx; color: #a59489; text-align: center; }
.active-empty { padding: 36rpx 28rpx 30rpx; border: 2rpx dashed #ffcdb8; border-radius: 28rpx; background: linear-gradient(135deg, #fff7f0, #fff3f6); text-align: center; }
.active-empty__title { display: block; font-size: 31rpx; font-weight: 700; color: #3b332f; }
.active-empty__desc { display: block; margin-top: 10rpx; font-size: 24rpx; color: #9a7a66; }
.active-empty__buttons { display: flex; gap: 14rpx; margin-top: 28rpx; }
.btn { flex: 1; height: 80rpx; display: flex; align-items: center; justify-content: center; border-radius: 999rpx; background: linear-gradient(90deg, #ff8a55, #ff8f9d); }
.btn--secondary { background: #fff; border: 2rpx solid #ffcbb3; }
.btn__text { font-size: 25rpx; font-weight: 600; color: #fff; }
.btn__text--secondary { color: #ff7b58; }
</style>
