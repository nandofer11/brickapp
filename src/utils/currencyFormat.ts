/**
 * Formatea un número como moneda en Soles (PEN) con formato peruano
 * Ejemplo: S/ 10,500.00
 * - Símbolo de moneda: S/
 * - Separador de miles: coma (,)
 * - Separador decimal: punto (.)
 * - Decimales: 2 por defecto
 * 
 * @param amount - Monto a formatear
 * @param decimals - Número de decimales (por defecto 2)
 * @returns String con el monto formateado
 */
export const formatSoles = (amount: number | string, decimals: number = 2): string => {
  try {
    // Convertir a número si es string
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    // Verificar si es un número válido
    if (isNaN(numericAmount)) {
      return 'S/ 0.00';
    }
    
    // Formatear con separador de miles (,) y decimales (.)
    const formattedAmount = numericAmount.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
    
    // Agregar símbolo de moneda peruana
    return `S/ ${formattedAmount}`;
  } catch (error) {
    console.error('Error formateando moneda:', error);
    return 'S/ 0.00';
  }
};
