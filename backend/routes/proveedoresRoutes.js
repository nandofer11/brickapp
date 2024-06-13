const express = require('express');
const router = express.Router();
const proveedorController = require('../src/controllers/proveedorController');
const authMiddleware = require('../src/middlewares/authMiddleware');

// Listar todos los proveedores
router.get('/', authMiddleware, proveedorController.getAllProveedores);

// Crear un proveedor
router.post('/', authMiddleware, proveedorController.createProveedor);

// Obtener un proveedor por ID
router.get('/:id', authMiddleware, proveedorController.getProveedorById);

// Actualizar un proveedor por ID
router.put('/:id', authMiddleware, proveedorController.updateProveedor);

// Eliminar un proveedor por ID
router.delete('/:id', authMiddleware, proveedorController.deleteProveedor);

module.exports = router;
