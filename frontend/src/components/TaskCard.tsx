import { useState } from 'react'
import type { Task, Category } from '../types'
import styles from '../styles/TaskCard.module.css'

interface Props {
  task: Task
  categories: Category[]
  onToggle: (task: Task) => void
  onEdit: (task: Task) => void
  onDelete: (id: number) => void
}

const PRIORITY_LABEL = { low: 'Low', medium: 'Medium', high: 'High' }

export default function TaskCard({ task, categories, onToggle, onEdit, onDelete }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const category = categories.find((c) => c.id === task.category_id)
  const isOverdue = task.deadline && !task.is_completed && new Date(task.deadline) < new Date()

  return (
    <div className={`${styles.card} ${task.is_completed ? styles.completed : ''}`}>
      <div className={styles.top}>
        <label className={styles.checkLabel}>
          <input
            type="checkbox"
            className={styles.checkbox}
            checked={task.is_completed}
            onChange={() => onToggle(task)}
            aria-label={`Mark "${task.title}" as ${task.is_completed ? 'incomplete' : 'complete'}`}
          />
          <span className={styles.title}>{task.title}</span>
        </label>
        <div className={styles.actions}>
          {confirmDelete ? (
            <>
              <span className={styles.confirmText}>Delete?</span>
              <button
                type="button"
                className={`${styles.btn} ${styles.danger}`}
                aria-label={`Confirm delete ${task.title}`}
                onClick={() => onDelete(task.id)}
              >
                Yes
              </button>
              <button
                type="button"
                className={styles.btn}
                aria-label="Cancel delete"
                onClick={() => setConfirmDelete(false)}
              >
                No
              </button>
            </>
          ) : (
            <>
              <button type="button" className={styles.btn} aria-label={`Edit ${task.title}`} onClick={() => onEdit(task)}>Edit</button>
              <button type="button" className={`${styles.btn} ${styles.danger}`} aria-label={`Delete ${task.title}`} onClick={() => setConfirmDelete(true)}>Delete</button>
            </>
          )}
        </div>
      </div>

      {task.description && <p className={styles.description}>{task.description}</p>}

      <div className={styles.meta}>
        <span className={`${styles.priority} ${styles[task.priority]}`}>
          {PRIORITY_LABEL[task.priority]}
        </span>
        {category && (
          <span className={styles.category} style={{ borderColor: category.color, color: category.color }}>
            {category.name}
          </span>
        )}
        {task.deadline && (
          <span className={`${styles.deadline} ${isOverdue ? styles.overdue : ''}`}>
            {new Date(task.deadline).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  )
}
