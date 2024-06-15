// controllers/rol.controller.js
const Rol = require('../models/Rol');

// Crear un nuevo rol
exports.create = (req, res) => {
  if (!req.body.nombre) {
    res.status(400).send({ message: "El contenido no puede estar vacío!" });
    return;
  }

  const rol = {
    nombre: req.body.nombre,
    descripcion: req.body.descripcion
  };

  Rol.create(rol)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Ocurrió un error al crear el Rol."
      });
    });
};

// Obtener todos los roles
exports.findAll = (req, res) => {
  Rol.findAll()
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Ocurrió un error al obtener los Roles."
      });
    });
};

// Obtener un rol por id
exports.findOne = (req, res) => {
  const id = req.params.id;

  Rol.findByPk(id)
    .then(data => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `No se encontró el Rol con id=${id}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error al obtener el Rol con id=" + id
      });
    });
};

// Actualizar un rol por id
exports.update = (req, res) => {
  const id = req.params.id;

  Rol.update(req.body, {
    where: { id_rol: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "El Rol fue actualizado exitosamente."
        });
      } else {
        res.send({
          message: `No se puede actualizar el Rol con id=${id}. Tal vez el Rol no fue encontrado o el cuerpo de la solicitud está vacío.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error al actualizar el Rol con id=" + id
      });
    });
};

// Eliminar un rol por id
exports.delete = (req, res) => {
  const id = req.params.id;

  Rol.destroy({
    where: { id_rol: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "El Rol fue eliminado exitosamente!"
        });
      } else {
        res.send({
          message: `No se puede eliminar el Rol con id=${id}. Tal vez el Rol no fue encontrado.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "No se pudo eliminar el Rol con id=" + id
      });
    });
};
