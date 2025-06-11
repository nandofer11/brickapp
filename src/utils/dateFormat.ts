/**
 * Formatea una fecha para uso en inputs HTML de tipo date (formato YYYY-MM-DD)
 * Esta función es especialmente útil para preparar fechas que se mostrarán en campos
 * input[type="date"] que requieren un formato específico según el estándar HTML
 * 
 * @param dateString - Fecha a formatear (string o Date)
 * @returns String en formato YYYY-MM-DD compatible con inputs HTML de tipo date,
 * o string vacío si la fecha no es válida
 */
export const formatDateForInput = (dateString: string | Date): string => {
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) {
      return '';
    }
    
    // Obtener componentes de fecha en UTC para mantener consistencia con el servidor
    const año = date.getUTCFullYear();
    const mes = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const dia = date.getUTCDate().toString().padStart(2, '0');
    
    // Devolver en formato YYYY-MM-DD requerido por input[type="date"]
    return `${año}-${mes}-${dia}`;
  } catch (error) {
    console.error('Error formateando fecha para input:', error);
    return '';
  }
};
/**
 * Formatea una fecha a formato legible (DD/MM/YYYY)
 * Esta función es útil para mostrar fechas en la interfaz de usuario
 * en un formato más amigable y común en español
 * 
 * @param dateString - Fecha a formatear (string o Date)
 * @returns String en formato DD/MM/YYYY, o string vacío si la fecha no es válida
 */
export const formatDate = (dateString: string | Date): string => {
  try {
    // Si la fecha es una cadena ISO, la convertimos a objeto Date
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) {
      return '';
    }
    
    // Usar getUTCDate, getUTCMonth, etc. para evitar problemas con zonas horarias
    const dia = date.getUTCDate().toString().padStart(2, '0');
    const mes = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const año = date.getUTCFullYear();
    
    // Devolver en formato DD/MM/YYYY
    return `${dia}/${mes}/${año}`;
  } catch (error) {
    console.error('Error formateando fecha:', error);
    return '';
  }
};

/**
 * Formatea una fecha a un formato con día de la semana, día, mes y año
 * Ejemplo: "Lunes 09 junio 2025"
 * 
 * @param dateString - Fecha a formatear (string o Date)
 * @returns String con formato "Día DD mes YYYY", o string vacío si la fecha no es válida
 */
export const formatDateWithDayName = (dateString: string | Date): string => {
  try {
    // Si la fecha es una cadena ISO, la convertimos a objeto Date
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) {
      return '';
    }
    
    // Nombres de los días de la semana en español
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    
    // Nombres de los meses en español
    const nombresMeses = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    
    // Obtener componentes de la fecha
    const diaSemana = diasSemana[date.getUTCDay()];
    const diaMes = date.getUTCDate();
    const mes = nombresMeses[date.getUTCMonth()];
    const año = date.getUTCFullYear();
    
    // Devolver en formato "Día DD mes YYYY"
    return `${diaSemana} ${diaMes.toString().padStart(2, '0')} ${mes} ${año}`;
  } catch (error) {
    console.error('Error formateando fecha con nombre de día:', error);
    return '';
  }
};