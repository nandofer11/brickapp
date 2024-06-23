// models/usuario.model.js
const { DataTypes } = require('sequelize');
const {sequelize} = require('../config/db');
const Empresa = require('../models/Empresa.js');
const Rol = require('../models/Rol.js');

const Usuario = sequelize.define('Usuario', {
  id_usuario: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  nombre_completo: {
    type: DataTypes.STRING,
    allowNull: false
  },
  usuario: {
    type: DataTypes.STRING,
    allowNull: false
  },
  contraseña: {
    type: DataTypes.STRING,
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
  Rol_id_rol: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Rol,
      key: 'id_rol'
    }
  }
}, {
  tableName: 'Usuario',
  timestamps: false
});

// Usuario.belongsTo(Empresa, { foreignKey: 'Empresa_id_empresa' });
// Usuario.belongsTo(Rol, { foreignKey: 'Rol_id_rol' });

module.exports = Usuario;