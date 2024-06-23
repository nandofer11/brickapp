// index.js
const { Sequelize} = require('sequelize');
const sequelize = require('../config/db').sequelize;

// Importar modelos
const Empresa = require("../models/Empresa.js");
const Proveedor = require("../models/Proveedor.js");
const Rol = require("../models/Rol");
const Usuario = require("../models/Usuario.js");
const Material = require("../models/Material.js");
const Pedido = require("../models/Pedido.js");
const DetallePedido = require("../models/DetallePedido.js");
const UsuarioProveedor = require('../models/UsuarioProveedor.js');

const db = {
  sequelize,
  Sequelize,
  Usuario,
  Rol,
  Proveedor,
  Empresa,
  Material,
  Pedido,
  DetallePedido,
  UsuarioProveedor
};

// Definir relaciones
Empresa.hasMany(Usuario, { foreignKey: 'Empresa_id_empresa' });
Usuario.belongsTo(Empresa, { foreignKey: 'Empresa_id_empresa' });

Rol.hasMany(Usuario, { foreignKey: 'Rol_id_rol' });
Usuario.belongsTo(Rol, { foreignKey: 'Rol_id_rol' });

Proveedor.hasMany(Material, { foreignKey: 'Proveedor_id_proveedor' });
Material.belongsTo(Proveedor, { foreignKey: 'Proveedor_id_proveedor' });

Usuario.hasMany(Pedido, { foreignKey: 'Usuario_id_usuario' });
Pedido.belongsTo(Usuario, { foreignKey: 'Usuario_id_usuario' });

Proveedor.hasMany(Pedido, { foreignKey: 'Proveedor_id_proveedor' });
Pedido.belongsTo(Proveedor, { foreignKey: 'Proveedor_id_proveedor' });

Pedido.hasMany(DetallePedido, { foreignKey: 'Pedido_id_pedido' });
DetallePedido.belongsTo(Pedido, { foreignKey: 'Pedido_id_pedido' });

Material.hasMany(DetallePedido, { foreignKey: 'Material_id_material' });
DetallePedido.belongsTo(Material, { foreignKey: 'Material_id_material' });

Proveedor.hasMany(UsuarioProveedor, { foreignKey: 'Proveedor_id_proveedor' });
UsuarioProveedor.belongsTo(Proveedor, { foreignKey: 'Proveedor_id_proveedor' });

// Aplicar las asociaciones
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db;