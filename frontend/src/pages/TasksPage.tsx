import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import type { Task, Category } from '../types'
import * as tasksApi from '../api/tasks'
import * as categoriesApi from '../api/categories'
import Navbar from '../components/Navbar'
import TaskCard from '../components/TaskCard'
import TaskModal from '../components/TaskModal'
import CategoryModal from '../components/CategoryModal'
import CategoryManagerModal from '../components/CategoryManagerModal'
import type { TaskPayload } from '../api/tasks'
import { useToast } from '../context/ToastContext'
import { exportCSV, exportPDF } from '../utils/export'
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
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const [editing, setEditing] = useState<Task | undefined>()
  const [editingCategory, setEditingCategory] = useState<Category | undefined>()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')
  const [filterPriority, setFilterPriority] = useState<'all' | 'low' | 'medium' | 'high'>('all')
  const [filterCategory, setFilterCategory] = useState<number | 'all' | 'none'>('all')
  const [sort, setSort] = useState<SortKey>('created')
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)
  const [page, setPage] = useState(1)
  const { addToast } = useToast()
  const navigate = useNavigate()

  const PAGE_SIZE = 10

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
    const prev = tasks
    setTasks((ts) => ts.map((t) => ids.includes(t.id) ? { ...t, is_completed: completed } : t))
    addToast(`${ids.length} task${ids.length > 1 ? 's' : ''} ${completed ? 'completed' : 'reopened'}`)
    clearSelection()
    try {
      await Promise.all(ids.map((id) => tasksApi.updateTask(id, { is_completed: completed })))
    } catch {
      setTasks(prev)
      addToast('Failed to update tasks', 'error')
    }
  }

  async function handleBulkCategory(categoryId: number | null) {
    const ids = [...selectedIds]
    const prev = tasks
    setTasks((ts) => ts.map((t) => ids.includes(t.id) ? { ...t, category_id: categoryId } : t))
    addToast(`Category updated for ${ids.length} task${ids.length > 1 ? 's' : ''}`)
    clearSelection()
    try {
      await Promise.all(ids.map((id) => tasksApi.updateTask(id, { category_id: categoryId ?? undefined })))
    } catch {
      setTasks(prev)
      addToast('Failed to update category', 'error')
    }
  }

  async function handleBulkDelete() {
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

  async function handleSaveTask(data: TaskPayload) {
    if (editing) {
      const prev = tasks
      const optimistic = { ...editing, ...data, category_id: data.category_id ?? null }
      setTasks((ts) => ts.map((t) => (t.id === editing.id ? optimistic : t)))
      setShowTaskModal(false)
      setEditing(undefined)
      try {
        const updated = await tasksApi.updateTask(editing.id, data)
        setTasks((ts) => ts.map((t) => (t.id === updated.id ? updated : t)))
        addToast('Task updated')
      } catch {
        setTasks(prev)
        setShowTaskModal(true)
        setEditing(editing)
        addToast('Failed to save task', 'error')
      }
      return
    }
    try {
      const created = await tasksApi.createTask(data)
      setTasks((prev) => [...prev, created])
      addToast('Task created')
      setShowTaskModal(false)
      setEditing(undefined)
    } catch {
      addToast('Failed to save task', 'error')
    }
  }

  function openCategoryModalFromManager(cat?: Category) {
    setShowCategoryManager(false)
    setEditingCategory(cat)
    setShowCategoryModal(true)
  }

  function closeCategoryModal() {
    setShowCategoryModal(false)
    setEditingCategory(undefined)
    setShowCategoryManager(true)
  }

  async function handleSaveCategory(name: string, color: string) {
    if (editingCategory) {
      try {
        const updated = await categoriesApi.updateCategory(editingCategory.id, name, color)
        setCategories((prev) => prev.map((c) => c.id === updated.id ? updated : c))
        closeCategoryModal()
        addToast('Category updated')
      } catch {
        addToast('Failed to update category', 'error')
      }
      return
    }
    try {
      const created = await categoriesApi.createCategory(name, color)
      setCategories((prev) => [...prev, created])
      closeCategoryModal()
      addToast('Category created')
    } catch {
      addToast('Failed to create category', 'error')
    }
  }

  async function handleDeleteCategory(id: number) {
    try {
      await categoriesApi.deleteCategory(id)
      setCategories((prev) => prev.filter((c) => c.id !== id))
      setTasks((prev) => prev.map((t) => t.category_id === id ? { ...t, category_id: null } : t))
      addToast('Category deleted')
    } catch {
      addToast('Failed to delete category', 'error')
    }
  }

  async function handleToggle(task: Task) {
    const completing = !task.is_completed
    const prev = tasks
    if (!(completing && task.recurrence !== 'none')) {
      setTasks((ts) => ts.map((t) => (t.id === task.id ? { ...t, is_completed: completing } : t)))
    }
    try {
      const updated = await tasksApi.updateTask(task.id, { is_completed: completing })
      if (completing && task.recurrence !== 'none') {
        await fetchTasks()
      } else {
        setTasks((ts) => ts.map((t) => (t.id === updated.id ? updated : t)))
      }
      addToast(completing ? 'Task completed' : 'Task reopened')
    } catch {
      setTasks(prev)
      addToast('Failed to update task', 'error')
    }
  }

  async function handleDelete(id: number) {
    const prev = tasks
    setTasks((ts) => ts.filter((t) => t.id !== id))
    addToast('Task deleted')
    try {
      await tasksApi.deleteTask(id)
    } catch {
      setTasks(prev)
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
      if (filterPriority !== 'all' && t.priority !== filterPriority) return false
      if (filterCategory === 'none' && t.category_id !== null) return false
      if (typeof filterCategory === 'number' && t.category_id !== filterCategory) return false
      return true
    })
    return sortTasks(filtered, sort)
  }, [tasks, filter, sort, search, filterPriority, filterCategory])

  const totalPages = Math.max(1, Math.ceil(displayed.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = displayed.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  useEffect(() => { setPage(1) }, [search, filter, sort, filterPriority, filterCategory])

  const allSelected = paginated.length > 0 && paginated.every((t) => selectedIds.has(t.id))

  const list = (
    <div className={styles.list}>
      {paginated.map((task) => (
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
            <div className={styles.viewToggle}>
              <button type="button" className={`${styles.viewBtn} ${styles.viewBtnActive}`}>List</button>
              <button type="button" className={styles.viewBtn} onClick={() => navigate('/calendar')}>Calendar</button>
            </div>
            <button type="button" className={styles.secondaryBtn} onClick={() => setShowCategoryManager(true)}>Categories</button>
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
            <select
              className={styles.sortSelect}
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as typeof filterPriority)}
              aria-label="Filter by priority"
            >
              <option value="all">All priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className={styles.sortWrapper}>
            <select
              className={styles.sortSelect}
              value={filterCategory}
              onChange={(e) => {
                const v = e.target.value
                setFilterCategory(v === 'all' ? 'all' : v === 'none' ? 'none' : Number(v))
              }}
              aria-label="Filter by category"
            >
              <option value="all">All categories</option>
              <option value="none">Uncategorized</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
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

          <div className={styles.exportWrapper}>
            <button type="button" className={styles.exportBtn} onClick={() => exportCSV(displayed, categories)}>
              ↓ CSV
            </button>
            <button type="button" className={styles.exportBtn} onClick={() => exportPDF(displayed, categories)}>
              ↓ PDF
            </button>
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
          <div className={styles.emptyState}>
            {search.trim() ? (
              <>
                <span className={styles.emptyIcon}>🔍</span>
                <p className={styles.emptyTitle}>No results for "{search.trim()}"</p>
                <p className={styles.emptySubtitle}>Try a different search term.</p>
              </>
            ) : filter !== 'all' ? (
              <>
                <span className={styles.emptyIcon}>{filter === 'completed' ? '✓' : '○'}</span>
                <p className={styles.emptyTitle}>No {filter} tasks</p>
                <p className={styles.emptySubtitle}>
                  {filter === 'completed' ? 'Complete a task to see it here.' : 'All your tasks are completed!'}
                </p>
              </>
            ) : (
              <>
                <span className={styles.emptyIcon}>📋</span>
                <p className={styles.emptyTitle}>No tasks yet</p>
                <p className={styles.emptySubtitle}>Create your first task to get started.</p>
                <button type="button" className={styles.newBtn} onClick={() => setShowTaskModal(true)}>+ New task</button>
              </>
            )}
          </div>
        ) : isDraggable ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={paginated.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              {list}
            </SortableContext>
          </DndContext>
        ) : list}

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              type="button"
              className={styles.pageBtn}
              onClick={() => setPage((p) => p - 1)}
              disabled={safePage === 1}
            >
              ← Prev
            </button>
            <span className={styles.pageInfo}>Page {safePage} of {totalPages}</span>
            <button
              type="button"
              className={styles.pageBtn}
              onClick={() => setPage((p) => p + 1)}
              disabled={safePage === totalPages}
            >
              Next →
            </button>
          </div>
        )}
      </main>

      {showTaskModal && (
        <TaskModal
          task={editing}
          categories={categories}
          onSave={handleSaveTask}
          onClose={closeTaskModal}
        />
      )}

      {showCategoryManager && (
        <CategoryManagerModal
          categories={categories}
          onEdit={openCategoryModalFromManager}
          onDelete={handleDeleteCategory}
          onNew={() => openCategoryModalFromManager(undefined)}
          onClose={() => setShowCategoryManager(false)}
        />
      )}

      {showCategoryModal && (
        <CategoryModal
          category={editingCategory}
          onSave={handleSaveCategory}
          onClose={closeCategoryModal}
        />
      )}
    </div>
  )
}
