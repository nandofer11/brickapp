import { BaseRepository } from "./BaseRepository";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export class PagoPersonalSemanaRepository extends BaseRepository {
  constructor() {
    super(prisma.pago_personal_semana, "id_pago_personal_semana");
  }

  async findAllByEmpresa(id_empresa: number) {
    return prisma.pago_personal_semana.findMany({
      where: {
        personal: {
          id_empresa,
        },
      },
      include: {
        personal: true,
        semana_laboral: true,
      },
      orderBy: {
        id_pago_personal_semana: "asc",
      },
    });
  }

  async findById(id: number) {
    return prisma.pago_personal_semana.findUnique({
      where: {
        id_pago_personal_semana: id,
      },
      include: {
        personal: true,
        semana_laboral: true,
      },
    });
  }

  async findMany(args: Prisma.pago_personal_semanaFindManyArgs) {
    return prisma.pago_personal_semana.findMany(args);
  }

  // Método para crear pago a personal externo
  async createPagoPersonalExterno(data: any) {
    try {
      // Preparar datos para personal externo
      const createData = {
        // Relación con semana laboral
        semana_laboral: {
          connect: { id_semana_laboral: Number(data.id_semana_laboral) },
        },
        // Marcar como personal externo
        es_personal_externo: true,
        // Guardar el nombre del personal externo
        nombre_personal_externo: data.nombre_personal_externo,
        // id_personal queda NULL por defecto
        
        // Datos financieros
        fecha_pago: data.fecha_pago ? new Date(data.fecha_pago) : new Date(),
        total_asistencia_pago: 0, // No tiene asistencia tradicional
        total_tareas_extra: 0, // No tiene tareas extra
        total_coccion: Number(data.total_coccion || 0), // Solo pago por cocción
        total_adelantos: 0, // No tiene adelantos
        total_descuentos: 0, // No tiene descuentos
        total_pago_final: Number(data.total_coccion || 0), // El total es igual al pago por cocción
        dias_completos: 0, // No tiene días completos
        medio_dias: 0, // No tiene medios días
        costo_pago_diario: null, // No tiene pago diario
        forma_pago: data.forma_pago || "EFECTIVO",
        estado: data.estado || "Pagado",
        created_at: new Date(),
        updated_at: new Date(),
      };

      console.log("Datos para crear pago a personal externo:", JSON.stringify(createData, null, 2));

      return prisma.pago_personal_semana.create({
        data: createData,
        include: {
          semana_laboral: true,
        },
      });
    } catch (error) {
      console.error("Error al crear pago a personal externo:", error);
      throw error;
    }
  }

  // Corregir para usar el método createPagoPersonalSemana (que es el correcto)
  async create(data: any) {
    return this.createPagoPersonalSemana(data);
  }

  async createPagoPersonalSemana(data: any) {
    try {
      // Verificar si es personal externo
      const esPersonalExterno = data.es_personal_externo === true || data.es_personal_externo === 1;
      
      // Preparar objeto base con campos comunes
      let createData: any = {
        semana_laboral: {
          connect: { id_semana_laboral: Number(data.id_semana_laboral) },
        },
        fecha_pago: data.fecha_pago ? new Date(data.fecha_pago) : new Date(),
        total_asistencia_pago: Number(data.total_asistencia_pago || data.total_asistencia || 0),
        total_tareas_extra: Number(data.total_tareas_extra || 0),
        total_coccion: Number(data.total_coccion || 0),
        total_adelantos: Number(data.total_adelantos || 0),
        total_descuentos: Number(data.total_descuentos || 0),
        total_pago_final: Number(data.total_pago_final || data.total_final || 0),
        dias_completos: Number(data.dias_completos || 0),
        medio_dias: Number(data.medio_dias || 0),
        costo_pago_diario: data.costo_pago_diario ? Number(data.costo_pago_diario) : null,
        forma_pago: data.forma_pago || "EFECTIVO",
        estado: data.estado || "Pagado",
        es_personal_externo: esPersonalExterno,
        created_at: new Date(),
        updated_at: new Date(),
      };
      
      // Agregar campos específicos según el tipo de personal
      if (esPersonalExterno) {
        // Para personal externo
        createData.nombre_personal_externo = data.nombre_personal_externo;
        // En este caso, id_personal es NULL (ya modificado en la base de datos)
        createData.personal = undefined; // Explicitamente undefined para cumplir con el tipo de Prisma
      } else {
        // Para personal interno
        createData.personal = {
          connect: { id_personal: Number(data.id_personal) },
        };
      }

      console.log("Datos para crear pago:", JSON.stringify(createData, null, 2));

      return prisma.pago_personal_semana.create({
        data: createData,
        include: {
          personal: !esPersonalExterno, // Solo incluir personal para pagos a personal interno
          semana_laboral: true,
        },
      });
    } catch (error) {
      console.error("Error al crear pago personal semana:", error);
      throw error;
    }
  }

  async updatePagoPersonalSemana(id: number, data: Prisma.pago_personal_semanaUpdateInput) {
    return prisma.pago_personal_semana.update({
      where: { id_pago_personal_semana: id },
      data,
    });
  }

  async delete(id: number) {
    return prisma.pago_personal_semana.delete({
      where: { id_pago_personal_semana: id },
    });
  }
}
