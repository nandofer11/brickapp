const { Proveedor, Usuario } = require('../models');

// Crear un nuevo proveedor
const createProveedor = async (req, res) => {
  try {
    const { ruc, razonSocial, direccion, distrito, provincia, departamento, UsuarioId } = req.body;

    // Verificar si el usuario existe
    const usuario = await Usuario.findByPk(UsuarioId);

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
      }

    // Crear el proveedor
    const proveedor = await Proveedor.create({
      ruc,
      razonSocial,
      direccion,
      distrito,
      provincia,
      departamento,
      UsuarioId
    });

    res.status(201).json(proveedor);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear el proveedor', error });
    console.log(error.message)
  }
};

// Obtener un proveedor por ID
const getProveedorById = async (req, res) => {
  try {
    const { id } = req.params;
    const proveedor = await Proveedor.findByPk(id, {
      include: Usuario
    });

    if (!proveedor) {
      return res.status(404).json({ message: 'Proveedor no encontrado' });
    }

    res.status(200).json(proveedor);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el proveedor', error });
  }
};

// Actualizar un proveedor por ID
const updateProveedor = async (req, res) => {
  try {
    const { id } = req.params;
    const { ruc, razonSocial, direccion, distrito, provincia, departamento, UsuarioId } = req.body;

    // Verificar si el usuario existe
    const usuario = await Usuario.findByPk(UsuarioId);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const proveedor = await Proveedor.findByPk(id);

    if (!proveedor) {
      return res.status(404).json({ message: 'Proveedor no encontrado' });
    }

    proveedor.ruc = ruc;
    proveedor.razonSocial = razonSocial;
    proveedor.direccion = direccion;
    proveedor.distrito = distrito;
    proveedor.provincia = provincia;
    proveedor.departamento = departamento;
    proveedor.UsuarioId = UsuarioId;

    await proveedor.save();

    res.status(200).json(proveedor);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar el proveedor', error });
  }
};

// Eliminar un proveedor por ID
const deleteProveedor = async (req, res) => {
  try {
    const { id } = req.params;
    const proveedor = await Proveedor.findByPk(id);

    if (!proveedor) {
      return res.status(404).json({ message: 'Proveedor no encontrado' });
    }

    await proveedor.destroy();

    res.status(204).json();
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el proveedor', error });
  }
};

// Obtener todos los proveedores
const getAllProveedores = async (req, res) => {
  try {
    const proveedores = await Proveedor.findAll({
      include: Usuario
    });
    res.status(200).json(proveedores);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los proveedores', error });
  }
};

module.exports = {
  createProveedor,
  getProveedorById,
  updateProveedor,
  deleteProveedor,
  getAllProveedores
};
