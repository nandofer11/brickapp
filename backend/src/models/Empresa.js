// models/empresa.model.js
const { DataTypes } = require('sequelize');
const {sequelize} = require('../config/db');

const Empresa = sequelize.define('Empresa', {
  id_empresa: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  ruc: {
    type: DataTypes.STRING(11),
    allowNull: false
  },
  nombre_comercial: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  direccion: {
    type: DataTypes.STRING(80),
    allowNull: false
  },
  telefono: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  web: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  distrito: {
    type: DataTypes.STRING(45),
    allowNull: false
  },
  provincia: {
    type: DataTypes.STRING(45),
    allowNull: false
  },
  departamento: {
    type: DataTypes.STRING(45),
    allowNull: false
  }
}, {
  tableName: 'Empresa',
  // timestamps: false
});

module.exports = Empresa;
