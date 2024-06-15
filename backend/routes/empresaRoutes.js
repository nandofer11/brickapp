const express = require('express');
const router = express.Router();
const empresaController = require('../src/controllers/empresaController');

router.get('/', empresaController.findAll);
router.post('/', empresaController.create);
router.get('/:id', empresaController.findOne);
router.put('/:id', empresaController.update);
router.delete('/:id', empresaController.delete);

module.exports = router;
