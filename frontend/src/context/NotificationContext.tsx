import { createContext, useContext, useState, type ReactNode } from 'react'

interface NotificationContextValue {
  deadlineCount: number
  setDeadlineCount: (count: number) => void
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [deadlineCount, setDeadlineCount] = useState(0)
  return (
    <NotificationContext.Provider value={{ deadlineCount, setDeadlineCount }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider')
  return ctx
}
