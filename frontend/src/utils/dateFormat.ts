// Utility functions for consistent date formatting

export const formatDate = (dateString: string): string => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('vi-VN')
}

export const formatTime = (timeString: string): string => {
  if (!timeString) return '-'
  return timeString.slice(0, 5)
}

export const formatDateTime = (dateTimeString: string): string => {
  if (!dateTimeString) return '-'
  return new Date(dateTimeString).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const formatDateWithTime = (dateString: string, timeString: string): string => {
  if (!dateString) return '-'
  const formattedDate = new Date(dateString).toLocaleDateString('vi-VN')
  const formattedTime = timeString ? timeString.slice(0, 5) : ''
  return formattedTime ? `${formattedDate} lúc ${formattedTime}` : formattedDate
} 