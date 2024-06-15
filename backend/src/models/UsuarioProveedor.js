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
  nombre_completo: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  usuario: {
    type: DataTypes.STRING(45),
    allowNull: false,
    unique: true
  },
  contraseña: {
    type: DataTypes.STRING(100),
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
  tableName: 'UsuarioProveedor',
//   timestamps: false
});

module.exports = UsuarioProveedor;
