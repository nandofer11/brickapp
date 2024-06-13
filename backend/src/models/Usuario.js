const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Usuario = sequelize.define('Usuario', {
  idUsuario: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nombreCompleto: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  usuario: {
    type: DataTypes.STRING(45),
    allowNull: false,
  },
  contraseña: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  tipoUsuario: {
    type: DataTypes.STRING(45),
    allowNull: false,
  },
}, {
  tableName: 'Usuario'
});


module.exports = Usuario;
