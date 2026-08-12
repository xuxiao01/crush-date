import { describe, expect, it, vi } from 'vitest'
import { deletePhotosSequentially } from '@/utils/planPhotos'

describe('deletePhotosSequentially', () => {
  it('deletes photos in order and reports progress', async () => {
    const calls: string[] = []
    const progress = vi.fn()

    const result = await deletePhotosSequentially(
      ['photo-3', 'photo-1', 'photo-2'],
      async (photoId) => {
        calls.push(photoId)
      },
      progress,
    )

    expect(calls).toEqual(['photo-3', 'photo-1', 'photo-2'])
    expect(progress.mock.calls).toEqual([
      [1, 3],
      [2, 3],
      [3, 3],
    ])
    expect(result).toEqual({
      deletedPhotoIds: ['photo-3', 'photo-1', 'photo-2'],
      failures: [],
    })
  })

  it('continues deleting remaining photos after one failure', async () => {
    const calls: string[] = []

    const result = await deletePhotosSequentially(['photo-1', 'photo-2', 'photo-3'], async (id) => {
      calls.push(id)
      if (id === 'photo-2') throw new Error('照片不存在')
    })

    expect(calls).toEqual(['photo-1', 'photo-2', 'photo-3'])
    expect(result).toEqual({
      deletedPhotoIds: ['photo-1', 'photo-3'],
      failures: [{ photoId: 'photo-2', message: '照片不存在' }],
    })
  })
})
