const express = require('express');
const router = express.Router();
const pedidoController  = require('../src/controllers/pedidoController');
const authMiddleware = require('../src/middlewares/authMiddleware');

router.get('/', authMiddleware, pedidoController.findAll);
router.post('/', authMiddleware, pedidoController.create);
router.get('/:id', authMiddleware, pedidoController.findOne);
router.put('/:id', authMiddleware, pedidoController.update);
router.delete('/:id', authMiddleware, pedidoController.delete);

module.exports = router;
