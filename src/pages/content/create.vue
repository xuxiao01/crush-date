<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import BasePage from '@/components/BasePage/index.vue'
import CustomNavbar from '@/components/CustomNavbar/index.vue'
import { createContentItem } from '@/api/content'
import { useFoodsStore } from '@/stores/foods'
import { usePlacesStore } from '@/stores/places'

type ContentKind = 'food' | 'place'

const kind = ref<ContentKind>('food')
const name = ref('')
const type = ref('')
const comment = ref('')
const image = ref('')
const saving = ref(false)

const foodsStore = useFoodsStore()
const placesStore = usePlacesStore()

const copy = computed(() =>
  kind.value === 'food'
    ? {
        title: '新建美食',
        imageTitle: '美食封面',
        nameLabel: '美食名称',
        namePlaceholder: '例如：阿里郎朝鲜烤肉',
        typeLabel: '美食分类',
        typePlaceholder: '例如：烤肉 · 朝鲜风味',
        commentLabel: '想说的话',
        commentPlaceholder: '为什么想和对方一起去吃？',
        submit: '加入想吃清单',
        success: '已加入想吃清单',
      }
    : {
        title: '新建想去地点',
        imageTitle: '地点封面',
        nameLabel: '地点名称',
        namePlaceholder: '例如：颐和园傍晚散步',
        typeLabel: '地点分类',
        typePlaceholder: '例如：公园 · 散步',
        commentLabel: '想说的话',
        commentPlaceholder: '为什么想和对方一起去？',
        submit: '加入想去清单',
        success: '已加入想去清单',
      },
)

onLoad((options) => {
  kind.value = options?.kind === 'place' ? 'place' : 'food'
})

function chooseCover() {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (result) => {
      image.value = result.tempFilePaths[0] || ''
    },
  })
}

function clearCover() {
  image.value = ''
}

function validate() {
  if (!image.value) return '请先选择一张封面图'
  if (!name.value.trim()) return `请填写${copy.value.nameLabel}`
  if (!type.value.trim()) return `请填写${copy.value.typeLabel}`
  return ''
}

