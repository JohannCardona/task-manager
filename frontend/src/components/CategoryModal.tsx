import { useState, useEffect } from 'react'
import styles from '../styles/CategoryModal.module.css'

const PRESET_COLORS = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981',
  '#3b82f6', '#ef4444', '#8b5cf6', '#14b8a6',
]

interface Props {
  onSave: (name: string, color: string) => void
  onClose: () => void
}

export default function CategoryModal({ onSave, onClose }: Props) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    onSave(name, color)
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.heading}>New category</h2>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="category-name" className={styles.label}>Name</label>
            <input
              id="category-name"
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className={styles.field}>
            <span className={styles.label}>Color</span>
            <div className={styles.swatches}>
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`${styles.swatch} ${color === c ? styles.selected : ''}`}
                  style={{ background: c }}
                  aria-label={c}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
          <div className={styles.preview}>
            <span style={{ borderColor: color, color }}>
              {name || 'Preview'}
            </span>
          </div>
          <div className={styles.buttons}>
            <button type="button" className={styles.cancel} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.save}>Create</button>
          </div>
        </form>
      </div>
    </div>
  )
}
