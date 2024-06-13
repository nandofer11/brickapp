const { DataTypes } = require('sequelize');
const {sequelize} = require('../config/db');
const Empresa = require('./Empresa');

const Compra = sequelize.define('Compra', {
  idCompra: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  Empresa_idEmpresa: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Empresa,
      key: 'idEmpresa',
    },
  },
  fecha_compra: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  fecha_entrega: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  estado: {
    type: DataTypes.STRING(45),
    allowNull: false,
  },
  tipoPago: {
    type: DataTypes.STRING(45),
    allowNull: false,
  },
});


module.exports = Compra;
