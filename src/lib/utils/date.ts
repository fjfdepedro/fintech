import { format } from 'date-fns'

// Función para formatear fechas de manera consistente en toda la aplicación
export function formatDate(date: Date | string | number): string {
  const dateObj = new Date(date)
  // Asegurarnos de que la fecha esté en UTC
  const utcDate = new Date(Date.UTC(
    dateObj.getUTCFullYear(),
    dateObj.getUTCMonth(),
    dateObj.getUTCDate(),
    dateObj.getUTCHours(),
    dateObj.getUTCMinutes(),
    dateObj.getUTCSeconds()
  ))
  return format(utcDate, "MMM dd, yyyy 'at' HH:mm 'GMT'")
}

// Función para formatear fechas cortas (para gráficos)
export function formatShortDate(date: Date | string | number): string {
  const dateObj = new Date(date)
  const utcDate = new Date(Date.UTC(
    dateObj.getUTCFullYear(),
    dateObj.getUTCMonth(),
    dateObj.getUTCDate(),
    dateObj.getUTCHours(),
    dateObj.getUTCMinutes(),
    dateObj.getUTCSeconds()
  ))
  return format(utcDate, "MMM dd, HH:mm 'GMT'")
}

// Función para validar que una fecha no sea futura
export function isValidPastDate(date: Date | string | number): boolean {
  const dateObj = new Date(date)
  const now = new Date()
  return dateObj <= now
} 