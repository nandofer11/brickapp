// controllers/authProveedorController.js
const { UsuarioProveedor, Proveedor } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/config');

exports.register = async (req, res) => {
  const { nombre_completo, usuario, contraseña, Proveedor_id_proveedor } = req.body;

  try {
    // Verificar que el proveedor existe
    const proveedor = await Proveedor.findByPk(Proveedor_id_proveedor);

    if (!proveedor) {
      return res.status(400).json({ error: 'Proveedor no encontrado' });
    }

    const hashedPassword = await bcrypt.hash(contraseña, config.BCRYPT_SALT_ROUNDS);
    const newUser = await UsuarioProveedor.create({
      nombre_completo,
      usuario,
      contraseña: hashedPassword,
      Proveedor_id_proveedor
    });

    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error en el registro del usuario proveedor:', error);
    res.status(500).json({ error: 'Error en el registro del usuario proveedor' });
  }
};

exports.login = async (req, res) => {
  const { usuario, contraseña } = req.body;

  if (!usuario || !contraseña) {
    return res.status(400).json({ error: 'Se requieren usuario y contraseña' });
  }

  try {
    const user = await UsuarioProveedor.findOne({ where: { usuario } });
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const isMatch = await bcrypt.compare(contraseña, user.contraseña);
    
    if (!isMatch) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    const token = jwt.sign({ id: user.id_usuario_proveedor }, config.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.json({ token, user: { id: user.id_usuario_proveedor, usuario: user.usuario, nombre_completo: user.nombre_completo } });
  } catch (error) {
    console.error('Error en el inicio de sesión:', error);
    res.status(500).json({ error: 'Error en el inicio de sesión' });
  }
};

// Obtener todos los usuarios proveedores
exports.findAll = (req, res) => {
  UsuarioProveedor.findAll()
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Ocurrió un error al obtener los Usuarios Proveedores."
      });
    });
};

// Obtener un usuario proveedor por id
exports.findOne = (req, res) => {
  const id = req.params.id;

  UsuarioProveedor.findByPk(id)
    .then(data => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `No se encontró el Usuario Proveedor con id=${id}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error al obtener el Usuario Proveedor con id=" + id
      });
    });
};

// Actualizar un usuario proveedor por id
exports.update = (req, res) => {
  const id = req.params.id;

  UsuarioProveedor.update(req.body, {
    where: { id_usuario_proveedor: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "El Usuario Proveedor fue actualizado exitosamente."
        });
      } else {
        res.send({
          message: `No se puede actualizar el Usuario Proveedor con id=${id}. Tal vez el Usuario Proveedor no fue encontrado o el cuerpo de la solicitud está vacío.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error al actualizar el Usuario Proveedor con id=" + id
      });
    });
};

// Eliminar un usuario proveedor por id
exports.delete = (req, res) => {
  const id = req.params.id;

  UsuarioProveedor.destroy({
    where: { id_usuario_proveedor: id }
  }).then(num => {
    if (num == 1) {
      res.send({
        message: "El Usuario Proveedor fue eliminado exitosamente!"
      });
    } else {
      res.send({
        message: `No se puede eliminar el Usuario Proveedor con id=${id}. Tal vez el Usuario Proveedor no fue encontrado`
      });
    }
  })
    .catch(err => {
      res.status(500).send({
        message: "Error al eliminar el Usuario Proveedor con id=" + id
      });

    })
}
