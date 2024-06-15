const express = require('express');
const router = express.Router();
const ordenCompraMaterialController = require('../src/controllers/ordenCompraMaterialController');
const authMiddleware = require('../src/middlewares/authMiddleware');

router.get('/', authMiddleware, ordenCompraMaterialController.findAll);
router.post('/', authMiddleware, ordenCompraMaterialController.create);
router.get('/:id', authMiddleware, ordenCompraMaterialController.findOne);
router.put('/:id', authMiddleware, ordenCompraMaterialController.update);
router.delete('/:id', authMiddleware, ordenCompraMaterialController.delete);

module.exports = router;
