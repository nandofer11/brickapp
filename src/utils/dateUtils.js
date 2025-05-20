import { utcToZonedTime, format } from 'date-fns-tz';

export function getCurrentDateInLima() {
  const timeZone = 'America/Lima';
  const now = new Date();
  return format(utcToZonedTime(now, timeZone), 'yyyy-MM-dd HH:mm:ssXXX', { timeZone });
}

/**
 * Formatea una fecha UTC a diferentes formatos
 * @param {string | Date} date - Fecha a formatear
 * @param {Object} options - Opciones de formato
 * @param {('short' | 'medium' | 'long')} [options.format='short'] - Tipo de formato
 * @param {string} [options.locale='es-PE'] - Configuración regional
 * @returns {string} Fecha formateada
 */
export function formatUTCDate(date, options = {}) {
  const { format: formatType = 'short', locale = 'es-PE' } = options;
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const año = dateObj.getUTCFullYear();
  const mes = (dateObj.getUTCMonth() + 1).toString().padStart(2, '0');
  const dia = dateObj.getUTCDate().toString().padStart(2, '0');

  switch (formatType) {
    case 'short':
      return `${dia}/${mes}/${año}`;
    case 'medium':
      const nombreMes = new Date(año, parseInt(mes) - 1)
        .toLocaleString(locale, { month: 'short' });
      return `${dia} ${nombreMes} ${año}`;
    case 'long':
      return dateObj.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC'
      });
    default:
      return `${dia}/${mes}/${año}`;
  }
}

/**
 * Formatea un rango de fechas UTC
 * @param {string} fechaInicio - Fecha inicial
 * @param {string} fechaFin - Fecha final
 * @param {Object} options - Opciones de formato
 * @returns {string} Rango de fechas formateado
 */
export function formatUTCDateRange(fechaInicio, fechaFin, options = {}) {
  return `${formatUTCDate(fechaInicio, options)} - ${formatUTCDate(fechaFin, options)}`;
}
