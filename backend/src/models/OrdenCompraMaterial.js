// models/orden_compra_material.model.js
const { DataTypes } = require('sequelize');
const {sequelize} = require('../config/db');
const OrdenCompra = require('./OrdenCompra.js');
const Material = require('./Material.js');

const OrdenCompraMaterial = sequelize.define('OrdenCompraMaterial', {
  id_orden_compra_material: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  subtotal: {
    type: DataTypes.DECIMAL(7, 2),
    allowNull: false
  },
  Orden_Compra_id_orden_compra: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: OrdenCompra,
      key: 'id_orden_compra'
    }
  },
  Material_id_material: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Material,
      key: 'id_material'
    }
  }
}, {
  tableName: 'Orden_Compra_Material',
  timestamps: false
});

module.exports = OrdenCompraMaterial;
