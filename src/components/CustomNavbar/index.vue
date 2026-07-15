<script setup lang="ts">
import { computed, onMounted, ref, useSlots } from 'vue'

const props = withDefaults(
  defineProps<{
    title?: string
    showBack?: boolean
    showBrand?: boolean
    background?: string
    /** 浅色文字（用于深色全屏页） */
    light?: boolean
    titleAlign?: 'left' | 'center'
    titleSize?: string
    showShadow?: boolean
    largeHit?: boolean
  }>(),
  {
    title: '',
    showBack: false,
    showBrand: false,
    background: '#fffaf6',
    light: false,
    titleAlign: 'center',
    titleSize: '',
    showShadow: false,
    largeHit: false,
  },
)

const slots = useSlots()
const statusBarHeight = ref(0)
const navBarHeight = ref(44)
const sideWidth = ref(44)
const rightSafeInset = ref(0)

function initLayout() {
  try {
    const sys = uni.getSystemInfoSync()
    statusBarHeight.value = sys.statusBarHeight || 0

    let nextNavHeight = 44
    let nextSideWidth = 44
    let nextRightSafeInset = 0

    // #ifdef MP-WEIXIN
    const menu = uni.getMenuButtonBoundingClientRect()
    if (menu && menu.width > 0 && menu.height > 0) {
      nextNavHeight = (menu.top - statusBarHeight.value) * 2 + menu.height
      nextSideWidth = Math.max(44, sys.windowWidth - menu.left)
      nextRightSafeInset = Math.max(0, sys.windowWidth - menu.left + 4)
    }
    // #endif

    navBarHeight.value = nextNavHeight > 0 ? nextNavHeight : 44
    sideWidth.value = nextSideWidth > 0 ? nextSideWidth : 44
    rightSafeInset.value = nextRightSafeInset
  } catch (error) {
    console.warn('[CustomNavbar] layout init failed', error)
    statusBarHeight.value = 0
    navBarHeight.value = 44
    sideWidth.value = 44
    rightSafeInset.value = 0
  }
}

initLayout()
onMounted(() => {
  initLayout()
})

const totalHeight = computed(() => statusBarHeight.value + navBarHeight.value)
const hasRight = computed(() => Boolean(slots.right))

function handleBack() {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
    return
  }

  uni.switchTab({
    url: '/pages/home/index',
  })
}
</script>

<template>
  <view class="custom-navbar-wrap">
    <view
      class="custom-navbar"
      :class="{
        'custom-navbar--light': light,
        'custom-navbar--shadow': showShadow,
      }"
      :style="{
        paddingTop: `${statusBarHeight}px`,
        background: props.background,
      }"
    >
      <view class="custom-navbar__bar" :style="{ height: `${navBarHeight}px` }">
        <view
          class="custom-navbar__side custom-navbar__side--left"
          :style="{ width: titleAlign === 'left' ? 'auto' : `${sideWidth}px` }"
        >
          <view
            v-if="showBack"
            class="custom-navbar__hit"
            :class="{ 'custom-navbar__hit--large': largeHit }"
            @tap="handleBack"
          >
            <text class="custom-navbar__back-icon">‹</text>
          </view>
          <view v-else-if="titleAlign === 'left'" class="custom-navbar__left-title">
            <text
              class="custom-navbar__title custom-navbar__title--left"
              :style="titleSize ? { fontSize: titleSize } : undefined"
            >
              {{ title }}
            </text>
          </view>
        </view>

        <view
          v-if="titleAlign === 'center'"
          class="custom-navbar__center"
          :style="{
            paddingLeft: `${sideWidth}px`,
            paddingRight: `${sideWidth}px`,
          }"
        >
          <view class="custom-navbar__title-group">
            <image
              v-if="showBrand"
              class="custom-navbar__brand-image"
              src="/static/brand/fluent-droplet.png"
              mode="aspectFit"
            />
            <text
              class="custom-navbar__title"
              :style="titleSize ? { fontSize: titleSize } : undefined"
            >
              {{ title }}
            </text>
          </view>
        </view>

        <view
          class="custom-navbar__side custom-navbar__side--right"
          :style="{ width: hasRight || titleAlign === 'center' ? `${sideWidth}px` : 'auto' }"
        >
          <view
            class="custom-navbar__right-content"
            :style="{ marginRight: `${rightSafeInset}px` }"
          >
            <slot name="right" />
          </view>
        </view>
      </view>
    </view>

    <view class="custom-navbar__placeholder" :style="{ height: `${totalHeight}px` }" />
  </view>
</template>

<style lang="scss" scoped>
.custom-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 500;
  transition: box-shadow 180ms ease;
}

.custom-navbar--shadow {
  box-shadow: 0 4rpx 16rpx rgba(80, 50, 30, 0.06);
}

.custom-navbar__bar {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
  padding: 0 8px;
}

.custom-navbar__side {
  position: relative;
  z-index: 2;
  flex-shrink: 0;
  height: 100%;
  display: flex;
  align-items: center;
  box-sizing: border-box;
}

.custom-navbar__side--left {
  justify-content: flex-start;
  min-width: 44px;
}

.custom-navbar__side--right {
  justify-content: flex-end;
  min-width: 44px;
}

.custom-navbar__right-content {
  flex-shrink: 0;
}

.custom-navbar__center {
  position: absolute;
  left: 0;
  right: 0;
  z-index: 1;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  pointer-events: none;
}

.custom-navbar__title-group {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  max-width: 100%;
  min-width: 0;
}

.custom-navbar__left-title {
  padding-left: 8px;
}

.custom-navbar__title {
  font-size: 17px;
  font-weight: 600;
  color: #1f1f1f;
  line-height: 1.2;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.custom-navbar__title--left {
  font-weight: 700;
}

.custom-navbar__hit {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.custom-navbar__hit--large {
  width: 44px;
  min-width: 44px;
  height: 44px;
  min-height: 44px;
  /* 88rpx ≈ 44px on many devices; pad for larger tap */
  padding: 2px;
  box-sizing: content-box;
}

.custom-navbar__back-icon {
  font-size: 32px;
  font-weight: 400;
  color: #2f2f2f;
  line-height: 1;
  transform: translateY(-1px);
}

.custom-navbar__brand-image {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  display: block;
  background: transparent;
}

.custom-navbar--light .custom-navbar__title,
.custom-navbar--light .custom-navbar__back-icon {
  color: #ffffff;
}

.custom-navbar__placeholder {
  width: 100%;
}
</style>
