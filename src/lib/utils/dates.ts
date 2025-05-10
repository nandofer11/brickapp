import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export const formatDateString = (dateString: string, formatStr: string = 'dd/MM/yyyy') => {
  if (!dateString) return ''
  try {
    // Asegurarse de que la fecha esté en formato ISO y eliminar la parte de la zona horaria
    const cleanDate = dateString.split('T')[0]
    return format(parseISO(cleanDate), formatStr, { locale: es })
  } catch (error) {
    console.error('Error formatting date:', error)
    return dateString
  }
}

export const formatDateRange = (startDate: string, endDate: string) => {
  return `${formatDateString(startDate)} - ${formatDateString(endDate)}`
}

export const toISODateString = (date: Date | string) => {
  if (!date) return ''
  try {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toISOString().split('T')[0]
  } catch (error) {
    console.error('Error converting to ISO date:', error)
    return ''
  }
}
