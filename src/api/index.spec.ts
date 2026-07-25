import { afterEach, describe, expect, it, vi } from 'vitest'
import { request } from '@/api/index'
import { deletePlanPhoto, getPlanPhotos } from '@/api/plans'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('API request', () => {
  it('treats a 204 response without a body as success', async () => {
    const showToast = vi.fn()
    const requestMock = vi.fn(
      (options: { success: (response: { statusCode: number; data: string }) => void }) => {
        options.success({ statusCode: 204, data: '' })
      },
    )
    vi.stubGlobal('uni', { request: requestMock, showToast })

    await expect(
      request<void>({
        url: '/api/crush-date/plans/completed-1',
        method: 'DELETE',
      }),
    ).resolves.toBe('')
    expect(showToast).not.toHaveBeenCalled()
  })

  it('keeps the photo list in the order returned by the server', async () => {
    const list = [
      { id: 'photo-3', url: '/3.jpg', sortOrder: 0, createdAt: '2026-07-24T08:32:00Z' },
      { id: 'photo-1', url: '/1.jpg', sortOrder: 1, createdAt: '2026-07-24T08:30:00Z' },
    ]
    const requestMock = vi.fn(
      (options: {
        success: (response: { statusCode: number; data: { list: typeof list } }) => void
      }) => {
        options.success({ statusCode: 200, data: { list } })
      },
    )
    vi.stubGlobal('uni', { request: requestMock, showToast: vi.fn() })

    await expect(getPlanPhotos('completed-1')).resolves.toEqual(list)
    expect(requestMock).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/api/crush-date/plans/completed-1/photos',
        method: 'GET',
        data: undefined,
      }),
    )
  })

  it('deletes one plan photo through its plan-scoped endpoint', async () => {
    const requestMock = vi.fn(
      (options: { success: (response: { statusCode: number; data: string }) => void }) => {
        options.success({ statusCode: 204, data: '' })
      },
    )
    vi.stubGlobal('uni', { request: requestMock, showToast: vi.fn() })

    await expect(deletePlanPhoto('plan-123', 'photo-456')).resolves.toBe('')
    expect(requestMock).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/api/crush-date/plans/plan-123/photos/photo-456',
        method: 'DELETE',
        data: undefined,
      }),
    )
  })
})
