// controllers/orden_compra.controller.js
const OrdenCompra = require('../models/OrdenCompra');

// Crear una nueva orden de compra
exports.create = (req, res) => {
  if (!req.body.fecha_compra) {
    res.status(400).send({ message: "El contenido no puede estar vacío!" });
    return;
  }

  const ordenCompra = {
    fecha_compra: req.body.fecha_compra,
    fecha_entrega: req.body.fecha_entrega,
    estado: req.body.estado,
    forma_pago: req.body.forma_pago,
    Empresa_id_empresa: req.body.Empresa_id_empresa,
    Proveedor_id_proveedor: req.body.Proveedor_id_proveedor
  };

  OrdenCompra.create(ordenCompra)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Ocurrió un error al crear la Orden de Compra."
      });
    });
};

// Obtener todas las órdenes de compra
exports.findAll = (req, res) => {
  OrdenCompra.findAll()
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Ocurrió un error al obtener las Órdenes de Compra."
      });
    });
};

// Obtener una orden de compra por id
exports.findOne = (req, res) => {
  const id = req.params.id;

  OrdenCompra.findByPk(id)
    .then(data => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `No se encontró la Orden de Compra con id=${id}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error al obtener la Orden de Compra con id=" + id
      });
    });
};

// Actualizar una orden de compra por id
exports.update = (req, res) => {
  const id = req.params.id;

  OrdenCompra.update(req.body, {
    where: { id_orden_compra: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "La Orden de Compra fue actualizada exitosamente."
        });
      } else {
        res.send({
          message: `No se puede actualizar la Orden de Compra con id=${id}. Tal vez la Orden de Compra no fue encontrada o el cuerpo de la solicitud está vacío.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error al actualizar la Orden de Compra con id=" + id
      });
    });
};

// Eliminar una orden de compra por id
exports.delete = (req, res) => {
  const id = req.params.id;

  OrdenCompra.destroy({
    where: { id_orden_compra: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "La Orden de Compra fue eliminada exitosamente!"
        });
      } else {
        res.send({
          message: `No se puede eliminar la Orden de Compra con id=${id}. Tal vez la Orden de Compra no fue encontrada.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "No se pudo eliminar la Orden de Compra con id=" + id
      });
    });
};
