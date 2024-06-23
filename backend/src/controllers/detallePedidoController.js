const { DetallePedido } = require('../models');

exports.create = async (req, res) => {
  try {
    const detallePedido = await DetallePedido.create(req.body);
    res.status(201).json(detallePedido);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el detalle del pedido' });
  }
};

exports.findAll = async (req, res) => {
  try {
    const detallesPedido = await DetallePedido.findAll();
    res.status(200).json(detallesPedido);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los detalles del pedido' });
  }
};

exports.findOne = async (req, res) => {
  try {
    const detallePedido = await DetallePedido.findByPk(req.params.id);
    if (detallePedido) {
      res.status(200).json(detallePedido);
    } else {
      res.status(404).json({ error: 'Detalle del pedido no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el detalle del pedido' });
  }
};

exports.update = async (req, res) => {
  try {
    const [rowsUpdated] = await DetallePedido.update(req.body, { where: { id_detalle_pedido: req.params.id } });
    if (rowsUpdated) {
      const updatedDetallePedido = await DetallePedido.findByPk(req.params.id);
      res.status(200).json(updatedDetallePedido);
    } else {
      res.status(404).json({ error: 'Detalle del pedido no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el detalle del pedido' });
  }
};

exports.delete = async (req, res) => {
  try {
    const rowsDeleted = await DetallePedido.destroy({ where: { id_detalle_pedido: req.params.id } });
    if (rowsDeleted) {
      res.status(200).json({ message: 'Detalle del pedido eliminado exitosamente' });
    } else {
      res.status(404).json({ error: 'Detalle del pedido no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el detalle del pedido' });
  }
};
