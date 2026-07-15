import carousel01 from '@/assets/carousel-01-flower.jpg'
import carousel02 from '@/assets/carousel-02-sunset.jpg'
import carousel03 from '@/assets/carousel-03-woods.jpg'
import carousel04 from '@/assets/carousel-04-cloud-city.jpg'
import carousel05 from '@/assets/carousel-05-skyline.jpg'
import type { MemorySlide } from '@/types/memory'

/** 展示顺序：2 → 3 → 1 → 4 → 5 */
export const MEMORIES: MemorySlide[] = [
  {
    id: 'memory-sunset',
    image: carousel02,
    title: '那天的晚霞',
    subtitle: '北京 · 2026.07',
    objectPosition: 'center 40%',
  },
  {
    id: 'memory-woods',
    image: carousel03,
    title: '林间散步',
    subtitle: '北京 · 2026.07',
    objectPosition: 'center center',
  },
  {
    id: 'memory-flower',
    image: carousel01,
    title: '那日的花开',
    subtitle: '北京 · 2026.07',
    objectPosition: 'center 35%',
  },
  {
    id: 'memory-cloud-city',
    image: carousel04,
    title: '云上的城',
    subtitle: '北京 · 2026.07',
    objectPosition: 'center 45%',
  },
  {
    id: 'memory-skyline',
    image: carousel05,
    title: '那天的天空',
    subtitle: '北京 · 2026.07',
    objectPosition: 'center 28%',
  },
]
