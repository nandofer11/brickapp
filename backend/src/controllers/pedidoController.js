// controllers/orden_compra.controller.js
const Pedido = require('../models/Pedido');

// Crear un nuevo pedido
exports.create = (req, res) => {
  if (!req.body.fecha_pedido) {
    res.status(400).send({ message: "El contenido no puede estar vacío!" });
    return;
  }

  const pedido = {
    fecha_pedido: req.body.fecha_pedido,
    fecha_entrega: req.body.fecha_entrega,
    forma_pago: req.body.forma_pago,
    estado: req.body.estado,
    Usuario_id_usuario: req.body.Usuario_id_usuario,
    Proveedor_id_proveedor: req.body.Proveedor_id_proveedor
  };

  console.log(pedido);

  Pedido.create(pedido)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Ocurrió un error al crear el Pedido."
      });
    });
};

// Obtener todos los pedidos
exports.findAll = (req, res) => {
  Pedido.findAll()
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Ocurrió un error al obtener los pedidos."
      });
    });
};

// Obtener un pedido pora su id 
exports.findOne = (req, res) => {
  const id = req.params.id;

  Pedido.findByPk(id)
    .then(data => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `No se encontró Pedido con id=${id}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error al obtener el Pedido con id=" + id
      });
    });
};

// Actualizar un pedido por id
exports.update = (req, res) => {
  const id = req.params.id;

  Pedido.update(req.body, {
    where: { id_pedido: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "El Pedido fue actualizado exitosamente."
        });
      } else {
        res.send({
          message: `No se puede actualizar el Pedido con id=${id}. Tal vez el pedido no fue encontrada o el cuerpo de la solicitud está vacío.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error al actualizar el Pedido con id=" + id
      });
    });
};

// Eliminar un Pedido por id
exports.delete = (req, res) => {
  const id = req.params.id;

  Pedido.destroy({
    where: { id_pedido: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "El pedido fue eliminado exitosamente!"
        });
      } else {
        res.send({
          message: `No se puede eliminar el pedido con id=${id}. Tal vez el Pedido no fue encontrado.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "No se pudo eliminar el Pedido con id=" + id
      });
    });
};
