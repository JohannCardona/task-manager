import client from './client'
import type { Token, User } from '../types'

export const register = (email: string, username: string, password: string, timezone: string): Promise<User> =>
  client.post<User>('/auth/register', { email, username, password, timezone }).then((r) => r.data)

export const login = (username: string, password: string): Promise<Token> =>
  client.post<Token>('/auth/login', { username, password }).then((r) => r.data)

export const getMe = (): Promise<User> =>
  client.get<User>('/auth/me').then((r) => r.data)

export const updateMe = (data: Partial<Pick<User, 'timezone' | 'username' | 'email'>>): Promise<User> =>
  client.patch<User>('/auth/me', data).then((r) => r.data)

export const changePassword = (current_password: string, new_password: string): Promise<void> =>
  client.post('/auth/me/password', { current_password, new_password }).then(() => undefined)

export const deleteAccount = (password: string): Promise<void> =>
  client.post('/auth/me/delete', { password }).then(() => undefined)

export const forgotPassword = (email: string): Promise<void> =>
  client.post('/auth/forgot-password', { email }).then(() => undefined)

export const resetPassword = (token: string, password: string): Promise<void> =>
  client.post('/auth/reset-password', { token, password }).then(() => undefined)
