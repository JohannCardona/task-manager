import { useState } from 'react'
import { Link } from 'react-router-dom'
import * as authApi from '../api/auth'
import ThemeToggle from '../components/ThemeToggle'
import styles from '../styles/AuthForm.module.css'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    setLoading(true)
    try {
      await authApi.forgotPassword(email)
    } finally {
      setLoading(false)
      setSubmitted(true)
    }
  }

  return (
    <div className={styles.page}>
      <ThemeToggle className={styles.themeToggle} />
      <div className={styles.card}>
        <h1 className={styles.heading}>Reset password</h1>
        {submitted ? (
          <p className={styles.footer}>
            If that email is registered you'll receive a reset link shortly. Check your inbox.
          </p>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="email">Email</label>
              <input
                id="email"
                className={styles.input}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <button className={styles.button} type="submit" disabled={loading}>
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}
        <p className={styles.footer}>
          <Link className={styles.link} to="/login">Back to sign in</Link>
        </p>
      </div>
    </div>
  )
}
