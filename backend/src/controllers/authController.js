const Usuario = require('../models/Usuario.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/config');

exports.register = async (req, res) => {
  const { nombreCompleto, usuario, contraseña, tipoUsuario } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(contraseña, config.BCRYPT_SALT_ROUNDS);
    const newUser = await Usuario.create({
      nombreCompleto,
      usuario,
      contraseña: hashedPassword,
      tipoUsuario,
    });

    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: 'Error en el registro del usuario' });
  }
};

exports.login = async (req, res) => {
  const { usuario, contraseña } = req.body;

  // Validar que los campos no estén vacíos
  if (!usuario || !contraseña) {
    return res.status(400).json({ error: 'Se requieren usuario y contraseña' });
  }

  try {
    // Intentar encontrar el usuario por nombre de usuario
    const user = await Usuario.findOne({ where: { usuario } });
    
    // Si no se encuentra el usuario, retornar un error
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Comparar la contraseña ingresada con la contraseña almacenada
    const isMatch = await bcrypt.compare(contraseña, user.contraseña);
    
    // Si las contraseñas no coinciden, retornar un error
    if (!isMatch) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    // Crear el token JWT
    const token = jwt.sign({ id: user.idUsuario, tipoUsuario: user.tipoUsuario }, config.JWT_SECRET, {
      expiresIn: '1h',
    });

    // Retornar el token y los datos del usuario
    res.json({ token, user: { id: user.idUsuario, usuario: user.usuario, tipoUsuario: user.tipoUsuario } });
  } catch (error) {
    // Manejar errores
    console.error('Error en el inicio de sesión:', error);
    res.status(500).json({ error: 'Error en el inicio de sesión' });
  }
};