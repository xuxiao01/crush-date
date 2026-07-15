<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import DatePickerSheet from '@/components/plan/DatePickerSheet.vue'
import PeriodChips from '@/components/plan/PeriodChips.vue'
import { usePlansStore } from '@/stores/plans'
import type { PlanItemType, PlanPeriod, PlanScenario, PlanStatus } from '@/types/plan'
import { SCENARIO_LABELS, defaultPeriodForType } from '@/types/plan'
import { formatZhDate, toPlanDateString } from '@/utils/planDate'

const props = defineProps<{
  modelValue: boolean
  type: PlanItemType
  sourceId: string
  title: string
  image: string
  defaultNote?: string
}>()
const emit = defineEmits<{
  'update:modelValue': [boolean]
  success: [payload: { planId: string; planStatus: PlanStatus; label: string }]
}>()

const plansStore = usePlansStore()
const mode = ref<'active' | 'backup' | 'new-active' | 'new-backup'>('active')
const selectedBackupId = ref('')
const period = ref<PlanPeriod>('noon')
const itemNote = ref('')
const activeDate = ref(toPlanDateString())
const activeNote = ref('')
const showDate = ref(false)
const backupTitle = ref('')
const backupScenario = ref<PlanScenario>('free')
const backupScenarioText = ref('自由安排')
const backupNote = ref('')
const backups = computed(() => plansStore.backupPlans)
const scenarioOptions = Object.keys(SCENARIO_LABELS) as PlanScenario[]

watch(() => props.modelValue, (open) => {
  if (!open) return
  plansStore.hydrate()
  mode.value = plansStore.activePlan ? 'active' : backups.value.length ? 'backup' : 'new-active'
  selectedBackupId.value = backups.value[0]?.id || ''
  period.value = defaultPeriodForType(props.type)
  itemNote.value = props.defaultNote || ''
  activeDate.value = toPlanDateString()
  activeNote.value = ''
  backupTitle.value = ''
  backupScenario.value = 'free'
  backupScenarioText.value = '自由安排'
  backupNote.value = ''
})

function close() { emit('update:modelValue', false) }
function chooseBackup(id: string) { mode.value = 'backup'; selectedBackupId.value = id }
function selectScenario(value: PlanScenario) {
  backupScenario.value = value
  backupScenarioText.value = SCENARIO_LABELS[value]
}
function showConflict() {
  const active = plansStore.activePlan
  uni.showModal({ title: '已有本次计划', content: '请直接加入当前的本次计划。', cancelText: '取消', confirmText: '加入本次计划', success: (res) => { if (res.confirm && active) mode.value = 'active' } })
}
function submit() {
  let target = mode.value === 'active' ? plansStore.activePlan : undefined

  if (mode.value === 'new-active') {
    const created = plansStore.createActive({ date: activeDate.value, note: activeNote.value })
    if (!created.ok) {
      if (created.reason === 'active_exists') showConflict()
      else uni.showToast({ title: '请选择今天或以后的日期', icon: 'none' })
      return
    }
    target = created.plan
  } else if (mode.value === 'backup') {
    target = plansStore.getById(selectedBackupId.value)
  } else if (mode.value === 'new-backup') {
    if (!backupTitle.value.trim()) { uni.showToast({ title: '请填写备用计划标题', icon: 'none' }); return }
    const created = plansStore.createBackup({ title: backupTitle.value, scenario: backupScenario.value, scenarioText: backupScenarioText.value, note: backupNote.value })
    if (created.ok) target = created.plan
  }

  if (!target) { uni.showToast({ title: '请选择一个计划', icon: 'none' }); return }
  const result = plansStore.addItemToPlan(target.id, { type: props.type, sourceId: props.sourceId, title: props.title, image: props.image, period: period.value, note: itemNote.value })
  if (!result.ok) {
    uni.showToast({ title: result.reason === 'duplicate' ? '已经在这个计划里啦' : '加入失败', icon: 'none' })
    return
  }
  close()
  emit('success', { planId: target.id, planStatus: target.status, label: target.status === 'active' ? formatZhDate(target.date || '') : target.title })
}
</script>

