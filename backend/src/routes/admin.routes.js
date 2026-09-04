const router = require('express').Router();
const ctrl = require('../controllers/admin.controller');
const auditLogCtrl = require('../controllers/auditlog.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');

// Everything here is ADMIN-only: user role changes and permission grants
// are the most sensitive actions in the system, so no servant permission
// can substitute for the ADMIN role check on these routes.
router.use(requireAuth, requireRole('ADMIN'));

router.get('/dashboard', ctrl.dashboardStats);
router.get('/audit-log', auditLogCtrl.list);
router.get('/users', ctrl.listUsers);
router.delete('/users/:id', ctrl.deleteUser);
router.patch('/users/:id/role', ctrl.setRole);
router.get('/permissions', ctrl.listPermissions);
router.get('/users/:id/permissions', ctrl.getUserPermissions);
router.post('/users/:id/permissions', ctrl.grantPermission);
router.delete('/users/:id/permissions/:grantId', ctrl.revokePermission);

module.exports = router;
