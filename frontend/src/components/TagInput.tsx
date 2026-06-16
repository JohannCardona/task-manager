import { useState, useRef } from 'react'
import styles from '../styles/TagInput.module.css'

interface Props {
  tags: string[]
  suggestions: string[]
  onChange: (tags: string[]) => void
}

export default function TagInput({ tags, suggestions, onChange }: Props) {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = suggestions.filter(
    (s) => s.includes(input.toLowerCase()) && !tags.includes(s)
  )

  function addTag(name: string) {
    const cleaned = name.trim().toLowerCase()
    if (!cleaned || tags.includes(cleaned)) return
    onChange([...tags, cleaned])
    setInput('')
  }

  function removeTag(name: string) {
    onChange(tags.filter((t) => t !== name))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault()
      addTag(input)
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    }
  }

  return (
    <div className={styles.wrapper} onClick={() => inputRef.current?.focus()}>
      <div className={styles.chips}>
        {tags.map((tag) => (
          <span key={tag} className={styles.chip}>
            #{tag}
            <button
              type="button"
              className={styles.remove}
              onClick={(e) => { e.stopPropagation(); removeTag(tag) }}
              aria-label={`Remove tag ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          className={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? 'Add tags… (Enter or comma to add)' : ''}
        />
      </div>
      {input && filtered.length > 0 && (
        <ul className={styles.suggestions}>
          {filtered.slice(0, 6).map((s) => (
            <li key={s}>
              <button type="button" className={styles.suggestion} onClick={() => addTag(s)}>
                #{s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
