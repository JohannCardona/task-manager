import client from './client'
import type { Attachment } from '../types'

export const uploadAttachment = (taskId: number, file: File): Promise<Attachment> => {
  const formData = new FormData()
  formData.append('file', file)
  return client.post<Attachment>(`/tasks/${taskId}/attachments/`, formData).then((r) => r.data)
}

export const deleteAttachment = (taskId: number, attachmentId: number): Promise<void> =>
  client.delete(`/tasks/${taskId}/attachments/${attachmentId}`).then(() => undefined)

export async function downloadAttachment(taskId: number, attachment: Attachment): Promise<void> {
  const res = await client.get(`/tasks/${taskId}/attachments/${attachment.id}/download`, {
    responseType: 'blob',
  })
  const url = URL.createObjectURL(res.data)
  const link = document.createElement('a')
  link.href = url
  link.download = attachment.filename
  link.click()
  URL.revokeObjectURL(url)
}
