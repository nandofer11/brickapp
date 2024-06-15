const express = require('express');
const router = express.Router();
const authProveedorController = require('../src/controllers/authProveedorController');
const authProveedorMiddleware = require('../src/middlewares/authProveedorMiddleware');


router.post("/register", authProveedorController.register)
router.post("/login", authProveedorController.login);
router.get("/", authProveedorMiddleware, authProveedorController.findAll);
router.get("/:id", authProveedorMiddleware, authProveedorController.findOne);  // Obtener un usuario proveedor por id

 // Actualizar un usuario proveedor por id
 router.put("/:id", authProveedorMiddleware,  authProveedorController.update);

 // Eliminar un usuario proveedor por id
 router.delete("/:id", authProveedorMiddleware, authProveedorController.delete);

 module.exports = router;