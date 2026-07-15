<script setup lang="ts">
const emit = defineEmits<{
  add: []
}>()
</script>

<template>
  <view class="empty" @tap="emit('add')">
    <text class="empty__hint">暂时没有安排</text>
  </view>
</template>

<style lang="scss" scoped>
.empty {
  height: 100rpx;
  display: flex;
  align-items: center;
  padding: 0 4rpx;
  box-sizing: border-box;
  border-bottom: 2rpx dashed #eadfd6;
  background: transparent;
}

.empty__hint {
  font-size: 24rpx;
  color: #aaaaaa;
  line-height: 1.3;
}

</style>
