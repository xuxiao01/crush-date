<script setup lang="ts">
import AppImage from '@/components/AppImage/index.vue'
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import BasePage from '@/components/BasePage/index.vue'
import CustomNavbar from '@/components/CustomNavbar/index.vue'
import DatePickerSheet from '@/components/plan/DatePickerSheet.vue'
import PlanRecordGallery from '@/components/plan/PlanRecordGallery.vue'
import { deletePlanPhoto, getPlanPhotos, uploadPlanPhoto, type PlanPhoto } from '@/api/plans'
import { usePlansStore } from '@/stores/plans'
import { formatZhDate, getEarliestSelectablePlanDate, toPlanDateString } from '@/utils/planDate'
import { deletePhotosSequentially } from '@/utils/planPhotos'

const MAX_FEATURED_PHOTOS = 30
const MAX_PHOTO_SIZE = 5 * 1024 * 1024
const SUPPORTED_PHOTO_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp']
const SUPPORTED_PHOTO_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

interface SelectedPhotoFile {
  path: string
  name: string
  type: string
  size?: number
}

const plansStore = usePlansStore()
const planId = ref('')
const showDate = ref(false)
const showMenu = ref(false)
const date = ref(toPlanDateString())
const featuredPhotos = ref<PlanPhoto[]>([])
const photosReady = ref(false)
const photosLoading = ref(false)
const photoLoadError = ref('')
const uploading = ref(false)
const deleting = ref(false)
const uploadCurrent = ref(0)
const uploadTotal = ref(0)
const isEditingPhotos = ref(false)
const selectedPhotoIds = ref<Set<string>>(new Set())
const deletingSelectedPhotos = ref(false)
const deleteCurrent = ref(0)
const deleteTotal = ref(0)
const cropQueue = ref<string[]>([])
const cropSource = ref('')
const showCropper = ref(false)
const uploadedBatchCount = ref(0)
const plan = computed(() => plansStore.getById(planId.value))
const featuredPhotoUrls = computed(() => featuredPhotos.value.map((photo) => photo.url))
const selectedPhotoCount = computed(() => selectedPhotoIds.value.size)
const processingPhotos = computed(
  () => uploading.value || showCropper.value || cropQueue.value.length > 0,
)
const uploadButtonText = computed(() => {
  if (uploading.value) return `正在上传第 ${uploadCurrent.value}/${uploadTotal.value} 张`
  if (processingPhotos.value) return `裁剪中 ${uploadCurrent.value}/${uploadTotal.value}`
  if (photosLoading.value || !photosReady.value) return '正在加载…'
  if (photoLoadError.value) return '请先重新加载'
  if (featuredPhotos.value.length >= MAX_FEATURED_PHOTOS)
    return `最多上传 ${MAX_FEATURED_PHOTOS} 张`
  return '＋ 上传精选图片'
})
const deleteButtonText = computed(() =>
  deletingSelectedPhotos.value
    ? `正在删除 ${deleteCurrent.value}/${deleteTotal.value}`
    : `删除所选（${selectedPhotoCount.value}）`,
)

onLoad((query) => {
  planId.value = typeof query?.id === 'string' ? decodeURIComponent(query.id) : ''
  void initializeCompletedPlan()
})

async function initializeCompletedPlan() {
  if (!planId.value) {
    photosReady.value = true
    return
  }
  await plansStore.hydrate()
  if (plan.value?.status === 'completed') await loadFeaturedPhotos()
  else photosReady.value = true
}

async function loadFeaturedPhotos() {
  if (!planId.value || plan.value?.status !== 'completed' || photosLoading.value) return
  resetPhotoEditing()
  photosLoading.value = true
  photoLoadError.value = ''
  try {
    featuredPhotos.value = await getPlanPhotos(planId.value)
  } catch (error) {
    photoLoadError.value = error instanceof Error ? error.message : '精选照片加载失败'
  } finally {
    photosLoading.value = false
    photosReady.value = true
  }
}

