// controllers/material.controller.js
const Material = require('../models/Material');

// Crear un nuevo material
exports.create = (req, res) => {
  if (!req.body.nombre) {
    res.status(400).send({ message: "El contenido no puede estar vacío!" });
    return;
  }

  const material = {
    nombre: req.body.nombre,
    descripcion: req.body.descripcion,
    peso: req.body.peso,
    precio_unitario: req.body.precio_unitario,
    Proveedor_id_proveedor: req.body.Proveedor_id_proveedor
  };

  Material.create(material)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Ocurrió un error al crear el Material."
      });
    });
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
