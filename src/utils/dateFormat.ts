type DateFormat = 'short' | 'medium' | 'long';

interface DateFormatOptions {
  format?: DateFormat;
  locale?: string;
}

export const formatDate = (date: string | Date, options: DateFormatOptions = {}) => {
  const { format = 'short', locale = 'es-PE' } = options;
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  // Mantener UTC para fechas que vienen del servidor
  const año = dateObj.getUTCFullYear();
  const mes = (dateObj.getUTCMonth() + 1).toString().padStart(2, '0');
  const dia = dateObj.getUTCDate().toString().padStart(2, '0');

  switch (format) {
    case 'short':
      return `${dia}/${mes}/${año}`;
    case 'medium':
      const nombreMes = new Date(año, parseInt(mes) - 1).toLocaleString(locale, { month: 'short' });
      return `${dia} ${nombreMes} ${año}`;
    case 'long':
      return dateObj.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    default:
      return `${dia}/${mes}/${año}`;
  }
};
