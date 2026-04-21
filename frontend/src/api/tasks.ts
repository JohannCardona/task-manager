import client from './client'
import type { Task } from '../types'

export interface TaskPayload {
  title: string
  description?: string
  deadline?: string
  priority: 'low' | 'medium' | 'high'
  category_id?: number
}

export const getTasks = (): Promise<Task[]> =>
  client.get<Task[]>('/tasks/').then((r) => r.data)

export const createTask = (data: TaskPayload): Promise<Task> =>
  client.post<Task>('/tasks/', data).then((r) => r.data)

export const updateTask = (id: number, data: Partial<TaskPayload & { is_completed: boolean }>): Promise<Task> =>
  client.patch<Task>(`/tasks/${id}`, data).then((r) => r.data)

export const deleteTask = (id: number): Promise<void> =>
  client.delete(`/tasks/${id}`).then(() => undefined)
