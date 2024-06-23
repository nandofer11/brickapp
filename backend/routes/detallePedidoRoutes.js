const express = require('express');
const router = express.Router();
const detallePedidoController = require('../src/controllers/detallePedidoController');
const authMiddleware = require('../src/middlewares/authMiddleware');

router.get('/', authMiddleware, detallePedidoController.findAll);
router.post('/', authMiddleware, detallePedidoController.create);
router.get('/:id', authMiddleware, detallePedidoController.findOne);
router.put('/:id', authMiddleware, detallePedidoController.update);
router.delete('/:id', authMiddleware, detallePedidoController.delete);

module.exports = router;
