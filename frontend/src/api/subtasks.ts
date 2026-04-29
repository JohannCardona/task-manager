import client from './client'
import type { Subtask } from '../types'

export const createSubtask = (taskId: number, title: string): Promise<Subtask> =>
  client.post<Subtask>(`/tasks/${taskId}/subtasks/`, { title }).then((r) => r.data)

export const updateSubtask = (
  taskId: number,
  subtaskId: number,
  data: Partial<{ title: string; is_completed: boolean }>,
): Promise<Subtask> =>
  client.patch<Subtask>(`/tasks/${taskId}/subtasks/${subtaskId}`, data).then((r) => r.data)

export const deleteSubtask = (taskId: number, subtaskId: number): Promise<void> =>
  client.delete(`/tasks/${taskId}/subtasks/${subtaskId}`).then(() => undefined)
