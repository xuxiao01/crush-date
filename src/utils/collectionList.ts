export type CollectionItemStatus = 'unvisited' | 'visited'

export interface SearchableCollectionItem {
  name: string
  type: string
  status: CollectionItemStatus
}

export interface CollectionListFilter {
  status: CollectionItemStatus
  keyword: string
  category?: string
}

function normalizeSearchText(value: string): string {
  return value.trim().toLocaleLowerCase()
}

export function filterCollectionItems<T extends SearchableCollectionItem>(
  items: readonly T[],
  filter: CollectionListFilter,
): T[] {
  const keyword = normalizeSearchText(filter.keyword)
  const category = normalizeSearchText(filter.category ?? '')

  return items.filter((item) => {
    if (item.status !== filter.status) return false
    if (category && normalizeSearchText(item.type) !== category) return false
    if (!keyword) return true

    return [item.name, item.type].some((value) => normalizeSearchText(value).includes(keyword))
  })
}
