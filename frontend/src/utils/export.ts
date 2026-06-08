import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Task, Category } from '../types'

function formatDeadline(deadline: string | null): string {
  if (!deadline) return ''
  return new Date(deadline).toLocaleString()
}

function getCategoryName(task: Task, categories: Category[]): string {
  if (!task.category_id) return ''
  return categories.find(c => c.id === task.category_id)?.name ?? ''
}

export function exportCSV(tasks: Task[], categories: Category[]): void {
  const headers = ['Title', 'Description', 'Priority', 'Category', 'Deadline', 'Recurrence', 'Status', 'Subtasks']
  const rows = tasks.map(t => [
    t.title,
    t.description ?? '',
    t.priority,
    getCategoryName(t, categories),
    formatDeadline(t.deadline),
    t.recurrence === 'none' ? '' : t.recurrence,
    t.is_completed ? 'Completed' : 'Active',
    `${t.subtasks.filter(s => s.is_completed).length}/${t.subtasks.length}`,
  ])

  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`
  const csv = [headers, ...rows].map(row => row.map(escape).join(',')).join('\n')

  download('tasks.csv', 'text/csv', csv)
}

export function exportPDF(tasks: Task[], categories: Category[]): void {
  const doc = new jsPDF({ orientation: 'landscape' })
  doc.setFontSize(16)
  doc.text('Task Export', 14, 16)
  doc.setFontSize(10)
  doc.text(`Generated ${new Date().toLocaleString()}`, 14, 23)

  autoTable(doc, {
    startY: 28,
    head: [['Title', 'Priority', 'Category', 'Deadline', 'Recurrence', 'Status', 'Subtasks']],
    body: tasks.map(t => [
      t.title,
      t.priority,
      getCategoryName(t, categories),
      formatDeadline(t.deadline),
      t.recurrence === 'none' ? '' : t.recurrence,
      t.is_completed ? 'Completed' : 'Active',
      `${t.subtasks.filter(s => s.is_completed).length}/${t.subtasks.length}`,
    ]),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [99, 102, 241] },
    alternateRowStyles: { fillColor: [245, 245, 250] },
    columnStyles: { 0: { cellWidth: 70 } },
  })

  doc.save('tasks.pdf')
}

function download(filename: string, mimeType: string, content: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