function chooseFeaturedPhotos() {
  if (
    isEditingPhotos.value ||
    deletingSelectedPhotos.value ||
    processingPhotos.value ||
    photosLoading.value ||
    !photosReady.value ||
    photoLoadError.value
  ) {
    return
  }
  const remaining = MAX_FEATURED_PHOTOS - featuredPhotos.value.length
  if (remaining <= 0) {
    uni.showToast({ title: `每个计划最多上传 ${MAX_FEATURED_PHOTOS} 张精选图片`, icon: 'none' })
    return
  }

  uni.chooseImage({
    count: Math.min(9, remaining),
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    extension: SUPPORTED_PHOTO_EXTENSIONS,
    success: (result) => {
      const filePaths = Array.isArray(result.tempFilePaths)
        ? result.tempFilePaths
        : [result.tempFilePaths]
      const tempFiles = Array.isArray(result.tempFiles) ? result.tempFiles : [result.tempFiles]
      const selectedFiles = filePaths.map((path, index) => {
        const metadata = (tempFiles[index] || {}) as {
          name?: string
          path?: string
          size?: number
          type?: string
        }
        return {
          path,
          name: metadata.name || metadata.path || path,
          type: metadata.type || '',
          size: metadata.size,
        }
      })
      void validateAndStartCropQueue(selectedFiles)
    },
  })
}

async function validateAndStartCropQueue(files: SelectedPhotoFile[]) {
  if (!files.length) return
  if (featuredPhotos.value.length + files.length > MAX_FEATURED_PHOTOS) {
    uni.showToast({
      title: `当前已有照片加上本次选择不能超过 ${MAX_FEATURED_PHOTOS} 张`,
      icon: 'none',
    })
    return
  }

  for (const file of files) {
    if (!isSupportedPhoto(file)) {
      uni.showToast({ title: '仅支持 JPG、PNG、WebP 图片', icon: 'none' })
      return
    }
    try {
      const size = file.size ?? (await getLocalFileSize(file.path))
      if (size > MAX_PHOTO_SIZE) {
        uni.showToast({ title: '单张图片不能超过 5MB', icon: 'none' })
        return
      }
    } catch {
      uni.showToast({ title: '无法读取图片信息，请重新选择', icon: 'none' })
      return
    }
  }

  startCropQueue(files.map((file) => file.path))
}

function isSupportedPhoto(file: SelectedPhotoFile) {
  const mimeType = file.type.toLowerCase()
  if (mimeType) return SUPPORTED_PHOTO_MIME_TYPES.includes(mimeType)
  const cleanName = file.name.split(/[?#]/)[0].toLowerCase()
  const extension = cleanName.includes('.') ? cleanName.split('.').pop() || '' : ''
  return SUPPORTED_PHOTO_EXTENSIONS.includes(extension)
}

function getLocalFileSize(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    uni.getFileInfo({
      filePath,
      success: (result) => resolve(result.size),
      fail: reject,
    })
  })
}

function startCropQueue(filePaths: string[]) {
  if (!filePaths.length) return
  cropQueue.value = filePaths
  uploadCurrent.value = 1
  uploadTotal.value = filePaths.length
  uploadedBatchCount.value = 0
  openCurrentCrop()
}

function openCurrentCrop() {
  const source = cropQueue.value[0]
  if (!source) {
    void finishPhotoBatch()
    return
  }
  cropSource.value = source
  showCropper.value = true
}

async function confirmPhotoCrop(result: { tempFilePath: string }) {
  if (!result.tempFilePath || uploading.value) return
  showCropper.value = false
  cropSource.value = ''
  try {
    const croppedSize = await getLocalFileSize(result.tempFilePath)
    if (croppedSize > MAX_PHOTO_SIZE) {
      await abortPhotoBatch('裁剪后的图片不能超过 5MB')
      return
    }

    uploading.value = true
    const uploadedPhoto = await uploadPlanPhoto(planId.value, result.tempFilePath)
    featuredPhotos.value.push(uploadedPhoto)
    uploadedBatchCount.value += 1
    cropQueue.value.shift()
    uploading.value = false

    if (cropQueue.value.length) {
      uploadCurrent.value += 1
      setTimeout(openCurrentCrop, 120)
      return
    }
    await finishPhotoBatch(true)
  } catch (error) {
    await abortPhotoBatch(error instanceof Error ? error.message : '上传失败，请稍后重试')
  }
}

function cancelPhotoCrop() {
  showCropper.value = false
  if (uploadedBatchCount.value) void finishPhotoBatch()
  else resetPhotoBatch()
}

