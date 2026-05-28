import client from './client'
import type { Token, User } from '../types'

export const register = (email: string, username: string, password: string, timezone: string): Promise<User> =>
  client.post<User>('/auth/register', { email, username, password, timezone }).then((r) => r.data)

export const login = (username: string, password: string): Promise<Token> =>
  client.post<Token>('/auth/login', { username, password }).then((r) => r.data)

export const getMe = (): Promise<User> =>
  client.get<User>('/auth/me').then((r) => r.data)

export const updateMe = (timezone: string): Promise<User> =>
  client.patch<User>('/auth/me', { timezone }).then((r) => r.data)
