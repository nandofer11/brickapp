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

/**
 * Convierte una hora en formato HH:MM (24 horas) a formato de input de tiempo con AM/PM
 * Esta función es útil para rellenar inputs de tiempo con formato de 12 horas
 * 
 * @param timeString - Hora en formato HH:MM (24 horas)
 * @returns String en formato HH:MM para input de tiempo, o string vacío si no es válida
 */
export const formatTimeForInput = (timeString: string | null): string => {
  if (!timeString) return '';
  
  try {
    // Si es una hora en formato HH:MM, crearla como Date
    const [hours, minutes] = timeString.split(':');
    if (!hours || !minutes) return '';
    
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    date.setSeconds(0);
    
    // Formatear para input de tiempo (HH:MM en 24 horas)
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
  } catch (error) {
    console.error('Error formateando hora para input:', error);
    return '';
  }
};

/**
 * Convierte una hora en formato 12 horas (HH:MM AM/PM) a formato 24 horas (HH:MM)
 * 
 * @param time12h - Hora en formato 12 horas (ej: "8:30 AM")
 * @returns String en formato HH:MM (24 horas)
 */
export const convertTo24Hour = (time12h: string): string => {
  if (!time12h) return '';
  
  try {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    
    if (hours === '12') {
      hours = '00';
    }
    
    if (modifier === 'PM') {
      hours = (parseInt(hours, 10) + 12).toString();
    }
    
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
  } catch (error) {
    console.error('Error convirtiendo hora a formato 24h:', error);
    return '';
  }
};

/**
 * Convierte una hora en formato 24 horas (HH:MM) a formato 12 horas (HH:MM AM/PM)
 * 
 * @param time24h - Hora en formato 24 horas (ej: "20:30")
 * @returns String en formato HH:MM AM/PM
 */
export const convertTo12Hour = (time24h: string): string => {
  if (!time24h) return '';
  
  try {
    // Manejar diferentes formatos que pueden venir de la BD
    let timeStr = time24h;
    
    // Si viene con segundos, removerlos (ej: "14:30:00" -> "14:30")
    if (timeStr.includes(':') && timeStr.split(':').length === 3) {
      const parts = timeStr.split(':');
      timeStr = `${parts[0]}:${parts[1]}`;
    }
    
    // Si viene como Date string, extraer solo la parte de tiempo
    if (timeStr.includes('T')) {
      const dateObj = new Date(timeStr);
      timeStr = dateObj.toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    }
    
    const [hours, minutes] = timeStr.split(':');
    if (!hours || !minutes) return '';
    
    const hour24 = parseInt(hours, 10);
    
    if (isNaN(hour24) || hour24 < 0 || hour24 > 23) return '';
    
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    const hour12 = hour24 % 12 || 12;
    
    return `${hour12}:${minutes} ${ampm}`;
  } catch (error) {
    console.error('Error convirtiendo hora a formato 12h:', error);
    return '';
  }
};

/**
 * Convierte una hora en formato HH:MM a DateTime para Prisma
 * Esta función es específica para campos TIME en MySQL usando Prisma
 * 
 * @param timeValue - Hora en formato HH:MM o Date string
 * @returns Date object compatible con Prisma para campos TIME, o null si no es válida
 */
export const formatTimeForPrisma = (timeValue: string | null | undefined): Date | null => {
  if (!timeValue || timeValue.trim() === '') return null;
  
  try {
    let cleanTime = timeValue.trim();
    
    // Si viene como Date string, extraer solo HH:MM
    if (timeValue.includes('T') || timeValue.includes('Z')) {
      const date = new Date(timeValue);
      cleanTime = date.toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    }
    
    // Validar formato HH:MM
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(cleanTime)) {
      console.warn(`Formato de hora inválido: ${timeValue}`);
      return null;
    }
    
    // Crear un DateTime con fecha base y la hora especificada
    // Usamos 1970-01-01 como fecha base para campos TIME en MySQL
    const [hours, minutes] = cleanTime.split(':');
    const dateTime = new Date('1970-01-01T00:00:00.000Z');
    dateTime.setUTCHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    
    return dateTime;
  } catch (error) {
    console.error('Error formateando hora para Prisma:', error);
    return null;
  }
};

/**
 * Valida si una hora está en formato correcto HH:MM
 * 
 * @param timeValue - Hora a validar
 * @returns boolean - true si la hora es válida
 */
export const isValidTimeFormat = (timeValue: string | null | undefined): boolean => {
  if (!timeValue || timeValue.trim() === '') return false;
  
  try {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(timeValue.trim());
  } catch (error) {
    return false;
  }
};