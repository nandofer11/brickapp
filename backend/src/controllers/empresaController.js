// controllers/empresa.controller.js
const Empresa = require('../models/Empresa');

// Crear una nueva empresa
exports.create = (req, res) => {
  if (!req.body.ruc) {
    res.status(400).send({ message: "El contenido no puede estar vacío!" });
    return;
  }

  const empresa = {
    ruc: req.body.ruc,
    nombre_comercial: req.body.nombre_comercial,
    direccion: req.body.direccion,
    telefono: req.body.telefono,
    email: req.body.email,
    web: req.body.web,
    distrito: req.body.distrito,
    provincia: req.body.provincia,
    departamento: req.body.departamento
  };

  Empresa.create(empresa)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Ocurrió un error al crear la Empresa."
      });
    });
};

// Obtener todas las empresas
exports.findAll = (req, res) => {
  Empresa.findAll()
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Ocurrió un error al obtener las Empresas."
      });
    });
};

// Obtener una empresa por id
exports.findOne = (req, res) => {
  const id = req.params.id;

  Empresa.findByPk(id)
    .then(data => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `No se encontró la Empresa con id=${id}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error al obtener la Empresa con id=" + id
      });
    });
};

// Actualizar una empresa por id
exports.update = (req, res) => {
  const id = req.params.id;

  Empresa.update(req.body, {
    where: { id_empresa: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "La Empresa fue actualizada exitosamente."
        });
      } else {
        res.send({
          message: `No se puede actualizar la Empresa con id=${id}. Tal vez la Empresa no fue encontrada o el cuerpo de la solicitud está vacío.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error al actualizar la Empresa con id=" + id
      });
    });
};

// Eliminar una empresa por id
exports.delete = (req, res) => {
  const id = req.params.id;

  Empresa.destroy({
    where: { id_empresa: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "La Empresa fue eliminada exitosamente!"
        });
      } else {
        res.send({
          message: `No se puede eliminar la Empresa con id=${id}. Tal vez la Empresa no fue encontrada.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "No se pudo eliminar la Empresa con id=" + id
      });
    });
};
