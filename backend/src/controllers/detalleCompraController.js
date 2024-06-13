const DetalleCompra = require('../models/DetalleCompra');
const Compra = require('../models/Compra');
const Material = require('../models/Material');

exports.createDetalleCompra = async (req, res) => {
  const { Material_idMaterial, Compra_idCompra, cantidad, subtotal } = req.body;

  try {
    const newDetalleCompra = await DetalleCompra.create({
      Material_idMaterial,
      Compra_idCompra,
      cantidad,
      subtotal,
    });

    res.status(201).json(newDetalleCompra);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el detalle de la compra' });
  }
};

exports.getDetalleCompras = async (req, res) => {
  try {
    const detalleCompras = await DetalleCompra.findAll({
      include: [
        {
          model: Compra,
          attributes: ['fecha_compra', 'fecha_entrega', 'estado', 'tipoPago'],
        },
        {
          model: Material,
          attributes: ['nombre', 'descripcion', 'precioUnitario'],
        },
      ],
    });
    res.status(200).json(detalleCompras);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los detalles de las compras' });
  }
};

exports.getDetalleCompraById = async (req, res) => {
  const { id } = req.params;

  try {
    const detalleCompra = await DetalleCompra.findByPk(id, {
      include: [
        {
          model: Compra,
          attributes: ['fecha_compra', 'fecha_entrega', 'estado', 'tipoPago'],
        },
        {
          model: Material,
          attributes: ['nombre', 'descripcion', 'precioUnitario'],
        },
      ],
    });

    if (!detalleCompra) {
      return res.status(404).json({ error: 'Detalle de compra no encontrado' });
    }

    res.status(200).json(detalleCompra);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el detalle de la compra' });
  }
};

exports.updateDetalleCompra = async (req, res) => {
  const { id } = req.params;
  const { Material_idMaterial, Compra_idCompra, cantidad, subtotal } = req.body;

  try {
    const detalleCompra = await DetalleCompra.findByPk(id);

    if (!detalleCompra) {
      return res.status(404).json({ error: 'Detalle de compra no encontrado' });
    }

    detalleCompra.Material_idMaterial = Material_idMaterial;
    detalleCompra.Compra_idCompra = Compra_idCompra;
    detalleCompra.cantidad = cantidad;
    detalleCompra.subtotal = subtotal;

    await detalleCompra.save();

    res.status(200).json(detalleCompra);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el detalle de la compra' });
  }
};

exports.deleteDetalleCompra = async (req, res) => {
  const { id } = req.params;

  try {
    const detalleCompra = await DetalleCompra.findByPk(id);

    if (!detalleCompra) {
      return res.status(404).json({ error: 'Detalle de compra no encontrado' });
    }

    await detalleCompra.destroy();
    res.status(204).json();
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el detalle de la compra' });
  }
};
