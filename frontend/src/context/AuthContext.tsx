import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import * as authApi from '../api/auth'

interface AuthContextValue {
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  register: (email: string, username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    () => Boolean(localStorage.getItem('access_token'))
  )

  const login = useCallback(async (username: string, password: string) => {
    const token = await authApi.login(username, password)
    localStorage.setItem('access_token', token.access_token)
    setIsAuthenticated(true)
  }, [])

  const register = useCallback(async (email: string, username: string, password: string) => {
    await authApi.register(email, username, password)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('access_token')
    setIsAuthenticated(false)
  }, [])

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
