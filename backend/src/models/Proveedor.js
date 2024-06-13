const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Proveedor = sequelize.define('Proveedor', {
  idProveedor: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  ruc: {
    type: DataTypes.STRING(11),
    allowNull: false,
  },
  razonSocial: {
    type: DataTypes.STRING(45),
    allowNull: false,
  },
  direccion: {
    type: DataTypes.STRING(80),
    allowNull: false,
  },
  distrito: {
    type: DataTypes.STRING(45),
    allowNull: false,
  },
  provincia: {
    type: DataTypes.STRING(45),
    allowNull: false,
  },
  departamento: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
}, {
  tableName: 'Proveedor'
});


module.exports = Proveedor;
