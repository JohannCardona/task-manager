import client from './client'
import type { Category } from '../types'

export const getCategories = (): Promise<Category[]> =>
  client.get<Category[]>('/categories/').then((r) => r.data)

export const createCategory = (name: string, color: string): Promise<Category> =>
  client.post<Category>('/categories/', { name, color }).then((r) => r.data)

export const updateCategory = (id: number, name: string, color: string): Promise<Category> =>
  client.patch<Category>(`/categories/${id}`, { name, color }).then((r) => r.data)

export const deleteCategory = (id: number): Promise<void> =>
  client.delete(`/categories/${id}`).then(() => undefined)
