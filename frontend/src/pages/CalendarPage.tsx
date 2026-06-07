import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Task, Category } from '../types'
import * as tasksApi from '../api/tasks'
import * as categoriesApi from '../api/categories'
import type { TaskPayload } from '../api/tasks'
import Navbar from '../components/Navbar'
import TaskModal from '../components/TaskModal'
import { useToast } from '../context/ToastContext'
import styles from '../styles/CalendarPage.module.css'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

function buildGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const days: Date[] = []
  for (let i = first.getDay(); i > 0; i--) {
    days.push(new Date(year, month, 1 - i))
  }
  for (let d = 1; d <= last.getDate(); d++) {
    days.push(new Date(year, month, d))
  }
  while (days.length % 7 !== 0) {
    days.push(new Date(year, month + 1, days.length - last.getDate() - first.getDay() + 1))
  }
  return days
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

export default function CalendarPage() {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const today = new Date()

  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [tasks, setTasks] = useState<Task[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [editing, setEditing] = useState<Task | undefined>()

  useEffect(() => {
    Promise.all([tasksApi.getTasks(), categoriesApi.getCategories()]).then(([t, c]) => {
      setTasks(t)
      setCategories(c)
    })
  }, [])

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  async function handleSaveTask(data: TaskPayload) {
    if (!editing) return
    try {
      const updated = await tasksApi.updateTask(editing.id, data)
      setTasks(prev => prev.map(t => t.id === updated.id ? updated : t))
      setEditing(undefined)
      addToast('Task updated')
    } catch {
      addToast('Failed to save task', 'error')
    }
  }

  const grid = buildGrid(year, month)

  const tasksWithDeadline = tasks.filter(t => t.deadline && !t.is_completed)

  return (
    <div className={styles.page}>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.header}>
          <div className={styles.nav}>
            <button type="button" className={styles.navBtn} onClick={prevMonth}>←</button>
            <h1 className={styles.title}>{MONTHS[month]} {year}</h1>
            <button type="button" className={styles.navBtn} onClick={nextMonth}>→</button>
          </div>
          <div className={styles.viewToggle}>
            <button type="button" className={styles.viewBtn} onClick={() => navigate('/tasks')}>List</button>
            <button type="button" className={`${styles.viewBtn} ${styles.viewBtnActive}`}>Calendar</button>
          </div>
        </div>

        <div className={styles.grid}>
          {DAYS.map(d => (
            <div key={d} className={styles.dayHeader}>{d}</div>
          ))}
          {grid.map((date, i) => {
            const isCurrentMonth = date.getMonth() === month
            const isToday = isSameDay(date, today)
            const dayTasks = tasksWithDeadline.filter(t => isSameDay(new Date(t.deadline!), date))

            return (
              <div
                key={i}
                className={`${styles.cell} ${!isCurrentMonth ? styles.cellOtherMonth : ''} ${isToday ? styles.cellToday : ''}`}
              >
                <span className={styles.dateNum}>{date.getDate()}</span>
                <div className={styles.taskList}>
                  {dayTasks.map(task => {
                    const category = categories.find(c => c.id === task.category_id)
                    return (
                      <button
                        key={task.id}
                        type="button"
                        className={`${styles.taskChip} ${styles[task.priority]}`}
                        style={category ? { borderLeftColor: category.color } : undefined}
                        onClick={() => setEditing(task)}
                        title={task.title}
                      >
                        {task.title}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {editing && (
        <TaskModal
          task={editing}
          categories={categories}
          onSave={handleSaveTask}
          onClose={() => setEditing(undefined)}
        />
      )}
    </div>
  )
}
