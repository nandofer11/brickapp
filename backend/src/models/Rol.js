// models/rol.model.js
const { DataTypes } = require('sequelize');
const {sequelize} = require('../config/db');

const Rol = sequelize.define('Rol', {
  id_rol: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  descripcion: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'Rol',
  timestamps: false
});

module.exports = Rol;
