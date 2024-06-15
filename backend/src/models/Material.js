// models/material.model.js
const { DataTypes } = require('sequelize');
const {sequelize} = require('../config/db');
const Proveedor = require('../models/Proveedor');

const Material = sequelize.define('Material', {
  id_material: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  nombre: {
    type: DataTypes.STRING(45),
    allowNull: false
  },
  descripcion: {
    type: DataTypes.STRING(250),
    allowNull: true
  },
  peso: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false
  },
  precio_unitario: {
    type: DataTypes.DECIMAL(5, 2),
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
  tableName: 'Material',
  timestamps: false
});

module.exports = Material;
