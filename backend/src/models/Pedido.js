// models/orden_compra.model.js
const { DataTypes } = require('sequelize');
const {sequelize} = require('../config/db.js');
const Proveedor = require('./Proveedor.js');
const Usuario = require('./Usuario.js');

const Pedido = sequelize.define('Pedido', {
  id_pedido: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  fecha_pedido: {
    type: DataTypes.DATE,
    allowNull: false
  },
  fecha_entrega: {
    type: DataTypes.DATE,
    allowNull: false
  },
  forma_pago: {
    type: DataTypes.STRING,
    allowNull: false
  },
  estado: {
    type: DataTypes.STRING,
    allowNull: false
  },
  Usuario_id_usuario: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Usuario,
      key: 'id_usuario'
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
  tableName: 'Pedido',
  timestamps: false
});

// Pedido.belongsTo(Usuario, { foreignKey: 'Usuario_id_usuario' });
// Pedido.belongsTo(Proveedor, { foreignKey: 'Proveedor_id_proveedor' });

module.exports = Pedido;