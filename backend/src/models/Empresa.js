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
    type: DataTypes.STRING,
    allowNull: false
  },
  direccion: {
    type: DataTypes.STRING,
    allowNull: false
  },
  distrito: {
    type: DataTypes.STRING,
    allowNull: false
  },
  provincia: {
    type: DataTypes.STRING,
    allowNull: false
  },
  departamento: {
    type: DataTypes.STRING,
    allowNull: false
  },
  telefono: {
    type: DataTypes.STRING,
    allowNull: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true
  },
  web: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'Empresa',
  timestamps: false
});

module.exports = Empresa;