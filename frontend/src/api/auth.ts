import client from './client'
import type { Token, User } from '../types'

export const register = (email: string, username: string, password: string): Promise<User> =>
  client.post<User>('/auth/register', { email, username, password }).then((r) => r.data)

export const login = (username: string, password: string): Promise<Token> =>
  client.post<Token>('/auth/login', { username, password }).then((r) => r.data)
