import type {
  FoodCategoryId,
  FoodCategoryOption,
  SelectableFoodCategoryOption,
} from '@/types/content'

export const FOOD_CATEGORY_IDS: readonly FoodCategoryId[] = [
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
] as const

export const DEFAULT_FOOD_CATEGORIES: readonly SelectableFoodCategoryOption[] = [
  { id: '2', name: '中餐', sortOrder: 1, filterOnly: false },
  { id: '3', name: '火锅', sortOrder: 2, filterOnly: false },
  { id: '4', name: '烧烤烤肉', sortOrder: 3, filterOnly: false },
  { id: '5', name: '日韩及亚洲料理', sortOrder: 4, filterOnly: false },
  { id: '6', name: '西餐', sortOrder: 5, filterOnly: false },
  { id: '7', name: '小吃快餐', sortOrder: 6, filterOnly: false },
  { id: '8', name: '甜品饮品', sortOrder: 7, filterOnly: false },
  { id: '9', name: '其他', sortOrder: 8, filterOnly: false },
] as const

export const DEFAULT_FOOD_CATEGORY_CONFIG: readonly FoodCategoryOption[] = [
  { id: '1', name: '全部分类', sortOrder: 0, filterOnly: true },
  ...DEFAULT_FOOD_CATEGORIES,
]

export function isFoodCategoryId(value: string): value is FoodCategoryId {
  return FOOD_CATEGORY_IDS.includes(value as FoodCategoryId)
}
