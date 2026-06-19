import { useState, useEffect, useMemo } from 'react'
import type { Task } from '../types'

export type SortKey = 'created' | 'deadline' | 'priority' | 'status'

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 }

const PAGE_SIZE = 10

function sortTasks(tasks: Task[], sort: SortKey): Task[] {
  return [...tasks].sort((a, b) => {
    switch (sort) {
      case 'deadline': {
        if (!a.deadline && !b.deadline) return 0
        if (!a.deadline) return 1
        if (!b.deadline) return -1
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      }
      case 'priority':
        return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
      case 'status':
        return Number(a.is_completed) - Number(b.is_completed)
      default: {
        if (a.position !== null && b.position !== null) return a.position - b.position
        if (a.position !== null) return -1
        if (b.position !== null) return 1
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    }
  })
}

export function useTaskFilters(tasks: Task[]) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')
  const [filterPriority, setFilterPriority] = useState<'all' | 'low' | 'medium' | 'high'>('all')
  const [filterCategory, setFilterCategory] = useState<number | 'all' | 'none'>('all')
  const [filterTag, setFilterTag] = useState<string | null>(null)
  const [sort, setSort] = useState<SortKey>('created')
  const [page, setPage] = useState(1)

  const displayed = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = tasks.filter((t) => {
      if (filter === 'active' && t.is_completed) return false
      if (filter === 'completed' && !t.is_completed) return false
      if (q && !t.title.toLowerCase().includes(q) && !(t.description ?? '').toLowerCase().includes(q)) return false
      if (filterPriority !== 'all' && t.priority !== filterPriority) return false
      if (filterCategory === 'none' && t.category_id !== null) return false
      if (typeof filterCategory === 'number' && t.category_id !== filterCategory) return false
      if (filterTag && !t.tags.some((tag) => tag.name === filterTag)) return false
      return true
    })
    return sortTasks(filtered, sort)
  }, [tasks, filter, sort, search, filterPriority, filterCategory, filterTag])

  const existingTags = useMemo(
    () => [...new Set(tasks.flatMap((t) => t.tags.map((tag) => tag.name)))].sort(),
    [tasks],
  )

  const totalPages = Math.max(1, Math.ceil(displayed.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = displayed.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  useEffect(() => { setPage(1) }, [search, filter, sort, filterPriority, filterCategory, filterTag])

  return {
    search, setSearch,
    filter, setFilter,
    filterPriority, setFilterPriority,
    filterCategory, setFilterCategory,
    filterTag, setFilterTag,
    sort, setSort,
    page, setPage,
    displayed, existingTags,
    totalPages, safePage, paginated,
  }
}
