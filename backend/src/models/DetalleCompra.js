const { DataTypes } = require('sequelize');
const {sequelize} = require('../config/db');
const Compra = require('./Compra');
const Material = require('./Material');

const DetalleCompra = sequelize.define('DetalleCompra', {
  idDetalleCompra: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  Material_idMaterial: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Material,
      key: 'idMaterial',
    },
  },
  Compra_idCompra: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Compra,
      key: 'idCompra',
    },
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  subtotal: {
    type: DataTypes.DECIMAL(7, 2),
    allowNull: false,
  },
});


module.exports = DetalleCompra;
