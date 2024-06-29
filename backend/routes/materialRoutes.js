const express = require('express');
const router = express.Router();
const materialController = require('../src/controllers/materialController');
const authMiddleware = require('../src/middlewares/authMiddleware');

router.post('/', authMiddleware, materialController.create);
router.get('/', authMiddleware, materialController.findAll);
//Obtener materiales por nombre
router.get('/nombre', materialController.buscarPorNombre);

router.get('/:id', authMiddleware, materialController.findOne);
router.put('/:id', authMiddleware, materialController.update);
router.delete('/:id', authMiddleware, materialController.delete);

// Obtener materiales por proveedor
router.get('/proveedor/:proveedorId', materialController.findByProveedor);



module.exports = router;
