const router = require('express').Router();
const ctrl = require('../controllers/tasks.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/permission.middleware');

router.get('/mine', requireAuth, ctrl.mine);
router.get('/', requireAuth, requirePermission('task:manage'), ctrl.list);
router.post('/', requireAuth, requirePermission('task:manage'), ctrl.create);
router.patch('/:taskId/assignments/:userId/complete', requireAuth, ctrl.markComplete);
router.patch('/:taskId/assignments/:userId/verify', requireAuth, requirePermission('task:manage'), ctrl.verify);

module.exports = router;
