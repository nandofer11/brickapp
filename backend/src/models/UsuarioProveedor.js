// models/usuario_proveedor.model.js
const { DataTypes } = require('sequelize');
const {sequelize} = require('../config/db');
const Proveedor = require('../models/Proveedor');

const UsuarioProveedor = sequelize.define('UsuarioProveedor', {
  id_usuario_proveedor: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  usuario: {
    type: DataTypes.STRING,
    allowNull: false
  },
  contraseña: {
    type: DataTypes.STRING,
    allowNull: false
  },
  Proveedor_id_proveedor: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Proveedor,
      key: 'id_proveedor'
    }
  }
}, {
  tableName: 'Usuario_Proveedor',
  timestamps: false
});

// UsuarioProveedor.belongsTo(Proveedor, { foreignKey: 'Proveedor_id_proveedor' });

module.exports = UsuarioProveedor;
