import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import * as authApi from '../api/auth'
import ThemeToggle from '../components/ThemeToggle'
import styles from '../styles/AuthForm.module.css'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authApi.resetPassword(token, password)
      navigate('/login', { replace: true })
    } catch {
      setError('This reset link is invalid or has expired. Please request a new one.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <p className={styles.error}>Invalid reset link.</p>
          <p className={styles.footer}>
            <Link className={styles.link} to="/forgot-password">Request a new one</Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <ThemeToggle className={styles.themeToggle} />
      <div className={styles.card}>
        <h1 className={styles.heading}>New password</h1>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">New password</label>
            <input
              id="password"
              className={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoFocus
            />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <button className={styles.button} type="submit" disabled={loading}>
            {loading ? 'Saving…' : 'Set new password'}
          </button>
        </form>
        <p className={styles.footer}>
          <Link className={styles.link} to="/login">Back to sign in</Link>
        </p>
      </div>
    </div>
  )
}
