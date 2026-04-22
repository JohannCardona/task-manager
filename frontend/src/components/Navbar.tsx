import { useAuth } from '../context/AuthContext'
import styles from '../styles/Navbar.module.css'

export default function Navbar() {
  const { logout } = useAuth()

  return (
    <nav className={styles.nav}>
      <span className={styles.brand}>Task Manager</span>
      <button className={styles.logout} onClick={logout}>Sign out</button>
    </nav>
  )
}
