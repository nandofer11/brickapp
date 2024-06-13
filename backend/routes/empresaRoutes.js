const express = require('express');
const router = express.Router();
const empresaController = require('../src/controllers/empresaController');
const authMiddleware = require('../src/middlewares/authMiddleware');

router.get('/', authMiddleware, empresaController.getEmpresas);
router.post('/', authMiddleware, empresaController.createEmpresa);
router.get('/:id', authMiddleware, empresaController.getEmpresaById);
router.put('/:id', authMiddleware, empresaController.updateEmpresa);
router.delete('/:id', authMiddleware, empresaController.deleteEmpresa);

module.exports = router;
