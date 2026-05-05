import { useState, useEffect } from 'react'
import type { Task, Category } from '../types'
import type { TaskPayload } from '../api/tasks'
import styles from '../styles/TaskModal.module.css'

interface Props {
  task?: Task
  categories: Category[]
  onSave: (data: TaskPayload) => void
  onClose: () => void
}

export default function TaskModal({ task, categories, onSave, onClose }: Props) {
  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [deadline, setDeadline] = useState(task?.deadline ? task.deadline.slice(0, 16) : '')
  const [priority, setPriority] = useState<TaskPayload['priority']>(task?.priority ?? 'medium')
  const [recurrence, setRecurrence] = useState<NonNullable<TaskPayload['recurrence']>>(task?.recurrence ?? 'none')
  const [categoryId, setCategoryId] = useState<number | ''>(task?.category_id ?? '')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    onSave({
      title,
      description: description || undefined,
      deadline: deadline || undefined,
      priority,
      recurrence,
      category_id: categoryId !== '' ? categoryId : undefined,
    })
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.heading}>{task ? 'Edit task' : 'New task'}</h2>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="task-title" className={styles.label}>Title</label>
            <input
              id="task-title"
              className={styles.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="task-description" className={styles.label}>Description</label>
            <textarea
              id="task-description"
              className={styles.input}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="task-priority" className={styles.label}>Priority</label>
              <select id="task-priority" className={styles.input} value={priority} onChange={(e) => setPriority(e.target.value as TaskPayload['priority'])}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className={styles.field}>
              <label htmlFor="task-category" className={styles.label}>Category</label>
              <select id="task-category" className={styles.input} value={categoryId} onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}>
                <option value="">None</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="task-deadline" className={styles.label}>Deadline</label>
              <input
                id="task-deadline"
                className={styles.input}
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="task-recurrence" className={styles.label}>Recurrence</label>
              <select
                id="task-recurrence"
                className={styles.input}
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as NonNullable<TaskPayload['recurrence']>)}
              >
                <option value="none">None</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
          <div className={styles.buttons}>
            <button type="button" className={styles.cancel} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.save}>Save</button>
          </div>
        </form>
      </div>
    </div>
  )
}
