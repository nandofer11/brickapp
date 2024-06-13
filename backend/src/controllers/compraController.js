const Compra = require('../models/Compra');
const DetalleCompra = require('../models/DetalleCompra');
const Material = require('../models/Material');
const Empresa = require('../models/Empresa');

exports.createCompra = async (req, res) => {
  const { Empresa_idEmpresa, fecha_compra, fecha_entrega, estado, tipoPago, detalles } = req.body;

  try {
    const newCompra = await Compra.create({
      Empresa_idEmpresa,
      fecha_compra,
      fecha_entrega,
      estado,
      tipoPago,
    });

    if (detalles && detalles.length > 0) {
      const detallesData = detalles.map((detalle) => ({
        Material_idMaterial: detalle.Material_idMaterial,
        Compra_idCompra: newCompra.idCompra,
        cantidad: detalle.cantidad,
        subtotal: detalle.cantidad * detalle.precioUnitario,
      }));

      await DetalleCompra.bulkCreate(detallesData);
    }

    res.status(201).json(newCompra);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear la compra' });
  }
};

exports.getCompras = async (req, res) => {
  try {
    const compras = await Compra.findAll({
      include: [
        {
          model: Empresa,
          attributes: ['nombreComercial'],
        },
        {
          model: DetalleCompra,
          include: {
            model: Material,
            attributes: ['nombre'],
          },
        },
      ],
    });
    res.status(200).json(compras);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener las compras' });
  }
};

exports.getCompraById = async (req, res) => {
  const { id } = req.params;

  try {
    const compra = await Compra.findByPk(id, {
      include: [
        {
          model: Empresa,
          attributes: ['nombreComercial'],
        },
        {
          model: DetalleCompra,
          include: {
            model: Material,
            attributes: ['nombre'],
          },
        },
      ],
    });

    if (!compra) {
      return res.status(404).json({ error: 'Compra no encontrada' });
    }

    res.status(200).json(compra);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener la compra' });
  }
};

exports.updateCompra = async (req, res) => {
  const { id } = req.params;
  const { Empresa_idEmpresa, fecha_compra, fecha_entrega, estado, tipoPago, detalles } = req.body;

  try {
    const compra = await Compra.findByPk(id);

    if (!compra) {
      return res.status(404).json({ error: 'Compra no encontrada' });
    }

    compra.Empresa_idEmpresa = Empresa_idEmpresa;
    compra.fecha_compra = fecha_compra;
    compra.fecha_entrega = fecha_entrega;
    compra.estado = estado;
    compra.tipoPago = tipoPago;

    await compra.save();

    if (detalles && detalles.length > 0) {
      await DetalleCompra.destroy({ where: { Compra_idCompra: id } });

      const detallesData = detalles.map((detalle) => ({
        Material_idMaterial: detalle.Material_idMaterial,
        Compra_idCompra: id,
        cantidad: detalle.cantidad,
        subtotal: detalle.cantidad * detalle.precioUnitario,
      }));

      await DetalleCompra.bulkCreate(detallesData);
    }

    res.status(200).json(compra);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar la compra' });
  }
};

exports.deleteCompra = async (req, res) => {
  const { id } = req.params;

  try {
    const compra = await Compra.findByPk(id);

    if (!compra) {
      return res.status(404).json({ error: 'Compra no encontrada' });
    }

    await DetalleCompra.destroy({ where: { Compra_idCompra: id } });
    await compra.destroy();
    res.status(204).json();
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar la compra' });
  }
};
