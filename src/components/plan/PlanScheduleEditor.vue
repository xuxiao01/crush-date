<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import PlanPeriodSection from '@/components/plan/PlanPeriodSection.vue'
import { useFoodsStore } from '@/stores/foods'
import { usePlacesStore } from '@/stores/places'
import { usePlansStore } from '@/stores/plans'
import type { PlanItemType, PlanPeriod } from '@/types/plan'
import { PERIOD_LABELS, PERIOD_ORDER, itemTypeForPeriod } from '@/types/plan'

const props = defineProps<{ planId: string; readonly?: boolean }>()
const plansStore = usePlansStore()
const foodsStore = useFoodsStore()
const placesStore = usePlacesStore()
const showPicker = ref(false)
const showDeleteDialog = ref(false)
const pendingRemoveItemId = ref('')
const pendingRemoveTitle = ref('')
const deleting = ref(false)
const editPeriod = ref<PlanPeriod>('afternoon')
const addType = ref<PlanItemType>('place')

const plan = computed(() => plansStore.getById(props.planId))
const pickerTitle = computed(() => `添加${PERIOD_LABELS[editPeriod.value]}安排`)
const candidates = computed(() =>
  addType.value === 'food'
    ? foodsStore.list.map((item) => ({
        id: item.id,
        title: item.name,
        image: item.image,
        note: item.comment,
        type: 'food' as const,
      }))
    : placesStore.list.map((item) => ({
        id: item.id,
        title: item.name,
        image: item.image,
        note: item.comment,
        type: 'place' as const,
      })),
)

watch(showPicker, (open) => {
  if (!open) return
  void foodsStore.fetchFoods()
  void placesStore.fetchPlaces()
})

function itemsOf(period: PlanPeriod) {
  return (
    plan.value?.items
      .filter((item) => item.period === period)
      .slice()
      .sort((a, b) => a.order - b.order) || []
  )
}
function openAdd(period: PlanPeriod) {
  if (props.readonly) return
  editPeriod.value = period
  addType.value = itemTypeForPeriod(period)
  showPicker.value = true
}
function requestRemoveItem(itemId: string) {
  if (props.readonly) return
  const item = plan.value?.items.find((candidate) => candidate.id === itemId)
  pendingRemoveItemId.value = itemId
  pendingRemoveTitle.value = item?.title || '这条安排'
  showDeleteDialog.value = true
}
function closeDeleteDialog() {
  if (deleting.value) return
  showDeleteDialog.value = false
  pendingRemoveItemId.value = ''
  pendingRemoveTitle.value = ''
}
async function confirmRemoveItem() {
  if (!pendingRemoveItemId.value || deleting.value) return
  deleting.value = true
  const removed = await plansStore.removeItem(props.planId, pendingRemoveItemId.value)
  deleting.value = false
  if (!removed) {
    uni.showToast({ title: '删除失败，请重试', icon: 'none' })
    return
  }
  closeDeleteDialog()
}
async function pickCandidate(item: {
  id: string
  title: string
  image: string
  note: string
  type: PlanItemType
}) {
  const result = await plansStore.addItemToPlan(props.planId, {
    type: item.type,
    sourceId: item.id,
    title: item.title,
    image: item.image,
    period: editPeriod.value,
    note: item.note,
  })
  if (!result.ok) {
    uni.showToast({
      title: result.reason === 'duplicate' ? '已经在这个计划里啦' : '操作失败',
      icon: 'none',
    })
    return
  }
  showPicker.value = false
}
</script>

