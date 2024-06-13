const express = require('express');
const router = express.Router();
const detalleCompraController = require('../src/controllers/detalleCompraController');
const authMiddleware = require('../src/middlewares/authMiddleware');

router.get('/', authMiddleware, detalleCompraController.getDetalleCompras);
router.post('/', authMiddleware, detalleCompraController.createDetalleCompra);
router.get('/:id', authMiddleware, detalleCompraController.getDetalleCompraById);
router.put('/:id', authMiddleware, detalleCompraController.updateDetalleCompra);
router.delete('/:id', authMiddleware, detalleCompraController.deleteDetalleCompra);

module.exports = router;
