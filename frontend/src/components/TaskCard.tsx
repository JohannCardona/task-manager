import type { Task, Category } from '../types'
import styles from './TaskCard.module.css'

interface Props {
  task: Task
  categories: Category[]
  onToggle: (task: Task) => void
  onEdit: (task: Task) => void
  onDelete: (id: number) => void
}

const PRIORITY_LABEL = { low: 'Low', medium: 'Medium', high: 'High' }

export default function TaskCard({ task, categories, onToggle, onEdit, onDelete }: Props) {
  const category = categories.find((c) => c.id === task.category_id)
  const isOverdue = task.deadline && !task.is_completed && new Date(task.deadline) < new Date()

  return (
    <div className={`${styles.card} ${task.is_completed ? styles.completed : ''}`}>
      <div className={styles.top}>
        <input
          type="checkbox"
          className={styles.checkbox}
          checked={task.is_completed}
          onChange={() => onToggle(task)}
        />
        <span className={styles.title}>{task.title}</span>
        <div className={styles.actions}>
          <button className={styles.btn} onClick={() => onEdit(task)}>Edit</button>
          <button className={`${styles.btn} ${styles.danger}`} onClick={() => onDelete(task.id)}>Delete</button>
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
