// controllers/proveedor.controller.js
const Proveedor = require('../models/Proveedor');

// Crear un nuevo proveedor
exports.create = (req, res) => {
  if (!req.body.ruc) {
    res.status(400).send({ message: "El contenido no puede estar vacío!" });
    return;
  }

  const proveedor = {
    ruc: req.body.ruc,
    razon_social: req.body.razon_social,
    direccion: req.body.direccion,
    distrito: req.body.distrito,
    provincia: req.body.provincia,
    departamento: req.body.departamento
  };

  Proveedor.create(proveedor)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Ocurrió un error al crear el Proveedor."
      });
    });
};

// Obtener todos los proveedores
exports.findAll = (req, res) => {
  Proveedor.findAll()
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Ocurrió un error al obtener los Proveedores."
      });
    });
};

// Obtener un proveedor por id
exports.findOne = async (req, res) => {
  try {
    const proveedor = await Proveedor.findByPk(req.params.id);
    if (proveedor) {
      res.status(200).json(proveedor);
    } else {
      res.status(404).json({ error: 'Proveedor no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el proveedor' });
  }
};

// Actualizar un proveedor por id
exports.update = (req, res) => {
  const id = req.params.id;

  Proveedor.update(req.body, {
    where: { id_proveedor: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "El Proveedor fue actualizado exitosamente."
        });
      } else {
        res.send({
          message: `No se puede actualizar el Proveedor con id=${id}. Tal vez el Proveedor no fue encontrado o el cuerpo de la solicitud está vacío.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error al actualizar el Proveedor con id=" + id
      });
    });
};

// Eliminar un proveedor por id
exports.delete = (req, res) => {
  const id = req.params.id;

  Proveedor.destroy({
    where: { id_proveedor: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "El Proveedor fue eliminado exitosamente!"
        });
      } else {
        res.send({
          message: `No se puede eliminar el Proveedor con id=${id}. Tal vez el Proveedor no fue encontrado.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "No se pudo eliminar el Proveedor con id=" + id
      });
    });
};