async function abortPhotoBatch(message: string) {
  uploading.value = false
  showCropper.value = false
  cropQueue.value = []
  cropSource.value = ''
  resetPhotoBatch()
  await loadFeaturedPhotos()
  uni.showToast({ title: message, icon: 'none' })
}

async function finishPhotoBatch(showSuccess = false) {
  const uploadedCount = uploadedBatchCount.value
  uploading.value = false
  showCropper.value = false
  cropQueue.value = []
  cropSource.value = ''
  resetPhotoBatch()
  if (uploadedCount) await loadFeaturedPhotos()

  if (showSuccess && uploadedCount) {
    uni.showToast({
      title: uploadedCount > 1 ? `已上传 ${uploadedCount} 张` : '精选图片已上传',
      icon: 'success',
    })
  }
  resetPhotoBatch()
}

function resetPhotoBatch() {
  cropQueue.value = []
  cropSource.value = ''
  uploadCurrent.value = 0
  uploadTotal.value = 0
  uploadedBatchCount.value = 0
}

function previewFeaturedPhoto(index: number) {
  uni.previewImage({
    current: featuredPhotoUrls.value[index],
    urls: featuredPhotoUrls.value,
  })
}

function togglePhotoEditing() {
  if (
    deletingSelectedPhotos.value ||
    processingPhotos.value ||
    photosLoading.value ||
    photoLoadError.value
  ) {
    return
  }
  if (isEditingPhotos.value) {
    resetPhotoEditing()
    return
  }
  if (!featuredPhotos.value.length) return
  isEditingPhotos.value = true
}

function handlePhotoTap(photo: PlanPhoto, index: number) {
  if (deletingSelectedPhotos.value) return
  if (!isEditingPhotos.value) {
    previewFeaturedPhoto(index)
    return
  }

  const nextSelection = new Set(selectedPhotoIds.value)
  if (nextSelection.has(photo.id)) nextSelection.delete(photo.id)
  else nextSelection.add(photo.id)
  selectedPhotoIds.value = nextSelection
}

function resetPhotoEditing() {
  isEditingPhotos.value = false
  selectedPhotoIds.value = new Set()
}

async function deleteSelectedPhotos() {
  if (
    !plan.value ||
    plan.value.status !== 'completed' ||
    deletingSelectedPhotos.value ||
    !selectedPhotoCount.value
  ) {
    return
  }

  const photoIds = featuredPhotos.value
    .filter((photo) => selectedPhotoIds.value.has(photo.id))
    .map((photo) => photo.id)

  deletingSelectedPhotos.value = true
  deleteCurrent.value = 0
  deleteTotal.value = photoIds.length

  const result = await deletePhotosSequentially(
    photoIds,
    (photoId) => deletePlanPhoto(plan.value!.id, photoId),
    (current, total) => {
      deleteCurrent.value = current
      deleteTotal.value = total
    },
  )

  const deletedIds = new Set(result.deletedPhotoIds)
  featuredPhotos.value = featuredPhotos.value.filter((photo) => !deletedIds.has(photo.id))
  await loadFeaturedPhotos()
  deletingSelectedPhotos.value = false
  deleteCurrent.value = 0
  deleteTotal.value = 0

  if (!result.failures.length) {
    uni.showToast({
      title: `已删除 ${result.deletedPhotoIds.length} 张`,
      icon: 'success',
    })
    return
  }

  const firstError = result.failures[0]?.message || '删除失败，请稍后重试'
  const summary = result.deletedPhotoIds.length
    ? `已删除 ${result.deletedPhotoIds.length} 张，${result.failures.length} 张失败：${firstError}`
    : firstError
  uni.showToast({ title: summary, icon: 'none' })
}

function requestDeleteCompletedPlan() {
  if (!plan.value || deleting.value || deletingSelectedPhotos.value) return
  showMenu.value = false
  uni.showModal({
    title: '删除过去计划',
    content: '删除后，本次过去计划及其精选照片将永久删除，是否继续？',
    confirmText: '永久删除',
    confirmColor: '#d9534f',
    success: (result) => {
      if (result.confirm) void deleteCompletedPlan()
    },
  })
}

