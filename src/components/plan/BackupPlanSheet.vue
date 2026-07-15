<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue'
import { usePlansStore } from '@/stores/plans'
import type { Plan, PlanScenario } from '@/types/plan'
import { SCENARIO_LABELS } from '@/types/plan'

const props = defineProps<{ modelValue: boolean; plan?: Plan }>()
const emit = defineEmits<{
  'update:modelValue': [boolean]
  saved: [string]
}>()

const plansStore = usePlansStore()
const title = ref('')
const scenario = ref<PlanScenario>('free')
const scenarioText = ref('')
const note = ref('')
const options = Object.keys(SCENARIO_LABELS) as PlanScenario[]
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

watch(
  () => props.modelValue,
  (open) => {
    if (!open) {
      restorePageTabBar()
      return
    }
    hidePageTabBar()
    title.value = props.plan?.title || ''
    scenario.value = props.plan?.scenario || 'free'
    scenarioText.value = props.plan?.scenarioText || '自由安排'
    note.value = props.plan?.note || ''
  },
)

onUnmounted(() => {
  restorePageTabBar()
})

function close() {
  emit('update:modelValue', false)
}

function selectScenario(value: PlanScenario) {
  scenario.value = value
  if (!scenarioText.value.trim() || Object.values(SCENARIO_LABELS).includes(scenarioText.value)) {
    scenarioText.value = SCENARIO_LABELS[value]
  }
}

async function submit() {
  if (!title.value.trim()) {
    uni.showToast({ title: '请填写备用计划标题', icon: 'none' })
    return
  }
  if (props.plan) {
    const saved = await plansStore.updatePlanMeta(props.plan.id, {
      title: title.value,
      scenario: scenario.value,
      scenarioText: scenarioText.value,
      note: note.value,
    })
    if (!saved) return
    close()
    emit('saved', props.plan.id)
    return
  }
  const result = await plansStore.createBackup({
    title: title.value,
    scenario: scenario.value,
    scenarioText: scenarioText.value,
    note: note.value,
  })
  if (result.ok) {
    close()
    emit('saved', result.plan.id)
  }
}
</script>

<template>
  <view v-if="modelValue" class="mask" @tap="close">
    <view class="sheet" @tap.stop>
      <text class="title">{{ plan ? '编辑备用计划' : '新建备用计划' }}</text>
      <view class="field field--input">
        <text class="field__label">场景标题</text>
        <input v-model="title" class="field__input" maxlength="20" placeholder="例如：下雨的时候" />
      </view>
      <text class="label">天气场景</text>
      <view class="scenarios">
        <view
          v-for="value in options"
          :key="value"
          class="scenario"
          :class="{ 'scenario--active': scenario === value }"
          @tap="selectScenario(value)"
        >
          <text class="scenario__text">{{ SCENARIO_LABELS[value] }}</text>
        </view>
      </view>
      <view class="field field--input">
        <text class="field__label">场景标签</text>
        <input
          v-model="scenarioText"
          class="field__input"
          maxlength="30"
          placeholder="炎热 · 室内 · 不晒"
        />
      </view>
      <view class="field field--input">
        <text class="field__label">备注（可选）</text>
        <input
          v-model="note"
          class="field__input"
          maxlength="60"
          placeholder="记录这个方案适合什么时候"
        />
      </view>
      <view class="submit" @tap="submit">
        <text class="submit__text">{{ plan ? '保存修改' : '保存并进入行程规划' }}</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.mask {
  position: fixed;
  inset: 0;
  z-index: 900;
  display: flex;
  align-items: flex-end;
  background: rgba(40, 24, 16, 0.35);
}
.sheet {
  width: 100%;
  max-height: 88vh;
  overflow-y: auto;
  padding: 32rpx 28rpx calc(28rpx + env(safe-area-inset-bottom));
  border-radius: 28rpx 28rpx 0 0;
  background: #fffaf6;
  box-sizing: border-box;
}
.title {
  display: block;
  margin-bottom: 28rpx;
  font-size: 34rpx;
  font-weight: 700;
  color: #2f2f2f;
}
.label {
  display: block;
  margin: 4rpx 0 14rpx;
  font-size: 24rpx;
  color: #9a6a4a;
}
.field {
  min-height: 88rpx;
  margin-bottom: 16rpx;
  padding: 0 24rpx;
  border: 2rpx solid #ffe4d2;
  border-radius: 20rpx;
  background: #fff;
  box-sizing: border-box;
}
.field--input {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8rpx;
  padding-top: 16rpx;
  padding-bottom: 16rpx;
}
.field__label {
  font-size: 24rpx;
  color: #9a6a4a;
}
.field__input {
  width: 100%;
  font-size: 28rpx;
  color: #2f2f2f;
}
.scenarios {
  display: flex;
  gap: 10rpx;
  margin-bottom: 18rpx;
}
.scenario {
  flex: 1;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999rpx;
  background: #fff0e6;
}
.scenario--active {
  background: linear-gradient(135deg, #ff8a55, #ff8f9d);
}
.scenario__text {
  font-size: 23rpx;
  color: #8a6548;
}
.scenario--active .scenario__text {
  color: #fff;
  font-weight: 600;
}
.submit {
  margin-top: 24rpx;
  height: 92rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999rpx;
  background: linear-gradient(90deg, #ff8a55, #ff8f9d);
}
.submit__text {
  font-size: 30rpx;
  font-weight: 600;
  color: #fff;
}
</style>
