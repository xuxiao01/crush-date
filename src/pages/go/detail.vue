<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import BasePage from '@/components/BasePage/index.vue'
import CustomNavbar from '@/components/CustomNavbar/index.vue'
import AddPlanSheet from '@/components/plan/AddPlanSheet.vue'
import { usePlacesStore } from '@/stores/places'
import { usePlansStore } from '@/stores/plans'

const placesStore = usePlacesStore()
const plansStore = usePlansStore()
const placeId = ref('')
const animating = ref(false)
const showBadge = ref(false)
const showAddPlan = ref(false)

const place = computed(() => (placeId.value ? placesStore.getById(placeId.value) : undefined))
const navTitle = computed(() => place.value?.name || '想去详情')

onLoad((query) => {
  plansStore.hydrate()
  placeId.value = typeof query?.id === 'string' ? decodeURIComponent(query.id) : ''
  if (place.value?.status === 'visited') {
    showBadge.value = true
  }
})

function handleMarkVisited() {
  if (!place.value || place.value.status === 'visited' || animating.value) return

  const ok = placesStore.markVisited(place.value.id)
  if (!ok) return

  animating.value = true
  showBadge.value = true

  setTimeout(() => {
    animating.value = false
  }, 400)
}

function onAddSuccess({ planId, planStatus, label }: { planId: string; planStatus: 'active' | 'backup' | 'completed'; label: string }) {
  uni.showModal({
    title: '加入成功',
    content: `已加入${label}`,
    cancelText: '好的',
    confirmText: '查看计划',
    success: (res) => {
      if (res.confirm) {
        const path = planStatus === 'backup' ? 'backup-detail' : 'detail'
        uni.navigateTo({ url: `/pages/plan/${path}?id=${encodeURIComponent(planId)}` })
      }
    },
  })
}
</script>

<template>
  <BasePage>
    <CustomNavbar :title="navTitle" :show-back="true" :show-brand="false" />

    <view v-if="place" class="detail">
      <view class="detail__cover-wrap">
        <image class="detail__cover" :src="place.image" mode="aspectFill" />

        <view
          v-if="showBadge"
          class="detail__badge"
          :class="{ 'detail__badge--animate': animating }"
        >
          <text class="detail__badge-text">✓ 去过了</text>
        </view>
      </view>

      <view class="detail__content">
        <text class="detail__name">{{ place.name }}</text>
        <text class="detail__type">{{ place.type }}</text>

        <view class="detail__quote">
          <text class="detail__quote-mark">“</text>
          <text class="detail__comment">{{ place.comment }}</text>
        </view>

        <view class="detail__status">
          <template v-if="place.status === 'visited'">
            <text class="detail__status-label">去过了</text>
            <text class="detail__status-date">{{ place.visitedDate }}</text>
          </template>
          <template v-else>
            <text class="detail__status-label detail__status-label--pending">还没去</text>
            <text class="detail__status-hint">去过之后记得回来标记一下</text>
          </template>
        </view>
      </view>

      <view class="detail__footer">
        <view
          v-if="place.status === 'unvisited'"
          class="detail__btn detail__btn--secondary"
          hover-class="detail__btn--hover"
          :hover-stay-time="100"
          @tap="handleMarkVisited"
        >
          <text class="detail__btn-text detail__btn-text--secondary">标记为去过</text>
        </view>
        <view
          class="detail__btn"
          hover-class="detail__btn--hover"
          :hover-stay-time="100"
          @tap="showAddPlan = true"
        >
          <text class="detail__btn-text">加入计划</text>
        </view>
      </view>
    </view>

    <view v-else class="empty">
      <text class="empty__text">没有找到这个地方</text>
    </view>

    <AddPlanSheet
      v-if="place"
      v-model="showAddPlan"
      type="place"
      :source-id="place.id"
      :title="place.name"
      :image="place.image"
      :default-note="place.comment"
      @success="onAddSuccess"
    />
  </BasePage>
</template>

<style lang="scss" scoped>
.detail {
  display: flex;
  flex-direction: column;
  padding-bottom: 160rpx;
}

.detail__cover-wrap {
  position: relative;
  width: 100%;
  height: 520rpx;
  overflow: hidden;
  background: #ffe8d4;
}

.detail__cover {
  width: 100%;
  height: 100%;
  display: block;
}

.detail__badge {
  position: absolute;
  top: 28rpx;
  right: 28rpx;
  padding: 12rpx 22rpx;
  border-radius: 999rpx;
  background: #ff7b4d;
  opacity: 1;
  transform: scale(1);
}

.detail__badge--animate {
  animation: badge-in 400ms ease;
}

.detail__badge-text {
  font-size: 26rpx;
  font-weight: 600;
  color: #ffffff;
  line-height: 1;
}

@keyframes badge-in {
  0% {
    opacity: 0;
    transform: scale(1.35);
  }
  70% {
    opacity: 1;
    transform: scale(0.96);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.detail__content {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
  padding: 36rpx 32rpx 24rpx;
}

.detail__name {
  font-size: 44rpx;
  font-weight: 700;
  color: #252525;
  line-height: 1.3;
}

.detail__type {
  font-size: 26rpx;
  color: #999999;
  line-height: 1.4;
}

.detail__quote {
  display: flex;
  align-items: flex-start;
  gap: 8rpx;
  margin-top: 8rpx;
  padding: 22rpx 20rpx;
  border-radius: 20rpx;
  background: linear-gradient(135deg, #fff4eb 0%, #ffe8ef 100%);
}

.detail__quote-mark {
  flex-shrink: 0;
  font-size: 36rpx;
  font-weight: 600;
  color: rgba(255, 143, 112, 0.55);
  line-height: 1.1;
}

.detail__comment {
  flex: 1;
  font-size: 28rpx;
  font-weight: 500;
  color: #6b5344;
  line-height: 1.5;
}

.detail__status {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  margin-top: 12rpx;
  padding: 28rpx;
  border-radius: 24rpx;
  background: #fff3ea;
  border: 2rpx solid #ffd6ba;
}

.detail__status-label {
  font-size: 30rpx;
  font-weight: 600;
  color: #ff7b4d;
}

.detail__status-label--pending {
  color: #8c817b;
}

.detail__status-date,
.detail__status-hint {
  font-size: 26rpx;
  color: #8a6548;
  line-height: 1.45;
}

.detail__footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  gap: 16rpx;
  padding: 24rpx 32rpx calc(24rpx + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, rgba(255, 250, 246, 0) 0%, #fffaf6 28%);
}

.detail__btn {
  flex: 1.3;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 96rpx;
  border-radius: 999rpx;
  background: linear-gradient(90deg, #ff8a55 0%, #ff8f9d 100%);
  box-shadow: 0 12rpx 28rpx rgba(255, 143, 112, 0.28);
  transition: transform 160ms ease;
}

.detail__btn--secondary {
  flex: 1;
  background: #fff;
  border: 2rpx solid #ffc9ae;
  box-shadow: none;
}

.detail__btn--hover {
  transform: scale(0.98);
}

.detail__btn-text {
  font-size: 30rpx;
  font-weight: 600;
  color: #ffffff;
}

.detail__btn-text--secondary {
  color: #ff8a55;
}

.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
}

.empty__text {
  font-size: 28rpx;
  color: $color-text-secondary;
}
</style>
