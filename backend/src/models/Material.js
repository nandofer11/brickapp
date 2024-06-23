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
    type: DataTypes.STRING,
    allowNull: false
  },
  descripcion: {
    type: DataTypes.STRING,
    allowNull: true
  },
  peso: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  precio_unitario: {
    type: DataTypes.FLOAT,
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

// Material.belongsTo(Proveedor, { foreignKey: 'Proveedor_id_proveedor' });

module.exports = Material;