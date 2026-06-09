import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import * as authApi from '../api/auth'
import type { User } from '../types'
import styles from '../styles/SettingsPage.module.css'

const TIMEZONES = Intl.supportedValuesOf('timeZone')

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {children}
    </section>
  )
}

export default function SettingsPage() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)

  // profile
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [profileError, setProfileError] = useState('')
  const [profileSuccess, setProfileSuccess] = useState('')
  const [profileLoading, setProfileLoading] = useState(false)

  // password
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)

  // timezone
  const [timezone, setTimezone] = useState('UTC')
  const [tzLoading, setTzLoading] = useState(false)
  const [tzSuccess, setTzSuccess] = useState('')

  // delete
  const [showDelete, setShowDelete] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    authApi.getMe().then((u) => {
      setUser(u)
      setUsername(u.username)
      setEmail(u.email)
      setTimezone(u.timezone)
    }).catch(() => {})
  }, [])

  async function handleProfileSave(e: FormEvent) {
    e.preventDefault()
    setProfileError('')
    setProfileSuccess('')
    setProfileLoading(true)
    try {
      const updated = await authApi.updateMe({ username, email })
      setUser(updated)
      const usernameChanged = updated.username !== user?.username
      setProfileSuccess(usernameChanged ? 'Profile saved. Please sign in again with your new username.' : 'Profile saved.')
      if (usernameChanged) {
        setTimeout(() => { logout(); navigate('/login') }, 2000)
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
      setProfileError(msg ?? 'Failed to save profile.')
    } finally {
      setProfileLoading(false)
    }
  }

  async function handlePasswordSave(e: FormEvent) {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.')
      return
    }
    setPasswordLoading(true)
    try {
      await authApi.changePassword(currentPassword, newPassword)
      setPasswordSuccess('Password updated.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
      setPasswordError(msg ?? 'Failed to update password.')
    } finally {
      setPasswordLoading(false)
    }
  }

  async function handleTimezoneSave() {
    setTzSuccess('')
    setTzLoading(true)
    try {
      await authApi.updateMe({ timezone })
      setTzSuccess('Timezone saved.')
    } finally {
      setTzLoading(false)
    }
  }

  async function handleDeleteAccount(e: FormEvent) {
    e.preventDefault()
    setDeleteError('')
    setDeleteLoading(true)
    try {
      await authApi.deleteAccount(deletePassword)
      logout()
      navigate('/login')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
      setDeleteError(msg ?? 'Failed to delete account.')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <Navbar />
      <main className={styles.main}>
        <h1 className={styles.title}>Settings</h1>

        <Section title="Profile">
          <form className={styles.form} onSubmit={handleProfileSave}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="s-username">Username</label>
              <input
                id="s-username"
                className={styles.input}
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="s-email">Email</label>
              <input
                id="s-email"
                className={styles.input}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            {profileError && <p className={styles.error}>{profileError}</p>}
            {profileSuccess && <p className={styles.success}>{profileSuccess}</p>}
            <div className={styles.actions}>
              <button className={styles.saveBtn} type="submit" disabled={profileLoading}>
                {profileLoading ? 'Saving…' : 'Save profile'}
              </button>
            </div>
          </form>
        </Section>

        <Section title="Change password">
          <form className={styles.form} onSubmit={handlePasswordSave}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="s-cur-pw">Current password</label>
              <input
                id="s-cur-pw"
                className={styles.input}
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="s-new-pw">New password</label>
              <input
                id="s-new-pw"
                className={styles.input}
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="s-confirm-pw">Confirm new password</label>
              <input
                id="s-confirm-pw"
                className={styles.input}
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            {passwordError && <p className={styles.error}>{passwordError}</p>}
            {passwordSuccess && <p className={styles.success}>{passwordSuccess}</p>}
            <div className={styles.actions}>
              <button className={styles.saveBtn} type="submit" disabled={passwordLoading}>
                {passwordLoading ? 'Updating…' : 'Update password'}
              </button>
            </div>
          </form>
        </Section>

        <Section title="Timezone">
          <p className={styles.hint}>Used for daily email reminders at 8 AM your local time.</p>
          <div className={styles.tzRow}>
            <select
              className={styles.tzSelect}
              value={timezone}
              onChange={(e) => { setTimezone(e.target.value); setTzSuccess('') }}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
            <button className={styles.saveBtn} type="button" onClick={handleTimezoneSave} disabled={tzLoading}>
              {tzLoading ? 'Saving…' : 'Save timezone'}
            </button>
          </div>
          {tzSuccess && <p className={styles.success}>{tzSuccess}</p>}
        </Section>

        <Section title="Danger zone">
          {!showDelete ? (
            <button className={styles.dangerBtn} type="button" onClick={() => setShowDelete(true)}>
              Delete account
            </button>
          ) : (
            <form className={styles.form} onSubmit={handleDeleteAccount}>
              <p className={styles.dangerHint}>This will permanently delete your account and all tasks. Enter your password to confirm.</p>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="s-del-pw">Password</label>
                <input
                  id="s-del-pw"
                  className={styles.input}
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              {deleteError && <p className={styles.error}>{deleteError}</p>}
              <div className={styles.actions}>
                <button className={styles.cancelBtn} type="button" onClick={() => { setShowDelete(false); setDeletePassword(''); setDeleteError('') }}>
                  Cancel
                </button>
                <button className={styles.dangerBtn} type="submit" disabled={deleteLoading}>
                  {deleteLoading ? 'Deleting…' : 'Delete my account'}
                </button>
              </div>
            </form>
          )}
        </Section>
      </main>
    </div>
  )
}