async function deleteCompletedPlan() {
  if (!plan.value || deleting.value) return
  deleting.value = true
  const result = await plansStore.deletePlan(plan.value.id)
  deleting.value = false
  if (!result.ok) {
    uni.showToast({ title: result.message, icon: 'none' })
    return
  }

  clearPhotoPageState()
  uni.switchTab({ url: '/pages/plan/index' })
}

function clearPhotoPageState() {
  featuredPhotos.value = []
  photoLoadError.value = ''
  photosReady.value = false
  photosLoading.value = false
  uploading.value = false
  deletingSelectedPhotos.value = false
  deleteCurrent.value = 0
  deleteTotal.value = 0
  resetPhotoEditing()
  showCropper.value = false
  resetPhotoBatch()
}

function openPlanMenu() {
  if (deletingSelectedPhotos.value) return
  showMenu.value = true
}
function showConflict() {
  const active = plansStore.activePlan
  uni.showModal({
    title: '已有本次计划',
    content: '请先完成或删除当前的本次计划。',
    cancelText: '知道了',
    confirmText: '查看本次计划',
    success: (res) => {
      if (res.confirm && active)
        uni.redirectTo({ url: `/pages/plan/detail?id=${encodeURIComponent(active.id)}` })
    },
  })
}
function requestReplan() {
  if (isEditingPhotos.value || deletingSelectedPhotos.value) return
  if (plansStore.activePlan) {
    showConflict()
    return
  }
  showDate.value = true
}
async function replan(value: string) {
  if (!plan.value) return
  const result = await plansStore.replanCompleted(plan.value.id, value)
  if (!result.ok) {
    if (result.reason === 'active_exists') showConflict()
    else uni.showToast({ title: result.message || '创建本次计划失败', icon: 'none' })
    return
  }
  uni.redirectTo({ url: `/pages/plan/detail?id=${encodeURIComponent(result.plan.id)}` })
}
</script>

