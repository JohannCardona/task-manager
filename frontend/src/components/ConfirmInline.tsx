import styles from '../styles/ConfirmInline.module.css'

interface Props {
  message?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmInline({ message = 'Delete?', onConfirm, onCancel }: Props) {
  return (
    <>
      <span className={styles.text}>{message}</span>
      <button type="button" className={`${styles.btn} ${styles.danger}`} onClick={onConfirm}>Yes</button>
      <button type="button" className={styles.btn} onClick={onCancel}>No</button>
    </>
  )
}
