const { Sequelize} = require('sequelize');
const sequelize = require('../config/db').sequelize;

const Usuario = require('./Usuario.js');
const Proveedor = require('./Proveedor');
const Empresa = require('./Empresa');
const Material = require('./Material');
const Compra = require('./Compra');
const DetalleCompra = require('./DetalleCompra');

const db = {
  sequelize,
  Sequelize,
  Usuario,
  Proveedor,
  Empresa,
  Material,
  Compra,
  DetalleCompra,
};

//Definiendo relaciones
Proveedor.belongsTo(Usuario, { foreignKey: 'UsuarioId' });
Usuario.hasMany(Proveedor, { foreignKey: 'UsuarioId' });

Empresa.belongsTo(Usuario, { foreignKey: 'UsuarioId' });
Usuario.hasMany(Empresa, { foreignKey: 'UsuarioId' });

// Aplicar las asociaciones
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db;
