// controllers/orden_compra_material.controller.js
const OrdenCompraMaterial = require('../models/OrdenCompraMaterial');

// Crear una nueva relación orden de compra - material
exports.create = (req, res) => {
  if (!req.body.cantidad || !req.body.subtotal) {
    res.status(400).send({ message: "El contenido no puede estar vacío!" });
    return;
  }

  const ordenCompraMaterial = {
    cantidad: req.body.cantidad,
    subtotal: req.body.subtotal,
    Orden_Compra_id_orden_compra: req.body.Orden_Compra_id_orden_compra,
    Material_id_material: req.body.Material_id_material
  };

  OrdenCompraMaterial.create(ordenCompraMaterial)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Ocurrió un error al crear la relación Orden de Compra - Material."
      });
    });
};

// Obtener todas las relaciones orden de compra - material
exports.findAll = (req, res) => {
  OrdenCompraMaterial.findAll()
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Ocurrió un error al obtener las relaciones Orden de Compra - Material."
      });
    });
};

// Obtener una relación orden de compra - material por id
exports.findOne = (req, res) => {
  const id = req.params.id;

  OrdenCompraMaterial.findByPk(id)
    .then(data => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `No se encontró la relación Orden de Compra - Material con id=${id}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error al obtener la relación Orden de Compra - Material con id=" + id
      });
    });
};

// Actualizar una relación orden de compra - material por id
exports.update = (req, res) => {
  const id = req.params.id;

  OrdenCompraMaterial.update(req.body, {
    where: { id_orden_compra_material: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "La relación Orden de Compra - Material fue actualizada exitosamente."
        });
      } else {
        res.send({
          message: `No se puede actualizar la relación Orden de Compra - Material con id=${id}. Tal vez la relación Orden de Compra - Material no fue encontrada o el cuerpo de la solicitud está vacío.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error al actualizar la relación Orden de Compra - Material con id=" + id
      });
    });
};

// Eliminar una relación orden de compra - material por id
exports.delete = (req, res) => {
  const id = req.params.id;

  OrdenCompraMaterial.destroy({
    where: { id_orden_compra_material: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "La relación Orden de Compra - Material fue eliminada exitosamente!"
        });
      } else {
        res.send({
          message: `No se puede eliminar la relación Orden de Compra - Material con id=${id}. Tal vez la relación Orden de Compra - Material no fue encontrada.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "No se pudo eliminar la relación Orden de Compra - Material con id=" + id
      });
    });
};