async function submit() {
  if (saving.value) return
  const message = validate()
  if (message) {
    uni.showToast({ title: message, icon: 'none' })
    return
  }

  saving.value = true
  try {
    const createdItem = await createContentItem({
      filePath: image.value,
      contentType: kind.value,
      name: name.value.trim(),
      type: type.value.trim(),
      comment: comment.value.trim(),
    })

    const payload = {
      id: createdItem.id,
      name: createdItem.name,
      type: createdItem.type,
      comment: createdItem.comment,
      image: createdItem.image,
    }

    if (kind.value === 'food') {
      foodsStore.addFood(payload)
    } else {
      placesStore.addPlace(payload)
    }

    uni.showToast({ title: copy.value.success, icon: 'success' })
    setTimeout(() => {
      uni.navigateBack()
    }, 450)
  } catch (error) {
    uni.showToast({
      title: error instanceof Error ? error.message : '新增失败，请重试',
      icon: 'none',
    })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <BasePage>
    <CustomNavbar :title="copy.title" :show-back="true" :show-brand="false" />

    <view class="create-content">
      <view class="cover-field">
        <view class="field-heading">
          <text class="field-heading__label">{{ copy.imageTitle }}</text>
          <text class="field-heading__required">必填 · 仅 1 张</text>
        </view>

        <view v-if="image" class="cover-preview">
          <image class="cover-preview__image" :src="image" mode="aspectFill" />
          <view class="cover-preview__actions">
            <view class="cover-action" @tap="chooseCover"><text>更换图片</text></view>
            <view class="cover-action cover-action--danger" @tap="clearCover"
              ><text>删除</text></view
            >
          </view>
        </view>

        <view v-else class="cover-picker" hover-class="cover-picker--hover" @tap="chooseCover">
          <view class="cover-picker__plus"><text>＋</text></view>
          <text class="cover-picker__title">选择一张图片</text>
          <text class="cover-picker__hint">支持从相册选择或直接拍摄</text>
        </view>

        <text class="upload-tip">提交时会自动上传图片，支持 JPG、PNG、WebP，最大 5MB。</text>
      </view>

      <view class="form-card">
        <view class="form-field">
          <text class="form-field__label"
            >{{ copy.nameLabel }} <text class="required">*</text></text
          >
          <input
            v-model="name"
            class="form-field__input"
            :placeholder="copy.namePlaceholder"
            placeholder-class="form-field__placeholder"
            maxlength="30"
          />
        </view>

        <view class="form-field">
          <text class="form-field__label"
            >{{ copy.typeLabel }} <text class="required">*</text></text
          >
          <input
            v-model="type"
            class="form-field__input"
            :placeholder="copy.typePlaceholder"
            placeholder-class="form-field__placeholder"
            maxlength="30"
          />
        </view>

        <view class="form-field form-field--last">
          <view class="form-field__label-row">
            <text class="form-field__label">{{ copy.commentLabel }}</text>
            <text class="form-field__optional">选填</text>
          </view>
          <textarea
            v-model="comment"
            class="form-field__textarea"
            :placeholder="copy.commentPlaceholder"
            placeholder-class="form-field__placeholder"
            maxlength="100"
          />
          <text class="form-field__count">{{ comment.length }}/100</text>
        </view>
      </view>

      <view class="status-tip">
        <text class="status-tip__dot">●</text>
        <text>保存后默认放入“{{ kind === 'food' ? '还没吃' : '还没去' }}”列表</text>
      </view>

      <button class="submit-button" :disabled="saving" @tap="submit">
        {{ saving ? '正在保存…' : copy.submit }}
      </button>
    </view>
  </BasePage>
</template>

<style lang="scss" scoped>
.create-content {
  display: flex;
  flex-direction: column;
  gap: 28rpx;
  padding: 12rpx 0 calc(40rpx + env(safe-area-inset-bottom));
}

.cover-field,
.form-card {
  overflow: hidden;
  border: 2rpx solid #f3d6c3;
  border-radius: 28rpx;
  background: #fffdfb;
}

.cover-field {
  padding: 28rpx;
}

.field-heading,
.form-field__label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.field-heading {
  margin-bottom: 20rpx;
}

.field-heading__label,
.form-field__label {
  color: #4a3b34;
  font-size: 28rpx;
  font-weight: 600;
}

.field-heading__required,
.form-field__optional {
  color: #ae9587;
  font-size: 22rpx;
}

.cover-picker {
  display: flex;
  min-height: 300rpx;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2rpx dashed #e8bfa8;
  border-radius: 22rpx;
  background: linear-gradient(145deg, #fff8f2 0%, #fff1ef 100%);
}

.cover-picker--hover {
  opacity: 0.7;
}

.cover-picker__plus {
  display: flex;
  width: 78rpx;
  height: 78rpx;
  align-items: center;
  justify-content: center;
  margin-bottom: 16rpx;
  border-radius: 50%;
  background: #ffffff;
  color: #ff8061;
  font-size: 54rpx;
  font-weight: 300;
  box-shadow: 0 10rpx 30rpx rgba(255, 128, 97, 0.14);
}

.cover-picker__title {
  color: #5d493f;
  font-size: 28rpx;
  font-weight: 600;
}

.cover-picker__hint,
.upload-tip {
  color: #a28e83;
  font-size: 22rpx;
}

.cover-picker__hint {
  margin-top: 8rpx;
}

.upload-tip {
  display: block;
  margin-top: 16rpx;
  line-height: 1.5;
}

.cover-preview {
  overflow: hidden;
  border-radius: 22rpx;
  background: #f5ebe4;
}

.cover-preview__image {
  display: block;
  width: 100%;
  height: 340rpx;
}

.cover-preview__actions {
  display: flex;
  background: #ffffff;
}

.cover-action {
  display: flex;
  min-height: 82rpx;
  flex: 1;
  align-items: center;
  justify-content: center;
  color: #ff7958;
  font-size: 26rpx;
}

.cover-action + .cover-action {
  border-left: 2rpx solid #f4e4da;
}

.cover-action--danger {
  color: #a88f83;
}

.form-field {
  position: relative;
  padding: 28rpx;
  border-bottom: 2rpx solid #f4e6dd;
}

.form-field--last {
  border-bottom: 0;
}

.required {
  color: #ff7958;
}

.form-field__input,
.form-field__textarea {
  width: 100%;
  color: #332d2a;
  font-size: 28rpx;
  box-sizing: border-box;
}

.form-field__input {
  height: 72rpx;
  margin-top: 8rpx;
}

.form-field__textarea {
  height: 170rpx;
  margin-top: 22rpx;
  padding: 0;
  line-height: 1.55;
}

.form-field__placeholder {
  color: #b8aaa2;
}

.form-field__count {
  position: absolute;
  right: 28rpx;
  bottom: 20rpx;
  color: #c0afa5;
  font-size: 20rpx;
}

.status-tip {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 0 6rpx;
  color: #93796a;
  font-size: 24rpx;
}

.status-tip__dot {
  color: #ffad91;
  font-size: 16rpx;
}

.submit-button {
  display: flex;
  width: 100%;
  height: 100rpx;
  align-items: center;
  justify-content: center;
  margin-top: 8rpx;
  border-radius: 999rpx;
  background: linear-gradient(90deg, #ff8a5e 0%, #ff8198 100%);
  color: #ffffff;
  font-size: 30rpx;
  font-weight: 700;
  box-shadow: 0 14rpx 34rpx rgba(255, 126, 105, 0.2);
}

.submit-button[disabled] {
  opacity: 0.65;
}
</style>
