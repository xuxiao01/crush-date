<script setup lang="ts">
import { computed, ref } from 'vue'
import BasePage from '@/components/BasePage/index.vue'
import CustomNavbar from '@/components/CustomNavbar/index.vue'
import { useAppStore } from '@/stores/app'
import { getPlatform, getPlatformLabel } from '@/utils/platform'
import { getStorage, setStorage } from '@/utils/storage'

const STORAGE_KEY = 'debug_storage_key'

const appStore = useAppStore()
const platform = getPlatform()
const platformLabel = computed(() => getPlatformLabel(platform))

const storageResult = ref('未测试')
const systemInfoSummary = ref('加载中...')

function loadSystemInfo() {
  try {
    const info = uni.getSystemInfoSync()
    systemInfoSummary.value = [
      `品牌: ${info.brand || '-'}`,
      `型号: ${info.model || '-'}`,
      `系统: ${info.system || '-'}`,
      `屏幕: ${info.screenWidth || 0} x ${info.screenHeight || 0}`,
      `uniPlatform: ${info.uniPlatform || '-'}`,
    ].join('\n')
  } catch (error) {
    systemInfoSummary.value = '获取系统信息失败'
    console.warn('[debug] getSystemInfoSync failed', error)
  }
}

function handleStorageTest() {
  const payload = {
    from: 'debug-page',
    timestamp: Date.now(),
  }

  setStorage(STORAGE_KEY, payload)
  const saved = getStorage<typeof payload>(STORAGE_KEY)
  storageResult.value = saved
    ? `已读取: ${saved.from} @ ${saved.timestamp}`
    : '读取失败'
}

function handleIncrement() {
  appStore.increment()
}

function handleToastTest() {
  uni.showToast({
    title: '调试页 Toast 正常',
    icon: 'none',
  })
}

function goHome() {
  uni.navigateBack({
    fail: () => {
      uni.reLaunch({
        url: '/pages/home/index',
      })
    },
  })
}

loadSystemInfo()
handleStorageTest()
</script>

<template>
  <BasePage>
    <CustomNavbar title="调试页" :show-back="true" :show-brand="false" />

    <view class="debug">
      <view class="debug-card">
        <text class="debug-card__title">平台信息</text>
        <text class="debug-card__line">当前平台：{{ platformLabel }}</text>
        <text class="debug-card__line">平台标识：{{ platform }}</text>
        <!-- #ifdef H5 -->
        <text class="debug-card__line compile-flag">H5 条件编译已生效</text>
        <!-- #endif -->
        <!-- #ifdef MP-WEIXIN -->
        <text class="debug-card__line compile-flag">MP-WEIXIN 条件编译已生效</text>
        <!-- #endif -->
        <!-- #ifndef H5 || MP-WEIXIN -->
        <text class="debug-card__line compile-flag">其他平台条件编译</text>
        <!-- #endif -->
      </view>

      <view class="debug-card">
        <text class="debug-card__title">系统信息摘要</text>
        <text class="debug-card__multiline">{{ systemInfoSummary }}</text>
      </view>

      <view class="debug-card">
        <text class="debug-card__title">Pinia 状态</text>
        <text class="debug-card__line">当前计数：{{ appStore.count }}</text>
        <text class="debug-card__line">
          初始化状态：{{ appStore.initialized ? '已完成' : '未完成' }}
        </text>
        <button class="btn btn--ghost" @tap="handleIncrement">计数 +1</button>
      </view>

      <view class="debug-card">
        <text class="debug-card__title">本地存储测试</text>
        <text class="debug-card__multiline">{{ storageResult }}</text>
        <button class="btn btn--secondary" @tap="handleStorageTest">
          重新测试存储
        </button>
      </view>

      <view class="action-list">
        <button class="btn btn--primary btn--block" @tap="handleToastTest">
          测试 Toast
        </button>
        <button class="btn btn--ghost btn--block" @tap="goHome">返回首页</button>
      </view>
    </view>
  </BasePage>
</template>

<style lang="scss" scoped>
@import '@/styles/mixins.scss';

.debug {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.debug-card {
  @include card-surface;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  padding: 28rpx;
}

.debug-card__title {
  font-size: 30rpx;
  font-weight: 700;
  color: $color-text-primary;
}

.debug-card__line,
.debug-card__multiline {
  font-size: 26rpx;
  color: $color-text-secondary;
  line-height: 1.6;
}

.compile-flag {
  color: $color-primary;
  font-weight: 600;
}

.action-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  padding-bottom: 24rpx;
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80rpx;
  padding: 0 28rpx;
  border-radius: 999rpx;
  font-size: 28rpx;
  font-weight: 600;
}

.btn--block {
  width: 100%;
}

.btn--primary {
  background: linear-gradient(135deg, $color-primary, #ffb38f);
  color: #fff;
}

.btn--secondary {
  background: $color-secondary;
  color: $color-text-primary;
}

.btn--ghost {
  background: #fff;
  color: $color-primary;
  border: 2rpx solid rgba(255, 143, 112, 0.35);
}
</style>
