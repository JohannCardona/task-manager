export interface User {
  id: number
  email: string
  username: string
  is_active: boolean
}

export interface Category {
  id: number
  name: string
  color: string
  owner_id: number
}

export type Priority = 'low' | 'medium' | 'high'

export interface Subtask {
  id: number
  task_id: number
  title: string
  is_completed: boolean
  created_at: string
}

export interface Task {
  id: number
  title: string
  description: string | null
  deadline: string | null
  is_completed: boolean
  priority: Priority
  owner_id: number
  category_id: number | null
  position: number | null
  created_at: string
  updated_at: string
  subtasks: Subtask[]
}

export interface Token {
  access_token: string
  refresh_token: string
  token_type: string
}
