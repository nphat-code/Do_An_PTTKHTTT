const express = require('express');
const router = express.Router();
const roleController = require('../controllers/role.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');


router.get('/', verifyToken, roleController.getAllRoles);
router.post('/', verifyToken, isAdmin, roleController.createRole);
router.put('/:id', verifyToken, isAdmin, roleController.updateRole);
router.delete('/:id', verifyToken, isAdmin, roleController.deleteRole);

// Permission endpoints
router.get('/permissions', verifyToken, isAdmin, roleController.getAllPermissions);
router.get('/:id/permissions', verifyToken, isAdmin, roleController.getRolePermissions);
router.post('/:id/permissions', verifyToken, isAdmin, roleController.updateRolePermissions);

module.exports = router;
