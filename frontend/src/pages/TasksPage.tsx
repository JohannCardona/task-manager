import { useState, useEffect, useMemo } from 'react'
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import type { Task, Category } from '../types'
import * as tasksApi from '../api/tasks'
import * as categoriesApi from '../api/categories'
import Navbar from '../components/Navbar'
import TaskCard from '../components/TaskCard'
import TaskModal from '../components/TaskModal'
import CategoryModal from '../components/CategoryModal'
import type { TaskPayload } from '../api/tasks'
import { useToast } from '../context/ToastContext'
import styles from '../styles/TasksPage.module.css'

type SortKey = 'created' | 'deadline' | 'priority' | 'status'

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 }

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

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editing, setEditing] = useState<Task | undefined>()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')
  const [sort, setSort] = useState<SortKey>('created')
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)
  const { addToast } = useToast()

  const isDraggable = sort === 'created' && filter === 'all' && !search.trim()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  async function fetchTasks() {
    try {
      const fetched = await tasksApi.getTasks()
      setTasks(fetched)
    } catch {
      setFetchError(true)
    }
  }

  useEffect(() => {
    Promise.all([tasksApi.getTasks(), categoriesApi.getCategories()])
      .then(([fetchedTasks, fetchedCategories]) => {
        setTasks(fetchedTasks)
        setCategories(fetchedCategories)
      })
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false))
  }, [])

  function handleSelect(id: number, selected: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (selected) next.add(id)
      else next.delete(id)
      return next
    })
  }

  function handleSelectAll() {
    if (selectedIds.size === displayed.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(displayed.map((t) => t.id)))
    }
  }

  function clearSelection() {
    setSelectedIds(new Set())
    setConfirmBulkDelete(false)
  }

  async function handleBulkComplete(completed: boolean) {
    const ids = [...selectedIds]
    try {
      const updated = await Promise.all(ids.map((id) => tasksApi.updateTask(id, { is_completed: completed })))
      setTasks((prev) => prev.map((t) => updated.find((u) => u.id === t.id) ?? t))
      addToast(`${ids.length} task${ids.length > 1 ? 's' : ''} ${completed ? 'completed' : 'reopened'}`)
      clearSelection()
    } catch {
      addToast('Failed to update tasks', 'error')
    }
  }

  async function handleBulkCategory(categoryId: number | null) {
    const ids = [...selectedIds]
    try {
      const updated = await Promise.all(ids.map((id) => tasksApi.updateTask(id, { category_id: categoryId ?? undefined })))
      setTasks((prev) => prev.map((t) => updated.find((u) => u.id === t.id) ?? t))
      addToast(`Category updated for ${ids.length} task${ids.length > 1 ? 's' : ''}`)
      clearSelection()
    } catch {
      addToast('Failed to update category', 'error')
    }
  }

  async function handleBulkDelete() {
    const ids = [...selectedIds]
    try {
      await Promise.all(ids.map((id) => tasksApi.deleteTask(id)))
      setTasks((prev) => prev.filter((t) => !selectedIds.has(t.id)))
      addToast(`${ids.length} task${ids.length > 1 ? 's' : ''} deleted`)
      clearSelection()
    } catch {
      addToast('Failed to delete tasks', 'error')
    }
  }

  async function handleSaveTask(data: TaskPayload) {
    try {
      if (editing) {
        const updated = await tasksApi.updateTask(editing.id, data)
        setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
        addToast('Task updated')
      } else {
        const created = await tasksApi.createTask(data)
        setTasks((prev) => [...prev, created])
        addToast('Task created')
      }
      setShowTaskModal(false)
      setEditing(undefined)
    } catch {
      addToast('Failed to save task', 'error')
    }
  }

  async function handleSaveCategory(name: string, color: string) {
    try {
      const created = await categoriesApi.createCategory(name, color)
      setCategories((prev) => [...prev, created])
      setShowCategoryModal(false)
      addToast('Category created')
    } catch {
      addToast('Failed to create category', 'error')
    }
  }

  async function handleToggle(task: Task) {
    try {
      const completing = !task.is_completed
      const updated = await tasksApi.updateTask(task.id, { is_completed: completing })
      if (completing && task.recurrence !== 'none') {
        await fetchTasks()
      } else {
        setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
      }
      addToast(updated.is_completed ? 'Task completed' : 'Task reopened')
    } catch {
      addToast('Failed to update task', 'error')
    }
  }

  async function handleDelete(id: number) {
    try {
      await tasksApi.deleteTask(id)
      setTasks((prev) => prev.filter((t) => t.id !== id))
      addToast('Task deleted', 'error')
    } catch {
      addToast('Failed to delete task', 'error')
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = displayed.findIndex((t) => t.id === active.id)
    const newIndex = displayed.findIndex((t) => t.id === over.id)
    const reordered = arrayMove(displayed, oldIndex, newIndex).map((t, i) => ({ ...t, position: i }))

    setTasks(reordered)

    try {
      await tasksApi.reorderTasks(reordered.map((t) => t.id))
    } catch {
      addToast('Failed to save order', 'error')
    }
  }

  function openEdit(task: Task) {
    setEditing(task)
    setShowTaskModal(true)
  }

  function closeTaskModal() {
    setShowTaskModal(false)
    setEditing(undefined)
  }

  const displayed = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = tasks.filter((t) => {
      if (filter === 'active' && t.is_completed) return false
      if (filter === 'completed' && !t.is_completed) return false
      if (q && !t.title.toLowerCase().includes(q) && !(t.description ?? '').toLowerCase().includes(q)) return false
      return true
    })
    return sortTasks(filtered, sort)
  }, [tasks, filter, sort, search])

  const allSelected = displayed.length > 0 && selectedIds.size === displayed.length

  const list = (
    <div className={styles.list}>
      {displayed.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          categories={categories}
          sortable={isDraggable}
          isSelected={selectedIds.has(task.id)}
          onSelect={handleSelect}
          onToggle={handleToggle}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      ))}
    </div>
  )

  return (
    <div className={styles.page}>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>My Tasks</h1>
          <div className={styles.headerActions}>
            <button type="button" className={styles.secondaryBtn} onClick={() => setShowCategoryModal(true)}>+ New category</button>
            <button type="button" className={styles.newBtn} onClick={() => setShowTaskModal(true)}>+ New task</button>
          </div>
        </div>

        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.toolbar}>
          <div className={styles.filters}>
            {(['all', 'active', 'completed'] as const).map((f) => (
              <button
                type="button"
                key={f}
                className={`${styles.filterBtn} ${filter === f ? styles.active : ''}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          <div className={styles.sortWrapper}>
            <label htmlFor="sort-select" className={styles.sortLabel}>Sort by</label>
            <select
              id="sort-select"
              className={styles.sortSelect}
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
            >
              <option value="created">Custom order</option>
              <option value="deadline">Deadline</option>
              <option value="priority">Priority</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>

        {selectedIds.size > 0 && (
          <div className={styles.bulkBar}>
            <span className={styles.bulkCount}>{selectedIds.size} selected</span>
            <button type="button" className={styles.bulkBtn} onClick={handleSelectAll}>
              {allSelected ? 'Deselect all' : 'Select all'}
            </button>
            <button type="button" className={styles.bulkBtn} onClick={() => handleBulkComplete(true)}>Mark complete</button>
            <button type="button" className={styles.bulkBtn} onClick={() => handleBulkComplete(false)}>Mark active</button>
            <select
              className={styles.bulkSelect}
              title="Move to category"
              value=""
              onChange={(e) => handleBulkCategory(e.target.value === '' ? null : Number(e.target.value))}
            >
              <option value="" disabled>Move to category…</option>
              <option value="">None</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {confirmBulkDelete ? (
              <>
                <span className={styles.bulkConfirm}>Delete {selectedIds.size}?</span>
                <button type="button" className={`${styles.bulkBtn} ${styles.bulkDanger}`} onClick={handleBulkDelete}>Yes</button>
                <button type="button" className={styles.bulkBtn} onClick={() => setConfirmBulkDelete(false)}>No</button>
              </>
            ) : (
              <button type="button" className={`${styles.bulkBtn} ${styles.bulkDanger}`} onClick={() => setConfirmBulkDelete(true)}>Delete</button>
            )}
            <button type="button" className={styles.bulkClear} onClick={clearSelection} aria-label="Clear selection">✕</button>
          </div>
        )}

        {loading ? (
          <div className={styles.spinner} aria-label="Loading tasks" />
        ) : fetchError ? (
          <p className={styles.error}>Failed to load tasks. Please refresh the page.</p>
        ) : displayed.length === 0 ? (
          <p className={styles.empty}>{search.trim() ? 'No tasks match your search.' : 'No tasks here. Create one!'}</p>
        ) : isDraggable ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={displayed.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              {list}
            </SortableContext>
          </DndContext>
        ) : list}
      </main>

      {showTaskModal && (
        <TaskModal
          task={editing}
          categories={categories}
          onSave={handleSaveTask}
          onClose={closeTaskModal}
        />
      )}

      {showCategoryModal && (
        <CategoryModal
          onSave={handleSaveCategory}
          onClose={() => setShowCategoryModal(false)}
        />
      )}
    </div>
  )
}
