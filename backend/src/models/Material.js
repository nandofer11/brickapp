const { DataTypes } = require('sequelize');
const {sequelize} = require('../config/db');
const Proveedor = require('./Proveedor');

const Material = sequelize.define('Material', {
  idMaterial: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  Proveedor_idProveedor: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Proveedor,
      key: 'idProveedor'
    }
  },
  nombre: {
    type: DataTypes.STRING(45),
    allowNull: false,
  },
  descripcion: {
    type: DataTypes.STRING(250),
    allowNull: true,
  },
  peso: {
    type: DataTypes.DECIMAL(5,2),
    allowNull: false,
  },
  precioUnitario: {
    type: DataTypes.DECIMAL(5,2),
    allowNull: false,
  },
},{
  tableName:'Material'
});


module.exports = Material;
