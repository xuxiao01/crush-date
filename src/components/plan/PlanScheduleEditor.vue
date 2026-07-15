<script setup lang="ts">
import { computed, ref } from 'vue'
import PeriodChips from '@/components/plan/PeriodChips.vue'
import PlanPeriodSection from '@/components/plan/PlanPeriodSection.vue'
import { useFoodsStore } from '@/stores/foods'
import { usePlacesStore } from '@/stores/places'
import { usePlansStore } from '@/stores/plans'
import type { PlanItem, PlanItemType, PlanPeriod } from '@/types/plan'
import { PERIOD_LABELS, PERIOD_ORDER, itemTypeForPeriod } from '@/types/plan'

const props = defineProps<{ planId: string; readonly?: boolean }>()
const plansStore = usePlansStore()
const foodsStore = useFoodsStore()
const placesStore = usePlacesStore()
const showItemPick = ref(false)
const showItemMenu = ref(false)
const showPeriodEdit = ref(false)
const showNoteEdit = ref(false)
const showPicker = ref(false)
const pickerMode = ref<'add' | 'replace'>('add')
const activeItem = ref<PlanItem | null>(null)
const periodItems = ref<PlanItem[]>([])
const editPeriod = ref<PlanPeriod>('afternoon')
const editNote = ref('')
const addType = ref<PlanItemType>('place')

const plan = computed(() => plansStore.getById(props.planId))
const pickerTitle = computed(() => pickerMode.value === 'replace' ? '更换安排' : `添加${PERIOD_LABELS[editPeriod.value]}安排`)
const candidates = computed(() => addType.value === 'food'
  ? foodsStore.list.map((item) => ({ id: item.id, title: item.name, image: item.image, note: item.comment, type: 'food' as const }))
  : placesStore.list.map((item) => ({ id: item.id, title: item.name, image: item.image, note: item.comment, type: 'place' as const })))

function itemsOf(period: PlanPeriod) {
  return plan.value?.items.filter((item) => item.period === period).slice().sort((a, b) => a.order - b.order) || []
}
function openAdd(period: PlanPeriod) {
  if (props.readonly) return
  pickerMode.value = 'add'
  editPeriod.value = period
  addType.value = itemTypeForPeriod(period)
  showPicker.value = true
}
function openPeriodItems(period: PlanPeriod) {
  if (props.readonly) return
  const items = itemsOf(period)
  if (items.length === 1) openItemMenu(items[0])
  else if (items.length > 1) { periodItems.value = items; showItemPick.value = true }
}
function openItemMenu(item: PlanItem) {
  activeItem.value = item
  showItemPick.value = false
  showItemMenu.value = true
}
function openReplace() {
  if (!activeItem.value) return
  pickerMode.value = 'replace'
  editPeriod.value = activeItem.value.period
  addType.value = activeItem.value.type
  showItemMenu.value = false
  showPicker.value = true
}
function openNote() {
  if (!activeItem.value) return
  editNote.value = activeItem.value.note
  showItemMenu.value = false
  showNoteEdit.value = true
}
function saveNote() {
  if (activeItem.value) plansStore.updateItemNote(props.planId, activeItem.value.id, editNote.value)
  showNoteEdit.value = false
}
function openPeriod() {
  if (!activeItem.value) return
  editPeriod.value = activeItem.value.period
  showItemMenu.value = false
  showPeriodEdit.value = true
}
function savePeriod() {
  if (activeItem.value) plansStore.updateItemPeriod(props.planId, activeItem.value.id, editPeriod.value)
  showPeriodEdit.value = false
}
function removeItem() {
  if (activeItem.value) plansStore.removeItem(props.planId, activeItem.value.id)
  showItemMenu.value = false
}
function pickCandidate(item: { id: string; title: string; image: string; note: string; type: PlanItemType }) {
  if (!activeItem.value && pickerMode.value === 'replace') return
  const result = pickerMode.value === 'replace'
    ? plansStore.replaceItemSource(props.planId, activeItem.value!.id, { type: item.type, sourceId: item.id, title: item.title, image: item.image })
    : plansStore.addItemToPlan(props.planId, { type: item.type, sourceId: item.id, title: item.title, image: item.image, period: editPeriod.value, note: item.note })
  if (!result.ok) {
    uni.showToast({ title: result.reason === 'duplicate' ? '已经在这个计划里啦' : '操作失败', icon: 'none' })
    return
  }
  showPicker.value = false
}
</script>

