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

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD ajustada a la zona horaria de Lima, Perú (UTC-5)
 * Esta función es útil para establecer valores por defecto en inputs de fecha
 * que deben reflejar la fecha actual en la zona horaria de Perú
 * 
 * @returns String en formato YYYY-MM-DD con la fecha actual en UTC-5
 */
export const getCurrentDateForLima = (): string => {
  try {
    // Crear fecha actual
    const now = new Date();
    
    // Ajustar a la zona horaria de Lima, Perú (UTC-5)
    // Esto crea una fecha que refleja "ahora mismo" en Lima
    const limaDate = new Date(now.getTime() - (5 * 60 * 60 * 1000));
    
    // Obtener componentes de fecha (año, mes, día) y formatear
    const year = limaDate.getUTCFullYear();
    const month = (limaDate.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = limaDate.getUTCDate().toString().padStart(2, '0');
    
    // Retornar en formato YYYY-MM-DD requerido por input[type="date"]
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error obteniendo fecha actual para Lima:', error);
    // En caso de error, devolver la fecha actual en formato ISO
    return new Date().toISOString().split('T')[0];
  }
};

/**
 * Formatea una hora de formato ISO a formato de 24 horas (HH:MM)
 * Esta función es útil para mostrar horas en la interfaz de usuario
 * de forma legible, extrayendo solo la parte de la hora
 * 
 * @param timeString - Hora a formatear (string o Date)
 * @returns String en formato HH:MM, o string vacío si la hora no es válida
 */
export const formatTime = (timeString: string | Date | null): string => {
  if (!timeString) return '';
  
  try {
    // Si es una cadena o un objeto Date, convertir a objeto Date
    const date = typeof timeString === 'string' ? new Date(timeString) : timeString;
    
    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) {
      return '';
    }
    
    // Formatear la hora en formato de 24 horas
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    
    // Devolver en formato HH:MM
    return `${hours}:${minutes}`;
  } catch (error) {
    console.error('Error formateando hora:', error);
    return '';
  }
};

/**
 * Formatea una hora de formato ISO a formato de 12 horas con AM/PM
 * Esta función muestra las horas en un formato más amigable con indicador AM/PM
 * 
 * @param timeString - Hora a formatear (string o Date)
 * @returns String en formato HH:MM AM/PM, o string vacío si la hora no es válida
 */
export const formatTimeAMPM = (timeString: string | Date | null): string => {
  if (!timeString) return '';
  
  try {
    // Si es una cadena o un objeto Date, convertir a objeto Date
    const date = typeof timeString === 'string' ? new Date(timeString) : timeString;
    
    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) {
      return '';
    }
    
    // Obtener horas y minutos
    let hours = date.getUTCHours();
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    
    // Determinar AM o PM
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    // Convertir a formato de 12 horas
    hours = hours % 12;
    // Las 12 del mediodía y medianoche se muestran como 12, no como 0
    hours = hours ? hours : 12;
    
    // Devolver en formato HH:MM AM/PM
    return `${hours}:${minutes} ${ampm}`;
  } catch (error) {
    console.error('Error formateando hora con AM/PM:', error);
    return '';
  }
};