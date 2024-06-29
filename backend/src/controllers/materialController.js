// controllers/material.controller.js
const Material = require('../models/Material');
const {Op} = require('sequelize');
const Proveedor = require('../models/Proveedor');

// Crear un nuevo material
exports.create = async (req, res) => {
  const { nombre, descripcion, peso, precio_unitario, Proveedor_id_proveedor } = req.body;

  // Verificar que todos los campos obligatorios estén presentes
  if (!nombre || !peso || !precio_unitario || !Proveedor_id_proveedor) {
    return res.status(400).send({ error: 'Todos los campos son obligatorios.' });
  }

  try {
    const material = await Material.create({
      nombre,
      descripcion,
      peso,
      precio_unitario,
      Proveedor_id_proveedor,
    });
    res.status(201).send(material);
  } catch (error) {
    console.error('Error al registrar el material:', error);
    res.status(500).send({ error: 'Error al registrar el material.' });
  }
};

// Obtener todos los materiales
exports.findAll = (req, res) => {
  Material.findAll()
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Ocurrió un error al obtener los Materiales."
      });
    });
};

// Obtener un material por id
exports.findOne = (req, res) => {
  const id = req.params.id;

  Material.findByPk(id)
    .then(data => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `No se encontró el Material con id=${id}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error al obtener el Material con id=" + id
      });
    });
};

// Actualizar un material por id
exports.update = (req, res) => {
  const id = req.params.id;

  Material.update(req.body, {
    where: { id_material: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "El Material fue actualizado exitosamente."
        });
      } else {
        res.send({
          message: `No se puede actualizar el Material con id=${id}. Tal vez el Material no fue encontrado o el cuerpo de la solicitud está vacío.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error al actualizar el Material con id=" + id
      });
    });
};

// Eliminar un material por id
exports.delete = (req, res) => {
  const id = req.params.id;

  Material.destroy({
    where: { id_material: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "El Material fue eliminado exitosamente!"
        });
      } else {
        res.send({
          message: `No se puede eliminar el Material con id=${id}. Tal vez el Material no fue encontrado.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "No se pudo eliminar el Material con id=" + id
      });
    });
};

// Obtener materiales por proveedor
exports.findByProveedor = async (req, res) => {
  try {
    const materiales = await Material.findAll({
      where: { Proveedor_id_proveedor: req.params.proveedorId },
    });
    res.status(200).json(materiales);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los materiales' });
  }
};

// Buscar materiales por nombre
exports.buscarPorNombre = async (req, res) => {
  const { nombre } = req.query;

  if (!nombre) {
    return res.status(400).json({ error: 'Debe proporcionar un nombre para buscar.' });
  }

  console.log(`Buscando materiales con el nombre: ${nombre}`);

  try {
    const materiales = await Material.findAll({
      where: {
        nombre: {
          [Op.like]: `%${nombre}%`,
        },
      },
      include: Proveedor,
    });

    if (materiales.length === 0) {
      return res.status(404).json({ error: 'No se encontraron materiales con ese nombre.' });
    }

    res.status(200).json(materiales);
  } catch (error) {
    console.error('Error al buscar materiales:', error);
    res.status(500).json({ error: 'Error al buscar materiales.' });
  }
};