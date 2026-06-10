import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationContext'
import * as authApi from '../api/auth'
import ThemeToggle from './ThemeToggle'
import styles from '../styles/Navbar.module.css'

const TIMEZONES = Intl.supportedValuesOf('timeZone')

export default function Navbar() {
  const { logout } = useAuth()
  const { deadlineCount } = useNotifications()
  const [timezone, setTimezone] = useState('UTC')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    authApi.getMe().then((u) => setTimezone(u.timezone)).catch(() => {})
  }, [])

  async function handleTimezoneChange(tz: string) {
    setTimezone(tz)
    setSaving(true)
    try {
      await authApi.updateMe({ timezone: tz })
    } finally {
      setSaving(false)
    }
  }

  return (
    <nav className={styles.nav}>
      <span className={styles.brand}>Task Manager</span>
      <div className={styles.actions}>
        <select
          className={styles.tzSelect}
          value={timezone}
          onChange={(e) => handleTimezoneChange(e.target.value)}
          disabled={saving}
          title="Email reminder timezone"
        >
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>{tz}</option>
          ))}
        </select>
        <ThemeToggle />
        {deadlineCount > 0 && (
          <span className={styles.badge} title={`${deadlineCount} task${deadlineCount > 1 ? 's' : ''} due today or overdue`}>
            {deadlineCount}
          </span>
        )}
        <Link className={styles.settingsLink} to="/settings">Settings</Link>
        <button type="button" className={styles.logout} onClick={logout}>Sign out</button>
      </div>
    </nav>
  )
}
