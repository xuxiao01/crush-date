export interface PhotoDeletionFailure {
  photoId: string
  message: string
}

export interface PhotoDeletionResult {
  deletedPhotoIds: string[]
  failures: PhotoDeletionFailure[]
}

export async function deletePhotosSequentially(
  photoIds: string[],
  deletePhoto: (photoId: string) => Promise<void>,
  onProgress?: (current: number, total: number) => void,
): Promise<PhotoDeletionResult> {
  const deletedPhotoIds: string[] = []
  const failures: PhotoDeletionFailure[] = []

  for (const [index, photoId] of photoIds.entries()) {
    onProgress?.(index + 1, photoIds.length)
    try {
      await deletePhoto(photoId)
      deletedPhotoIds.push(photoId)
    } catch (error) {
      failures.push({
        photoId,
        message: error instanceof Error ? error.message : '删除失败，请稍后重试',
      })
    }
  }

  return { deletedPhotoIds, failures }
}
