const Material = require('../models/Material');
const Proveedor = require('../models/Proveedor');

exports.createMaterial = async (req, res) => {
  const { Proveedor_idProveedor, nombre, descripcion, peso, precioUnitario } = req.body;

  try {
    const newMaterial = await Material.create({
      Proveedor_idProveedor,
      nombre,
      descripcion,
      peso,
      precioUnitario,
    });

    res.status(201).json(newMaterial);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el material' });
  }
};

exports.getMaterials = async (req, res) => {
  try {
    const materiales = await Material.findAll();
    res.status(200).json(materiales);
  } catch (error) {
    console.error('Error al obtener los materiales: ', error)
    res.status(500).json({ error: 'Error al obtener los materiales'});
  }
};

exports.getMaterialById = async (req, res) => {
  const { id } = req.params;

  try {
    const material = await Material.findByPk(id, {
      include: {
        model: Proveedor,
        attributes: ['razonSocial']
      }
    });

    if (!material) {
      return res.status(404).json({ error: 'Material no encontrado' });
    }

    res.status(200).json(material);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el material' });
  }
};

exports.updateMaterial = async (req, res) => {
  const { id } = req.params;
  const { Proveedor_idProveedor, nombre, descripcion, peso, precioUnitario } = req.body;

  try {
    const material = await Material.findByPk(id);

    if (!material) {
      return res.status(404).json({ error: 'Material no encontrado' });
    }

    material.Proveedor_idProveedor = Proveedor_idProveedor;
    material.nombre = nombre;
    material.descripcion = descripcion;
    material.peso = peso;
    material.precioUnitario = precioUnitario;

    await material.save();

    res.status(200).json(material);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el material' });
  }
};

exports.deleteMaterial = async (req, res) => {
  const { id } = req.params;

  try {
    const material = await Material.findByPk(id);

    if (!material) {
      return res.status(404).json({ error: 'Material no encontrado' });
    }

    await material.destroy();
    res.status(204).json();
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el material' });
  }
};
