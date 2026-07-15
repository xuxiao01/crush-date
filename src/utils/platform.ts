import type { PlatformType } from '@/types/common'

function getCompileTimePlatform(): PlatformType {
  let platform: PlatformType = 'unknown'

  // #ifdef H5
  platform = 'h5'
  // #endif

  // #ifdef MP-WEIXIN
  platform = 'mp-weixin'
  // #endif

  // #ifdef APP-PLUS
  platform = 'app'
  // #endif

  return platform
}

function getRuntimePlatform(): PlatformType {
  try {
    const info = uni.getSystemInfoSync()
    const uniPlatform = info.uniPlatform

    if (uniPlatform === 'web') return 'h5'
    if (uniPlatform === 'mp-weixin') return 'mp-weixin'
    if (uniPlatform === 'app') return 'app'
  } catch (error) {
    console.warn('[platform] getSystemInfoSync failed', error)
  }

  return 'unknown'
}

export function getPlatform(): PlatformType {
  const compileTimePlatform = getCompileTimePlatform()
  if (compileTimePlatform !== 'unknown') {
    return compileTimePlatform
  }

  return getRuntimePlatform()
}

export function getPlatformLabel(platform: PlatformType = getPlatform()): string {
  const labels: Record<PlatformType, string> = {
    h5: 'H5 浏览器',
    'mp-weixin': '微信小程序',
    app: 'App',
    unknown: '未知平台',
  }

  return labels[platform]
}
