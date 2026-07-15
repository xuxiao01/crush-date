<script setup lang="ts">
const props = defineProps<{
  title: string
  description: string
  count: number
  image: string
  theme: 'food' | 'play'
  url: string
}>()

function go() {
  uni.navigateTo({ url: props.url })
}
</script>

<template>
  <view
    class="list-card"
    :class="`list-card--${theme}`"
    hover-class="list-card--hover"
    :hover-stay-time="100"
    @tap="go"
  >
    <view class="list-card__text">
      <text class="list-card__title">{{ title }}</text>
      <text class="list-card__desc">{{ description }}</text>
    </view>

    <view class="list-card__tag">
      <text class="list-card__tag-text">收藏了 {{ count }} 个地方</text>
    </view>

    <image class="list-card__image" :src="image" mode="aspectFit" />

    <view class="list-card__arrow">
      <text class="list-card__arrow-icon">›</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.list-card {
  position: relative;
  width: calc(100% - 48rpx);
  height: 420rpx;
  margin: 0 auto;
  overflow: hidden;
  border-radius: 30rpx;
  border: 1px solid transparent;
  box-shadow: 0 12rpx 32rpx rgba(120, 70, 40, 0.06);
  transition: transform 180ms ease;
}

.list-card:active,
.list-card--hover {
  transform: scale(0.98);
}

.list-card--food {
  background: linear-gradient(90deg, #fffaf3 0%, #ffe4c8 100%);
  border-color: #ffc996;
}

.list-card--play {
  background: linear-gradient(90deg, #fffaf6 0%, #ffd6dc 100%);
  border-color: #ffb3b9;
}

.list-card__text {
  position: absolute;
  left: 38rpx;
  top: 72rpx;
  z-index: 2;
  width: calc(100% - 380rpx);
  max-width: 38%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.list-card__title {
  font-size: 40rpx;
  font-weight: 700;
  color: #1f1f1f;
  line-height: 1.3;
}

.list-card__desc {
  display: block;
  width: 100%;
  margin-top: 24rpx;
  font-size: 26rpx;
  color: #777;
  line-height: 1.4;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.list-card__tag {
  position: absolute;
  left: 38rpx;
  bottom: 48rpx;
  z-index: 2;
  display: flex;
  align-items: center;
  height: 58rpx;
  padding: 0 24rpx;
  border-radius: 29rpx;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid transparent;
  box-sizing: border-box;
}

.list-card--food .list-card__tag {
  border-color: rgba(255, 138, 50, 0.45);
}

.list-card--play .list-card__tag {
  border-color: rgba(255, 127, 134, 0.45);
}

.list-card__tag-text {
  font-size: 24rpx;
  font-weight: 500;
  line-height: 1;
}

.list-card--food .list-card__tag-text {
  color: #ff8a32;
}

.list-card--play .list-card__tag-text {
  color: #ff7f86;
}

.list-card__image {
  position: absolute;
  right: -10rpx;
  bottom: 20rpx;
  z-index: 1;
  width: 390rpx;
  height: 390rpx;
  display: block;
  background: transparent;
}

.list-card__arrow {
  position: absolute;
  right: 24rpx;
  bottom: 24rpx;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 68rpx;
  height: 68rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 6rpx 16rpx rgba(120, 70, 40, 0.12);
}

.list-card__arrow-icon {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  color: #ff8f70;
  line-height: 1;
  padding-bottom: 2rpx;
  transform: translateX(1rpx);
}
</style>
