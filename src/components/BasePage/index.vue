<template>
  <view class="base-page">
    <slot />
  </view>
</template>

<style lang="scss" scoped>
.base-page {
  min-height: 100vh;
  padding: 0 $page-padding;
  padding-bottom: calc(#{$page-padding} + env(safe-area-inset-bottom));
  box-sizing: border-box;
}
</style>
