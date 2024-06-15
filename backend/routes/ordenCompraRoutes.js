const express = require('express');
const router = express.Router();
const ordenCompraController  = require('../src/controllers/ordenCompraController');
const authMiddleware = require('../src/middlewares/authMiddleware');

router.get('/', authMiddleware, ordenCompraController.findAll);
router.post('/', authMiddleware, ordenCompraController.create);
router.get('/:id', authMiddleware, ordenCompraController.findOne);
router.put('/:id', authMiddleware, ordenCompraController.update);
router.delete('/:id', authMiddleware, ordenCompraController.delete);

module.exports = router;