<template>
  <BasePage>
    <CustomNavbar title="那天的记录" :show-back="true" :large-hit="true">
      <template #right>
        <view class="more" :class="{ 'more--disabled': deletingSelectedPhotos }" @tap="openPlanMenu"
          ><text>⋯</text></view
        >
      </template>
    </CustomNavbar>
    <view v-if="plan?.status === 'completed'" class="detail">
      <view class="header"
        ><text class="header__date">{{ formatZhDate(plan.date || '') }}</text
        ><text v-if="plan.note" class="header__note">{{ plan.note }}</text></view
      >
      <PlanRecordGallery :items="plan.items" />
      <view class="memories">
        <view class="section-head">
          <view class="section-head__copy">
            <text class="section-title"
              >精选照片 {{ featuredPhotos.length }}/{{ MAX_FEATURED_PHOTOS }}</text
            >
            <text class="section-subtitle">留下那天最喜欢的瞬间</text>
          </view>
          <view class="section-head__actions">
            <button
              v-if="featuredPhotos.length"
              class="edit-button"
              :disabled="
                deletingSelectedPhotos ||
                processingPhotos ||
                photosLoading ||
                Boolean(photoLoadError)
              "
              @tap="togglePhotoEditing"
            >
              {{ isEditingPhotos ? '取消' : '编辑' }}
            </button>
            <button
              v-if="!isEditingPhotos"
              class="upload-button"
              :disabled="
                deletingSelectedPhotos ||
                processingPhotos ||
                photosLoading ||
                !photosReady ||
                Boolean(photoLoadError) ||
                featuredPhotos.length >= MAX_FEATURED_PHOTOS
              "
              @tap="chooseFeaturedPhotos"
            >
              {{ uploadButtonText }}
            </button>
          </view>
        </view>
        <view v-if="featuredPhotos.length > 1 && !isEditingPhotos" class="sort-placeholder">
          <text>调整顺序（即将支持）</text>
        </view>
        <view v-if="photosLoading" class="photo-loading">
          <text>正在加载精选照片…</text>
        </view>
        <view v-if="photoLoadError" class="photo-error">
          <text class="photo-error__message">{{ photoLoadError }}</text>
          <button class="photo-error__retry" @tap="loadFeaturedPhotos">重新加载</button>
        </view>
        <view v-if="featuredPhotos.length" class="photos">
          <view
            v-for="(photo, index) in featuredPhotos"
            :key="photo.id"
            class="photo-item"
            :class="{ 'photo-item--selected': selectedPhotoIds.has(photo.id) }"
            @tap="handlePhotoTap(photo, index)"
          >
            <AppImage class="photo" :lazy-load="index >= 6" :src="photo.url" mode="aspectFill" />
            <view
              v-if="isEditingPhotos"
              class="photo-selector"
              :class="{ 'photo-selector--selected': selectedPhotoIds.has(photo.id) }"
            >
              <text v-if="selectedPhotoIds.has(photo.id)">✓</text>
            </view>
          </view>
          <button
            v-if="isEditingPhotos"
            class="bulk-delete-button"
            :disabled="!selectedPhotoCount || deletingSelectedPhotos"
            @tap="deleteSelectedPhotos"
          >
            {{ deleteButtonText }}
          </button>
        </view>
        <view
          v-else-if="photosReady && !photosLoading && !photoLoadError"
          class="photo-empty"
          @tap="chooseFeaturedPhotos"
        >
          <text class="photo-empty__icon">＋</text>
          <text class="photo-empty__title">上传第一张精选图片</text>
          <text class="photo-empty__desc"
            >支持 JPG、PNG、WebP，最多 {{ MAX_FEATURED_PHOTOS }} 张</text
          >
        </view>
      </view>
    </view>
    <view v-else class="missing"><text>没有找到这条过去的计划</text></view>
    <view
      v-if="
        plan?.status === 'completed' && !showCropper && !isEditingPhotos && !deletingSelectedPhotos
      "
      class="footer"
      ><view class="primary" @tap="requestReplan"><text>再计划一次</text></view></view
    >
    <view v-if="showMenu" class="mask" @tap="showMenu = false">
      <view class="menu" @tap.stop>
        <view class="menu__item" @tap="requestDeleteCompletedPlan">
          <text class="danger">{{ deleting ? '正在删除…' : '删除过去计划' }}</text>
        </view>
        <view class="menu__item" @tap="showMenu = false"><text>取消</text></view>
      </view>
    </view>
    <DatePickerSheet
      v-model="showDate"
      :value="date"
      :min-date="getEarliestSelectablePlanDate()"
      title="什么时候再出发？"
      confirm-text="创建本次计划"
      @confirm="replan"
    />
    <wd-img-cropper
      v-model="showCropper"
      :img-src="cropSource"
      aspect-ratio="4:3"
      file-type="jpg"
      :quality="0.9"
      :export-scale="2"
      cancel-button-text="取消"
      confirm-button-text="确认"
      @cancel="cancelPhotoCrop"
      @confirm="confirmPhotoCrop"
    />
  </BasePage>
</template>

