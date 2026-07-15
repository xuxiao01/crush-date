<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import BasePage from '@/components/BasePage/index.vue'
import CustomNavbar from '@/components/CustomNavbar/index.vue'
import PlanHeaderCard from '@/components/plan/PlanHeaderCard.vue'
import PlanScheduleEditor from '@/components/plan/PlanScheduleEditor.vue'
import { usePlansStore } from '@/stores/plans'

const plansStore = usePlansStore()
const planId = ref('')
const showMenu = ref(false)
const plan = computed(() => plansStore.getById(planId.value))

onLoad((query) => {
  plansStore.hydrate()
  planId.value = typeof query?.id === 'string' ? decodeURIComponent(query.id) : ''
})

function backToList() {
  uni.switchTab({ url: '/pages/plan/index' })
}
function deletePlan() {
  if (!plan.value) return
  plansStore.deletePlan(plan.value.id)
  showMenu.value = false
  backToList()
}
function completePlan() {
  if (!plan.value) return
  const result = plansStore.completeActive(plan.value.id)
  if (!result.ok) return
  backToList()
}
</script>

<template>
  <BasePage>
    <CustomNavbar title="计划详情" :show-back="true" :large-hit="true">
      <template #right><view class="more" @tap="showMenu = true"><text>⋯</text></view></template>
    </CustomNavbar>
    <view v-if="plan?.status === 'active'" class="detail">
      <PlanHeaderCard :plan="plan" />
      <PlanScheduleEditor :plan-id="plan.id" />
    </view>
    <view v-else class="missing"><text>没有找到本次计划</text></view>
    <view v-if="plan?.status === 'active'" class="footer"><view class="primary" @tap="completePlan"><text>完成这次计划</text></view></view>
    <view v-if="showMenu" class="mask" @tap="showMenu = false"><view class="menu" @tap.stop><view class="menu__item" @tap="deletePlan"><text class="danger">删除计划</text></view><view class="menu__item" @tap="showMenu = false"><text>取消</text></view></view></view>
  </BasePage>
</template>

<style lang="scss" scoped>
.detail { display: flex; flex-direction: column; gap: 32rpx; padding-bottom: 190rpx; }
.missing { min-height: 45vh; display: flex; align-items: center; justify-content: center; color: #999; }
.more { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; font-size: 28px; }
.footer { position: fixed; left: 0; right: 0; bottom: 0; z-index: 40; padding: 20rpx 28rpx calc(20rpx + env(safe-area-inset-bottom)); background: linear-gradient(180deg, rgba(255,250,246,0), #fffaf6 28%); }
.primary { height: 92rpx; display: flex; align-items: center; justify-content: center; border-radius: 999rpx; background: linear-gradient(90deg, #ff8a55, #ff8f9d); font-size: 29rpx; font-weight: 600; color: #fff; }
.mask { position: fixed; inset: 0; z-index: 900; display: flex; align-items: flex-end; background: rgba(40,24,16,.35); }
.menu { width: 100%; padding: 16rpx 0 calc(16rpx + env(safe-area-inset-bottom)); border-radius: 28rpx 28rpx 0 0; background: #fffaf6; }
.menu__item { height: 94rpx; display: flex; align-items: center; justify-content: center; border-bottom: 1rpx solid #eee2da; font-size: 29rpx; }
.danger { color: #e05a45; }
</style>
