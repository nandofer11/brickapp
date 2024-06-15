const express = require('express');
const router = express.Router();
const rolController = require('../src/controllers/rolController');
const authMiddleware = require('../src/middlewares/authMiddleware');

router.get('/', authMiddleware, rolController.findAll);
router.post('/', authMiddleware, rolController.create);
router.get('/:id', authMiddleware, rolController.findOne);
router.put('/:id', authMiddleware, rolController.update);
router.delete('/:id', authMiddleware, rolController.delete);

module.exports = router;