<template>
  <view class="periods">
    <PlanPeriodSection v-for="period in PERIOD_ORDER" :key="period" :period="period" :items="itemsOf(period)" :readonly="readonly" @add="openAdd(period)" @edit="openPeriodItems(period)" />
  </view>

  <view v-if="showItemPick" class="mask" @tap="showItemPick = false"><view class="menu" @tap.stop><text class="menu__title">要改哪一条</text><view v-for="item in periodItems" :key="item.id" class="menu__item" @tap="openItemMenu(item)"><text>{{ item.title }}</text></view><view class="menu__item" @tap="showItemPick = false"><text>取消</text></view></view></view>
  <view v-if="showItemMenu" class="mask" @tap="showItemMenu = false"><view class="menu" @tap.stop><view class="menu__item" @tap="openReplace"><text>更换安排</text></view><view class="menu__item" @tap="openNote"><text>修改备注</text></view><view class="menu__item" @tap="openPeriod"><text>调整时间段</text></view><view class="menu__item" @tap="removeItem"><text class="danger">删除安排</text></view><view class="menu__item" @tap="showItemMenu = false"><text>取消</text></view></view></view>
  <view v-if="showPeriodEdit" class="mask" @tap="showPeriodEdit = false"><view class="sheet" @tap.stop><text class="sheet__title">调整时间段</text><PeriodChips v-model="editPeriod" /><view class="submit" @tap="savePeriod"><text>保存</text></view></view></view>
  <view v-if="showNoteEdit" class="mask" @tap="showNoteEdit = false"><view class="sheet" @tap.stop><text class="sheet__title">修改备注</text><input v-model="editNote" class="input" maxlength="40" /><view class="submit" @tap="saveNote"><text>保存</text></view></view></view>
  <view v-if="showPicker" class="mask" @tap="showPicker = false"><view class="sheet sheet--tall" @tap.stop><text class="sheet__title">{{ pickerTitle }}</text><view class="tabs"><view class="tab" :class="{ 'tab--active': addType === 'place' }" @tap="addType = 'place'"><text>想去的</text></view><view class="tab" :class="{ 'tab--active': addType === 'food' }" @tap="addType = 'food'"><text>想吃的</text></view></view><scroll-view scroll-y class="picker"><view v-for="item in candidates" :key="item.id" class="picker__item" @tap="pickCandidate(item)"><image class="picker__image" :src="item.image" mode="aspectFill" /><text>{{ item.title }}</text></view></scroll-view></view></view>
</template>

<style lang="scss" scoped>
.periods { display: flex; flex-direction: column; gap: 28rpx; }
.mask { position: fixed; inset: 0; z-index: 850; display: flex; align-items: flex-end; background: rgba(40, 24, 16, 0.35); }
.menu, .sheet { width: 100%; padding: 18rpx 0 calc(18rpx + env(safe-area-inset-bottom)); border-radius: 28rpx 28rpx 0 0; background: #fffaf6; box-sizing: border-box; }
.sheet { padding: 32rpx 28rpx calc(28rpx + env(safe-area-inset-bottom)); }
.sheet--tall { max-height: 78vh; display: flex; flex-direction: column; }
.menu__title, .sheet__title { display: block; padding: 12rpx 28rpx 22rpx; font-size: 31rpx; font-weight: 700; color: #2f2f2f; }
.sheet__title { padding: 0 0 22rpx; }
.menu__item { height: 92rpx; display: flex; align-items: center; justify-content: center; border-bottom: 1rpx solid #eee2da; font-size: 29rpx; color: #2f2f2f; }
.danger { color: #e05a45; }
.input { height: 86rpx; padding: 0 22rpx; border: 2rpx solid #ffe4d2; border-radius: 20rpx; background: #fff; }
.submit { height: 86rpx; margin-top: 24rpx; display: flex; align-items: center; justify-content: center; border-radius: 999rpx; background: linear-gradient(90deg, #ff8a55, #ff8f9d); color: #fff; font-weight: 600; }
.tabs { display: flex; gap: 12rpx; margin-bottom: 18rpx; }
.tab { flex: 1; height: 66rpx; display: flex; align-items: center; justify-content: center; border-radius: 999rpx; background: #fff0e7; font-size: 25rpx; color: #8a6548; }
.tab--active { background: linear-gradient(90deg, #ff8a55, #ff8f9d); color: #fff; }
.picker { max-height: 52vh; }
.picker__item { display: flex; align-items: center; gap: 16rpx; padding: 14rpx 0; border-bottom: 1rpx solid #eee2da; font-size: 27rpx; }
.picker__image { width: 76rpx; height: 76rpx; flex-shrink: 0; border-radius: 15rpx; }
</style>
