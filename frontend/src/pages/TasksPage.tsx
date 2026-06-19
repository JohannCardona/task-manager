import { useState, useEffect } from 'react'
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
import { useNotifications } from '../context/NotificationContext'
import { exportCSV, exportPDF } from '../utils/export'
import ConfirmInline from '../components/ConfirmInline'
import { useTaskFilters } from '../hooks/useTaskFilters'
import { useBulkSelect } from '../hooks/useBulkSelect'
import styles from '../styles/TasksPage.module.css'

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const [editing, setEditing] = useState<Task | undefined>()
  const [editingCategory, setEditingCategory] = useState<Category | undefined>()
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const { addToast } = useToast()
  const { setDeadlineCount } = useNotifications()
  const navigate = useNavigate()

  const {
    search, setSearch,
    filter, setFilter,
    filterPriority, setFilterPriority,
    filterCategory, setFilterCategory,
    filterTag, setFilterTag,
    sort, setSort,
    page, setPage,
    displayed, existingTags,
    totalPages, safePage, paginated,
  } = useTaskFilters(tasks)

  const {
    selectedIds,
    confirmBulkDelete, setConfirmBulkDelete,
    handleSelect, handleSelectAll, clearSelection,
    handleBulkComplete, handleBulkCategory, handleBulkDelete,
    allSelected,
  } = useBulkSelect({ tasks, displayed, paginated, setTasks })

  const isDraggable = sort === 'created' && filter === 'all' && !search.trim()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  async function fetchTasks(): Promise<void> {
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

  useEffect(() => {
    if (loading) return
    const now = new Date()
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
    const urgent = tasks.filter((t) => !t.is_completed && !!t.deadline && new Date(t.deadline) <= endOfToday)
    setDeadlineCount(urgent.length)
    if (urgent.length > 0 && !sessionStorage.getItem('deadline_notified')) {
      const overdue = urgent.filter((t) => new Date(t.deadline!) < now).length
      const dueToday = urgent.length - overdue
      const parts: string[] = []
      if (overdue > 0) parts.push(`${overdue} overdue`)
      if (dueToday > 0) parts.push(`${dueToday} due today`)
      addToast(`${parts.join(', ')} task${urgent.length > 1 ? 's' : ''}`, 'error')
      sessionStorage.setItem('deadline_notified', '1')
    }
  }, [tasks, loading, setDeadlineCount, addToast])

  async function handleSaveTask(data: TaskPayload): Promise<void> {
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

  async function handleToggle(task: Task): Promise<void> {
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

  async function handleDelete(id: number): Promise<void> {
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

  async function handleDragEnd(event: DragEndEvent): Promise<void> {
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

  function openEdit(task: Task): void {
    setEditing(task)
    setShowTaskModal(true)
  }

  function closeTaskModal(): void {
    setShowTaskModal(false)
    setEditing(undefined)
  }

  function openCategoryModalFromManager(cat?: Category): void {
    setShowCategoryManager(false)
    setEditingCategory(cat)
    setShowCategoryModal(true)
  }

  function closeCategoryModal(): void {
    setShowCategoryModal(false)
    setEditingCategory(undefined)
    setShowCategoryManager(true)
  }

  async function handleSaveCategory(name: string, color: string): Promise<void> {
    if (editingCategory) {
      try {
        const updated = await categoriesApi.updateCategory(editingCategory.id, name, color)
        setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
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

  async function handleDeleteCategory(id: number): Promise<void> {
    try {
      await categoriesApi.deleteCategory(id)
      setCategories((prev) => prev.filter((c) => c.id !== id))
      setTasks((prev) => prev.map((t) => (t.category_id === id ? { ...t, category_id: null } : t)))
      addToast('Category deleted')
    } catch {
      addToast('Failed to delete category', 'error')
    }
  }

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
          onTagClick={(tag) => setFilterTag((prev) => (prev === tag ? null : tag))}
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

          {filterTag && (
            <div className={styles.sortWrapper}>
              <button
                type="button"
                className={`${styles.filterBtn} ${styles.active}`}
                onClick={() => setFilterTag(null)}
                title="Clear tag filter"
              >
                #{filterTag} ×
              </button>
            </div>
          )}

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
              onChange={(e) => setSort(e.target.value as typeof sort)}
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
              <ConfirmInline
                message={`Delete ${selectedIds.size}?`}
                onConfirm={handleBulkDelete}
                onCancel={() => setConfirmBulkDelete(false)}
              />
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
          existingTags={existingTags}
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
