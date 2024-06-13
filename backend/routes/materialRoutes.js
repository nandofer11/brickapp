const express = require('express');
const router = express.Router();
const materialController = require('../src/controllers/materialController');
const authMiddleware = require('../src/middlewares/authMiddleware');

router.post('/', authMiddleware, materialController.createMaterial);
router.get('/', authMiddleware, materialController.getMaterials);
router.get('/:id', authMiddleware, materialController.getMaterialById);
router.put('/:id', authMiddleware, materialController.updateMaterial);
router.delete('/:id', authMiddleware, materialController.deleteMaterial);

module.exports = router;
