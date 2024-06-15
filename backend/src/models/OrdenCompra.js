// models/orden_compra.model.js
const { DataTypes } = require('sequelize');
const {sequelize} = require('../config/db');
const Empresa = require('../models/Empresa.js');
const Proveedor = require('../models/Proveedor.js');

const OrdenCompra = sequelize.define('OrdenCompra', {
  id_orden_compra: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  fecha_compra: {
    type: DataTypes.DATE,
    allowNull: false
  },
  fecha_entrega: {
    type: DataTypes.DATE,
    allowNull: false
  },
  estado: {
    type: DataTypes.STRING(45),
    allowNull: false
  },
  forma_pago: {
    type: DataTypes.STRING(45),
    allowNull: false
  },
  Empresa_id_empresa: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Empresa,
      key: 'id_empresa'
    }
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
  tableName: 'Orden_Compra',
  timestamps: false
});

module.exports = OrdenCompra;
