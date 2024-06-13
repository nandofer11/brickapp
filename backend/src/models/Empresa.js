const { DataTypes } = require('sequelize');
const {sequelize} = require('../config/db');

const Empresa = sequelize.define('Empresa', {
  idEmpresa: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  ruc: {
    type: DataTypes.STRING(11),
    allowNull: false,
  },
  nombreComercial: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  direccion: {
    type: DataTypes.STRING(80),
    allowNull: false,
  },
  telefono: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
  web: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
},{
  tableName: 'Empresa'
});


module.exports = Empresa;
