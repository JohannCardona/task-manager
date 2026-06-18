import { useState, useRef } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Task, Category, Subtask, Attachment } from '../types'
import * as subtasksApi from '../api/subtasks'
import * as attachmentsApi from '../api/attachments'
import { useToast } from '../context/ToastContext'
import styles from '../styles/TaskCard.module.css'

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface Props {
  task: Task
  categories: Category[]
  sortable?: boolean
  isSelected?: boolean
  onSelect?: (id: number, selected: boolean) => void
  onToggle: (task: Task) => void
  onEdit: (task: Task) => void
  onDelete: (id: number) => void
  onTagClick?: (tag: string) => void
}

const PRIORITY_LABEL = { low: 'Low', medium: 'Medium', high: 'High' }

export default function TaskCard({ task, categories, sortable = false, isSelected = false, onSelect, onToggle, onEdit, onDelete, onTagClick }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [subtasks, setSubtasks] = useState<Subtask[]>(task.subtasks)
  const [newSubtask, setNewSubtask] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>(task.attachments)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { addToast } = useToast()

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })

  const category = categories.find((c) => c.id === task.category_id)
  const isOverdue = task.deadline && !task.is_completed && new Date(task.deadline) < new Date()
  const doneCount = subtasks.filter((s) => s.is_completed).length

  const dragStyle = sortable
    ? {
        '--dnd-transform': CSS.Transform.toString(transform),
        '--dnd-transition': transition ?? '',
        '--dnd-opacity': isDragging ? '0.5' : '1',
      } as React.CSSProperties
    : {}

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

  async function handleUploadAttachment(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const created = await attachmentsApi.uploadAttachment(task.id, file)
      setAttachments((prev) => [...prev, created])
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
      addToast(msg ?? 'Failed to upload file', 'error')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleDeleteAttachment(attachmentId: number) {
    try {
      await attachmentsApi.deleteAttachment(task.id, attachmentId)
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId))
    } catch {
      addToast('Failed to delete attachment', 'error')
    }
  }

  async function handleDownloadAttachment(attachment: Attachment) {
    try {
      await attachmentsApi.downloadAttachment(task.id, attachment)
    } catch {
      addToast('Failed to download attachment', 'error')
    }
  }

  return (
    <div
      ref={sortable ? setNodeRef : undefined}
      style={dragStyle}
      className={`${styles.card} ${task.is_completed ? styles.completed : ''}`}
    >
      <div className={styles.top}>
        {onSelect && (
          <input
            type="checkbox"
            className={styles.selectBox}
            checked={isSelected}
            onChange={(e) => onSelect(task.id, e.target.checked)}
            aria-label={`Select "${task.title}"`}
          />
        )}
        {sortable && (
          <button type="button" className={styles.dragHandle} aria-label="Drag to reorder" {...listeners} {...attributes}>
            ⠿
          </button>
        )}
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
        {task.recurrence !== 'none' && (
          <span className={styles.recurrence}>↻ {task.recurrence}</span>
        )}
        {subtasks.length > 0 && (
          <span className={styles.subtaskCount}>{doneCount}/{subtasks.length} subtasks</span>
        )}
        {task.notes && (
          <span className={styles.notesIndicator} title={task.notes}>Notes</span>
        )}
        {task.tags.map((tag) => (
          <button
            key={tag.id}
            type="button"
            className={styles.tag}
            onClick={() => onTagClick?.(tag.name)}
          >
            #{tag.name}
          </button>
        ))}
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

      <div className={styles.attachments}>
        {attachments.map((attachment) => (
          <div key={attachment.id} className={styles.attachmentRow}>
            <button
              type="button"
              className={styles.attachmentName}
              onClick={() => handleDownloadAttachment(attachment)}
              title={`Download ${attachment.filename}`}
            >
              📎 {attachment.filename}
            </button>
            <span className={styles.attachmentSize}>{formatSize(attachment.size)}</span>
            <button
              type="button"
              className={styles.subtaskDelete}
              aria-label={`Delete attachment ${attachment.filename}`}
              onClick={() => handleDeleteAttachment(attachment.id)}
            >
              ×
            </button>
          </div>
        ))}

        <label className={styles.attachmentAdd}>
          {uploading ? 'Uploading…' : '+ Add attachment'}
          <input
            ref={fileInputRef}
            type="file"
            className={styles.attachmentInput}
            onChange={handleUploadAttachment}
            disabled={uploading}
          />
        </label>
      </div>
    </div>
  )
}
