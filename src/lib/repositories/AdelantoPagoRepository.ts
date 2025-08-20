import { BaseRepository } from "./BaseRepository";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export class AdelantoPagoRepository extends BaseRepository {
  constructor() {
    super(prisma.adelanto_pago, "id_adelanto_pago");
  }

  async findAllByEmpresa(id_empresa: number) {
    return prisma.adelanto_pago.findMany({
      where: {
        personal: { id_empresa },
      },
      include: {
        personal: true,
        semana_laboral: true,
      },
      orderBy: {
        fecha: "desc",
      },
    });
  }

  async findById(id_adelanto_pago: number) {
    return prisma.adelanto_pago.findUnique({
      where: { id_adelanto_pago },
      include: {
        personal: true,
        semana_laboral: true,
      },
    });
  }

  async createAdelanto(data: Prisma.adelanto_pagoCreateInput) {
    return prisma.adelanto_pago.create({ data });
  }

  async updateAdelanto(id: number, data: Prisma.adelanto_pagoUpdateInput) {
    return prisma.adelanto_pago.update({
      where: { id_adelanto_pago: id },
      data,
    });
  }

  async deleteAdelanto(id: number) {
    return prisma.adelanto_pago.delete({
      where: { id_adelanto_pago: id },
    });
  }

  async findByPersonalAndFecha(id_personal: number, fechaInicio: Date, fechaFin: Date, estado?: string) {
    const whereClause: any = {
      id_personal,
      fecha: {
        gte: fechaInicio,
        lte: fechaFin,
      },
    };

    if (estado) {
      whereClause.estado = estado;
    }

    return prisma.adelanto_pago.findMany({
      where: whereClause,
      include: {
        personal: true,
        semana_laboral: true,
      },
      orderBy: {
        fecha: "desc",
      },
    });
  }

  async addDetalle(id_adelanto_pago: number, data: Prisma.adelanto_pago_detalleCreateInput) {
    // Ya no eliminamos semana_laboral porque es un campo requerido
    return prisma.adelanto_pago_detalle.create({
      data: {
        ...data,
        adelanto_pago: {
          connect: { id_adelanto_pago }
        }
      },
    });
  }

  async getDetalles(id_adelanto_pago: number) {
    return prisma.adelanto_pago_detalle.findMany({
      where: { id_adelanto_pago },
      orderBy: { fecha: "asc" },
    });
  }

  async getSaldo(id_adelanto_pago: number) {
    const adelanto = await prisma.adelanto_pago.findUnique({
      where: { id_adelanto_pago },
      include: { adelanto_pago_detalle: true },
    });

    if (!adelanto) return null;

    const totalPagado = adelanto.adelanto_pago_detalle.reduce(
      (acc, d) => acc + Number(d.monto_pagado),
      0
    );

    return {
      monto: adelanto.monto,
      pagado: totalPagado,
      saldo: Number(adelanto.monto) - totalPagado,
    };
  }




}