<template>
  <view v-if="modelValue" class="mask" @tap="close">
    <view class="sheet" @tap.stop>
      <text class="sheet__title">加入计划</text>
      <view class="preview"><image class="preview__image" :src="image" mode="aspectFill" /><text class="preview__title">{{ title }}</text></view>
      <text class="label">加入哪里</text>
      <scroll-view scroll-x class="targets" :show-scrollbar="false">
        <view v-if="plansStore.activePlan" class="chip" :class="{ 'chip--active': mode === 'active' }" @tap="mode = 'active'"><text>本次计划</text></view>
        <view v-else class="chip" :class="{ 'chip--active': mode === 'new-active' }" @tap="mode = 'new-active'"><text>＋ 创建本次计划</text></view>
        <view v-for="plan in backups" :key="plan.id" class="chip" :class="{ 'chip--active': mode === 'backup' && selectedBackupId === plan.id }" @tap="chooseBackup(plan.id)"><text>{{ plan.title }}</text></view>
        <view class="chip" :class="{ 'chip--active': mode === 'new-backup' }" @tap="mode = 'new-backup'"><text>＋ 新建备用计划</text></view>
      </scroll-view>

      <template v-if="mode === 'new-active'">
        <view class="field" @tap="showDate = true"><text class="field__label">出发日期</text><text class="field__value">{{ formatZhDate(activeDate) }} ›</text></view>
        <view class="field field--input"><text class="field__label">计划备注（可选）</text><input v-model="activeNote" class="field__input" maxlength="40" /></view>
      </template>
      <template v-if="mode === 'new-backup'">
        <view class="field field--input"><text class="field__label">场景标题</text><input v-model="backupTitle" class="field__input" maxlength="20" placeholder="例如：下雨的时候" /></view>
        <view class="scenarios"><view v-for="value in scenarioOptions" :key="value" class="scenario" :class="{ 'scenario--active': backupScenario === value }" @tap="selectScenario(value)"><text>{{ SCENARIO_LABELS[value] }}</text></view></view>
        <view class="field field--input"><text class="field__label">场景标签</text><input v-model="backupScenarioText" class="field__input" maxlength="30" /></view>
        <view class="field field--input"><text class="field__label">计划备注（可选）</text><input v-model="backupNote" class="field__input" maxlength="60" /></view>
      </template>

      <text class="label">时间段</text>
      <PeriodChips v-model="period" />
      <view class="field field--input field--note"><text class="field__label">这个安排的备注（可选）</text><input v-model="itemNote" class="field__input" maxlength="40" /></view>
      <view class="submit" @tap="submit"><text>加入计划</text></view>
    </view>
  </view>
  <DatePickerSheet v-model="showDate" :value="activeDate" :min-date="toPlanDateString()" @confirm="(value) => (activeDate = value)" />
</template>

<style lang="scss" scoped>
.mask { position: fixed; inset: 0; z-index: 900; display: flex; align-items: flex-end; background: rgba(40,24,16,.35); }
.sheet { width: 100%; max-height: 90vh; overflow-y: auto; padding: 30rpx 28rpx calc(28rpx + env(safe-area-inset-bottom)); border-radius: 28rpx 28rpx 0 0; background: #fffaf6; box-sizing: border-box; }
.sheet__title { display: block; margin-bottom: 20rpx; font-size: 34rpx; font-weight: 700; }
.preview { display: flex; align-items: center; gap: 16rpx; padding: 14rpx; margin-bottom: 22rpx; border: 2rpx solid #ffe4d2; border-radius: 20rpx; background: #fff; }
.preview__image { width: 80rpx; height: 80rpx; border-radius: 15rpx; }
.preview__title { font-size: 28rpx; font-weight: 600; }
.label { display: block; margin: 10rpx 0 14rpx; font-size: 24rpx; color: #9a6a4a; }
.targets { width: 100%; margin-bottom: 18rpx; white-space: nowrap; }
.chip { display: inline-flex; align-items: center; height: 66rpx; padding: 0 22rpx; margin-right: 10rpx; border-radius: 999rpx; background: #fff0e7; font-size: 24rpx; color: #8a6548; }
.chip--active { background: linear-gradient(90deg, #ff8a55, #ff8f9d); color: #fff; }
.field { display: flex; align-items: center; justify-content: space-between; min-height: 82rpx; padding: 0 22rpx; margin-bottom: 14rpx; border: 2rpx solid #ffe4d2; border-radius: 18rpx; background: #fff; }
.field--input { flex-direction: column; align-items: stretch; justify-content: center; gap: 6rpx; padding-top: 14rpx; padding-bottom: 14rpx; }
.field--note { margin-top: 20rpx; }
.field__label { font-size: 23rpx; color: #9a6a4a; }
.field__value, .field__input { font-size: 27rpx; color: #2f2f2f; }
.scenarios { display: flex; gap: 8rpx; margin-bottom: 14rpx; }
.scenario { flex: 1; height: 60rpx; display: flex; align-items: center; justify-content: center; border-radius: 999rpx; background: #fff0e7; font-size: 22rpx; color: #8a6548; }
.scenario--active { background: #ff8a55; color: #fff; }
.submit { height: 90rpx; margin-top: 22rpx; display: flex; align-items: center; justify-content: center; border-radius: 999rpx; background: linear-gradient(90deg, #ff8a55, #ff8f9d); font-size: 29rpx; font-weight: 600; color: #fff; }
</style>
