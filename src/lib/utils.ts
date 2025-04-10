import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatNumber(num: number | string | null | undefined, maximumFractionDigits: number = 2): string {
  if (num === null || num === undefined) return '0'
  const n = typeof num === 'string' ? parseFloat(num) : num
  
  if (isNaN(n)) return '0'
  
  if (n >= 1e9) {
    return `${(n / 1e9).toLocaleString('es-ES', { maximumFractionDigits })}B`
  }
  if (n >= 1e6) {
    return `${(n / 1e6).toLocaleString('es-ES', { maximumFractionDigits })}M`
  }
  if (n >= 1e3) {
    return `${(n / 1e3).toLocaleString('es-ES', { maximumFractionDigits })}K`
  }
  
  return n.toLocaleString('es-ES', { maximumFractionDigits })
}

export function formatPercentage(value: number | undefined | null): string {
  if (value === undefined || value === null) return '0.00%'
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    style: 'percent',
    signDisplay: 'exceptZero'
  })
}