<style lang="scss" scoped>
.detail {
  display: flex;
  flex-direction: column;
  gap: 34rpx;
  padding-bottom: 180rpx;
}
.header {
  padding: 32rpx 28rpx;
  border-radius: 28rpx;
  background: #eee8e2;
  border: 2rpx solid #e0d6ce;
}
.header__date {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: #5f554f;
}
.header__note {
  display: block;
  margin-top: 14rpx;
  font-size: 26rpx;
  color: #81746c;
}
.memories {
  padding: 26rpx;
  border-radius: 24rpx;
  background: #f4efe9;
}
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  margin-bottom: 22rpx;
}
.section-head__copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5rpx;
}
.section-head__actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 12rpx;
}
.section-title {
  display: block;
  font-size: 29rpx;
  font-weight: 700;
  color: #655b55;
}
.section-subtitle {
  font-size: 22rpx;
  color: #a09289;
}
.upload-button,
.edit-button {
  flex-shrink: 0;
  height: 58rpx;
  margin: 0;
  padding: 0 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid #e5b49a;
  border-radius: 999rpx;
  background: #fffaf5;
  font-size: 22rpx;
  font-weight: 600;
  line-height: 1;
  color: #bd6b48;
}
.upload-button::after,
.edit-button::after,
.bulk-delete-button::after {
  border: 0;
}
.edit-button {
  padding: 0 18rpx;
  border-color: #d8c4b7;
  background: rgba(255, 253, 250, 0.78);
  color: #806f65;
}
.upload-button[disabled],
.edit-button[disabled] {
  border-color: #ddd1c8;
  background: #eee8e2;
  color: #aa9d94;
  opacity: 1;
}
.sort-placeholder {
  height: 52rpx;
  margin: -6rpx 0 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx dashed #d8cbc2;
  border-radius: 14rpx;
  background: rgba(255, 253, 250, 0.46);
  font-size: 21rpx;
  color: #aca097;
}
.photos {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}
.photo-item {
  position: relative;
  width: 100%;
  border-radius: 20rpx;
  transition:
    transform 0.16s ease,
    box-shadow 0.16s ease;
}
.photo-item--selected {
  box-shadow: 0 0 0 4rpx rgba(214, 111, 88, 0.72);
  transform: scale(0.992);
}
.photo {
  display: block;
  width: 100%;
  height: 476rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.88);
  border-radius: 20rpx;
  box-sizing: border-box;
  background: #e8dfd7;
}
.photo-selector {
  position: absolute;
  top: 18rpx;
  right: 18rpx;
  z-index: 2;
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  border: 3rpx solid rgba(255, 248, 244, 0.96);
  border-radius: 50%;
  background: rgba(91, 78, 70, 0.3);
  box-shadow: 0 2rpx 8rpx rgba(62, 39, 28, 0.2);
  font-size: 28rpx;
  font-weight: 700;
  line-height: 1;
  color: #fff;
}
.photo-selector--selected {
  border-color: #fff8f4;
  background: #d66f58;
}
.bulk-delete-button {
  width: 100%;
  height: 82rpx;
  margin: 6rpx 0 0;
  border: 2rpx solid rgba(184, 79, 58, 0.34);
  border-radius: 18rpx;
  background: #b84f3a;
  font-size: 27rpx;
  font-weight: 600;
  line-height: 78rpx;
  color: #fff;
}
.bulk-delete-button[disabled] {
  border-color: #ddd1c8;
  background: #e7dfd9;
  color: #aa9d94;
  opacity: 1;
}
.photo-empty,
.photo-loading,
.photo-error {
  min-height: 320rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  border: 2rpx dashed #ddc9bb;
  border-radius: 20rpx;
  background: rgba(255, 253, 250, 0.68);
}
.photo-empty__icon {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10rpx;
  border-radius: 50%;
  background: #f3dfd2;
  font-size: 38rpx;
  font-weight: 300;
  line-height: 1;
  color: #ba7656;
}
.photo-empty__title {
  font-size: 25rpx;
  font-weight: 600;
  color: #75665d;
}
.photo-empty__desc {
  margin-top: 7rpx;
  font-size: 21rpx;
  color: #aa9a90;
}
.photo-loading {
  font-size: 23rpx;
  color: #a09289;
}
.photo-error__message {
  max-width: 90%;
  font-size: 23rpx;
  color: #9b6c5c;
  line-height: 1.5;
  text-align: center;
}
.photo-error__retry {
  height: 58rpx;
  margin: 22rpx 0 0;
  padding: 0 28rpx;
  border: 2rpx solid #dcb49f;
  border-radius: 999rpx;
  background: #fffaf5;
  font-size: 22rpx;
  line-height: 54rpx;
  color: #b76d4f;
}
.photo-error__retry::after {
  border: 0;
}
.missing {
  min-height: 45vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
}
.footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 40;
  padding: 20rpx 28rpx calc(20rpx + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, rgba(255, 250, 246, 0), #fffaf6 28%);
}
.primary {
  height: 92rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999rpx;
  background: linear-gradient(90deg, #ff8a55, #ff8f9d);
  font-size: 29rpx;
  font-weight: 600;
  color: #fff;
}
.more {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}
.more--disabled {
  opacity: 0.4;
}
.mask {
  position: fixed;
  inset: 0;
  z-index: 900;
  display: flex;
  align-items: flex-end;
  background: rgba(40, 24, 16, 0.35);
}
.menu {
  width: 100%;
  padding: 16rpx 0 calc(16rpx + env(safe-area-inset-bottom));
  border-radius: 28rpx 28rpx 0 0;
  background: #fffaf6;
}
.menu__item {
  height: 94rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1rpx solid #eee2da;
  font-size: 29rpx;
}
.danger {
  color: #e05a45;
}
</style>
