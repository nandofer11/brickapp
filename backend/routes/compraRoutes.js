const express = require('express');
const router = express.Router();
const compraController = require('../src/controllers/compraController');
const authMiddleware = require('../src/middlewares/authMiddleware');

router.get('/', authMiddleware, compraController.getCompras);
router.post('/', authMiddleware, compraController.createCompra);
router.get('/:id', authMiddleware, compraController.getCompraById);
router.put('/:id', authMiddleware, compraController.updateCompra);
router.delete('/:id', authMiddleware, compraController.deleteCompra);

module.exports = router;
