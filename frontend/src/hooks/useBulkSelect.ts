import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { Task } from '../types'
import * as tasksApi from '../api/tasks'
import { useToast } from '../context/ToastContext'

interface Options {
  tasks: Task[]
  displayed: Task[]
  paginated: Task[]
  setTasks: Dispatch<SetStateAction<Task[]>>
}

export function useBulkSelect({ tasks, displayed, paginated, setTasks }: Options) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)
  const { addToast } = useToast()

  function handleSelect(id: number, selected: boolean): void {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (selected) next.add(id)
      else next.delete(id)
      return next
    })
  }

  function handleSelectAll(): void {
    if (selectedIds.size === displayed.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(displayed.map((t) => t.id)))
    }
  }

  function clearSelection(): void {
    setSelectedIds(new Set())
    setConfirmBulkDelete(false)
  }

  async function handleBulkComplete(completed: boolean): Promise<void> {
    const ids = [...selectedIds]
    const prev = tasks
    setTasks((ts) => ts.map((t) => (ids.includes(t.id) ? { ...t, is_completed: completed } : t)))
    addToast(`${ids.length} task${ids.length > 1 ? 's' : ''} ${completed ? 'completed' : 'reopened'}`)
    clearSelection()
    try {
      await Promise.all(ids.map((id) => tasksApi.updateTask(id, { is_completed: completed })))
    } catch {
      setTasks(prev)
      addToast('Failed to update tasks', 'error')
    }
  }

  async function handleBulkCategory(categoryId: number | null): Promise<void> {
    const ids = [...selectedIds]
    const prev = tasks
    setTasks((ts) => ts.map((t) => (ids.includes(t.id) ? { ...t, category_id: categoryId } : t)))
    addToast(`Category updated for ${ids.length} task${ids.length > 1 ? 's' : ''}`)
    clearSelection()
    try {
      await Promise.all(ids.map((id) => tasksApi.updateTask(id, { category_id: categoryId ?? undefined })))
    } catch {
      setTasks(prev)
      addToast('Failed to update category', 'error')
    }
  }

  async function handleBulkDelete(): Promise<void> {
    const ids = [...selectedIds]
    const prev = tasks
    setTasks((ts) => ts.filter((t) => !selectedIds.has(t.id)))
    addToast(`${ids.length} task${ids.length > 1 ? 's' : ''} deleted`)
    clearSelection()
    try {
      await Promise.all(ids.map((id) => tasksApi.deleteTask(id)))
    } catch {
      setTasks(prev)
      addToast('Failed to delete tasks', 'error')
    }
  }

  const allSelected = paginated.length > 0 && paginated.every((t) => selectedIds.has(t.id))

  return {
    selectedIds,
    confirmBulkDelete, setConfirmBulkDelete,
    handleSelect, handleSelectAll, clearSelection,
    handleBulkComplete, handleBulkCategory, handleBulkDelete,
    allSelected,
  }
}
