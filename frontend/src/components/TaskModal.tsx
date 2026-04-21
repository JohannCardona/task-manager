import { useState, useEffect } from 'react'
import type { Task, Category } from '../types'
import type { TaskPayload } from '../api/tasks'
import styles from './TaskModal.module.css'

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
      category_id: categoryId !== '' ? categoryId : undefined,
    })
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.heading}>{task ? 'Edit task' : 'New task'}</h2>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>Title</label>
            <input
              className={styles.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Description</label>
            <textarea
              className={styles.input}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Priority</label>
              <select className={styles.input} value={priority} onChange={(e) => setPriority(e.target.value as TaskPayload['priority'])}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Category</label>
              <select className={styles.input} value={categoryId} onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}>
                <option value="">None</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Deadline</label>
            <input
              className={styles.input}
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
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