<template>
  <view class="periods">
    <PlanPeriodSection
      v-for="period in PERIOD_ORDER"
      :key="period"
      :period="period"
      :items="itemsOf(period)"
      :readonly="readonly"
      @add="openAdd(period)"
      @remove="requestRemoveItem"
    />
  </view>

  <view v-if="showDeleteDialog" class="confirm-mask" @tap="closeDeleteDialog">
    <view class="confirm-dialog" @tap.stop>
      <text class="confirm-dialog__title">删除安排</text>
      <text class="confirm-dialog__desc">确定要删除“{{ pendingRemoveTitle }}”吗？</text>
      <view class="confirm-dialog__actions">
        <view
          class="confirm-dialog__button confirm-dialog__button--secondary"
          hover-class="confirm-dialog__button--hover"
          @tap="closeDeleteDialog"
        >
          <text>取消</text>
        </view>
        <view
          class="confirm-dialog__button confirm-dialog__button--primary"
          :class="{ 'confirm-dialog__button--disabled': deleting }"
          hover-class="confirm-dialog__button--hover"
          @tap="confirmRemoveItem"
        >
          <text>删除</text>
        </view>
      </view>
    </view>
  </view>

  <view v-if="showPicker" class="mask" @tap="showPicker = false"
    ><view class="sheet sheet--tall" @tap.stop
      ><text class="sheet__title">{{ pickerTitle }}</text
      ><view class="tabs"
        ><view class="tab" :class="{ 'tab--active': addType === 'place' }" @tap="addType = 'place'"
          ><text>想去的</text></view
        ><view class="tab" :class="{ 'tab--active': addType === 'food' }" @tap="addType = 'food'"
          ><text>想吃的</text></view
        ></view
      ><scroll-view scroll-y class="picker"
        ><view
          v-for="item in candidates"
          :key="item.id"
          class="picker__item"
          @tap="pickCandidate(item)"
          ><image class="picker__image" :src="item.image" mode="aspectFill" /><text>{{
            item.title
          }}</text></view
        ></scroll-view
      ></view
    ></view
  >
</template>

<style lang="scss" scoped>
.periods {
  display: flex;
  flex-direction: column;
  gap: 28rpx;
  width: 100%;
  box-sizing: border-box;
}
.confirm-mask {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48rpx;
  background: rgba(53, 40, 33, 0.48);
  box-sizing: border-box;
}
.confirm-dialog {
  width: 100%;
  max-width: 600rpx;
  padding: 46rpx 36rpx 34rpx;
  border: 2rpx solid rgba(255, 221, 204, 0.9);
  border-radius: 36rpx;
  background: #fffaf6;
  box-shadow: 0 28rpx 72rpx rgba(92, 51, 31, 0.22);
  box-sizing: border-box;
}
.confirm-dialog__title {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  color: #2f2f2f;
  line-height: 1.35;
  text-align: center;
}
.confirm-dialog__desc {
  display: block;
  margin-top: 16rpx;
  font-size: 26rpx;
  color: #9b8578;
  line-height: 1.6;
  text-align: center;
}
.confirm-dialog__actions {
  display: flex;
  gap: 16rpx;
  margin-top: 34rpx;
}
.confirm-dialog__button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 86rpx;
  border-radius: 999rpx;
  font-size: 27rpx;
  font-weight: 600;
  transition: opacity 160ms ease;
}
.confirm-dialog__button--secondary {
  border: 2rpx solid #ffcbb3;
  background: #fff;
  color: #b0765c;
}
.confirm-dialog__button--primary {
  background: linear-gradient(90deg, #ff8a55, #ff8f9d);
  box-shadow: 0 10rpx 24rpx rgba(255, 138, 85, 0.25);
  color: #fff;
}
.confirm-dialog__button--hover {
  opacity: 0.86;
}
.confirm-dialog__button--disabled {
  opacity: 0.58;
}
.mask {
  position: fixed;
  inset: 0;
  z-index: 850;
  display: flex;
  align-items: flex-end;
  background: rgba(40, 24, 16, 0.35);
}
.sheet {
  width: 100%;
  border-radius: 28rpx 28rpx 0 0;
  background: #fffaf6;
  box-sizing: border-box;
}
.sheet {
  padding: 32rpx 28rpx calc(28rpx + env(safe-area-inset-bottom));
}
.sheet--tall {
  max-height: 78vh;
  display: flex;
  flex-direction: column;
}
.sheet__title {
  display: block;
  font-size: 31rpx;
  font-weight: 700;
  color: #2f2f2f;
}
.sheet__title {
  padding: 0 0 22rpx;
}
.tabs {
  display: flex;
  gap: 12rpx;
  margin-bottom: 18rpx;
}
.tab {
  flex: 1;
  height: 66rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999rpx;
  background: #fff0e7;
  font-size: 25rpx;
  color: #8a6548;
}
.tab--active {
  background: linear-gradient(90deg, #ff8a55, #ff8f9d);
  color: #fff;
}
.picker {
  max-height: 52vh;
}
.picker__item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 14rpx 0;
  border-bottom: 1rpx solid #eee2da;
  font-size: 27rpx;
}
.picker__image {
  width: 76rpx;
  height: 76rpx;
  flex-shrink: 0;
  border-radius: 15rpx;
}
</style>
