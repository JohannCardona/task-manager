import { useAuth } from '../context/AuthContext'
import ThemeToggle from './ThemeToggle'
import styles from '../styles/Navbar.module.css'

export default function Navbar() {
  const { logout } = useAuth()

  return (
    <nav className={styles.nav}>
      <span className={styles.brand}>Task Manager</span>
      <div className={styles.actions}>
        <ThemeToggle />
        <button type="button" className={styles.logout} onClick={logout}>Sign out</button>
      </div>
    </nav>
  )
}
