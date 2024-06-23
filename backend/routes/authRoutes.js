const express = require('express');
const router = express.Router();
const authController = require('../src/controllers/authController');
const authMiddleware = require('../src/middlewares/authMiddleware');

// Definir rutas
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/', authMiddleware, authController.findAll);
router.get('/:id', authController.findOne);
router.put('/:id', authMiddleware, authController.update);
router.delete('/:id', authMiddleware, authController.delete);

module.exports = router;
