import { type ClassValue, clsx } from "clsx"

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

// Format date untuk display
export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Format datetime untuk display
export function formatDateTime(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Format time untuk display
export function formatTime(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Check if date is overdue
export function isOverdue(date: Date | string): boolean {
  const d = new Date(date)
  const now = new Date()
  return d < now
}

// Calculate days difference
export function daysDifference(date1: Date | string, date2: Date | string): number {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  const diffTime = Math.abs(d2.getTime() - d1.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

// Format number with thousand separator
export function formatNumber(num: number): string {
  return num.toLocaleString('id-ID')
}

// Generate random color for charts
export function generateColors(count: number): string[] {
  const colors = [
    '#4A90E2', '#87CEEB', '#5DADE2', '#3498DB', '#2E86AB',
    '#A8E6CF', '#88D8C0', '#7FCDCD', '#6BB6FF', '#81C784'
  ]

  if (count <= colors.length) {
    return colors.slice(0, count)
  }

  // Generate additional colors if needed
  const additionalColors = []
  for (let i = colors.length; i < count; i++) {
    const hue = (i * 137.508) % 360 // Golden angle approximation
    additionalColors.push(`hsl(${hue}, 70%, 60%)`)
  }

  return [...colors, ...additionalColors]
}

// Debounce function for search
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Generate slug from string
export function generateSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

// Calculate percentage
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}

// Get status color for UI
export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    AVAILABLE: 'text-green-600 bg-green-100',
    OUT_OF_STOCK: 'text-red-600 bg-red-100',
    DISCONTINUED: 'text-gray-600 bg-gray-100',
    ACTIVE: 'text-blue-600 bg-blue-100',
    RETURNED: 'text-green-600 bg-green-100',
    OVERDUE: 'text-red-600 bg-red-100'
  }

  return statusColors[status] || 'text-gray-600 bg-gray-100'
}

// Get priority color based on stock level
export function getStockPriorityColor(stock: number, minStock: number): string {
  if (stock === 0) return 'text-red-600'
  if (stock <= minStock) return 'text-yellow-600'
  return 'text-green-600'
}

// Format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Truncate text
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// Get initials from name
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2)
}
