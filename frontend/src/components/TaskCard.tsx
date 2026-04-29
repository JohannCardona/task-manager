import { useState } from 'react'
import type { Task, Category, Subtask } from '../types'
import * as subtasksApi from '../api/subtasks'
import { useToast } from '../context/ToastContext'
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
  const [subtasks, setSubtasks] = useState<Subtask[]>(task.subtasks)
  const [newSubtask, setNewSubtask] = useState('')
  const { addToast } = useToast()

  const category = categories.find((c) => c.id === task.category_id)
  const isOverdue = task.deadline && !task.is_completed && new Date(task.deadline) < new Date()
  const doneCount = subtasks.filter((s) => s.is_completed).length

  async function handleToggleSubtask(subtask: Subtask) {
    try {
      const updated = await subtasksApi.updateSubtask(task.id, subtask.id, { is_completed: !subtask.is_completed })
      setSubtasks((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
    } catch {
      addToast('Failed to update subtask', 'error')
    }
  }

  async function handleDeleteSubtask(subtaskId: number) {
    try {
      await subtasksApi.deleteSubtask(task.id, subtaskId)
      setSubtasks((prev) => prev.filter((s) => s.id !== subtaskId))
    } catch {
      addToast('Failed to delete subtask', 'error')
    }
  }

  async function handleAddSubtask(e: { preventDefault(): void }) {
    e.preventDefault()
    const title = newSubtask.trim()
    if (!title) return
    try {
      const created = await subtasksApi.createSubtask(task.id, title)
      setSubtasks((prev) => [...prev, created])
      setNewSubtask('')
    } catch {
      addToast('Failed to add subtask', 'error')
    }
  }

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
        {subtasks.length > 0 && (
          <span className={styles.subtaskCount}>{doneCount}/{subtasks.length} subtasks</span>
        )}
      </div>

      <div className={styles.subtasks}>
        {subtasks.map((subtask) => (
          <div key={subtask.id} className={styles.subtaskRow}>
            <label className={styles.subtaskLabel}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={subtask.is_completed}
                onChange={() => handleToggleSubtask(subtask)}
              />
              <span className={`${styles.subtaskTitle} ${subtask.is_completed ? styles.subtaskDone : ''}`}>
                {subtask.title}
              </span>
            </label>
            <button
              type="button"
              className={styles.subtaskDelete}
              aria-label={`Delete subtask ${subtask.title}`}
              onClick={() => handleDeleteSubtask(subtask.id)}
            >
              ×
            </button>
          </div>
        ))}

        <form className={styles.subtaskForm} onSubmit={handleAddSubtask}>
          <input
            type="text"
            className={styles.subtaskInput}
            placeholder="Add subtask…"
            value={newSubtask}
            onChange={(e) => setNewSubtask(e.target.value)}
          />
          <button type="submit" className={styles.subtaskAdd}>Add</button>
        </form>
      </div>
    </div>
  )
}
