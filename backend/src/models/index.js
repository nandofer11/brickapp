// index.js
const { Sequelize} = require('sequelize');
const sequelize = require('../config/db').sequelize;

// Importar modelos
const Empresa = require("../models/Empresa.js");
const Proveedor = require("../models/Proveedor.js");
const Rol = require("../models/Rol");
const Usuario = require("../models/Usuario.js");
const Material = require("../models/Material.js");
const OrdenCompra = require("../models/OrdenCompra.js");
const OrdenCompraMaterial = require("../models/OrdenCompraMaterial");
const UsuarioProveedor = require('../models/UsuarioProveedor.js');

const db = {
  sequelize,
  Sequelize,
  Usuario,
  Rol,
  Proveedor,
  Empresa,
  Material,
  OrdenCompra,
  OrdenCompraMaterial,
  UsuarioProveedor
};

// Definir asociaciones
Empresa.hasMany(Usuario, { foreignKey: 'Empresa_id_empresa' });
Usuario.belongsTo(Empresa, { foreignKey: 'Empresa_id_empresa' });

Rol.hasMany(Usuario, { foreignKey: 'Rol_id_rol' });
Usuario.belongsTo(Rol, { foreignKey: 'Rol_id_rol' });

Proveedor.hasMany(Material, { foreignKey: 'Proveedor_id_proveedor' });
Material.belongsTo(Proveedor, { foreignKey: 'Proveedor_id_proveedor' });

Empresa.hasMany(OrdenCompra, { foreignKey: 'Empresa_id_empresa' });
OrdenCompra.belongsTo(Empresa, { foreignKey: 'Empresa_id_empresa' });

Proveedor.hasMany(OrdenCompra, { foreignKey: 'Proveedor_id_proveedor' });
OrdenCompra.belongsTo(Proveedor, { foreignKey: 'Proveedor_id_proveedor' });

OrdenCompra.hasMany(OrdenCompraMaterial, { foreignKey: 'Orden_Compra_id_orden_compra' });
OrdenCompraMaterial.belongsTo(OrdenCompra, { foreignKey: 'Orden_Compra_id_orden_compra' });

Material.hasMany(OrdenCompraMaterial, { foreignKey: 'Material_id_material' });
OrdenCompraMaterial.belongsTo(Material, { foreignKey: 'Material_id_material' });

Proveedor.hasMany(UsuarioProveedor, { foreignKey: 'Proveedor_id_proveedor' });
UsuarioProveedor.belongsTo(Proveedor, { foreignKey: 'Proveedor_id_proveedor' });

// Aplicar las asociaciones
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db;