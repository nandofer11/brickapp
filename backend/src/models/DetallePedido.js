// models/orden_compra_material.model.js
const { DataTypes } = require('sequelize');
const {sequelize} = require('../config/db.js');
const Pedido= require('./Pedido.js');
const Material = require('./Material.js');

const DetallePedido = sequelize.define('DetallePedido', {
  id_detalle_pedido: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  subtotal: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  Pedido_id_pedido: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Pedido,
      key: 'id_pedido'
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
  tableName: 'Detalle_Pedido',
  timestamps: false
});

// DetallePedido.belongsTo(Pedido, { foreignKey: 'Pedido_id_pedido' });
// DetallePedido.belongsTo(Material, { foreignKey: 'Material_id_material' });

module.exports = DetallePedido;