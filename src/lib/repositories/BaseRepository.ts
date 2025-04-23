import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export class BaseRepository {
  model: any;
  idField: string;

  constructor(model: any, idField: string = "id") {
    this.model = model;
    this.idField = idField;
  }

  async findAllByEmpresa(id_empresa: number) {
    return this.model.findMany({ where: { id_empresa } });
  }

  async findById(id: number, id_empresa: number) {
    return this.model.findFirst({ where: { [this.idField]: id, id_empresa } });
  }

  async create(data: any) {
    return this.model.create({ data });
  }

  async update(id: number, id_empresa: number, data: any) {
    return this.model.updateMany({
      where: { [this.idField]: id, id_empresa },
      data,
    });
  }

  async delete(id: number, id_empresa: number) {
    return this.model.deleteMany({
      where: { [this.idField]: id, id_empresa },
    });
  }
}
