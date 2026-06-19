import { useState } from 'react'
import type { Category } from '../types'
import { useModalEscape } from '../hooks/useModalEscape'
import ConfirmInline from './ConfirmInline'
import styles from '../styles/CategoryManagerModal.module.css'

interface Props {
  categories: Category[]
  onEdit: (category: Category) => void
  onDelete: (id: number) => void
  onNew: () => void
  onClose: () => void
}

export default function CategoryManagerModal({ categories, onEdit, onDelete, onNew, onClose }: Props) {
  const [confirmId, setConfirmId] = useState<number | null>(null)

  useModalEscape(onClose)

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.heading}>Categories</h2>

        {categories.length === 0 ? (
          <p className={styles.empty}>No categories yet.</p>
        ) : (
          <ul className={styles.list}>
            {categories.map((cat) => (
              <li key={cat.id} className={styles.row}>
                <span className={styles.swatch} style={{ background: cat.color }} />
                <span className={styles.name} style={{ color: cat.color }}>{cat.name}</span>
                {confirmId === cat.id ? (
                  <span className={styles.confirm}>
                    <ConfirmInline
                      onConfirm={() => { onDelete(cat.id); setConfirmId(null) }}
                      onCancel={() => setConfirmId(null)}
                    />
                  </span>
                ) : (
                  <span className={styles.actions}>
                    <button type="button" className={styles.btn} onClick={() => onEdit(cat)}>Edit</button>
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.danger}`}
                      onClick={() => setConfirmId(cat.id)}
                    >
                      Delete
                    </button>
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className={styles.footer}>
          <button type="button" className={styles.newBtn} onClick={onNew}>+ New category</button>
          <button type="button" className={styles.closeBtn} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
