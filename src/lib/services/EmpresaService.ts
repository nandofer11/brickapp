import { empresaRepository } from "@/lib/repositories/EmpresaRepository";
import { usuarioRepository } from "@/lib/repositories/UsuarioRepository";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

class EmpresaService {
  // Obtener todas las empresas
  async getAllEmpresas() {
    return empresaRepository.getAll();
  }

  // Obtener una empresa por ID
  async getEmpresaById(id_empresa: number) {
    return empresaRepository.getById(id_empresa);
  }

  // Crear una nueva empresa
  async createEmpresa(data: any) {
    return empresaRepository.create(data);
  }

  // Actualizar una empresa por ID
  async updateEmpresa(id_empresa: number, data: any) {
    return empresaRepository.update(id_empresa, data);
  }

  // Eliminar una empresa por ID
  async deleteEmpresa(id_empresa: number) {
    return empresaRepository.delete(id_empresa);
  }

  // Buscar empresa por RFC
  async getEmpresaByRFC(rfc: string) {
    return empresaRepository.findByRFC(rfc);
  }

  // Buscar empresa por razón social
  async getEmpresaByRazonSocial(razon_social: string) {
    return empresaRepository.findByRazonSocial(razon_social);
  }

  // Obtener estadísticas de la empresa
  async getEmpresaStats(id_empresa: number) {
    return empresaRepository.getStats(id_empresa);
  }

  // Registrar una nueva empresa con su administrador
  async registrarEmpresaConAdmin(empresaData: any, usuarioData: any) {
    try {
      console.log("========== INICIANDO REGISTRO DE EMPRESA CON ADMINISTRADOR ==========");

      // Verificamos que no exista una empresa con el mismo RUC
      console.log("Verificando si existe una empresa con el RUC:", empresaData.ruc);
      const empresaExistente = await prisma.empresa.findFirst({
        where: { ruc: empresaData.ruc }
      });
      
      if (empresaExistente) {
        console.log("Ya existe una empresa con ese RUC:", empresaExistente);
        throw new Error(`Ya existe una empresa con el RUC ${empresaData.ruc}`);
      } else {
        console.log("No existe empresa con ese RUC, continuando...");
      }

      // Validar la contraseña antes de iniciar el proceso
      if (!usuarioData.contrasena) {
        console.log("Error: Contraseña no proporcionada");
        throw new Error("La contraseña del usuario es obligatoria");
      }

      if (typeof usuarioData.contraseña !== 'string') {
        console.log("Error: La contraseña no es una cadena de texto");
        throw new Error("La contraseña debe ser una cadena de texto");
      }

      // Convertir explícitamente la contraseña a string y encriptarla
      console.log("Encriptando contraseña...");
      const contraseñaEncriptada = await hash(String(usuarioData.contrasena), 10);
      console.log("Contraseña encriptada exitosamente");

      // PASO 1: Crear la empresa directamente (sin transacción para simplificar)
      console.log("PASO 1: Creando la empresa con datos:", {
        razon_social: empresaData.razon_social,
        ruc: empresaData.ruc,
        direccion: empresaData.direccion || ''
      });
      
      const empresa = await prisma.empresa.create({
        data: {
          razon_social: empresaData.razon_social,
          ruc: empresaData.ruc,
          direccion: empresaData.direccion || ''
        }
      });
      console.log("Empresa creada exitosamente:", empresa);

      // PASO 2: Crear el rol de Administrador para esta empresa
      console.log("PASO 2: Creando rol de Administrador para la empresa");
      const rolAdmin = await prisma.rol.create({
        data: {
          id_empresa: empresa.id_empresa,
          nombre: "Administrador",
          descripcion: "Rol con acceso completo al sistema"
        }
      });
      console.log("Rol de Administrador creado exitosamente:", rolAdmin);
      
      // PASO 3: Crear el usuario administrador
      console.log("PASO 3: Creando usuario administrador con datos:", {
        nombre_completo: usuarioData.nombre_completo,
        usuario: usuarioData.usuario,
        id_empresa: empresa.id_empresa,
        id_rol: rolAdmin.id_rol
      });
      
      // Verificamos el tipo de cada campo para asegurar que sean correctos
      console.log("Verificación de tipos:", {
        "typeof nombre_completo": typeof usuarioData.nombre_completo,
        "typeof usuario": typeof usuarioData.usuario,
        "typeof contrasena encriptada": typeof contraseñaEncriptada,
        "typeof id_empresa": typeof empresa.id_empresa,
        "typeof id_rol": typeof rolAdmin.id_rol,
        "valor id_empresa": empresa.id_empresa,
        "valor id_rol": rolAdmin.id_rol
      });
      
      // Aseguramos que todos los IDs sean números
      const usuarioNuevo = {
        nombre_completo: usuarioData.nombre_completo,
        usuario: usuarioData.usuario,
        contraseña: contraseñaEncriptada,
        id_empresa: Number(empresa.id_empresa),
        id_rol: Number(rolAdmin.id_rol),
        email: usuarioData.email || null
      };
      
      console.log("Datos finales para crear usuario:", {
        ...usuarioNuevo,
        contraseña: "***ENCRIPTADA***"
      });
      
      const usuario = await prisma.usuario.create({
        data: usuarioNuevo
      });
      console.log("Usuario administrador creado exitosamente:", usuario);

      console.log("========== REGISTRO COMPLETADO EXITOSAMENTE ==========");
      
      return {
        empresa,
        usuario: {
          id_usuario: usuario.id_usuario,
          nombre_completo: usuario.nombre_completo,
          email: usuario.email || null,
          usuario: usuario.usuario,
          rol: rolAdmin.nombre
        }
      };
    } catch (error: any) {
      console.error("========== ERROR EN REGISTRO ==========");
      console.error("Error detallado:", error);
      throw new Error(`Error al registrar empresa: ${error.message}`);
    }
  }

  // Verificar si una empresa existe
  async existsEmpresa(id_empresa: number) {
    return empresaRepository.exists(id_empresa);
  }
}

export const empresaService = new EmpresaService(); 