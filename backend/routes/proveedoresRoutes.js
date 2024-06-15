const express = require('express');
const router = express.Router();
const proveedorController = require('../src/controllers/proveedorController');

// Listar todos los proveedores
router.get('/', proveedorController.findAll);

// Crear un proveedor
router.post('/', proveedorController.create);

// Obtener un proveedor por ID
router.get('/:id', proveedorController.findOne);

// Actualizar un proveedor por ID
router.put('/:id', proveedorController.update);

// Eliminar un proveedor por ID
router.delete('/:id',proveedorController.delete);

module.exports = router;
