// controllers/authController.js
const Usuario = require('../models/Usuario.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/config');

const Empresa = require('../models/Empresa.js');
const Rol = require('../models/Rol.js');

exports.register = async (req, res) => {
  const { nombre_completo, usuario, contraseña, Empresa_id_empresa, Rol_id_rol } = req.body;

  try {
    // Verificar que la empresa y el rol existen
    const empresa = await Empresa.findByPk(Empresa_id_empresa);
    const rol = await Rol.findByPk(Rol_id_rol);

    if (!empresa) {
      return res.status(400).json({ error: 'Empresa no encontrada' });
    }

    if (!rol) {
      return res.status(400).json({ error: 'Rol no encontrado' });
    }

    const hashedPassword = await bcrypt.hash(contraseña, config.BCRYPT_SALT_ROUNDS);
    const newUser = await Usuario.create({
      nombre_completo,
      usuario,
      contraseña: hashedPassword,
      Empresa_id_empresa,
      Rol_id_rol
    });

    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error en el registro del usuario:', error);
    res.status(500).json({ error: 'Error en el registro del usuario' });
  }
};
exports.login = async (req, res) => {
  const { usuario, contraseña } = req.body;

  if (!usuario || !contraseña) {
    return res.status(400).json({ error: 'Se requieren usuario y contraseña' });
  }

  try {
    const user = await Usuario.findOne({ where: { usuario } });
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const isMatch = await bcrypt.compare(contraseña, user.contraseña);
    
    if (!isMatch) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    const token = jwt.sign({ id: user.id_usuario }, config.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.json({ token, user: { id: user.id_usuario, usuario: user.usuario, nombre_completo: user.nombre_completo } });
  } catch (error) {
    console.error('Error en el inicio de sesión:', error);
    res.status(500).json({ error: 'Error en el inicio de sesión' });
  }
};

// Obtener todos los usuarios
exports.findAll = (req, res) => {
  Usuario.findAll()
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Ocurrió un error al obtener los Usuarios."
      });
    });
};

// Obtener un usuario por id
exports.findOne = (req, res) => {
  const id = req.params.id;

  Usuario.findByPk(id)
    .then(data => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `No se encontró el Usuario con id=${id}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error al obtener el Usuario con id=" + id
      });
    });
};

// Actualizar un usuario por id
exports.update = (req, res) => {
  const id = req.params.id;

  Usuario.update(req.body, {
    where: { id_usuario: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "El Usuario fue actualizado exitosamente."
        });
      } else {
        res.send({
          message: `No se puede actualizar el Usuario con id=${id}. Tal vez el Usuario no fue encontrado o el cuerpo de la solicitud está vacío.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error al actualizar el Usuario con id=" + id
      });
    });
};

// Eliminar un usuario por id
exports.delete = (req, res) => {
  const id = req.params.id;

  Usuario.destroy({
    where: { id_usuario: id }
  }).then(num => {
    if (num == 1) {
      res.send({
        message: "El Usuario fue eliminado exitosamente!"
      });
    } else {
      res.send({
        message: `No se puede eliminar el Usuario con id=${id}. Tal vez el Usuario no fue encontrado`
      });
    }
  })
    .catch(err => {
      res.status(500).send({
        message: "Error al eliminar el Usuario con id=" + id
      });

    })
}