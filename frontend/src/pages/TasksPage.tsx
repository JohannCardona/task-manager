import { useState, useEffect, useMemo } from 'react'
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
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
  })
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editing, setEditing] = useState<Task | undefined>()
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')
  const [sort, setSort] = useState<SortKey>('created')
  const [loading, setLoading] = useState(true)
  const { addToast } = useToast()

  useEffect(() => {
    Promise.all([tasksApi.getTasks(), categoriesApi.getCategories()]).then(
      ([fetchedTasks, fetchedCategories]) => {
        setTasks(fetchedTasks)
        setCategories(fetchedCategories)
        setLoading(false)
      }
    )
  }, [])

  async function handleSaveTask(data: TaskPayload) {
    if (editing) {
      const updated = await tasksApi.updateTask(editing.id, data)
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
      addToast('Task updated')
    } else {
      const created = await tasksApi.createTask(data)
      setTasks((prev) => [created, ...prev])
      addToast('Task created')
    }
    setShowTaskModal(false)
    setEditing(undefined)
  }

  async function handleSaveCategory(name: string, color: string) {
    const created = await categoriesApi.createCategory(name, color)
    setCategories((prev) => [...prev, created])
    setShowCategoryModal(false)
    addToast('Category created')
  }

  async function handleToggle(task: Task) {
    const updated = await tasksApi.updateTask(task.id, { is_completed: !task.is_completed })
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
    addToast(updated.is_completed ? 'Task completed' : 'Task reopened')
  }

  async function handleDelete(id: number) {
    await tasksApi.deleteTask(id)
    setTasks((prev) => prev.filter((t) => t.id !== id))
    addToast('Task deleted', 'error')
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
    const filtered = tasks.filter((t) => {
      if (filter === 'active') return !t.is_completed
      if (filter === 'completed') return t.is_completed
      return true
    })
    return sortTasks(filtered, sort)
  }, [tasks, filter, sort])

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
              <option value="created">Date created</option>
              <option value="deadline">Deadline</option>
              <option value="priority">Priority</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className={styles.spinner} aria-label="Loading tasks" />
        ) : displayed.length === 0 ? (
          <p className={styles.empty}>No tasks here. Create one!</p>
        ) : (
          <div className={styles.list}>
            {displayed.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                categories={categories}
                onToggle={handleToggle}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            ))}
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

      {showCategoryModal && (
        <CategoryModal
          onSave={handleSaveCategory}
          onClose={() => setShowCategoryModal(false)}
        />
      )}
    </div>
  )
}
