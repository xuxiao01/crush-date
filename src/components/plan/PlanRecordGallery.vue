<script setup lang="ts">
import AppImage from '@/components/AppImage/index.vue'
import { computed, ref } from 'vue'
import type { PlanItem } from '@/types/plan'
import { PERIOD_LABELS } from '@/types/plan'
import { groupPlanRecordItems } from '@/utils/planRecordGallery'

const PERIOD_ICONS = {
  morning: '☀',
  noon: '☀',
  afternoon: '☀',
  evening: '☾',
} as const

const props = defineProps<{
  items: PlanItem[]
}>()

const selectedItem = ref<PlanItem | null>(null)
const groups = computed(() => groupPlanRecordItems(props.items))

function openItem(item: PlanItem) {
  selectedItem.value = item
}

function closeItem() {
  selectedItem.value = null
}

function tileClass(groupIndex: number, itemIndex: number) {
  const group = groups.value[groupIndex]
  return {
    'record-gallery__tile--main': group?.layout === 'triple' && itemIndex === 0,
    'record-gallery__tile--small': group?.layout === 'triple' && itemIndex > 0,
  }
}
</script>

<template>
  <view class="record-gallery">
    <view v-if="groups.length" class="record-gallery__groups">
      <view
        v-for="(group, groupIndex) in groups"
        :key="group.items.map((item) => item.id).join('-')"
        class="record-gallery__group"
        :class="[
          `record-gallery__group--${group.layout}`,
          { 'record-gallery__group--mirrored': group.mirrored },
        ]"
      >
        <view
          v-for="(item, itemIndex) in group.items"
          :key="item.id"
          class="record-gallery__tile"
          :class="tileClass(groupIndex, itemIndex)"
          hover-class="record-gallery__tile--hover"
          :hover-stay-time="100"
          @tap="openItem(item)"
        >
          <AppImage
            v-if="item.image"
            class="record-gallery__image"
            :lazy-load="groupIndex * 3 + itemIndex >= 4"
            :src="item.image"
            mode="aspectFill"
          />
          <view v-else class="record-gallery__fallback">
            <text class="record-gallery__fallback-mark">✦</text>
            <text class="record-gallery__fallback-title">{{ item.title }}</text>
          </view>
          <view class="record-gallery__period">
            <text>{{ PERIOD_ICONS[item.period] }} {{ PERIOD_LABELS[item.period] }}</text>
          </view>
        </view>
      </view>
    </view>

    <view v-else class="record-gallery__empty">
      <text>那天没有安排</text>
    </view>

    <view v-if="selectedItem" class="item-mask" @tap="closeItem">
      <view class="item-dialog" @tap.stop>
        <button class="item-dialog__close" @tap="closeItem">×</button>
        <AppImage
          v-if="selectedItem.image"
          class="item-dialog__cover"
          :src="selectedItem.image"
          mode="aspectFill"
        />
        <view v-else class="item-dialog__cover item-dialog__cover--fallback">
          <text class="item-dialog__cover-mark">✦</text>
          <text class="item-dialog__cover-title">{{ selectedItem.title }}</text>
        </view>
        <view class="item-dialog__body">
          <text class="item-dialog__period">{{ PERIOD_LABELS[selectedItem.period] }}</text>
          <text class="item-dialog__title">{{ selectedItem.title }}</text>
          <text class="item-dialog__note">{{ selectedItem.note || '那天没有留下备注' }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.record-gallery__groups {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.record-gallery__group {
  display: grid;
  width: 100%;
  gap: 14rpx;
}

.record-gallery__group--single {
  grid-template-columns: minmax(0, 1fr);
}

.record-gallery__group--double {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.record-gallery__group--triple {
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  grid-template-rows: repeat(2, 204rpx);
}

.record-gallery__group--triple.record-gallery__group--mirrored {
  grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
}

.record-gallery__tile {
  position: relative;
  min-width: 0;
  overflow: hidden;
  border: 2rpx solid rgba(255, 196, 168, 0.58);
  border-radius: 22rpx;
  background: #f2e5da;
  box-sizing: border-box;
  transition:
    opacity 140ms ease,
    transform 140ms ease;
}

.record-gallery__tile--hover {
  opacity: 0.88;
  transform: scale(0.985);
}

.record-gallery__group--single .record-gallery__tile {
  height: 360rpx;
}

.record-gallery__group--double .record-gallery__tile {
  height: 0;
  padding-top: 100%;
}

.record-gallery__group--triple .record-gallery__tile--main {
  grid-column: 1;
  grid-row: 1 / 3;
}

.record-gallery__group--triple .record-gallery__tile--small:nth-child(2) {
  grid-column: 2;
  grid-row: 1;
}

.record-gallery__group--triple .record-gallery__tile--small:nth-child(3) {
  grid-column: 2;
  grid-row: 2;
}

.record-gallery__group--triple.record-gallery__group--mirrored .record-gallery__tile--main {
  grid-column: 2;
}

.record-gallery__group--triple.record-gallery__group--mirrored
  .record-gallery__tile--small:nth-child(2),
.record-gallery__group--triple.record-gallery__group--mirrored
  .record-gallery__tile--small:nth-child(3) {
  grid-column: 1;
}

.record-gallery__image,
.record-gallery__fallback {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.record-gallery__image {
  display: block;
}

.record-gallery__fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 10rpx;
  padding: 20rpx;
  background: linear-gradient(145deg, #f7dec9, #f1c9cf);
  box-sizing: border-box;
}

.record-gallery__fallback-mark {
  font-size: 34rpx;
  color: rgba(176, 111, 83, 0.6);
}

.record-gallery__fallback-title {
  max-width: 100%;
  overflow: hidden;
  font-size: 23rpx;
  font-weight: 600;
  color: #7d5e50;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.record-gallery__period {
  position: absolute;
  left: 14rpx;
  bottom: 14rpx;
  z-index: 1;
  padding: 6rpx 11rpx;
  border: 2rpx solid rgba(255, 137, 94, 0.35);
  border-radius: 999rpx;
  background: rgba(255, 248, 240, 0.88);
  backdrop-filter: blur(8rpx);
  font-size: 18rpx;
  font-weight: 600;
  color: #7a493a;
  line-height: 1;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.record-gallery__empty {
  min-height: 220rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx dashed #ded5ce;
  border-radius: 22rpx;
  background: #f7f1ec;
  font-size: 25rpx;
  color: #aaa;
}

.item-mask {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 44rpx 32rpx;
  background: rgba(48, 31, 23, 0.54);
  box-sizing: border-box;
}

.item-dialog {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 640rpx;
  max-height: calc(100vh - 88rpx);
  overflow: hidden;
  border: 2rpx solid rgba(255, 207, 184, 0.72);
  border-radius: 32rpx;
  background: #fffaf6;
  box-shadow: 0 26rpx 70rpx rgba(70, 42, 29, 0.24);
}

.item-dialog__close {
  position: absolute;
  top: 18rpx;
  right: 18rpx;
  z-index: 2;
  width: 58rpx;
  height: 58rpx;
  margin: 0;
  padding: 0;
  border-radius: 50%;
  background: rgba(255, 250, 246, 0.9);
  font-size: 38rpx;
  font-weight: 300;
  line-height: 54rpx;
  color: #806d63;
}

.item-dialog__close::after {
  border: 0;
}

.item-dialog__cover {
  display: block;
  flex-shrink: 0;
  width: 100%;
  height: 360rpx;
  background: #f2e5da;
}

.item-dialog__cover--fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 12rpx;
  padding: 36rpx;
  background: linear-gradient(145deg, #f7dec9, #f1c9cf);
  box-sizing: border-box;
}

.item-dialog__cover-mark {
  font-size: 52rpx;
  color: rgba(176, 111, 83, 0.64);
}

.item-dialog__cover-title {
  max-width: 100%;
  font-size: 29rpx;
  font-weight: 700;
  color: #76584b;
  text-align: center;
}

.item-dialog__body {
  display: flex;
  min-height: 0;
  overflow-y: auto;
  flex-direction: column;
  padding: 28rpx 30rpx 34rpx;
}

.item-dialog__period {
  font-size: 22rpx;
  color: #b1846f;
}

.item-dialog__title {
  margin-top: 8rpx;
  font-size: 34rpx;
  font-weight: 700;
  color: #3e332e;
  line-height: 1.35;
}

.item-dialog__note {
  margin-top: 16rpx;
  font-size: 25rpx;
  color: #806f66;
  line-height: 1.65;
  white-space: pre-wrap;
}
</style>
