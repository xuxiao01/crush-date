<script setup lang="ts">
import AppImage from '@/components/AppImage/index.vue'
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import BasePage from '@/components/BasePage/index.vue'
import CustomNavbar from '@/components/CustomNavbar/index.vue'
import ContentLocationCard from '@/components/content/ContentLocationCard.vue'
import AddPlanSheet from '@/components/plan/AddPlanSheet.vue'
import { deleteContentItem, getPlaceById, updateContentItemVisited } from '@/api/content'
import { ApiError } from '@/api/index'
import { usePlacesStore } from '@/stores/places'
import { usePlansStore } from '@/stores/plans'
import type { PlaceContentItem } from '@/types/content'
import { formatVisitedDate } from '@/utils/contentItem'

const placesStore = usePlacesStore()
const plansStore = usePlansStore()
const placeId = ref('')
const animating = ref(false)
const showBadge = ref(false)
const showAddPlan = ref(false)
const deleting = ref(false)
const loading = ref(true)
const error = ref('')
const notFound = ref(false)
const place = ref<PlaceContentItem>()

const navTitle = computed(() => place.value?.name || '想去详情')
const visitedDate = computed(() => formatVisitedDate(place.value?.visitedAt ?? null))

onLoad((query) => {
  void plansStore.hydrate()
  placeId.value = typeof query?.id === 'string' ? decodeURIComponent(query.id) : ''
  void loadPlace()
})

async function loadPlace() {
  loading.value = true
  error.value = ''
  notFound.value = false
  if (!placeId.value) {
    notFound.value = true
    loading.value = false
    return
  }
  try {
    place.value = await getPlaceById(placeId.value, { showError: false })
    showBadge.value = place.value.visited
  } catch (loadError) {
    if (loadError instanceof ApiError && loadError.statusCode === 404) notFound.value = true
    else error.value = loadError instanceof Error ? loadError.message : '详情加载失败'
  } finally {
    loading.value = false
  }
}

async function handleVisitedChange() {
  if (!place.value || animating.value) return

  animating.value = true
  const nextVisited = !place.value.visited
  try {
    place.value = await updateContentItemVisited<PlaceContentItem>(place.value.id, nextVisited)
    showBadge.value = place.value.visited
    placesStore.removePlace(place.value.id)
    placesStore.invalidate()
    uni.showToast({ title: nextVisited ? '已标记为去过' : '已撤销去过', icon: 'success' })
  } catch {
    animating.value = false
    return
  }

  setTimeout(() => {
    animating.value = false
  }, 350)
}

async function performDelete() {
  const target = place.value
  if (!target || deleting.value) return

  deleting.value = true
  uni.showLoading({ title: '正在删除…', mask: true })
  try {
    await deleteContentItem(target.id)
    placesStore.removePlace(target.id)
  } catch {
    return
  } finally {
    deleting.value = false
    uni.hideLoading()
  }

  uni.showToast({ title: '已删除', icon: 'success' })
  setTimeout(() => {
    uni.navigateBack()
  }, 450)
}

function confirmDelete() {
  if (!place.value || deleting.value) return

  uni.showModal({
    title: '删除地点',
    content: `确定删除“${place.value.name}”吗？删除后无法恢复。`,
    confirmText: '删除',
    confirmColor: '#e76546',
    success: (result) => {
      if (result.confirm) void performDelete()
    },
  })
}

function handleMore() {
  if (!place.value || deleting.value) return

  uni.showActionSheet({
    itemList: ['删除地点'],
    itemColor: '#e76546',
    success: (result) => {
      if (result.tapIndex === 0) confirmDelete()
    },
  })
}

function onAddSuccess({
  planId,
  planStatus,
  label,
}: {
  planId: string
  planStatus: 'active' | 'backup' | 'completed'
  label: string
}) {
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
    <CustomNavbar :title="navTitle" :show-back="true" :show-brand="false">
      <template #right>
        <view v-if="place" class="navbar-more" hover-class="navbar-more--hover" @tap="handleMore">
          <text class="navbar-more__icon">•••</text>
        </view>
      </template>
    </CustomNavbar>

    <view v-if="loading" class="empty">
      <text class="empty__text">正在加载…</text>
    </view>

    <view v-else-if="place" class="detail">
      <view class="detail__cover-wrap">
        <AppImage class="detail__cover" :src="place.image" mode="aspectFill" />

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

        <ContentLocationCard
          v-if="place.location"
          kind="place"
          :content-id="place.id"
          :location="place.location"
        />

        <view v-if="place.visited" class="detail__status">
          <text class="detail__status-label">去过了</text>
          <text class="detail__status-date">{{ visitedDate }}</text>
        </view>
      </view>

      <view class="detail__footer">
        <view
          class="detail__btn detail__btn--secondary"
          hover-class="detail__btn--hover"
          :hover-stay-time="100"
          @tap="handleVisitedChange"
        >
          <text class="detail__btn-text detail__btn-text--secondary">
            {{ place.visited ? '撤销去过' : '标记为去过' }}
          </text>
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
      <text class="empty__text">{{ notFound ? '没有找到这个地方' : error }}</text>
      <view v-if="!notFound" class="detail__btn" @tap="loadPlace"><text>重新加载</text></view>
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
.navbar-more {
  display: flex;
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
}

.navbar-more--hover {
  opacity: 0.5;
}

.navbar-more__icon {
  color: #2f2f2f;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 2px;
  line-height: 1;
  transform: translateY(-2px);
}

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
  min-width: 0;
  font-size: 44rpx;
  font-weight: 700;
  color: #252525;
  line-height: 1.3;
  overflow-wrap: anywhere;
  word-break: break-all;
}

.detail__type {
  min-width: 0;
  font-size: 26rpx;
  color: #999999;
  line-height: 1.4;
  overflow-wrap: anywhere;
  word-break: break-all;
}

.detail__quote {
  display: flex;
  align-items: flex-start;
  gap: 8rpx;
  min-width: 0;
  overflow: hidden;
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
  min-width: 0;
  font-size: 28rpx;
  font-weight: 500;
  color: #6b5344;
  line-height: 1.5;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-all;
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

.detail__status-date {
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
